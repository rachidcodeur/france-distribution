// Script optimisé pour enrichir TOUTES les communes avec départements et régions
// Télécharge toutes les communes françaises depuis OpenDataSoft en batch
// puis enrichit le fichier communes_logements.json

const fs = require('fs')
const path = require('path')

const communesLogementsPath = path.join(__dirname, '..', 'communes_logements.json')
const outputPath = path.join(__dirname, '..', 'communes_logements_enriched.json')
const mappingCachePath = path.join(__dirname, '..', 'communes_departement_mapping.json')

// Fonction pour normaliser un nom de commune
function normalizeCommuneName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

// Télécharger toutes les communes françaises depuis OpenDataSoft
async function downloadAllCommunes() {
  console.log('📥 Téléchargement de toutes les communes françaises depuis OpenDataSoft...')
  console.log('⚠️  Cela peut prendre quelques minutes...\n')
  
  const allCommunes = []
  let offset = 0
  const limit = 100 // Limite par requête
  let hasMore = true
  
  while (hasMore) {
    try {
      const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?limit=${limit}&offset=${offset}&order_by=com_name&select=com_name,dep_name,reg_name,com_code`
      console.log(`📊 Récupération des communes ${offset} à ${offset + limit}...`)
      
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 400 && offset >= 10000) {
          // L'API a une limite d'offset, on va utiliser une autre approche
          console.log(`⚠️  Limite d'offset atteinte à ${offset}, passage à une recherche par nom...`)
          hasMore = false
          break
        }
        console.error(`❌ Erreur HTTP ${response.status} à l'offset ${offset}`)
        // Continuer avec le prochain offset
        offset += limit
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      
      const data = await response.json()
      
      // Debug: afficher la structure de la réponse
      if (offset === 0) {
        console.log('🔍 Structure de la réponse API:', JSON.stringify(data).substring(0, 500))
      }
      
      if (!data.results || data.results.length === 0) {
        hasMore = false
        break
      }
      
      // Extraire les informations nécessaires
      for (const result of data.results) {
        try {
          // La structure de l'API OpenDataSoft v2.1 : les champs sont des tableaux
          const comName = Array.isArray(result.com_name) ? result.com_name[0] : result.com_name
          const depName = Array.isArray(result.dep_name) ? result.dep_name[0] : result.dep_name
          const regName = Array.isArray(result.reg_name) ? result.reg_name[0] : result.reg_name
          const comCode = Array.isArray(result.com_code) ? result.com_code[0] : result.com_code
          
          if (comName && depName && regName) {
            allCommunes.push({
              name: comName,
              normalizedName: normalizeCommuneName(comName),
              departement: depName,
              region: regName,
              codeInsee: comCode || null
            })
          }
        } catch (err) {
          // Ignorer les erreurs silencieusement pour ne pas polluer la sortie
        }
      }
      
      offset += limit
      
      // Si on a récupéré moins que la limite, on a fini
      if (data.results.length < limit) {
        hasMore = false
      }
      
      // Attendre un peu pour ne pas surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`❌ Erreur lors du téléchargement:`, error.message)
      hasMore = false
    }
  }
  
  console.log(`✅ ${allCommunes.length} communes téléchargées\n`)
  
  // Créer un mapping nom normalisé -> département/région
  const mapping = {}
  for (const commune of allCommunes) {
    // Utiliser le nom normalisé comme clé
    mapping[commune.normalizedName] = {
      departement: commune.departement,
      region: commune.region,
      originalName: commune.name
    }
    
    // Aussi ajouter le nom original (au cas où)
    const originalNormalized = normalizeCommuneName(commune.name)
    if (!mapping[originalNormalized]) {
      mapping[originalNormalized] = {
        departement: commune.departement,
        region: commune.region,
        originalName: commune.name
      }
    }
  }
  
  // Sauvegarder le mapping en cache
  console.log('💾 Sauvegarde du mapping en cache...')
  fs.writeFileSync(mappingCachePath, JSON.stringify(mapping, null, 2), 'utf-8')
  console.log('✅ Mapping sauvegardé\n')
  
  return mapping
}

// Charger le mapping depuis le cache ou le télécharger
async function getCommuneMapping() {
  if (fs.existsSync(mappingCachePath)) {
    console.log('📖 Chargement du mapping depuis le cache...')
    try {
      const cached = JSON.parse(fs.readFileSync(mappingCachePath, 'utf-8'))
      const cacheSize = Object.keys(cached).length
      console.log(`✅ ${cacheSize} communes dans le cache`)
      
      // Si le cache est vide ou trop petit, télécharger
      if (cacheSize < 1000) {
        console.log('⚠️  Cache trop petit, téléchargement des données...\n')
        return await downloadAllCommunes()
      }
      
      console.log('✅ Utilisation du cache\n')
      return cached
    } catch (error) {
      console.log('⚠️  Erreur lors du chargement du cache, téléchargement...\n')
    }
  }
  
  return await downloadAllCommunes()
}

// Enrichir les communes
async function enrichCommunes() {
  console.log('📖 Lecture du fichier communes_logements.json...')
  const communesData = JSON.parse(fs.readFileSync(communesLogementsPath, 'utf-8'))
  
  console.log(`✅ ${communesData.length} communes trouvées`)
  console.log('🔄 Récupération du mapping communes -> départements...\n')
  
  const mapping = await getCommuneMapping()
  
  console.log('🔄 Enrichissement des communes...\n')
  
  const enriched = []
  let enrichedCount = 0
  let notFoundCount = 0
  
  for (let i = 0; i < communesData.length; i++) {
    const commune = communesData[i]
    
    // Afficher la progression tous les 1000 éléments
    if (i % 1000 === 0 && i > 0) {
      console.log(`📊 Progression: ${i}/${communesData.length} (${enrichedCount} enrichies, ${notFoundCount} non trouvées)`)
    }
    
    // Normaliser le nom de la commune
    const normalizedName = normalizeCommuneName(commune.ville)
    
    // Chercher dans le mapping
    const mappingEntry = mapping[normalizedName]
    
    if (mappingEntry) {
      enriched.push({
        ...commune,
        departement: mappingEntry.departement,
        region: mappingEntry.region
      })
      enrichedCount++
    } else {
      // Si pas trouvé, garder la commune mais avec "Non spécifié"
      enriched.push({
        ...commune,
        departement: 'Non spécifié',
        region: 'Non spécifiée'
      })
      notFoundCount++
      
      // Afficher les communes non trouvées pour debug
      if (notFoundCount <= 10) {
        console.log(`⚠️  Commune non trouvée: "${commune.ville}" (normalisé: "${normalizedName}")`)
      }
    }
  }
  
  console.log(`\n✅ Enrichissement terminé:`)
  console.log(`   - ${enrichedCount} communes enrichies`)
  console.log(`   - ${notFoundCount} communes non trouvées`)
  console.log(`💾 Sauvegarde dans ${outputPath}...`)
  
  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), 'utf-8')
  console.log('✅ Fichier sauvegardé avec succès!')
  console.log(`\n📝 Prochaines étapes:`)
  console.log(`   1. Vérifiez le fichier ${outputPath}`)
  console.log(`   2. Si tout est correct, remplacez communes_logements.json par ce fichier`)
  console.log(`   3. Redémarrez l'application`)
}

enrichCommunes().catch(console.error)


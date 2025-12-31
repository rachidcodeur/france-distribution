// Script optimisé v3 pour enrichir TOUTES les communes avec départements et régions
// Télécharge les communes par nom de département

const fs = require('fs')
const path = require('path')

const communesLogementsPath = path.join(__dirname, '..', 'communes_logements.json')
const outputPath = path.join(__dirname, '..', 'communes_logements_enriched.json')
const mappingCachePath = path.join(__dirname, '..', 'communes_departement_mapping.json')

// Liste des départements français avec leurs noms
const departements = [
  'Ain', 'Aisne', 'Allier', 'Alpes-de-Haute-Provence', 'Hautes-Alpes', 'Alpes-Maritimes',
  'Ardèche', 'Ardennes', 'Ariège', 'Aube', 'Aude', 'Aveyron',
  'Bouches-du-Rhône', 'Calvados', 'Cantal', 'Charente', 'Charente-Maritime', 'Cher',
  'Corrèze', 'Corse-du-Sud', 'Haute-Corse', 'Côte-d\'Or', 'Côtes-d\'Armor', 'Creuse',
  'Dordogne', 'Doubs', 'Drôme', 'Eure', 'Eure-et-Loir', 'Finistère',
  'Gard', 'Haute-Garonne', 'Gers', 'Gironde', 'Hérault', 'Ille-et-Vilaine',
  'Indre', 'Indre-et-Loire', 'Isère', 'Jura', 'Landes', 'Loir-et-Cher',
  'Loire', 'Haute-Loire', 'Loire-Atlantique', 'Loiret', 'Lot', 'Lot-et-Garonne',
  'Lozère', 'Maine-et-Loire', 'Manche', 'Marne', 'Haute-Marne', 'Mayenne',
  'Meurthe-et-Moselle', 'Meuse', 'Morbihan', 'Moselle', 'Nièvre', 'Nord',
  'Oise', 'Orne', 'Pas-de-Calais', 'Puy-de-Dôme', 'Pyrénées-Atlantiques', 'Hautes-Pyrénées',
  'Pyrénées-Orientales', 'Bas-Rhin', 'Haut-Rhin', 'Rhône', 'Haute-Saône', 'Saône-et-Loire',
  'Sarthe', 'Savoie', 'Haute-Savoie', 'Paris', 'Seine-Maritime', 'Seine-et-Marne',
  'Yvelines', 'Deux-Sèvres', 'Somme', 'Tarn', 'Tarn-et-Garonne', 'Var',
  'Vaucluse', 'Vendée', 'Vienne', 'Haute-Vienne', 'Vosges', 'Yonne',
  'Territoire de Belfort', 'Essonne', 'Hauts-de-Seine', 'Seine-Saint-Denis', 'Val-de-Marne', 'Val-d\'Oise'
]

// Fonction pour normaliser un nom de commune
function normalizeCommuneName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

// Télécharger toutes les communes par département
async function downloadAllCommunesByDepartment() {
  console.log('📥 Téléchargement de toutes les communes françaises par département...')
  console.log('⚠️  Cela peut prendre 10-15 minutes...\n')
  
  const allCommunes = []
  
  for (let i = 0; i < departements.length; i++) {
    const deptName = departements[i]
    console.log(`📊 Téléchargement du département ${deptName} (${i + 1}/${departements.length})...`)
    
    let offset = 0
    const limit = 100
    let hasMore = true
    let deptCount = 0
    
    while (hasMore) {
      try {
        // Filtrer par nom de département
        const encodedDept = encodeURIComponent(deptName)
        const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?limit=${limit}&offset=${offset}&where=dep_name%20like%20%22${encodedDept}%22&select=com_name,dep_name,reg_name,com_code`
        
        const response = await fetch(url)
        if (!response.ok) {
          if (response.status === 400 || response.status === 404) {
            hasMore = false
            break
          }
          console.error(`❌ Erreur HTTP ${response.status} pour ${deptName}`)
          hasMore = false
          break
        }
        
        const data = await response.json()
        
        if (!data.results || data.results.length === 0) {
          hasMore = false
          break
        }
        
        // Extraire les informations nécessaires
        for (const result of data.results) {
          try {
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
              deptCount++
            }
          } catch (err) {
            // Ignorer les erreurs
          }
        }
        
        offset += limit
        
        // Si on a récupéré moins que la limite, on a fini pour ce département
        if (data.results.length < limit) {
          hasMore = false
        }
        
        // Attendre un peu pour ne pas surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 150))
        
      } catch (error) {
        console.error(`❌ Erreur pour ${deptName}:`, error.message)
        hasMore = false
      }
    }
    
    console.log(`   ✅ ${deptCount} communes trouvées pour ${deptName}`)
  }
  
  console.log(`\n✅ ${allCommunes.length} communes téléchargées au total\n`)
  
  // Créer un mapping nom normalisé -> département/région
  const mapping = {}
  for (const commune of allCommunes) {
    mapping[commune.normalizedName] = {
      departement: commune.departement,
      region: commune.region,
      originalName: commune.name
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
      
      // Si le cache est trop petit, télécharger
      if (cacheSize < 30000) {
        console.log('⚠️  Cache trop petit, téléchargement des données...\n')
        return await downloadAllCommunesByDepartment()
      }
      
      console.log('✅ Utilisation du cache\n')
      return cached
    } catch (error) {
      console.log('⚠️  Erreur lors du chargement du cache, téléchargement...\n')
    }
  }
  
  return await downloadAllCommunesByDepartment()
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
  let alreadyEnriched = 0
  
  for (let i = 0; i < communesData.length; i++) {
    const commune = communesData[i]
    
    // Afficher la progression tous les 1000 éléments
    if (i % 1000 === 0 && i > 0) {
      console.log(`📊 Progression: ${i}/${communesData.length} (${alreadyEnriched} déjà enrichies, ${enrichedCount} nouvelles, ${notFoundCount} non trouvées)`)
    }
    
    // Si la commune a déjà un département valide, la garder telle quelle
    if (commune.departement && commune.region && 
        commune.departement !== 'Non spécifié' && commune.region !== 'Non spécifiée') {
      enriched.push(commune)
      alreadyEnriched++
      continue
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
  console.log(`   - ${alreadyEnriched} communes déjà enrichies`)
  console.log(`   - ${enrichedCount} nouvelles communes enrichies`)
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


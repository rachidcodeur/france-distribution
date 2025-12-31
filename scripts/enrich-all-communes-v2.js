// Script optimisé v2 pour enrichir TOUTES les communes avec départements et régions
// Télécharge les communes par département pour contourner la limite d'offset de l'API

const fs = require('fs')
const path = require('path')

const communesLogementsPath = path.join(__dirname, '..', 'communes_logements.json')
const outputPath = path.join(__dirname, '..', 'communes_logements_enriched.json')
const mappingCachePath = path.join(__dirname, '..', 'communes_departement_mapping.json')

// Liste des départements français (codes INSEE)
const departements = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '21',
  '22', '23', '24', '25', '26', '27', '28', '29', '2A', '2B',
  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
  '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
  '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
  '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '90', '91', '92', '93', '94', '95'
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
  console.log('⚠️  Cela peut prendre quelques minutes...\n')
  
  const allCommunes = []
  
  for (let i = 0; i < departements.length; i++) {
    const dept = departements[i]
    console.log(`📊 Téléchargement du département ${dept} (${i + 1}/${departements.length})...`)
    
    let offset = 0
    const limit = 100
    let hasMore = true
    
    while (hasMore) {
      try {
        // Filtrer par code département (2 premiers chiffres du code INSEE)
        const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?limit=${limit}&offset=${offset}&where=com_code%20like%20%22${dept}%25%22&select=com_name,dep_name,reg_name,com_code`
        
        const response = await fetch(url)
        if (!response.ok) {
          if (response.status === 400 || response.status === 404) {
            // Pas de communes pour ce département ou erreur, passer au suivant
            hasMore = false
            break
          }
          console.error(`❌ Erreur HTTP ${response.status} pour le département ${dept}`)
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
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Erreur pour le département ${dept}:`, error.message)
        hasMore = false
      }
    }
    
    console.log(`   ✅ ${allCommunes.filter(c => c.codeInsee?.startsWith(dept)).length} communes trouvées pour ${dept}`)
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
  
  for (let i = 0; i < communesData.length; i++) {
    const commune = communesData[i]
    
    // Afficher la progression tous les 1000 éléments
    if (i % 1000 === 0 && i > 0) {
      console.log(`📊 Progression: ${i}/${communesData.length} (${enrichedCount} enrichies, ${notFoundCount} non trouvées)`)
    }
    
    // Si la commune a déjà un département valide, la garder telle quelle
    if (commune.departement && commune.region && 
        commune.departement !== 'Non spécifié' && commune.region !== 'Non spécifiée') {
      enriched.push(commune)
      enrichedCount++
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


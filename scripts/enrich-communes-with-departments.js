// Script pour enrichir le fichier communes_logements.json avec les départements et régions
// Utilise l'API OpenDataSoft pour récupérer les informations manquantes

const fs = require('fs')
const path = require('path')

const communesLogementsPath = path.join(__dirname, '..', 'communes_logements.json')
const outputPath = path.join(__dirname, '..', 'communes_logements_enriched.json')

// Mapping existant des villes (pour éviter les appels API inutiles)
const existingMapping = {
  // Ce mapping sera utilisé pour les villes déjà connues
  // Les autres seront enrichies via l'API
}

async function fetchDepartementFromAPI(communeName) {
  try {
    const response = await fetch(
      `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?where=com_name%20like%20%22${encodeURIComponent(communeName)}%22&limit=1`
    )
    if (!response.ok) return null
    const data = await response.json()
    if (data.results && data.results.length > 0) {
      const commune = data.results[0].record.fields
      return {
        departement: commune.dep_name || null,
        region: commune.reg_name || null
      }
    }
  } catch (error) {
    console.error(`Erreur pour ${communeName}:`, error.message)
  }
  return null
}

async function enrichCommunes() {
  console.log('📖 Lecture du fichier communes_logements.json...')
  const communesData = JSON.parse(fs.readFileSync(communesLogementsPath, 'utf-8'))
  
  console.log(`✅ ${communesData.length} communes trouvées`)
  console.log('🔄 Enrichissement des communes avec départements et régions...')
  console.log('⚠️  Cela peut prendre du temps (limitation de l\'API)...\n')
  
  const enriched = []
  let processed = 0
  let enrichedCount = 0
  
  for (const commune of communesData) {
    processed++
    
    // Afficher la progression tous les 100 éléments
    if (processed % 100 === 0) {
      console.log(`📊 Progression: ${processed}/${communesData.length} (${enrichedCount} enrichies)`)
    }
    
    // Vérifier si la commune a déjà un département (si le format JSON a été modifié)
    if (commune.departement && commune.region) {
      enriched.push(commune)
      continue
    }
    
    // Récupérer le département et la région via l'API
    const info = await fetchDepartementFromAPI(commune.ville)
    
    if (info && info.departement && info.region) {
      enriched.push({
        ...commune,
        departement: info.departement,
        region: info.region
      })
      enrichedCount++
    } else {
      // Garder la commune même si on n'a pas pu récupérer les infos
      enriched.push(commune)
    }
    
    // Attendre un peu pour ne pas surcharger l'API (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n✅ Enrichissement terminé: ${enrichedCount} communes enrichies sur ${communesData.length}`)
  console.log(`💾 Sauvegarde dans ${outputPath}...`)
  
  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), 'utf-8')
  console.log('✅ Fichier sauvegardé avec succès!')
  console.log(`\n📝 Note: Renommez le fichier ${outputPath} en communes_logements.json pour l'utiliser`)
}

enrichCommunes().catch(console.error)


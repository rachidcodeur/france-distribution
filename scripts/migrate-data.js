/**
 * Script de migration des données entre deux projets Supabase
 * 
 * Usage:
 * 1. Créez un fichier .env.migration avec les clés des deux projets
 * 2. node scripts/migrate-data.js
 * 
 * Structure de .env.migration:
 * OLD_SUPABASE_URL=https://ancien-projet.supabase.co
 * OLD_SUPABASE_SERVICE_KEY=votre_service_key_ancien
 * NEW_SUPABASE_URL=https://nouveau-projet.supabase.co
 * NEW_SUPABASE_SERVICE_KEY=votre_service_key_nouveau
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.migration' })

const oldSupabaseUrl = process.env.OLD_SUPABASE_URL
const oldSupabaseKey = process.env.OLD_SUPABASE_SERVICE_KEY
const newSupabaseUrl = process.env.NEW_SUPABASE_URL
const newSupabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY

if (!oldSupabaseUrl || !oldSupabaseKey || !newSupabaseUrl || !newSupabaseKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('Créez un fichier .env.migration avec:')
  console.error('OLD_SUPABASE_URL=...')
  console.error('OLD_SUPABASE_SERVICE_KEY=...')
  console.error('NEW_SUPABASE_URL=...')
  console.error('NEW_SUPABASE_SERVICE_KEY=...')
  process.exit(1)
}

const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const newSupabase = createClient(newSupabaseUrl, newSupabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateParticipations() {
  console.log('📦 Exportation des participations depuis l\'ancien projet...')
  
  const { data: oldParticipations, error: oldError } = await oldSupabase
    .from('france_distri_participations')
    .select('*')
    .order('created_at')

  if (oldError) {
    console.error('❌ Erreur lors de l\'exportation:', oldError)
    return null
  }

  console.log(`✅ ${oldParticipations.length} participations exportées`)
  return oldParticipations
}

async function migrateIrisSelections(oldParticipations) {
  console.log('📦 Exportation des sélections d\'IRIS...')
  
  if (!oldParticipations || oldParticipations.length === 0) {
    console.log('⚠️ Aucune participation à migrer')
    return []
  }

  const participationIds = oldParticipations.map(p => p.id)
  
  const { data: oldSelections, error: oldError } = await oldSupabase
    .from('france_distri_iris_selections')
    .select('*')
    .in('participation_id', participationIds)
    .order('created_at')

  if (oldError) {
    console.error('❌ Erreur lors de l\'exportation:', oldError)
    return []
  }

  console.log(`✅ ${oldSelections.length} sélections d'IRIS exportées`)
  return oldSelections
}

async function createUserMapping() {
  console.log('📋 Création du mapping des utilisateurs...')
  
  // Exporter les utilisateurs de l'ancien projet
  const { data: oldUsers, error: oldError } = await oldSupabase.auth.admin.listUsers()
  
  if (oldError) {
    console.error('❌ Erreur lors de l\'exportation des utilisateurs:', oldError)
    return {}
  }

  // Exporter les utilisateurs du nouveau projet
  const { data: newUsers, error: newError } = await newSupabase.auth.admin.listUsers()
  
  if (newError) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', newError)
    return {}
  }

  // Créer un mapping basé sur l'email
  const mapping = {}
  oldUsers.users.forEach(oldUser => {
    const newUser = newUsers.users.find(u => u.email === oldUser.email)
    if (newUser) {
      mapping[oldUser.id] = newUser.id
      console.log(`✅ Mapping: ${oldUser.email} - ${oldUser.id} → ${newUser.id}`)
    } else {
      console.warn(`⚠️ Utilisateur non trouvé dans le nouveau projet: ${oldUser.email}`)
    }
  })

  return mapping
}

async function importParticipations(oldParticipations, userMapping) {
  console.log('📥 Importation des participations dans le nouveau projet...')
  
  if (!oldParticipations || oldParticipations.length === 0) {
    console.log('⚠️ Aucune participation à importer')
    return []
  }

  const newParticipations = oldParticipations.map(oldPart => {
    const newUserId = userMapping[oldPart.user_id]
    
    if (!newUserId) {
      console.warn(`⚠️ Pas de mapping pour user_id: ${oldPart.user_id}, participation ignorée`)
      return null
    }

    return {
      ...oldPart,
      user_id: newUserId,
      // Générer un nouvel ID pour éviter les conflits
      id: undefined // Laisser Supabase générer un nouvel ID
    }
  }).filter(p => p !== null)

  const { data: inserted, error: insertError } = await newSupabase
    .from('france_distri_participations')
    .insert(newParticipations)
    .select()

  if (insertError) {
    console.error('❌ Erreur lors de l\'importation:', insertError)
    return []
  }

  console.log(`✅ ${inserted.length} participations importées`)
  
  // Créer un mapping entre anciens et nouveaux IDs de participations
  const participationMapping = {}
  oldParticipations.forEach((oldPart, index) => {
    if (inserted[index]) {
      participationMapping[oldPart.id] = inserted[index].id
    }
  })

  return participationMapping
}

async function importIrisSelections(oldSelections, participationMapping) {
  console.log('📥 Importation des sélections d\'IRIS...')
  
  if (!oldSelections || oldSelections.length === 0) {
    console.log('⚠️ Aucune sélection à importer')
    return
  }

  const newSelections = oldSelections.map(oldSel => {
    const newParticipationId = participationMapping[oldSel.participation_id]
    
    if (!newParticipationId) {
      console.warn(`⚠️ Pas de mapping pour participation_id: ${oldSel.participation_id}`)
      return null
    }

    return {
      ...oldSel,
      participation_id: newParticipationId,
      id: undefined // Laisser Supabase générer un nouvel ID
    }
  }).filter(s => s !== null)

  const { data: inserted, error: insertError } = await newSupabase
    .from('france_distri_iris_selections')
    .insert(newSelections)
    .select()

  if (insertError) {
    console.error('❌ Erreur lors de l\'importation:', insertError)
    return
  }

  console.log(`✅ ${inserted.length} sélections d'IRIS importées`)
}

async function main() {
  console.log('🚀 Début de la migration...\n')

  try {
    // 1. Exporter les données de l'ancien projet
    const oldParticipations = await migrateParticipations()
    const oldSelections = await migrateIrisSelections(oldParticipations)

    // 2. Créer le mapping des utilisateurs
    const userMapping = await createUserMapping()
    
    if (Object.keys(userMapping).length === 0) {
      console.error('❌ Aucun mapping d\'utilisateur créé. Les utilisateurs doivent se connecter dans le nouveau projet d\'abord.')
      return
    }

    // 3. Importer les participations
    const participationMapping = await importParticipations(oldParticipations, userMapping)

    // 4. Importer les sélections d'IRIS
    if (participationMapping && Object.keys(participationMapping).length > 0) {
      await importIrisSelections(oldSelections, participationMapping)
    }

    console.log('\n✅ Migration terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }


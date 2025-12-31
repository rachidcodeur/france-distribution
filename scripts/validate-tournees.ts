/**
 * Script pour valider automatiquement les tournées
 * 
 * Ce script doit être exécuté quotidiennement (via cron job) pour vérifier
 * les tournées qui arrivent à leur date limite (15 jours avant le début)
 * et définir leur statut :
 * - confirmed : au moins un secteur a 3+ participants
 * - cancelled : aucun secteur n'a 3+ participants
 * - bouclee : au moins un secteur a 5 participants
 * 
 * Usage:
 * - Via API: GET /api/validate-tournees
 * - Via cron job: appeler cette route quotidiennement
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Fonction pour parser une date française (ex: "15 janvier 2024")
function parseFrenchDate(dateStr: string): Date | null {
  const moisMap: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  }
  
  const parts = dateStr.split(' ')
  if (parts.length !== 3) return null
  
  const jour = parseInt(parts[0])
  const mois = moisMap[parts[1].toLowerCase()]
  const annee = parseInt(parts[2])
  
  if (isNaN(jour) || isNaN(annee) || mois === undefined) return null
  
  return new Date(annee, mois, jour)
}

async function validateTournees() {
  try {
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)

    console.log(`🔍 Validation des tournées pour le ${aujourdhui.toLocaleDateString('fr-FR')}`)

    // Récupérer toutes les participations non annulées
    const { data: participations, error: participationsError } = await supabase
      .from('france_distri_participations')
      .select('id, ville_name, tournee_date_debut, status')
      .neq('status', 'cancelled')

    if (participationsError) {
      console.error('❌ Erreur lors de la récupération des participations:', participationsError)
      return
    }

    if (!participations || participations.length === 0) {
      console.log('ℹ️ Aucune participation à valider')
      return
    }

    // Grouper les participations par ville et date de début
    const tourneesMap = new Map<string, typeof participations>()
    participations.forEach((p: any) => {
      const key = `${p.ville_name}|${p.tournee_date_debut}`
      if (!tourneesMap.has(key)) {
        tourneesMap.set(key, [])
      }
      tourneesMap.get(key)!.push(p)
    })

    let validatedCount = 0

    // Pour chaque tournée unique
    for (const [key, tourneeParticipations] of tourneesMap.entries()) {
      const [villeName, dateDebutStr] = key.split('|')
      const dateDebut = parseFrenchDate(dateDebutStr)
      
      if (!dateDebut) {
        console.warn(`⚠️ Date invalide pour la tournée: ${dateDebutStr}`)
        continue
      }

      // Calculer la date limite (15 jours avant)
      const dateLimite = new Date(dateDebut)
      dateLimite.setDate(dateLimite.getDate() - 15)
      dateLimite.setHours(0, 0, 0, 0)

      // Vérifier si on est exactement à 15 jours avant (ou dans les 24h qui suivent)
      const diffDays = Math.floor((aujourdhui.getTime() - dateLimite.getTime()) / (1000 * 60 * 60 * 24))
      
      // Valider uniquement si on est entre 0 et 1 jour après la date limite
      if (diffDays < 0) {
        continue // Pas encore le moment de valider cette tournée
      }
      
      if (diffDays > 1) {
        continue // Déjà validé ou trop tard
      }

      console.log(`📋 Validation de la tournée: ${villeName} - ${dateDebutStr}`)

      const participationIds = tourneeParticipations.map(p => p.id)

      // Récupérer toutes les sélections d'IRIS pour ces participations
      const { data: selections, error: selectionsError } = await supabase
        .from('france_distri_iris_selections')
        .select('iris_code, participation_id')
        .in('participation_id', participationIds)

      if (selectionsError) {
        console.error(`❌ Erreur lors de la récupération des sélections pour ${villeName}:`, selectionsError)
        continue
      }

      // Compter les participants par secteur IRIS
      const secteursCounts = new Map<string, number>()
      const secteursParticipations = new Map<string, Set<string>>()

      selections?.forEach((item: any) => {
        const irisCode = item.iris_code
        const participationId = item.participation_id

        if (!secteursParticipations.has(irisCode)) {
          secteursParticipations.set(irisCode, new Set())
        }

        const participationSet = secteursParticipations.get(irisCode)!
        if (!participationSet.has(participationId)) {
          participationSet.add(participationId)
          secteursCounts.set(irisCode, participationSet.size)
        }
      })

      // Déterminer le statut de chaque secteur et de la tournée globale
      let tourneeStatus: 'confirmed' | 'cancelled' | 'bouclee' = 'cancelled'
      let hasConfirmedSecteur = false
      let allSecteursBoucles = true

      console.log(`   Secteurs analysés:`)
      for (const [irisCode, count] of secteursCounts.entries()) {
        if (count >= 5) {
          console.log(`   - ${irisCode}: ${count} participants → BOUCLÉ`)
          tourneeStatus = 'bouclee'
        } else if (count >= 3) {
          console.log(`   - ${irisCode}: ${count} participants → CONFIRMÉ`)
          hasConfirmedSecteur = true
          allSecteursBoucles = false
        } else {
          console.log(`   - ${irisCode}: ${count} participants → INSUFFISANT`)
          allSecteursBoucles = false
        }
      }

      // Si au moins un secteur est confirmé et qu'aucun n'est bouclé, la tournée est confirmée
      if (hasConfirmedSecteur && tourneeStatus !== 'bouclee') {
        tourneeStatus = 'confirmed'
      }

      console.log(`   ✅ Statut final de la tournée: ${tourneeStatus.toUpperCase()}`)

      // Mettre à jour le statut de toutes les participations de cette tournée
      const { error: updateError } = await supabase
        .from('france_distri_participations')
        .update({ status: tourneeStatus })
        .in('id', participationIds)

      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour du statut pour ${villeName}:`, updateError)
        continue
      }

      validatedCount++
    }

    console.log(`\n✅ Validation terminée: ${validatedCount} tournée(s) validée(s)`)
  } catch (error) {
    console.error('❌ Erreur lors de la validation des tournées:', error)
    throw error
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  validateTournees()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { validateTournees }


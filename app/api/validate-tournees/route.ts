import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// Interface pour les participations
interface Participation {
  id: string
  ville_name: string
  tournee_date_debut: string
  status: string
}

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

// Fonction pour formater une date en français
function formatFrenchDate(date: Date): string {
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase non configuré' },
        { status: 500 }
      )
    }

    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)

    // Récupérer toutes les participations non annulées
    const { data: participations, error: participationsError } = await supabase
      .from('france_distri_participations')
      .select('id, ville_name, tournee_date_debut, status')
      .neq('status', 'cancelled')

    if (participationsError) {
      console.error('Erreur lors de la récupération des participations:', participationsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des participations' },
        { status: 500 }
      )
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({
        message: 'Aucune participation à valider',
        validated: 0
      })
    }

    // Typage explicite des participations
    const typedParticipations: Participation[] = (participations || []).map((p: any): Participation => ({
      id: String(p.id),
      ville_name: String(p.ville_name),
      tournee_date_debut: String(p.tournee_date_debut),
      status: String(p.status)
    }))

    // Grouper les participations par ville et date de début
    const tourneesMap = new Map<string, Participation[]>()
    typedParticipations.forEach((p) => {
      const key = `${p.ville_name}|${p.tournee_date_debut}`
      if (!tourneesMap.has(key)) {
        tourneesMap.set(key, [])
      }
      tourneesMap.get(key)!.push(p)
    })

    let validatedCount = 0
    const results: Array<{
      ville: string
      dateDebut: string
      status: string
      secteurs: Array<{ code: string; count: number; status: string }>
    }> = []

    // Pour chaque tournée unique
    for (const [key, tourneeParticipations] of tourneesMap.entries()) {
      const [villeName, dateDebutStr] = key.split('|')
      const dateDebut = parseFrenchDate(dateDebutStr)
      
      if (!dateDebut) {
        console.warn(`Date invalide pour la tournée: ${dateDebutStr}`)
        continue
      }

      // Calculer la date limite (15 jours avant)
      const dateLimite = new Date(dateDebut)
      dateLimite.setDate(dateLimite.getDate() - 15)
      dateLimite.setHours(0, 0, 0, 0)

      // Vérifier si on est exactement à 15 jours avant (ou dans les 24h qui suivent)
      const diffDays = Math.floor((aujourdhui.getTime() - dateLimite.getTime()) / (1000 * 60 * 60 * 24))
      
      // Valider uniquement si on est entre 0 et 1 jour après la date limite
      if (diffDays < 0 || diffDays > 1) {
        continue // Pas encore le moment de valider cette tournée
      }

      const participationIds = tourneeParticipations.map((p: Participation) => p.id)

      // Récupérer toutes les sélections d'IRIS pour ces participations
      const { data: selections, error: selectionsError } = await supabase
        .from('france_distri_iris_selections')
        .select('iris_code, participation_id')
        .in('participation_id', participationIds)

      if (selectionsError) {
        console.error(`Erreur lors de la récupération des sélections pour ${villeName}:`, selectionsError)
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
      const secteursStatus: Array<{ code: string; count: number; status: string }> = []
      let tourneeStatus: 'confirmed' | 'cancelled' | 'bouclee' = 'cancelled'
      let hasConfirmedSecteur = false
      let allSecteursBoucles = true

      for (const [irisCode, count] of secteursCounts.entries()) {
        let secteurStatus: string
        
        if (count >= 5) {
          secteurStatus = 'bouclee'
          tourneeStatus = 'bouclee'
        } else if (count >= 3) {
          secteurStatus = 'confirmed'
          hasConfirmedSecteur = true
          allSecteursBoucles = false
        } else {
          secteurStatus = 'insufficient'
          allSecteursBoucles = false
        }

        secteursStatus.push({ code: irisCode, count, status: secteurStatus })
      }

      // Si au moins un secteur est confirmé et qu'aucun n'est bouclé, la tournée est confirmée
      if (hasConfirmedSecteur && tourneeStatus !== 'bouclee') {
        tourneeStatus = 'confirmed'
      }

      // Mettre à jour le statut de toutes les participations de cette tournée
      const { error: updateError } = await supabase
        .from('france_distri_participations')
        .update({ status: tourneeStatus as 'confirmed' | 'cancelled' | 'bouclee' })
        .in('id', participationIds)

      if (updateError) {
        console.error(`Erreur lors de la mise à jour du statut pour ${villeName}:`, updateError)
        continue
      }

      validatedCount++
      results.push({
        ville: villeName,
        dateDebut: dateDebutStr,
        status: tourneeStatus,
        secteurs: secteursStatus
      })
    }

    return NextResponse.json({
      message: `Validation terminée: ${validatedCount} tournée(s) validée(s)`,
      validated: validatedCount,
      results
    })
  } catch (error) {
    console.error('Erreur lors de la validation des tournées:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation des tournées' },
      { status: 500 }
    )
  }
}


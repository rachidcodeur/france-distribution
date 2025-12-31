'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

interface SelectedIris {
  code: string
  name: string
  logements?: number
}

interface StoredSelection {
  villeName: string
  tourneeIndex: number
  tourneeDateDebut: string
  tourneeDateFin: string
  selectedIris: SelectedIris[]
  totalLogements: number
  coutDistribution: number
  hasFlyer?: boolean
  flyerTitle?: string
  flyerEntreprise?: string
  flyerEmail?: string
  flyerTelephone?: string
  flyerAddress?: {
    rue: string
    codePostal: string
    ville: string
  }
  selectedFlyerFormat?: 'A5' | 'A6' | null
}

/**
 * Page de callback pour gérer le retour après confirmation d'email
 * Cette page restaure les données depuis localStorage et redirige vers la page de login
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        console.log('🔗 Callback auth - Type:', type)

        // Si c'est une confirmation d'email, restaurer la session
        if (type === 'signup' && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('❌ Erreur lors de la restauration de session:', sessionError)
            router.push('/login')
            return
          } else {
            console.log('✅ Session restaurée après confirmation d\'email')
            
            // Vérifier que la session est bien établie
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError || !user) {
              console.error('❌ Erreur lors de la récupération de l\'utilisateur après confirmation:', userError)
              router.push('/login')
              return
            }
            
            console.log('✅ Utilisateur confirmé:', user.id, user.email)
            
            // Mettre à jour le cache d'authentification
            if (typeof window !== 'undefined') {
              localStorage.setItem('user_authenticated', 'true')
            }
            
            // Vérifier si on a des données en attente dans localStorage
            const stored = typeof window !== 'undefined' ? localStorage.getItem('pendingSelection') : null
            
            if (stored) {
              try {
                const storedData: StoredSelection = JSON.parse(stored)
                console.log('✅ Données trouvées dans localStorage, sauvegarde automatique depuis callback...')
                console.log('📋 Données:', {
                  villeName: storedData.villeName,
                  selectedIrisCount: storedData.selectedIris?.length || 0,
                  totalLogements: storedData.totalLogements
                })
                
                // Calculer le coût d'impression si nécessaire
                const calculatePrintingCost = () => {
                  if (storedData.hasFlyer) {
                    return 0
                  }
                  if (!storedData.selectedFlyerFormat) {
                    return 0
                  }
                  const costPerUnit = storedData.selectedFlyerFormat === 'A5' ? 0.15 : 0.12
                  return storedData.totalLogements * costPerUnit
                }
                
                const participationData: any = {
                  user_id: user.id,
                  ville_name: storedData.villeName,
                  tournee_date_debut: storedData.tourneeDateDebut,
                  tournee_date_fin: storedData.tourneeDateFin,
                  tournee_index: storedData.tourneeIndex,
                  total_logements: Math.round(storedData.totalLogements),
                  cout_distribution: storedData.coutDistribution,
                  cout_impression: calculatePrintingCost(),
                  status: 'pending',
                  tournee_link: `/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`
                }
                
                // Ajouter les champs du flyer
                if (storedData.hasFlyer !== undefined) {
                  participationData.has_flyer = storedData.hasFlyer
                  participationData.needs_flyer_creation = !storedData.hasFlyer
                }
                
                if (storedData.hasFlyer) {
                  if (storedData.flyerTitle) {
                    participationData.flyer_title = storedData.flyerTitle
                  }
                  if (storedData.flyerEntreprise) {
                    participationData.flyer_entreprise = storedData.flyerEntreprise
                  }
                  if (storedData.flyerEmail) {
                    participationData.flyer_email = storedData.flyerEmail
                  }
                  if (storedData.flyerTelephone) {
                    participationData.flyer_telephone = storedData.flyerTelephone
                  }
                  if (storedData.flyerAddress) {
                    participationData.flyer_address_rue = storedData.flyerAddress.rue
                    participationData.flyer_address_code_postal = storedData.flyerAddress.codePostal
                    participationData.flyer_address_ville = storedData.flyerAddress.ville
                  }
                } else {
                  if (storedData.selectedFlyerFormat) {
                    participationData.flyer_format = storedData.selectedFlyerFormat
                  }
                  if (storedData.flyerTitle) {
                    participationData.flyer_title = storedData.flyerTitle
                  }
                  if (storedData.flyerEntreprise) {
                    participationData.flyer_entreprise = storedData.flyerEntreprise
                  }
                  if (storedData.flyerEmail) {
                    participationData.flyer_email = storedData.flyerEmail
                  }
                  if (storedData.flyerTelephone) {
                    participationData.flyer_telephone = storedData.flyerTelephone
                  }
                }
                
                // Insérer la participation
                const { data: participation, error: participationError } = await supabase
                  .from('france_distri_participations')
                  .insert(participationData)
                  .select()
                  .single()
                
                if (participationError) {
                  console.error('❌ Erreur lors de la sauvegarde de la participation:', participationError)
                  // Rediriger vers login pour réessayer
                  router.push('/login')
                  return
                } else {
                  console.log('✅ Participation sauvegardée:', participation.id)
                  
                  // Sauvegarder les sélections d'IRIS
                  if (storedData.selectedIris && storedData.selectedIris.length > 0) {
                    const irisSelections = storedData.selectedIris.map((iris) => ({
                      participation_id: participation.id,
                      iris_code: iris.code,
                      iris_name: iris.name,
                      logements: iris.logements ? Math.round(iris.logements) : null
                    }))
                    
                    console.log('💾 Sauvegarde de', irisSelections.length, 'sélections IRIS...')
                    
                    const { error: irisError } = await supabase
                      .from('france_distri_iris_selections')
                      .insert(irisSelections)
                    
                    if (irisError) {
                      console.error('❌ Erreur lors de la sauvegarde des IRIS:', irisError)
                    } else {
                      console.log('✅ Sélections IRIS sauvegardées avec succès')
                    }
                  }
                  
                  // Nettoyer localStorage après sauvegarde réussie
                  localStorage.removeItem('pendingSelection')
                  localStorage.setItem('user_authenticated', 'true')
                  
                  // Rediriger vers le dashboard avec un paramètre de succès
                  console.log('✅ Redirection vers le dashboard...')
                  router.push('/dashboard?success=true')
                  return
                }
              } catch (error) {
                console.error('❌ Erreur lors du traitement des données:', error)
                router.push('/login')
                return
              }
            } else {
              // Pas de données à sauvegarder, rediriger vers le dashboard
              console.log('⚠️ Aucune donnée en attente, redirection vers le dashboard')
              router.push('/dashboard')
            }
          }
        } else {
          // Pas de confirmation d'email, redirection normale
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('pendingSelection')
            
            if (stored) {
              console.log('✅ Données trouvées dans localStorage, redirection vers la page de login')
              router.push('/login')
            } else {
              console.log('⚠️ Aucune donnée en attente, redirection vers la page d\'accueil')
              router.push('/tournees')
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du traitement du callback:', error)
        router.push('/tournees')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Traitement de votre confirmation...</p>
        </div>
      </div>
    </section>
  )
}


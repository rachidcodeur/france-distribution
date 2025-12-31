'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '../../../../../../../lib/supabase'
import type { User } from '@supabase/supabase-js'

// Import supabase pour vérifier l'authentification

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
  uploadedFlyerFormat?: 'A5' | 'A6' | ''
  selectedFlyerFormat?: 'A5' | 'A6' | null
  flyerType?: 'A5' | 'A6' | 'catalogue supermarché' | null
}

export default function RecapPage() {
  const router = useRouter()
  const [storedData, setStoredData] = useState<StoredSelection | null>(null)
  const [saving, setSaving] = useState(false)

  // Grilles tarifaires d'impression
  const printingPricesA6 = [
    { quantity: 1000, price: 117.00 },
    { quantity: 1500, price: 135.00 },
    { quantity: 2500, price: 123.00 },
    { quantity: 5000, price: 150.00 },
    { quantity: 7500, price: 222.00 },
    { quantity: 10000, price: 283.50 },
    { quantity: 15000, price: 417.00 },
    { quantity: 20000, price: 531.00 },
    { quantity: 30000, price: 789.00 },
    { quantity: 40000, price: 1015.50 },
    { quantity: 50000, price: 1252.50 },
    { quantity: 60000, price: 1503.00 },
    { quantity: 70000, price: 1752.00 },
    { quantity: 80000, price: 2002.50 },
    { quantity: 90000, price: 2241.00 },
    { quantity: 100000, price: 2490.00 },
    { quantity: 200000, price: 4965.00 }
  ]

  const printingPricesA5 = [
    { quantity: 1000, price: 73.50 },
    { quantity: 1500, price: 93.00 },
    { quantity: 2500, price: 72.00 },
    { quantity: 5000, price: 105.00 },
    { quantity: 7500, price: 117.00 },
    { quantity: 10000, price: 147.00 },
    { quantity: 15000, price: 198.00 },
    { quantity: 20000, price: 252.00 },
    { quantity: 30000, price: 375.00 },
    { quantity: 40000, price: 498.00 },
    { quantity: 50000, price: 598.50 },
    { quantity: 60000, price: 717.00 },
    { quantity: 70000, price: 835.50 },
    { quantity: 80000, price: 925.50 },
    { quantity: 90000, price: 1029.00 },
    { quantity: 100000, price: 1143.00 },
    { quantity: 200000, price: 2280.00 }
  ]

  // Fonction pour calculer le coût d'impression (uniquement pour les créations de flyer)
  const calculatePrintingCost = useMemo(() => {
    if (!storedData || storedData.hasFlyer) return 0 // Pas de coût d'impression si l'utilisateur a déjà un flyer
    
    const logements = Math.round(storedData.totalLogements)
    const format = storedData.selectedFlyerFormat
    
    if (!format) return 0
    
    const prices = format === 'A6' ? printingPricesA6 : printingPricesA5
    
    // Trouver la quantité immédiatement supérieure
    for (const tier of prices) {
      if (logements <= tier.quantity) {
        return tier.price
      }
    }
    
    // Si le nombre de logements dépasse le maximum, utiliser le dernier tarif
    return prices[prices.length - 1].price
  }, [storedData])

  // Charger les données depuis localStorage au montage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('pendingSelection')
    if (!stored) {
      // Pas de données, rediriger vers la page de sélection
      router.push('/tournees')
      return
    }

    try {
      const data = JSON.parse(stored)
      setStoredData(data)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      router.push('/tournees')
    }
  }, [router])

  // Ne plus sauvegarder automatiquement - l'utilisateur doit voir le récapitulatif et cliquer sur "Continuer"
  // La sauvegarde se fera uniquement via handleFinalConfirm qui redirige vers la page de login


  const handleSave = async (user: User) => {
    if (!storedData || !user || !user.id) {
      return
    }

    setSaving(true)
    let uploadedFlyerUrl: string | null = null

    try {
      // Si l'utilisateur a un flyer, il faut récupérer le fichier depuis sessionStorage
      // Note: Les fichiers ne peuvent pas être stockés dans sessionStorage, donc on sauvegarde sans le fichier
      // Le fichier devra être uploadé séparément ou via un autre mécanisme
      
      // Créer la participation avec les informations du flyer
      const participationData: any = {
        user_id: user.id,
        ville_name: storedData.villeName,
        tournee_date_debut: storedData.tourneeDateDebut,
        tournee_date_fin: storedData.tourneeDateFin,
        tournee_index: storedData.tourneeIndex,
        total_logements: Math.round(storedData.totalLogements),
        cout_distribution: storedData.coutDistribution,
        status: 'pending',
        tournee_link: `/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`
      }

      // Ajouter les champs du flyer
      try {
        participationData.has_flyer = storedData.hasFlyer || false
        participationData.flyer_url = uploadedFlyerUrl
        participationData.needs_flyer_creation = !storedData.hasFlyer
        // Ajouter le format sélectionné (uniquement pour les créations)
        if (!storedData.hasFlyer && storedData.selectedFlyerFormat) {
          participationData.flyer_format = storedData.selectedFlyerFormat
        }
        // Ajouter les informations du flyer si disponibles
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
        if (storedData.hasFlyer && storedData.flyerAddress) {
          participationData.flyer_address_rue = storedData.flyerAddress.rue
          participationData.flyer_address_code_postal = storedData.flyerAddress.codePostal
          participationData.flyer_address_ville = storedData.flyerAddress.ville
        }
      } catch (e) {
        console.warn('Les colonnes flyer n\'existent pas encore dans la base de données')
      }

      console.log('📝 Données de participation à insérer:', participationData)
      
      let participation: any = null
      const { data: participationDataResult, error: participationError } = await supabase
        .from('france_distri_participations')
        .insert(participationData)
        .select()
        .single()

      if (participationError) {
        console.error('❌ Erreur lors de l\'insertion de la participation:', participationError)
        // Si l'erreur est due aux colonnes manquantes, essayer sans ces colonnes
        const errorMessage = participationError.message || ''
        const isColumnError = errorMessage.includes('column') || 
                              errorMessage.includes('does not exist') ||
                              errorMessage.includes('schema cache') ||
                              participationError.code === '42703' ||
                              errorMessage.includes('flyer_') ||
                              errorMessage.includes('has_flyer') ||
                              errorMessage.includes('needs_flyer_creation')
        
        if (isColumnError) {
          console.warn('⚠️ Colonnes flyer manquantes, création sans ces informations')
          // Créer la participation avec uniquement les colonnes de base
          const basicParticipationData = {
            user_id: user.id,
            ville_name: storedData.villeName,
            tournee_date_debut: storedData.tourneeDateDebut,
            tournee_date_fin: storedData.tourneeDateFin,
            tournee_index: storedData.tourneeIndex,
            total_logements: Math.round(storedData.totalLogements),
            cout_distribution: storedData.coutDistribution,
            status: 'pending'
          }
          
          console.log('📝 Tentative avec données de base uniquement:', basicParticipationData)
          
          const { data: participationRetry, error: retryError } = await supabase
            .from('france_distri_participations')
            .insert(basicParticipationData as any)
            .select()
            .single()
          
          if (retryError) {
            console.error('❌ Erreur même avec les colonnes de base:', retryError)
            throw retryError
          }
          if (!participationRetry) {
            throw new Error('Erreur lors de la création de la participation')
          }
          participation = participationRetry
          console.log('✅ Participation créée sans les colonnes flyer:', participation.id)
        } else {
          throw participationError
        }
      } else {
        participation = participationDataResult
      }

      if (!participation) {
        console.error('❌ Aucune participation retournée après insertion')
        throw new Error('Erreur lors de la création de la participation')
      }

      console.log('✅ Participation créée avec succès:', participation.id)

      // Créer les sélections d'IRIS
      const irisSelections = storedData.selectedIris.map(iris => ({
        participation_id: (participation as any).id,
        iris_code: iris.code,
        iris_name: iris.name,
        logements: iris.logements ? Math.round(iris.logements) : null
      }))

      console.log('📝 Insertion des sélections IRIS:', irisSelections.length, 'sélections')
      
      const { error: selectionsError } = await supabase
        .from('france_distri_iris_selections')
        .insert(irisSelections as any)

      if (selectionsError) {
        console.error('❌ Erreur lors de l\'insertion des sélections IRIS:', selectionsError)
        throw selectionsError
      }

      console.log('✅ Sélections IRIS créées avec succès')

      // Nettoyer localStorage
      localStorage.removeItem('pendingSelection')

      console.log('✅ Sauvegarde complète réussie, redirection vers le dashboard')
      
      // Rediriger vers le dashboard avec un message de succès
      router.push('/dashboard?success=true')
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement:', err)
      let errorMessage = 'Erreur lors de l\'enregistrement'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.error_description) {
        errorMessage = err.error_description
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        errorMessage = 'Les colonnes de la base de données ne sont pas à jour. Veuillez exécuter le script de migration SQL (supabase-migration-flyer.sql) dans Supabase.'
      }
      
      alert(`${errorMessage}\n\nSi le problème persiste, vérifiez la console du navigateur pour plus de détails.`)
    } finally {
      setSaving(false)
    }
  }

  const handleFinalConfirm = () => {
    // Rediriger vers la page de connexion spécifique pour cette sélection
    if (!storedData) return
    router.push(`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs/confirmation/recap/login`)
  }

  if (!storedData) {
    return (
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
          </div>
        </div>
      </section>
    )
  }

  const flyerFormat = storedData.selectedFlyerFormat // Format uniquement pour les créations

  return (
    <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div className="recap-page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link 
              href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs/confirmation`}
              className="back-link"
            >
              <span className="back-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </span>
              Retour
            </Link>

            <div className="section-header">
              <h1 className="section-title">Récapitulatif final</h1>
              <p className="section-subtitle">
                Tournée du {storedData.tourneeDateDebut} au {storedData.tourneeDateFin} - {storedData.villeName}
              </p>
            </div>

            <div className="recap-details-card" style={{
              background: 'var(--bg-accent)',
              borderRadius: '16px',
              padding: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-xl)',
              border: '2px solid #52607f'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                    Secteurs IRIS sélectionnés
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700 }}>
                    {storedData.selectedIris.length}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                    Total logements
                  </div>
                  <div style={{ color: 'var(--orange-primary)', fontSize: '24px', fontWeight: 700 }}>
                    {Math.round(storedData.totalLogements).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>

              <div style={{
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid #52607f',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>
                    Coût de distribution
                  </span>
                  <span style={{ color: 'var(--orange-primary)', fontSize: '24px', fontWeight: 700 }}>
                    {storedData.coutDistribution.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                  </span>
                </div>
                {calculatePrintingCost > 0 && flyerFormat && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>
                      Coût d'impression (Format {flyerFormat})
                    </span>
                    <span style={{ color: 'var(--orange-primary)', fontSize: '24px', fontWeight: 700 }}>
                      {calculatePrintingCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ HT
                    </span>
                  </div>
                )}
              </div>

              <div style={{
                paddingTop: 'var(--spacing-lg)',
                borderTop: '2px solid var(--orange-primary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '27px', fontWeight: 700 }}>
                    Total
                  </span>
                  <span style={{ color: 'var(--orange-primary)', fontSize: '33px', fontWeight: 700 }}>
                    {(storedData.coutDistribution + calculatePrintingCost).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              justifyContent: 'flex-end'
            }}>
              <Link
                href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs/confirmation`}
                style={{
                  padding: '12px var(--spacing-lg)',
                  borderRadius: '8px',
                  border: '1px solid #52607f',
                  background: 'var(--bg-accent)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Retour
              </Link>
              <button
                onClick={handleFinalConfirm}
                disabled={saving}
                style={{
                  padding: '12px var(--spacing-lg)',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                  color: 'var(--text-primary)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  opacity: saving ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(251, 109, 37, 0.35)'
                }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
    </section>
  )
}


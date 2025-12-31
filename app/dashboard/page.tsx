'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'
import Toast from '@/components/Toast'

interface IrisSelection {
  id: string
  iris_code: string
  iris_name: string
  logements: number | null
}

interface Participation {
  id: string
  ville_name: string
  tournee_date_debut: string
  tournee_date_fin: string
  tournee_index: number
  total_logements: number
  cout_distribution: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'bouclee'
  has_flyer: boolean
  flyer_title: string | null
  flyer_entreprise: string | null
  flyer_address_rue: string | null
  flyer_address_code_postal: string | null
  flyer_address_ville: string | null
  flyer_format: string | null
  needs_flyer_creation: boolean
  created_at: string
  updated_at: string
  iris_selections?: (IrisSelection & { participant_count?: number })[]
  iris_counts?: Map<string, number> // Nombre de participants par IRIS
  isTourneeBloquee?: boolean // Si la tournée est bloquée (15 jours avant)
  isTourneePassee?: boolean // Si la date de la tournée est passée
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: '#ff9800' },
  confirmed: { label: 'Confirmée', color: '#4caf50' },
  cancelled: { label: 'Annulée', color: '#f44336' },
  bouclee: { label: 'Bouclée', color: '#2196f3' }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [participations, setParticipations] = useState<Participation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; participationId: string | null; villeName: string }>({
    isOpen: false,
    participationId: null,
    villeName: ''
  })

  useEffect(() => {
    // Vérifier s'il y a un message de succès dans l'URL
    const success = searchParams.get('success')
    if (success === 'true') {
      setToast({ message: 'Votre participation a été enregistrée avec succès !', type: 'success' })
      // Nettoyer l'URL
      router.replace('/dashboard', { scroll: false })
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase n\'est pas configuré.')
      setLoading(false)
      return
    }

    // Vérifier l'authentification
    supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
      if (userError || !user) {
        router.push('/login')
        return
      }
      setUser(user)
      loadParticipations(user.id)
    })

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        loadParticipations(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, searchParams])

  const loadParticipations = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Chargement des participations pour user_id:', userId)

      // Récupérer les participations
      const { data: participationsData, error: participationsError } = await supabase
        .from('france_distri_participations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (participationsError) {
        console.error('❌ Erreur lors de la récupération des participations:', participationsError)
        throw participationsError
      }

      console.log('📊 Participations récupérées:', participationsData?.length || 0, participationsData)

      if (!participationsData || participationsData.length === 0) {
        console.log('ℹ️ Aucune participation trouvée')
        setParticipations([])
        setLoading(false)
        return
      }

      // Récupérer les sélections d'IRIS pour chaque participation
      const participationIds = participationsData.map(p => p.id)
      const { data: irisData, error: irisError } = await supabase
        .from('france_distri_iris_selections')
        .select('*')
        .in('participation_id', participationIds)
        .order('created_at', { ascending: true })

      if (irisError) {
        console.error('Erreur lors de la récupération des IRIS:', irisError)
        // Continuer même si on n'a pas les IRIS
      }

      // Fonction pour parser une date française (format: "DD mois YYYY")
      const parseFrenchDate = (dateStr: string): Date | null => {
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

      // Fonction pour vérifier si une tournée est bloquée (15 jours avant le démarrage)
      const isTourneeBloquee = (dateDebutStr: string): boolean => {
        const dateDebut = parseFrenchDate(dateDebutStr)
        if (!dateDebut) return false
        const dateLimite = new Date(dateDebut)
        dateLimite.setDate(dateLimite.getDate() - 15)
        dateLimite.setHours(0, 0, 0, 0)
        const aujourdhui = new Date()
        aujourdhui.setHours(0, 0, 0, 0)
        return aujourdhui > dateLimite
      }

      // Fonction pour vérifier si la date de la tournée est passée
      const isTourneePassee = (dateDebutStr: string): boolean => {
        const dateDebut = parseFrenchDate(dateDebutStr)
        if (!dateDebut) return false
        const aujourdhui = new Date()
        aujourdhui.setHours(0, 0, 0, 0)
        return aujourdhui > dateDebut
      }

      // Compter les participants par IRIS pour chaque tournée
      const participationsWithIris = participationsData.map(participation => {
        const participationIris = irisData?.filter(iris => iris.participation_id === participation.id) || []
        
        // Créer une map pour compter les participants par IRIS pour cette tournée
        const irisCounts = new Map<string, number>()
        const irisParticipations = new Map<string, Set<string>>()
        
        // Récupérer toutes les participations pour cette tournée
        const tourneeParticipations = participationsData.filter(p => 
          p.ville_name === participation.ville_name && 
          p.tournee_date_debut === participation.tournee_date_debut &&
          p.status !== 'cancelled'
        )
        const tourneeParticipationIds = tourneeParticipations.map(p => p.id)
        
        // Compter les participants par IRIS
        irisData?.forEach((iris: any) => {
          if (tourneeParticipationIds.includes(iris.participation_id)) {
            const irisCode = iris.iris_code
            if (!irisParticipations.has(irisCode)) {
              irisParticipations.set(irisCode, new Set())
            }
            const participationSet = irisParticipations.get(irisCode)!
            if (!participationSet.has(iris.participation_id)) {
              participationSet.add(iris.participation_id)
              irisCounts.set(irisCode, participationSet.size)
            }
          }
        })
        
        // Ajouter le nombre de participants à chaque IRIS de cette participation
        const irisSelectionsWithCounts = participationIris.map(iris => ({
          ...iris,
          participant_count: irisCounts.get(iris.iris_code) || 0
        }))
        
        return {
          ...participation,
          iris_selections: irisSelectionsWithCounts,
          iris_counts: irisCounts,
          isTourneeBloquee: isTourneeBloquee(participation.tournee_date_debut),
          isTourneePassee: isTourneePassee(participation.tournee_date_debut)
        }
      })

      // Filtrer les participations annulées
      const activeParticipations = participationsWithIris.filter(p => p.status !== 'cancelled')

      setParticipations(activeParticipations)
    } catch (err: any) {
      console.error('Erreur lors du chargement des participations:', err)
      setError('Erreur lors du chargement de vos participations.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (participationId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(participationId)) {
        newSet.delete(participationId)
      } else {
        newSet.add(participationId)
      }
      return newSet
    })
  }

  const openCancelModal = (participationId: string, villeName: string) => {
    setCancelModal({
      isOpen: true,
      participationId,
      villeName
    })
  }

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      participationId: null,
      villeName: ''
    })
  }

  const cancelParticipation = async () => {
    if (!cancelModal.participationId || !user) {
      closeCancelModal()
      return
    }

    const participationId = cancelModal.participationId
    const villeName = cancelModal.villeName
    closeCancelModal()

    if (!user) {
      setToast({ message: 'Vous devez être connecté pour annuler une participation.', type: 'error' })
      return
    }

    try {
      console.log('🔄 Tentative d\'annulation de la participation:', { participationId, userId: user.id })
      
      // Mettre à jour le statut de la participation (sans updated_at si la colonne n'existe pas)
      const updatePayload: { status: string; updated_at?: string } = { 
        status: 'cancelled'
      }
      
      // Ajouter updated_at seulement si la colonne existe
      try {
        updatePayload.updated_at = new Date().toISOString()
      } catch (e) {
        // Ignorer si updated_at cause un problème
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('france_distri_participations')
        .update(updatePayload)
        .eq('id', participationId)
        .eq('user_id', user.id) // S'assurer que l'utilisateur ne peut annuler que ses propres participations
        .select()

      if (updateError) {
        console.error('❌ Erreur Supabase lors de l\'annulation:', updateError)
        console.error('Détails:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        throw updateError
      }

      // Vérifier que la mise à jour a bien été effectuée
      if (!updatedData || updatedData.length === 0) {
        console.error('⚠️ Aucune participation trouvée à annuler pour l\'ID:', participationId)
        // Vérifier si la participation existe
        const { data: checkData, error: checkError } = await supabase
          .from('france_distri_participations')
          .select('id, user_id, status')
          .eq('id', participationId)
          .single()
        
        console.log('Vérification de la participation:', { checkData, checkError })
        
        if (checkError || !checkData) {
          throw new Error('Participation introuvable.')
        }
        
        if (checkData.user_id !== user.id) {
          throw new Error('Vous ne pouvez annuler que vos propres participations.')
        }
        
        throw new Error('Impossible de mettre à jour la participation. Vérifiez vos permissions.')
      }

      console.log('✅ Participation annulée avec succès:', updatedData[0])

      // Mettre à jour immédiatement l'état local pour retirer la participation de la liste
      setParticipations(prev => prev.filter(p => p.id !== participationId))
      
      setToast({ 
        message: 'Votre participation a été annulée avec succès.', 
        type: 'success' 
      })
      setTimeout(() => setToast(null), 3000)

      // Recharger les participations pour s'assurer que tout est à jour
      await loadParticipations(user.id)
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'annulation:', err)
      const errorMessage = err?.message || err?.error_description || err?.details || 'Erreur inconnue'
      console.error('Détails complets de l\'erreur:', {
        message: errorMessage,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        fullError: err
      })
      setToast({ 
        message: `Erreur lors de l'annulation: ${errorMessage}. Veuillez réessayer ou contacter le support.`, 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 5000)
    }
  }

  if (loading) {
    return (
      <main>
        <Header />
        <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Chargement de vos participations...</p>
            </div>
          </div>
        </section>
        <Footer />
        <GSAPAnimations />
      </main>
    )
  }

  return (
    <main>
      <Header />
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
              marginBottom: 'var(--spacing-4xl)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--spacing-md)'
            }}>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Mon Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                  {user?.email && `Connecté en tant que ${user.email}`}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 'var(--spacing-xs)'
              }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Pour toute question urgente, appelez au
                </span>
                <a
                  href="tel:+33978288462"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'var(--orange-primary)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(251, 109, 37, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff8c42'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--orange-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 109, 37, 0.3)'
                  }}
                  title="Appeler"
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" 
                      fill="white"
                    />
                  </svg>
                  <span>09 78 28 84 62</span>
                </a>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '8px',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
                color: '#f44336',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {participations.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: 'var(--spacing-4xl)',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: 'var(--spacing-lg)' }}>
                  Vous n'avez pas encore de participations.
                </p>
                <Link href="/tournees" className="btn btn-primary">
                  Voir les tournées disponibles
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {participations.map((participation) => {
                  const isExpanded = expandedCards.has(participation.id)
                  
                  // Calculer le statut de la tournée basé sur les IRIS
                  // Un IRIS n'est annulé que si la date est passée ET qu'il n'a pas >= 3 participants
                  let tourneeStatus = participation.status
                  if (participation.isTourneePassee && participation.iris_selections) {
                    const atLeastOneIrisValide = participation.iris_selections.some(iris => (iris.participant_count || 0) >= 3)
                    
                    if (atLeastOneIrisValide && participation.iris_selections.length > 0) {
                      tourneeStatus = 'bouclee' // Au moins un IRIS est validé
                    } else if (participation.iris_selections.length > 0) {
                      tourneeStatus = 'cancelled' // Aucun IRIS n'est validé et la date est passée
                    }
                  } else if (participation.isTourneeBloquee && participation.iris_selections) {
                    // Si bloquée mais pas encore passée, vérifier si au moins un IRIS est validé
                    const atLeastOneIrisValide = participation.iris_selections.some(iris => (iris.participant_count || 0) >= 3)
                    if (atLeastOneIrisValide && participation.iris_selections.length > 0) {
                      tourneeStatus = 'bouclee' // Au moins un IRIS est validé
                    }
                    // Sinon, on garde le statut initial (en attente/en cours)
                  }
                  
                  return (
                    <div
                      key={participation.id}
                      style={{
                        background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                        borderRadius: '12px',
                        padding: 'var(--spacing-lg)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Ruban de statut de la tournée si bloquée */}
                      {participation.isTourneeBloquee && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: tourneeStatus === 'bouclee' ? '#4CAF50' : tourneeStatus === 'cancelled' ? '#F44336' : '#ff9800',
                          color: 'white',
                          padding: '6px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                          borderBottomLeftRadius: '12px',
                          borderTopRightRadius: '12px',
                          zIndex: 1
                        }}>
                          {tourneeStatus === 'bouclee' ? 'Validée' : tourneeStatus === 'cancelled' ? 'Annulée' : 'En cours'}
                        </div>
                      )}
                      {/* En-tête compact */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <h2 style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '4px',
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                          }}>
                            {participation.ville_name}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                            {participation.tournee_date_debut} - {participation.tournee_date_fin}
                          </p>
                          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Logements: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {participation.total_logements.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Coût: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {participation.cout_distribution.toFixed(2)} €
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Secteurs: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {participation.iris_selections?.length || 0}
                              </span>
                            </div>
                            {participation.isTourneePassee && participation.iris_selections && participation.iris_selections.length > 0 && (
                              <>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Validés: </span>
                                  <span style={{ color: '#4CAF50', fontSize: '16px', fontWeight: 600 }}>
                                    {participation.iris_selections.filter(iris => (iris.participant_count || 0) >= 3).length}
                                  </span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Annulés: </span>
                                  <span style={{ color: '#F44336', fontSize: '16px', fontWeight: 600 }}>
                                    {participation.iris_selections.filter(iris => (iris.participant_count || 0) < 3).length}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                          <div style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: `${statusLabels[tourneeStatus]?.color || '#666'}20`,
                            border: `1px solid ${statusLabels[tourneeStatus]?.color || '#666'}`,
                            color: statusLabels[tourneeStatus]?.color || '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                            whiteSpace: 'nowrap'
                          }}>
                            {statusLabels[tourneeStatus]?.label || tourneeStatus}
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            {(participation.status === 'pending' || participation.status === 'confirmed') && (
                              <button
                                onClick={() => openCancelModal(participation.id, participation.ville_name)}
                                style={{
                                  padding: '8px 16px',
                                  background: '#f44336',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                  transition: 'all 0.2s ease',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#d32f2f'
                                  e.currentTarget.style.transform = 'translateY(-1px)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#f44336'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                              >
                                Annuler
                              </button>
                            )}
                            <button
                              onClick={() => toggleCard(participation.id)}
                              style={{
                                padding: '8px 16px',
                                background: 'var(--orange-primary)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff8c42'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--orange-primary)'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              {isExpanded ? 'Masquer le détail' : 'Voir le détail'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Détails déroulables */}
                      <div
                        style={{
                          maxHeight: isExpanded ? '2000px' : '0',
                          overflow: 'hidden',
                          transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out',
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? 'var(--spacing-lg)' : '0'
                        }}
                      >
                        {isExpanded && (
                          <div style={{
                            paddingTop: 'var(--spacing-lg)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            {participation.has_flyer && participation.flyer_title && (
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-md)'
                              }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '4px' }}>Informations flyer</p>
                                <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                  {participation.flyer_entreprise && `${participation.flyer_entreprise} - `}
                                  {participation.flyer_title}
                                </p>
                                {participation.flyer_address_rue && (
                                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                    {participation.flyer_address_rue}, {participation.flyer_address_code_postal} {participation.flyer_address_ville}
                                  </p>
                                )}
                              </div>
                            )}

                            {participation.needs_flyer_creation && participation.flyer_format && (
                              <div style={{
                                background: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: '8px',
                                padding: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-md)'
                              }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '4px' }}>Création de flyer</p>
                                <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                                  Format : {participation.flyer_format}
                                </p>
                              </div>
                            )}

                            {participation.iris_selections && participation.iris_selections.length > 0 && (
                              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: 'var(--spacing-sm)' }}>
                                  Secteurs IRIS sélectionnés ({participation.iris_selections.length})
                                </p>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                  gap: 'var(--spacing-xs)',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  padding: 'var(--spacing-xs)',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  borderRadius: '8px'
                                }}>
                                  {participation.iris_selections.map((iris) => {
                                    const participantCount = iris.participant_count || 0
                                    const isValide = participantCount >= 3
                                    // Un IRIS est annulé seulement si la date est passée ET qu'il n'a pas >= 3 participants
                                    // Si la date n'est pas passée, l'IRIS est en cours même s'il n'a pas encore 3 participants
                                    const showStatus = participation.isTourneePassee || (participation.isTourneeBloquee && isValide)
                                    const isAnnule = participation.isTourneePassee && !isValide
                                    
                                    return (
                                      <div
                                        key={iris.id}
                                        style={{
                                          padding: '8px 12px',
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          borderRadius: '6px',
                                          fontSize: '14px',
                                          color: 'var(--text-secondary)',
                                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                          border: showStatus 
                                            ? (isValide ? '2px solid #4CAF50' : isAnnule ? '2px solid #F44336' : '1px solid rgba(255, 255, 255, 0.1)')
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {showStatus && (isValide || isAnnule) && (
                                          <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            background: isValide ? '#4CAF50' : '#F44336',
                                            color: 'white',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                            borderBottomLeftRadius: '6px',
                                            zIndex: 1
                                          }}>
                                            {isValide ? 'Validé' : 'Annulé'}
                                          </div>
                                        )}
                                        <strong style={{ 
                                          color: 'var(--text-primary)',
                                          display: 'block',
                                          paddingRight: showStatus ? '60px' : '0'
                                        }}>
                                          {iris.iris_name}
                                        </strong>
                                        {iris.logements && (
                                          <span style={{ display: 'block', marginTop: '2px', fontSize: '14px' }}>
                                            {iris.logements} logements
                                          </span>
                                        )}
                                        {showStatus && (
                                          <span style={{ 
                                            display: 'block', 
                                            marginTop: '4px', 
                                            fontSize: '12px',
                                            color: isValide ? '#4CAF50' : '#F44336',
                                            fontWeight: 600
                                          }}>
                                            {participantCount} participant{participantCount > 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <div style={{
                              fontSize: '14px',
                              color: 'var(--text-tertiary)',
                              paddingTop: 'var(--spacing-sm)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                            }}>
                              Créée le {new Date(participation.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
      <GSAPAnimations />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de confirmation d'annulation */}
      {cancelModal.isOpen && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={closeCancelModal}
          />
          
          {/* Modal */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
            borderRadius: '16px',
            padding: 'var(--spacing-xl)',
            border: '2px solid #353550',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 10001,
            maxWidth: '500px',
            width: '90%',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Icône d'avertissement */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(244, 67, 54, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F44336" 
                  strokeWidth="2"
                >
                  <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>

            {/* Titre */}
            <h2 style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              Confirmer l'annulation
            </h2>

            {/* Message */}
            <p style={{
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
              fontSize: '16px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: '1.6',
              marginBottom: 'var(--spacing-xl)'
            }}>
              Êtes-vous sûr de vouloir annuler votre participation à la tournée de <strong style={{ color: 'var(--text-primary)' }}>{cancelModal.villeName}</strong> ?
            </p>

            <p style={{
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
              fontSize: '14px',
              color: '#F44336',
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)',
              fontWeight: 600
            }}>
              ⚠️ Cette action est irréversible.
            </p>

            {/* Boutons */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              justifyContent: 'center'
            }}>
              <button
                onClick={closeCancelModal}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #52607f',
                  background: 'var(--bg-accent)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'var(--orange-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-accent)'
                  e.currentTarget.style.borderColor = '#52607f'
                }}
              >
                Annuler
              </button>
              <button
                onClick={cancelParticipation}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#F44336',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d32f2f'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(244, 67, 54, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F44336'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.4)'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </main>
  )
}


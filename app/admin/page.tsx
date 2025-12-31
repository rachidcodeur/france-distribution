'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  participation_id: string
}

interface Participation {
  id: string
  user_id: string
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
  flyer_email: string | null
  flyer_address_rue: string | null
  flyer_address_code_postal: string | null
  flyer_address_ville: string | null
  flyer_format: string | null
  needs_flyer_creation: boolean
  created_at: string
  updated_at: string
  iris_selections?: IrisSelection[]
  user_email?: string
  tournee_link?: string | null
}

interface TourneeData {
  ville_name: string
  tournee_date_debut: string
  tournee_date_fin: string
  participations: Participation[]
  irisMap: Map<string, {
    code: string
    name: string
    participants: Participation[]
    participantCount: number
  }>
  isTourneeBloquee?: boolean
  isTourneePassee?: boolean
}

const ADMIN_EMAIL = 'montes.virgile@gmail.com'
const ADMIN_PASSWORD = 'Distrimag33@'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [tournees, setTournees] = useState<TourneeData[]>([])
  const [expandedTournees, setExpandedTournees] = useState<Set<string>>(new Set())
  const [expandedIris, setExpandedIris] = useState<Set<string>>(new Set())
  const [selectedParticipation, setSelectedParticipation] = useState<Participation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Filtres
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterYear, setFilterYear] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fonction pour parser une date française
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

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase n\'est pas configuré.')
      setLoading(false)
      return
    }

    // Vérifier si l'utilisateur est déjà connecté
    supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
      if (user && user.email === ADMIN_EMAIL) {
        setUser(user)
        setAuthenticated(true)
        loadTournees()
      } else {
        setLoading(false)
      }
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      // Si la connexion échoue avec "Invalid login credentials", essayer de créer/mettre à jour le compte
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        console.log('Tentative de création/mise à jour du compte admin...')
        try {
          const createResponse = await fetch('/api/admin/create-account', {
            method: 'POST',
          })
          const createData = await createResponse.json()
          
          if (!createResponse.ok) {
            throw new Error(createData.error || 'Erreur lors de la création du compte')
          }

          // Attendre un peu puis réessayer la connexion
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          })

          if (retryError) {
            throw retryError
          }

          if (retryData && retryData.user && retryData.user.email === ADMIN_EMAIL) {
            setUser(retryData.user)
            setAuthenticated(true)
            setToast({ message: 'Compte créé et connexion réussie !', type: 'success' })
            loadTournees()
            return
          }
        } catch (createErr: any) {
          console.error('Erreur lors de la création du compte:', createErr)
          throw new Error(createErr.message || 'Impossible de créer le compte admin. Vérifiez votre configuration Supabase.')
        }
      } else if (signInError) {
        throw signInError
      }

      if (data && data.user && data.user.email === ADMIN_EMAIL) {
        setUser(data.user)
        setAuthenticated(true)
        setToast({ message: 'Connexion réussie !', type: 'success' })
        loadTournees()
      } else {
        throw new Error('Accès non autorisé. Seul l\'email admin est autorisé.')
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err)
      const errorMessage = err.message || 'Erreur lors de la connexion'
      setError(errorMessage)
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadTournees = async () => {
    try {
      setLoading(true)
      setError(null)

      // Récupérer toutes les participations actives
      const { data: participationsData, error: participationsError } = await supabase
        .from('france_distri_participations')
        .select('*')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (participationsError) {
        throw participationsError
      }

      if (!participationsData || participationsData.length === 0) {
        setTournees([])
        setLoading(false)
        return
      }

      // Récupérer les emails des utilisateurs via l'API admin
      const userEmailMap = new Map<string, string>()
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const emails = await response.json()
          Object.entries(emails).forEach(([userId, email]) => {
            userEmailMap.set(userId, email as string)
          })
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des emails:', err)
      }
      
      // Par défaut, mettre 'Email non disponible' pour les utilisateurs non trouvés
      participationsData.forEach(p => {
        if (!userEmailMap.has(p.user_id)) {
          userEmailMap.set(p.user_id, 'Email non disponible')
        }
      })

      // Récupérer les sélections d'IRIS
      const participationIds = participationsData.map(p => p.id)
      const { data: irisData, error: irisError } = await supabase
        .from('france_distri_iris_selections')
        .select('*')
        .in('participation_id', participationIds)
        .order('created_at', { ascending: true })

      if (irisError) {
        console.error('Erreur lors de la récupération des IRIS:', irisError)
      }

      // Fonction pour vérifier si une tournée est en cours (pas encore passée)
      const isTourneeEnCours = (dateDebutStr: string): boolean => {
        const dateDebut = parseFrenchDate(dateDebutStr)
        if (!dateDebut) return false
        const aujourdhui = new Date()
        aujourdhui.setHours(0, 0, 0, 0)
        return dateDebut >= aujourdhui
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

      // Grouper les participations par tournée
      const tourneesMap = new Map<string, Participation[]>()
      
      participationsData.forEach(participation => {
        const key = `${participation.ville_name}|${participation.tournee_date_debut}`
        if (!tourneesMap.has(key)) {
          tourneesMap.set(key, [])
        }
        tourneesMap.get(key)!.push({
          ...participation,
          iris_selections: irisData?.filter(iris => iris.participation_id === participation.id) || [],
          user_email: userEmailMap.get(participation.user_id) || 'Email non disponible'
        })
      })

      // Convertir en tableau (charger toutes les tournées, pas seulement celles en cours)
      const tourneesData: TourneeData[] = []
      
      tourneesMap.forEach((participations, key) => {
        const [villeName, dateDebut] = key.split('|')
        
        // Charger toutes les tournées (on filtrera ensuite avec les filtres)
        // Créer une map des IRIS avec leurs participants
          const irisMap = new Map<string, {
            code: string
            name: string
            participants: Participation[]
            participantCount: number
          }>()

          participations.forEach(participation => {
            participation.iris_selections?.forEach(iris => {
              const irisKey = iris.iris_code
              if (!irisMap.has(irisKey)) {
                irisMap.set(irisKey, {
                  code: iris.iris_code,
                  name: iris.iris_name,
                  participants: [],
                  participantCount: 0
                })
              }
              const irisData = irisMap.get(irisKey)!
              if (!irisData.participants.find(p => p.id === participation.id)) {
                irisData.participants.push(participation)
                irisData.participantCount = irisData.participants.length
              }
            })
          })

          tourneesData.push({
            ville_name: villeName,
            tournee_date_debut: dateDebut,
            tournee_date_fin: participations[0].tournee_date_fin,
            participations,
            irisMap,
            isTourneeBloquee: isTourneeBloquee(dateDebut),
            isTourneePassee: isTourneePassee(dateDebut)
          })
      })

      // Trier par date de début
      tourneesData.sort((a, b) => {
        const dateA = parseFrenchDate(a.tournee_date_debut)
        const dateB = parseFrenchDate(b.tournee_date_debut)
        if (!dateA || !dateB) return 0
        return dateA.getTime() - dateB.getTime()
      })

      setTournees(tourneesData)
    } catch (err: any) {
      console.error('Erreur lors du chargement des tournées:', err)
      setError('Erreur lors du chargement des tournées.')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour calculer le statut d'une tournée
  const calculateTourneeStatus = (tournee: TourneeData): string => {
    const irisArray = Array.from(tournee.irisMap.values())
    const atLeastOneIrisValide = irisArray.some(iris => iris.participantCount >= 3)
    
    if (tournee.isTourneePassee) {
      return atLeastOneIrisValide ? 'Validée' : 'Annulée'
    } else if (tournee.isTourneeBloquee) {
      return atLeastOneIrisValide ? 'Validée' : 'En attente'
    }
    
    // Vérifier si la tournée est bouclée (5 participants)
    const maxParticipants = 5
    if (tournee.participations.length >= maxParticipants) {
      return 'Bouclée'
    }
    
    return 'En attente'
  }

  // Fonction pour filtrer les tournées
  const filteredTournees = tournees.filter(tournee => {
    // Filtre par mois et année
    if (filterMonth || filterYear) {
      const dateDebut = parseFrenchDate(tournee.tournee_date_debut)
      if (dateDebut) {
        if (filterMonth && (dateDebut.getMonth() + 1).toString() !== filterMonth) {
          return false
        }
        if (filterYear && dateDebut.getFullYear().toString() !== filterYear) {
          return false
        }
      } else {
        return false
      }
    }

    // Filtre par statut
    if (filterStatus) {
      const status = calculateTourneeStatus(tournee)
      if (filterStatus === 'En attente' && status !== 'En attente') return false
      if (filterStatus === 'Bouclée' && status !== 'Bouclée') return false
      if (filterStatus === 'Validée' && status !== 'Validée') return false
      if (filterStatus === 'Annulée' && status !== 'Annulée') return false
    }

    // Filtre par recherche (ville ou client)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesVille = tournee.ville_name.toLowerCase().includes(query)
      const matchesClient = tournee.participations.some(p => {
        const clientName = (p.flyer_entreprise || p.user_email || '').toLowerCase()
        return clientName.includes(query)
      })
      if (!matchesVille && !matchesClient) {
        return false
      }
    }

    return true
  })

  const toggleTournee = (key: string) => {
    setExpandedTournees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const toggleIris = (key: string) => {
    setExpandedIris(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthenticated(false)
    setUser(null)
    setTournees([])
    router.push('/')
  }

  const openParticipantModal = (participation: Participation) => {
    setSelectedParticipation(participation)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedParticipation(null)
  }

  if (!authenticated) {
    return (
      <main>
        <Header />
        <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
          <div className="container">
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: '48px 40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '32px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Espace Administrateur
                </h1>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {error && (
                    <div style={{
                      background: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      color: '#f44336',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      {error}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--orange-primary)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--orange-primary)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      borderRadius: '8px',
                      background: 'var(--orange-primary)',
                      border: 'none',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      transition: 'all 0.2s ease',
                      opacity: loading ? 0.7 : 1,
                      marginTop: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = '#e85a1a'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = 'var(--orange-primary)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
        <Footer />
        <GSAPAnimations />
      </main>
    )
  }

  if (loading && tournees.length === 0) {
    return (
      <main>
        <Header />
        <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Chargement des tournées...</p>
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
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
              flexWrap: 'wrap',
              gap: 'var(--spacing-md)'
            }}>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Administration
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                  Gestion des tournées en cours
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#f44336',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d32f2f'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f44336'
                }}
              >
                Déconnexion
              </button>
            </div>

            {error && (
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '8px',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-sm)',
                color: '#f44336',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Filtres */}
            <div style={{
              background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
              borderRadius: '12px',
              padding: 'var(--spacing-lg)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: 'var(--spacing-lg)',
              marginTop: '0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Filtres de recherche
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}>
                  <span style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    marginBottom: '4px'
                  }}>
                    Chiffre d'affaires total
                  </span>
                  <span style={{
                    color: 'var(--orange-primary)',
                    fontSize: '24px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    {filteredTournees.reduce((total, tournee) => {
                      return total + tournee.participations.reduce((sum, participation) => {
                        return sum + (participation.cout_distribution || 0)
                      }, 0)
                    }, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                  </span>
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                {/* Recherche */}
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Recherche (ville/client)
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}
                  />
                </div>

                {/* Mois */}
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Mois
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Tous les mois</option>
                    <option value="1">Janvier</option>
                    <option value="2">Février</option>
                    <option value="3">Mars</option>
                    <option value="4">Avril</option>
                    <option value="5">Mai</option>
                    <option value="6">Juin</option>
                    <option value="7">Juillet</option>
                    <option value="8">Août</option>
                    <option value="9">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>

                {/* Année */}
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Année
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Toutes les années</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = 2025 + i
                      return (
                        <option key={year} value={year.toString()}>{year}</option>
                      )
                    })}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Statut
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="En attente">En attente</option>
                    <option value="Bouclée">Bouclée</option>
                    <option value="Validée">Validée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredTournees.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: 'var(--spacing-4xl)',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
                  Aucune tournée en cours
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {filteredTournees.map((tournee) => {
                  const tourneeKey = `${tournee.ville_name}|${tournee.tournee_date_debut}`
                  const isExpanded = expandedTournees.has(tourneeKey)
                  
                  // Calculer le statut de la tournée
                  const tourneeStatus = calculateTourneeStatus(tournee)
                  const tourneeStatusColor = 
                    tourneeStatus === 'Validée' ? '#4CAF50' :
                    tourneeStatus === 'Bouclée' ? '#2196F3' :
                    tourneeStatus === 'Annulée' ? '#F44336' :
                    '#ff9800' // En attente

                  // Calculer le chiffre d'affaires de la tournée
                  const chiffreAffaires = tournee.participations.reduce((total, participation) => {
                    return total + (participation.cout_distribution || 0)
                  }, 0)

                  // Pour l'affichage des IRIS validés/annulés
                  const irisArray = Array.from(tournee.irisMap.values())

                  return (
                    <div
                      key={tourneeKey}
                      style={{
                        background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                        borderRadius: '12px',
                        padding: 'var(--spacing-lg)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        position: 'relative'
                      }}
                    >
                      {/* Ruban de statut */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: tourneeStatusColor,
                        color: 'white',
                        padding: '6px 16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        borderBottomLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                        zIndex: 1
                      }}>
                        {tourneeStatus}
                      </div>

                      {/* En-tête */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div style={{ flex: 1, minWidth: '200px', paddingRight: '120px' }}>
                          <h2 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                          }}>
                            {tournee.ville_name}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                            {tournee.tournee_date_debut} - {tournee.tournee_date_fin}
                          </p>
                          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Participants: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {tournee.participations.length}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Secteurs IRIS: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {tournee.irisMap.size}
                              </span>
                            </div>
                            {tournee.isTourneePassee && (
                              <>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>IRIS validés: </span>
                                  <span style={{ color: '#4CAF50', fontSize: '16px', fontWeight: 600 }}>
                                    {irisArray.filter(iris => iris.participantCount >= 3).length}
                                  </span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>IRIS annulés: </span>
                                  <span style={{ color: '#F44336', fontSize: '16px', fontWeight: 600 }}>
                                    {irisArray.filter(iris => iris.participantCount < 3).length}
                                  </span>
                                </div>
                              </>
                            )}
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Chiffre d'affaires: </span>
                              <span style={{ color: 'var(--orange-primary)', fontSize: '18px', fontWeight: 700 }}>
                                {chiffreAffaires.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleTournee(tourneeKey)}
                          style={{
                            padding: '10px 20px',
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
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--orange-primary)'
                          }}
                        >
                          {isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                        </button>
                      </div>

                      {/* Détails déroulables */}
                      <div
                        style={{
                          maxHeight: isExpanded ? '5000px' : '0',
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
                            {/* Liste des IRIS */}
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                              <h3 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--spacing-md)',
                                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                              }}>
                                Secteurs IRIS ({tournee.irisMap.size})
                              </h3>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--spacing-md)'
                              }}>
                                {Array.from(tournee.irisMap.values()).map((iris) => {
                                  const irisKey = `${tourneeKey}|${iris.code}`
                                  const isIrisExpanded = expandedIris.has(irisKey)
                                  const isValide = iris.participantCount >= 3
                                  // Un IRIS est annulé seulement si la date est passée ET qu'il n'a pas >= 3 participants
                                  // Si la date n'est pas passée, l'IRIS est en cours même s'il n'a pas encore 3 participants
                                  const showStatus = tournee.isTourneePassee || (tournee.isTourneeBloquee && isValide)
                                  const isAnnule = tournee.isTourneePassee && !isValide
                                  
                                  return (
                                    <div
                                      key={iris.code}
                                      style={{
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        borderRadius: '8px',
                                        padding: 'var(--spacing-md)',
                                        border: showStatus 
                                          ? (isValide ? '2px solid #4CAF50' : isAnnule ? '2px solid #F44336' : '1px solid rgba(255, 255, 255, 0.1)')
                                          : '1px solid rgba(255, 255, 255, 0.1)',
                                        position: 'relative'
                                      }}
                                    >
                                      {/* Ruban de statut IRIS - seulement si la date est passée ou si validé */}
                                      {showStatus && (isValide || isAnnule) && (
                                        <div style={{
                                          position: 'absolute',
                                          top: 0,
                                          right: 0,
                                          background: isValide ? '#4CAF50' : '#F44336',
                                          color: 'white',
                                          padding: '4px 12px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                          borderBottomLeftRadius: '8px',
                                          borderTopRightRadius: '8px',
                                          zIndex: 1
                                        }}>
                                          {isValide ? 'Validé' : 'Annulé'}
                                        </div>
                                      )}

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                                        <div style={{ flex: 1, paddingRight: showStatus ? '80px' : '0' }}>
                                          <h4 style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            marginBottom: '8px',
                                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                                          }}>
                                            {iris.name}
                                          </h4>
                                          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                                            <div>
                                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Code: </span>
                                              <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                                                {iris.code}
                                              </span>
                                            </div>
                                            <div>
                                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Participants: </span>
                                              <span style={{ 
                                                color: isValide ? '#4CAF50' : '#F44336', 
                                                fontSize: '16px', 
                                                fontWeight: 700 
                                              }}>
                                                {iris.participantCount} / 5
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => toggleIris(irisKey)}
                                          style={{
                                            padding: '8px 16px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'nowrap'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                                          }}
                                        >
                                          {isIrisExpanded ? 'Masquer' : 'Voir participants'}
                                        </button>
                                      </div>

                                      {/* Liste des participants pour cet IRIS */}
                                      <div
                                        style={{
                                          maxHeight: isIrisExpanded ? '1000px' : '0',
                                          overflow: 'hidden',
                                          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out',
                                          opacity: isIrisExpanded ? 1 : 0,
                                          marginTop: isIrisExpanded ? 'var(--spacing-md)' : '0'
                                        }}
                                      >
                                        {isIrisExpanded && (
                                          <div style={{
                                            paddingTop: 'var(--spacing-md)',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                                          }}>
                                            {iris.participants.length === 0 ? (
                                              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: 'var(--spacing-md)' }}>
                                                Aucun participant pour ce secteur
                                              </p>
                                            ) : (
                                              <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                                gap: 'var(--spacing-md)'
                                              }}>
                                                {iris.participants.map((participation) => (
                                                  <div
                                                    key={participation.id}
                                                    style={{
                                                      background: 'rgba(255, 255, 255, 0.05)',
                                                      borderRadius: '8px',
                                                      padding: 'var(--spacing-md)',
                                                      border: '1px solid rgba(255, 255, 255, 0.1)'
                                                    }}
                                                  >
                                                    <div style={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: '8px',
                                                      marginBottom: 'var(--spacing-sm)',
                                                      color: 'var(--orange-primary)',
                                                      fontSize: '16px',
                                                      fontWeight: 600,
                                                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                                                    }}>
                                                      <svg 
                                                        width="18" 
                                                        height="18" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2"
                                                      >
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                      </svg>
                                                      <span>Participant</span>
                                                    </div>
                                                    <div style={{
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      gap: '6px',
                                                      fontSize: '14px',
                                                      color: 'var(--text-primary)',
                                                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                                                    }}>
                                                      <div>
                                                        <strong style={{ color: 'var(--text-tertiary)' }}>Email: </strong>
                                                        <a 
                                                          href={`mailto:${participation.user_email}`}
                                                          style={{
                                                            color: 'var(--orange-primary)',
                                                            textDecoration: 'none'
                                                          }}
                                                          onMouseEnter={(e) => {
                                                            e.currentTarget.style.textDecoration = 'underline'
                                                          }}
                                                          onMouseLeave={(e) => {
                                                            e.currentTarget.style.textDecoration = 'none'
                                                          }}
                                                        >
                                                          {participation.user_email}
                                                        </a>
                                                      </div>
                                                      {participation.flyer_entreprise && (
                                                        <div>
                                                          <strong style={{ color: 'var(--text-tertiary)' }}>Entreprise: </strong>
                                                          <span>{participation.flyer_entreprise}</span>
                                                        </div>
                                                      )}
                                                      {participation.flyer_email && (
                                                        <div>
                                                          <strong style={{ color: 'var(--text-tertiary)' }}>Email: </strong>
                                                          <a 
                                                            href={`mailto:${participation.flyer_email}`}
                                                            style={{ 
                                                              color: 'var(--orange-primary)', 
                                                              textDecoration: 'none' 
                                                            }}
                                                            onMouseEnter={(e) => {
                                                              e.currentTarget.style.textDecoration = 'underline'
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              e.currentTarget.style.textDecoration = 'none'
                                                            }}
                                                          >
                                                            {participation.flyer_email}
                                                          </a>
                                                        </div>
                                                      )}
                                                      {participation.flyer_title && (
                                                        <div>
                                                          <strong style={{ color: 'var(--text-tertiary)' }}>Titre: </strong>
                                                          <span>{participation.flyer_title}</span>
                                                        </div>
                                                      )}
                                                      {participation.flyer_address_rue && (
                                                        <div>
                                                          <strong style={{ color: 'var(--text-tertiary)' }}>Adresse: </strong>
                                                          <span>
                                                            {participation.flyer_address_rue}, {participation.flyer_address_code_postal} {participation.flyer_address_ville}
                                                          </span>
                                                        </div>
                                                      )}
                                                      <div>
                                                        <strong style={{ color: 'var(--text-tertiary)' }}>Logements: </strong>
                                                        <span>{participation.total_logements.toLocaleString()}</span>
                                                      </div>
                                                      <div>
                                                        <strong style={{ color: 'var(--text-tertiary)' }}>Coût: </strong>
                                                        <span>{participation.cout_distribution.toFixed(2)} €</span>
                                                      </div>
                                                      <div style={{
                                                        marginTop: '8px',
                                                        paddingTop: '8px',
                                                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)'
                                                      }}>
                                                        Inscrit le {new Date(participation.created_at).toLocaleDateString('fr-FR', {
                                                          day: 'numeric',
                                                          month: 'long',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                        })}
                                                      </div>
                                                      <button
                                                        onClick={() => openParticipantModal(participation)}
                                                        style={{
                                                          marginTop: '12px',
                                                          padding: '8px 16px',
                                                          background: 'var(--orange-primary)',
                                                          border: 'none',
                                                          borderRadius: '6px',
                                                          color: 'white',
                                                          fontSize: '13px',
                                                          fontWeight: 600,
                                                          cursor: 'pointer',
                                                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                                          transition: 'all 0.2s ease',
                                                          width: '100%'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                          e.currentTarget.style.background = '#e85a1a'
                                                          e.currentTarget.style.transform = 'translateY(-1px)'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                          e.currentTarget.style.background = 'var(--orange-primary)'
                                                          e.currentTarget.style.transform = 'translateY(0)'
                                                        }}
                                                      >
                                                        Voir tous les détails
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
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

      {/* Modal de détails du participant */}
      {isModalOpen && selectedParticipation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
              </svg>
            </button>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '24px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              paddingRight: '40px'
            }}>
              Détails du participant
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Informations de contact */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Informations de contact
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Email</strong>
                    <a 
                      href={`mailto:${selectedParticipation.user_email}`}
                      style={{
                        color: 'var(--orange-primary)',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none'
                      }}
                    >
                      {selectedParticipation.user_email}
                    </a>
                  </div>
                  {selectedParticipation.flyer_entreprise && (
                    <div>
                      <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Entreprise</strong>
                      <span style={{ fontSize: '16px' }}>{selectedParticipation.flyer_entreprise}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations du flyer */}
              {(selectedParticipation.flyer_title || selectedParticipation.flyer_format) && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    Informations du flyer
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    {selectedParticipation.flyer_title && (
                      <div>
                        <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Titre du flyer</strong>
                        <span style={{ fontSize: '16px' }}>{selectedParticipation.flyer_title}</span>
                      </div>
                    )}
                    {selectedParticipation.flyer_format && (
                      <div>
                        <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Format sélectionné</strong>
                        <span style={{ fontSize: '16px', fontWeight: 500 }}>{selectedParticipation.flyer_format}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Adresse de récupération */}
              {selectedParticipation.flyer_address_rue && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    Adresse de récupération
                  </h3>
                  <div style={{
                    fontSize: '16px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    lineHeight: '1.6'
                  }}>
                    {selectedParticipation.flyer_address_rue}<br />
                    {selectedParticipation.flyer_address_code_postal} {selectedParticipation.flyer_address_ville}
                  </div>
                </div>
              )}

              {/* Informations de la participation */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Informations de la participation
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Ville</strong>
                    <span style={{ fontSize: '16px' }}>{selectedParticipation.ville_name}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Dates</strong>
                    <span style={{ fontSize: '16px' }}>{selectedParticipation.tournee_date_debut} - {selectedParticipation.tournee_date_fin}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Logements</strong>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedParticipation.total_logements.toLocaleString()}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Coût</strong>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange-primary)' }}>{selectedParticipation.cout_distribution.toFixed(2)} €</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Statut</strong>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: selectedParticipation.status === 'bouclee' ? 'rgba(76, 175, 80, 0.2)' : selectedParticipation.status === 'cancelled' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                      color: selectedParticipation.status === 'bouclee' ? '#4CAF50' : selectedParticipation.status === 'cancelled' ? '#F44336' : '#ff9800',
                      display: 'inline-block'
                    }}>
                      {selectedParticipation.status === 'bouclee' ? 'Validée' : selectedParticipation.status === 'cancelled' ? 'Annulée' : 'En attente'}
                    </span>
                  </div>
                  {selectedParticipation.iris_selections && selectedParticipation.iris_selections.length > 0 && (
                    <div>
                      <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Secteurs IRIS</strong>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedParticipation.iris_selections.length}</span>
                    </div>
                  )}
                  {selectedParticipation.tournee_link && (
                    <div>
                      <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Lien de la tournée</strong>
                      <a
                        href={selectedParticipation.tournee_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '16px',
                          color: 'var(--orange-primary)',
                          textDecoration: 'none',
                          wordBreak: 'break-all'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        {selectedParticipation.tournee_link}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des secteurs IRIS */}
              {selectedParticipation.iris_selections && selectedParticipation.iris_selections.length > 0 && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    Secteurs IRIS sélectionnés ({selectedParticipation.iris_selections.length})
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {selectedParticipation.iris_selections.map((iris) => (
                      <div
                        key={iris.id}
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{iris.iris_name}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                          Code: {iris.iris_code} {iris.logements && `• ${iris.logements} logements`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}


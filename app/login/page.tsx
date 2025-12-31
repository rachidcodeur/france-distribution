'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'
import Toast from '@/components/Toast'

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

export default function LoginPage() {
  const router = useRouter()
  const [storedData, setStoredData] = useState<StoredSelection | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const hasSavedRef = useRef(false) // Ref pour éviter le double comptage (plus fiable que useState)
  const savingRef = useRef(false) // Ref pour éviter les appels concurrents

  // Charger les données depuis localStorage au montage (si disponibles)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('pendingSelection')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setStoredData(data)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }
  }, [])

  const handleSave = useCallback(async (user: User) => {
    // Vérifier avec les refs AVANT de commencer
    if (hasSavedRef.current || savingRef.current) {
      console.log('⏳ Sauvegarde déjà en cours ou déjà effectuée (ref)...')
      return false
    }

    if (!storedData) {
      console.log('⚠️ Aucune donnée à sauvegarder')
      return false
    }

    // Marquer immédiatement pour éviter les appels concurrents
    savingRef.current = true
    hasSavedRef.current = true
    setSaving(true)
    console.log('💾 Début de la sauvegarde...')

    try {
      // Calculer le coût d'impression si nécessaire
      const calculatePrintingCost = () => {
        if (storedData.hasFlyer) {
          return 0 // Pas de coût d'impression si le client a déjà un flyer
        }
        if (!storedData.selectedFlyerFormat) {
          return 0
        }
        const costPerUnit = storedData.selectedFlyerFormat === 'A5' ? 0.15 : 0.12
        return storedData.totalLogements * costPerUnit
      }

      const coutImpression = calculatePrintingCost()

      // Créer la participation
      const participationData: any = {
        user_id: user.id,
        ville_name: storedData.villeName,
        tournee_date_debut: storedData.tourneeDateDebut,
        tournee_date_fin: storedData.tourneeDateFin,
        tournee_index: storedData.tourneeIndex,
        total_logements: Math.round(storedData.totalLogements),
        cout_distribution: storedData.coutDistribution,
        has_flyer: storedData.hasFlyer || false,
        needs_flyer_creation: !storedData.hasFlyer || false,
        tournee_link: `/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`
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

      const { data: participation, error: participationError } = await supabase
        .from('france_distri_participations')
        .insert(participationData)
        .select()
        .single()

      if (participationError) {
        console.error('❌ Erreur lors de la création de la participation:', participationError)
        throw participationError
      }

      const typedParticipation = participation as { id: string; [key: string]: any }
      console.log('✅ Participation créée:', typedParticipation.id)

      // Créer les sélections d'IRIS
      const irisSelections = storedData.selectedIris.map(iris => ({
        participation_id: typedParticipation.id,
        iris_code: iris.code,
        iris_name: iris.name,
        logements: iris.logements ? Math.round(iris.logements) : null
      }))

      // @ts-ignore - TypeScript ne peut pas inférer correctement le type de la table Supabase
      const { error: irisError } = await (supabase as any)
        .from('france_distri_iris_selections')
        .insert(irisSelections)

      if (irisError) {
        console.error('❌ Erreur lors de la création des sélections IRIS:', irisError)
        throw irisError
      }

      console.log('✅ Sélections IRIS créées')

      // Nettoyer localStorage
      localStorage.removeItem('pendingSelection')

      // Afficher toast de succès et rediriger vers le dashboard
      setToast({ message: 'Votre participation a été enregistrée avec succès !', type: 'success' })
      setTimeout(() => {
        router.push('/dashboard?success=true')
      }, 1500)
      return true
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde:', err)
      // Réinitialiser les flags en cas d'erreur pour permettre une nouvelle tentative
      hasSavedRef.current = false
      savingRef.current = false
      setError('Erreur lors de la sauvegarde de votre sélection. Veuillez réessayer.')
      return false
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }, [storedData, router])

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase non configuré, authentification désactivée')
      return
    }

    const checkUserAndSave = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur:', userError)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_authenticated', 'false')
        }
        return
      }

      if (user) {
        console.log('✅ Utilisateur déjà connecté:', user.id)
        setUser(user)
        // Mettre à jour le cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_authenticated', 'true')
        }
        
        // Si déjà connecté et qu'on a des données à sauvegarder, sauvegarder directement
        if (storedData && !hasSavedRef.current && !savingRef.current) {
          console.log('💾 Données trouvées, sauvegarde automatique...')
          const saved = await handleSave(user)
          if (saved) {
            console.log('✅ Données sauvegardées avec succès')
          } else {
            console.error('❌ Échec de la sauvegarde')
          }
        } else if (!storedData) {
          // Sinon, rediriger vers le dashboard
          console.log('⚠️ Aucune donnée à sauvegarder, redirection vers le dashboard')
          router.push('/dashboard')
        }
      } else {
        // Pas d'utilisateur, mettre à jour le cache
        console.log('⚠️ Aucun utilisateur connecté')
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_authenticated', 'false')
        }
      }
    }

    checkUserAndSave()

    // Ne pas écouter onAuthStateChange pour éviter les doubles appels
    // La sauvegarde se fera directement dans handleSubmit après signUp/signIn
  }, [router, storedData, handleSave])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!isSupabaseConfigured()) {
      setError('Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement.')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        // Validation de l'email de confirmation
        if (email !== confirmEmail) {
          setError('Les adresses email ne correspondent pas.')
          setLoading(false)
          return
        }

        // Validation du mot de passe
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères.')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.')
          setLoading(false)
          return
        }

        // Inscription - sans confirmation d'email
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: email.split('@')[0]
            }
          }
        })

        if (signUpError) throw signUpError

        if (data.user) {
          console.log('✅ Compte créé, user ID:', data.user.id)
          console.log('📋 Session disponible immédiatement:', !!data.session)
          console.log('📧 Email confirmé:', data.user.email_confirmed_at ? 'Oui' : 'Non')
          
          // Si une session est disponible immédiatement (email confirmation désactivé)
          if (data.session && data.session.user) {
            console.log('✅ Session disponible immédiatement, sauvegarde...')
            
            // Mettre à jour le cache d'authentification
            if (typeof window !== 'undefined') {
              localStorage.setItem('user_authenticated', 'true')
            }
            
            // Sauvegarder directement si on a des données
            if (storedData && !hasSavedRef.current && !savingRef.current) {
              const saved = await handleSave(data.session.user)
              if (!saved) {
                setLoading(false)
                return
              }
            } else {
              // Pas de données à sauvegarder, rediriger vers le dashboard
              setToast({ message: 'Compte créé avec succès !', type: 'success' })
              setTimeout(() => {
                router.push('/dashboard')
              }, 1500)
            }
          } else {
            // Pas de session immédiate - normalement cela ne devrait pas arriver si la confirmation d'email est désactivée
            // Mais on gère ce cas au cas où
            console.log('⏳ Pas de session immédiate, tentative de récupération...')
            
            // Attendre un peu et réessayer
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            
            if (retrySession && retrySession.user) {
              console.log('✅ Session récupérée après attente')
              if (storedData && !hasSavedRef.current && !savingRef.current) {
                const saved = await handleSave(retrySession.user)
                if (!saved) {
                  setLoading(false)
                  return
                }
              } else {
                setToast({ message: 'Compte créé avec succès !', type: 'success' })
                setTimeout(() => {
                  router.push('/dashboard')
                }, 1500)
              }
            } else {
              // Si vraiment pas de session, informer l'utilisateur
              setMessage('✅ Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.')
              setLoading(false)
            }
          }
        }
      } else {
        // Connexion
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.user && data.session) {
          console.log('✅ Connexion réussie')
          
          // Mettre à jour le cache d'authentification
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_authenticated', 'true')
          }
          
          // Sauvegarder directement si on a des données
          if (storedData && !hasSavedRef.current && !savingRef.current) {
            const saved = await handleSave(data.user)
            if (!saved) {
              setLoading(false)
              return
            }
          } else {
            // Pas de données à sauvegarder, rediriger vers le dashboard
            setToast({ message: 'Connexion réussie !', type: 'success' })
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
          }
        }
      }
    } catch (err: any) {
      console.error('❌ Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  // Si l'utilisateur est connecté et qu'il n'y a pas de données à sauvegarder, rediriger
  useEffect(() => {
    if (user && !storedData && !loading) {
      router.push('/dashboard')
    }
  }, [user, storedData, loading, router])

  return (
    <main>
      <Header />
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
              borderRadius: '16px',
              padding: '70px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-lg)',
                textAlign: 'center',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}>
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </h1>

              {error && (
                <div style={{
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  color: '#f44336',
                  fontSize: '14px',
                  whiteSpace: 'pre-line'
                }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  color: '#4caf50',
                  fontSize: '14px',
                  whiteSpace: 'pre-line'
                }}>
                  {message}
                </div>
              )}

              {saving && (
                <div style={{
                  background: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  color: '#2196f3',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  💾 Sauvegarde de votre sélection en cours...
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label htmlFor="email" style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onCopy={(e) => isSignUp && e.preventDefault()}
                    onPaste={(e) => isSignUp && e.preventDefault()}
                    onCut={(e) => isSignUp && e.preventDefault()}
                    required
                    disabled={loading || saving}
                    className="input-placeholder-white"
                    style={{
                      width: '100%',
                      padding: '12px 12px',
                      background: '#222b44',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      transition: 'all 0.25s ease'
                    }}
                    placeholder="votre@email.com"
                  />
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label htmlFor="confirmEmail" style={{
                      display: 'block',
                      marginBottom: 'var(--spacing-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Confirmer l'email
                    </label>
                    <input
                      id="confirmEmail"
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      required
                      disabled={loading || saving}
                      className="input-placeholder-white"
                      style={{
                        width: '100%',
                        padding: '12px 12px',
                        background: '#222b44',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.25s ease'
                      }}
                      placeholder="votre@email.com"
                    />
                  </div>
                )}

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label htmlFor="password" style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || saving}
                      className="input-placeholder-white"
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        background: '#222b44',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.25s ease'
                      }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label htmlFor="confirmPassword" style={{
                      display: 'block',
                      marginBottom: 'var(--spacing-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Confirmer le mot de passe
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={isSignUp}
                        disabled={loading || saving}
                        className="input-placeholder-white"
                        style={{
                          width: '100%',
                          padding: '12px 40px 12px 12px',
                          background: '#222b44',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '16px',
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                          transition: 'all 0.25s ease'
                        }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || saving}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    marginBottom: 'var(--spacing-md)',
                    opacity: (loading || saving) ? 0.6 : 1,
                    cursor: (loading || saving) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Chargement...' : saving ? 'Sauvegarde...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
                </button>

                <div style={{
                  textAlign: 'center',
                  paddingTop: 'var(--spacing-md)',
                  borderTop: '1px solid #52607f'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setConfirmEmail('')
                      setError(null)
                      setMessage(null)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--orange-primary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textDecoration: 'underline',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}
                  >
                    {isSignUp 
                      ? 'Déjà un compte ? Se connecter'
                      : 'Pas encore de compte ? Créer un compte'}
                  </button>
                </div>
              </form>
            </div>
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
    </main>
  )
}


'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '../../../../../../../../lib/supabase'
import type { User } from '@supabase/supabase-js'
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
  flyerType?: 'A5' | 'A6' | 'catalogue supermarché' | null
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
  const hasSavedRef = useRef(false) // Ref pour éviter le double comptage
  const savingRef = useRef(false) // Ref pour éviter les appels concurrents

  const getAuthErrorMessage = (err: any, fallback = 'Une erreur est survenue. Veuillez réessayer.') => {
    const message = String(err?.message || err?.error_description || '').toLowerCase()

    if (message.includes('invalid login credentials')) {
      return 'Email ou mot de passe incorrect.'
    }
    if (message.includes('email not confirmed')) {
      return 'Veuillez confirmer votre adresse email avant de vous connecter.'
    }
    if (message.includes('user already registered') || message.includes('email already')) {
      return 'Un compte existe déjà avec cette adresse email.'
    }
    if (message.includes('password should be at least')) {
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    }
    if (message.includes('invalid email')) {
      return 'Adresse email invalide.'
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Trop de tentatives. Veuillez réessayer plus tard.'
    }
    if (message.includes('signup disabled')) {
      return 'Les inscriptions sont désactivées pour le moment.'
    }

    return fallback
  }

  const isValidEmail = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return false
    if (trimmed.length > 254) return false
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!basic) return false
    if (trimmed.includes('..')) return false
    return true
  }

  const showErrorToast = (message: string) => {
    setToast({ message, type: 'error' })
    setTimeout(() => setToast(null), 4000)
  }

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

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase non configuré, authentification désactivée')
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        // Si déjà connecté, sauvegarder directement (seulement si pas déjà sauvegardé)
        if (storedData && !hasSavedRef.current && !savingRef.current) {
          handleSave(user)
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Événement auth:', event, 'Session:', !!session)
      if (session?.user) {
        setUser(session.user)
        // Sauvegarder après connexion (seulement si on a des données à sauvegarder et pas déjà sauvegardé)
        // Cela gère le cas où l'utilisateur se connecte après confirmation d'email
        if (storedData && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && !hasSavedRef.current && !savingRef.current) {
          console.log('💾 Sauvegarde automatique après connexion...')
          try {
            await handleSave(session.user)
          } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde automatique:', error)
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [storedData])

  const handleSave = async (user: User) => {
    // Vérifier avec les refs AVANT de commencer
    if (hasSavedRef.current || savingRef.current) {
      console.log('⏳ Sauvegarde déjà en cours ou déjà effectuée (ref)...')
      return
    }

    if (!storedData || !user || !user.id) {
      console.log('⚠️ Données manquantes pour la sauvegarde')
      return
    }

    // Marquer immédiatement pour éviter les appels concurrents
    savingRef.current = true
    hasSavedRef.current = true
    setSaving(true)
    console.log('💾 Début de la sauvegarde...')
    let uploadedFlyerUrl: string | null = null

    try {
      const generateDevisNumero = () => {
        const now = new Date()
        const yyyy = now.getFullYear()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')
        const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
        return `FD-${yyyy}${mm}${dd}-${rand}`
      }

      const devisNumero = generateDevisNumero()

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
        tournee_link: `/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`,
        devis_numero: devisNumero,
      }

      // Ajouter les champs du flyer
      try {
        participationData.has_flyer = storedData.hasFlyer || false
        participationData.flyer_url = uploadedFlyerUrl
        participationData.needs_flyer_creation = !storedData.hasFlyer
        // Ajouter le format sélectionné (pour les créations ou les flyers existants)
        if (!storedData.hasFlyer && storedData.selectedFlyerFormat) {
          participationData.flyer_format = storedData.selectedFlyerFormat
        } else if (storedData.hasFlyer && storedData.flyerType) {
          participationData.flyer_format = storedData.flyerType
        }
        // Ajouter les informations du flyer si disponibles
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
      } catch (e) {
        console.warn('Les colonnes flyer n\'existent pas encore dans la base de données')
      }

      // Vérifier que l'utilisateur est bien authentifié avant l'insertion
      console.log('🔍 Vérification de l\'authentification pour user ID:', user.id)
      
      // On vérifie d'abord la session actuelle
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Erreur lors de la récupération de la session:', sessionError)
      }
      
      if (session && session.user) {
        console.log('✅ Session trouvée, user ID:', session.user.id)
        if (session.user.id !== user.id) {
          console.error('❌ ID utilisateur ne correspond pas:', session.user.id, 'vs', user.id)
          throw new Error('Erreur d\'authentification. L\'utilisateur ne correspond pas à la session.')
        }
      } else {
        console.log('⚠️ Pas de session, tentative avec getUser()...')
        // Si pas de session, essayer getUser
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('❌ Erreur getUser:', authError)
          throw new Error(`Erreur d'authentification: ${authError.message}`)
        }
        
        if (!authUser) {
          console.error('❌ Aucun utilisateur trouvé')
          throw new Error('Erreur d\'authentification. Aucun utilisateur trouvé.')
        }
        
        if (authUser.id !== user.id) {
          console.error('❌ ID utilisateur ne correspond pas:', authUser.id, 'vs', user.id)
          throw new Error('Erreur d\'authentification. L\'utilisateur ne correspond pas.')
        }
        
        console.log('✅ Utilisateur vérifié via getUser, ID:', authUser.id)
      }
      
      console.log('✅ Authentification vérifiée, insertion des données...')

      console.log('💾 Tentative d\'insertion de la participation:', {
        user_id: participationData.user_id,
        ville_name: participationData.ville_name,
        tournee_date_debut: participationData.tournee_date_debut
      })
      
      let participation: any = null
      const { data: participationDataResult, error: participationError } = await supabase
        .from('france_distri_participations')
        .insert(participationData)
        .select()
        .single()
      
      if (participationError) {
        console.error('❌ Erreur lors de l\'insertion:', participationError)
        console.error('   Code:', participationError.code)
        console.error('   Message:', participationError.message)
        console.error('   Details:', participationError.details)
        console.error('   Hint:', participationError.hint)
      }

      if (participationError) {
        // Si l'erreur est due aux colonnes manquantes, essayer sans ces colonnes
        if (participationError.message.includes('has_flyer') || 
            participationError.message.includes('flyer_url') || 
            participationError.message.includes('needs_flyer_creation') ||
            participationError.message.includes('flyer_format') ||
            participationError.message.includes('devis_numero') ||
            participationError.message.toLowerCase().includes('devis') ||
            participationError.code === '42703') {
          const errorMessage = participationError.message || ''
          const isDevisColumnIssue = errorMessage.includes('devis_numero') || errorMessage.toLowerCase().includes('devis')

          console.warn('Colonnes optionnelles manquantes, création sans ces informations', {
            isDevisColumnIssue
          })

          const { data: participationRetry, error: retryError } = await supabase
            .from('france_distri_participations')
            .insert({
              user_id: user.id,
              ville_name: storedData.villeName,
              tournee_date_debut: storedData.tourneeDateDebut,
              tournee_date_fin: storedData.tourneeDateFin,
              tournee_index: storedData.tourneeIndex,
              total_logements: Math.round(storedData.totalLogements),
              cout_distribution: storedData.coutDistribution,
              status: 'pending',
              ...(isDevisColumnIssue ? {} : { devis_numero: devisNumero }),
            } as any)
            .select()
            .single()
          
          if (retryError) throw retryError
          if (!participationRetry) {
            throw new Error('Erreur lors de la création de la participation')
          }
          participation = participationRetry
        } else {
          throw participationError
        }
      } else {
        participation = participationDataResult
      }

      if (!participation) {
        throw new Error('Erreur lors de la création de la participation')
      }

      // Créer les sélections d'IRIS
      const irisSelections = storedData.selectedIris.map(iris => ({
        participation_id: (participation as any).id,
        iris_code: iris.code,
        iris_name: iris.name,
        logements: iris.logements ? Math.round(iris.logements) : null
      }))

      const { error: selectionsError } = await supabase
        .from('france_distri_iris_selections')
        .insert(irisSelections as any)

      if (selectionsError) throw selectionsError

      // Nettoyer localStorage
      localStorage.removeItem('pendingSelection')

      console.log('✅ Sauvegarde complète réussie, redirection vers le dashboard')
      
      // Rediriger vers le dashboard avec un message de succès
      router.push('/dashboard?success=true')
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde:', err)
      // Réinitialiser les flags en cas d'erreur pour permettre une nouvelle tentative
      hasSavedRef.current = false
      savingRef.current = false
      
      let errorMessage = 'Erreur lors de l\'enregistrement'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.error_description) {
        errorMessage = err.error_description
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        errorMessage = 'Les colonnes de la base de données ne sont pas à jour. Veuillez exécuter le script de migration SQL (supabase-migration-complete.sql) dans Supabase.'
      }
      
      showErrorToast(`${errorMessage}\n\nSi le problème persiste, vérifiez la console du navigateur pour plus de détails.`)
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!isSupabaseConfigured()) {
      showErrorToast('Supabase n\'est pas configuré. Veuillez créer un fichier .env.local avec vos clés Supabase.')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        // Inscription
        if (!isValidEmail(email)) {
          showErrorToast('Adresse email invalide.')
          setLoading(false)
          return
        }

        if (!isValidEmail(confirmEmail)) {
          showErrorToast('Adresse email de confirmation invalide.')
          setLoading(false)
          return
        }

        if (email !== confirmEmail) {
          showErrorToast('Les adresses email ne correspondent pas')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          showErrorToast('Les mots de passe ne correspondent pas')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          showErrorToast('Le mot de passe doit contenir au moins 6 caractères')
          setLoading(false)
          return
        }

        // Configurer l'URL de redirection après confirmation d'email
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : undefined

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        })

        if (signUpError) throw signUpError

        if (data.user) {
          console.log('✅ Compte créé, user ID:', data.user.id)
          console.log('📋 Session disponible:', !!data.session)
          console.log('📧 Email confirmé:', data.user.email_confirmed_at ? 'Oui' : 'Non')
          
          // Si une session est disponible immédiatement, l'utiliser
          if (data.session) {
            console.log('✅ Session disponible immédiatement, sauvegarde...')
            if (!hasSavedRef.current && !savingRef.current) {
              await handleSave(data.user)
            }
          } else {
            console.log('⏳ Pas de session immédiate, attente de l\'établissement...')
            
            // Attendre un peu pour que la session soit établie (même sans confirmation d'email, il peut y avoir un léger délai)
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Vérifier à nouveau la session
            const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()
            
            if (retryError) {
              console.error('❌ Erreur lors de la vérification de session:', retryError)
            }
            
            if (retrySession && retrySession.user) {
              console.log('✅ Session établie après attente, sauvegarde...')
              if (!hasSavedRef.current && !savingRef.current) {
                await handleSave(retrySession.user)
              }
            } else {
              // Dernière tentative avec getUser
              const { data: { user: retryUser }, error: userError } = await supabase.auth.getUser()
              
              if (!userError && retryUser && retryUser.email_confirmed_at) {
                // L'utilisateur est confirmé mais pas de session (peu probable)
                console.log('✅ Utilisateur confirmé trouvé via getUser, sauvegarde...')
                if (!hasSavedRef.current && !savingRef.current) {
                  await handleSave(retryUser)
                }
              } else if (!userError && retryUser) {
                // L'utilisateur existe, essayer de sauvegarder même si pas de session
                console.log('✅ Utilisateur trouvé, tentative de sauvegarde...')
                if (!hasSavedRef.current && !savingRef.current) {
                  try {
                    await handleSave(retryUser)
                  } catch (saveError) {
                    console.error('❌ Erreur lors de la sauvegarde:', saveError)
                    setMessage('✅ Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter pour finaliser votre sélection.')
                    setError(null)
                    setLoading(false)
                  }
                }
              } else {
                // Aucune session et aucun utilisateur trouvé
                console.error('❌ Impossible d\'obtenir la session ou l\'utilisateur')
                setMessage('✅ Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter pour finaliser votre sélection.')
                setError(null)
                setLoading(false)
                return
              }
            }
          }
        } else {
          showErrorToast('Une erreur est survenue lors de l\'inscription')
        }
      } else {
        // Connexion
        if (!isValidEmail(email)) {
          showErrorToast('Adresse email invalide.')
          setLoading(false)
          return
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) throw signInError

        if (data.user) {
          // L'utilisateur est connecté, sauvegarder les données (seulement si pas déjà sauvegardé)
          if (!hasSavedRef.current && !savingRef.current) {
            await handleSave(data.user)
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur d\'authentification:', err)
      showErrorToast(getAuthErrorMessage(err, 'Une erreur est survenue lors de l\'authentification'))
    } finally {
      setLoading(false)
    }
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

  return (
    <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Link 
              href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs/confirmation/recap`}
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
              <h1 className="section-title">
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </h1>
              <p className="section-subtitle">
                {isSignUp 
                  ? 'Créez votre compte pour finaliser votre sélection'
                  : 'Connectez-vous à votre compte pour finaliser votre sélection'}
              </p>
            </div>

            <div style={{
              background: 'var(--bg-accent)',
              borderRadius: '16px',
              padding: 'var(--spacing-xl)',
              border: '2px solid #52607f'
            }}>
              <form onSubmit={handleSubmit}>
                {message && (
                  <div style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: '8px',
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid #4CAF50',
                    color: '#4CAF50',
                    marginBottom: 'var(--spacing-md)',
                    fontSize: '14px',
                    whiteSpace: 'pre-line'
                  }}>
                    {message}
                  </div>
                )}

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px'
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onCopy={(e) => isSignUp && e.preventDefault()}
                    onPaste={(e) => isSignUp && e.preventDefault()}
                    onCut={(e) => isSignUp && e.preventDefault()}
                    placeholder="votre@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px',
                      borderRadius: '8px',
                      border: '1px solid #52607f',
                      background: '#222b44',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}
                    className="input-placeholder-white"
                  />
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
                    }}>
                      Confirmer l'email *
                    </label>
                    <input
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
                        background: '#222b44',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                )}

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px'
                  }}>
                    Mot de passe *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 45px 12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
                        background: '#222b44',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
                    }}>
                      Confirmer le mot de passe *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{
                          width: '100%',
                          padding: '12px 45px 12px 12px',
                          borderRadius: '8px',
                          border: '1px solid #52607f',
                          background: '#222b44',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}
                        className="input-placeholder-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || saving}
                  style={{
                    width: '100%',
                    padding: '12px var(--spacing-lg)',
                    borderRadius: '8px',
                    border: 'none',
                    background: loading || saving
                      ? 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)'
                      : 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                    color: 'var(--text-primary)',
                    cursor: loading || saving ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    opacity: loading || saving ? 0.5 : 1,
                    boxShadow: '0 4px 12px rgba(251, 109, 37, 0.35)',
                    marginBottom: 'var(--spacing-md)'
                  }}
                >
                  {saving ? 'Enregistrement...' : loading ? (isSignUp ? 'Inscription...' : 'Connexion...') : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
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
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={!!toast}
            onClose={() => setToast(null)}
          />
        )}
    </section>
  )
}



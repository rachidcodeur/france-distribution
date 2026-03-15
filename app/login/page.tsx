'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import { isValidFrenchPhone } from '@/lib/phoneValidation'

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

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [storedData, setStoredData] = useState<StoredSelection | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const modeParam = searchParams.get('mode')
  const [isSignUp, setIsSignUp] = useState(modeParam !== 'signin' && modeParam !== 'reset')
  const [isResetMode, setIsResetMode] = useState(modeParam === 'reset')

  // Mettre à jour isSignUp quand le paramètre mode change dans l'URL
  useEffect(() => {
    const currentMode = searchParams.get('mode')
    setIsResetMode(currentMode === 'reset')
    setIsSignUp(currentMode !== 'signin' && currentMode !== 'reset')
    // Réinitialiser les erreurs et messages quand on change de mode
    setError(null)
    setMessage(null)
  }, [searchParams])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [street, setStreet] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
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
    // Validation simple et robuste
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!basic) return false
    if (trimmed.includes('..')) return false
    return true
  }

  const showErrorToast = (message: string) => {
    setToast({ message, type: 'error' })
    setTimeout(() => setToast(null), 4000)
  }

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
      showErrorToast('Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement.')
      setLoading(false)
      return
    }

    try {
      if (isResetMode) {
        if (password.length < 6) {
          showErrorToast('Le mot de passe doit contenir au moins 6 caractères.')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          showErrorToast('Les mots de passe ne correspondent pas.')
          setLoading(false)
          return
        }

        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError

        setToast({ message: 'Mot de passe mis à jour avec succès.', type: 'success' })
        setTimeout(() => {
          router.push('/login?mode=signin')
        }, 1200)
      } else if (isSignUp) {
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

        // Validation de l'email de confirmation
        if (email !== confirmEmail) {
          showErrorToast('Les adresses email ne correspondent pas.')
          setLoading(false)
          return
        }

        // Validation des champs obligatoires du profil
        if (!company.trim() || !firstName.trim() || !lastName.trim() || !street.trim() || !postalCode.trim() || !city.trim() || !phone.trim()) {
          showErrorToast('Merci de remplir tous les champs obligatoires : entreprise, prénom, nom, adresse, code postal, ville, téléphone.')
          setLoading(false)
          return
        }

        // Validation du téléphone
        if (phone && phone.trim() && !isValidFrenchPhone(phone)) {
          showErrorToast('Veuillez saisir un numéro de téléphone français valide (10 chiffres, format: 09 78 28 84 62 ou +33 9 78 28 84 62).')
          setLoading(false)
          return
        }

        // Validation du mot de passe
        if (password.length < 6) {
          showErrorToast('Le mot de passe doit contenir au moins 6 caractères.')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          showErrorToast('Les mots de passe ne correspondent pas.')
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
              name: `${firstName} ${lastName}`.trim()
            }
          }
        })

        if (signUpError) throw signUpError

        if (data.user) {
          console.log('✅ Compte créé, user ID:', data.user.id)
          console.log('📋 Session disponible immédiatement:', !!data.session)
          console.log('📧 Email confirmé:', data.user.email_confirmed_at ? 'Oui' : 'Non')

          // Créer / mettre à jour le profil utilisateur avec les infos du formulaire
          if (data.user.id) {
            const profilePayload = {
              user_id: data.user.id,
              email: email.trim(),
              nom: lastName.trim(),
              prenom: firstName.trim(),
              entreprise: company.trim(),
              telephone: phone.trim(),
              adresse_rue: street.trim(),
              adresse_code_postal: postalCode.trim(),
              adresse_ville: city.trim()
            }

            // @ts-ignore
            const { error: profileError } = await (supabase as any)
              .from('france_distri_user_profiles')
              .upsert(profilePayload, { onConflict: 'user_id' })

            if (profileError) {
              console.error('❌ Erreur lors de la création du profil utilisateur:', profileError)
            }
          }
          
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
        if (!isValidEmail(email)) {
          showErrorToast('Adresse email invalide.')
          setLoading(false)
          return
        }

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
      showErrorToast(getAuthErrorMessage(err))
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!isSupabaseConfigured()) {
      showErrorToast('Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement.')
      return
    }
    if (!isValidEmail(email)) {
      showErrorToast('Veuillez saisir une adresse email valide pour réinitialiser votre mot de passe.')
      return
    }

    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      })
      if (resetError) throw resetError

      setToast({ message: 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.', type: 'success' })
    } catch (err: any) {
      console.error('❌ Erreur reset password:', err)
      showErrorToast(getAuthErrorMessage(err))
    } finally {
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
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div
              className="auth-card"
              style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: '55px 16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h1 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-md)',
                textAlign: 'center',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}>
                {isResetMode ? 'Réinitialiser le mot de passe' : (isSignUp ? 'Créer un compte' : 'Se connecter')}
              </h1>

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
                {isSignUp && (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <div>
                        <label htmlFor="firstName" style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}>
                          Prénom
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required={isSignUp}
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
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}>
                          Nom
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required={isSignUp}
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
                          placeholder="Nom"
                        />
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <div>
                        <label htmlFor="company" style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}>
                          Entreprise
                        </label>
                        <input
                          id="company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          required={isSignUp}
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
                          placeholder="Entreprise"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}>
                          Téléphone
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required={isSignUp}
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
                          placeholder="Ex : 06 12 34 56 78"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                      <label htmlFor="street" style={{
                        display: 'block',
                        marginBottom: 'var(--spacing-xs)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}>
                        Adresse
                      </label>
                      <input
                        id="street"
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required={isSignUp}
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
                        placeholder="Adresse complète"
                      />
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <div>
                        <label htmlFor="postalCode" style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}>
                          Code postal
                        </label>
                        <input
                          id="postalCode"
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          required={isSignUp}
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
                          placeholder="Code postal"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                        }}>
                          Ville
                        </label>
                        <input
                          id="city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required={isSignUp}
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
                          placeholder="Ville"
                        />
                      </div>
                    </div>

                  </>
                )}
                {!isResetMode && (
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
                )}

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
                    {isResetMode ? 'Nouveau mot de passe' : 'Mot de passe'}
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

                {(isSignUp || isResetMode) && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label htmlFor="confirmPassword" style={{
                      display: 'block',
                      marginBottom: 'var(--spacing-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      {isResetMode ? 'Confirmer le nouveau mot de passe' : 'Confirmer le mot de passe'}
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
                  {loading
                    ? 'Chargement...'
                    : saving
                      ? 'Sauvegarde...'
                      : isResetMode
                        ? 'Mettre à jour le mot de passe'
                        : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
                </button>

                {!isSignUp && !isResetMode && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'underline',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  paddingTop: 'var(--spacing-md)',
                  borderTop: '1px solid #52607f'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isResetMode) {
                        router.push('/login?mode=signin')
                        return
                      }
                      setIsResetMode(false)
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
                    {isResetMode
                      ? 'Retour à la connexion'
                      : (isSignUp 
                        ? 'Déjà un compte ? Se connecter'
                        : 'Pas encore de compte ? Créer un compte')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main>
          <Header />
          <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
            <div className="container">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
              </div>
            </div>
          </section>
          <Footer />
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}


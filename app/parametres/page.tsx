'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { isValidFrenchPhone } from '@/lib/phoneValidation'

interface UserProfile {
  nom?: string
  prenom?: string
  entreprise?: string
  telephone?: string
  adresse_rue?: string
  adresse_code_postal?: string
  adresse_ville?: string
}

export default function ParametresPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [phoneError, setPhoneError] = useState(false)
  
  const [formData, setFormData] = useState<UserProfile>({
    nom: '',
    prenom: '',
    entreprise: '',
    telephone: '',
    adresse_rue: '',
    adresse_code_postal: '',
    adresse_ville: ''
  })

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.push('/login')
      return
    }

    // Vérifier l'authentification
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.push('/login')
        return
      }
      setUser(user)
      loadUserProfile(user.id)
    })

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        loadUserProfile(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const loadUserProfile = async (userId: string) => {
    try {
      // Charger le profil utilisateur s'il existe
      const { data: profileData, error: profileError } = await supabase
        .from('france_distri_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      let initialData: UserProfile = {
        nom: '',
        prenom: '',
        entreprise: '',
        telephone: '',
        adresse_rue: '',
        adresse_code_postal: '',
        adresse_ville: ''
      }

      // Si le profil existe, utiliser ses données
      if (profileData && !profileError) {
        initialData = {
          nom: profileData.nom || '',
          prenom: profileData.prenom || '',
          entreprise: profileData.entreprise || '',
          telephone: profileData.telephone || '',
          adresse_rue: profileData.adresse_rue || '',
          adresse_code_postal: profileData.adresse_code_postal || '',
          adresse_ville: profileData.adresse_ville || ''
        }
      }

      // Si certaines informations manquent, essayer de les récupérer depuis les participations les plus récentes
      if (!initialData.entreprise || !initialData.telephone || !initialData.adresse_rue) {
        const { data: participations, error: participationsError } = await supabase
          .from('france_distri_participations')
          .select('flyer_entreprise, flyer_telephone, flyer_address_rue, flyer_address_code_postal, flyer_address_ville')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (participations && participations.length > 0) {
          const latestParticipation = participations[0]
          
          // Préremplir uniquement les champs vides avec les données des participations
          if (!initialData.entreprise && latestParticipation.flyer_entreprise) {
            initialData.entreprise = latestParticipation.flyer_entreprise
          }
          if (!initialData.telephone && latestParticipation.flyer_telephone) {
            initialData.telephone = latestParticipation.flyer_telephone
          }
          if (!initialData.adresse_rue && latestParticipation.flyer_address_rue) {
            initialData.adresse_rue = latestParticipation.flyer_address_rue
          }
          if (!initialData.adresse_code_postal && latestParticipation.flyer_address_code_postal) {
            initialData.adresse_code_postal = latestParticipation.flyer_address_code_postal
          }
          if (!initialData.adresse_ville && latestParticipation.flyer_address_ville) {
            initialData.adresse_ville = latestParticipation.flyer_address_ville
          }
        }
      }

      setFormData(initialData)
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Valider le numéro de téléphone si renseigné
    if (formData.telephone && formData.telephone.trim() && !isValidFrenchPhone(formData.telephone)) {
      setToast({ message: 'Veuillez saisir un numéro de téléphone français valide (10 chiffres, format: 09 78 28 84 62 ou +33 9 78 28 84 62)', type: 'error' })
      setSaving(false)
      return
    }

    setSaving(true)
    try {
      // Vérifier d'abord si un profil existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('france_distri_user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const profileData = {
        user_id: user.id,
        nom: formData.nom?.trim() || null,
        prenom: formData.prenom?.trim() || null,
        entreprise: formData.entreprise?.trim() || null,
        telephone: formData.telephone?.trim() || null,
        adresse_rue: formData.adresse_rue?.trim() || null,
        adresse_code_postal: formData.adresse_code_postal?.trim() || null,
        adresse_ville: formData.adresse_ville?.trim() || null,
        updated_at: new Date().toISOString()
      }

      let error

      if (existingProfile && !checkError) {
        // Mise à jour d'un profil existant
        const { error: updateError } = await supabase
          .from('france_distri_user_profiles')
          .update(profileData)
          .eq('user_id', user.id)

        error = updateError
      } else {
        // Création d'un nouveau profil
        const { error: insertError } = await supabase
          .from('france_distri_user_profiles')
          .insert(profileData)

        error = insertError
      }

      if (error) {
        console.error('Erreur détaillée:', error)
        throw error
      }

      setToast({ message: 'Vos informations ont été mises à jour avec succès !', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      const errorMessage = error?.message || 'Erreur lors de la mise à jour. Veuillez réessayer.'
      setToast({ message: errorMessage, type: 'error' })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <main>
        <Header />
        <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
              Chargement...
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Header />
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}>
              Mes paramètres
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: 'var(--spacing-xl)' }}>
              Mettez à jour vos informations personnelles
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: 'var(--spacing-xl)',
                border: '2px solid #353550',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-lg)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Informations personnelles
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => handleChange('prenom', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
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

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => handleChange('nom', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
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
                </div>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.entreprise}
                    onChange={(e) => handleChange('entreprise', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
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

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => {
                      handleChange('telephone', e.target.value)
                      if (phoneError && isValidFrenchPhone(e.target.value)) {
                        setPhoneError(false)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim() && !isValidFrenchPhone(e.target.value)) {
                        setPhoneError(true)
                      } else {
                        setPhoneError(false)
                      }
                    }}
                    placeholder="Ex: 06 12 34 56 78"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: phoneError ? '2px solid #F44336' : '1px solid #52607f',
                      background: '#222b44',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}
                    className="input-placeholder-white"
                  />
                </div>

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: 'var(--spacing-lg)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Adresse
                </h3>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Rue
                  </label>
                  <input
                    type="text"
                    value={formData.adresse_rue}
                    onChange={(e) => handleChange('adresse_rue', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={formData.adresse_code_postal}
                      onChange={(e) => handleChange('adresse_code_postal', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
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

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Ville
                    </label>
                    <input
                      type="text"
                      value={formData.adresse_ville}
                      onChange={(e) => handleChange('adresse_ville', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
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
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
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


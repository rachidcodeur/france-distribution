'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isValidFrenchPhone } from '@/lib/phoneValidation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

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
}

export default function ConfirmationPage() {
  const router = useRouter()
  const [storedData, setStoredData] = useState<StoredSelection | null>(null)
  const [hasFlyer, setHasFlyer] = useState<boolean | null>(null)
  const [flyerTitle, setFlyerTitle] = useState<string>('')
  const [flyerEntreprise, setFlyerEntreprise] = useState<string>('')
  const [flyerEmail, setFlyerEmail] = useState<string>('')
  const [flyerTelephone, setFlyerTelephone] = useState<string>('')
  const [flyerAddress, setFlyerAddress] = useState({
    rue: '',
    codePostal: '',
    ville: ''
  })
  const [selectedFlyerFormat, setSelectedFlyerFormat] = useState<'A5' | 'A6' | null>(null)
  const [flyerType, setFlyerType] = useState<'A4' | 'A5' | 'A6' | 'Catalogue' | 'Bulletins Municipal' | 'Autre' | null>(null)
  const [phoneError, setPhoneError] = useState(false)

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
    if (!storedData || hasFlyer) return 0 // Pas de coût d'impression si l'utilisateur a déjà un flyer
    
    const logements = Math.round(storedData.totalLogements)
    const format = selectedFlyerFormat
    
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
  }, [storedData, hasFlyer, selectedFlyerFormat])

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
      // Charger les valeurs du flyer si elles existent
      if (data.flyerTitle) setFlyerTitle(data.flyerTitle)
      if (data.flyerEntreprise) setFlyerEntreprise(data.flyerEntreprise)
      if (data.flyerEmail) setFlyerEmail(data.flyerEmail)
      if (data.flyerTelephone) setFlyerTelephone(data.flyerTelephone)
      if (data.flyerAddress) setFlyerAddress(data.flyerAddress)
      if (data.selectedFlyerFormat) setSelectedFlyerFormat(data.selectedFlyerFormat)
      if (data.flyerType) setFlyerType(data.flyerType)
      if (data.hasFlyer !== undefined) setHasFlyer(data.hasFlyer)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      router.push('/tournees')
    }
  }, [router])

  // Préremplir les champs avec les données du profil utilisateur si les champs sont vides
  useEffect(() => {
    if (!isSupabaseConfigured() || !storedData) return

    const loadUserProfile = async () => {
      try {
        // Vérifier l'authentification
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return

        // Charger le profil utilisateur
        const { data: profileData, error: profileError } = await supabase
          .from('france_distri_user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profileData) {
          // Si pas de profil, essayer de récupérer depuis les participations récentes
          const { data: participations, error: participationsError } = await supabase
            .from('france_distri_participations')
            .select('flyer_entreprise, flyer_telephone, flyer_address_rue, flyer_address_code_postal, flyer_address_ville')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (participations && participations.length > 0) {
            const latestParticipation = participations[0] as any
            // Préremplir uniquement si les champs sont vides
            setFlyerEntreprise(prev => prev || latestParticipation.flyer_entreprise || '')
            setFlyerTelephone(prev => prev || latestParticipation.flyer_telephone || '')
            setFlyerAddress(prev => ({
              rue: prev.rue || latestParticipation.flyer_address_rue || '',
              codePostal: prev.codePostal || latestParticipation.flyer_address_code_postal || '',
              ville: prev.ville || latestParticipation.flyer_address_ville || ''
            }))
          }
          // Préremplir l'email avec l'email de l'utilisateur si vide
          setFlyerEmail(prev => prev || user.email || '')
          return
        }

        // Préremplir avec les données du profil uniquement si les champs sont vides
        const typedProfileData = profileData as { entreprise?: string; telephone?: string; adresse_rue?: string; adresse_code_postal?: string; adresse_ville?: string; [key: string]: any }
        
        setFlyerEntreprise(prev => prev || typedProfileData.entreprise || '')
        setFlyerTelephone(prev => prev || typedProfileData.telephone || '')
        setFlyerAddress(prev => ({
          rue: prev.rue || typedProfileData.adresse_rue || '',
          codePostal: prev.codePostal || typedProfileData.adresse_code_postal || '',
          ville: prev.ville || typedProfileData.adresse_ville || ''
        }))
        // Préremplir l'email avec l'email de l'utilisateur si vide
        setFlyerEmail(prev => prev || user.email || '')
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur:', error)
      }
    }

    loadUserProfile()
  }, [storedData]) // Ne s'exécuter qu'une fois après le chargement des données depuis localStorage



  const handleAddressChange = (field: 'rue' | 'codePostal' | 'ville', value: string) => {
    setFlyerAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContinue = () => {
    if (!storedData) {
      alert('Données manquantes. Veuillez réessayer.')
      return
    }
    if (hasFlyer === null) {
      alert('Veuillez indiquer si vous avez un flyer')
      return
    }

    if (hasFlyer) {
      // Si l'utilisateur a un flyer, vérifier qu'il a rempli tous les champs
      if (!flyerTitle.trim()) {
        alert('Veuillez saisir le titre du flyer')
        return
      }
      if (!flyerEntreprise.trim()) {
        alert('Veuillez saisir le nom de l\'entreprise')
        return
      }
      if (!flyerEmail.trim()) {
        alert('Veuillez saisir l\'adresse email')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(flyerEmail)) {
        alert('Veuillez saisir une adresse email valide')
        return
      }
      if (!flyerTelephone.trim()) {
        alert('Veuillez saisir le numéro de téléphone')
        return
      }
      if (!isValidFrenchPhone(flyerTelephone)) {
        alert('Veuillez saisir un numéro de téléphone français valide (10 chiffres, format: 09 78 28 84 62 ou +33 9 78 28 84 62)')
        return
      }
      if (!flyerAddress.rue.trim()) {
        alert('Veuillez saisir la rue')
        return
      }
      if (!flyerAddress.codePostal.trim()) {
        alert('Veuillez saisir le code postal')
        return
      }
      if (!flyerAddress.ville.trim()) {
        alert('Veuillez saisir la ville')
        return
      }
    } else {
      // Si l'utilisateur doit créer un flyer, vérifier qu'il a rempli les champs et sélectionné un format
      if (!flyerTitle.trim()) {
        alert('Veuillez saisir le titre du flyer')
        return
      }
      if (!flyerEntreprise.trim()) {
        alert('Veuillez saisir le nom de l\'entreprise')
        return
      }
      if (!flyerEmail.trim()) {
        alert('Veuillez saisir l\'adresse email')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(flyerEmail)) {
        alert('Veuillez saisir une adresse email valide')
        return
      }
      if (!flyerTelephone.trim()) {
        alert('Veuillez saisir le numéro de téléphone')
        return
      }
      if (!isValidFrenchPhone(flyerTelephone)) {
        alert('Veuillez saisir un numéro de téléphone français valide (10 chiffres, format: 09 78 28 84 62 ou +33 9 78 28 84 62)')
        return
      }
      if (!selectedFlyerFormat) {
        alert('Veuillez sélectionner un format de flyer (A5 ou A6)')
        return
      }
    }

    // Stocker les informations du flyer dans localStorage et rediriger vers la page de récapitulatif
    if (typeof window !== 'undefined') {
      const updatedData = {
        ...storedData,
        hasFlyer: hasFlyer,
        flyerTitle: flyerTitle || undefined,
        flyerEntreprise: flyerEntreprise || undefined,
        flyerEmail: flyerEmail || undefined,
        flyerTelephone: flyerTelephone || undefined,
        flyerAddress: hasFlyer ? flyerAddress : undefined,
        selectedFlyerFormat: !hasFlyer ? selectedFlyerFormat : undefined,
        flyerType: hasFlyer ? flyerType : undefined
      }
      localStorage.setItem('pendingSelection', JSON.stringify(updatedData))
      
      // Rediriger vers la page de récapitulatif final
      router.push(`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs/confirmation/recap`)
    }
  }

  if (!storedData) {
    return (
      <section style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'linear-gradient(135deg, #0B1220 0%, #0E1A2F 50%, #111C34 100%)', minHeight: 'calc(100vh - 88px)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
            <p style={{ color: '#CBD5E1' }}>Chargement...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
      <section style={{ marginTop: '88px', padding: '60px 20px', background: 'linear-gradient(135deg, #0B1220 0%, #0E1A2F 50%, #111C34 100%)', minHeight: 'calc(100vh - 88px)' }}>
      <div className="container">
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <Link 
            href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#CBD5E1',
              textDecoration: 'none',
              fontSize: '15px',
              marginBottom: '32px',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour à la sélection
          </Link>

          <div style={{
            background: '#222b44',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{
                fontSize: '26px',
                fontWeight: 600,
                color: '#F8FAFC',
                marginBottom: '12px',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
              }}>
                Confirmer votre sélection
              </h1>
              <p style={{
                fontSize: '15px',
                color: '#CBD5E1',
                lineHeight: 1.6,
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}>
                Tournée du {storedData.tourneeDateDebut} au {storedData.tourneeDateFin} - {storedData.villeName}
              </p>
            </div>

          {/* Résumé de la sélection */}
          <div style={{
            background: '#1a2236',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '32px',
            border: '2px solid rgba(255,255,255,0.08)'
          }}>
            <h2 style={{
              color: '#F8FAFC',
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: 700,
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
            }}>
              Résumé de votre sélection
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '8px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                  Secteurs IRIS sélectionnés
                </div>
                <div style={{ color: '#F8FAFC', fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                  {storedData.selectedIris.length}
                </div>
              </div>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '8px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                  Total logements
                </div>
                <div style={{ color: '#F97316', fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                  {Math.round(storedData.totalLogements).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>

            <div style={{
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: calculatePrintingCost > 0 ? '16px' : '0' }}>
                <span style={{ color: '#94A3B8', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                  Coût de distribution
                </span>
                <span style={{ color: '#CBD5E1', fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                  {storedData.coutDistribution.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                </span>
              </div>
              {calculatePrintingCost > 0 && selectedFlyerFormat && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                    Coût d'impression (Format {selectedFlyerFormat})
                  </span>
                  <span style={{ color: '#CBD5E1', fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                    {calculatePrintingCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ HT
                  </span>
                </div>
              )}
              {(calculatePrintingCost > 0 || storedData.coutDistribution > 0) && (
                <div style={{
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(240, 234, 229, 0.3)',
                  marginTop: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                      Total
                    </span>
                    <span style={{ color: 'rgba(249, 115, 22, 1)', fontSize: '26px', fontWeight: 600, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                      {(storedData.coutDistribution + calculatePrintingCost).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section flyer */}
          <div style={{
            marginBottom: '32px'
          }}>
            <h2 style={{
              color: '#F8FAFC',
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: 700,
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
            }}>
              Informations sur votre flyer
            </h2>

            <p style={{ 
              color: '#CBD5E1', 
              marginBottom: '24px',
              fontSize: '15px',
              lineHeight: 1.6,
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}>
              Avez-vous déjà un flyer prêt pour cette distribution ?
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '12px',
              marginBottom: '32px'
            }}>
              <button
                onClick={() => setHasFlyer(true)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '999px',
                  border: hasFlyer === true ? '2px solid #F97316' : '1px solid #434d5e',
                  background: hasFlyer === true ? '#F97316' : '#1a2236',
                  color: hasFlyer === true ? '#FFFFFF' : '#E2E8F0',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: hasFlyer === true ? 600 : 500,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  boxShadow: hasFlyer === true 
                    ? '0 0 0 1px rgba(249,115,22,0.65)' 
                    : '0 0 0 1px rgba(15,23,42,0.8)',
                  transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (hasFlyer === true) return
                  e.currentTarget.style.background = '#1b2435'
                  e.currentTarget.style.borderColor = '#F97316'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  if (hasFlyer === true) return
                  e.currentTarget.style.background = '#1a2236'
                  e.currentTarget.style.borderColor = '#434d5e'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Oui, j'ai un flyer
              </button>
              <button
                onClick={() => setHasFlyer(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '999px',
                  border: hasFlyer === false ? '2px solid #F97316' : '1px solid #434d5e',
                  background: hasFlyer === false ? '#F97316' : '#1a2236',
                  color: hasFlyer === false ? '#FFFFFF' : '#E2E8F0',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: hasFlyer === false ? 600 : 500,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  boxShadow: hasFlyer === false 
                    ? '0 0 0 1px rgba(249,115,22,0.65)' 
                    : '0 0 0 1px rgba(15,23,42,0.8)',
                  transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (hasFlyer === false) return
                  e.currentTarget.style.background = '#1b2435'
                  e.currentTarget.style.borderColor = '#F97316'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  if (hasFlyer === false) return
                  e.currentTarget.style.background = '#1a2236'
                  e.currentTarget.style.borderColor = '#434d5e'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Non, je dois en créer un
              </button>
            </div>

            {hasFlyer === true && (
              <div style={{
                background: '#1a2236',
                borderRadius: '14px',
                padding: '24px',
                border: '2px solid rgba(255,255,255,0.06)',
                marginTop: '24px'
              }}>
                <h3 style={{
                  color: '#F8FAFC',
                  marginBottom: '20px',
                  fontSize: '22px',
                  fontWeight: 700,
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Informations sur votre flyer
                </h3>

                <div style={{
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <p style={{
                    color: '#FED7AA',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    ℹ️ <strong style={{ fontWeight: 600, color: '#F97316' }}>Récupération du flyer</strong> : Nous récupérons vos flyers dans un rayon maximum de <strong style={{ fontWeight: 600, color: '#F97316' }}>10 km</strong> autour du secteur de distribution. Vos colis doivent être <strong style={{ fontWeight: 600, color: '#F97316' }}>hors palette</strong>. Nous vous contacterons <strong style={{ fontWeight: 600, color: '#F97316' }}>une semaine avant le démarrage</strong> afin d'organiser l'enlèvement de vos flyers <strong style={{ fontWeight: 600, color: '#F97316' }}>le jour J</strong>, au lancement de votre distribution.
                  </p>
                </div>

                <div className="confirmation-grid-2cols" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Titre du flyer *
                    </label>
                    <input
                      type="text"
                      value={flyerTitle}
                      onChange={(e) => setFlyerTitle(e.target.value)}
                      placeholder="Ex: Flyer promotionnel été 2024"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Entreprise *
                    </label>
                    <input
                      type="text"
                      value={flyerEntreprise}
                      onChange={(e) => setFlyerEntreprise(e.target.value)}
                      placeholder="Ex: Mon Entreprise"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={flyerEmail}
                      onChange={(e) => setFlyerEmail(e.target.value)}
                      placeholder="Ex: contact@entreprise.fr"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={flyerTelephone}
                      onChange={(e) => {
                        setFlyerTelephone(e.target.value)
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
                      placeholder="Ex: 09 78 28 84 62"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: phoneError ? '2px solid #F44336' : '1px solid rgba(255,255,255,0.12)',
                        background: 'var(--bg-accent)',
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
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Type de flyer *
                    </label>
                    <select
                      value={flyerType || ''}
                      onChange={(e) => setFlyerType(e.target.value as 'A4' | 'A5' | 'A6' | 'Catalogue' | 'Bulletins Municipal' | 'Autre' | null)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Sélectionnez un type</option>
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="A6">A6</option>
                      <option value="Catalogue">Catalogue</option>
                      <option value="Bulletins Municipal">Bulletins Municipal</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <h4 style={{
                  color: '#F8FAFC',
                  marginBottom: '16px',
                  marginTop: '24px',
                  fontSize: '18px',
                  fontWeight: 500,
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Adresse de récupération *
                </h4>

                <div className="confirmation-grid-2cols" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Rue *
                    </label>
                    <input
                      type="text"
                      value={flyerAddress.rue}
                      onChange={(e) => handleAddressChange('rue', e.target.value)}
                      placeholder="Ex: 123 Rue de la République"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Code postal *
                    </label>
                    <input
                      type="text"
                      value={flyerAddress.codePostal}
                      onChange={(e) => handleAddressChange('codePostal', e.target.value)}
                      placeholder="75001"
                      maxLength={5}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={flyerAddress.ville}
                      onChange={(e) => handleAddressChange('ville', e.target.value)}
                      placeholder="Paris"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {hasFlyer === false && (
              <div style={{
                background: '#1a2236',
                borderRadius: '14px',
                padding: '24px',
                border: '2px solid rgba(255,255,255,0.06)',
                marginTop: '24px'
              }}>
                <h3 style={{
                  color: '#F8FAFC',
                  marginBottom: '20px',
                  fontSize: '22px',
                  fontWeight: 700,
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Informations sur votre flyer
                </h3>

                <div className="confirmation-grid-2cols" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Titre du flyer *
                    </label>
                    <input
                      type="text"
                      value={flyerTitle}
                      onChange={(e) => setFlyerTitle(e.target.value)}
                      placeholder="Ex: Flyer promotionnel été 2024"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Entreprise *
                    </label>
                    <input
                      type="text"
                      value={flyerEntreprise}
                      onChange={(e) => setFlyerEntreprise(e.target.value)}
                      placeholder="Ex: Ma Société"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={flyerEmail}
                      onChange={(e) => setFlyerEmail(e.target.value)}
                      placeholder="Ex: contact@entreprise.fr"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #434d5e',
                        background: '#1a2236',
                        color: '#F8FAFC',
                        fontSize: '15px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={flyerTelephone}
                      onChange={(e) => {
                        setFlyerTelephone(e.target.value)
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
                      placeholder="Ex: 09 78 28 84 62"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: phoneError ? '2px solid #F44336' : '1px solid rgba(255,255,255,0.12)',
                        background: '#1a2236',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                </div>

                <h3 style={{
                  color: '#F8FAFC',
                  marginBottom: '20px',
                  fontSize: '18px',
                  fontWeight: 500,
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginTop: '24px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Grille tarifaire pour la création de flyer
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div
                    onClick={() => setSelectedFlyerFormat('A6')}
                    style={{
                      background: selectedFlyerFormat === 'A6' ? 'rgba(249,115,22,0.08)' : '#242940',
                      borderRadius: '10px',
                      padding: '20px',
                      border: selectedFlyerFormat === 'A6' ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.12)',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      color: '#F97316',
                      fontSize: '24px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                    }}>
                      90€ HT
                    </div>
                    <div style={{
                      color: selectedFlyerFormat === 'A6' ? '#F97316' : '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: selectedFlyerFormat === 'A6' ? 600 : 500,
                      marginBottom: '6px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Mise en page A6
                    </div>
                    <div style={{
                      color: '#94A3B8',
                      fontSize: '13px',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      105 x 148 mm
                    </div>
                    <div style={{
                      color: '#94A3B8',
                      fontSize: '15px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Recto/Verso
                    </div>
                  </div>
                  
                  <div
                    onClick={() => setSelectedFlyerFormat('A5')}
                    style={{
                      background: selectedFlyerFormat === 'A5' ? 'rgba(249,115,22,0.08)' : '#242940',
                      borderRadius: '10px',
                      padding: '20px',
                      border: selectedFlyerFormat === 'A5' ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.12)',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      color: '#F97316',
                      fontSize: '24px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                    }}>
                      130€ HT
                    </div>
                    <div style={{
                      color: selectedFlyerFormat === 'A5' ? '#F97316' : '#CBD5E1',
                      fontSize: '15px',
                      fontWeight: selectedFlyerFormat === 'A5' ? 600 : 500,
                      marginBottom: '6px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Mise en page A5
                    </div>
                    <div style={{
                      color: '#94A3B8',
                      fontSize: '13px',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      148 x 210 mm
                    </div>
                    <div style={{
                      color: '#94A3B8',
                      fontSize: '15px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Recto/Verso
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginTop: '20px',
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'rgba(249,115,22,0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(249,115,22,0.35)'
                }}>
                  <div style={{
                    background: '#F97316',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/>
                      <path d="M12 16V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="white"/>
                    </svg>
                  </div>
                  <p style={{
                    color: '#FED7AA',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Vous devez fournir le <strong style={{ fontWeight: 600 }}>logo</strong>, les <strong style={{ fontWeight: 600 }}>images</strong> et les <strong style={{ fontWeight: 600 }}>textes</strong> à l'adresse <a href="mailto:contact@distribution-flyers.fr" style={{ color: '#F97316', textDecoration: 'none', fontWeight: 600 }}>contact@distribution-flyers.fr</a>. Après confirmation de votre sélection, notre équipe vous contactera pour discuter de vos besoins en création de flyer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bouton de confirmation */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <Link
              href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`}
              style={{
                padding: '12px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: '#CBD5E1',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-block',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}
            >
              Annuler
            </Link>
            <button
              onClick={handleContinue}
              disabled={hasFlyer === null || (hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !flyerType || !flyerAddress.rue.trim() || !flyerAddress.codePostal.trim() || !flyerAddress.ville.trim())) || (!hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !selectedFlyerFormat))}
              style={{
                padding: '12px 26px',
                borderRadius: '12px',
                border: 'none',
                background: '#F97316',
                color: '#FFFFFF',
                cursor: hasFlyer === null || (hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerTelephone.trim() || !flyerType || !flyerAddress.rue.trim() || !flyerAddress.codePostal.trim() || !flyerAddress.ville.trim())) || (!hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerTelephone.trim() || !selectedFlyerFormat))
                  ? 'not-allowed' 
                  : 'pointer',
                fontSize: '15px',
                fontWeight: 500,
                opacity: hasFlyer === null || (hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !flyerType || !flyerAddress.rue.trim() || !flyerAddress.codePostal.trim() || !flyerAddress.ville.trim())) || (!hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !selectedFlyerFormat)) ? 0.5 : 1,
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}
            >
              Continuer
            </button>
          </div>
          </div>
        </div>
      </div>

    </section>
  )
}


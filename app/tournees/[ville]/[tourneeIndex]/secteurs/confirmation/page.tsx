'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const [flyerType, setFlyerType] = useState<'A5' | 'A6' | 'catalogue supermarché' | null>(null)
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
        <div className="confirmation-page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link 
            href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`}
            className="back-link"
          >
            <span className="back-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </span>
            Retour à la sélection
          </Link>

          <div className="section-header">
            <h1 className="section-title">Confirmer votre sélection</h1>
            <p className="section-subtitle">
              Tournée du {storedData.tourneeDateDebut} au {storedData.tourneeDateFin} - {storedData.villeName}
            </p>
          </div>

          {/* Résumé de la sélection */}
          <div style={{
            background: 'var(--bg-accent)',
            borderRadius: '12px',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            marginBottom: 'var(--spacing-xl)',
            border: '2px solid #52607f'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Résumé de votre sélection
            </h2>

            <div className="confirmation-grid-2cols" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                  Secteurs IRIS sélectionnés
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                  {storedData.selectedIris.length}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                  Total logements
                </div>
                <div style={{ color: 'var(--orange-primary)', fontSize: '20px', fontWeight: 700 }}>
                  {Math.round(storedData.totalLogements).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>

            <div style={{
              paddingTop: 'var(--spacing-md)',
              borderTop: '1px solid #52607f'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: calculatePrintingCost > 0 ? 'var(--spacing-sm)' : '0' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                  Coût de distribution
                </span>
                <span style={{ color: 'var(--orange-primary)', fontSize: '24px', fontWeight: 700 }}>
                  {storedData.coutDistribution.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                </span>
              </div>
              {calculatePrintingCost > 0 && selectedFlyerFormat && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                    Coût d'impression (Format {selectedFlyerFormat})
                  </span>
                  <span style={{ color: 'var(--orange-primary)', fontSize: '24px', fontWeight: 700 }}>
                    {calculatePrintingCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ HT
                  </span>
                </div>
              )}
              {(calculatePrintingCost > 0 || storedData.coutDistribution > 0) && (
                <div style={{
                  paddingTop: 'var(--spacing-sm)',
                  borderTop: '2px solid var(--orange-primary)',
                  marginTop: 'var(--spacing-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
                      Total
                    </span>
                    <span style={{ color: 'var(--orange-primary)', fontSize: '28px', fontWeight: 700 }}>
                      {(storedData.coutDistribution + calculatePrintingCost).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section flyer */}
          <div className="confirmation-flyer-section" style={{
            background: 'var(--bg-accent)',
            borderRadius: '16px',
            paddingTop: 'var(--spacing-xl)',
            paddingBottom: 'var(--spacing-xl)',
            paddingLeft: 'var(--spacing-xl)',
            paddingRight: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)',
            border: '2px solid #52607f'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)',
              fontSize: '20px',
              fontWeight: 600
            }}>
              Informations sur votre flyer
            </h2>

            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-lg)',
              fontSize: '16px'
            }}>
              Avez-vous déjà un flyer prêt pour cette distribution ?
            </p>

            <div className="confirmation-buttons-row" style={{ 
              display: 'flex', 
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <button
                onClick={() => setHasFlyer(true)}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: hasFlyer === true ? '2px solid var(--orange-primary)' : '2px solid #52607f',
                  background: hasFlyer === true ? 'rgba(251, 109, 37, 0.1)' : '#18253f',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: hasFlyer === true ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                Oui, j'ai un flyer
              </button>
              <button
                onClick={() => setHasFlyer(false)}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: hasFlyer === false ? '2px solid var(--orange-primary)' : '2px solid #52607f',
                  background: hasFlyer === false ? 'rgba(251, 109, 37, 0.1)' : '#18253f',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: hasFlyer === false ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                Non, je dois en créer un
              </button>
            </div>

            {hasFlyer === true && (
              <div className="confirmation-flyer-subsection" style={{
                background: '#181d32',
                borderRadius: '12px',
                padding: 'var(--spacing-lg)',
                border: '1px solid #52607f',
                marginTop: 'var(--spacing-lg)'
              }}>
                <h3 style={{
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '17px',
                  fontWeight: 600
                }}>
                  Informations sur votre flyer
                </h3>

                <div style={{
                  background: 'rgba(251, 109, 37, 0.1)',
                  border: '1px solid var(--orange-primary)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <p style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    <strong style={{ color: 'var(--orange-primary)', fontWeight: 600 }}>ℹ️ Récupération du flyer :</strong> Nous récupérons votre flyer dans un rayon maximum de <strong style={{ fontWeight: 600 }}>10 km</strong> autour du secteur de distribution. Le colis doit être <strong style={{ fontWeight: 600 }}>hors palette</strong>. Si votre flyer est conditionné sur palette, la récupération se fait uniquement sur rendez-vous au <strong style={{ fontWeight: 600 }}><a href="tel:+33978288462" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>09 78 28 84 62</a></strong>.
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        border: phoneError ? '2px solid #F44336' : '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
                    }}>
                      Type de flyer *
                    </label>
                    <select
                      value={flyerType || ''}
                      onChange={(e) => setFlyerType(e.target.value as 'A5' | 'A6' | 'catalogue supermarché' | null)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
                        background: 'var(--bg-accent)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Sélectionnez un type</option>
                      <option value="A5">A5</option>
                      <option value="A6">A6</option>
                      <option value="catalogue supermarché">Catalogue supermarché</option>
                    </select>
                  </div>
                </div>

                <h4 style={{
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)',
                  marginTop: 'var(--spacing-lg)',
                  fontSize: '16px',
                  fontWeight: 600
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
                        background: 'var(--bg-accent)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {hasFlyer === false && (
              <div className="confirmation-flyer-subsection" style={{
                background: '#181d32',
                borderRadius: '12px',
                padding: 'var(--spacing-lg)',
                border: '1px solid #52607f',
                marginTop: 'var(--spacing-lg)'
              }}>
                <h3 style={{
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '17px',
                  fontWeight: 600
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        padding: '12px 12px',
                        borderRadius: '8px',
                        border: '1px solid #52607f',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px'
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
                        border: phoneError ? '2px solid #F44336' : '1px solid #52607f',
                        background: 'var(--bg-accent)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}
                      className="input-placeholder-white"
                    />
                  </div>
                </div>

                <h3 style={{
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '18px',
                  marginTop: 'var(--spacing-lg)'
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
                      background: selectedFlyerFormat === 'A6' ? 'rgba(251, 109, 37, 0.1)' : 'var(--bg-accent)',
                      borderRadius: '8px',
                      padding: 'var(--spacing-md)',
                      border: selectedFlyerFormat === 'A6' ? '2px solid var(--orange-primary)' : '1px solid #52607f',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFlyerFormat !== 'A6') {
                        e.currentTarget.style.borderColor = 'var(--orange-primary)'
                        e.currentTarget.style.background = 'rgba(251, 109, 37, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFlyerFormat !== 'A6') {
                        e.currentTarget.style.borderColor = '#52607f'
                        e.currentTarget.style.background = 'var(--bg-accent)'
                      }
                    }}
                  >
                    <div style={{
                      color: 'var(--orange-primary)',
                      fontSize: '24px',
                      fontWeight: 600,
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      90€ HT
                    </div>
                    <div style={{
                      color: selectedFlyerFormat === 'A6' ? 'var(--orange-primary)' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: selectedFlyerFormat === 'A6' ? 600 : 500,
                      marginBottom: '4px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Mise en page A6
                    </div>
                    <div style={{
                      color: 'var(--text-tertiary)',
                      fontSize: '12px',
                      marginBottom: '4px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      105 x 148 mm
                    </div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Recto/Verso
                    </div>
                  </div>
                  
                  <div
                    onClick={() => setSelectedFlyerFormat('A5')}
                    style={{
                      background: selectedFlyerFormat === 'A5' ? 'rgba(251, 109, 37, 0.1)' : 'var(--bg-accent)',
                      borderRadius: '8px',
                      padding: 'var(--spacing-md)',
                      border: selectedFlyerFormat === 'A5' ? '2px solid var(--orange-primary)' : '1px solid #52607f',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFlyerFormat !== 'A5') {
                        e.currentTarget.style.borderColor = 'var(--orange-primary)'
                        e.currentTarget.style.background = 'rgba(251, 109, 37, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFlyerFormat !== 'A5') {
                        e.currentTarget.style.borderColor = '#52607f'
                        e.currentTarget.style.background = 'var(--bg-accent)'
                      }
                    }}
                  >
                    <div style={{
                      color: 'var(--orange-primary)',
                      fontSize: '24px',
                      fontWeight: 600,
                      marginBottom: 'var(--spacing-xs)',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                    }}>
                      130€ HT
                    </div>
                    <div style={{
                      color: selectedFlyerFormat === 'A5' ? 'var(--orange-primary)' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: selectedFlyerFormat === 'A5' ? 600 : 500,
                      marginBottom: '4px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Mise en page A5
                    </div>
                    <div style={{
                      color: 'var(--text-tertiary)',
                      fontSize: '12px',
                      marginBottom: '4px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      148 x 210 mm
                    </div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                    }}>
                      Recto/Verso
                    </div>
                  </div>
                </div>

                <div 
                  className="flyer-info-pulse"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(251, 109, 37, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(251, 109, 37, 0.3)'
                  }}
                >
                  <div style={{
                    background: 'var(--orange-primary)',
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
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Vous devez fournir le <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>logo</strong>, les <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>images</strong> et les <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>textes</strong> à l'adresse <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none', fontWeight: 600 }}>contact@distribution-flyers.fr</a>. Après confirmation de votre sélection, notre équipe vous contactera pour discuter de vos besoins en création de flyer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bouton de confirmation */}
          <div className="confirmation-buttons-row" style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'flex-end'
          }}>
            <Link
              className="confirmation-button-cancel"
              href={`/tournees/${encodeURIComponent(storedData.villeName.toLowerCase())}/${storedData.tourneeIndex}/secteurs`}
              style={{
                padding: '8px var(--spacing-lg)',
                borderRadius: '8px',
                border: '1px solid #52607f',
                background: 'var(--bg-accent)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '16px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Annuler
            </Link>
            <button
              className="confirmation-button-continue"
              onClick={handleContinue}
              disabled={hasFlyer === null || (hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !flyerType || !flyerAddress.rue.trim() || !flyerAddress.codePostal.trim() || !flyerAddress.ville.trim())) || (!hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !selectedFlyerFormat))}
              style={{
                padding: '8px var(--spacing-lg)',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                color: 'var(--text-primary)',
                cursor: hasFlyer === null || (hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerTelephone.trim() || !flyerType || !flyerAddress.rue.trim() || !flyerAddress.codePostal.trim() || !flyerAddress.ville.trim())) || (!hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerTelephone.trim() || !selectedFlyerFormat))
                  ? 'not-allowed' 
                  : 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                opacity: hasFlyer === null || (hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !flyerType || !flyerAddress.rue.trim() || !flyerAddress.codePostal.trim() || !flyerAddress.ville.trim())) || (!hasFlyer && (!flyerTitle.trim() || !flyerEntreprise.trim() || !flyerEmail.trim() || !flyerTelephone.trim() || !selectedFlyerFormat)) ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(251, 109, 37, 0.35)'
              }}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>

    </section>
  )
}


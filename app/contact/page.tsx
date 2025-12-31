'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'
import { useState } from 'react'
import { isValidFrenchPhone } from '@/lib/phoneValidation'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [phoneError, setPhoneError] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Valider le numéro de téléphone si renseigné
    if (formData.phone && formData.phone.trim() && !isValidFrenchPhone(formData.phone)) {
      alert('Veuillez saisir un numéro de téléphone français valide (10 chiffres, format: 09 78 28 84 62 ou +33 9 78 28 84 62)')
      return
    }
    
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Simuler l'envoi du formulaire
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      })
    }, 1000)
  }

  return (
    <main>
      <Header />
      <section style={{ 
        marginTop: '88px', 
        padding: 'var(--spacing-4xl) 0', 
        background: 'var(--gradient-dark)' 
      }}>
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Contactez-nous</h1>
            <p className="section-subtitle">
              Une question ? Besoin d'un accompagnement personnalisé ? Notre équipe est à votre écoute.
            </p>
          </div>

          {/* Formulaire de contact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-4xl)',
            alignItems: 'start'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-lg)',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
              }}>
                Envoyez-nous un message
              </h2>

              {/* Bloc accompagnement personnalisé */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(251, 109, 37, 0.15) 0%, rgba(232, 90, 26, 0.1) 100%)',
                borderRadius: '16px',
                padding: 'var(--spacing-lg)',
                border: '2px solid var(--orange-primary)',
                marginBottom: 'var(--spacing-xl)',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(251, 109, 37, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    Accompagnement personnalisé
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Pour un accompagnement sur mesure, appelez-nous directement
                  </p>
                  <a
                    href="tel:+33978288462"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'var(--orange-primary)',
                      borderRadius: '10px',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 4px 12px rgba(251, 109, 37, 0.3)',
                      marginTop: 'var(--spacing-xs)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ff8c42'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(251, 109, 37, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--orange-primary)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.3)'
                    }}
                    title="Appeler"
                  >
                    <svg 
                      width="20" 
                      height="20" 
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
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                marginBottom: 'var(--spacing-xl)',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}>
                Remplissez le formulaire ci-contre et notre équipe vous répondra dans les plus brefs délais.
              </p>
              <div style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: 'var(--spacing-xl)',
                border: '2px solid #353550'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  Informations pratiques
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-primary)" strokeWidth="2">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>France entière</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-primary)" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Lundi - Vendredi : 9h - 18h</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-primary)" strokeWidth="2">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>contact@france-distribution.fr</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{
              background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
              borderRadius: '16px',
              padding: 'var(--spacing-2xl)',
              border: '2px solid #353550'
            }}>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="name" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #353550',
                    background: '#222b44',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--orange-primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(251, 109, 37, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#353550'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #353550',
                    background: '#222b44',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--orange-primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(251, 109, 37, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#353550'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="phone" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    handleChange(e)
                    if (phoneError && isValidFrenchPhone(e.target.value)) {
                      setPhoneError(false)
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim() && !isValidFrenchPhone(e.target.value)) {
                      setPhoneError(true)
                      e.currentTarget.style.borderColor = '#F44336'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)'
                    } else {
                      setPhoneError(false)
                      e.currentTarget.style.borderColor = '#353550'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: phoneError ? '2px solid #F44336' : '1px solid #353550',
                    background: '#222b44',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    if (!phoneError) {
                      e.currentTarget.style.borderColor = 'var(--orange-primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(251, 109, 37, 0.2)'
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="company" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Entreprise
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #353550',
                    background: '#222b44',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--orange-primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(251, 109, 37, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#353550'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label htmlFor="message" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #353550',
                    background: '#222b44',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    resize: 'vertical',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--orange-primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(251, 109, 37, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#353550'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {submitStatus === 'success' && (
                <div style={{
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid #4CAF50',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)',
                  color: '#4CAF50',
                  fontSize: '14px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                </div>
              )}

              {submitStatus === 'error' && (
                <div style={{
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid #F44336',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)',
                  color: '#F44336',
                  fontSize: '14px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Une erreur est survenue. Veuillez réessayer.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-large"
                style={{
                  width: '100%',
                  fontSize: '18px',
                  padding: '16px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
      <GSAPAnimations />
    </main>
  )
}


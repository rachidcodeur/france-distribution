'use client'

import { useState } from 'react'
import { isValidFrenchPhone } from '../lib/phoneValidation'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    
    // Simulation d'envoi (à remplacer par votre API)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
      
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 3000)
    }, 1500)
  }

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Contactez-nous</h2>
          <p className="section-subtitle">Demandez votre devis gratuit dès maintenant</p>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9841 21.5573 21.2126 21.3522 21.3992C21.1471 21.5858 20.9053 21.7262 20.6426 21.8111C20.38 21.896 20.1025 21.9235 19.83 21.892C16.7438 21.4556 13.787 20.3831 11.19 18.75C8.77382 17.3057 6.72533 15.2572 5.28 12.84C3.64698 10.2435 2.57451 7.28737 2.138 4.202C2.10651 3.92947 2.13399 3.652 2.21891 3.38936C2.30382 3.12672 2.44416 2.88489 2.63078 2.67978C2.8174 2.47467 3.04589 2.31107 3.30085 2.19946C3.55581 2.08785 3.8315 2.03086 4.11 2.032H7.11C7.59357 2.03203 8.06714 2.16723 8.47473 2.42161C8.88232 2.67599 9.20787 3.03916 9.414 3.468L10.844 6.3C11.0481 6.72454 11.1231 7.20104 11.0606 7.67012C10.9981 8.1392 10.8006 8.58172 10.492 8.94L8.5 11.06C9.69604 13.4085 11.5915 15.304 13.94 16.5L16.06 14.508C16.4183 14.1994 16.8608 14.0019 17.3299 13.9394C17.799 13.8769 18.2755 13.9519 18.7 14.156L21.532 15.586C21.9608 15.7921 22.324 16.1177 22.5784 16.5253C22.8328 16.9329 22.968 17.4064 22.968 17.89V20.89H22.968Z"/>
                </svg>
              </div>
              <div>
                <h4>Téléphone</h4>
                <p>09 78 28 84 62</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h4>Email</h4>
                <p>contact@francedistribution.fr</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <h4>Adresse</h4>
                <p>Bordeaux, France</p>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nom complet</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Téléphone</label>
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
                  } else {
                    setPhoneError(false)
                  }
                }}
                style={{
                  borderColor: phoneError ? '#F44336' : undefined,
                  borderWidth: phoneError ? '2px' : undefined
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea 
                id="message" 
                name="message" 
                rows={5} 
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting || submitStatus === 'success'}
            >
              {isSubmitting ? 'Envoi en cours...' : submitStatus === 'success' ? 'Message envoyé !' : 'Envoyer la demande'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}


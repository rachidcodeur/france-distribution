 'use client'
 
 import { Suspense, useEffect, useMemo, useState } from 'react'
 import { useSearchParams } from 'next/navigation'
 import Header from '@/components/Header'
 import Footer from '@/components/Footer'
 import GSAPAnimations from '@/components/GSAPAnimations'
 import Toast from '@/components/Toast'
 import { isValidFrenchPhone } from '@/lib/phoneValidation'
 
 function DevisContent() {
   const searchParams = useSearchParams()
   const cityParam = useMemo(() => searchParams.get('ville') || '', [searchParams])
   const [formData, setFormData] = useState({
     name: '',
     phone: '',
     email: '',
     subject: '',
     city: '',
     message: ''
   })
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
   const [phoneError, setPhoneError] = useState(false)
   const [toast, setToast] = useState<{
     message: string
     type: 'success' | 'error' | 'info'
     visible: boolean
   }>({
     message: '',
     type: 'info',
     visible: false
   })
 
   useEffect(() => {
     if (!cityParam) return
     setFormData((prev) => ({ ...prev, city: prev.city || cityParam }))
   }, [cityParam])
 
   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
     setFormData({
       ...formData,
       [e.target.name]: e.target.value
     })
   }
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
 
     if (formData.phone && formData.phone.trim() && !isValidFrenchPhone(formData.phone)) {
       setPhoneError(true)
       setToast({
         message:
           'Veuillez saisir un numéro de téléphone français valide (10 chiffres, format: 09 78 28 84 62 ou +33 9 78 28 84 62)',
         type: 'error',
         visible: true
       })
       return
     }
 
     setIsSubmitting(true)
     setSubmitStatus('idle')
 
     try {
       const response = await fetch('/api/contact-submission', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: formData.name,
           email: formData.email,
           phone: formData.phone,
           company: formData.subject,
           message: `Ville de distribution : ${formData.city}\n\n${formData.message}`
         })
       })
 
       if (!response.ok) {
         throw new Error('Erreur lors de l\'envoi')
       }
 
       setSubmitStatus('success')
       setToast({
         message: 'Demande envoyée ! Nous revenons vers vous rapidement avec une offre personnalisée.',
         type: 'success',
         visible: true
       })
       setFormData({
         name: '',
         phone: '',
         email: '',
         subject: '',
         city: cityParam || '',
         message: ''
       })
     } catch (error) {
       console.error(error)
       setSubmitStatus('error')
       setToast({
         message: 'Une erreur est survenue lors de l’envoi. Veuillez réessayer.',
         type: 'error',
         visible: true
       })
     } finally {
       setIsSubmitting(false)
     }
   }
 
   return (
     <main>
       <Toast
         message={toast.message}
         type={toast.type}
         isVisible={toast.visible}
         onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
       />
       <Header />
       <section
         className="devis-section"
         style={{
           marginTop: '88px',
           padding: 'var(--spacing-4xl) 0',
           background: 'var(--gradient-dark)'
         }}
       >
         <div className="container">
           <div className="section-header" style={{ textAlign: 'left' }}>
             <h1 className="section-title" style={{ marginBottom: 'var(--spacing-sm)' }}>
               Demandez votre devis gratuit
             </h1>
             <p className="section-subtitle" style={{ maxWidth: '720px', marginLeft: 0 }}>
               Remplissez le formulaire ci-dessous et recevez une offre personnalisée sous 24h.
             </p>
           </div>
 
           <div className="devis-grid">
             <form onSubmit={handleSubmit} className="devis-form">
               <div className="devis-form-row">
                 <div>
                   <label htmlFor="name">Nom complet *</label>
                   <input
                     type="text"
                     id="name"
                     name="name"
                     value={formData.name}
                     onChange={handleChange}
                     required
                     placeholder="Votre nom complet"
                   />
                 </div>
                 <div>
                   <label htmlFor="phone">Téléphone *</label>
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
                     required
                     placeholder="06 12 34 56 78"
                     className={phoneError ? 'input-error' : ''}
                   />
                 </div>
               </div>
 
               <div className="devis-form-row">
                 <div>
                   <label htmlFor="email">Votre Email *</label>
                   <input
                     type="email"
                     id="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     required
                     placeholder="votre@email.com"
                   />
                 </div>
                 <div>
                   <label htmlFor="subject">Sujet *</label>
                   <input
                     type="text"
                     id="subject"
                     name="subject"
                     value={formData.subject}
                     onChange={handleChange}
                     required
                     placeholder="Sujet de votre demande"
                   />
                 </div>
               </div>
 
               <div>
                 <label htmlFor="city">Ville de distribution *</label>
                 <input
                   type="text"
                   id="city"
                   name="city"
                   value={formData.city}
                   onChange={handleChange}
                   required
                   placeholder="Ville où vous souhaitez distribuer"
                 />
               </div>
 
               <div>
                 <label htmlFor="message">Votre message / Détails du projet *</label>
                 <textarea
                   id="message"
                   name="message"
                   value={formData.message}
                   onChange={handleChange}
                   required
                   rows={5}
                   placeholder="Décrivez votre projet de distribution..."
                 />
               </div>
 
               {submitStatus === 'success' && (
                 <div className="devis-alert success">
                   Demande envoyée avec succès ! Nous revenons vers vous rapidement.
                 </div>
               )}
 
               {submitStatus === 'error' && (
                 <div className="devis-alert error">
                   Une erreur est survenue. Veuillez réessayer.
                 </div>
               )}
 
               <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-large">
                 {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
               </button>
 
               <div className="devis-consent">
                 <input type="checkbox" id="consent" required />
                 <label htmlFor="consent">Vos données sont 100% sécurisées et confidentielles.</label>
               </div>
             </form>
 
             <aside className="devis-steps">
               <h2>Comment ça marche ?</h2>
               <div className="devis-step">
                 <span>1</span>
                 <div>
                   <h3>Demander un devis</h3>
                   <p>
                     Remplissez le formulaire avec vos informations et décrivez votre projet de
                     distribution.
                   </p>
                 </div>
               </div>
               <div className="devis-step">
                 <span>2</span>
                 <div>
                   <h3>Analyse de votre besoin</h3>
                   <p>
                     Notre équipe étudie votre demande et prépare une solution personnalisée.
                   </p>
                 </div>
               </div>
               <div className="devis-step">
                 <span>3</span>
                 <div>
                   <h3>Nous vous rappelons</h3>
                   <p>
                     Un conseiller vous contacte sous 24h pour valider les détails et vous proposer
                     une offre sur mesure.
                   </p>
                 </div>
               </div>
             </aside>
           </div>
         </div>
       </section>
       <Footer />
       <GSAPAnimations />
     </main>
   )
 }

 export default function DevisPage() {
   return (
     <Suspense fallback={null}>
       <DevisContent />
     </Suspense>
   )
 }

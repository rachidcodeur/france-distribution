 'use client'
 
 import Link from 'next/link'
 import Header from '@/components/Header'
 import Footer from '@/components/Footer'
 import GSAPAnimations from '@/components/GSAPAnimations'
 
 export default function PlanDuSitePage() {
   return (
     <main>
       <Header />
       <section
         className="mentions-legales-section"
         style={{
           marginTop: '88px',
           padding: 'var(--spacing-4xl) 0',
           background: 'var(--gradient-dark)'
         }}
       >
         <div className="container">
           <div style={{ maxWidth: '900px', margin: '0 auto' }}>
             <h1
               style={{
                 fontSize: 'clamp(2rem, 4vw, 3rem)',
                 fontWeight: 700,
                 color: 'var(--text-primary)',
                 marginBottom: 'var(--spacing-lg)',
                 textAlign: 'center',
                 fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
               }}
             >
               Plan du site
             </h1>
             <p
               style={{
                 fontSize: '1.1rem',
                 color: 'var(--text-secondary)',
                 textAlign: 'center',
                 marginBottom: 'var(--spacing-2xl)',
                 fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
               }}
             >
               Accédez rapidement aux pages principales du site.
             </p>
 
             <div
               style={{
                 background: '#171c28',
                 borderRadius: '16px',
                 padding: 'var(--spacing-2xl)',
                 border: '2px solid #353550',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
               }}
             >
               <ul
                 style={{
                   listStyle: 'none',
                   padding: 0,
                   margin: 0,
                   display: 'grid',
                   gap: '12px'
                 }}
               >
                 <li>
                   <Link href="/#accueil" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     Annuaire
                   </Link>
                 </li>
                 <li>
                   <Link href="/#features" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     Mutualisation
                   </Link>
                 </li>
                 <li>
                   <Link href="/#tarifs" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     Tarifs
                   </Link>
                 </li>
                 <li>
                   <Link
                     href="/#pourquoi-france-distribution"
                     style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}
                   >
                     À propos (Pourquoi France Distribution)
                   </Link>
                 </li>
                 <li>
                   <Link href="/tournees" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     Tournées
                   </Link>
                 </li>
                 <li>
                   <Link href="/#faq" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     FAQ
                   </Link>
                 </li>
                 <li>
                   <Link href="/contact" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     Contact
                   </Link>
                 </li>
                 <li>
                   <Link href="/mentions-legales" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>
                     Mentions légales
                   </Link>
                 </li>
                 <li>
                   <Link
                     href="/politique-confidentialite"
                     style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}
                   >
                     Politique de confidentialité
                   </Link>
                 </li>
               </ul>
             </div>
           </div>
         </div>
       </section>
       <Footer />
       <GSAPAnimations />
     </main>
   )
 }

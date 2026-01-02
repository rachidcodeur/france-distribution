'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !heroRef.current) return

    // S'assurer que les éléments sont visibles par défaut
    if (titleRef.current) gsap.set(titleRef.current, { opacity: 1, y: 0 })
    if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 1, y: 0 })
    if (ctaRef.current) {
      Array.from(ctaRef.current.children).forEach((child: any) => {
        gsap.set(child, { opacity: 1, y: 0 })
      })
    }

    const ctx = gsap.context(() => {
      // Animation d'entrée principale
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Background parallax retiré pour un fond statique

      // Titre avec split text effect
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, 
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out'
          }
        )
      }

      // Sous-titre
      if (subtitleRef.current) {
        gsap.fromTo(subtitleRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            delay: 0.3
          }
        )
      }

      // CTA avec stagger
      if (ctaRef.current && ctaRef.current.children.length > 0) {
        gsap.fromTo(ctaRef.current.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.6
          }
        )
      }

      // Floating animation retirée pour un fond statique
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={heroRef}
      className="hero" 
      id="accueil"
      style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'transparent',
        paddingTop: 'calc(88px + 5vh)',
        paddingBottom: '0px',
        marginBottom: '-400px',
        zIndex: 3
      }}
    >


      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-content" style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <div className="hero-text">
            <h1 
              ref={titleRef}
              className="hero-title"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 'var(--spacing-lg)',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
            >
              La distribution mutualisée qui réduit vos coûts jusqu'à{' '}
              <span style={{ 
                color: 'var(--orange-primary)',
                background: 'var(--gradient-main)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                position: 'relative'
              }}>
                -40%
              </span>
            </h1>
            
            <p 
              ref={subtitleRef}
              className="hero-subtitle"
              style={{
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              Couverture France entière • Calendrier trimestriel • Transparence totale
            </p>
            
            <div 
              ref={ctaRef}
              className="hero-cta"
              style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '0px',
                position: 'relative',
                zIndex: 10
              }}
            >
              <a 
                href="/tournees" 
                className="btn btn-primary btn-large"
                style={{
                  background: 'var(--gradient-main)',
                  border: 'none',
                  boxShadow: 'var(--shadow-button)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1.05,
                    boxShadow: 'var(--shadow-button-hover)',
                    duration: 0.3
                  })
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1,
                    boxShadow: 'var(--shadow-button)',
                    duration: 0.3
                  })
                }}
              >
                Voir les prochaines tournées
              </a>
              
              <Link 
                href="/login" 
                className="btn btn-secondary btn-large"
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-medium)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1.05,
                    background: 'rgba(251, 109, 37, 0.1)',
                    borderColor: 'var(--orange-primary)',
                    duration: 0.3
                  })
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1,
                    background: 'var(--bg-glass)',
                    borderColor: 'var(--border-medium)',
                    duration: 0.3
                  })
                }}
              >
                Créer mon compte pro
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

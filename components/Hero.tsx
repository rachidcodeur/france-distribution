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
  const statsRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)

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
    if (statsRef.current) {
      Array.from(statsRef.current.children).forEach((child: any) => {
        gsap.set(child, { opacity: 1, y: 0, scale: 1 })
      })
    }

    const ctx = gsap.context(() => {
      // Animation d'entrée principale
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Background parallax
      if (backgroundRef.current) {
        gsap.to(backgroundRef.current, {
          yPercent: -20,
          scale: 1.1,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        })
      }

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

      // Stats avec counter animation
      if (statsRef.current && statsRef.current.children.length > 0) {
        gsap.fromTo(statsRef.current.children,
          { y: 30, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.2)',
            delay: 0.8
          }
        )
      }

      // Floating animation pour les éléments décoratifs
      gsap.to('.hero-decoration', {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        stagger: 0.5
      })
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
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--gradient-dark-alt)',
        paddingTop: '120px',
        paddingBottom: '80px'
      }}
    >
      {/* Background avec effet glass-morphism */}
      <div
        ref={backgroundRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(251, 109, 37, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(31, 46, 78, 0.3) 0%, transparent 50%),
            var(--gradient-dark-alt)
          `,
          zIndex: 0
        }}
      />

      {/* Éléments décoratifs animés */}
      <div
        className="hero-decoration"
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'var(--gradient-orange-glow)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.3,
          zIndex: 1
        }}
      />
      <div
        className="hero-decoration"
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'var(--gradient-orange-glow)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          opacity: 0.2,
          zIndex: 1
        }}
      />

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
                marginBottom: 'var(--spacing-2xl)'
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

            {/* Stats rapides */}
            <div 
              ref={statsRef}
              className="hero-stats"
              style={{
                display: 'flex',
                gap: 'var(--spacing-xl)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: 'var(--spacing-xl)',
                paddingTop: 'var(--spacing-xl)',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              {[
                { number: '500+', label: 'Villes' },
                { number: '5M+', label: 'Logements' },
                { number: '-40%', label: 'Économies' }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="stat-item"
                  style={{
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                      fontWeight: 700,
                      color: 'var(--orange-primary)',
                      marginBottom: '4px',
                      lineHeight: 1
                    }}
                  >
                    {stat.number}
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-tertiary)',
                      fontWeight: 500
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <p 
              className="hero-note" 
              style={{ 
                marginTop: 'var(--spacing-lg)', 
                fontSize: '14px', 
                color: 'var(--text-tertiary)', 
                textAlign: 'center' 
              }}
            >
              Cliquez sur le bouton ci-dessus pour explorer nos zones de distribution.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface PricingComparisonProps {
  variant?: 'fixed' | 'horizontal'
}

export default function PricingComparison({ variant = 'fixed' }: PricingComparisonProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current || variant !== 'horizontal') return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current ? Array.from(cardsRef.current.children) : []

      // S'assurer que les cartes sont visibles par défaut
      cards.forEach((card: any) => {
        gsap.set(card, { opacity: 1, y: 0, scale: 1 })
      })

      // Animation d'entrée
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { y: 50, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Hover animations
      Array.from(cards).forEach((card: any) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -8,
            scale: 1.02,
            duration: 0.3,
            ease: 'power2.out'
          })
        })

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          })
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [variant])

  if (variant === 'horizontal') {
    return (
      <section 
        ref={sectionRef}
        className="pricing-comparison-horizontal-section"
        style={{
          padding: 'var(--spacing-2xl) 0',
          background: 'transparent',
          position: 'relative'
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'var(--gradient-orange-glow)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.15,
            zIndex: 0
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="pricing-comparison-horizontal">
            <div className="pricing-comparison-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
              <h2 
                className="pricing-comparison-title-horizontal"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Réalisez jusqu'à{' '}
                <span style={{ 
                  color: 'var(--orange-primary)',
                  background: 'var(--gradient-main)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  -40%
                </span>{' '}
                d'économies sur une distribution
              </h2>
            </div>
            
            <div 
              ref={cardsRef}
              className="pricing-comparison-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-lg)',
                maxWidth: '1000px',
                margin: '0 auto var(--spacing-3xl)'
              }}
            >
              <div 
                className="pricing-option-horizontal"
                style={{
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="pricing-option-header-horizontal" style={{ marginBottom: 'var(--spacing-md)' }}>
                  <span 
                    className="pricing-option-label-horizontal"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Distribution solo
                  </span>
                </div>
                <div 
                  className="pricing-option-price-horizontal"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-xs)',
                    lineHeight: 1.2
                  }}
                >
                  300€
                </div>
                <div 
                  className="pricing-option-detail-horizontal"
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  pour 1 000 documents
                </div>
              </div>

              <div 
                className="pricing-option-horizontal pricing-option-featured-horizontal"
                style={{
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid var(--orange-primary)',
                  borderRadius: '20px',
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-glow)',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  overflow: 'visible'
                }}
              >
                <div 
                  className="pricing-badge-large"
                  style={{
                    position: 'absolute',
                    top: '-16px',
                    right: '20px',
                    background: 'var(--gradient-main)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-button)',
                    zIndex: 2
                  }}
                >
                  -40%
                </div>
                <div className="pricing-option-header-horizontal" style={{ marginBottom: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                  <span 
                    className="pricing-option-label-horizontal"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--orange-primary)'
                    }}
                  >
                    Distribution mutualisée
                  </span>
                </div>
                <div 
                  className="pricing-option-price-horizontal pricing-option-price-featured-horizontal"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 700,
                    background: 'var(--gradient-main)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 'var(--spacing-xs)',
                    lineHeight: 1.2
                  }}
                >
                  100€
                </div>
                <div 
                  className="pricing-option-detail-horizontal"
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  pour 1 000 documents
                </div>
              </div>

              <div 
                className="pricing-savings-horizontal"
                style={{
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <span 
                  className="pricing-savings-label-horizontal"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--spacing-sm)'
                  }}
                >
                  ÉCONOMIES ESTIMÉES
                </span>
                <div 
                  className="pricing-savings-amount-horizontal"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 700,
                    background: 'var(--gradient-main)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 'var(--spacing-xs)',
                    lineHeight: 1.2
                  }}
                >
                  200€
                </div>
                <div 
                  className="pricing-savings-detail-horizontal"
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  par tranche de 1 000 documents
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className="pricing-comparison-cta"
            style={{
              textAlign: 'center'
            }}
          >
            <a 
              href="/tournees" 
              className="btn btn-primary btn-large"
              style={{
                display: 'inline-block'
              }}
            >
              Participer à une tournée
            </a>
          </div>
        </div>
      </section>
    )
  }

  // Version originale (fixed/sticky)
  return (
    <div className="pricing-comparison-fixed">
      <h3 className="pricing-comparison-title">Comparaison tarifaire</h3>
      
      <div className="pricing-option">
        <div className="pricing-option-header">
          <span className="pricing-option-label">Distribution solo</span>
        </div>
        <div className="pricing-option-price">300€</div>
        <div className="pricing-option-detail">pour 1 000 documents</div>
      </div>

      <div className="pricing-option pricing-option-featured">
        <div className="pricing-option-header">
          <span className="pricing-option-label">Distribution mutualisée</span>
          <span className="pricing-badge">-40%</span>
        </div>
        <div className="pricing-option-price pricing-option-price-featured">100€</div>
        <div className="pricing-option-detail">pour 1 000 documents</div>
      </div>

      <div className="pricing-savings">
        <span className="pricing-savings-label">Économies estimées</span>
        <div className="pricing-savings-amount">200€</div>
        <div className="pricing-savings-detail">par tranche de 1 000 documents</div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const features = [
  {
    title: 'Économies jusqu\'à -50%',
    description: '100€/mille en mutualisé vs 200€/mille en solo',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(251, 109, 37, 0.15) 0%, rgba(232, 90, 26, 0.05) 100%)'
  },
  {
    title: 'Couverture nationale',
    description: 'Toutes les villes de plus de 10 000 logements',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(31, 46, 78, 0.2) 0%, rgba(26, 26, 36, 0.1) 100%)'
  },
  {
    title: 'Transparence totale',
    description: 'Participants visibles, volumes et dates clairs',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(251, 109, 37, 0.15) 0%, rgba(232, 90, 26, 0.05) 100%)'
  }
]

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return

    const ctx = gsap.context(() => {
      // Animation au scroll avec reveal
      const cards = cardsRef.current ? Array.from(cardsRef.current.children) : []
      
      // S'assurer que les cartes sont visibles par défaut
      cards.forEach((card: any) => {
        gsap.set(card, { opacity: 1, y: 0, scale: 1 })
      })
      
      if (cards.length > 0) {
        gsap.fromTo(cards, 
          { y: 60, opacity: 0, scale: 0.9 },
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

      // Hover animations pour chaque carte
      Array.from(cards).forEach((card: any) => {
        const icon = card.querySelector('.feature-icon')
        const cardElement = card as HTMLElement

        cardElement.addEventListener('mouseenter', () => {
          gsap.to(cardElement, {
            y: -8,
            scale: 1.02,
            boxShadow: 'var(--shadow-card-hover)',
            duration: 0.4,
            ease: 'power2.out'
          })
          gsap.to(icon, {
            scale: 1.1,
            rotation: 5,
            duration: 0.4,
            ease: 'back.out(1.5)'
          })
        })

        cardElement.addEventListener('mouseleave', () => {
          gsap.to(cardElement, {
            y: 0,
            scale: 1,
            boxShadow: 'var(--shadow-card)',
            duration: 0.4,
            ease: 'power2.out'
          })
          gsap.to(icon, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: 'power2.out'
          })
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="features" 
      id="features"
      style={{
        padding: 'var(--spacing-2xl) 0',
        background: 'transparent',
        position: 'relative'
      }}
    >
      <div className="container">
        <div 
          ref={cardsRef}
          className="features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-lg)',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: 'var(--spacing-xl)',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-card)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Gradient background */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: feature.gradient,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0'
                }}
              />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div 
                  className="feature-icon"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'var(--gradient-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    marginBottom: 'var(--spacing-md)',
                    boxShadow: 'var(--shadow-button)'
                  }}
                >
                  {feature.icon}
                </div>
                
                <h3 
                  className="feature-title"
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-sm)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.3
                  }}
                >
                  {feature.title}
                </h3>
                
                <p 
                  className="feature-description"
                  style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    fontSize: '0.95rem'
                  }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const steps = [
  {
    number: '1',
    title: 'Choisissez votre ville',
    description: 'Sélectionnez votre ville et un créneau semestriel',
    icon: '📍'
  },
  {
    number: '2',
    title: 'Rejoignez la tournée',
    description: 'Participez à une tournée mutualisée avec d\'autres entreprises local',
    icon: '🤝'
  },
  {
    number: '3',
    title: 'Suivez l\'avancement',
    description: 'Recevez votre rapport de distribution détaillé',
    icon: '📊'
  }
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return

    const ctx = gsap.context(() => {
      const stepsElements = stepsRef.current ? Array.from(stepsRef.current.children) : []
      
      // S'assurer que les éléments sont visibles par défaut
      stepsElements.forEach((step: any) => {
        gsap.set(step, { opacity: 1, y: 0, scale: 1 })
      })
      
      // Animation de la ligne de progression
      if (lineRef.current) {
        gsap.set(lineRef.current, { scaleY: 1 })
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0, transformOrigin: 'top' },
          {
            scaleY: 1,
            duration: 1.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Animation des étapes avec stagger
      if (stepsElements.length > 0) {
        gsap.fromTo(stepsElements,
          { y: 50, opacity: 0, scale: 0.8 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Animation des numéros
      stepsElements.forEach((step: any) => {
        const number = step.querySelector('.step-number')
        if (number) {
          gsap.from(number, {
            duration: 0.6,
            scale: 0,
            rotation: -180,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          })
        }
      })

      // Hover animations
      stepsElements.forEach((step: any) => {
        step.addEventListener('mouseenter', () => {
          gsap.to(step, {
            y: -8,
            scale: 1.03,
            duration: 0.3,
            ease: 'power2.out'
          })
          const number = step.querySelector('.step-number')
          if (number) {
            gsap.to(number, {
              scale: 1.1,
              rotation: 360,
              duration: 0.5,
              ease: 'back.out(1.5)'
            })
          }
        })

        step.addEventListener('mouseleave', () => {
          gsap.to(step, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          })
          const number = step.querySelector('.step-number')
          if (number) {
            gsap.to(number, {
              scale: 1,
              rotation: 0,
              duration: 0.3,
              ease: 'power2.out'
            })
          }
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="how-it-works" 
      id="how-it-works"
      style={{
        padding: 'var(--spacing-2xl) 0',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'var(--gradient-orange-glow)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.2,
          zIndex: 0
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <h2 
            className="section-title"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              marginBottom: 'var(--spacing-md)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Comment ça marche ?
          </h2>
          <p 
            className="section-subtitle"
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            Un processus simple en 3 étapes pour distribuer vos prospectus efficacement
          </p>
        </div>

        <div 
          ref={stepsRef}
          className="steps-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-xl)',
            maxWidth: '1100px',
            margin: '0 auto',
            position: 'relative',
            padding: 'var(--spacing-xl) 0'
          }}
        >
          {/* Ligne de connexion verticale (mobile) / horizontale (desktop) */}
          <div
            ref={lineRef}
            style={{
              position: 'absolute',
              top: '80px',
              left: '40px',
              right: '40px',
              height: '2px',
              background: 'var(--gradient-main)',
              zIndex: 0,
              display: 'none'
            }}
            className="timeline-line-desktop"
          />
          <div
            ref={lineRef}
            style={{
              position: 'absolute',
              top: '40px',
              bottom: '40px',
              left: '40px',
              width: '2px',
              background: 'var(--gradient-main)',
              zIndex: 0,
              display: 'none'
            }}
            className="timeline-line-mobile"
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className="step-card"
              style={{
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                className="step-number"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--gradient-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'white',
                  margin: '0 auto var(--spacing-md)',
                  boxShadow: 'var(--shadow-button)',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                {step.number}
              </div>

              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: 'var(--spacing-sm)',
                  lineHeight: 1
                }}
              >
                {step.icon}
              </div>

              <h3 
                className="step-title"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--text-primary)'
                }}
              >
                {step.title}
              </h3>
              
              <p 
                className="step-description"
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  fontSize: '0.95rem'
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .timeline-line-desktop {
            display: block !important;
          }
        }
        @media (max-width: 767px) {
          .timeline-line-mobile {
            display: block !important;
          }
        }
      `}</style>
    </section>
  )
}

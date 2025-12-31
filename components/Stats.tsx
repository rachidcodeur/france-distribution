'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const stats = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    number: '500',
    suffix: '+',
    label: 'Villes couvertes',
    duration: 2
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
        <path d="M9 22V12H15V22"/>
      </svg>
    ),
    number: '5',
    suffix: 'M+',
    label: 'Logements distribués',
    duration: 2.5
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    number: '1200',
    suffix: '+',
    label: 'Clients satisfaits',
    duration: 2
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"/>
      </svg>
    ),
    number: '40',
    suffix: '%',
    label: 'Économies moyennes',
    duration: 2,
    prefix: '-'
  }
]

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current || counted) return

    const ctx = gsap.context(() => {
      const statsElements = statsRef.current ? Array.from(statsRef.current.children) : []

      // S'assurer que les éléments sont visibles par défaut
      statsElements.forEach((stat: any) => {
        gsap.set(stat, { opacity: 1, y: 0, scale: 1 })
      })

      // Animation d'entrée des cartes
      if (statsElements.length > 0) {
        gsap.fromTo(statsElements,
          { y: 50, opacity: 0, scale: 0.9 },
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
              toggleActions: 'play none none none',
              onEnter: () => {
                setCounted(true)
              }
            }
          }
        )
      }

      // Counter animations
      statsElements.forEach((statElement: any, index) => {
        const numberElement = statElement.querySelector('.stat-number')
        if (!numberElement) return

        const statData = stats[index] // Utiliser la constante stats définie en haut
        if (!statData || !statData.number) return

        const targetNumber = parseFloat(statData.number)
        const prefix = statData.prefix || ''
        const suffix = statData.suffix || ''

        ScrollTrigger.create({
          trigger: statElement,
          start: 'top 80%',
          onEnter: () => {
            const obj = { value: 0 }
            gsap.to(obj, {
              value: targetNumber,
              duration: statData.duration || 2,
              ease: 'power2.out',
              onUpdate: () => {
                if (numberElement && statData.number) {
                  const formattedValue = statData.number.includes('M') 
                    ? (obj.value / 1000).toFixed(1) + 'M'
                    : Math.round(obj.value).toString()
                  numberElement.textContent = prefix + formattedValue + suffix
                }
              }
            })
          }
        })
      })

      // Hover animations
      statsElements.forEach((stat: any) => {
        const icon = stat.querySelector('.stat-icon')
        
        stat.addEventListener('mouseenter', () => {
          gsap.to(stat, {
            y: -8,
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
          })
          if (icon) {
            gsap.to(icon, {
              scale: 1.15,
              rotation: 5,
              duration: 0.3,
              ease: 'back.out(1.5)'
            })
          }
        })

        stat.addEventListener('mouseleave', () => {
          gsap.to(stat, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          })
          if (icon) {
            gsap.to(icon, {
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
  }, [counted])

  return (
    <section 
      ref={sectionRef}
      className="stats-section"
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
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'var(--gradient-orange-glow)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          opacity: 0.15,
          zIndex: 0
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div 
          ref={statsRef}
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-xl)',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-item"
              style={{
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Gradient overlay on hover */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'var(--gradient-orange-glow)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.3'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0'
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div 
                  className="stat-icon"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '16px',
                    background: 'var(--gradient-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    margin: '0 auto var(--spacing-md)',
                    boxShadow: 'var(--shadow-button)'
                  }}
                >
                  {stat.icon}
                </div>
                
                <span 
                  className="stat-number"
                  style={{
                    display: 'block',
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
                  {stat.prefix || ''}{stat.number}{stat.suffix}
                </span>
                
                <span 
                  className="stat-label"
                  style={{
                    display: 'block',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  }}
                >
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

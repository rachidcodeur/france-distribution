'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function HeroBanner() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !heroRef.current) return

    if (titleRef.current) gsap.set(titleRef.current, { opacity: 1, y: 0 })
    if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 1, y: 0 })
    if (ctaRef.current) {
      Array.from(ctaRef.current.children).forEach((child: any) => {
        gsap.set(child, { opacity: 1, y: 0 })
      })
    }

    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { y: 80, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
        )
      }

      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 }
        )
      }

      if (ctaRef.current && ctaRef.current.children.length > 0) {
        gsap.fromTo(
          ctaRef.current.children,
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
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={heroRef}
      className="hero"
      id="accueil-banniere"
      style={{
        position: 'relative',
        minHeight: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'transparent',
        paddingTop: 'calc(88px + 3vh)',
        paddingBottom: 'var(--spacing-lg)',
        marginBottom: '0px',
        zIndex: 3
      }}
    >
      <div
        className="container"
        style={{ position: 'relative', zIndex: 2, paddingLeft: '30px', paddingRight: '30px' }}
      >
        <div
          className="hero-content"
          style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}
        >
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
              <span
                className="cinquante"
                style={{
                  color: 'var(--orange-primary)',
                  background: 'var(--gradient-main)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  position: 'relative'
                }}
              >
                -50%
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
              France Distribution, spécialiste de la distribution d'imprimés, a créé la toute
              première plateforme en France dédiée aux commerçants et artisans pour mutualiser leurs
              tournées de boîtes aux lettres. Le principe est simple : vous rejoignez une tournée
              existante avec d'autres entreprises locales, ce qui permet de partager les frais et
              d'obtenir un tarif nettement plus avantageux qu'une distribution en solo.
            </p>

            <div
              ref={ctaRef}
              className="hero-cta"
              style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 'var(--spacing-md)',
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
                Voir le Planning
              </a>

              <a
                href="tel:+33978288462"
                className="btn btn-secondary btn-large"
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-medium)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9841 21.5573 21.2126 21.3522 21.3992C21.1471 21.5858 20.9053 21.7262 20.6426 21.8111C20.38 21.896 20.1025 21.9235 19.83 21.892C16.7438 21.4556 13.787 20.3831 11.19 18.75C8.77382 17.3057 6.72533 15.2572 5.28 12.84C3.64698 10.2435 2.57451 7.28737 2.138 4.202C2.10651 3.92947 2.13399 3.652 2.21891 3.38936C2.30382 3.12672 2.44416 2.88489 2.63078 2.67978C2.8174 2.47467 3.04589 2.31107 3.30085 2.19946C3.55581 2.08785 3.8315 2.03086 4.11 2.032H7.11C7.59357 2.03203 8.06714 2.16723 8.47473 2.42161C8.88232 2.67599 9.20787 3.03916 9.414 3.468L10.844 6.3C11.0481 6.72454 11.1231 7.20104 11.0606 7.67012C10.9981 8.1392 10.8006 8.58172 10.492 8.94L8.5 11.06C9.69604 13.4085 11.5915 15.304 13.94 16.5L16.06 14.508C16.4183 14.1994 16.8608 14.0019 17.3299 13.9394C17.799 13.8769 18.2755 13.9519 18.7 14.156L21.532 15.586C21.9608 15.7921 22.324 16.1177 22.5784 16.5253C22.8328 16.9329 22.968 17.4064 22.968 17.89V20.89H22.968Z"
                    fill="currentColor"
                  />
                </svg>
                09 78 28 84 62
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

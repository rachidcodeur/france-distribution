'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Image from 'next/image'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const partenaires = [
  {
    name: 'Nexora',
    description: 'Agence web innovante qui crée des sites web assistés par l\'IA à des tarifs compétitifs',
    image: '/partenaires/nexora-rea.webp',
    url: 'https://nexora.fr',
    tag: 'Création de sites web',
    color: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
  },
  {
    name: 'Home Service',
    description: 'Plateforme de mise en relation entre artisans et clients pour tous vos travaux d\'habitat',
    image: '/partenaires/home-service-rea.webp',
    url: 'https://home-service.fr',
    tag: 'Travaux & Rénovation',
    color: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
  },
  {
    name: 'Distribution Réa',
    description: 'Demandez des devis pour la distribution de flyers et documents publicitaires pour votre entreprise',
    image: '/partenaires/distri-rea.webp',
    url: 'https://distribution-rea.fr',
    tag: 'Distribution de flyers',
    color: 'linear-gradient(135deg, rgba(251, 109, 37, 0.2) 0%, rgba(232, 90, 26, 0.1) 100%)'
  }
]

export default function Partenaires() {
  const sectionRef = useRef<HTMLElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-slide toutes les 3 secondes
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % partenaires.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  // Animation du slider avec GSAP
  useEffect(() => {
    if (typeof window === 'undefined' || !sliderRef.current) return

    const cards = Array.from(sliderRef.current.children) as HTMLElement[]
    
    cards.forEach((card, index) => {
      if (index === currentIndex) {
        gsap.to(card, {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          zIndex: 5,
          duration: 0.8,
          ease: 'power3.out'
        })
      } else {
        // Masquer les cartes non actives
        gsap.to(card, {
          opacity: 0,
          scale: 0.8,
          x: index < currentIndex ? -100 : 100,
          y: 0,
          zIndex: 1,
          duration: 0.8,
          ease: 'power3.out'
        })
      }
    })
  }, [currentIndex])

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return

    const ctx = gsap.context(() => {
      // Animation du titre
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 1, y: 0 })
        gsap.fromTo(titleRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Initialiser les cartes
      if (sliderRef.current) {
        const cards = Array.from(sliderRef.current.children) as HTMLElement[]
        cards.forEach((card, index) => {
          gsap.set(card, {
            opacity: index === 0 ? 1 : 0,
            scale: index === 0 ? 1 : 0.8,
            x: 0,
            y: 0,
            zIndex: index === 0 ? 5 : 1
          })
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="partenaires" 
      id="partenaires"
      style={{
        padding: 'var(--spacing-2xl) 0',
        background: 'transparent',
        position: 'relative'
      }}
    >
      <div className="container" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 var(--spacing-lg)' }}>
        {/* Titre de la section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50px',
              marginBottom: 'var(--spacing-md)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--orange-primary)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Nos Partenaires
          </div>
          <h2
            ref={titleRef}
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 700,
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)',
              lineHeight: 1.2
            }}
          >
            Découvrez nos partenaires de confiance
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            Des solutions complémentaires pour développer votre activité
          </p>
        </div>

        {/* Slider des partenaires */}
        <div
          style={{
            position: 'relative',
            maxWidth: '800px',
            margin: '0 auto',
            overflow: 'hidden',
            padding: 'var(--spacing-2xl) 100px'
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={sliderRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '600px'
            }}
          >
            {partenaires.map((partenaire, index) => (
              <a
                key={index}
                href={partenaire.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  maxWidth: '600px',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: index === currentIndex ? 'pointer' : 'default',
                  pointerEvents: index === currentIndex ? 'auto' : 'none',
                  zIndex: index === currentIndex ? 5 : 1
                }}
              >
              <div
                className="partenaire-card"
                style={{
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '24px',
                  padding: 'var(--spacing-3xl)',
                  transition: 'all 0.3s ease',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  const gradient = e.currentTarget.querySelector('.partenaire-gradient') as HTMLElement
                  const image = e.currentTarget.querySelector('.partenaire-image') as HTMLElement
                  const shine = e.currentTarget.querySelector('.partenaire-shine') as HTMLElement
                  const link = e.currentTarget.querySelector('.partenaire-link svg') as HTMLElement
                  if (gradient) gradient.style.opacity = '1'
                  if (image) image.style.transform = 'scale(1.05)'
                  if (shine) shine.style.transform = 'rotate(45deg) translate(100%, 100%)'
                  if (link) link.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  const gradient = e.currentTarget.querySelector('.partenaire-gradient') as HTMLElement
                  const image = e.currentTarget.querySelector('.partenaire-image') as HTMLElement
                  const shine = e.currentTarget.querySelector('.partenaire-shine') as HTMLElement
                  const link = e.currentTarget.querySelector('.partenaire-link svg') as HTMLElement
                  if (gradient) gradient.style.opacity = '0'
                  if (image) image.style.transform = 'scale(1)'
                  if (shine) shine.style.transform = 'rotate(45deg)'
                  if (link) link.style.transform = 'translateX(0)'
                }}
              >
                {/* Gradient background au hover */}
                <div
                  className="partenaire-gradient"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: partenaire.color,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 0
                  }}
                />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Tag */}
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      background: 'rgba(251, 109, 37, 0.15)',
                      border: '1px solid rgba(251, 109, 37, 0.3)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--orange-primary)',
                      marginBottom: 'var(--spacing-md)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {partenaire.tag}
                  </div>

                  {/* Image */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '240px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: 'var(--spacing-lg)',
                      background: 'var(--bg-accent)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <Image
                      src={partenaire.image}
                      alt={partenaire.name}
                      fill
                      style={{
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      className="partenaire-image"
                    />
                  </div>

                  {/* Nom */}
                  <h3
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-sm)',
                      lineHeight: 1.3
                    }}
                  >
                    {partenaire.name}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '15px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: 'var(--spacing-md)',
                      flex: 1
                    }}
                  >
                    {partenaire.description}
                  </p>

                  {/* Lien */}
                  <div
                    className="partenaire-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--orange-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginTop: 'auto'
                    }}
                  >
                    <span>Découvrir</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Effet de brillance au hover */}
                <div
                  className="partenaire-shine"
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                    transform: 'rotate(45deg)',
                    transition: 'transform 0.6s ease',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
              </div>
            </a>
            ))}
          </div>

          {/* Indicateurs de pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: 'var(--spacing-xl)',
              alignItems: 'center'
            }}
          >
            {partenaires.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                style={{
                  width: index === currentIndex ? '32px' : '12px',
                  height: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: index === currentIndex 
                    ? 'var(--orange-primary)' 
                    : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
                aria-label={`Aller au partenaire ${index + 1}`}
              />
            ))}
          </div>

          {/* Flèches de navigation */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + partenaires.length) % partenaires.length)}
            onMouseEnter={(e) => {
              setIsPaused(true)
              e.currentTarget.style.background = 'var(--orange-primary)'
              e.currentTarget.style.borderColor = 'var(--orange-primary)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              setIsPaused(false)
              e.currentTarget.style.background = 'var(--bg-glass)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
            style={{
              position: 'absolute',
              left: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(10px)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10,
              boxShadow: 'var(--shadow-card)'
            }}
            aria-label="Partenaire précédent"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % partenaires.length)}
            onMouseEnter={(e) => {
              setIsPaused(true)
              e.currentTarget.style.background = 'var(--orange-primary)'
              e.currentTarget.style.borderColor = 'var(--orange-primary)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              setIsPaused(false)
              e.currentTarget.style.background = 'var(--bg-glass)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
            style={{
              position: 'absolute',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(10px)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10,
              boxShadow: 'var(--shadow-card)'
            }}
            aria-label="Partenaire suivant"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}


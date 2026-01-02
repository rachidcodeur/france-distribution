'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return

    const ctx = gsap.context(() => {
      // S'assurer que les éléments sont visibles par défaut
      if (imageRef.current) {
        gsap.set(imageRef.current, { opacity: 1, x: 0, scale: 1 })
      }
      if (contentRef.current) {
        Array.from(contentRef.current.children).forEach((child: any) => {
          gsap.set(child, { opacity: 1, y: 0 })
        })
      }

      // Animation de l'image
      if (imageRef.current) {
        gsap.fromTo(imageRef.current,
          { x: -50, opacity: 0, scale: 0.95 },
          {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Animation du contenu
      if (contentRef.current && contentRef.current.children.length > 0) {
        gsap.fromTo(contentRef.current.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
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

      // Parallax sur l'image
      gsap.to(imageRef.current, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
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
          bottom: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'var(--gradient-orange-glow)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.2,
          zIndex: 0
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div 
          className="about-section-grid" 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-xl)',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {/* Colonne gauche - Image */}
          <div
            ref={imageRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: '400px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card-hover)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Image
              src="/image-about-france-distri.webp"
              alt="France Distribution"
              fill
              style={{
                objectFit: 'cover'
              }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay gradient */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(251, 109, 37, 0.1) 0%, transparent 100%)',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Colonne droite - Contenu */}
          <div ref={contentRef}>
            <h2 
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 'var(--spacing-lg)',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                lineHeight: '1.2'
              }}
            >
              Pourquoi France Distribution ?
            </h2>
            
            <div 
              style={{
                fontSize: '16px',
                lineHeight: '2',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}
            >
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                France Distribution est la <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>première plateforme</strong> dédiée à la <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>distribution mutualisée</strong> de flyers & prospectus en boîtes aux lettres sur toute la France, pensée pour <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>réduire drastiquement les coûts</strong> de diffusion tout en garantissant une organisation simple et transparente.
              </p>
              
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                Grâce à un système collaboratif, jusqu'à <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>5 entreprises</strong> peuvent partager une même tournée, ce qui permet de diviser les frais logistiques et d'atteindre jusqu'à <strong className="cinquante" style={{ color: 'var(--orange-primary)', fontWeight: 600 }}>-50% d'économies</strong> par rapport à une distribution classique en solo.
              </p>
              
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                Nous couvrons toute la France sur les <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>villes de + de 10 000 habitants</strong>, planifions nos opérations selon un <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>calendrier semestriel en ligne</strong>, et fournissons un <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>suivi fiable</strong> avec <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>rapports détaillés</strong> pour chaque campagne <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>en temps réel</strong>.
              </p>
              
              <p style={{ marginBottom: 0 }}>
                Notre mission : rendre la <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>distribution physique</strong> plus accessible, plus rentable et plus efficace, tout en offrant une <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>visibilité</strong> à vos supports.
              </p>
            </div>

            <Link
              href="/tournees"
              className="btn btn-primary btn-large"
              style={{
                display: 'inline-block',
                textDecoration: 'none'
              }}
            >
              Voir les tournées
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'

export default function Loader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Bloquer le scroll pendant le chargement
    document.body.style.overflow = 'hidden'
    
    // Simuler le chargement
    const timer = setTimeout(() => {
      setIsLoading(false)
      document.body.style.overflow = ''
    }, 1500)

    // Animation du loader
    if (isLoading) {
      const tl = gsap.timeline({ repeat: -1 })
      
      // Animation du camion
      tl.to('.loader-truck', {
        x: 100,
        duration: 1.5,
        ease: 'power1.inOut'
      })
      .to('.loader-truck', {
        x: 0,
        duration: 1.5,
        ease: 'power1.inOut'
      })

      // Animation des flyers qui tombent
      gsap.to('.loader-flyer', {
        y: 20,
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: 'power1.inOut',
        stagger: 0.2
      })

      // Animation du cercle
      gsap.to('.loader-circle', {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: 'linear'
      })
    }

    return () => {
      clearTimeout(timer)
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        gap: 'var(--spacing-xl)'
      }}
    >
      {/* Logo ou icône */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px'
        }}
      >
        {/* Cercle animé */}
        <svg
          className="loader-circle"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--orange-primary)"
            strokeWidth="3"
            strokeDasharray="314"
            strokeDashoffset="157"
            opacity="0.3"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--orange-primary)"
            strokeWidth="3"
            strokeDasharray="157"
            strokeDashoffset="0"
            strokeLinecap="round"
          />
        </svg>

        {/* Camion animé */}
        <div
          className="loader-truck"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '40px'
          }}
        >
          <svg
            width="60"
            height="40"
            viewBox="0 0 60 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Corps du camion */}
            <rect
              x="10"
              y="15"
              width="30"
              height="20"
              fill="var(--orange-primary)"
              rx="2"
            />
            {/* Fenêtre */}
            <rect
              x="15"
              y="18"
              width="8"
              height="8"
              fill="var(--bg-primary)"
              rx="1"
            />
            {/* Roues */}
            <circle
              cx="18"
              cy="35"
              r="5"
              fill="var(--bg-secondary)"
              stroke="var(--orange-primary)"
              strokeWidth="2"
            />
            <circle
              cx="32"
              cy="35"
              r="5"
              fill="var(--bg-secondary)"
              stroke="var(--orange-primary)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Flyers qui tombent */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="loader-flyer"
            style={{
              position: 'absolute',
              top: `${20 + i * 15}%`,
              left: `${30 + i * 20}%`,
              width: '12px',
              height: '16px',
              background: 'var(--orange-primary)',
              borderRadius: '2px',
              opacity: 0.7
            }}
          />
        ))}
      </div>

      {/* Texte de chargement */}
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          fontWeight: 500,
          letterSpacing: '0.05em'
        }}
      >
        Chargement...
      </div>

      {/* Barre de progression */}
      <div
        style={{
          width: '200px',
          height: '4px',
          background: 'var(--bg-secondary)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'var(--gradient-main)',
            transform: 'translateX(-100%)',
            animation: 'loading 1.5s ease-in-out infinite'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}


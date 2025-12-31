'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [authLoading, setAuthLoading] = useState(true) // État de chargement de l'authentification

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const dropdownContainer = target.closest('[data-user-dropdown]')
      if (showUserDropdown && !dropdownContainer) {
        setShowUserDropdown(false)
      }
    }

    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showUserDropdown])

  useEffect(() => {
    // Vérifier immédiatement dans localStorage pour éviter le flash
    if (typeof window !== 'undefined') {
      const cachedAuth = localStorage.getItem('user_authenticated')
      if (cachedAuth === 'true') {
        // On suppose que l'utilisateur est connecté pour afficher immédiatement l'icône
        // La vérification réelle se fera en arrière-plan
        setAuthLoading(false)
        // On peut aussi essayer de récupérer l'utilisateur depuis la session Supabase si disponible
        // mais on ne bloque pas l'affichage
      } else if (cachedAuth === 'false') {
        // On sait que l'utilisateur n'est pas connecté
        setAuthLoading(false)
      } else {
        // Pas de cache, on affiche le bouton par défaut (non connecté)
        // et on vérifiera en arrière-plan
        setAuthLoading(false)
      }
    }

    if (!isSupabaseConfigured()) {
      setAuthLoading(false)
      return
    }

    // Vérifier l'état de connexion réel avec Supabase en arrière-plan
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoading(false)
      // Mettre à jour le cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_authenticated', user ? 'true' : 'false')
      }
    }).catch(() => {
      setAuthLoading(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_authenticated', 'false')
      }
    })

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setAuthLoading(false)
      // Mettre à jour le cache à chaque changement
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_authenticated', currentUser ? 'true' : 'false')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleAuthClick = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Mettre à jour le cache immédiatement
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_authenticated', 'false')
    }
    setUser(null)
    setShowUserDropdown(false)
    router.push('/')
  }

  return (
    <header className="header" id="header" style={{ boxShadow: scrolled ? '0 12px 40px rgba(0, 0, 0, 0.55)' : '0 4px 18px rgba(0, 0, 0, 0.08)' }}>
      <div className="container">
        <nav className="nav">
          <div className="logo">
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Image 
                src="/logo-france-distribution.webp" 
                alt="France Distribution" 
                width={150}
                height={50}
                style={{ objectFit: 'contain', height: 'auto' }}
                priority
              />
            </Link>
          </div>
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`} id="navLinks">
            <li><Link href="/tournees" className="nav-link" onClick={closeMenu}>Tournées</Link></li>
            <li><Link href="/#services" className="nav-link" onClick={closeMenu}>Services</Link></li>
            <li><Link href="/#faq" className="nav-link" onClick={closeMenu}>FAQ</Link></li>
            <li><Link href="/contact" className="nav-link" onClick={closeMenu}>Contact</Link></li>
          </ul>
          {authLoading ? (
            // Afficher un espace réservé pendant le chargement pour éviter le flash
            <div 
              className="nav-cta"
              style={{
                width: '28px',
                height: '28px',
                opacity: 0
              }}
            />
          ) : user ? (
            <div 
              className="nav-cta"
              data-user-dropdown
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid var(--orange-primary)',
                padding: '4px',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowUserDropdown(!showUserDropdown)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 109, 37, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ 
                  color: 'var(--orange-primary)',
                  transition: 'all 0.25s ease'
                }}
                title="Mon compte"
              >
                <path 
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                  fill="var(--orange-primary)"
                />
                <path 
                  d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" 
                  fill="var(--orange-primary)"
                />
              </svg>
              
              {showUserDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                    borderRadius: '8px',
                    padding: '8px 0',
                    minWidth: '240px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                >
                  <Link
                    href="/dashboard"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(251, 109, 37, 0.1)'
                      e.currentTarget.style.color = 'var(--orange-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ 
                        color: 'var(--orange-primary)',
                        marginRight: '4px',
                        flexShrink: 0
                      }}
                    >
                      <path 
                        d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" 
                        fill="currentColor"
                      />
                    </svg>
                    Tableau de bord
                  </Link>
                  <Link
                    href="/parametres"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(251, 109, 37, 0.1)'
                      e.currentTarget.style.color = 'var(--orange-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ 
                        color: 'var(--orange-primary)',
                        marginRight: '4px',
                        flexShrink: 0
                      }}
                    >
                      <path 
                        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
                        fill="currentColor"
                      />
                    </svg>
                    Paramètres
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(244, 67, 54, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ 
                        color: '#f44336',
                        marginRight: '4px',
                        flexShrink: 0
                      }}
                    >
                      <path 
                        d="M16 17V14H9V10H16V7L21 12L16 17ZM14 2C15.1 2 16 2.9 16 4V6H14V4H5V20H14V18H16V20C16 21.1 15.1 22 14 22H5C3.9 22 3 21.1 3 20V4C3 2.9 3.9 2 5 2H14Z" 
                        fill="currentColor"
                      />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
              <style jsx>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>
          ) : (
            <button 
              className="btn btn-primary nav-cta" 
              id="headerCta"
              onClick={handleAuthClick}
            >
              Créer mon compte
            </button>
          )}
          <button 
            className="mobile-menu-toggle" 
            id="mobileMenuToggle" 
            aria-label="Menu mobile"
            onClick={toggleMenu}
          >
            <span style={{ transform: isMenuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }}></span>
            <span style={{ opacity: isMenuOpen ? 0 : 1 }}></span>
            <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }}></span>
          </button>
        </nav>
      </div>
    </header>
  )
}

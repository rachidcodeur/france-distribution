'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function GSAPAnimations() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Attendre que le DOM soit complètement chargé
    const initAnimations = () => {
      // Hero animations
      const heroTimeline = gsap.timeline()
    
    heroTimeline
      .from('.hero-title', {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
      })
      .from('.hero-subtitle', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
      }, '-=0.5')
      .from('.hero-cta', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
      }, '-=0.4')
      .from('.hero-stats .stat-item', {
        duration: 0.6,
        y: 20,
        opacity: 0,
        stagger: 0.15,
        ease: 'power3.out'
      }, '-=0.3')
      .from('.hero-image-wrapper', {
        duration: 1.2,
        scale: 0.9,
        opacity: 0,
        ease: 'power3.out'
      }, '-=1')

    // Animate stats numbers
    const statNumbers = document.querySelectorAll('.stat-number')
    statNumbers.forEach(stat => {
      const target = stat.textContent || ''
      const isNumber = /^\d+/.test(target)
      
      if (isNumber) {
        const number = parseInt(target.replace(/\D/g, ''))
        const suffix = target.replace(/\d/g, '')
        
        gsap.to({ value: 0 }, {
          value: number,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stat,
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          onUpdate: function() {
            if (stat) {
              stat.textContent = Math.round(this.targets()[0].value) + suffix
            }
          }
        })
      }
    })

    // Service cards animations
    gsap.utils.toArray('.service-card').forEach((card: any, index: number) => {
      gsap.from(card, {
        duration: 0.8,
        y: 50,
        opacity: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.1
      })
      
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          duration: 0.3,
          y: -4,
          ease: 'power2.out'
        })
      })
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          duration: 0.3,
          y: 0,
          ease: 'power2.out'
        })
      })
    })

    // Pricing cards animations
    gsap.utils.toArray('.pricing-card').forEach((card: any, index: number) => {
      gsap.from(card, {
        duration: 0.8,
        y: 50,
        opacity: 0,
        scale: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.15
      })
    })

    // Section headers animations
    gsap.utils.toArray('.section-header').forEach((header: any) => {
      const title = header.querySelector('.section-title')
      const subtitle = header.querySelector('.section-subtitle')
      
      // S'assurer que les éléments sont visibles par défaut
      if (title) {
        gsap.set(title, { opacity: 1, y: 0 })
        // Animation seulement si l'élément n'est pas déjà visible
        const titleRect = title.getBoundingClientRect()
        if (titleRect.top > window.innerHeight * 0.8) {
          gsap.fromTo(title, 
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none none'
              }
            }
          )
        }
      }
      
      if (subtitle) {
        gsap.set(subtitle, { opacity: 1, y: 0 })
        const subtitleRect = subtitle.getBoundingClientRect()
        if (subtitleRect.top > window.innerHeight * 0.8) {
          gsap.fromTo(subtitle,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none none'
              },
              delay: 0.2
            }
          )
        }
      }
    })

    // Contact items animations
    gsap.utils.toArray('.contact-item').forEach((item: any, index: number) => {
      gsap.from(item, {
        duration: 0.8,
        x: -30,
        opacity: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.15
      })
    })

    // Form groups animations
    gsap.utils.toArray('.form-group').forEach((group: any, index: number) => {
      gsap.from(group, {
        duration: 0.6,
        y: 20,
        opacity: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-form',
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.1
      })
    })

    // Parallax effect on hero
    gsap.to('.hero-image-wrapper', {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })

    // Floating animation for service icons
    gsap.utils.toArray('.service-icon').forEach((icon: any, index: number) => {
      gsap.to(icon, {
        duration: 2 + (index * 0.2),
        y: -10,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: index * 0.3
      })
    })

    // Button hover animations
    document.querySelectorAll('.btn').forEach((btn: any) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, {
          duration: 0.25,
          scale: 1.05,
          ease: 'power2.out'
        })
      })
      
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          duration: 0.25,
          scale: 1,
          ease: 'power2.out'
        })
      })
    })

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.querySelector((anchor as HTMLAnchorElement).getAttribute('href') || '')
        
        if (target) {
          const headerHeight = 88
          const targetPosition = (target as HTMLElement).offsetTop - headerHeight
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          })
        }
      })
    })

    // FAQ animations
    const faqItems = document.querySelectorAll('.faq-item')
    faqItems.forEach(item => {
      gsap.from(item, {
        duration: 0.6,
        y: 30,
        opacity: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
    })
    }

    // Attendre le chargement complet et s'assurer que le DOM est prêt
    let cleanup: (() => void) | undefined
    
    const runAnimations = () => {
      // Attendre un peu pour que le DOM soit complètement rendu
      setTimeout(() => {
        initAnimations()
        // Marquer que les animations sont chargées
        document.body.classList.add('animations-loaded')
        cleanup = () => {
          ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
      }, 100)
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      runAnimations()
    } else {
      const handleLoad = () => {
        runAnimations()
      }
      window.addEventListener('load', handleLoad)
      document.addEventListener('DOMContentLoaded', handleLoad)
      
      return () => {
        window.removeEventListener('load', handleLoad)
        document.removeEventListener('DOMContentLoaded', handleLoad)
        if (cleanup) cleanup()
      }
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return null
}


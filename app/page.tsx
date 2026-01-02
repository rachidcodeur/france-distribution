import Header from '@/components/Header'
import Hero from '@/components/Hero'
import PricingComparison from '@/components/PricingComparison'
import AboutSection from '@/components/AboutSection'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Stats from '@/components/Stats'
import CTA from '@/components/CTA'
import Services from '@/components/Services'
import Partenaires from '@/components/Partenaires'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'
import Loader from '@/components/Loader'

export default function Home() {
  return (
    <main>
      <Loader />
      <div
        className="parent"
        style={{
          background: 'var(--gradient-dark-alt)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Header />
        <Hero />
        
        {/* Section des statistiques sous la bannière */}
        <section
          className="hero-stats-section"
          style={{
            paddingTop: '30px',
            paddingBottom: 'calc(var(--spacing-2xl) - 80px)',
            paddingLeft: '0',
            paddingRight: '0',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div className="container">
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                maxWidth: '800px',
                margin: '0 auto',
                paddingTop: 'var(--spacing-lg)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-2xl)',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}
              >
              {[
                { number: '2500+', label: 'Villes' },
                { number: '20M+', label: 'Logements' },
                { number: '-50%', label: 'Économies' }
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: 'center',
                    flex: '0 1 auto'
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                      fontWeight: 700,
                      color: 'var(--orange-primary)',
                      marginBottom: '4px',
                      lineHeight: 1
                    }}
                  >
                    {stat.number}
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 400,
                      marginTop: '4px'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
              </div>
              <p 
                style={{ 
                  marginTop: 'var(--spacing-lg)', 
                  fontSize: '14px', 
                  color: 'var(--text-tertiary)', 
                  textAlign: 'center' 
                }}
              >
                Cliquez sur le bouton ci-dessus pour explorer nos zones de distribution.
              </p>
            </div>
          </div>
        </section>
      </div>
      <div
        style={{
          background: 'var(--gradient-dark)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Effets blur orange de part et d'autre */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '-5%',
            width: '400px',
            height: '400px',
            background: 'var(--gradient-orange-glow)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.3,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '-5%',
            width: '500px',
            height: '500px',
            background: 'var(--gradient-orange-glow)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.25,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: '350px',
            height: '350px',
            background: 'var(--gradient-orange-glow)',
            borderRadius: '50%',
            filter: 'blur(70px)',
            opacity: 0.2,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '300px',
            height: '300px',
            background: 'var(--gradient-orange-glow)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            opacity: 0.3,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <PricingComparison variant="horizontal" />
          <AboutSection />
          <Features />
          <HowItWorks />
          <Stats />
          <CTA />
          <Services />
          <Partenaires />
          <FAQ />
        </div>
        <Footer />
      </div>
      <GSAPAnimations />
    </main>
  )
}

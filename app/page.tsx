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
      <Header />
      <Hero />
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

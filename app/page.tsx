import Link from 'next/link'
import Header from '@/components/Header'
import HeroBanner from '@/components/HeroBanner'
import PricingComparison from '@/components/PricingComparison'
import AboutSection from '@/components/AboutSection'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Stats from '@/components/Stats'
import CTA from '@/components/CTA'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'
import Loader from '@/components/Loader'

export default function Home() {
  const regions = [
    {
      name: 'Île-de-France',
      cities: [
        'Paris',
        'Boulogne-Billancourt',
        'Saint-Denis',
        'Argenteuil',
        'Montreuil',
        'Nanterre',
        'Versailles',
        'Créteil',
        'Courbevoie',
        'Vitry-sur-Seine'
      ]
    },
    {
      name: 'Auvergne-Rhône-Alpes',
      cities: [
        'Lyon',
        'Grenoble',
        'Saint-Étienne',
        'Clermont-Ferrand',
        'Annecy',
        'Chambéry',
        'Valence',
        'Bourg-en-Bresse',
        'Roanne',
        'Vénissieux'
      ]
    },
    {
      name: 'Grand Est',
      cities: [
        'Strasbourg',
        'Reims',
        'Metz',
        'Mulhouse',
        'Nancy',
        'Troyes',
        'Colmar',
        'Charleville-Mézières',
        'Épinal',
        'Châlons-en-Champagne'
      ]
    },
    {
      name: 'Nouvelle-Aquitaine',
      cities: [
        'Bordeaux',
        'Limoges',
        'Poitiers',
        'Pau',
        'La Rochelle',
        'Bayonne',
        'Périgueux',
        'Angoulême',
        'Brive-la-Gaillarde',
        'Niort'
      ]
    },
    {
      name: 'Pays de la Loire',
      cities: [
        'Nantes',
        'Angers',
        'Le Mans',
        'Saint-Nazaire',
        'La Roche-sur-Yon',
        'Laval',
        'Cholet',
        'Saint-Herblain',
        'Rezé',
        'Saumur'
      ]
    },
    {
      name: 'Normandie',
      cities: [
        'Rouen',
        'Caen',
        'Le Havre',
        'Cherbourg-en-Cotentin',
        'Évreux',
        'Dieppe',
        'Alençon',
        'Saint-Lô',
        'Lisieux',
        'Bayeux'
      ]
    },
    {
      name: 'Occitanie',
      cities: [
        'Toulouse',
        'Montpellier',
        'Nîmes',
        'Perpignan',
        'Béziers',
        'Narbonne',
        'Albi',
        'Carcassonne',
        'Sète',
        'Tarbes'
      ]
    },
    {
      name: 'Bretagne',
      cities: [
        'Rennes',
        'Brest',
        'Quimper',
        'Lorient',
        'Vannes',
        'Saint-Brieuc',
        'Saint-Malo',
        'Lannion',
        'Concarneau',
        'Morlaix'
      ]
    },
    {
      name: 'Centre-Val de Loire',
      cities: [
        'Orléans',
        'Tours',
        'Bourges',
        'Chartres',
        'Blois',
        'Châteauroux',
        'Joué-lès-Tours',
        'Vierzon',
        'Dreux',
        'Montargis'
      ]
    },
    {
      name: 'Provence-Alpes-Côte d\'Azur',
      cities: [
        'Marseille',
        'Nice',
        'Toulon',
        'Aix-en-Provence',
        'Avignon',
        'Cannes',
        'Antibes',
        'Fréjus',
        'Arles',
        'Gap'
      ]
    },
    {
      name: 'Hauts-de-France',
      cities: [
        'Lille',
        'Amiens',
        'Roubaix',
        'Tourcoing',
        'Dunkerque',
        'Calais',
        'Saint-Quentin',
        'Arras',
        'Valenciennes',
        'Beauvais'
      ]
    },
    {
      name: 'Bourgogne-Franche-Comté',
      cities: [
        'Dijon',
        'Besançon',
        'Belfort',
        'Chalon-sur-Saône',
        'Nevers',
        'Auxerre',
        'Mâcon',
        'Le Creusot',
        'Montbéliard',
        'Dole'
      ]
    }
  ]

  return (
    <main>
      <Loader />
      <div
        className="parent hero-background"
        style={{
          backgroundColor: '#0f1220',
          backgroundImage: `
            radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%),
            radial-gradient(600px 400px at 15% 35%, rgba(255, 138, 76, 0.35), transparent 70%),
            radial-gradient(700px 500px at 85% 40%, rgba(80, 140, 255, 0.35), transparent 75%),
            linear-gradient(120deg, #0f1220 0%, #151a2e 40%, #1a2140 100%)
          `,
          position: 'relative',
          overflow: 'hidden',
          paddingLeft: '15px',
          paddingRight: '15px'
        }}
      >
        <Header />
        <HeroBanner />
        
        {/* Section des statistiques sous la bannière */}
        <section
          className="hero-stats-section"
          style={{
            paddingTop: '0px',
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
                margin: '7px auto',
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
                  fontSize: '11px', 
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
          {/* Section CTA avec fond hero */}
          <section 
            className="cta-section"
            style={{
              backgroundColor: '#0f1220',
              backgroundImage: `
                radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%),
                radial-gradient(600px 400px at 15% 35%, rgba(255, 138, 76, 0.35), transparent 70%),
                radial-gradient(700px 500px at 85% 40%, rgba(80, 140, 255, 0.35), transparent 75%),
                linear-gradient(120deg, #0f1220 0%, #151a2e 40%, #1a2140 100%)
              `
            }}
          >
            <div className="container">
              <div className="cta-content">
                <h2 className="cta-title">Prêt à économiser sur vos distributions ?</h2>
                <p className="cta-subtitle">Rejoignez des centaines d'entreprises qui font confiance à France Distribution</p>
                <div className="cta-buttons">
                  <a href="/tournees" className="btn btn-primary btn-large">Voir les tournées disponibles</a>
                  <a 
                    href="tel:+33978288462" 
                    className="btn btn-secondary btn-large"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center'
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
          </section>
          <FAQ />
          <section
            className="communes-section"
            style={{
              padding: 'var(--spacing-3xl) 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="container">
              <div className="section-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 className="section-title">Communes couvertes par région</h2>
                <p className="section-subtitle">
                  Retrouvez les principales villes où nous intervenons aujourd&apos;hui.
                </p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--spacing-md)'
                }}
              >
                {regions.map((region) => (
                  <div
                    key={region.name}
                    style={{
                      background: 'rgba(23, 28, 40, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: 'var(--spacing-lg)'
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-md)'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ color: 'var(--orange-primary)', display: 'inline-flex' }}>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6Zm0 8.5A2.5 2.5 0 1 1 12 5a2.5 2.5 0 0 1 0 5Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        {region.name}
                      </span>
                    </h3>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px 10px'
                      }}
                    >
                      {region.cities.map((city) => (
                        <li
                          key={city}
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--text-tertiary)',
                              marginRight: '6px'
                            }}
                          >
                            •
                          </span>
                          {city === 'Paris' ? (
                            <Link
                              href="/distribution-flyer-paris"
                              style={{ color: 'var(--orange-primary)', textDecoration: 'underline' }}
                            >
                              {city}
                            </Link>
                          ) : (
                            city
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
      <GSAPAnimations />
    </main>
  )
}

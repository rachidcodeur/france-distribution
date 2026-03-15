import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'

export const metadata: Metadata = {
  title: 'Diffusion de flyer et prospectus à Paris',
  description:
    'Distribution de flyers et prospectus à Paris (75) : boîtes aux lettres, street marketing, tournées partagées et suivi transparent avec France Distribution.'
}

export default function ParisPage() {
  return (
    <main>
      <Header />
      <section
        className="city-hero-section"
        style={{
          marginTop: '88px',
          padding: 'var(--spacing-4xl) 0',
          background: 'var(--gradient-dark)'
        }}
      >
        <div className="container">
          <div className="city-hero">
            <div className="city-hero-content">
              <h1 className="city-hero-title">Diffusion de flyer et prospectus à Paris</h1>
              <p className="city-hero-text">
                À Paris (75), nous organisons des campagnes de distribution adaptées aux flux locaux :
                quartiers commerçants, zones résidentielles et grands axes comme les Champs-Élysées ou
                les abords de la Gare de Lyon. Du 1er au 20e arrondissement, nos tournées mutualisées
                permettent d&apos;optimiser vos budgets tout en gardant un suivi précis.
              </p>
              <div className="city-hero-actions">
                <Link href="/devis?ville=Paris" className="btn btn-primary btn-large">
                  Demander un devis
                </Link>
              </div>
            </div>
            <div className="city-hero-media">
              <Image
                src="/images/villes/paris.webp"
                alt="Vue de Paris pour une campagne de distribution locale"
                width={720}
                height={480}
                className="city-hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="city-info-section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 className="section-title">Paris, une ville à forte densité de diffusion</h2>
            <p className="section-subtitle">
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                Focus local pour une distribution de flyers et prospectus vraiment ciblée.
              </span>
            </p>
          </div>
          <div className="city-info-content">
            <p>
              Paris est au cœur de la région <strong style={{ color: '#ffffff' }}>Île-de-France</strong> et constitue le département
              <strong style={{ color: '#ffffff' }}>75</strong>. Avec environ <strong style={{ color: '#ffffff' }}>2,1 millions d&apos;habitants</strong>, la capitale
              se compose de 20 arrondissements aux
              identités fortes : du Marais à Belleville, de Montparnasse aux Batignolles, en passant
              par Bastille, République ou le Quartier Latin. Cette diversité de quartiers exige une
              approche fine pour adapter la diffusion au rythme des habitants.
            </p>
            <p>
              D&apos;après nos données logement, la zone parisienne représente près de 1,39 million de
              logements potentiels pour la distribution d&apos;imprimés. Cela permet de déployer des
              campagnes ciblées dans les immeubles du 1er au 20e, tout en optimisant les tournées
              selon la densité de population et les axes de circulation locaux.
            </p>
            <p>
              Ce contexte unique fait de Paris un terrain privilégié pour la distribution
              d&apos;imprimés publicitaires, avec des volumes ajustables et une visibilité renforcée
              dans les zones à fort passage comme les gares, les grands boulevards et les centres
              commerciaux.
            </p>
            <p>
              Pour mieux comprendre l&apos;organisation locale, consultez le{' '}
              <a
                href="https://www.paris.fr/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--orange-primary)', textDecoration: 'underline' }}
              >
                site officiel de la Ville de Paris
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="city-services-section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 className="section-title">Nos services de distribution à Paris</h2>
            <p className="section-subtitle">
              Trois formats pensés pour maximiser votre visibilité dans la capitale.
            </p>
          </div>

          <div className="city-service-card">
            <div className="city-service-content">
              <h3>Distribution de flyers et prospectus à Paris</h3>
              <p>
                Créer de la visibilité dans l&apos;espace public parisien repose sur la capacité à
                intervenir là où les habitants circulent réellement. La distribution de flyers et
                la distribution de prospectus permettent de diffuser vos imprimés directement au
                contact du public, dans un contexte dynamique et dense. À Paris (75), cette approche
                s&apos;intègre à une ville rythmée par les déplacements quotidiens, la vie de quartier
                et l&apos;activité commerciale. La diffusion de supports se module selon la diversité
                des arrondissements et les contraintes logistiques de la capitale.
              </p>
              <p>
                Les opérations sont menées sur des zones stratégiques : centre-ville, Marais,
                Bastille, Belleville ou abords des gares. Nos équipes ciblent les flux pertinents
                tout en respectant les impératifs locaux, afin d&apos;assurer un impact concret et un
                retour mesurable. Pour renforcer la notoriété, nous pouvons combiner main à main,
                dépôts ciblés et distribution en boîtes aux lettres, selon la zone de chalandise
                souhaitée. Cette logique permet d&apos;adapter la diffusion aux profils d&apos;habitants et
                aux habitudes de consommation, du Quartier Latin aux grands boulevards.
              </p>
              <Link href="/devis?ville=Paris" className="btn btn-primary btn-large">
                Devis gratuit
              </Link>
            </div>
            <div className="city-service-media">
              <Image
                src="/images/services villes/distri flyers et propectus.webp"
                alt="Distribution de flyers et prospectus à Paris"
                width={600}
                height={420}
                className="city-service-image"
              />
            </div>
          </div>

          <div className="city-service-card">
            <div className="city-service-content">
              <h3>Distribution de bulletins et journaux municipaux</h3>
              <p>
                Informer efficacement les habitants parisiens implique une distribution régulière
                et rigoureuse des bulletins municipaux. Nous intervenons dans les quartiers à forte
                densité résidentielle, autour du canal Saint-Martin, des rives de Seine ou des
                secteurs pavillonnaires de l&apos;est parisien. Les tournées sont planifiées pour couvrir
                les immeubles du 1er au 20e arrondissement, en tenant compte des contraintes d&apos;accès
                et de la configuration des bâtiments.
              </p>
              <p>
                Notre dispositif est adapté aux volumes institutionnels : suivi de la diffusion,
                traçabilité des zones couvertes et optimisation des coûts pour les collectivités du
                75 et de la petite couronne. Nous privilégions une organisation claire avec points
                de contrôle et reporting, ce qui sécurise la bonne réception des informations
                publiques. Cette méthode est particulièrement efficace pour toucher les foyers
                situés près des mairies d&apos;arrondissement, des écoles et des équipements municipaux.
              </p>
              <Link href="/devis?ville=Paris" className="btn btn-primary btn-large">
                Devis gratuit
              </Link>
            </div>
            <div className="city-service-media">
              <Image
                src="/images/services villes/distri journal municipal.webp"
                alt="Distribution de journaux municipaux à Paris"
                width={600}
                height={420}
                className="city-service-image"
              />
            </div>
          </div>

          <div className="city-service-card">
            <div className="city-service-content">
              <h3>Distribution d&apos;imprimés publicitaires en Île-de-France</h3>
              <p>
                La distribution d&apos;imprimés publicitaires s&apos;adresse aux enseignes locales et aux
                réseaux nationaux qui souhaitent renforcer leur présence en Île-de-France. Nous
                ciblons les zones stratégiques autour de Paris : sorties de métro, quartiers
                d&apos;affaires comme La Défense, zones commerçantes et grands axes du 75. Cette approche
                renforce la notoriété de marque tout en générant un trafic qualifié vers vos points
                de vente.
              </p>
              <p>
                Nous adaptons les itinéraires selon les périodes clés, les opérations saisonnières
                et les événements parisiens afin de maximiser l&apos;efficacité de chaque campagne. Les
                secteurs à forte affluence comme Opéra, République ou Nation sont travaillés avec
                précision pour capter une audience active, tandis que les zones résidentielles sont
                privilégiées pour des actions plus durables. Cette combinaison permet de déployer
                des campagnes cohérentes, adaptées aux enjeux du marché parisien.
              </p>
              <Link href="/devis?ville=Paris" className="btn btn-primary btn-large">
                Devis gratuit
              </Link>
            </div>
            <div className="city-service-media">
              <Image
                src="/images/services villes/distribution imprimes publicitaires.webp"
                alt="Distribution d'imprimés publicitaires à Paris"
                width={600}
                height={420}
                className="city-service-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="city-methods-section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 className="section-title">Nos différents canaux de distribution à Paris</h2>
            <p className="section-subtitle">
              Deux canaux complémentaires pour toucher efficacement vos audiences parisiennes.
            </p>
          </div>
          <div className="city-methods-grid">
            <div className="city-method-card">
              <h3>Distribution en boîtes aux lettres</h3>
              <div className="city-method-media">
                <Image
                  src="/images/services villes/distribution boites aux lettres.webp"
                  alt="Distribution en boîtes aux lettres à Paris"
                  width={520}
                  height={360}
                  className="city-method-image"
                />
              </div>
              <p>
                Nous couvrons les immeubles résidentiels et les zones pavillonnaires, du 15e à la
                porte de Vincennes, avec un passage méthodique et un contrôle précis des secteurs.
                La distribution en boîtes aux lettres offre une visibilité durable, car votre
                message reste disponible au domicile des habitants et s&apos;intègre à leurs habitudes
                quotidiennes.
              </p>
              <p>
                À Paris (75), nous adaptons la tournée aux accès immeubles, aux digicodes et aux
                spécificités des quartiers, du nord du 18e aux artères du 13e. Ce canal est idéal
                pour les campagnes qui visent une couverture régulière et une présence locale stable.
              </p>
            </div>
            <div className="city-method-card">
              <h3>Street marketing ou main à main</h3>
              <div className="city-method-media">
                <Image
                  src="/images/street-marketing.webp"
                  alt="Street marketing à Paris pour diffuser vos flyers"
                  width={520}
                  height={360}
                  className="city-method-image"
                />
              </div>
              <p>
                Pour les zones à fort passage comme les Halles, Opéra ou La Défense, nous mettons en
                place des actions de street marketing dynamiques, avec des équipes visibles et des
                créneaux pensés pour maximiser le flux. C&apos;est une solution parfaite pour générer du
                trafic immédiat en point de vente et favoriser l&apos;interaction avec le public.
              </p>
              <p>
                Les opérations sont ajustées selon les horaires d&apos;affluence, les sorties de métro et
                les événements parisiens. Cette approche permet d&apos;associer votre marque à l&apos;énergie
                de la ville, tout en gardant un ciblage précis des audiences locales.
              </p>
              <p>
                En savoir plus sur la vie locale via le{' '}
                <a
                  href="https://www.paris.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  site officiel de la Ville de Paris
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="city-nearby-cards-section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 className="section-title">Nos zones d’intervention autour de Paris</h2>
            <p className="section-subtitle">
              Nous intervenons dans plusieurs communes de l’Île-de-France pour vos campagnes de distribution.
            </p>
          </div>
          <div className="city-nearby-cards">
            {[
              { name: 'Boulogne-Billancourt', slug: 'boulogne-billancourt', image: '/images/villes/boulogne-billancourt.webp' },
              { name: 'Saint-Denis', slug: 'saint-denis', image: '/images/villes/saint-denis.webp' },
              { name: 'Argenteuil', slug: 'argenteuil', image: '/images/villes/argenteuil.webp' },
              { name: 'Montreuil', slug: 'montreuil', image: '/images/villes/montreuil.webp' }
            ].map((city) => (
              <Link
                key={city.slug}
                href={`/distribution-flyer-${city.slug}`}
                className="city-nearby-card"
              >
                <div className="city-nearby-card-image">
                  <Image
                    src={city.image}
                    alt={`Distribution de flyers à ${city.name}`}
                    width={320}
                    height={220}
                  />
                </div>
                <div className="city-nearby-card-body">
                  <h3>{city.name}</h3>
                  <span>Cliquez</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <GSAPAnimations />
    </main>
  )
}

'use client'

const pricingPlans = [
  {
    title: 'Starter',
    price: '0,15€',
    unit: '/ flyer',
    features: [
      'Distribution jusqu\'à 1 000 flyers',
      'Zone de votre choix',
      'Rapport de distribution',
      'Délai : 48h'
    ],
    buttonText: 'Choisir cette formule',
    featured: false
  },
  {
    title: 'Pro',
    price: '0,12€',
    unit: '/ flyer',
    features: [
      'Distribution jusqu\'à 5 000 flyers',
      'Zones multiples',
      'Rapport détaillé avec photos',
      'Délai : 24h',
      'Support prioritaire'
    ],
    buttonText: 'Choisir cette formule',
    featured: true,
    badge: 'Populaire'
  },
  {
    title: 'Enterprise',
    price: 'Sur mesure',
    unit: '',
    features: [
      'Distribution illimitée',
      'Toutes zones',
      'Rapport complet personnalisé',
      'Délai express : 12h',
      'Dédié account manager',
      'Tarifs dégressifs'
    ],
    buttonText: 'Nous contacter',
    featured: false
  }
]

export default function Pricing() {
  return (
    <section className="pricing" id="tarifs">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Nos Tarifs</h2>
          <p className="section-subtitle">Des formules adaptées à tous les budgets</p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.featured ? 'pricing-featured' : ''}`}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
              <div className="pricing-header">
                <h3 className="pricing-title">{plan.title}</h3>
                <div className="pricing-price">
                  <span className="price-amount">{plan.price}</span>
                  {plan.unit && <span className="price-unit">{plan.unit}</span>}
                </div>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <button className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} btn-full`}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


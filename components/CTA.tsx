'use client'

export default function CTA() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">Prêt à économiser sur vos distributions ?</h2>
          <p className="cta-subtitle">Rejoignez des centaines d'entreprises qui font confiance à France Distribution</p>
          <div className="cta-buttons">
            <a href="/tournees" className="btn btn-primary btn-large">Voir les tournées disponibles</a>
            <button className="btn btn-secondary btn-large">Découvrir nos tarifs</button>
          </div>
        </div>
      </div>
    </section>
  )
}


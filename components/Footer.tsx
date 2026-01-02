'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                <Image 
                  src="/logo-france-distribution.webp" 
                  alt="France Distribution" 
                  width={180}
                  height={60}
                  style={{ objectFit: 'contain', height: 'auto', marginBottom: '8px' }}
                />
              </Link>
            </div>
            <p className="footer-description">
              La distribution mutualisée qui réduit vos coûts jusqu'à <span className="cinquante">-50%</span>. Couverture nationale, transparence totale.
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">Navigation</h4>
            <ul className="footer-links">
              <li><a href="#accueil">Annuaire</a></li>
              <li><a href="#features">Mutualisation</a></li>
              <li><a href="#tarifs">Tarifs</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#about">À propos</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">Services</h4>
            <ul className="footer-links">
              <li><a href="#services">Création de flyers</a></li>
              <li><a href="#services">Impression</a></li>
              <li><a href="#services">Création de sites</a></li>
              <li><a href="#services">Réseaux sociaux</a></li>
              <li><a href="#avis">Avis Google</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-links" style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '8px' }}>123 Avenue de la République</li>
              <li style={{ marginBottom: '8px' }}>75011 Paris, France</li>
              <li style={{ marginBottom: '8px' }}>09 78 28 84 62</li>
              <li><a href="mailto:contact@france-distribution.fr">contact@france-distribution.fr</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 France Distribution. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center' }}>
            <a href="#mentions" style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Mentions légales</a>
            <a href="#cgv" style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>CGV</a>
            <a href="#confidentialite" style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function MentionsLegalesPage() {
  return (
    <main>
      <Header />
      <section className="mentions-legales-section" style={{ 
        marginTop: '88px', 
        padding: 'var(--spacing-4xl) 0', 
        background: 'var(--gradient-dark)' 
      }}>
        <div className="container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)',
              textAlign: 'center',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
            }}>
              Mentions légales
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-2xl)',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}>
              Informations légales du site distribution-flyers.fr
            </p>

            <div style={{
              background: '#171c28',
              borderRadius: '16px',
              padding: 'var(--spacing-2xl)',
              border: '2px solid #353550',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              {/* 1. Éditeur du site */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  1. Éditeur du site
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>France Distribution</strong></p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Siège social : 5 Rue Fénelon 33000 BORDEAUX</p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Téléphone : <a href="tel:+33978288462" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>09 78 28 84 62</a></p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Email : <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>contact@distribution-flyers.fr</a></p>
                  <p>Directeur de la publication : France Distribution</p>
                </div>
              </div>

              {/* 2. Hébergeur */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  2. Hébergeur
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Hostinger</strong></p>
                  <p><a href="https://www.hostinger.fr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>https://www.hostinger.fr/</a></p>
                </div>
              </div>

              {/* 3. Propriété intellectuelle */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  3. Propriété intellectuelle
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
                  </p>
                  <p>
                    La reproduction des textes de ce site sur un support papier est autorisée, tout particulièrement dans le cadre pédagogique, sous réserve du respect des trois conditions suivantes :
                  </p>
                  <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Gratuité de la diffusion</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Respect de l'intégrité des documents reproduits : pas de modification ni altération d'aucune sorte</li>
                    <li>Citation claire et lisible de la source sous la forme suivante : "Ce document provient du site internet distribution-flyers.fr de Distribution Flyers. Les droits de reproduction sont réservés et strictement limités."</li>
                  </ul>
                </div>
              </div>

              {/* 4. Protection des données personnelles */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  4. Protection des données personnelles
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi n°78-17 du 6 janvier 1978 modifiée relative à l'informatique, aux fichiers et aux libertés, vous disposez des droits suivants :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Droit d'accès à vos données personnelles</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Droit de rectification de vos données</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Droit à l'effacement de vos données</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Droit à la limitation du traitement</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Droit d'opposition au traitement</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Droit à la portabilité des données</li>
                  </ul>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Pour exercer ces droits ou pour toute question sur le traitement de vos données dans ce dispositif, vous pouvez nous contacter :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Par email : <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>contact@distribution-flyers.fr</a></li>
                    <li>Par courrier : France Distribution - 5 Rue Fénelon 33000 BORDEAUX</li>
                  </ul>
                  <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Si vous estimez, après nous avoir contactés, que vos droits « Informatique et Libertés » ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL :
                  </p>
                  <div style={{
                    background: 'rgba(251, 109, 37, 0.1)',
                    border: '1px solid var(--orange-primary)',
                    borderRadius: '8px',
                    padding: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-md)'
                  }}>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Commission Nationale de l'Informatique et des Libertés</strong></p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07</p>
                    <p>Tél : 01 53 73 22 22</p>
                  </div>
                </div>
              </div>

              {/* 5. Cookies */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  5. Cookies
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Le site distribution-flyers.fr peut être amené à vous demander l'acceptation de cookies pour des besoins de statistiques et d'affichage. Un cookie est une information déposée sur votre disque dur par le serveur du site que vous visitez.
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Il contient plusieurs données qui sont stockées sur votre ordinateur dans un simple fichier texte auquel un serveur accède pour lire et enregistrer des informations. Certaines parties de ce site ne peuvent être fonctionnelles sans l'acceptation de cookies.
                  </p>
                  <p>
                    Vous pouvez configurer votre navigateur pour refuser l'installation des cookies. Pour plus d'informations sur les cookies et leur gestion, veuillez consulter notre Politique de confidentialité.
                  </p>
                </div>
              </div>

              {/* 6. Limitation de responsabilité */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  6. Limitation de responsabilité
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Si vous constatez une lacune, erreur ou ce qui paraît être un dysfonctionnement, merci de bien vouloir le signaler par email, à l'adresse <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>contact@distribution-flyers.fr</a>, en décrivant le problème de la manière la plus précise possible (page posant problème, type d'ordinateur et de navigateur utilisé, …).
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Tout contenu téléchargé se fait aux risques et périls de l'utilisateur et sous sa seule responsabilité. En conséquence, France Distribution ne saurait être tenu responsable d'un quelconque dommage subi par l'ordinateur de l'utilisateur ou d'une quelconque perte de données consécutives au téléchargement.
                  </p>
                  <p>
                    Les liens hypertextes mis en place dans le cadre du présent site internet en direction d'autres ressources présentes sur le réseau Internet ne sauraient engager la responsabilité de France Distribution.
                  </p>
                </div>
              </div>

              {/* 7. Litiges */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  7. Litiges
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p>
                    Les présentes conditions sont régies par les lois françaises et toute contestation ou litiges qui pourraient naître de l'interprétation ou de l'exécution de celles-ci seront de la compétence exclusive des tribunaux dont dépend le siège social de France Distribution. La langue de référence, pour le règlement de contentieux éventuels, est le français.
                  </p>
                </div>
              </div>

              {/* 8. Crédits */}
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  8. Crédits
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Conception et réalisation : Distribution Flyers</p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Technologies utilisées : HTML5, CSS3, JavaScript</p>
                  <p>Date de dernière mise à jour : 04-12-2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}


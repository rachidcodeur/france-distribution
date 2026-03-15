'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PolitiqueConfidentialitePage() {
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
              marginBottom: 'var(--spacing-md)',
              textAlign: 'center',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
            }}>
              Politique de confidentialité
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-sm)',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}>
              Protection de vos données personnelles conformément au RGPD
            </p>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-2xl)',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}>
              Dernière mise à jour : 04-12-2025
            </p>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-2xl)',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
            }}>
              Cette politique de confidentialité s'applique au site distribution-flyers.fr et décrit comment nous collectons, utilisons et protégeons vos données personnelles.
            </p>

            <div style={{
              background: '#171c28',
              borderRadius: '16px',
              padding: 'var(--spacing-2xl)',
              border: '2px solid #353550',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              {/* 1. Responsable du traitement */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  1. Responsable du traitement
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Le responsable du traitement des données personnelles collectées sur le site distribution-flyers.fr est :
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>France Distribution</strong></p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>5 Rue Fénelon 33000 BORDEAUX</p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Email : <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>contact@distribution-flyers.fr</a></p>
                  <p style={{ marginBottom: 'var(--spacing-xs)' }}>Téléphone : <a href="tel:+33978288462" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>09 78 28 84 62</a></p>
                  <p>
                    Pour toute question relative à la protection de vos données personnelles, vous pouvez nous contacter aux coordonnées ci-dessus ou via notre formulaire de contact.
                  </p>
                </div>
              </div>

              {/* 2. Données collectées */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  2. Données collectées
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Nous collectons différents types de données selon votre interaction avec notre site :
                  </p>
                  
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    2.1. Données collectées via le formulaire de contact
                  </h3>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Nom et prénom</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Adresse email</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Numéro de téléphone</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Nom de l'entreprise ou organisme (facultatif)</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Lieu de distribution souhaité</li>
                    <li>Détails du projet de distribution</li>
                  </ul>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    2.2. Données collectées automatiquement
                  </h3>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Adresse IP</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Type de navigateur et système d'exploitation</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Pages visitées et temps passé sur le site</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Site référent (d'où vous venez)</li>
                    <li>Date et heure de visite</li>
                  </ul>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    2.3. Cookies et technologies similaires
                  </h3>
                  <p>
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site. Voir la section 7 pour plus de détails.
                  </p>
                </div>
              </div>

              {/* 3. Finalités du traitement */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  3. Finalités du traitement
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Vos données personnelles sont collectées et traitées pour les finalités suivantes :
                  </p>
                  <div style={{
                    overflowX: 'auto',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginTop: 'var(--spacing-md)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ background: 'rgba(251, 109, 37, 0.2)' }}>
                          <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)', border: '1px solid #353550' }}>Finalité</th>
                          <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)', border: '1px solid #353550' }}>Base légale</th>
                          <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)', border: '1px solid #353550' }}>Durée de conservation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Répondre à vos demandes de devis</td>
                          <td data-label="Base légale :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Votre consentement / Intérêt légitime</td>
                          <td data-label="Durée de conservation :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>3 ans après le dernier contact</td>
                        </tr>
                        <tr style={{ background: 'rgba(0, 0, 0, 0.1)' }}>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Gérer la relation client</td>
                          <td data-label="Base légale :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Exécution du contrat</td>
                          <td data-label="Durée de conservation :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Durée de la relation commerciale + 3 ans</td>
                        </tr>
                        <tr>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Envoyer des informations commerciales</td>
                          <td data-label="Base légale :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Votre consentement</td>
                          <td data-label="Durée de conservation :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>3 ans après le dernier contact ou désinscription</td>
                        </tr>
                        <tr style={{ background: 'rgba(0, 0, 0, 0.1)' }}>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Améliorer nos services</td>
                          <td data-label="Base légale :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Intérêt légitime</td>
                          <td data-label="Durée de conservation :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>13 mois pour les données analytics</td>
                        </tr>
                        <tr>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Respecter nos obligations légales</td>
                          <td data-label="Base légale :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Obligation légale</td>
                          <td data-label="Durée de conservation :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Selon les délais légaux applicables</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 4. Destinataires des données */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  4. Destinataires des données
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Vos données personnelles peuvent être partagées avec :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Nos équipes internes</strong> : Service commercial, service client, équipes de distribution</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Nos prestataires techniques</strong> :
                      <ul style={{ marginTop: 'var(--spacing-xs)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Hébergeur web (Hostinger)</li>
                        <li>Services d'emailing (si applicable)</li>
                        <li>Services d'analyse web (Google Analytics)</li>
                      </ul>
                    </li>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Autorités légales</strong> : Sur demande légale uniquement</li>
                  </ul>
                  <p>
                    Nous ne vendons, ne louons ni ne partageons vos données personnelles à des tiers à des fins de marketing sans votre consentement explicite.
                  </p>
                </div>
              </div>

              {/* 5. Sécurité des données */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  5. Sécurité des données
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>L'accès non autorisé</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>La modification, divulgation ou destruction non autorisée</li>
                    <li>La perte accidentelle</li>
                  </ul>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Ces mesures incluent notamment :
                  </p>
                  <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Le chiffrement SSL/TLS pour les transmissions de données</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Des accès restreints aux données personnelles</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Des sauvegardes régulières</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>La sensibilisation de notre personnel à la protection des données</li>
                    <li>Des mises à jour de sécurité régulières</li>
                  </ul>
                </div>
              </div>

              {/* 6. Vos droits */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  6. Vos droits
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
                  </p>
                  
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    6.1. Liste de vos droits
                  </h3>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Droit d'accès</strong> : Obtenir confirmation du traitement et accès à vos données</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Droit de rectification</strong> : Corriger vos données inexactes ou incomplètes</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Droit à l'effacement</strong> : Demander la suppression de vos données dans certains cas</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Droit à la limitation</strong> : Limiter le traitement de vos données</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Droit d'opposition</strong> : Vous opposer au traitement de vos données</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Droit à la portabilité</strong> : Recevoir vos données dans un format structuré</li>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Droit de retirer votre consentement</strong> : À tout moment pour les traitements basés sur le consentement</li>
                  </ul>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    6.2. Comment exercer vos droits
                  </h3>
                  <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Pour exercer vos droits, vous pouvez nous contacter :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Par email : <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>contact@distribution-flyers.fr</a></li>
                    <li>Par courrier : Distribution Flyers - 5 Rue Fénelon 33000 BORDEAUX</li>
                  </ul>
                  <p>
                    Nous nous engageons à répondre à votre demande dans un délai d'un mois maximum. Ce délai peut être prolongé de deux mois en cas de complexité de la demande.
                  </p>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    6.3. Réclamation auprès de la CNIL
                  </h3>
                  <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :
                  </p>
                  <div style={{
                    background: 'rgba(251, 109, 37, 0.1)',
                    border: '1px solid var(--orange-primary)',
                    borderRadius: '8px',
                    padding: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-md)'
                  }}>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Commission Nationale de l'Informatique et des Libertés</strong></p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>3 Place de Fontenoy - TSA 80715</p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>75334 PARIS CEDEX 07</p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>Téléphone : 01 53 73 22 22</p>
                    <p>Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>www.cnil.fr</a></p>
                  </div>
                </div>
              </div>

              {/* 7. Cookies */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  7. Cookies
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    7.1. Qu'est-ce qu'un cookie ?
                  </h3>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Un cookie est un petit fichier texte déposé sur votre ordinateur lors de la visite d'un site web. Il permet de mémoriser certaines informations pour améliorer votre expérience de navigation.
                  </p>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    7.2. Types de cookies utilisés
                  </h3>
                  <div style={{
                    overflowX: 'auto',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginTop: 'var(--spacing-md)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ background: 'rgba(251, 109, 37, 0.2)' }}>
                          <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)', border: '1px solid #353550' }}>Type de cookie</th>
                          <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)', border: '1px solid #353550' }}>Finalité</th>
                          <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)', border: '1px solid #353550' }}>Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td data-label="Type de cookie :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Cookies essentiels</td>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Nécessaires au fonctionnement du site (navigation, formulaires)</td>
                          <td data-label="Durée :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Session</td>
                        </tr>
                        <tr style={{ background: 'rgba(0, 0, 0, 0.1)' }}>
                          <td data-label="Type de cookie :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Cookies de performance</td>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Analyse de l'utilisation du site (Google Analytics)</td>
                          <td data-label="Durée :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>13 mois</td>
                        </tr>
                        <tr>
                          <td data-label="Type de cookie :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Cookies de fonctionnalité</td>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Mémorisation de vos préférences</td>
                          <td data-label="Durée :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>12 mois</td>
                        </tr>
                        <tr style={{ background: 'rgba(0, 0, 0, 0.1)' }}>
                          <td data-label="Type de cookie :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Cookies marketing</td>
                          <td data-label="Finalité :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>Personnalisation des publicités (si applicable)</td>
                          <td data-label="Durée :" style={{ padding: 'var(--spacing-sm)', border: '1px solid #353550' }}>13 mois</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-sm)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    7.3. Gestion des cookies
                  </h3>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Vous pouvez accepter ou refuser les cookies lors de votre première visite sur notre site via notre bandeau de consentement.
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Vous pouvez également configurer votre navigateur pour :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Accepter ou refuser systématiquement les cookies</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Être averti avant l'installation d'un cookie</li>
                    <li>Supprimer les cookies déjà installés</li>
                  </ul>
                  <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Instructions pour les principaux navigateurs :
                  </p>
                  <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Google Chrome</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Mozilla Firefox</li>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Safari</li>
                    <li>Microsoft Edge</li>
                  </ul>
                  <p style={{ marginTop: 'var(--spacing-md)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Attention</strong> : Le refus des cookies peut limiter certaines fonctionnalités du site.
                  </p>
                </div>
              </div>

              {/* 8. Transferts internationaux */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  8. Transferts internationaux
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Vos données sont hébergées en France/Union Européenne et ne font pas l'objet de transferts hors de l'Espace Économique Européen, sauf dans les cas suivants :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li>Utilisation de Google Analytics (transferts vers les États-Unis avec garanties appropriées)</li>
                  </ul>
                  <p>
                    Dans ces cas, nous nous assurons que des garanties appropriées sont mises en place (clauses contractuelles types, Privacy Shield, ou tout autre mécanisme reconnu par la Commission européenne).
                  </p>
                </div>
              </div>

              {/* 9. Mineurs */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  9. Mineurs
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Notre site n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles de mineurs de moins de 16 ans sans le consentement de leurs parents ou tuteurs légaux.
                  </p>
                  <p>
                    Si vous êtes parent et pensez que votre enfant nous a fourni des données personnelles sans votre consentement, veuillez nous contacter pour que nous puissions les supprimer.
                  </p>
                </div>
              </div>

              {/* 10. Modifications de la politique */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  10. Modifications de la politique
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications entreront en vigueur dès leur publication sur cette page.
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    En cas de modification substantielle, nous vous en informerons par :
                  </p>
                  <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li style={{ marginBottom: 'var(--spacing-xs)' }}>Une notification sur notre site</li>
                    <li>Un email si nous disposons de votre adresse</li>
                  </ul>
                  <p>
                    Nous vous encourageons à consulter régulièrement cette page pour rester informé de nos pratiques en matière de protection des données.
                  </p>
                </div>
              </div>

              {/* 11. Contact */}
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--orange-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                }}>
                  11. Contact
                </h2>
                <div style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, vous pouvez nous contacter :
                  </p>
                  <div style={{
                    background: 'rgba(251, 109, 37, 0.1)',
                    border: '1px solid var(--orange-primary)',
                    borderRadius: '8px',
                    padding: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-md)'
                  }}>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}><strong style={{ color: 'var(--text-primary)' }}>Distribution Flyers</strong></p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>Service Protection des Données</p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>5 Rue Fénelon 33000 BORDEAUX</p>
                    <p style={{ marginBottom: 'var(--spacing-xs)' }}>Email : <a href="mailto:contact@distribution-flyers.fr" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>contact@distribution-flyers.fr</a></p>
                    <p>Téléphone : <a href="tel:+33978288462" style={{ color: 'var(--orange-primary)', textDecoration: 'none' }}>09 78 28 84 62</a></p>
                  </div>
                  <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                    Date de dernière mise à jour : 04-12-2025<br />
                    Version 1.0
                  </p>
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


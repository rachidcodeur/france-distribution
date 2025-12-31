'use client'

import { useState } from 'react'

const faqs = [
  { question: 'Les Stop Pub sont-ils respectés ?', answer: 'S\'agissant des documents municipaux et politiques, la distribution est réalisée dans l\'ensemble des BAL, même avec présence de Stop Pub. Par contre, pour la dissémination de documents publicitaires, nous appliquons rigoureusement la loi et ne déposons rien dans les boîtes aux lettres affichant l\'autocollant Stop Pub.' },
  { question: 'Quelle est la date limite de livraison avant le démarrage de la distribution ?', answer: 'Vos imprimés peuvent être réceptionnés dans nos centres de distribution au plus tard 24 heures avant le démarrage de la diffusion en BAL.' },
  { question: 'Faites-vous de la distribution groupée ?', answer: 'Non, nous pratiquons exclusivement la distribution isolée. Votre document est distribué seul, sans être mélangé à d\'autres publicités de masse.' },
  { question: 'Quelle est la durée d\'une distribution ?', answer: 'Le délai est fonction du nombre d\'exemplaires. Généralement, nous traitons 30 000 foyers en 4-5 jours. Pour des volumes plus importants, nous ajustons nos ressources afin de garantir le respect des délais prévus.' },
  { question: 'Que se passe-t-il en cas d\'intempéries ?', answer: 'Nous nous adaptons aux conditions météo. Nos équipes sont équipées de chariots spécifiques avec protections contre la pluie, ce qui nous permet de continuer par légère pluie. Cependant, en cas d\'intempéries importantes, nous sommes forcés d\'interrompre provisoirement afin de garantir que vos documents soient toujours distribués propres et lisibles.' },
  { question: 'Accédez-vous aux immeubles sécurisés ?', answer: 'Oui. Nos équipes ont les moyens d\'accès requis, ce qui nous permet de pénétrer dans tous les bâtiments et de distribuer la totalité de la zone pour la distribution.' },
  { question: 'Proposez-vous un suivi GPS ?', answer: 'Oui. Notre système propriétaire de géolocalisation est opérationnel, avec cartographie des secteurs. Cela nous permet d\'avoir une vue en temps réel sur toutes nos équipes et de produire des rapports précis. Par ce moyen, nous offrons une prestation traçable et fiable.' },
  { question: 'Quelle est votre offre ?', answer: 'Nous assurons une prestation globale allant de la création graphique (prospectus, dépliants, magazines, journaux, etc.) à la fabrication dans nos ateliers. Nous effectuons alors la diffusion en BAL, aussi bien pour les commerçants, artisans, mairies, communautés de communes, métropoles que pour les départements.' }
]

export default function FAQ() {
  const [activeIndexes, setActiveIndexes] = useState<Set<number>>(new Set())

  const toggleFAQ = (index: number) => {
    setActiveIndexes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Questions fréquentes</h2>
          <p className="section-subtitle">Tout ce que vous devez savoir sur France Distribution</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item ${activeIndexes.has(index) ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => toggleFAQ(index)}>
                <span>{faq.question}</span>
                <svg className="faq-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9L12 15L18 9"/>
                </svg>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

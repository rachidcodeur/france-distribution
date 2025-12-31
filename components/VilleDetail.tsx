'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import PricingComparison from './PricingComparison'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

import villes from '../data/villes'
import type { Ville, Tournee } from '../data/villes'

// Fonction pour parser une date française (ex: "15 janvier 2024")
function parseFrenchDate(dateStr: string): Date | null {
  const moisMap: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  }
  
  const parts = dateStr.split(' ')
  if (parts.length !== 3) return null
  
  const jour = parseInt(parts[0])
  const mois = moisMap[parts[1].toLowerCase()]
  const annee = parseInt(parts[2])
  
  if (isNaN(jour) || isNaN(annee) || mois === undefined) return null
  
  return new Date(annee, mois, jour)
}

// Fonction pour vérifier si une tournée est passée ou fermée
function isTourneePassee(tournee: Tournee): boolean {
  const dateDebut = parseFrenchDate(tournee.dateDebut)
  if (!dateDebut) return false
  
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  
  // Vérifier si la date de début est passée
  const dateDebutNormalisee = new Date(dateDebut)
  dateDebutNormalisee.setHours(0, 0, 0, 0)
  
  return aujourdhui > dateDebutNormalisee
}

// Fonction pour vérifier si la date limite est dépassée
function isDateLimiteDepassee(tournee: Tournee): boolean {
  const dateDebut = parseFrenchDate(tournee.dateDebut)
  if (!dateDebut) return false
  
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  
  // Calculer la date limite (15 jours avant)
  const dateLimite = new Date(dateDebut)
  dateLimite.setDate(dateLimite.getDate() - 15)
  dateLimite.setHours(0, 0, 0, 0)
  
  return aujourdhui > dateLimite
}

// Fonction pour calculer le statut d'une tournée
function calculateTourneeStatus(tournee: Tournee, villeName: string, realParticipantCount?: number): 'disponible' | 'bouclee' | 'annulee' | 'expiree' {
  // Si la date de début est passée, la tournée est expirée
  if (isTourneePassee(tournee)) {
    return 'expiree'
  }
  
  // Si la date limite est dépassée, la tournée est expirée (inscriptions fermées)
  if (isDateLimiteDepassee(tournee)) {
    return 'expiree'
  }
  
  // Si le nombre réel de participants est fourni et qu'il atteint 5, la tournée est bouclée
  if (realParticipantCount !== undefined && realParticipantCount >= 5) {
    return 'bouclee'
  }
  
  // Sinon, utiliser le statut par défaut
  return tournee.status || 'disponible'
}

export default function VilleDetail({ villeName }: { villeName: string }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [participantCounts, setParticipantCounts] = useState<Map<string, number>>(new Map())
  
  const ville = useMemo(() => {
    const foundVille = villes.find(v => v.name.toLowerCase() === villeName.toLowerCase())
    if (foundVille) {
      // Calculer le statut pour chaque tournée avec le nom de la ville
      // Note: Le statut sera recalculé plus tard avec le nombre réel de participants
      foundVille.tournees = foundVille.tournees.map(tournee => ({
        ...tournee,
        status: calculateTourneeStatus(tournee, foundVille.name)
      }))
    }
    return foundVille
  }, [villeName])

  // Générer la liste des 12 prochains mois à partir du mois actuel
  const availableMonths = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    const months: Array<{ month: number; monthName: string; year: number; key: string }> = []
    
    // Générer les 12 prochains mois
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(currentYear, currentMonth - 1 + i, 1)
      const month = targetDate.getMonth() + 1 // 1-12
      const year = targetDate.getFullYear()
      const monthName = monthNames[month - 1]
      
      months.push({
        month,
        monthName,
        year,
        key: `${year}-${month}`
      })
    }
    
    return months
  }, [])

  // Fonction pour vérifier si toutes les tournées d'un mois sont passées ou bouclées
  const areAllTourneesInactive = useMemo(() => {
    return (monthData: { month: number; monthName: string; year: number; tournees: Tournee[] }): boolean => {
      if (!monthData || monthData.tournees.length === 0) return true
      
      // Vérifier si toutes les tournées sont passées ou bouclées
      return monthData.tournees.every(tournee => {
        const status = calculateTourneeStatus(tournee, villeName)
        const isPassee = isTourneePassee(tournee) || isDateLimiteDepassee(tournee)
        return isPassee || status === 'bouclee' || status === 'annulee'
      })
    }
  }, [villeName])

  // Obtenir les mois disponibles avec leurs tournées (seulement les 12 prochains mois)
  // Exclure les mois où toutes les tournées sont passées ou bouclées
  const monthsWithTournees = useMemo(() => {
    if (!ville) return []
    
    const monthsMap = new Map<string, { month: number; monthName: string; year: number; tournees: Tournee[] }>()
    
    // Parcourir les 12 prochains mois
    availableMonths.forEach(({ month, monthName, year, key }) => {
      // Trouver les tournées pour ce mois et cette année
      const tourneesForMonth = ville.tournees.filter(t => 
        t.month === month && t.year === year
      )
      
      if (tourneesForMonth.length > 0) {
        const monthData = {
          month,
          monthName,
          year,
          tournees: tourneesForMonth
        }
        
        // Ne garder que les mois avec au moins une tournée active
        if (!areAllTourneesInactive(monthData)) {
          monthsMap.set(key, monthData)
        }
      }
    })
    
    return Array.from(monthsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  }, [ville, availableMonths, areAllTourneesInactive])

  // Déterminer le mois sélectionné (par défaut: mois actuel, ou mois suivant si toutes les tournées sont passées/bouclées)
  const currentMonthKey = useMemo(() => {
    const now = new Date()
    const currentMonthNum = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    
    // Trouver le mois actuel dans la liste des mois disponibles
    const currentMonthData = monthsWithTournees.find(m => 
      m.month === currentMonthNum && m.year === currentYear
    )
    
    // Si le mois actuel existe
    if (currentMonthData) {
      // Vérifier si toutes les tournées sont passées ou bouclées
      if (areAllTourneesInactive(currentMonthData)) {
        // Trouver le mois suivant avec des tournées actives
        const currentIndex = monthsWithTournees.findIndex(m => 
          m.month === currentMonthNum && m.year === currentYear
        )
        
        // Chercher le prochain mois avec au moins une tournée active
        for (let i = currentIndex + 1; i < monthsWithTournees.length; i++) {
          const nextMonth = monthsWithTournees[i]
          if (!areAllTourneesInactive(nextMonth)) {
            return `${nextMonth.year}-${nextMonth.month}`
          }
        }
        
        // Si tous les mois suivants sont aussi inactifs, prendre le premier mois disponible
        return monthsWithTournees.length > 0 ? `${monthsWithTournees[0].year}-${monthsWithTournees[0].month}` : null
      }
      
      // Le mois actuel a des tournées actives, le sélectionner
      return `${currentMonthData.year}-${currentMonthData.month}`
    }
    
    // Le mois actuel n'existe pas, trouver le premier mois avec des tournées actives
    for (const monthData of monthsWithTournees) {
      if (!areAllTourneesInactive(monthData)) {
        return `${monthData.year}-${monthData.month}`
      }
    }
    
    // Si tous les mois sont inactifs, prendre le premier mois disponible
    return monthsWithTournees.length > 0 ? `${monthsWithTournees[0].year}-${monthsWithTournees[0].month}` : null
  }, [monthsWithTournees, areAllTourneesInactive])

  // Initialiser le mois sélectionné au premier rendu
  useEffect(() => {
    if (selectedMonthKey === null && currentMonthKey !== null) {
      setSelectedMonthKey(currentMonthKey)
      // Marquer que l'initialisation est terminée après un court délai
      setTimeout(() => {
        setIsInitializing(false)
      }, 100)
    } else if (selectedMonthKey !== null) {
      // Si un mois est déjà sélectionné, arrêter le chargement
      setIsInitializing(false)
    }
  }, [selectedMonthKey, currentMonthKey])

  // Filtrer les tournées selon le mois sélectionné et exclure les tournées passées
  const filteredTournees = useMemo(() => {
    if (!ville || selectedMonthKey === null) return []
    
    // Extraire l'année et le mois de la clé
    const [year, month] = selectedMonthKey.split('-').map(Number)
    const selectedMonthData = monthsWithTournees.find(m => 
      m.month === month && m.year === year
    )
    
    if (!selectedMonthData) return []
    
    // Filtrer les tournées passées
    return selectedMonthData.tournees.filter(tournee => {
      const isPassee = isTourneePassee(tournee) || isDateLimiteDepassee(tournee)
      return !isPassee
    })
  }, [ville, selectedMonthKey, monthsWithTournees])

  // Charger le nombre réel de participants depuis Supabase
  useEffect(() => {
    if (!ville || !isSupabaseConfigured() || filteredTournees.length === 0) return

    async function loadParticipantCounts() {
      try {
        const countsMap = new Map<string, number>()

        // Pour chaque tournée, compter les participants réels
        for (const tournee of filteredTournees) {
          const tourneeKey = `${ville.name}|${tournee.dateDebut}`
          
          // Récupérer toutes les participations pour cette tournée (non annulées)
          const { data: participations, error } = await supabase
            .from('france_distri_participations')
            .select('id')
            .eq('ville_name', ville.name)
            .eq('tournee_date_debut', tournee.dateDebut)
            .neq('status', 'cancelled')

          if (error) {
            console.error('Erreur lors du chargement des participants:', error)
            // En cas d'erreur, utiliser la valeur par défaut
            countsMap.set(tourneeKey, tournee.participants || 0)
            continue
          }

          const realParticipantCount = participations?.length || 0
          countsMap.set(tourneeKey, realParticipantCount)
        }

        setParticipantCounts(countsMap)
      } catch (error) {
        console.error('Erreur lors du chargement des comptages de participants:', error)
      }
    }

    loadParticipantCounts()
  }, [ville, filteredTournees])

  // Obtenir l'index réel d'une tournée dans la liste complète (pour les liens)
  const getTourneeIndex = (tournee: Tournee): number => {
    if (!ville) return 0
    return ville.tournees.findIndex(t => 
      t.dateDebut === tournee.dateDebut && 
      t.dateFin === tournee.dateFin &&
      t.month === tournee.month
    )
  }

  if (!ville) {
    return (
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Ville non trouvée</h1>
            <p className="section-subtitle">La ville demandée n'existe pas dans notre base de données.</p>
            <Link href="/tournees" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
              Retour aux tournées
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
      <div className="container">
        <div className="tournees-layout">
          <div className="tournees-main">
            <div className="section-header">
              <Link href="/tournees" className="back-link">
                <span className="back-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                </span>
                Retour aux tournées
              </Link>
              <h1 className="section-title">Tournées disponibles à {ville.name}</h1>
              <p className="section-subtitle">{ville.departement} • {ville.region} • {ville.logements} logements</p>
              
              <div className="ville-stats">
                {/* Sélecteur de mois stylisé */}
                <div className="ville-stat-item month-selector-wrapper month-selector-full-width">
                  <div className="month-selector-content">
                    <div className="month-selector-label">Choisir le mois</div>
                    <div className="month-selector-row">
                      <div className="ville-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div className="month-selector-dropdown">
                        <select
                          id="month-selector"
                          value={selectedMonthKey || ''}
                          onChange={(e) => setSelectedMonthKey(e.target.value || null)}
                          className="month-selector-select"
                        >
                          {monthsWithTournees.map(({ month, monthName, year, tournees }) => {
                            const monthKey = `${year}-${month}`
                            const yearLabel = year !== new Date().getFullYear() ? ` ${year}` : ''
                            return (
                              <option 
                                key={monthKey} 
                                value={monthKey}
                              >
                                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}{yearLabel} ({tournees.length})
                              </option>
                            )
                          })}
                        </select>
                        <svg 
                          className="month-selector-arrow" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tournees-list-detailed">
          {isInitializing ? (
            <div style={{
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: '#242940',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-md)'
            }}>
              <div 
                className="loading-spinner"
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid var(--border-subtle)',
                  borderTop: '4px solid var(--orange-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              ></div>
              <p style={{ margin: 0 }}>Chargement des tournées...</p>
            </div>
          ) : filteredTournees.length === 0 ? (
            <div style={{ 
              padding: 'var(--spacing-xl)', 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <p>Aucune tournée disponible pour ce mois.</p>
            </div>
          ) : (
            filteredTournees.map((tournee) => {
              const index = getTourneeIndex(tournee)
              const isPassee = isTourneePassee(tournee) || isDateLimiteDepassee(tournee)
              
              // Calculer le nombre réel de participants et les places restantes
              const tourneeKey = `${ville.name}|${tournee.dateDebut}`
              const realParticipantCount = participantCounts.get(tourneeKey) ?? tournee.participants
              const MAX_PARTICIPANTS = 5 // Maximum fixe de 5 participants par tournée
              const placesRestantes = Math.max(0, MAX_PARTICIPANTS - realParticipantCount)
              
              // Calculer le statut en tenant compte du nombre réel de participants
              const status = calculateTourneeStatus(tournee, ville.name, realParticipantCount)
              
              return (
            <div key={`${tournee.month}-${tournee.dateDebut}`} className="tournee-card-detailed">
              <div className="tournee-header-detailed">
                <div>
                  <h3 className="tournee-title">{tournee.dateDebut}</h3>
                  <p className="tournee-dates">{tournee.dateDebut} au {tournee.dateFin}</p>
                </div>
                {isPassee ? (
                  <span className="tournee-badge expiree">
                    Tournée passée
                  </span>
                ) : status === 'bouclee' ? (
                  <span className="tournee-badge bouclee">
                    Bouclée
                  </span>
                ) : status === 'annulee' ? (
                  <span className="tournee-badge annulee">
                    Annulée
                  </span>
                ) : (
                <span className="tournee-badge available">
                  {placesRestantes} place{placesRestantes > 1 ? 's' : ''} disponible{placesRestantes > 1 ? 's' : ''}
                </span>
                )}
              </div>
              <div className="tournee-info-detailed">
                <div className="tournee-info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <span className="info-label">Participants</span>
                    <span className="info-value">{realParticipantCount} entreprise{realParticipantCount > 1 ? 's' : ''}</span>
                    {isPassee && (
                      <span style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        color: '#F44336', 
                        marginTop: '4px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                      }}>
                        Inscriptions fermées
                      </span>
                    )}
                  </div>
                </div>
                <div className="tournee-info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div>
                    <span className="info-label">Date limite d'inscription</span>
                    <span className="info-value">{tournee.dateLimite}</span>
                  </div>
                </div>
                <div className="tournee-info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                  </svg>
                  <div>
                    <span className="info-label">Logements couverts</span>
                    <span className="info-value">{ville.logements}</span>
                  </div>
                </div>
              </div>
              {isPassee ? (
                <div 
                  className="btn btn-primary btn-full"
                  style={{ 
                    marginTop: 'var(--spacing-lg)',
                    display: 'block',
                    textAlign: 'center',
                    textDecoration: 'none',
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    pointerEvents: 'none'
                  }}
                >
                  Inscriptions fermées
                </div>
              ) : (
              <Link
                href={`/tournees/${encodeURIComponent(ville.name.toLowerCase())}/${index}/secteurs`}
                className="btn btn-primary btn-full"
                style={{ 
                  marginTop: 'var(--spacing-lg)',
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                Rejoindre cette tournée
              </Link>
              )}
            </div>
            )
            })
          )}
          </div>
          </div>
          
          <div className="tournees-sidebar">
            <PricingComparison />
          </div>
        </div>
      </div>
    </section>
  )
}


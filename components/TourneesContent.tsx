'use client'

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import villes from '../data/villes'
import type { Ville, Tournee as TourneeType } from '../data/villes'

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

// Fonction pour vérifier si une tournée est passée
function isTourneePassee(tournee: TourneeType): boolean {
  const dateDebut = parseFrenchDate(tournee.dateDebut)
  if (!dateDebut) return false
  
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  
  const dateDebutNormalisee = new Date(dateDebut)
  dateDebutNormalisee.setHours(0, 0, 0, 0)
  
  return aujourdhui > dateDebutNormalisee
}

// Fonction pour vérifier si la date limite est dépassée
function isDateLimiteDepassee(tournee: TourneeType): boolean {
  const dateDebut = parseFrenchDate(tournee.dateDebut)
  if (!dateDebut) return false
  
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  
  const dateLimite = new Date(dateDebut)
  dateLimite.setDate(dateLimite.getDate() - 15)
  dateLimite.setHours(0, 0, 0, 0)
  
  return aujourdhui > dateLimite
}

// Fonction pour calculer le statut d'une tournée
function calculateTourneeStatus(tournee: TourneeType, villeName: string): 'disponible' | 'bouclee' | 'annulee' | 'expiree' {
  if (isTourneePassee(tournee)) {
    return 'expiree'
  }
  
  if (isDateLimiteDepassee(tournee)) {
    return 'expiree'
  }
  
  return tournee.status || 'disponible'
}

// Fonction pour vérifier si une tournée est disponible (non passée, non bouclée, non annulée)
function isTourneeDisponible(tournee: TourneeType, villeName: string): boolean {
  const status = calculateTourneeStatus(tournee, villeName)
  const isPassee = isTourneePassee(tournee) || isDateLimiteDepassee(tournee)
  
  return !isPassee && status !== 'bouclee' && status !== 'annulee' && tournee.placesDisponibles > 0
}

const regions = [
  { id: 'nouvelle-aquitaine', name: 'Nouvelle-Aquitaine' },
  { id: 'occitanie', name: 'Occitanie' },
  { id: 'provence-alpes-cote-azur', name: "Provence-Alpes-Côte d'Azur" },
  { id: 'auvergne-rhone-alpes', name: 'Auvergne-Rhône-Alpes' },
  { id: 'ile-de-france', name: 'Île-de-France' },
  { id: 'hauts-de-france', name: 'Hauts-de-France' },
  { id: 'normandie', name: 'Normandie' },
  { id: 'bretagne', name: 'Bretagne' },
  { id: 'pays-de-la-loire', name: 'Pays de la Loire' },
  { id: 'centre-val-de-loire', name: 'Centre-Val de Loire' },
  { id: 'bourgogne-franche-comte', name: 'Bourgogne-Franche-Comté' },
  { id: 'grand-est', name: 'Grand Est' },
  { id: 'corse', name: 'Corse' },
]

// Mapping des codes INSEE des départements
const departementCodes: Record<string, string> = {
  'Gironde': '33',
  'Pyrénées-Atlantiques': '64',
  'Landes': '40',
  'Lot-et-Garonne': '47',
  'Dordogne': '24',
  'Charente-Maritime': '17',
  'Vienne': '86',
  'Haute-Vienne': '87',
  'Charente': '16',
  'Deux-Sèvres': '79',
  'Corrèze': '19',
  'Creuse': '23',
  'Haute-Garonne': '31',
  'Hérault': '34',
  'Gard': '30',
  'Pyrénées-Orientales': '66',
  'Aude': '11',
  'Tarn': '81',
  'Aveyron': '12',
  'Lozère': '48',
  'Ariège': '09',
  'Lot': '46',
  'Gers': '32',
  'Tarn-et-Garonne': '82',
  'Hautes-Pyrénées': '65',
  'Bouches-du-Rhône': '13',
  'Alpes-Maritimes': '06',
  'Var': '83',
  'Vaucluse': '84',
  'Rhône': '69',
  'Isère': '38',
  'Puy-de-Dôme': '63',
  'Loire': '42',
  'Drôme': '26',
  'Haute-Savoie': '74',
  'Savoie': '73',
  'Paris': '75',
  'Hauts-de-Seine': '92',
  'Seine-Saint-Denis': '93',
  'Val-de-Marne': '94',
  'Val-d\'Oise': '95',
  'Essonne': '91',
  'Yvelines': '78',
  'Nord': '59',
  'Pas-de-Calais': '62',
  'Somme': '80',
  'Aisne': '02',
  'Oise': '60',
  'Seine-Maritime': '76',
  'Calvados': '14',
  'Manche': '50',
  'Eure': '27',
  'Orne': '61',
  'Ille-et-Vilaine': '35',
  'Finistère': '29',
  'Morbihan': '56',
  'Côtes-d\'Armor': '22',
  'Loire-Atlantique': '44',
  'Maine-et-Loire': '49',
  'Sarthe': '72',
  'Vendée': '85',
  'Mayenne': '53',
  'Indre-et-Loire': '37',
  'Loiret': '45',
  'Loir-et-Cher': '41',
  'Cher': '18',
  'Eure-et-Loir': '28',
  'Indre': '36',
  'Côte-d\'Or': '21',
  'Doubs': '25',
  'Territoire de Belfort': '90',
  'Saône-et-Loire': '71',
  'Nièvre': '58',
  'Yonne': '89',
  'Bas-Rhin': '67',
  'Marne': '51',
  'Moselle': '57',
  'Meurthe-et-Moselle': '54',
  'Haut-Rhin': '68',
  'Aube': '10',
  'Ardennes': '08',
  'Vosges': '88',
  'Meuse': '55',
  'Corse-du-Sud': '2A',
  'Haute-Corse': '2B',
}

// Générer dynamiquement les départements par région depuis les données des villes
function getDepartementsByRegion(): Record<string, Array<{ id: string; name: string }>> {
  const deptMap: Record<string, Set<string>> = {}
  
  // Initialiser toutes les régions avec un Set vide
  regions.forEach(region => {
    deptMap[region.id] = new Set()
  })
  
  // Parcourir toutes les villes pour extraire les départements par région
  villes.forEach(ville => {
    // Chercher la région correspondante (correspondance exacte ou flexible)
    const regionId = regions.find(r => {
      // Correspondance exacte
      if (r.name === ville.region) return true
      // Correspondance sans accents
      const rNameNormalized = r.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const villeRegionNormalized = ville.region.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      if (rNameNormalized === villeRegionNormalized) return true
      // Correspondance partielle
      if (rNameNormalized.includes(villeRegionNormalized) || villeRegionNormalized.includes(rNameNormalized)) return true
      return false
    })?.id
    
    if (regionId && ville.departement && 
        ville.departement !== 'Non spécifié' && 
        ville.departement !== 'Non spécifiée' &&
        ville.departement !== 'À déterminer') {
      deptMap[regionId].add(ville.departement)
    }
  })
  
  // Convertir en format attendu avec codes INSEE pour TOUTES les régions
  const result: Record<string, Array<{ id: string; name: string }>> = {}
  regions.forEach(region => {
    const departements = Array.from(deptMap[region.id] || new Set())
      .map(name => ({
        // Utiliser le code INSEE si disponible, sinon utiliser le nom comme ID
        id: departementCodes[name] || name.toLowerCase().replace(/\s+/g, '-'),
        name: name
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) // Trier par nom
    
    result[region.id] = departements
  })
  
  // Log pour debug
  console.log('📊 Départements par région:', Object.keys(result).map(regionId => {
    const regionName = regions.find(r => r.id === regionId)?.name || regionId
    return `${regionName}: ${result[regionId].length} départements`
  }))
  
  return result
}

const departementsByRegion = getDepartementsByRegion()

interface Tournee {
  dateDebut: string
  dateFin: string
  dateLimite: string
  participants: number
  placesDisponibles: number
}

export default function TourneesContent() {
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedDepartement, setSelectedDepartement] = useState<string>('')
  // Filtrer les villes avec au moins 5000 logements dès l'initialisation
  const [filteredVilles, setFilteredVilles] = useState<Ville[]>(() => {
    return villes.filter(v => {
      const logements = parseFloat(v.logements.replace(/\s/g, '').replace(',', '.'))
      return !isNaN(logements) && logements >= 5000
    })
  })
  const [isSearching, setIsSearching] = useState(false)
  const regionSelectRef = useRef<HTMLSelectElement>(null)
  const departementSelectRef = useRef<HTMLSelectElement>(null)
  const hasSyncedRegion = useRef(false)
  const hasSyncedDepartement = useRef(false)

  // Synchroniser le state avec les valeurs préservées par le navigateur au montage
  // Le navigateur peut restaurer les valeurs des selects après le rendu initial
  useEffect(() => {
    // Ne synchroniser qu'une seule fois au montage
    if (hasSyncedRegion.current) return
    
    // Attendre un peu pour que le navigateur restaure les valeurs si nécessaire
    const timeoutId = setTimeout(() => {
      // Vérifier si le select de région a une valeur préservée par le navigateur
      if (regionSelectRef.current && regionSelectRef.current.value) {
        const preservedRegion = regionSelectRef.current.value
        // Mettre à jour le state avec la valeur préservée
        setSelectedRegion(preservedRegion)
        hasSyncedRegion.current = true
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, []) // Exécuter seulement au montage

  // Synchroniser le département quand la région est disponible
  useEffect(() => {
    if (!selectedRegion) {
      hasSyncedDepartement.current = false
      return
    }
    
    // Ne synchroniser qu'une seule fois par région
    if (hasSyncedDepartement.current) return
    
    if (departementSelectRef.current) {
      const preservedDepartement = departementSelectRef.current.value
      // Si une valeur est préservée et qu'elle correspond à la région sélectionnée
      if (preservedDepartement && preservedDepartement !== selectedDepartement) {
        const isValidDept = departementsByRegion[selectedRegion]?.some(
          d => d.id === preservedDepartement
        )
        if (isValidDept) {
          setSelectedDepartement(preservedDepartement)
          hasSyncedDepartement.current = true
        }
      }
    }
  }, [selectedRegion]) // Exécuter quand la région change

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId)
    setSelectedDepartement('')
    setFilteredVilles([])
    setIsSearching(false)
  }

  const handleDepartementChange = (departementId: string) => {
    setSelectedDepartement(departementId)
  }

  const handleSearch = () => {
    setIsSearching(true)
    let filtered = villes

    // Filtrer uniquement les villes avec au moins 5000 logements
    filtered = filtered.filter(v => {
      const logements = parseFloat(v.logements.replace(/\s/g, '').replace(',', '.'))
      return !isNaN(logements) && logements >= 5000
    })

    if (selectedRegion) {
      const regionName = regions.find(r => r.id === selectedRegion)?.name || ''
      // Filtrage flexible pour la région (correspondance exacte ou normalisée)
      filtered = filtered.filter(v => {
        if (v.region === regionName) return true
        // Correspondance sans accents
        const vRegionNormalized = v.region.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const regionNameNormalized = regionName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        return vRegionNormalized === regionNameNormalized
      })
    }

    if (selectedDepartement) {
      const departementName = departementsByRegion[selectedRegion]?.find(d => d.id === selectedDepartement)?.name || ''
      if (departementName) {
        filtered = filtered.filter(v => v.departement === departementName)
      }
    }

    setFilteredVilles(filtered)
  }

  const availableDepartements = selectedRegion ? departementsByRegion[selectedRegion] || [] : []

  return (
    <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Sélectionnez votre département</h1>
          <p className="section-subtitle">Trouvez les campagnes de distribution mutualisée dans votre région</p>
        </div>

        <div className="tournees-filter">
          <div className="filter-group">
            <label htmlFor="region">Région</label>
            <select
              id="region"
              ref={regionSelectRef}
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="filter-select"
            >
              <option value="">Sélectionnez une région</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="departement">Département</label>
            <select
              id="departement"
              ref={departementSelectRef}
              value={selectedDepartement}
              onChange={(e) => handleDepartementChange(e.target.value)}
              className="filter-select"
              disabled={!selectedRegion}
            >
              <option value="">Sélectionnez un département</option>
              {availableDepartements.length > 0 ? (
                availableDepartements.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))
              ) : (
                <option value="" disabled>Aucun département disponible</option>
              )}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={!selectedRegion}
          >
            Rechercher
          </button>
        </div>

        {!isSearching && (
          <div className="tournees-info-section">
            <div className="how-to-search">
              <h2 className="how-to-search-title">Comment rechercher une tournée ?</h2>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3 className="step-title">Sélectionnez votre région et département</h3>
                    <p className="step-description">Choisissez la région puis le département où vous souhaitez distribuer vos flyers</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3 className="step-title">Lancez la recherche</h3>
                    <p className="step-description">Cliquez sur "Rechercher" pour voir toutes les villes disponibles avec leurs tournées</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3 className="step-title">Rejoignez une tournée</h3>
                    <p className="step-description">Sélectionnez une ville et participez à une tournée mutualisée</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: 'var(--spacing-4xl)',
              marginBottom: 'var(--spacing-xl)',
              textAlign: 'center',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
            }}>
              Pourquoi opter pour une distribution mutualisée ?
            </h2>

            <div className="info-cards-grid">
              <div className="info-card">
                <div className="info-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <h3 className="info-card-title">Couverture nationale</h3>
                <p className="info-card-description">
                  Plus de {villes.length} villes disponibles dans toute la France. Trouvez la tournée qui correspond à votre zone de distribution.
                </p>
              </div>

              <div className="info-card">
                <div className="info-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"/>
                  </svg>
                </div>
                <h3 className="info-card-title">Économies jusqu'à -50%</h3>
                <p className="info-card-description">
                  Réduisez vos coûts de distribution en mutualisant avec d'autres entreprises. Plus de participants = moins de coûts pour tous.
                </p>
              </div>

              <div className="info-card">
                <div className="info-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <h3 className="info-card-title">Transparence totale</h3>
                <p className="info-card-description">
                  Consultez les participants, les volumes et les dates avant de vous engager. Aucune surprise, tout est clair dès le départ.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSearching && (
          <div className="tournees-results">
            {filteredVilles.length > 0 ? (
              <>
                <h2 className="results-title">Résultats de la recherche ({filteredVilles.length})</h2>
                <div className="villes-grid">
                  {filteredVilles.map((ville, index) => {
                    const totalTournees = ville.tournees.length
                    // Compter uniquement les tournées réellement disponibles (non passées, non bouclées, non annulées)
                    // sur les 12 prochains mois
                    const now = new Date()
                    const currentYear = now.getFullYear()
                    const currentMonth = now.getMonth() + 1 // 1-12
                    
                    const tourneesDisponibles = ville.tournees.filter(tournee => {
                      // Vérifier que la tournée est dans les 12 prochains mois
                      if (tournee.year && tournee.month) {
                        const tourneeDate = new Date(tournee.year, tournee.month - 1, 1)
                        const currentDate = new Date(currentYear, currentMonth - 1, 1)
                        const monthsDiff = (tourneeDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                                         (tourneeDate.getMonth() - currentDate.getMonth())
                        
                        if (monthsDiff < 0 || monthsDiff >= 12) {
                          return false // Tournée en dehors des 12 prochains mois
                        }
                      }
                      
                      // Vérifier que la tournée est disponible
                      return isTourneeDisponible(tournee, ville.name)
                    }).length
                    return (
                      <div key={index} className="ville-card">
                        <div className="ville-header">
                          <h3 className="ville-name">{ville.name}</h3>
                        </div>
                        <div className="ville-info">
                          <div className="ville-detail">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>{ville.departement}</span>
                          </div>
                          <div className="ville-detail">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                            </svg>
                            <span>{ville.logements} logements</span>
                          </div>
                          <div className="ville-detail">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>{tourneesDisponibles} tournée{tourneesDisponibles > 1 ? 's' : ''} disponible{tourneesDisponibles > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <a href={`/tournees/${encodeURIComponent(ville.name.toLowerCase())}`} className="btn btn-primary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                          Voir les tournées
                        </a>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="no-results">
                <p>Aucune tournée disponible pour cette recherche.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}


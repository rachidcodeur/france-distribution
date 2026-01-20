'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import villes from '../../../../../data/villes'
import { supabase, isSupabaseConfigured } from '../../../../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import FAQ from '@/components/FAQ'

// Import dynamique de la carte pour éviter les problèmes SSR
const MapComponent = dynamic(() => import('../../../../../components/IrisMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>Chargement de la carte...</div>
})

interface SelectedIris {
  code: string
  name: string
  logements?: number
}

interface IrisLogement {
  nom_iris: string
  logements_iris: number
}

type AddressSuggestion = {
  label: string
  lat: number
  lng: number
}

export default function SecteursPage({ 
  params 
}: { 
  params: { ville: string; tourneeIndex: string } 
}) {
  const router = useRouter()
  const villeName = decodeURIComponent(params.ville)
  const tourneeIndex = parseInt(params.tourneeIndex)
  
  const ville = useMemo(() => {
    return villes.find(v => v.name.toLowerCase() === villeName.toLowerCase())
  }, [villeName])

  const [commune, setCommune] = useState<any>(null)
  const [iris, setIris] = useState<any>(null) // Peut être un tableau ou un FeatureCollection
  const [selectedIris, setSelectedIris] = useState<SelectedIris[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [irisLogementsMap, setIrisLogementsMap] = useState<Map<string, number>>(new Map())
  const [user, setUser] = useState<User | null>(null)
  const [irisCounts, setIrisCounts] = useState<Map<string, number>>(new Map())
  const [irisParticipants, setIrisParticipants] = useState<Map<string, Array<{ entreprise: string; titre: string }>>>(new Map())
  const [selectedIrisForDetails, setSelectedIrisForDetails] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [buttonAnimation, setButtonAnimation] = useState<'idle' | 'opening' | 'closing'>('idle')
  const [badgeAnimation, setBadgeAnimation] = useState(false)
  const [hasOpenedPanelOnce, setHasOpenedPanelOnce] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)

  // Recherche d'adresse (BAN - api-adresse.data.gouv.fr)
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [addressOpen, setAddressOpen] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSearchHovered, setIsSearchHovered] = useState(false)

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Charger des suggestions d'adresse avec un debounce
  useEffect(() => {
    const q = addressQuery.trim()

    // Reset
    setAddressError(null)
    if (q.length < 3) {
      setAddressSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        setAddressLoading(true)
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6&autocomplete=1`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('Erreur lors de la recherche d’adresse')

        const json = await res.json()
        const features: any[] = Array.isArray(json?.features) ? json.features : []
        const suggestions: AddressSuggestion[] = features
          .map((f) => {
            const label = String(f?.properties?.label || '').trim()
            const coords = f?.geometry?.coordinates
            const lng = Array.isArray(coords) ? Number(coords[0]) : NaN
            const lat = Array.isArray(coords) ? Number(coords[1]) : NaN
            if (!label || Number.isNaN(lat) || Number.isNaN(lng)) return null
            return { label, lat, lng }
          })
          .filter(Boolean) as AddressSuggestion[]

        setAddressSuggestions(suggestions)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        console.error('Erreur recherche adresse:', e)
        setAddressError('Impossible de récupérer des suggestions pour le moment.')
        setAddressSuggestions([])
      } finally {
        setAddressLoading(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [addressQuery])

  const selectAddressSuggestion = useCallback((s: AddressSuggestion) => {
    setAddressQuery(s.label)
    setSearchLocation({ lat: s.lat, lng: s.lng, label: s.label })
    setAddressSuggestions([])
    setAddressOpen(false)
  }, [])

  // Fonction pour normaliser les noms (minuscules, suppression des accents, etc.)
  const normalizeName = useCallback((name: string): string => {
    if (!name) return ''
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, ' ') // Normalise les espaces multiples
      .trim()
  }, [])
  
  // Fonction pour créer une clé de recherche flexible
  const createSearchKey = (name: string): string[] => {
    const normalized = normalizeName(name)
    const keys: string[] = [normalized]
    
    // Ajouter aussi la version sans espaces
    keys.push(normalized.replace(/\s/g, ''))
    
    // CORRECTION: Utiliser >= 2 caractères comme dans le stockage, pas >= 3
    const words = normalized.split(/\s+/).filter(w => w.length >= 2)
    if (words.length > 0) {
      keys.push(words.join(' '))
      keys.push(words.join(''))
    }
    
    // Ajouter une version avec seulement le nom de base (sans le nombre) pour les IRIS numérotés
    const wordsWithoutNumbers = words.filter(w => !/^\d+$/.test(w))
    if (wordsWithoutNumbers.length > 0 && wordsWithoutNumbers.length < words.length) {
      keys.push(wordsWithoutNumbers.join(' '))
      keys.push(wordsWithoutNumbers.join(''))
    }
    
    // Gérer les apostrophes : ajouter des variantes avec/sans apostrophe
    if (name.includes("'")) {
      const withoutApostrophe = normalized.replace(/'/g, '')
      keys.push(withoutApostrophe)
      keys.push(withoutApostrophe.replace(/\s/g, ''))
      
      const withSpace = normalized.replace(/'/g, ' ')
      keys.push(withSpace)
      keys.push(withSpace.replace(/\s+/g, ' ').trim())
    }
    
    return keys
  }

  // Charger les données de logements pour la ville
  useEffect(() => {
    console.log('🔄 useEffect déclenché pour charger les données IRIS, ville:', ville?.name || 'undefined')
    if (!ville) {
      console.warn('⚠️ Pas de ville, arrêt du chargement')
      return
    }

    async function loadIrisLogements() {
      if (!ville) {
        console.warn('⚠️ Ville non définie dans loadIrisLogements')
        return
      }
      
      try {
        console.log('🔄 Début du chargement des données IRIS pour:', ville.name)
        const response = await fetch('/api/iris-logements')
        if (!response.ok) {
          console.error('❌ Erreur HTTP lors du chargement:', response.status, response.statusText)
          return
        }
        
        const data = await response.json()
        console.log('✅ JSON chargé, nombre total de communes:', data.length)
        
        // Optimisation : recherche directe sans logs excessifs
        const villeNameNormalized = normalizeName(ville.name)
        
        // Recherche avec plusieurs stratégies (optimisée)
        let villeData = (data as any[]).find(
          (c: any) => normalizeName(c.ville) === villeNameNormalized
        )
        
        // Si pas trouvé, essayer avec le nom en minuscules directement
        if (!villeData) {
          console.log('⚠️ Ville non trouvée avec normalisation, essai avec minuscules simples')
          villeData = (data as any[]).find(
            (c: any) => c.ville.toLowerCase() === ville.name.toLowerCase()
          )
        }
        
        // Si toujours pas trouvé, essayer une recherche partielle
        if (!villeData) {
          console.log('⚠️ Ville non trouvée avec correspondance exacte, essai avec recherche partielle')
          villeData = (data as any[]).find(
            (c: any) => normalizeName(c.ville).includes(villeNameNormalized) || 
                       villeNameNormalized.includes(normalizeName(c.ville))
          )
        }
        
        // Si toujours pas trouvé, essayer sans accents et caractères spéciaux
        if (!villeData) {
          console.log('⚠️ Ville non trouvée, essai avec recherche sans accents')
          const villeNameSimple = ville.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          villeData = (data as any[]).find(
            (c: any) => {
              const cVilleSimple = c.ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
              return cVilleSimple === villeNameSimple || 
                     cVilleSimple.includes(villeNameSimple) || 
                     villeNameSimple.includes(cVilleSimple)
            }
          )
        }

        // Cas spécial : villes divisées en arrondissements (Lyon, Paris, Marseille)
        // Si on cherche "Lyon" mais que le JSON contient "lyon 1er arrondissement", "lyon 2e arrondissement", etc.
        // Toujours vérifier s'il y a des arrondissements, même si on a trouvé une correspondance
        let allVilleData: any[] = []
        const villeNameBase = villeNameNormalized.split(/\s+/)[0] // Prendre le premier mot (ex: "lyon" depuis "lyon")
        
        // Chercher toutes les entrées qui commencent par le nom de base de la ville
        // Cela permet de trouver tous les arrondissements même si une correspondance partielle a été trouvée
        allVilleData = (data as any[]).filter(
          (c: any) => {
            const cVilleNormalized = normalizeName(c.ville)
            const cVilleBase = cVilleNormalized.split(/\s+/)[0]
            // Vérifier si la ville commence par le nom de base (ex: "lyon 1er arrondissement" commence par "lyon")
            // OU si le nom de base de la ville recherchée correspond au nom de base de la ville dans le JSON
            return (cVilleNormalized.startsWith(villeNameBase + ' ') || 
                    cVilleNormalized === villeNameBase ||
                    cVilleBase === villeNameBase) &&
                   // Exclure les correspondances exactes déjà trouvées (pour éviter les doublons)
                   (!villeData || normalizeName(c.ville) !== normalizeName(villeData.ville))
          }
        )
        
        // Si on a trouvé des arrondissements, les utiliser à la place de la correspondance unique
        if (allVilleData.length > 1) {
          console.log(`✅ Trouvé ${allVilleData.length} arrondissement(s) pour ${ville.name}:`, allVilleData.map(c => c.ville))
          // Réinitialiser villeData pour utiliser tous les arrondissements
          villeData = null
        } else if (allVilleData.length === 1 && !villeData) {
          // Si on n'a trouvé qu'un seul arrondissement et pas de correspondance exacte, l'utiliser
          villeData = allVilleData[0]
          allVilleData = []
        } else {
          // Pas d'arrondissements trouvés
          allVilleData = []
        }

        if (villeData) {
          console.log('✅ Ville trouvée dans le JSON:', villeData.ville)
          console.log('   Nombre d\'IRIS:', villeData.iris?.length || 0)
        } else if (allVilleData.length > 0) {
          console.log(`✅ Trouvé ${allVilleData.length} arrondissement(s) pour ${ville.name}`)
        } else {
          console.error('❌ Ville NON trouvée dans le JSON')
          console.log('   Recherchée:', ville.name, '(', normalizeName(ville.name), ')')
          // Essayer de trouver des villes similaires
          const similar = (data as any[]).filter((c: any) => 
            normalizeName(c.ville).includes(normalizeName(ville.name).substring(0, 3)) ||
            normalizeName(ville.name).includes(normalizeName(c.ville).substring(0, 3))
          ).slice(0, 5)
          if (similar.length > 0) {
            console.log('   Villes similaires trouvées:', similar.map((c: any) => c.ville))
          }
        }

        // Créer la map avec les IRIS trouvés (soit d'une seule entrée, soit de plusieurs arrondissements)
        const map = new Map<string, number>()
        const irisSources: any[] = []
        
        if (villeData && villeData.iris) {
          // Filtrer les IRIS "commune non irisée"
          const validIris = villeData.iris.filter((iris: any) => {
            const nomIris = iris.nom_iris || iris.nom || ''
            return !nomIris.toLowerCase().includes('commune non irisée') && 
                   !nomIris.toLowerCase().includes('non irisée')
          })
          irisSources.push(...validIris)
        } else if (allVilleData.length > 0) {
          // Regrouper tous les IRIS de tous les arrondissements
          allVilleData.forEach((arrondissement: any) => {
            if (arrondissement.iris && Array.isArray(arrondissement.iris)) {
              // Filtrer les IRIS "commune non irisée"
              const validIris = arrondissement.iris.filter((iris: any) => {
                const nomIris = iris.nom_iris || iris.nom || ''
                return !nomIris.toLowerCase().includes('commune non irisée') && 
                       !nomIris.toLowerCase().includes('non irisée')
              })
              irisSources.push(...validIris)
            }
          })
        }

        if (irisSources.length > 0) {
          console.log(`📊 Chargement des données IRIS pour ${ville.name}:`, irisSources.length, 'IRIS trouvés')
          console.log('📋 Premiers IRIS du JSON:', irisSources.slice(0, 5).map((i: any) => i.nom_iris))
          
          irisSources.forEach((irisData: IrisLogement) => {
            // Ignorer les valeurs NaN ou invalides
            if (irisData.logements_iris && !isNaN(irisData.logements_iris)) {
              const normalizedName = normalizeName(irisData.nom_iris)
              const originalName = irisData.nom_iris
              const codeIris = (irisData as any).code_iris || (irisData as any).code || ''
              
              // Stocker avec plusieurs clés pour faciliter le matching
              // 1. Nom normalisé complet
              map.set(normalizedName, irisData.logements_iris)
              
              // 2. Nom original en minuscules
              map.set(originalName.toLowerCase().trim(), irisData.logements_iris)
              
              // 3. Nom sans espaces
              map.set(normalizedName.replace(/\s/g, ''), irisData.logements_iris)
              
              // 4. Nom original sans espaces
              map.set(originalName.toLowerCase().replace(/\s/g, ''), irisData.logements_iris)
              
              // 5. Mots significatifs seulement (>= 2 caractères)
              const words = normalizedName.split(/\s+/).filter(w => w.length >= 2)
              if (words.length > 0) {
                map.set(words.join(' '), irisData.logements_iris)
                map.set(words.join(''), irisData.logements_iris)
              }
              
              // 6. Nom de base sans nombre (pour les IRIS numérotés comme "Chapelle 7")
              const wordsWithoutNumbers = words.filter(w => !/^\d+$/.test(w))
              if (wordsWithoutNumbers.length > 0 && wordsWithoutNumbers.length < words.length) {
                map.set(wordsWithoutNumbers.join(' '), irisData.logements_iris)
                map.set(wordsWithoutNumbers.join(''), irisData.logements_iris)
              }
              
              // 7. Gérer les apostrophes : variantes avec/sans apostrophe
              if (originalName.includes("'")) {
                const withoutApostrophe = normalizedName.replace(/'/g, '')
                map.set(withoutApostrophe, irisData.logements_iris)
                map.set(withoutApostrophe.replace(/\s/g, ''), irisData.logements_iris)
                
                const withSpace = normalizedName.replace(/'/g, ' ')
                map.set(withSpace.replace(/\s+/g, ' ').trim(), irisData.logements_iris)
                
                // Version originale avec apostrophe en minuscules
                const originalLower = originalName.toLowerCase().trim()
                map.set(originalLower, irisData.logements_iris)
                map.set(originalLower.replace(/\s/g, ''), irisData.logements_iris)
              }
              
              // 8. Code IRIS si disponible
              if (codeIris) {
                map.set(codeIris.toString().toLowerCase().trim(), irisData.logements_iris)
                map.set(codeIris.toString().trim(), irisData.logements_iris)
              }
              
              // 9. Stocker le nom original comme référence (pour debug)
              map.set(`_original_${originalName}`, irisData.logements_iris)
            }
          })
          
          const exampleKeys = Array.from(map.keys()).filter(k => !k.startsWith('_original_')).slice(0, 15)
          console.log('🗺️ Map créée avec', map.size, 'entrées. Exemples de clés:', exampleKeys)
          setIrisLogementsMap(map)
        } else {
          console.warn('⚠️ Aucune donnée IRIS trouvée pour', ville.name)
          console.log('   Ville recherchée:', ville.name)
          console.log('   Ville normalisée:', normalizeName(ville.name))
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données de logements IRIS:', error)
        if (error instanceof Error) {
          console.error('   Message:', error.message)
          console.error('   Stack:', error.stack)
        }
      }
    }

    loadIrisLogements()
  }, [ville, normalizeName])

  useEffect(() => {
    if (!ville) return

    async function loadCommuneAndIris() {
      if (!ville) return
      
      try {
        setLoading(true)
        setError(null)

        const villeName = ville.name

        // Fonction pour détecter et extraire le code INSEE des arrondissements de Paris
        const getParisArrondissementCodeInsee = (name: string): string | null => {
          // Pattern 1: "Paris 1er Arrondissement", "Paris 2e Arrondissement", etc.
          let parisArrondissementMatch = name.match(/Paris\s+(\d+)(?:er|e|ème)?\s+Arrondissement/i)
          
          // Pattern 2: "1er arrondissement", "2e arrondissement", etc. (sans "Paris")
          if (!parisArrondissementMatch) {
            parisArrondissementMatch = name.match(/(\d+)(?:er|e|ème)?\s+arrondissement/i)
          }
          
          // Pattern 3: "Paris 1", "Paris 2", etc.
          if (!parisArrondissementMatch) {
            parisArrondissementMatch = name.match(/Paris\s+(\d+)$/i)
          }
          
          // Pattern 4: Juste un nombre (1, 2, 3, etc.) - vérifier si c'est dans le contexte de Paris
          if (!parisArrondissementMatch && /^\d+(?:er|e|ème)?$/.test(name.trim())) {
            const numMatch = name.match(/(\d+)/)
            if (numMatch) {
              parisArrondissementMatch = numMatch
            }
          }
          
          if (parisArrondissementMatch) {
            const arrondissementNum = parseInt(parisArrondissementMatch[1], 10)
            if (arrondissementNum >= 1 && arrondissementNum <= 20) {
              // Code INSEE: 75101 à 75120
              const codeInsee = `751${arrondissementNum.toString().padStart(2, '0')}`
              console.log(`✅ Arrondissement de Paris détecté: "${name}" -> ${arrondissementNum} -> Code INSEE: ${codeInsee}`)
              return codeInsee
            }
          }
          
          // Vérifier aussi si le nom contient "paris" et un numéro d'arrondissement
          const nameLower = name.toLowerCase()
          if (nameLower.includes('paris') || nameLower.includes('arrondissement')) {
            const numMatch = name.match(/(\d+)/)
            if (numMatch) {
              const arrondissementNum = parseInt(numMatch[1], 10)
              if (arrondissementNum >= 1 && arrondissementNum <= 20) {
                const codeInsee = `751${arrondissementNum.toString().padStart(2, '0')}`
                console.log(`✅ Arrondissement de Paris détecté (pattern alternatif): "${name}" -> ${arrondissementNum} -> Code INSEE: ${codeInsee}`)
                return codeInsee
              }
            }
          }
          
          return null
        }

        // Vérifier si c'est un arrondissement de Paris
        const parisCodeInsee = getParisArrondissementCodeInsee(villeName)
        let codeInsee: string | null = null
        let foundCommune: any = null

        if (parisCodeInsee) {
          // Pour les arrondissements de Paris, utiliser directement le code INSEE
          codeInsee = parisCodeInsee
          console.log(`Arrondissement de Paris détecté: ${villeName} -> Code INSEE: ${codeInsee}`)
          
          // Pour les arrondissements de Paris, charger la commune "Paris" (75056) car les arrondissements
          // n'ont pas de géométrie propre dans la base de données
          const communeResponse = await fetch(
            `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?where=com_code%20%3D%20%2275056%22&limit=1`
          )
          
          console.log(`🔍 Chargement de la commune Paris (75056) pour l'arrondissement ${villeName}`)
          
          if (communeResponse.ok) {
            const communeData = await communeResponse.json()
            if (communeData.results && communeData.results.length > 0) {
              foundCommune = communeData.results[0]
              console.log(`✅ Commune Paris chargée:`, {
                com_name: foundCommune.com_name,
                com_code: foundCommune.com_code,
                hasGeoShape: !!foundCommune.geo_shape
              })
              setCommune(foundCommune)
            } else {
              console.warn(`⚠️ Aucune commune trouvée pour Paris (75056)`)
            }
          } else {
            console.warn(`⚠️ Erreur HTTP ${communeResponse.status} lors du chargement de la commune Paris`)
          }
        } else {
          // Pour les autres communes, rechercher par nom
          const communeResponse = await fetch(
            `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?where=com_name%20like%20%22${encodeURIComponent(villeName)}%22&limit=1`
          )
          
          if (!communeResponse.ok) {
            throw new Error('Erreur lors de la récupération de la commune')
          }

          const communeData = await communeResponse.json()
          
          if (!communeData.results || communeData.results.length === 0) {
            throw new Error(`Commune "${villeName}" non trouvée dans la base de données`)
          }
          
          foundCommune = communeData.results[0]
          setCommune(foundCommune)
          
          // Récupérer le code INSEE (peut être dans un tableau)
          codeInsee = Array.isArray(foundCommune.com_code) 
            ? foundCommune.com_code[0] 
            : foundCommune.com_code
        }
        
        console.log('Code INSEE trouvé:', codeInsee)
        
        // 3. Récupérer les IRIS directement depuis OpenDataSoft selon la procédure
        if (codeInsee) {
          // Pour les arrondissements de Paris, passer directement à la logique de fallback
          // car les IRIS sont stockés avec le code INSEE de Paris (75056), pas avec les codes des arrondissements
          if (!parisCodeInsee) {
            try {
              // L'API OpenDataSoft limite à 100 résultats max, on fait plusieurs requêtes si nécessaire
              // Utiliser code_commune selon la procédure ChatGPT
              const irisUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_code%20%3D%20%22${codeInsee}%22&limit=100`
              console.log(`🔍 Requête IRIS pour code INSEE: ${codeInsee}`)
              console.log(`🔗 URL: ${irisUrl}`)
              
              const irisResponse = await fetch(irisUrl)
              
              console.log(`📡 Réponse IRIS - Status: ${irisResponse.status}, OK: ${irisResponse.ok}`)
              
              if (irisResponse.ok) {
                const irisDataRaw = await irisResponse.json()
                console.log(`📊 IRIS bruts reçus: ${irisDataRaw.results?.length || 0} résultats`)
                console.log(`📊 Total count: ${irisDataRaw.total_count || 0}`)
                console.log('🔍 Structure des données brutes:', {
                  hasResults: !!irisDataRaw.results,
                  resultsLength: irisDataRaw.results?.length,
                  firstItem: irisDataRaw.results?.[0] ? {
                    hasGeoShape: !!irisDataRaw.results[0].geo_shape,
                    geoShapeType: irisDataRaw.results[0].geo_shape?.type,
                    irisCode: irisDataRaw.results[0].iris_code,
                    irisName: irisDataRaw.results[0].iris_name,
                    comCode: irisDataRaw.results[0].com_code
                  } : null
                })
                
                if (irisDataRaw.results && irisDataRaw.results.length > 0) {
                // Convertir en FeatureCollection selon la procédure
                // Filtrer d'abord les IRIS "commune non irisée"
                const validIrisResults = irisDataRaw.results.filter((item: any) => {
                  const name = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                  if (name && (name.toLowerCase().includes('commune non irisée') || 
                               name.toLowerCase().includes('non irisée'))) {
                    return false
                  }
                  return true
                })
                
                const features = validIrisResults.map((item: any, index: number) => {
                  try {
                    // geo_shape est un Feature avec geometry
                    const geoFeature = item.geo_shape
                    if (!geoFeature) {
                      console.warn(`Item ${index}: pas de geo_shape`)
                      return null
                    }
                    if (geoFeature.type !== 'Feature') {
                      console.warn(`Item ${index}: geo_shape n'est pas un Feature, type:`, geoFeature.type)
                      return null
                    }
                    if (!geoFeature.geometry) {
                      console.warn(`Item ${index}: geo_shape n'a pas de geometry`)
                      return null
                    }
                    
                    // Extraire code et nom IRIS (tableaux dans OpenDataSoft)
                    const code = Array.isArray(item.iris_code) ? item.iris_code[0] : item.iris_code
                    const name = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                    
                    if (!code) {
                      console.warn(`Item ${index}: pas de code IRIS`)
                      return null
                    }
                    
                    // Log les premiers IRIS pour debug
                    if (index < 5) {
                      console.log(`📝 IRIS ${index} de l'API:`, { code, name, nomComplet: name })
                    }
                    
                    return {
                      type: 'Feature',
                      geometry: geoFeature.geometry,
                      properties: {
                        code_iris: code,
                        nom_iris: name || code,
                        code: code,
                        name: name || code,
                      },
                    }
                  } catch (err: any) {
                    console.error(`Item ${index}: erreur lors de la conversion:`, err.message)
                    return null
                  }
                }).filter((f: any) => f !== null)
                
                const filteredCount = irisDataRaw.results.length - validIrisResults.length
                if (filteredCount > 0) {
                  console.log(`🚫 ${filteredCount} IRIS "commune non irisée" filtrés`)
                }
                console.log(`✅ ${features.length} IRIS convertis sur ${validIrisResults.length} résultats valides (${irisDataRaw.results.length} bruts)`)
                console.log('📋 Premiers noms d\'IRIS de l\'API:', features.slice(0, 5).map((f: any) => f.properties.name))
                
                if (features.length > 0) {
                  const irisFeatureCollection = {
                    type: 'FeatureCollection',
                    features: features,
                  }
                  
                  console.log('FeatureCollection créée:', {
                    type: irisFeatureCollection.type,
                    featuresCount: irisFeatureCollection.features.length,
                    firstFeature: irisFeatureCollection.features[0] ? {
                      type: irisFeatureCollection.features[0].type,
                      hasGeometry: !!irisFeatureCollection.features[0].geometry,
                      properties: irisFeatureCollection.features[0].properties
                    } : null
                  })
                  
                  setIris(irisFeatureCollection)
                } else {
                  console.warn('Aucune feature valide créée')
                  setIris(null)
                }
                }
              } else {
                console.warn('Aucun IRIS trouvé pour cette commune')
                setIris(null)
              }
            } catch (error: any) {
              console.error('Erreur lors de la récupération des IRIS:', error)
              setError(error.message || 'Erreur lors de la récupération des IRIS')
              setIris(null)
            }
          }
          
          // Logique spéciale pour les arrondissements de Paris
          if (parisCodeInsee) {
            console.log(`🔄 Arrondissement de Paris détecté: ${villeName} -> Code INSEE: ${codeInsee}`)
            
            const arrondissementNum = parseInt(parisCodeInsee.replace('751', ''), 10)
            console.log(`🔍 Recherche IRIS pour arrondissement ${arrondissementNum} (code INSEE: ${codeInsee})`)
            
            // Charger directement tous les IRIS de Paris (75056) avec pagination
            const allParisIris: any[] = []
            let offset = 0
            const limit = 100
            let hasMore = true
            
            console.log(`🔄 Chargement des IRIS de Paris (75056) avec pagination...`)
            
            while (hasMore && offset < 2000) { // Limite de sécurité augmentée pour Paris
              try {
                const parisCodeUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_code%20%3D%20%2275056%22&limit=${limit}&offset=${offset}`
                console.log(`🔍 Requête Paris (75056) offset ${offset}...`)
                
                const parisResponse = await fetch(parisCodeUrl)
                if (parisResponse.ok) {
                  const parisData = await parisResponse.json()
                  const results = parisData.results || []
                  
                  if (results.length === 0) {
                    hasMore = false
                  } else {
                    allParisIris.push(...results)
                    offset += limit
                    
                    if (results.length < limit) {
                      hasMore = false
                    }
                  }
                } else {
                  console.warn(`⚠️ Erreur HTTP ${parisResponse.status} à l'offset ${offset}`)
                  hasMore = false
                }
              } catch (err: any) {
                console.error(`❌ Erreur lors de la récupération offset ${offset}:`, err.message)
                hasMore = false
              }
            }
            
            console.log(`📊 Total IRIS de Paris (75056) récupérés: ${allParisIris.length}`)
            
            if (allParisIris.length > 0) {
              // Filtrer les IRIS qui correspondent à l'arrondissement par code IRIS
              const codeInseeStr = String(codeInsee).trim()
              console.log(`🔍 Filtrage des IRIS pour code INSEE: ${codeInseeStr}...`)
              
              const filteredResults = allParisIris.filter((item: any) => {
                const irisCode = Array.isArray(item.iris_code) ? item.iris_code[0] : item.iris_code
                const irisName = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                
                // Convertir le code IRIS en string pour la comparaison
                const irisCodeStr = irisCode ? String(irisCode).trim() : ''
                
                // CRITÈRE PRINCIPAL : Vérifier si le code IRIS commence par le code INSEE de l'arrondissement
                // Les codes IRIS de Paris sont formatés comme : 7510101, 7510102, etc. pour le 1er arrondissement (75101)
                if (irisCodeStr && irisCodeStr.startsWith(codeInseeStr)) {
                  console.log(`✅ IRIS correspond: ${irisName} (${irisCodeStr}) commence par ${codeInseeStr}`)
                  return true
                }
                
                return false
              })
              
              console.log(`📊 ${filteredResults.length} IRIS filtrés pour l'arrondissement ${arrondissementNum}`)
              
              if (filteredResults.length > 0) {
                const validIrisResults = filteredResults.filter((item: any) => {
                  const name = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                  if (name && (name.toLowerCase().includes('commune non irisée') || 
                               name.toLowerCase().includes('non irisée'))) {
                    return false
                  }
                  return true
                })
                
                console.log(`📊 ${validIrisResults.length} IRIS valides après filtrage des "non irisées"`)
                
                const features = validIrisResults.map((item: any, index: number) => {
                  try {
                    const geoFeature = item.geo_shape
                    if (!geoFeature) {
                      console.warn(`⚠️ Item ${index}: pas de geo_shape`)
                      return null
                    }
                    if (geoFeature.type !== 'Feature') {
                      console.warn(`⚠️ Item ${index}: geo_shape n'est pas un Feature, type:`, geoFeature.type)
                      return null
                    }
                    if (!geoFeature.geometry) {
                      console.warn(`⚠️ Item ${index}: geo_shape n'a pas de geometry`)
                      return null
                    }
                    
                    const code = Array.isArray(item.iris_code) ? item.iris_code[0] : item.iris_code
                    const name = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                    
                    if (!code) {
                      console.warn(`⚠️ Item ${index}: pas de code IRIS`)
                      return null
                    }
                    
                    // Log les premiers pour debug
                    if (index < 3) {
                      console.log(`📝 IRIS ${index}:`, {
                        code,
                        name,
                        hasGeometry: !!geoFeature.geometry,
                        geometryType: geoFeature.geometry?.type,
                        hasCoordinates: !!geoFeature.geometry?.coordinates
                      })
                    }
                    
                    return {
                      type: 'Feature',
                      geometry: geoFeature.geometry,
                      properties: {
                        code_iris: code,
                        nom_iris: name || code,
                        code: code,
                        name: name || code,
                        // Ajouter aussi les propriétés originales si disponibles
                        ...(item.iris_code && { iris_code: item.iris_code }),
                        ...(item.iris_name && { iris_name: item.iris_name }),
                      },
                    }
                  } catch (err: any) {
                    console.error(`❌ Item ${index}: erreur lors de la conversion:`, err.message)
                    return null
                  }
                }).filter((f: any) => f !== null)
                
                console.log(`📊 ${features.length} features valides créées sur ${validIrisResults.length} IRIS filtrés`)
                
                // Vérifier que toutes les features ont des géométries valides
                const featuresWithGeometry = features.filter((f: any) => 
                  f.geometry && f.geometry.type && f.geometry.coordinates
                )
                console.log(`📊 ${featuresWithGeometry.length} features avec géométrie valide sur ${features.length} total`)
                
                if (features.length > 0) {
                  const irisFeatureCollection = {
                    type: 'FeatureCollection',
                    features: featuresWithGeometry.length > 0 ? featuresWithGeometry : features,
                  }
                  
                  console.log('✅ FeatureCollection créée:', {
                    type: irisFeatureCollection.type,
                    featuresCount: irisFeatureCollection.features.length,
                    firstFeature: irisFeatureCollection.features[0] ? {
                      type: irisFeatureCollection.features[0].type,
                      hasGeometry: !!irisFeatureCollection.features[0].geometry,
                      geometryType: irisFeatureCollection.features[0].geometry?.type,
                      hasCoordinates: !!irisFeatureCollection.features[0].geometry?.coordinates,
                      coordinatesLength: Array.isArray(irisFeatureCollection.features[0].geometry?.coordinates) 
                        ? irisFeatureCollection.features[0].geometry.coordinates.length 
                        : 'N/A',
                      properties: irisFeatureCollection.features[0].properties
                    } : null
                  })
                  
                  if (featuresWithGeometry.length === 0) {
                    console.error('❌ AUCUNE FEATURE AVEC GÉOMÉTRIE VALIDE!')
                  }
                  
                  setIris(irisFeatureCollection)
                  console.log(`✅ ${features.length} IRIS chargés pour l'arrondissement ${arrondissementNum} et assignés à setIris`)
                  return
                } else {
                  console.warn('⚠️ Aucune feature valide créée malgré le filtrage')
                }
              } else {
                console.warn(`⚠️ Aucun IRIS trouvé pour l'arrondissement ${arrondissementNum} avec le code INSEE ${codeInseeStr}`)
              }
            } else {
              console.warn(`⚠️ Aucun IRIS de Paris récupéré depuis l'API`)
            }
            
            // Fallback: Essayer avec le code INSEE de Paris (75056) avec pagination
            console.log(`🔄 Tentative avec code INSEE de Paris (75056) avec pagination...`)
            
            // Charger les noms d'IRIS depuis le fichier local d'abord
            let localIrisNamesFallback: string[] = []
            try {
              const localDataResponse = await fetch('/api/iris-logements')
              if (localDataResponse.ok) {
                const localData = await localDataResponse.json()
                const villeLower = villeName.toLowerCase()
                const villeData = localData.find((item: any) => 
                  item.ville && item.ville.toLowerCase() === villeLower
                )
                if (villeData && villeData.iris) {
                  localIrisNamesFallback = villeData.iris
                    .filter((iris: any) => {
                      const nomIris = iris.nom_iris || ''
                      return !nomIris.toLowerCase().includes('commune non irisée') && 
                             !nomIris.toLowerCase().includes('non irisée')
                    })
                    .map((iris: any) => iris.nom_iris?.toLowerCase() || '')
                  console.log(`📋 ${localIrisNamesFallback.length} noms d'IRIS trouvés dans le fichier local (fallback)`)
                }
              }
            } catch (localError: any) {
              console.warn('⚠️ Impossible de charger les données locales:', localError.message)
            }
            
            const arrondissementNumFallback = parseInt(parisCodeInsee.replace('751', ''), 10)
            console.log(`🔍 Recherche IRIS pour arrondissement ${arrondissementNumFallback} (code INSEE: ${codeInsee})`)
            
            // Charger tous les IRIS de Paris avec pagination
            const allParisIrisFallback: any[] = []
            let offsetFallback = 0
            const limitFallback = 100
            let hasMoreFallback = true
            
            while (hasMoreFallback && offsetFallback < 500) { // Limite de sécurité
              try {
                const parisCodeUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_code%20%3D%20%2275056%22&limit=${limitFallback}&offset=${offsetFallback}`
                console.log(`🔍 Requête Paris (75056) offset ${offsetFallback}...`)
                
                const parisResponse = await fetch(parisCodeUrl)
                if (parisResponse.ok) {
                  const parisData = await parisResponse.json()
                  const results = parisData.results || []
                  
                  if (results.length === 0) {
                    hasMoreFallback = false
                  } else {
                    allParisIrisFallback.push(...results)
                    offsetFallback += limitFallback
                    
                    if (results.length < limitFallback) {
                      hasMoreFallback = false
                    }
                  }
                } else {
                  console.warn(`⚠️ Erreur HTTP ${parisResponse.status} à l'offset ${offsetFallback}`)
                  hasMoreFallback = false
                }
              } catch (err: any) {
                console.error(`❌ Erreur lors de la récupération offset ${offsetFallback}:`, err.message)
                hasMoreFallback = false
              }
            }
            
            console.log(`📊 Total IRIS de Paris (75056) récupérés: ${allParisIrisFallback.length}`)
            
            if (allParisIrisFallback.length > 0) {
              const filteredResults = allParisIrisFallback.filter((item: any) => {
                const irisCode = Array.isArray(item.iris_code) ? item.iris_code[0] : item.iris_code
                const irisName = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                
                // Convertir le code IRIS en string pour la comparaison
                const irisCodeStr = irisCode ? String(irisCode).trim() : ''
                const codeInseeStr = String(codeInsee).trim()
                
                // CRITÈRE PRINCIPAL : Vérifier si le code IRIS commence par le code INSEE de l'arrondissement
                // Les codes IRIS de Paris sont formatés comme : 7510101, 7510102, etc. pour le 1er arrondissement (75101)
                if (irisCodeStr && irisCodeStr.startsWith(codeInseeStr)) {
                  console.log(`✅ IRIS correspond par irisCode (fallback): ${irisName} (${irisCodeStr}) commence par ${codeInseeStr}`)
                  return true
                }
                
                // Si on a des noms locaux, vérifier la correspondance
                if (localIrisNamesFallback.length > 0 && irisName) {
                  const irisNameLower = irisName.toLowerCase()
                  if (localIrisNamesFallback.some(localName => {
                    const localNameLower = localName.toLowerCase()
                    return irisNameLower.includes(localNameLower) || 
                           localNameLower.includes(irisNameLower.substring(0, 20)) ||
                           irisNameLower.includes(localNameLower.substring(0, 20))
                  })) {
                    console.log(`✅ IRIS correspond par nom local (fallback): ${irisName}`)
                    return true
                  }
                }
                
                return false
              })
              
              console.log(`📊 ${filteredResults.length} IRIS filtrés pour l'arrondissement ${arrondissementNumFallback}`)
              
              if (filteredResults.length > 0) {
                const validIrisResults = filteredResults.filter((item: any) => {
                  const name = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                  if (name && (name.toLowerCase().includes('commune non irisée') || 
                               name.toLowerCase().includes('non irisée'))) {
                    return false
                  }
                  return true
                })
                
                const features = validIrisResults.map((item: any, index: number) => {
                  try {
                    const geoFeature = item.geo_shape
                    if (!geoFeature || geoFeature.type !== 'Feature' || !geoFeature.geometry) {
                      return null
                    }
                    
                    const code = Array.isArray(item.iris_code) ? item.iris_code[0] : item.iris_code
                    const name = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                    
                    if (!code) return null
                    
                    return {
                      type: 'Feature',
                      geometry: geoFeature.geometry,
                      properties: {
                        code_iris: code,
                        nom_iris: name || code,
                        code: code,
                        name: name || code,
                      },
                    }
                  } catch (err: any) {
                    return null
                  }
                }).filter((f: any) => f !== null)
                
                console.log(`📊 ${features.length} features valides créées sur ${validIrisResults.length} IRIS filtrés`)
                
                if (features.length > 0) {
                  const irisFeatureCollection = {
                    type: 'FeatureCollection',
                    features: features,
                  }
                  
                  setIris(irisFeatureCollection)
                  console.log(`✅ ${features.length} IRIS chargés via code Paris (75056) pour l'arrondissement ${arrondissementNumFallback}`)
                  return
                }
              }
            }
            
            // Si aucune méthode n'a fonctionné, afficher un message d'erreur
            console.warn(`⚠️ Aucun IRIS trouvé pour l'arrondissement de Paris: ${villeName}`)
            setIris(null)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des données')
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCommuneAndIris()
  }, [ville])

  const tournee = ville?.tournees[tourneeIndex]

  // Vérifier si la date limite (15 jours avant) est dépassée
  const isDateLimiteDepassee = useMemo(() => {
    if (!tournee) return false
    
    // Parser la date de début (format: "DD mois YYYY")
    const dateDebutStr = tournee.dateDebut
    const moisMap: Record<string, number> = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    }
    
    const parts = dateDebutStr.split(' ')
    if (parts.length !== 3) return false
    
    const jour = parseInt(parts[0])
    const mois = moisMap[parts[1].toLowerCase()]
    const annee = parseInt(parts[2])
    
    if (isNaN(jour) || isNaN(annee) || mois === undefined) return false
    
    const dateDebut = new Date(annee, mois, jour)
    const dateLimite = new Date(dateDebut)
    dateLimite.setDate(dateLimite.getDate() - 15) // 15 jours avant
    
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0) // Réinitialiser l'heure pour comparer seulement les dates
    dateLimite.setHours(0, 0, 0, 0)
    
    return aujourdhui > dateLimite
  }, [tournee])

  // Vérifier l'authentification
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase non configuré, authentification désactivée')
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])



  // Charger les comptages d'IRIS pour cette tournée
  useEffect(() => {
    if (!ville || !tournee) return
    if (!isSupabaseConfigured()) {
      console.warn('Supabase non configuré, comptages IRIS désactivés')
      return
    }

    async function loadIrisCounts() {
      if (!ville || !tournee) return
      
      try {
        // Charger les participations pour cette tournée avec les détails du flyer
        const { data: participations, error: participationsError } = await supabase
          .from('france_distri_participations')
          .select('id, flyer_entreprise, flyer_title')
          .eq('ville_name', ville.name)
          .eq('tournee_date_debut', tournee.dateDebut)
          .neq('status', 'cancelled')

        if (participationsError) {
          console.error('Erreur lors du chargement des participations:', participationsError)
          return
        }

        if (!participations || participations.length === 0) {
          setIrisCounts(new Map())
          setIrisParticipants(new Map())
          return
        }

        const participationIds = (participations as { id: string }[]).map(p => p.id)

        // Créer une map participation_id -> détails (toujours créer une entrée, même si les données sont partielles)
        const participationDetails = new Map<string, { entreprise: string; titre: string }>()
        participations.forEach((p: any) => {
          participationDetails.set(p.id, {
            entreprise: p.flyer_entreprise || 'Non renseigné',
            titre: p.flyer_title || 'Non renseigné'
          })
        })

        // Charger les sélections d'IRIS pour ces participations
        const { data: selections, error: selectionsError } = await supabase
          .from('france_distri_iris_selections')
          .select('iris_code, participation_id')
          .in('participation_id', participationIds)

        if (selectionsError) {
          console.error('Erreur lors du chargement des sélections:', selectionsError)
          return
        }

        // Compter les sélections par IRIS et stocker les détails des participants
        const counts = new Map<string, number>()
        const participants = new Map<string, Array<{ entreprise: string; titre: string }>>()
        const countedParticipations = new Map<string, Set<string>>() // iris_code -> Set<participation_id>

        selections?.forEach((item: any) => {
          const irisCode = item.iris_code
          const participationId = item.participation_id

          if (!countedParticipations.has(irisCode)) {
            countedParticipations.set(irisCode, new Set())
          }

          const participationSet = countedParticipations.get(irisCode)!
          if (!participationSet.has(participationId)) {
            participationSet.add(participationId)
            counts.set(irisCode, participationSet.size)
            
            // Ajouter les détails du participant (même si les détails sont partiels)
            const details = participationDetails.get(participationId) || {
              entreprise: 'Non renseigné',
              titre: 'Non renseigné'
            }
            if (!participants.has(irisCode)) {
              participants.set(irisCode, [])
            }
            participants.get(irisCode)!.push(details)
          }
        })

        console.log('📊 Comptages IRIS chargés:', Array.from(counts.entries()))
        console.log('👥 Participants par IRIS:', Array.from(participants.entries()))
        setIrisCounts(counts)
        setIrisParticipants(participants)
      } catch (err) {
        console.error('Erreur lors du chargement des comptages:', err)
      }
    }

    loadIrisCounts()
  }, [ville, tournee])

  if (!ville) {
    return (
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Ville non trouvée</h1>
            <Link href="/tournees" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
              Retour aux tournées
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (!tournee) {
    return (
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Tournée non trouvée</h1>
            <Link href={`/tournees/${encodeURIComponent(ville.name.toLowerCase())}`} className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
              Retour aux tournées
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Fonction utilitaire pour calculer les logements d'un IRIS
  // Fonction helper pour obtenir le nom d'un secteur à partir de son code
  const getIrisNameFromCode = useCallback((irisCode: string): string => {
    if (!iris || !iris.features) return irisCode
    
    const feature = iris.features.find((f: any) => 
      f.properties?.code === irisCode || 
      f.properties?.code_iris === irisCode ||
      f.properties?.codeIris === irisCode
    )
    
    return feature?.properties?.name || 
           feature?.properties?.nom_iris || 
           feature?.properties?.nom || 
           irisCode
  }, [iris])

  const calculateIrisLogements = useCallback((irisName: string, irisCode?: string, properties?: any): number => {
    // Petite fonction de secours : répartir le total de logements de la commune
    // entre les IRIS quand on n'a AUCUNE donnée spécifique (éviter les IRIS à 0)
    const computeFallbackFromCommune = (): number => {
      try {
        if (!ville || !ville.logements || !iris || !Array.isArray(iris.features) || iris.features.length === 0) {
          return 0
        }

        const totalCommune = parseFloat(
          String(ville.logements).replace(/\s/g, '').replace(',', '.')
        ) || 0

        if (totalCommune <= 0) return 0

        const irisCount = iris.features.length
        if (irisCount <= 0) return 0

        const perIris = Math.max(1, Math.round(totalCommune / irisCount))
        console.log(`ℹ️ Fallback logements pour ${irisName}: ${perIris} (total commune ${totalCommune} / ${irisCount} IRIS)`)
        return perIris
      } catch (e) {
        console.warn('⚠️ Erreur lors du calcul du fallback logements depuis la commune:', e)
        return 0
      }
    }

    // 1. Si l'API fournit directement les logements dans les propriétés de l'IRIS,
    // on se fie à elle en priorité
    if (properties) {
      const directLogements = properties.logements || properties.logements_iris || properties.logementsIris
      if (directLogements && !isNaN(Number(directLogements))) {
        const logementsValue = Number(directLogements)
        if (logementsValue > 0) {
          console.log(`✅ Logements trouvés directement dans les propriétés (API/geo): ${logementsValue}`)
          return logementsValue
        }
      }
    }
    
    // 2. Si la map issue du JSON est complètement vide pour cette commune,
    // on évite les IRIS à 0 en utilisant un fallback basé sur le total communal
    if (irisLogementsMap.size === 0) {
      console.warn(`⚠️ irisLogementsMap est vide pour ${irisName} (code: ${irisCode}), on utilise un fallback à partir de la commune`)
      return computeFallbackFromCommune()
    }
    
    const normalizedName = normalizeName(irisName)
    const lowerName = irisName.toLowerCase().trim()
    
    console.log(`🔍 calculateIrisLogements - Recherche pour:`, {
      irisName,
      normalizedName,
      lowerName,
      irisCode,
      mapSize: irisLogementsMap.size,
      hasNormalizedName: irisLogementsMap.has(normalizedName),
      hasLowerName: irisLogementsMap.has(lowerName),
      sampleKeys: Array.from(irisLogementsMap.keys()).filter(k => !k.startsWith('_original_')).slice(0, 10)
    })
    
    let logements = irisLogementsMap.get(normalizedName) || irisLogementsMap.get(lowerName) || 0
    
    // Si pas trouvé, essayer avec le nom sans accents ni caractères spéciaux
    if (logements === 0) {
      const nameWithoutAccents = irisName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
      logements = irisLogementsMap.get(nameWithoutAccents) || 0
      if (logements > 0) {
        console.log(`✅ Logements trouvés avec nom sans accents: ${nameWithoutAccents} = ${logements}`)
      }
    }
    
    // Si pas trouvé, essayer avec le nom sans espaces
    if (logements === 0) {
      const nameNoSpaces = normalizedName.replace(/\s/g, '')
      logements = irisLogementsMap.get(nameNoSpaces) || 0
      if (logements > 0) {
        console.log(`✅ Logements trouvés avec nom sans espaces: ${nameNoSpaces} = ${logements}`)
      }
    }
    
    // Recherche spéciale pour les noms avec apostrophes (ex: "Goutte d'Or 8")
    if (logements === 0 && irisName.includes("'")) {
      console.log(`🔍 Recherche spéciale pour nom avec apostrophe: "${irisName}"`)
      
      // Essayer avec l'apostrophe remplacée par un espace
      const nameWithSpace = irisName.replace(/'/g, ' ')
      const normalizedWithSpace = normalizeName(nameWithSpace)
      logements = irisLogementsMap.get(normalizedWithSpace) || 0
      if (logements > 0) {
        console.log(`✅ Logements trouvés avec apostrophe remplacée par espace: ${logements}`)
      }
      
      // Essayer sans apostrophe (déjà fait par normalizeName, mais essayer aussi directement)
      if (logements === 0) {
        const nameWithoutApostrophe = irisName.replace(/'/g, '')
        const normalizedWithoutApostrophe = normalizeName(nameWithoutApostrophe)
        logements = irisLogementsMap.get(normalizedWithoutApostrophe) || 0
        if (logements > 0) {
          console.log(`✅ Logements trouvés sans apostrophe: ${logements}`)
        }
      }
      
      // Recherche par mots significatifs pour les noms avec apostrophes
      if (logements === 0) {
        // AMÉLIORATION: Utiliser >= 2 caractères au lieu de >= 3 pour capturer "dor" dans "Goutte d'Or"
        const significantWords = irisName
          .toLowerCase()
          .replace(/'/g, ' ')
          .split(/\s+/)
          .filter(w => w.length >= 2 && !/^\d+$/.test(w)) // Exclure les nombres seuls, mais garder les mots de 2 caractères
        
        console.log(`   Mots significatifs extraits (>= 2 caractères):`, significantWords)
        
        if (significantWords.length >= 1) {
          // Chercher dans toutes les clés qui contiennent au moins un mot significatif
          for (const [key, value] of Array.from(irisLogementsMap.entries())) {
            if (key.startsWith('_original_')) continue
            
            const keyLower = key.toLowerCase()
            const matchingWords = significantWords.filter(word => 
              keyLower.includes(word) || word.includes(keyLower.substring(0, Math.min(word.length, keyLower.length)))
            )
            
            // Si au moins 50% des mots correspondent OU si on a au moins 2 mots qui correspondent
            const matchRatio = matchingWords.length / significantWords.length
            if (matchRatio >= 0.5 || (significantWords.length >= 2 && matchingWords.length >= 2)) {
              console.log(`✅ Match trouvé par mots significatifs avec apostrophe: "${key}" = ${value} (${matchingWords.length}/${significantWords.length} mots)`)
              logements = value
              break
            }
          }
        }
      }
    }
    
    // Recherche spéciale pour les noms avec nombres (ex: "Chapelle 7")
    if (logements === 0 && /\d/.test(irisName)) {
      console.log(`🔍 Recherche spéciale pour nom avec nombre: "${irisName}"`)
      
      // Extraire le nom de base (sans le nombre à la fin)
      const baseName = irisName.replace(/\s*\d+\s*$/, '').trim()
      const normalizedBaseName = normalizeName(baseName)
      const numberInName = irisName.match(/\d+/)?.[0]
      
      // Chercher toutes les clés qui commencent par le nom de base
      for (const [key, value] of Array.from(irisLogementsMap.entries())) {
        if (key.startsWith('_original_')) continue
        
        const keyLower = key.toLowerCase()
        // Si la clé commence par le nom de base (ex: "chapelle" pour "chapelle 7")
        if (keyLower.startsWith(normalizedBaseName) || normalizedBaseName.startsWith(keyLower.substring(0, Math.min(normalizedBaseName.length, keyLower.length)))) {
          // Vérifier que c'est bien le même IRIS en comparant le nombre
          const numberInKey = key.match(/\d+/)?.[0]
          
          // Si les nombres correspondent OU si on n'a pas de nombre dans la clé mais que le nom de base correspond bien
          if (!numberInKey || numberInKey === numberInName) {
            // Vérifier que le nom de base correspond vraiment (pas juste une sous-chaîne)
            const keyWords = keyLower.split(/\s+/).filter(w => w.length >= 2)
            const baseWords = normalizedBaseName.split(/\s+/).filter(w => w.length >= 2)
            const matchingBaseWords = baseWords.filter(bw => 
              keyWords.some(kw => kw === bw || kw.startsWith(bw) || bw.startsWith(kw))
            )
            
            // Si au moins 50% des mots de base correspondent
            if (matchingBaseWords.length >= Math.ceil(baseWords.length * 0.5)) {
              console.log(`✅ Match trouvé par nom de base avec nombre: "${key}" = ${value} (nombre: ${numberInKey || 'N/A'})`)
              logements = value
              break
            }
          }
        }
      }
    }
    
    // Essayer aussi avec le code IRIS si disponible (plusieurs variantes)
    if (logements === 0 && irisCode) {
      const codeStr = String(irisCode).trim()
      const codeVariants = [
        codeStr.toLowerCase(),
        codeStr,
        codeStr.replace(/\s/g, ''),
        codeStr.toLowerCase().replace(/\s/g, ''),
        codeStr.padStart(9, '0'), // Code INSEE formaté avec zéros
        codeStr.padStart(5, '0'), // Code IRIS formaté
        // Pour les codes Paris (75110xxx), essayer aussi les 6 derniers chiffres
        codeStr.length > 6 ? codeStr.substring(5) : codeStr,
        codeStr.length > 6 ? codeStr.substring(5).toLowerCase() : codeStr.toLowerCase(),
      ]
      
      console.log(`🔍 Recherche dans irisLogementsMap avec code IRIS: ${codeStr}`)
      console.log(`   Variantes testées:`, codeVariants)
      
      for (const variant of codeVariants) {
        const found = irisLogementsMap.get(variant)
        if (found && found > 0) {
          console.log(`✅ Logements trouvés avec variante de code: "${variant}" = ${found}`)
          logements = found
          break
        }
      }
      
      // Si toujours pas trouvé, chercher par sous-chaîne dans toutes les clés qui contiennent le code
      if (logements === 0) {
        console.log(`   Recherche par sous-chaîne du code dans toutes les clés...`)
        const codeSearch = codeStr.toLowerCase()
        const codeSearchParts = [
          codeSearch.substring(0, 6), // Premiers 6 chiffres (751103)
          codeSearch.substring(5), // Derniers chiffres (3701)
          codeSearch.substring(5, 7), // 2 premiers chiffres après 75110 (37)
        ]
        
        for (const [key, value] of Array.from(irisLogementsMap.entries())) {
          if (key.startsWith('_original_')) continue
          const keyLower = key.toLowerCase()
          for (const part of codeSearchParts) {
            if (keyLower.includes(part) || part.includes(keyLower)) {
              if (value > 0) {
                console.log(`✅ Logements trouvés par sous-chaîne de code "${part}" dans clé "${key}": ${value}`)
                logements = value
                break
              }
            }
          }
          if (logements > 0) break
        }
      }
      
      if (logements === 0) {
        // Afficher quelques exemples de clés dans la map pour debug
        const mapKeys = Array.from(irisLogementsMap.keys()).filter(k => !k.startsWith('_original_'))
        const codeKeys = mapKeys.filter(k => k.includes(codeStr.substring(0, 5)) || k.includes(codeStr.substring(5)))
        console.log(`   Aucune correspondance trouvée. Exemples de clés dans la map (${mapKeys.length} total):`, mapKeys.slice(0, 10))
        if (codeKeys.length > 0) {
          console.log(`   Clés similaires trouvées:`, codeKeys.slice(0, 5))
        }
      }
    }
    
    // Si pas trouvé, essayer de chercher par fuzzy matching avec le nom
    if (logements === 0 && irisLogementsMap.size > 0) {
      console.log(`🔍 Tentative de fuzzy matching avec le nom: "${irisName}"`)
      
      // Créer des clés de recherche pour l'IRIS sélectionné
      const searchKeys = createSearchKey(irisName)
      console.log(`   Clés de recherche créées:`, searchKeys)
      
      // Chercher dans toutes les clés de la map
      const mapEntries = Array.from(irisLogementsMap.entries())
      let bestMatch: { key: string; value: number; score: number } | null = null
      
      for (const [key, value] of mapEntries) {
        // Ignorer les clés de référence
        if (key.startsWith('_original_')) continue
        
        // Essayer chaque clé de recherche
        for (const searchKey of searchKeys) {
          const keyNormalized = normalizeName(key)
          const searchKeyNormalized = normalizeName(searchKey)
          
          // Correspondance exacte
          if (keyNormalized === searchKeyNormalized || 
              keyNormalized === searchKey || 
              key === searchKey) {
            console.log(`✅ Correspondance exacte trouvée: "${key}" = ${value}`)
            logements = value
            break
          }
          
          // Correspondance sans espaces
          if (keyNormalized.replace(/\s/g, '') === searchKeyNormalized.replace(/\s/g, '')) {
            console.log(`✅ Correspondance sans espaces trouvée: "${key}" = ${value}`)
            logements = value
            break
          }
          
          // Correspondance par sous-chaîne (si le nom de l'IRIS contient la clé ou vice versa)
          if (keyNormalized.includes(searchKeyNormalized) || searchKeyNormalized.includes(keyNormalized)) {
            const matchLength = Math.min(keyNormalized.length, searchKeyNormalized.length)
            const maxLength = Math.max(keyNormalized.length, searchKeyNormalized.length)
            const score = matchLength / maxLength
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { key, value, score }
              console.log(`   Match partiel trouvé (score: ${score.toFixed(2)}): "${key}" = ${value}`)
            }
          }
          
          // Correspondance par mots significatifs (>= 2 caractères, pas 3)
          const keyWords = keyNormalized.split(/\s+/).filter(w => w.length >= 2)
          const searchWords = searchKeyNormalized.split(/\s+/).filter(w => w.length >= 2)
          
          if (keyWords.length > 0 && searchWords.length > 0) {
            // Compter les mots qui correspondent
            const matchingWords = searchWords.filter(sw => 
              keyWords.some(kw => kw === sw || kw.includes(sw) || sw.includes(kw))
            )
            const score = matchingWords.length / Math.max(keyWords.length, searchWords.length)
            
            // Si au moins 50% des mots correspondent, c'est un bon match
            if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
              bestMatch = { key, value, score }
              console.log(`   Match par mots (score: ${score.toFixed(2)}): "${key}" = ${value}`)
            }
          }
        }
        
        if (logements > 0) break
      }
      
      // Si on a un meilleur match mais pas de correspondance exacte, l'utiliser
      // AMÉLIORATION: Réduire le seuil à 0.25 pour être plus tolérant
      if (logements === 0 && bestMatch && bestMatch.score > 0.25) {
        console.log(`✅ Meilleur match trouvé (score: ${bestMatch.score.toFixed(2)}): "${bestMatch.key}" = ${bestMatch.value}`)
        logements = bestMatch.value
      } else if (logements === 0 && bestMatch) {
        console.log(`⚠️ Match trouvé mais score trop faible (${bestMatch.score.toFixed(2)}): "${bestMatch.key}"`)
      }
    }
    
    // Dernière recherche agressive : recherche par sous-chaîne significative
    if (logements === 0 && irisName.length >= 5) {
      console.log(`🔍 Recherche agressive par sous-chaîne significative: "${irisName}"`)
      
      // AMÉLIORATION: Utiliser >= 2 caractères pour capturer "dor" dans "Goutte d'Or"
      const significantWords = irisName
        .toLowerCase()
        .replace(/'/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !/^\d+$/.test(w)) // Exclure les nombres seuls
      
      console.log(`   Mots significatifs extraits (>= 2 caractères):`, significantWords)
      
      if (significantWords.length > 0) {
        // Chercher dans toutes les clés qui contiennent au moins un mot significatif
        let bestMatch: { key: string; value: number; matchCount: number } | null = null
        
        for (const [key, value] of Array.from(irisLogementsMap.entries())) {
          if (key.startsWith('_original_')) continue
          
          const keyLower = key.toLowerCase()
          const matchingWords = significantWords.filter(word => 
            keyLower.includes(word) || word.includes(keyLower.substring(0, Math.min(word.length, keyLower.length)))
          )
          
          // Si au moins 50% des mots significatifs correspondent
          const matchRatio = matchingWords.length / significantWords.length
          if (matchRatio >= 0.5) {
            if (!bestMatch || matchingWords.length > bestMatch.matchCount) {
              bestMatch = { key, value, matchCount: matchingWords.length }
            }
          }
        }
        
        if (bestMatch) {
          console.log(`✅ Match trouvé par sous-chaîne significative: "${bestMatch.key}" = ${bestMatch.value} (${bestMatch.matchCount}/${significantWords.length} mots)`)
          logements = bestMatch.value
        }
      }
    }
    
    // Dernière tentative : recherche par préfixe du nom (pour les cas comme "Goutte d'Or 8")
    if (logements === 0 && irisName.length >= 5) {
      console.log(`🔍 Dernière tentative : recherche par préfixe du nom: "${irisName}"`)
      
      // Extraire le préfixe (premiers mots significatifs, sans le nombre final)
      const nameWithoutNumber = irisName.replace(/\s*\d+\s*$/, '').trim()
      const prefix = normalizeName(nameWithoutNumber).substring(0, Math.min(10, nameWithoutNumber.length))
      
      console.log(`   Préfixe extrait: "${prefix}"`)
      
      if (prefix.length >= 5) {
        for (const [key, value] of Array.from(irisLogementsMap.entries())) {
          if (key.startsWith('_original_')) continue
          
          const keyLower = key.toLowerCase()
          // Si la clé commence par le préfixe ou contient le préfixe
          if (keyLower.startsWith(prefix) || keyLower.includes(prefix) || prefix.includes(keyLower.substring(0, prefix.length))) {
            // Vérifier que c'est bien le même IRIS en comparant le nombre si présent
            const numberInName = irisName.match(/\d+/)?.[0]
            const numberInKey = key.match(/\d+/)?.[0]
            
            if (!numberInName || !numberInKey || numberInName === numberInKey) {
              console.log(`✅ Match trouvé par préfixe: "${key}" = ${value}`)
              logements = value
              break
            }
          }
        }
      }
    }
    
    // Si toujours pas trouvé, essayer une recherche plus large par code IRIS dans toutes les clés
    if (logements === 0 && irisCode && irisLogementsMap.size > 0) {
      const codeSearch = irisCode.toLowerCase().trim()
      const codeSearchNoSpaces = codeSearch.replace(/\s/g, '')
      
      // Parcourir toutes les clés et chercher celles qui contiennent le code
      for (const [key, value] of Array.from(irisLogementsMap.entries())) {
        if (key.startsWith('_original_')) continue
        
        const keyLower = key.toLowerCase()
        // Si la clé contient le code IRIS ou vice versa
        if (keyLower.includes(codeSearch) || codeSearch.includes(keyLower) ||
            keyLower.includes(codeSearchNoSpaces) || codeSearchNoSpaces.includes(keyLower)) {
          logements = value
          console.log(`✅ Logements trouvés par recherche large de code: ${key} = ${logements}`)
          break
        }
      }
    }
    
    // Dernière tentative : recherche par sous-chaîne dans toutes les clés
    if (logements === 0 && irisName.length >= 3) {
      const searchSubstring = irisName.toLowerCase().substring(0, Math.min(irisName.length, 10))
      for (const [key, value] of Array.from(irisLogementsMap.entries())) {
        if (key.startsWith('_original_')) continue
        if (key.toLowerCase().includes(searchSubstring) || searchSubstring.includes(key.toLowerCase())) {
          logements = value
          break
        }
      }
    }

    // Si après toutes les tentatives on n'a toujours rien trouvé dans la map,
    // on revient à un fallback propre basé sur la commune (pour éviter 0 logements)
    if (logements === 0) {
      const fallback = computeFallbackFromCommune()
      if (fallback > 0) {
        return fallback
      }
    }
    
    return logements
  }, [irisLogementsMap, normalizeName, createSearchKey, ville, iris])

  // Restaurer les sélections depuis localStorage au retour de la page de confirmation
  // (placé après calculateIrisLogements pour éviter les erreurs de référence)
  const hasRestoredSelections = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (irisLogementsMap.size === 0) return // Attendre que les logements soient chargés
    if (hasRestoredSelections.current) return // Ne restaurer qu'une seule fois
    
    const stored = localStorage.getItem('pendingSelection')
    if (!stored) return
    
    try {
      const data = JSON.parse(stored)
      // Vérifier que c'est bien pour cette ville et cette tournée
      if (data.villeName === ville?.name && data.tourneeIndex === tourneeIndex) {
        // Restaurer les sélections avec recalcul des logements (en passant aussi le code IRIS pour améliorer le matching)
        const restoredIris = data.selectedIris.map((iris: SelectedIris) => {
          // S'assurer que le code est une string pour la comparaison
          const code = String(iris.code || '')
          const logements = calculateIrisLogements(iris.name, code, undefined)
          return {
            code: code,
            name: iris.name,
            logements: logements
          }
        })
        setSelectedIris(restoredIris)
        hasRestoredSelections.current = true
      }
    } catch (error) {
      console.error('Erreur lors de la restauration des sélections:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [irisLogementsMap.size, ville?.name, tourneeIndex])

  // Recalculer les logements pour les IRIS sélectionnés quand irisLogementsMap est chargé ou mis à jour
  const lastMapSizeRef = useRef(0)
  useEffect(() => {
    if (irisLogementsMap.size === 0 || selectedIris.length === 0) {
      lastMapSizeRef.current = irisLogementsMap.size
      return
    }
    
    // Ne recalculer que si la map a changé (nouveaux logements chargés)
    if (irisLogementsMap.size === lastMapSizeRef.current) return
    
    lastMapSizeRef.current = irisLogementsMap.size
    
    // Recalculer les logements pour tous les IRIS sélectionnés
    setSelectedIris(prev => {
      const updatedIris = prev.map(iris => {
        const logements = calculateIrisLogements(iris.name, iris.code)
        console.log(`🔄 Recalcul logements pour ${iris.name} (code: ${iris.code}): ${logements}`)
        return {
          ...iris,
          logements: logements
        }
      })
      
      // Mettre à jour seulement si les logements ont changé
      const hasChanged = updatedIris.some((updated, index) => 
        updated.logements !== prev[index]?.logements
      )
      
      if (hasChanged) {
        console.log('📊 Mise à jour des logements:', updatedIris)
        return updatedIris
      }
      
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [irisLogementsMap.size])

  const handleIrisSelect = (irisCode: string, irisName: string, properties?: any) => {
    // Normaliser le code IRIS pour la comparaison (s'assurer que c'est une string)
    const normalizedCode = String(irisCode || '').trim()
    
    // Détecter si c'est une commune non irisée
    const isCommuneNonIrisee = normalizedCode.startsWith('COMMUNE_NON_IRISEE_')
    
    setSelectedIris(prev => {
      // Comparer avec normalisation pour gérer les différences de type (string vs number)
      const exists = prev.find(i => {
        const iCode = String(i.code || '').trim()
        return iCode === normalizedCode
      })
      
      if (exists) {
        // Désélectionner l'IRIS - aucune vérification lors de la désélection
        const newSelection = prev.filter(i => {
          const iCode = String(i.code || '').trim()
          return iCode !== normalizedCode
        })
        // Fermer le panel si plus aucun secteur sélectionné
        if (newSelection.length === 0) {
          setIsPanelOpen(false)
        }
        return newSelection
      } else {
        // Sélectionner l'IRIS - vérifications uniquement lors de la sélection
        
        // Vérifier si la date limite est dépassée
        if (isDateLimiteDepassee) {
          alert(`Les inscriptions pour cette tournée sont fermées.\n\nLa date limite d'inscription (15 jours avant le début de la tournée) est dépassée.`)
          return prev // Retourner la sélection précédente sans modification
        }
        
        // Vérifier le maximum de 5 participants (sauf pour les communes non irisées)
        if (!isCommuneNonIrisee) {
          const currentCount = irisCounts.get(irisCode) || 0
          if (currentCount >= 5) {
            alert(`Ce secteur a déjà atteint le maximum de 5 participants. Vous ne pouvez plus le sélectionner.`)
            return prev // Retourner la sélection précédente sans modification
          }
        }
        
        // Calculer les logements
        let logements = 0
        if (isCommuneNonIrisee) {
          // Pour une commune non irisée, utiliser le total de logements de la commune
          if (ville && ville.logements) {
            logements = parseFloat(ville.logements.replace(/\s/g, '').replace(',', '.')) || 0
          }
        } else {
          // Pour un IRIS normal, calculer avec calculateIrisLogements
          console.log(`🔍 Calcul des logements pour IRIS:`, {
            irisName,
            normalizedCode,
            propertiesKeys: properties ? Object.keys(properties) : [],
            propertiesCode: properties?.code,
            propertiesCodeIris: properties?.code_iris,
            mapSize: irisLogementsMap.size,
            mapHasCode: irisLogementsMap.has(normalizedCode),
            mapHasCodeLower: irisLogementsMap.has(normalizedCode.toLowerCase()),
            mapHasCodeTrim: irisLogementsMap.has(normalizedCode.trim()),
            sampleMapKeys: Array.from(irisLogementsMap.keys()).filter(k => !k.startsWith('_original_')).slice(0, 10)
          })
          
          logements = calculateIrisLogements(irisName, normalizedCode, properties)
          console.log(`📊 Sélection IRIS: ${irisName} (code: ${normalizedCode}), logements calculés: ${logements}`)
          
          if (logements === 0) {
            console.warn(`⚠️ Aucun logement trouvé pour IRIS ${irisName} (code: ${normalizedCode})`)
            console.log(`   Tentative de recherche dans la map avec différentes variantes...`)
            
            // Essayer différentes variantes du code
            const codeVariants = [
              normalizedCode,
              normalizedCode.toLowerCase(),
              normalizedCode.trim(),
              normalizedCode.replace(/\s/g, ''),
              String(normalizedCode).padStart(9, '0'),
              String(normalizedCode).padStart(5, '0'),
            ]
            
            // Essayer aussi avec le nom normalisé
            const nameVariants = [
              normalizeName(irisName),
              irisName.toLowerCase().trim(),
              normalizeName(irisName).replace(/\s/g, ''),
              irisName.toLowerCase().replace(/\s/g, ''),
            ]
            
            // Combiner toutes les variantes
            const allVariants = [...codeVariants, ...nameVariants]
            
            for (const variant of allVariants) {
              const found = irisLogementsMap.get(variant)
              if (found && found > 0) {
                console.log(`   ✅ Trouvé avec variante "${variant}": ${found} logements`)
                logements = found
                break
              }
            }
            
            // Si toujours pas trouvé, chercher par sous-chaîne dans toutes les clés
            if (logements === 0) {
              console.log(`   Recherche par sous-chaîne dans toutes les clés...`)
              const searchTerms = [
                normalizedCode.substring(0, 6), // Premiers 6 chiffres du code
                normalizedCode.substring(5), // Derniers chiffres du code
                irisName.toLowerCase().substring(0, Math.min(irisName.length, 15)), // Premiers caractères du nom
              ]
              
              for (const [key, value] of Array.from(irisLogementsMap.entries())) {
                if (key.startsWith('_original_')) continue
                const keyLower = key.toLowerCase()
                for (const term of searchTerms) {
                  if (keyLower.includes(term.toLowerCase()) || term.toLowerCase().includes(keyLower)) {
                    if (value > 0) {
                      console.log(`   ✅ Trouvé par sous-chaîne "${term}" dans clé "${key}": ${value} logements`)
                      logements = value
                      break
                    }
                  }
                }
                if (logements > 0) break
              }
            }
          }
        }
        
        // Ouvrir le panel seulement si c'est le premier IRIS sélectionné (prev.length === 0)
        const isFirstSelection = prev.length === 0
        if (isFirstSelection) {
          setIsPanelOpen(true)
          setHasOpenedPanelOnce(true)
        } else {
          // Pour les sélections suivantes, animer le badge mais ne pas ouvrir le panel
          setBadgeAnimation(true)
          setTimeout(() => {
            setBadgeAnimation(false)
          }, 600)
        }
        
        return [...prev, { code: normalizedCode, name: irisName, logements }]
      }
    })
  }
  
  const handleIrisBubbleClick = (irisCode: string) => {
    setSelectedIrisForDetails(irisCode)
  }

  // Calculer la somme totale des logements des IRIS sélectionnés
  const totalLogements = useMemo(() => {
    return selectedIris.reduce((sum, iris) => sum + (iris.logements || 0), 0)
  }, [selectedIris])

  // Calculer le coût de la distribution (total logements arrondi × 0,1)
  const coutDistribution = useMemo(() => {
    return Math.round(totalLogements) * 0.1
  }, [totalLogements])

  const togglePanelButton = () => {
    if (isPanelOpen) {
      // Fermeture
      setButtonAnimation('closing')
      setTimeout(() => {
        setIsPanelOpen(false)
        setButtonAnimation('idle')
      }, 300)
      } else {
      // Ouverture
      setButtonAnimation('opening')
      setIsPanelOpen(true)
      setHasOpenedPanelOnce(true) // Marquer que le panel a été ouvert
      setTimeout(() => {
        setButtonAnimation('idle')
      }, 300)
    }
  }

  const handleSubmitClick = () => {
    if (selectedIris.length === 0) {
      alert('Veuillez sélectionner au moins un secteur IRIS')
      return
    }

    // Vérifier si la date limite est dépassée
    if (isDateLimiteDepassee) {
      alert(`Les inscriptions pour cette tournée sont fermées.\n\nLa date limite d'inscription (15 jours avant le début de la tournée) est dépassée.`)
      return
    }

    // Vérifier que les secteurs sélectionnés ne sont pas complets
    for (const iris of selectedIris) {
      const currentCount = irisCounts.get(iris.code) || 0
      if (currentCount >= 5) {
        alert(`Le secteur "${iris.name}" a déjà atteint le maximum de 5 participants. Vous ne pouvez plus le sélectionner.`)
        return
      }
    }

    // Vérifier le minimum de 5000 logements
    const minLogements = 5000
    if (totalLogements < minLogements) {
      const manquant = minLogements - Math.round(totalLogements)
      alert(
        `Minimum requis non atteint.\n\n` +
        `Vous avez sélectionné ${Math.round(totalLogements).toLocaleString('fr-FR')} logements.\n` +
        `Le minimum requis est de ${minLogements.toLocaleString('fr-FR')} logements.\n\n` +
        `Il vous manque ${manquant.toLocaleString('fr-FR')} logements pour continuer.\n\n` +
        `Veuillez sélectionner d'autres secteurs IRIS pour atteindre ce minimum.`
      )
      return
    }

    // Vérifier si Supabase est configuré
    if (!isSupabaseConfigured()) {
      alert(
        'Supabase n\'est pas configuré.\n\n' +
        'Le fichier .env.local existe mais est vide ou les variables ne sont pas définies.\n\n' +
        'Pour corriger cela :\n' +
        '1. Ouvrez le fichier .env.local à la racine du projet\n' +
        '2. Ajoutez les lignes suivantes avec vos vraies valeurs :\n\n' +
        'NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co\n' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon\n\n' +
        '3. Redémarrez le serveur de développement (npm run dev)\n\n' +
        'Vous pouvez trouver ces valeurs dans Supabase : Settings > API'
      )
      return
    }

    if (!ville || !tournee) {
      alert('Erreur : ville ou tournée non trouvée')
      return
    }

    // Stocker les données dans localStorage (plus persistant que sessionStorage) et rediriger vers la page de confirmation
    if (typeof window !== 'undefined') {
      const selectionData = {
        villeName: ville.name,
        tourneeIndex: tourneeIndex,
        tourneeDateDebut: tournee.dateDebut,
        tourneeDateFin: tournee.dateFin,
        selectedIris: selectedIris,
        totalLogements: totalLogements,
        coutDistribution: coutDistribution
      }
      
      localStorage.setItem('pendingSelection', JSON.stringify(selectionData))
      
      // Rediriger vers la page de confirmation
      router.push(`/tournees/${encodeURIComponent(ville.name.toLowerCase())}/${tourneeIndex}/secteurs/confirmation`)
    }
  }

  return (
    <>
    <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-lg) 0 var(--spacing-4xl) 0', background: 'var(--gradient-dark)', position: 'relative' }}>

      {/* Lien retour en haut - centré */}
      {ville && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--spacing-lg)',
          paddingTop: '0'
        }}>
          <button
            onClick={() => {
              router.push(`/tournees/${encodeURIComponent(ville.name.toLowerCase())}`)
            }}
            className="back-link" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            <span className="back-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </span>
            Retour aux tournées
          </button>
        </div>
      )}
      
      <div className="container iris-selection-page-container">
        <div className="section-header">
          <h1 className="section-title">Sélection des secteurs IRIS - {ville.name}</h1>
          <p className="section-subtitle">
            Tournée du {tournee.dateDebut} au {tournee.dateFin}
          </p>
          
          {/* Grille à 2 colonnes : Astuce + Partage */}
          <div className="iris-header-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 30%',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            {/* Colonne 1 : Astuce */}
            <div className="iris-comment-proceder" style={{
              padding: 'var(--spacing-md)',
              background: '#222e4c',
              border: '1px solid #323b51',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
              margin: 0
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 0 var(--spacing-sm) 0',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--orange-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Comment procéder
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                margin: 0,
                color: 'var(--text-primary)'
              }}>
                Pour valider votre participation, vous devez sélectionner au minimum <strong>5 000 logements</strong> sur la carte. Cliquez sur les secteurs IRIS en bleu pour les ajouter à votre sélection. Le nombre total de logements sélectionnés s'affiche en temps réel dans la barre de progression ci-dessous.
              </p>
            </div>
            
            {/* Colonne 2 : Partage */}
            <div className="iris-share-section" style={{
              background: '#222e4c',
              border: '1px solid #323b51',
              borderRadius: '8px',
              padding: 'var(--spacing-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-sm)',
              width: '100%',
              minWidth: '300px'
            }}>
              <p style={{
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-primary)',
                margin: '0 0 var(--spacing-xs) 0',
                textAlign: 'center',
                fontWeight: 500
              }}>
                Partagez cette tournée avec d'autres entreprises qui souhaiteraient y participer
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 'var(--spacing-sm)',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                flexWrap: 'wrap'
              }}>
                {/* Icône WhatsApp */}
                <button
                  onClick={() => {
                    const tourneeUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/tournees/${encodeURIComponent(ville.name.toLowerCase())}/${tourneeIndex}`
                      : ''
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Découvrez cette tournée de distribution : ${tourneeUrl}`)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: '#25D366',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#20BA5A'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#25D366'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Partager sur WhatsApp"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>

                {/* Icône Copier */}
                <button
                  onClick={async (e) => {
                    const tourneeUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/tournees/${encodeURIComponent(ville.name.toLowerCase())}/${tourneeIndex}`
                      : ''
                    
                    const button = e.currentTarget as HTMLButtonElement
                    const originalBackground = button.style.background
                    
                    try {
                      await navigator.clipboard.writeText(tourneeUrl)
                      // Afficher le toast
                      setShowCopyToast(true)
                      button.style.background = '#4CAF50'
                      setTimeout(() => {
                        button.style.background = originalBackground || '#6366F1'
                        setShowCopyToast(false)
                      }, 3000)
                    } catch (err) {
                      // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
                      const textArea = document.createElement('textarea')
                      textArea.value = tourneeUrl
                      textArea.style.position = 'fixed'
                      textArea.style.left = '-999999px'
                      document.body.appendChild(textArea)
                      textArea.focus()
                      textArea.select()
                      try {
                        document.execCommand('copy')
                        setShowCopyToast(true)
                        button.style.background = '#4CAF50'
                        setTimeout(() => {
                          button.style.background = originalBackground || '#6366F1'
                          setShowCopyToast(false)
                        }, 3000)
                      } catch (err) {
                        console.error('Erreur lors de la copie:', err)
                      }
                      document.body.removeChild(textArea)
                    }
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: '#6366F1',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget.style.background !== '#4CAF50') {
                      e.currentTarget.style.background = '#4F46E5'
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (e.currentTarget.style.background !== '#4CAF50') {
                      e.currentTarget.style.background = '#6366F1'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                  title="Copier le lien"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Toast de confirmation de copie */}
          {showCopyToast && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#4CAF50',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              animation: 'slideInDown 0.3s ease-out'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Lien copié dans le presse-papier !
            </div>
          )}
          
          {isDateLimiteDepassee && (
            <div style={{
              background: '#f44336',
              color: 'white',
              padding: 'var(--spacing-md)',
              borderRadius: '8px',
              marginTop: 'var(--spacing-md)',
              textAlign: 'center',
              fontWeight: 600
            }}>
              ⚠️ Les inscriptions pour cette tournée sont fermées. La date limite d'inscription (15 jours avant le début) est dépassée.
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Chargement de la carte et des secteurs IRIS...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            background: 'rgba(244, 67, 54, 0.1)', 
            border: '1px solid #F44336', 
            borderRadius: '8px', 
            padding: 'var(--spacing-lg)', 
            marginBottom: 'var(--spacing-lg)',
            color: '#F44336'
          }}>
            <p><strong>Erreur :</strong> {error}</p>
            <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '14px' }}>
              La commune "{ville.name}" n'a pas pu être trouvée dans la base de données des communes françaises.
              Veuillez vérifier le nom de la commune ou contacter le support.
            </p>
          </div>
        )}

        {!loading && !error && commune && (
          <>
            {/* LAYOUT PRINCIPAL - 2 colonnes */}
            <div className="iris-selection-layout iris-mobile-layout" style={{ 
              display: 'flex',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
              alignItems: 'flex-start'
            }}>
              {/* COLONNE GAUCHE - Carte interactive */}
              <div className="iris-left-column" style={{ flex: '1 1 70%', minWidth: 0 }}>
                {/* Texte d'avertissement */}
                <div style={{
                  marginTop: '20px',
                  marginBottom: '20px',
                  padding: '12px 16px',
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  borderRadius: '8px'
                }}>
                  <p style={{
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: '#FED7AA',
                    margin: 0
                  }}>
                    <strong style={{ fontWeight: 600 }}>ATTENTION :</strong> La distribution est validée uniquement à partir de <strong style={{ fontWeight: 600, color: '#F97316' }}>3 flyers minimum</strong> sur l'ensemble des secteurs IRIS choisis, pour une quantité minimale de <strong style={{ fontWeight: 600, color: '#F97316' }}>5 000 logements</strong>.
                    <br />
                    Dans le cas contraire, la mission sera annulée automatiquement.
                  </p>
                </div>
                
                {/* Section Comment procéder - Mobile uniquement (dupliquée depuis le haut) */}
                <div 
                  className="iris-comment-proceder-mobile"
                  style={{
                    padding: 'var(--spacing-md)',
                    background: '#222e4c',
                    border: '1px solid #323b51',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    marginBottom: '16px',
                    display: 'none' // Masqué par défaut, affiché sur mobile via CSS
                  }}
                >
                  <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    margin: '0 0 var(--spacing-sm) 0',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--orange-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Comment procéder
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    margin: 0,
                    color: 'var(--text-primary)'
                  }}>
                    Pour valider votre participation, vous devez sélectionner au minimum <strong>5 000 logements</strong> sur la carte. Cliquez sur les secteurs IRIS en bleu pour les ajouter à votre sélection. Le nombre total de logements sélectionnés s'affiche en temps réel dans la barre de progression ci-dessous.
                  </p>
                </div>
                
                {/* Section barre de progression au-dessus de la carte - Mobile uniquement */}
                <div 
                  className="progress-section-mobile"
                  style={{
                    background: 'rgba(26, 30, 46, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    marginBottom: '16px',
                    display: 'none', // Masqué par défaut, affiché sur mobile via CSS
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {/* Partie gauche - Progression */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: 0
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap'
                      }}>
                        Min: 5 000
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: totalLogements >= 5000 ? '#4CAF50' : 'var(--orange-primary)',
                        marginLeft: 'auto'
                      }}>
                        {Math.round(totalLogements).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    {/* Barre de progression */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${Math.min((totalLogements / 5000) * 100, 100)}%`,
                        height: '100%',
                        background: totalLogements >= 5000 
                          ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                          : 'linear-gradient(90deg, #fb6d25 0%, #ff8c42 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease, background 0.3s ease',
                        boxShadow: totalLogements >= 5000 
                          ? '0 2px 8px rgba(76, 175, 80, 0.3)'
                          : '0 2px 8px rgba(251, 109, 37, 0.3)'
                      }} />
                    </div>
                  </div>

                  {/* Partie droite - Bouton Continuer / Voir la sélection */}
                  <button
                    onClick={() => {
                      if (isDateLimiteDepassee) return
                      if (totalLogements >= 5000) {
                        handleSubmitClick()
                      } else {
                        togglePanelButton()
                      }
                    }}
                    disabled={isDateLimiteDepassee}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: isDateLimiteDepassee
                        ? 'rgba(251, 109, 37, 0.5)'
                        : 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                      border: 'none',
                      color: 'white',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isDateLimiteDepassee ? 'not-allowed' : 'pointer',
                      boxShadow: isDateLimiteDepassee
                        ? 'none'
                        : '0 4px 12px rgba(251, 109, 37, 0.4)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      opacity: isDateLimiteDepassee ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isDateLimiteDepassee) {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 109, 37, 0.6)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDateLimiteDepassee) {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                      }
                    }}
                  >
                    {isDateLimiteDepassee 
                      ? 'Inscriptions fermées' 
                      : totalLogements >= 5000 
                        ? 'Continuer' 
                        : 'Voir la sélection'}
                  </button>
                </div>
                
              {/* Recherche d'adresse (au-dessus de la carte) */}
              <div
                className="address-search-wrapper"
                style={{
                  margin: '12px auto 16px',
                  width: '100%',
                  maxWidth: '720px',
                  position: 'relative',
                  zIndex: 1001,
                }}
              >
                <div
                  style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    background: isSearchHovered || isSearchFocused
                      ? 'linear-gradient(180deg, #242a3a 0%, #1b2030 100%)'
                      : 'linear-gradient(180deg, #1f2433 0%, #181c28 100%)',
                    borderRadius: '16px',
                    border: isSearchFocused
                      ? '1px solid rgba(251,109,37,0.35)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isSearchFocused
                      ? '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 3px rgba(251,109,37,0.08)'
                      : '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(6px)',
                  }}
                  onMouseEnter={() => setIsSearchHovered(true)}
                  onMouseLeave={() => setIsSearchHovered(false)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>

                    <input
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value)
                        setAddressOpen(true)
                      }}
                      onFocus={() => {
                        setAddressOpen(true)
                        setIsSearchFocused(true)
                      }}
                      onBlur={() => {
                        // laisser le temps au clic sur une suggestion
                        setIsSearchFocused(false)
                        window.setTimeout(() => setAddressOpen(false), 150)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (addressSuggestions.length > 0) {
                            selectAddressSuggestion(addressSuggestions[0])
                          }
                        }
                        if (e.key === 'Escape') {
                          setAddressOpen(false)
                        }
                      }}
                      placeholder="Rechercher une adresse…"
                      style={{
                        flex: 1,
                        width: '100%',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: '#f1f3f9',
                        fontSize: '15px',
                        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
                        outline: 'none',
                      }}
                      className="address-search-input"
                    />

                    {addressQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressQuery('')
                          setAddressSuggestions([])
                          setAddressError(null)
                          setSearchLocation(null)
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.14)',
                          background: 'transparent',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.9,
                        }}
                        title="Effacer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                    {(addressLoading || addressError || (addressOpen && addressSuggestions.length > 0)) && (
                    <div style={{ marginTop: '12px' }}>
                      {addressLoading && (
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                          Recherche…
                        </div>
                      )}

                      {addressError && (
                        <div style={{ color: '#ffb4a9', fontSize: '13px' }}>
                          {addressError}
                        </div>
                      )}

                      {addressOpen && addressSuggestions.length > 0 && (
                        <div
                          className="address-suggestions-panel"
                          style={{
                            marginTop: addressLoading || addressError ? '10px' : 0,
                            background: '#141926',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 2000,
                          }}
                        >
                          {addressSuggestions.map((s) => (
                            <button
                              key={`${s.label}-${s.lat}-${s.lng}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectAddressSuggestion(s)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                color: '#f1f3f9',
                                cursor: 'pointer',
                                fontSize: '14px',
                                lineHeight: 1.3,
                                fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {searchLocation && (
                    <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                      Repère placé sur la carte.
                    </div>
                  )}
                </div>
              </div>

              <div className="iris-map-container" style={{ 
                background: 'var(--bg-accent)', 
                borderRadius: '16px', 
                overflow: 'hidden',
                border: '2px solid #353550',
                  minHeight: '500px',
                  position: 'relative'
                }}>
                {console.log('🗺️ AVANT MapComponent - État:', { 
                  hasCommune: !!commune, 
                  hasIris: !!iris, 
                  irisType: iris?.type,
                  irisFeaturesCount: iris?.features?.length || 0,
                  selectedIrisCount: selectedIris.length,
                  loading,
                  error
                })}
                {commune ? (
                  <MapComponent 
                    commune={commune} 
                    iris={iris} 
                    selectedIris={selectedIris.map(i => i.code)}
                    onIrisClick={handleIrisSelect}
                    irisCounts={irisCounts}
                    irisParticipants={irisParticipants}
                    onIrisBubbleClick={handleIrisBubbleClick}
                    communeLogements={ville ? parseFloat(ville.logements.replace(/\s/g, '').replace(',', '.')) : undefined}
                    searchLocation={searchLocation}
                  />
                ) : (
                  <div style={{
                    height: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', marginBottom: '10px' }}>Chargement de la commune...</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Veuillez patienter</p>
                    </div>
                  </div>
                )}
                  {iris && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'white',
                      zIndex: 1000
                    }}>
                      IRIS chargés: {Array.isArray(iris) ? iris.length : (iris as any)?.features?.length || 0}
                    </div>
                  )}
                  <div 
                    className="source-logements-text"
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                      zIndex: 1000,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Source des logements : INSEE 2021
                  </div>
                  
                  {/* Overlay avec barre de progression et bouton Continuer - Desktop uniquement */}
                  {!isMobile && (
                  <div 
                    className="progress-overlay-desktop"
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      width: irisParticipants.size > 0 ? '50%' : '40%',
                      background: 'rgba(26, 30, 46, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      zIndex: 999,
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    {/* Partie gauche - Progression */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minWidth: 0
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap'
                        }}>
                          Min: 5 000
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: totalLogements >= 5000 ? '#4CAF50' : 'var(--orange-primary)',
                          marginLeft: 'auto'
                        }}>
                          {Math.round(totalLogements).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {/* Barre de progression */}
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${Math.min((totalLogements / 5000) * 100, 100)}%`,
                          height: '100%',
                          background: totalLogements >= 5000 
                            ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(90deg, #fb6d25 0%, #ff8c42 100%)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease, background 0.3s ease',
                          boxShadow: totalLogements >= 5000 
                            ? '0 2px 8px rgba(76, 175, 80, 0.3)'
                            : '0 2px 8px rgba(251, 109, 37, 0.3)'
                        }} />
                      </div>
                    </div>

                    {/* Partie droite - Bouton Continuer / Voir la sélection */}
                    <button
                      onClick={() => {
                        if (isDateLimiteDepassee) return
                        if (totalLogements >= 5000) {
                          handleSubmitClick()
                        } else {
                          togglePanelButton()
                        }
                      }}
                      disabled={isDateLimiteDepassee}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '12px',
                        background: isDateLimiteDepassee
                          ? 'rgba(251, 109, 37, 0.5)'
                          : 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                        border: 'none',
                        color: 'white',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: isDateLimiteDepassee ? 'not-allowed' : 'pointer',
                        boxShadow: isDateLimiteDepassee
                          ? 'none'
                          : '0 4px 12px rgba(251, 109, 37, 0.4)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        opacity: isDateLimiteDepassee ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isDateLimiteDepassee) {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 109, 37, 0.6)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDateLimiteDepassee) {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                        }
                      }}
                    >
                      {isDateLimiteDepassee 
                        ? 'Inscriptions fermées' 
                        : totalLogements >= 5000 
                          ? 'Continuer' 
                          : 'Voir la sélection'}
                    </button>
                  </div>
                  )}
                </div>

                {/* SECTION TRACÉ GPS */}
                <div className="iris-trace-section" style={{
                  marginTop: 'var(--spacing-lg)',
                  marginBottom: 'var(--spacing-md)',
                  width: '100%'
                }}>
                  <div className="iris-trace-block" style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '20px',
                    background: 'var(--bg-accent)',
                    borderRadius: '12px',
                    paddingTop: 'var(--spacing-md)',
                    paddingBottom: 'var(--spacing-md)',
                    paddingRight: 'var(--spacing-md)',
                    paddingLeft: '15px',
                    border: '2px solid #323b51',
                    width: '100%'
                  }}>
                    {/* Image */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: 0,
                      margin: 0,
                      overflow: 'hidden',
                      width: 'fit-content'
                    }}>
                      <img 
                        src="/trace.webp" 
                        alt="Suivi GPS de la distribution" 
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          height: 'auto',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          margin: 0,
                          padding: 0,
                          display: 'block'
                        }}
                      />
                    </div>
                    {/* Texte */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 'var(--spacing-xs)',
                      paddingLeft: 0,
                      paddingRight: 0,
                      marginLeft: 0,
                      minWidth: 0
                    }}>
                      <p style={{
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: 'var(--text-primary)',
                        margin: 0,
                        fontWeight: 500
                      }}>
                        Pour garantir un maximum de transparence, nous avons développé une application de traçage GPS qui vous permet de suivre en direct l'avancement de votre distribution.
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        Vous pouvez ainsi visualiser la zone distribuée, zoomer sur la carte, repérer les logements à l'aide d'un repère, voir avec la vue satellite / street view et consulter les quantités globales de boîtes aux lettres à couvrir. Cet outil a été conçu pour répondre à un véritable besoin de contrôle et de transparence des opérations de distribution.
                      </p>
                      <a
                        href="https://app-distribal.web.app?projectId=qIAfclJCw3Hs8Ttkf41L"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(251, 109, 37, 0.3)',
                          marginTop: 'var(--spacing-xs)',
                          alignSelf: 'flex-start'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 109, 37, 0.3)'
                        }}
                      >
                        Voir le tracé GPS →
                      </a>
                    </div>
                  </div>
                </div>


              </div>

              {/* COLONNE DROITE - Bloc des participants */}
              {irisParticipants.size > 0 && (
                <div className="iris-participants-block" style={{ 
                  flex: '0 0 30%', 
                  minWidth: '300px',
                  position: 'sticky',
                  top: '100px',
                  alignSelf: 'flex-start',
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    background: '#252e4a',
                    borderRadius: '16px',
                    padding: 'var(--spacing-lg)',
                    border: '2px solid #323b51',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Participants existants
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--spacing-md)'
                    }}>
                      {Array.from(irisParticipants.entries()).map(([irisCode, participants]) => {
                        const count = irisCounts.get(irisCode) || 0
                        if (count === 0) return null
                        
                        // Détecter si c'est une commune non irisée
                        const isCommuneNonIrisee = String(irisCode).startsWith('COMMUNE_NON_IRISEE_')
                        let irisName = irisCode
                        
                        if (isCommuneNonIrisee) {
                          // Extraire le nom de la commune en enlevant le préfixe
                          irisName = String(irisCode).replace('COMMUNE_NON_IRISEE_', '')
                        } else {
                          // Trouver le nom de l'IRIS depuis les données chargées
                          if (iris && iris.features) {
                            const irisFeature = iris.features.find((f: any) => {
                              const code = f.properties?.code_iris || f.properties?.CODE_IRIS || f.properties?.iris_code
                              return code && normalizeName(String(code)) === normalizeName(irisCode)
                            })
                            if (irisFeature) {
                              irisName = irisFeature.properties?.nom_iris || irisFeature.properties?.NOM_IRIS || irisFeature.properties?.iris_name || irisCode
                            }
                          }
                          
                          // Si pas trouvé, chercher dans irisLogementsMap
                          if (irisName === irisCode) {
                            const foundKey = Array.from(irisLogementsMap.keys()).find(key => 
                              normalizeName(key) === normalizeName(irisCode) || 
                              key.includes(irisCode) || 
                              irisCode.includes(key)
                            )
                            if (foundKey) irisName = foundKey
                          }
                        }
                        
                        return (
                          <div
                            key={irisCode}
                            style={{
                              background: '#242940',
                              borderRadius: '12px',
                              padding: 'var(--spacing-md)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#2a3248'
                              e.currentTarget.style.borderColor = 'var(--orange-primary)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#242940'
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                            }}
                            onClick={() => setSelectedIrisForDetails(irisCode)}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-sm)',
                              marginBottom: 'var(--spacing-sm)'
                            }}>
                              {/* Bulle avec le nombre - même design que sur la carte */}
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #fb6d25 0%, #ff8c42 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                flexShrink: 0,
                                border: '2px solid white',
                                boxShadow: '0 4px 12px rgba(251, 109, 37, 0.4)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                              }}>
                                {count}
                              </div>
                              
                              <div style={{
                                flex: 1,
                                minWidth: 0
                              }}>
                                <h4 style={{
                                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  margin: 0,
                                  marginBottom: '4px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {irisName}
                                </h4>
                                <p style={{
                                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                  fontSize: '13px',
                                  color: 'var(--text-secondary)',
                                  margin: 0,
                                  lineHeight: '1.4'
                                }}>
                                  {count} entreprise{count > 1 ? 's ont' : ' a'} lancé{count > 1 ? '' : 'e'} une tournée sur le secteur
                                </p>
                              </div>
                            </div>
                            
                            <div style={{
                              marginTop: 'var(--spacing-xs)',
                              paddingTop: 'var(--spacing-xs)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: '12px',
                              color: 'var(--text-tertiary)',
                              textAlign: 'center',
                              fontStyle: 'italic'
                            }}>
                              Cliquer pour voir tous les détails
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL ANIMÉ - Slide depuis la droite */}
            {isPanelOpen && (
              <>
                {/* Overlay */}
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                  onClick={() => setIsPanelOpen(false)}
                />
                
                {/* Panel */}
                    <div style={{ 
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '420px',
                  maxWidth: '90vw',
                  background: '#222e4c',
                  borderLeft: '2px solid #353550',
                  borderTopLeftRadius: '16px',
                  borderBottomLeftRadius: '16px',
                  boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 10000,
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'slideInRight 0.3s ease-out',
                  overflow: 'hidden',
                  marginTop: 'var(--spacing-md)'
                }}>
                  {/* Header du panel */}
                  <div style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderBottom: '2px solid #353550',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    background: '#222e4c'
                    }}>
                    <h3 style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      Votre sélection
                </h3>
                    <button
                      onClick={() => setIsPanelOpen(false)}
                      style={{
                        background: 'linear-gradient(135deg, #fb6d25 0%, #ff8c42 50%, #ffa366 100%)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '20px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(251, 109, 37, 0.4)',
                        fontWeight: 700
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(251, 109, 37, 0.6)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Contenu scrollable */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-lg)'
                  }}>
                    {/* Métriques */}
                  <div style={{ 
                    background: '#18253f',
                    padding: 'var(--spacing-md)',
                    borderRadius: '8px',
                      border: totalLogements >= 5000 ? '2px solid #4CAF50' : '2px solid var(--orange-primary)',
                      marginBottom: 'var(--spacing-lg)'
                  }}>
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--spacing-md)'
                      }}>
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                            fontSize: '12px',
                        color: 'var(--text-secondary)',
                            marginBottom: '4px'
                          }}>
                            Secteurs
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontSize: '24px',
                        fontWeight: 700,
                            color: 'var(--text-primary)'
                      }}>
                            {selectedIris.length}
                    </div>
                  </div>
                        <div>
                  <div style={{ 
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                          }}>
                            Logements
                  </div>
                          <div style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontSize: '24px',
                            fontWeight: 700,
                            color: totalLogements >= 5000 ? '#4CAF50' : 'var(--orange-primary)'
                      }}>
                        {Math.round(totalLogements).toLocaleString('fr-FR')}
                    </div>
                        </div>
                      </div>
                      {totalLogements < 5000 && (
                    <div style={{ 
                          marginTop: 'var(--spacing-sm)',
                      paddingTop: 'var(--spacing-sm)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          textAlign: 'center'
                    }}>
                      <span style={{ 
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                            fontSize: '13px',
                            color: 'var(--text-secondary)'
                          }}>
                            Minimum requis : 5 000 logements
                      </span>
                  </div>
                )}
                    </div>

                    {/* Liste des secteurs sélectionnés */}
                    {selectedIris.length > 0 && (
                      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h4 style={{
                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: '0 0 var(--spacing-md) 0'
                        }}>
                          Secteurs sélectionnés
                        </h4>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                          gap: 'var(--spacing-sm)'
                  }}>
                    {selectedIris.map((iris) => (
                      <div 
                        key={iris.code}
                        style={{ 
                                background: '#1b253d',
                          padding: 'var(--spacing-sm) var(--spacing-md)', 
                          borderRadius: '8px',
                                border: '1px solid #4A5568',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--orange-primary)'
                                e.currentTarget.style.background = 'rgba(251, 109, 37, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#4A5568'
                                e.currentTarget.style.background = '#1b253d'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                                <div style={{
                                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                                  color: 'var(--text-primary)',
                                  marginBottom: '2px'
                          }}>
                            {iris.name || iris.code}
                                </div>
                          {iris.logements !== undefined && iris.logements > 0 && (
                                  <div style={{
                                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                              fontSize: '12px',
                                    color: 'var(--text-tertiary)'
                            }}>
                              {Math.round(iris.logements).toLocaleString('fr-FR')} logements
                                  </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleIrisSelect(iris.code, iris.name)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                                  fontSize: '18px',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#F44336'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                        </div>
                  </div>
                )}
            </div>

                  {/* Footer avec boutons */}
            <div style={{ 
                    padding: 'var(--spacing-lg)',
                    borderTop: '2px solid #353550',
                    background: '#222e4c',
              display: 'flex', 
                    flexDirection: 'column',
                    gap: 'var(--spacing-sm)'
                  }}>
                    {(() => {
                      const minLogements = 5000
                      const manquant = Math.max(0, minLogements - Math.round(totalLogements))
                      const isComplete = totalLogements >= minLogements
                      
                      return (
                        <>
                          {!isComplete && (
                            <div style={{
                              background: '#222e4c',
                              padding: 'var(--spacing-sm)',
                              borderRadius: '6px',
                              textAlign: 'center'
                            }}>
                              <p style={{
                                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                margin: 0
                              }}>
                                Il vous manque encore {manquant.toLocaleString('fr-FR')} logements
                              </p>
                            </div>
                          )}
                          {isComplete && (
                            <div style={{
                              marginBottom: 'var(--spacing-xs)'
            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span style={{
                                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                  fontSize: '18px',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)'
                                }}>
                                  Coût de distribution
                                </span>
                                <span style={{
                                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                  fontSize: '32px',
                                  fontWeight: 700,
                                  color: 'var(--orange-primary)'
                                }}>
                                  {coutDistribution.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                </span>
                              </div>
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-sm)'
            }}>
              {(() => {
                // Vérifier si tous les IRIS disponibles sont sélectionnés
                const allIrisSelected = iris && iris.features && Array.isArray(iris.features) && iris.features.length > 0
                  ? iris.features.every((feature: any) => {
                      const irisCode = feature.properties?.code || feature.properties?.code_iris || feature.properties?.CODE_IRIS
                      return selectedIris.some(selected => String(selected.code).trim() === String(irisCode).trim())
                    })
                  : false
                
                // Masquer le bouton si tous les IRIS sont sélectionnés
                if (allIrisSelected) {
                  return null
                }
                
                return (
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Ajouter
                  </button>
                )
              })()}
              <button 
                              onClick={handleSubmitClick}
                className="btn btn-primary"
                              disabled={selectedIris.length === 0 || totalLogements < 5000 || isDateLimiteDepassee}
                style={{ 
                                flex: 1,
                                opacity: selectedIris.length === 0 || totalLogements < 5000 || isDateLimiteDepassee ? 0.5 : 1,
                                cursor: selectedIris.length === 0 || totalLogements < 5000 || isDateLimiteDepassee ? 'not-allowed' : 'pointer'
                }}
              >
                              {isDateLimiteDepassee
                                ? 'Inscriptions fermées'
                                : isComplete
                                ? 'Continuer'
                                : 'Continuer'}
              </button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
            </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal pour afficher les détails des participants d'un secteur */}
      {selectedIrisForDetails && irisCounts.get(selectedIrisForDetails) && irisCounts.get(selectedIrisForDetails)! > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--spacing-md)'
        }}
        onClick={() => setSelectedIrisForDetails(null)}
        >
          <div style={{
            background: '#222b44',
            borderRadius: '16px',
            padding: 'var(--spacing-xl)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIrisForDetails(null)}
              style={{
                position: 'absolute',
                top: 'var(--spacing-md)',
                right: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, #fb6d25 0%, #ff8c42 50%, #ffa366 100%)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(251, 109, 37, 0.4)',
                fontWeight: 700
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(251, 109, 37, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
              }}
            >
              ×
            </button>

            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '24px',
              fontWeight: 700,
              paddingRight: '40px'
            }}>
              Participants du secteur
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)'
            }}>
              {(irisParticipants.get(selectedIrisForDetails) || []).length > 0 ? (
                irisParticipants.get(selectedIrisForDetails)!.map((participant, index) => (
                <div
                  key={index}
                  style={{
                    background: '#1e2842',
                    borderRadius: '12px',
                    padding: 'var(--spacing-md)',
                    border: '1px solid #52607f'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--orange-primary)',
                    fontSize: '16px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ flexShrink: 0 }}
                    >
                      <path 
                        d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" 
                        fill="var(--orange-primary)"
                      />
                    </svg>
                    <span><strong style={{ fontWeight: 700 }}>Société :</strong> {participant.entreprise}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '15px'
                  }}>
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ flexShrink: 0 }}
                    >
                      <path 
                        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" 
                        fill="var(--text-primary)"
                      />
                    </svg>
                    <span><strong style={{ fontWeight: 700 }}>Titre du flyer :</strong> {participant.titre}</span>
                  </div>
                </div>
                ))
              ) : (
                <div style={{
                  background: '#1e2842',
                  borderRadius: '12px',
                  padding: 'var(--spacing-md)',
                  border: '1px solid #52607f',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  Aucun détail disponible pour ce secteur
                </div>
              )}
            </div>

            <div style={{
              marginTop: 'var(--spacing-lg)',
              paddingTop: 'var(--spacing-md)',
              borderTop: '1px solid #52607f',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {irisCounts.get(selectedIrisForDetails) || 0} participant{(irisCounts.get(selectedIrisForDetails) || 0) > 1 ? 's' : ''} sur 5 maximum
            </div>
          </div>
        </div>
      )}


      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        @keyframes badgeBounce {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1.2);
          }
        }

        .address-search-input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        @media (max-width: 768px) {
          .address-search-wrapper {
            z-index: 5;
          }

          .address-suggestions-panel {
            width: 100%;
            max-width: none;
            margin-left: 0;
            margin-right: 0;
            position: absolute;
            left: 0;
            right: 0;
            top: calc(100% + 8px);
            transform: none;
            z-index: 6;
          }
        }
      `}</style>
    </section>
    <FAQ />
    </>
  )
}



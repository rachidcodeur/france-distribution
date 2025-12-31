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
    
    // Ajouter la version avec seulement les mots significatifs (>= 3 caractères)
    const words = normalized.split(/\s+/).filter(w => w.length >= 3)
    if (words.length > 0) {
      keys.push(words.join(' '))
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
              
              // 6. Code IRIS si disponible
              if (codeIris) {
                map.set(codeIris.toString().toLowerCase().trim(), irisData.logements_iris)
                map.set(codeIris.toString().trim(), irisData.logements_iris)
              }
              
              // 7. Stocker le nom original comme référence (pour debug)
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
        function getParisArrondissementCodeInsee(name: string): string | null {
          const parisArrondissementMatch = name.match(/Paris\s+(\d+)(?:er|e|ème)?\s+Arrondissement/i)
          if (parisArrondissementMatch) {
            const arrondissementNum = parseInt(parisArrondissementMatch[1], 10)
            if (arrondissementNum >= 1 && arrondissementNum <= 20) {
              // Code INSEE: 75101 à 75120
              const codeInsee = `751${arrondissementNum.toString().padStart(2, '0')}`
              return codeInsee
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
          
          // Récupérer les informations de la commune avec le code INSEE
          const communeResponse = await fetch(
            `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?where=com_code%20%3D%20%22${codeInsee}%22&limit=1`
          )
          
          if (communeResponse.ok) {
            const communeData = await communeResponse.json()
            if (communeData.results && communeData.results.length > 0) {
              foundCommune = communeData.results[0]
              setCommune(foundCommune)
            }
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
              } else {
                console.warn('Aucun IRIS trouvé pour cette commune')
                // Si aucun résultat et que c'est un arrondissement de Paris, essayer les méthodes alternatives
                if (parisCodeInsee) {
                  console.log(`🔄 Aucun résultat avec com_code, tentative avec méthodes alternatives pour arrondissement de Paris...`)
                  // Essayer l'API interne d'abord
                  try {
                    const apiResponse = await fetch(`/api/iris?codeInsee=${codeInsee}`)
                    if (apiResponse.ok) {
                      const apiData = await apiResponse.json()
                      console.log(`✅ API interne: ${apiData.features?.length || 0} features trouvées`)
                      if (apiData.features && apiData.features.length > 0) {
                        setIris(apiData)
                        console.log(`✅ ${apiData.features.length} IRIS chargés via API interne`)
                        return
                      }
                    }
                  } catch (apiError: any) {
                    console.error('❌ Erreur API interne:', apiError.message)
                  }
                  
                  // Pour Paris, utiliser une recherche par nom de commune "Paris" et filtrer par arrondissement
                  console.log(`🔄 Recherche de tous les IRIS de Paris...`)
                  
                  // Charger les noms d'IRIS depuis le fichier local pour cet arrondissement
                  let localIrisNames: string[] = []
                  try {
                    const localDataResponse = await fetch('/api/iris-logements')
                    if (localDataResponse.ok) {
                      const localData = await localDataResponse.json()
                      const villeLower = villeName.toLowerCase()
                      const villeData = localData.find((item: any) => 
                        item.ville && item.ville.toLowerCase() === villeLower
                      )
                      if (villeData && villeData.iris) {
                        localIrisNames = villeData.iris
                          .filter((iris: any) => {
                            const nomIris = iris.nom_iris || ''
                            return !nomIris.toLowerCase().includes('commune non irisée') && 
                                   !nomIris.toLowerCase().includes('non irisée')
                          })
                          .map((iris: any) => iris.nom_iris?.toLowerCase() || '')
                        console.log(`📋 ${localIrisNames.length} noms d'IRIS trouvés dans le fichier local`)
                      }
                    }
                  } catch (localError: any) {
                    console.warn('⚠️ Impossible de charger les données locales:', localError.message)
                  }
                  
                  // Rechercher tous les IRIS de Paris avec plusieurs requêtes (pagination)
                  const allParisIris: any[] = []
                  let offset = 0
                  const limit = 100
                  let hasMore = true
                  
                  while (hasMore && offset < 1000) { // Limite de sécurité
                    try {
                      // Rechercher par nom de commune "Paris" (sans arrondissement)
                      const parisSearchUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_name%20like%20%22Paris%22&limit=${limit}&offset=${offset}`
                      console.log(`🔍 Requête Paris offset ${offset}...`)
                      
                      const parisResponse = await fetch(parisSearchUrl)
                      if (parisResponse.ok) {
                        const parisData = await parisResponse.json()
                        const results = parisData.results || []
                        
                        if (results.length === 0) {
                          hasMore = false
                        } else {
                          allParisIris.push(...results)
                          offset += limit
                          
                          // Si on a moins de résultats que la limite, on a atteint la fin
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
                  
                  console.log(`📊 Total IRIS de Paris récupérés: ${allParisIris.length}`)
                  
                  if (allParisIris.length > 0) {
                    // Filtrer les IRIS qui correspondent à l'arrondissement
                    const arrondissementNum = parseInt(parisCodeInsee.replace('751', ''), 10)
                    console.log(`🔍 Filtrage pour arrondissement ${arrondissementNum}...`)
                    
                    const filteredResults = allParisIris.filter((item: any) => {
                      const irisName = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                      const comCode = Array.isArray(item.com_code) ? item.com_code[0] : item.com_code
                      
                      // Vérifier si le code INSEE correspond à l'arrondissement
                      if (comCode === codeInsee) {
                        return true
                      }
                      
                      // Si on a des noms locaux, vérifier la correspondance
                      if (localIrisNames.length > 0 && irisName) {
                        const irisNameLower = irisName.toLowerCase()
                        if (localIrisNames.some(localName => 
                          irisNameLower.includes(localName) || 
                          localName.includes(irisNameLower.substring(0, 15))
                        )) {
                          return true
                        }
                      }
                      
                      return false
                    })
                    
                    console.log(`📊 ${filteredResults.length} IRIS filtrés pour l'arrondissement`)
                    
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
                            },
                          }
                        } catch (err: any) {
                          console.error(`❌ Item ${index}: erreur lors de la conversion:`, err.message)
                          return null
                        }
                      }).filter((f: any) => f !== null)
                      
                      console.log(`📊 ${features.length} features valides créées sur ${validIrisResults.length} IRIS filtrés`)
                      
                      if (features.length > 0) {
                        const irisFeatureCollection = {
                          type: 'FeatureCollection',
                          features: features,
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
                        
                        // Vérifier que toutes les features ont des géométries valides
                        const invalidFeatures = features.filter((f: any) => 
                          !f.geometry || !f.geometry.type || !f.geometry.coordinates
                        )
                        if (invalidFeatures.length > 0) {
                          console.warn(`⚠️ ${invalidFeatures.length} features avec géométries invalides`)
                        }
                        
                        setIris(irisFeatureCollection)
                        console.log(`✅ ${features.length} IRIS chargés pour l'arrondissement ${arrondissementNum} et assignés à setIris`)
                        console.log('📦 Structure complète passée à setIris:', JSON.stringify(irisFeatureCollection).substring(0, 500))
                        return
                      } else {
                        console.warn('⚠️ Aucune feature valide créée malgré le filtrage')
                      }
                    }
                  }
                  
                  // Fallback: Essayer avec le code INSEE de Paris (75056) mais avec une limite plus petite
                  console.log(`🔄 Tentative avec code INSEE de Paris (75056)...`)
                  const parisCodeUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_code%20%3D%20%2275056%22&limit=100`
                  console.log(`🔗 URL avec code Paris: ${parisCodeUrl}`)
                  
                  try {
                    const parisResponse = await fetch(parisCodeUrl)
                    if (parisResponse.ok) {
                      const parisData = await parisResponse.json()
                      console.log(`📊 IRIS de Paris (75056): ${parisData.results?.length || 0} résultats`)
                      
                      if (parisData.results && parisData.results.length > 0) {
                        // Filtrer les IRIS qui correspondent à l'arrondissement
                        // Les IRIS des arrondissements de Paris sont stockés avec com_code = 75056 (Paris)
                        // mais on peut les identifier par leur code IRIS qui commence souvent par le code de l'arrondissement
                        const arrondissementNum = parseInt(parisCodeInsee.replace('751', ''), 10)
                        console.log(`🔍 Filtrage des IRIS pour arrondissement ${arrondissementNum} (code INSEE: ${codeInsee})`)
                        
                        // Charger les noms d'IRIS depuis le fichier local pour cet arrondissement
                        let localIrisNames: string[] = []
                        try {
                          const localDataResponse = await fetch('/api/iris-logements')
                          if (localDataResponse.ok) {
                            const localData = await localDataResponse.json()
                            const villeLower = villeName.toLowerCase()
                            const villeData = localData.find((item: any) => 
                              item.ville && item.ville.toLowerCase() === villeLower
                            )
                            if (villeData && villeData.iris) {
                              localIrisNames = villeData.iris.map((iris: any) => 
                                iris.nom_iris ? iris.nom_iris.toLowerCase() : ''
                              )
                              console.log(`📋 ${localIrisNames.length} noms d'IRIS trouvés dans le fichier local`)
                            }
                          }
                        } catch (localError: any) {
                          console.warn('⚠️ Impossible de charger les données locales:', localError.message)
                        }
                        
                        const filteredResults = parisData.results.filter((item: any) => {
                          const irisCode = Array.isArray(item.iris_code) ? item.iris_code[0] : item.iris_code
                          const irisName = Array.isArray(item.iris_name) ? item.iris_name[0] : item.iris_name
                          const comCode = Array.isArray(item.com_code) ? item.com_code[0] : item.com_code
                          
                          // Si on a des noms locaux, utiliser la correspondance par nom
                          if (localIrisNames.length > 0 && irisName) {
                            const irisNameLower = irisName.toLowerCase()
                            if (localIrisNames.some(localName => irisNameLower.includes(localName) || localName.includes(irisNameLower))) {
                              return true
                            }
                          }
                          
                          // Vérifier si le code INSEE de l'IRIS correspond à l'arrondissement
                          if (comCode === codeInsee) {
                            return true
                          }
                          
                          // Vérifier si le code IRIS commence par le code de l'arrondissement
                          if (irisCode && irisCode.startsWith(codeInsee)) {
                            return true
                          }
                          
                          // Vérifier si le nom contient le numéro de l'arrondissement (format "10e", "10ème", etc.)
                          if (irisName) {
                            const irisNameLower = irisName.toLowerCase()
                            // Chercher des patterns comme "10e", "10ème", "Xe arrondissement"
                            const arrondPatterns = [
                              `${arrondissementNum}e`,
                              `${arrondissementNum}ème`,
                              `${arrondissementNum} arrondissement`,
                              `arrondissement ${arrondissementNum}`
                            ]
                            if (arrondPatterns.some(pattern => irisNameLower.includes(pattern))) {
                              return true
                            }
                          }
                          
                          return false
                        })
                        
                        console.log(`📊 IRIS filtrés pour arrondissement ${arrondissementNum}: ${filteredResults.length} résultats`)
                        
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
                          
                          if (features.length > 0) {
                            setIris({
                              type: 'FeatureCollection',
                              features: features,
                            })
                            console.log(`✅ ${features.length} IRIS chargés via code Paris (75056)`)
                            return
                          }
                        }
                      }
                    }
                  } catch (parisError: any) {
                    console.error('❌ Erreur avec code Paris:', parisError.message)
                  }
                  
                  // Essayer une recherche par nom
                  console.log(`🔄 Tentative alternative par nom pour arrondissement de Paris...`)
                  const alternativeUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_name%20like%20%22${encodeURIComponent(villeName)}%22&limit=100`
                  console.log(`🔗 URL alternative: ${alternativeUrl}`)
                  
                  try {
                    const altResponse = await fetch(alternativeUrl)
                    if (altResponse.ok) {
                      const altData = await altResponse.json()
                      console.log(`✅ Alternative: ${altData.results?.length || 0} résultats trouvés`)
                      if (altData.results && altData.results.length > 0) {
                        // Traiter les résultats de la même manière
                        const validIrisResults = altData.results.filter((item: any) => {
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
                        
                        if (features.length > 0) {
                          setIris({
                            type: 'FeatureCollection',
                            features: features,
                          })
                          console.log(`✅ ${features.length} IRIS chargés via méthode alternative`)
                          return
                        }
                      }
                    }
                  } catch (altError: any) {
                    console.error('❌ Erreur méthode alternative:', altError.message)
                  }
                }
                setIris(null)
              }
            } else {
              const errorText = await irisResponse.text()
              console.error(`❌ Erreur lors du chargement des IRIS - Status: ${irisResponse.status}`)
              console.error(`❌ Réponse: ${errorText.substring(0, 500)}`)
              
              // Pour les arrondissements de Paris, essayer l'API interne
              if (parisCodeInsee) {
                console.log(`🔄 Tentative avec API interne pour arrondissement de Paris...`)
                try {
                  const apiResponse = await fetch(`/api/iris?codeInsee=${codeInsee}`)
                  if (apiResponse.ok) {
                    const apiData = await apiResponse.json()
                    console.log(`✅ API interne: ${apiData.features?.length || 0} features trouvées`)
                    if (apiData.features && apiData.features.length > 0) {
                      setIris(apiData)
                      console.log(`✅ ${apiData.features.length} IRIS chargés via API interne`)
                      return
                    }
                  }
                } catch (apiError: any) {
                  console.error('❌ Erreur API interne:', apiError.message)
                }
                
                // Si l'API interne ne fonctionne pas, essayer une recherche par nom
                console.log(`🔄 Tentative alternative par nom pour arrondissement de Paris...`)
                const alternativeUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_name%20like%20%22${encodeURIComponent(villeName)}%22&limit=100`
                console.log(`🔗 URL alternative: ${alternativeUrl}`)
                
                try {
                  const altResponse = await fetch(alternativeUrl)
                  if (altResponse.ok) {
                    const altData = await altResponse.json()
                    console.log(`✅ Alternative: ${altData.results?.length || 0} résultats trouvés`)
                    if (altData.results && altData.results.length > 0) {
                      // Traiter les résultats de la même manière
                      const validIrisResults = altData.results.filter((item: any) => {
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
                      
                      if (features.length > 0) {
                        setIris({
                          type: 'FeatureCollection',
                          features: features,
                        })
                        console.log(`✅ ${features.length} IRIS chargés via méthode alternative`)
                        return
                      }
                    }
                  }
                } catch (altError: any) {
                  console.error('❌ Erreur méthode alternative:', altError.message)
                }
              }
              
              setIris(null)
            }
          } catch (irisError: any) {
            console.error('Erreur lors du chargement des IRIS:', irisError.message)
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

  const calculateIrisLogements = useCallback((irisName: string, irisCode?: string): number => {
    if (irisLogementsMap.size === 0) return 0
    
    const normalizedName = normalizeName(irisName)
    const lowerName = irisName.toLowerCase().trim()
    let logements = irisLogementsMap.get(normalizedName) || irisLogementsMap.get(lowerName) || 0
    
    // Essayer aussi avec le code IRIS si disponible
    if (logements === 0 && irisCode) {
      logements = irisLogementsMap.get(irisCode.toLowerCase().trim()) || irisLogementsMap.get(irisCode.trim()) || 0
    }
    
    // Si pas trouvé, essayer de chercher par fuzzy matching
    if (logements === 0 && irisLogementsMap.size > 0) {
      // Créer des clés de recherche pour l'IRIS sélectionné
      const searchKeys = createSearchKey(irisName)
      
      // Chercher dans toutes les clés de la map
      const mapEntries = Array.from(irisLogementsMap.entries())
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
            logements = value
            break
          }
          
          // Correspondance sans espaces
          if (keyNormalized.replace(/\s/g, '') === searchKeyNormalized.replace(/\s/g, '')) {
            logements = value
            break
          }
          
          // Correspondance par mots significatifs (>= 3 caractères)
          const keyWords = keyNormalized.split(/\s+/).filter(w => w.length >= 3)
          const searchWords = searchKeyNormalized.split(/\s+/).filter(w => w.length >= 3)
          
          if (keyWords.length > 0 && searchWords.length > 0) {
            // Vérifier si tous les mots significatifs correspondent
            const allWordsMatch = searchWords.every(sw => 
              keyWords.some(kw => kw === sw || kw.includes(sw) || sw.includes(kw))
            )
            
            if (allWordsMatch && keyWords.length === searchWords.length) {
              logements = value
              break
            }
          }
        }
        
        if (logements > 0) break
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
    
    return logements
  }, [irisLogementsMap, normalizeName, createSearchKey])

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
          const logements = calculateIrisLogements(iris.name, code)
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

  const handleIrisSelect = (irisCode: string, irisName: string) => {
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
          logements = calculateIrisLogements(irisName, normalizedCode)
          console.log(`📊 Sélection IRIS: ${irisName} (code: ${normalizedCode}), logements calculés: ${logements}`)
          console.log(`   Taille de irisLogementsMap: ${irisLogementsMap.size}`)
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 30%',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            {/* Colonne 1 : Astuce */}
            <div style={{
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
            <div style={{
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

                {/* Icône Email */}
                <button
                  onClick={() => {
                    const tourneeUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/tournees/${encodeURIComponent(ville.name.toLowerCase())}/${tourneeIndex}`
                      : ''
                    const subject = encodeURIComponent('Tournée de distribution mutualisée')
                    const body = encodeURIComponent(`Découvrez cette tournée de distribution : ${tourneeUrl}`)
                    window.location.href = `mailto:?subject=${subject}&body=${body}`
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: '#EA4335',
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
                    e.currentTarget.style.background = '#D33B2C'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#EA4335'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Partager par Email"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </button>

                {/* Icône Facebook */}
                <button
                  onClick={() => {
                    const tourneeUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/tournees/${encodeURIComponent(ville.name.toLowerCase())}/${tourneeIndex}`
                      : ''
                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tourneeUrl)}`
                    window.open(facebookUrl, '_blank')
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: '#1877F2',
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
                    e.currentTarget.style.background = '#166FE5'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1877F2'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Partager sur Facebook"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
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
            <div className="iris-selection-layout" style={{ 
              display: 'flex',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
              alignItems: 'flex-start'
            }}>
              {/* COLONNE GAUCHE - Carte interactive */}
              <div className="iris-left-column" style={{ flex: '1 1 70%', minWidth: 0 }}>
                {/* Section avec progression et bouton */}
                <div className="iris-progress-section" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '30px',
                  gap: 'var(--spacing-md)'
                }}>
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
                        Minimum : 5 000 logements
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

                  {/* Partie droite - Bouton */}
                  <button
                    onClick={togglePanelButton}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isPanelOpen 
                        ? 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)'
                        : 'linear-gradient(135deg, #fb6d25 0%, #e85a1a 100%)',
                      border: 'none',
                      color: 'white',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: isPanelOpen 
                        ? '0 8px 24px rgba(251, 109, 37, 0.5)'
                        : '0 4px 12px rgba(251, 109, 37, 0.4)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transform: buttonAnimation === 'opening' 
                        ? 'scale(1.05)'
                        : buttonAnimation === 'closing'
                        ? 'scale(0.95)'
                        : 'scale(1)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      width: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 109, 37, 0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = isPanelOpen 
                        ? '0 8px 24px rgba(251, 109, 37, 0.5)'
                        : '0 4px 12px rgba(251, 109, 37, 0.4)'
                    }}
                  >
                    {isPanelOpen ? (
                      <>
                        <svg 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
                        </svg>
                        Fermer la sélection
                      </>
                    ) : (
                      <>
                        <svg 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Continuer
                        {selectedIris.length > 0 && (
                          <span
                            style={{
                              background: 'white',
                              color: 'black',
                              borderRadius: '12px',
                              padding: '2px 8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              marginLeft: '4px',
                              transition: 'all 0.3s ease',
                              animation: badgeAnimation ? 'badgeBounce 0.6s ease' : 'none',
                              display: 'inline-block'
                            }}
                          >
                            {selectedIris.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              <div className="iris-map-container" style={{ 
                background: 'var(--bg-accent)', 
                borderRadius: '16px', 
                overflow: 'hidden',
                border: '2px solid #353550',
                  minHeight: '500px',
                  position: 'relative'
                }}>
                <MapComponent 
                  commune={commune} 
                  iris={iris} 
                  selectedIris={selectedIris.map(i => i.code)}
                  onIrisClick={handleIrisSelect}
                  irisCounts={irisCounts}
                    irisParticipants={irisParticipants}
                    onIrisBubbleClick={handleIrisBubbleClick}
                    communeLogements={ville ? parseFloat(ville.logements.replace(/\s/g, '').replace(',', '.')) : undefined}
                  />
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
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    zIndex: 1000
                  }}>
                    Source des logements : INSEE 2021
                  </div>
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
                    background: 'var(--bg-accent)',
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
                        
                        // Trouver le nom de l'IRIS depuis les données chargées
                        let irisName = irisCode
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
                        
                        return (
                          <div
                            key={irisCode}
                            style={{
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '12px',
                              padding: 'var(--spacing-md)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                              e.currentTarget.style.borderColor = 'var(--orange-primary)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'
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
              <button
                onClick={() => setIsPanelOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Ajouter
              </button>
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
            background: 'var(--bg-accent)',
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
      `}</style>
    </section>
    <FAQ />
    </>
  )
}


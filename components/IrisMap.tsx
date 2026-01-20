'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface IrisMapProps {
  commune: any
  iris: any // Peut être un tableau, un FeatureCollection, ou null
  selectedIris: string[]
  onIrisClick: (code: string, name: string, properties?: any) => void
  irisCounts?: Map<string, number> // Nombre de sélections par IRIS
  irisParticipants?: Map<string, { entreprise: string; titre: string; }[]> // Participants par IRIS
  onIrisBubbleClick?: (irisCode: string) => void // Callback pour clic sur bulle IRIS
  communeLogements?: number // Nombre total de logements de la commune (pour communes non irisées)
  searchLocation?: { lat: number; lng: number; label?: string } | null // Localisation issue de la recherche d'adresse
}

// Fonction utilitaire pour calculer les bounds d'une commune
function calculateCommuneBounds(commune: any): L.LatLngBounds | null {
  if (!commune) return null

  try {
    // Extraire la géométrie de la commune
    let geoShape = commune.geo_shape || commune.record?.fields?.geo_shape || commune.record?.fields?.geometry || commune.geometry
    
    // Si geo_shape est un Feature, extraire la geometry
    if (geoShape && geoShape.type === 'Feature') {
      geoShape = geoShape.geometry
    }
    
    if (!geoShape) {
      return null
    }

    // Convertir en format Leaflet
    let bounds: L.LatLngBounds | null = null

    if (geoShape.type === 'Polygon') {
      const coordinates = geoShape.coordinates[0]
      const latlngs = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
      bounds = L.latLngBounds(latlngs)
    } else if (geoShape.type === 'MultiPolygon') {
      const allCoords: [number, number][] = []
      geoShape.coordinates.forEach((polygon: number[][][]) => {
        polygon[0].forEach((coord: number[]) => {
          allCoords.push([coord[1], coord[0]])
        })
      })
      bounds = L.latLngBounds(allCoords)
    } else if (geoShape.type === 'Point') {
      const [lng, lat] = geoShape.coordinates
      bounds = L.latLngBounds([[lat, lng], [lat, lng]])
    }

    return bounds
  } catch (error) {
    console.error('Erreur lors du calcul des bounds:', error)
    return null
  }
}

// Composant pour ajuster la vue de la carte
function MapBounds({ commune }: { commune: any }) {
  const map = useMap()

  useEffect(() => {
    if (!commune) return

    const bounds = calculateCommuneBounds(commune)
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [commune, map])

  return null
}

// Composant pour le bouton de recentrage
function ResetViewButton({ commune }: { commune: any }) {
  const map = useMap()
  const [showTooltip, setShowTooltip] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleResetView = () => {
    const bounds = calculateCommuneBounds(commune)
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  if (!commune) return null

  const buttonSize = isMobile ? 36 : 52 // 0.7x sur mobile (52 * 0.7 = 36.4)
  const svgSize = isMobile ? 22 : 26 // 0.8x de 28px sur mobile

  return (
    <div
      style={{
        position: 'absolute',
        bottom: isMobile ? '20px' : '80px',
        right: '20px',
        zIndex: 10000,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#f7f7f7',
            color: '#1a1a2e',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10002,
            pointerEvents: 'none',
            fontWeight: 500,
          }}
        >
          Centrer
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '6px solid #f7f7f7',
            }}
          />
        </div>
      )}
      <button
        onClick={handleResetView}
        style={{
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          background: '#f7f7f7',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          color: '#1a1a2e',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          overflow: 'visible',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e8e8e8'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f7f7f7'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg 
          width={svgSize} 
          height={svgSize} 
          viewBox="0 0 24 24" 
          fill="#1a1a2e"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
        </svg>
      </button>
    </div>
  )
}

// Composant pour changer la TileLayer (doit être dans MapContainer)
function TileLayerSwitcher({ isSatellite }: { isSatellite: boolean }) {
  const map = useMap()
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    // Supprimer l'ancienne TileLayer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    // Créer la nouvelle TileLayer
    const url = isSatellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    
    const attribution = isSatellite
      ? '&copy; <a href="https://www.esri.com/">Esri</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

    const newTileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
    })

    newTileLayer.addTo(map)
    tileLayerRef.current = newTileLayer

    return () => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }
    }
  }, [isSatellite, map])

  return null
}

// Composant pour le bouton de basculement vue satellite
function SatelliteToggleButton({ 
  isSatellite, 
  onToggle 
}: { 
  isSatellite: boolean
  onToggle: () => void 
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const buttonSize = isMobile ? 36 : 52 // 0.7x sur mobile (52 * 0.7 = 36.4)
  const svgSize = isMobile ? 22 : 26 // 0.8x de 28px sur mobile

  return (
    <div
      style={{
        position: 'absolute',
        bottom: isMobile ? '70px' : '156px',
        right: '20px',
        zIndex: 10000,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#f7f7f7',
            color: '#1a1a2e',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10000,
            pointerEvents: 'none',
            fontWeight: 500,
          }}
        >
          Vue satellite
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '6px solid #f7f7f7',
            }}
          />
        </div>
      )}
      <button
        onClick={onToggle}
        style={{
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          background: '#f7f7f7',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          color: '#1a1a2e',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          overflow: 'visible',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e8e8e8'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f7f7f7'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg 
          width={svgSize} 
          height={svgSize} 
          viewBox="0 0 24 24" 
          fill="#1a1a2e"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </button>
    </div>
  )
}

function FlyToSearchLocation({ location }: { location?: { lat: number; lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (!location) return
    map.flyTo([location.lat, location.lng], 16, { duration: 0.8 })
  }, [location, map])

  return null
}

export default function IrisMap({ commune, iris, selectedIris, onIrisClick, irisCounts = new Map(), irisParticipants = new Map(), onIrisBubbleClick, communeLogements, searchLocation }: IrisMapProps) {
  console.log('🗺️ IrisMap RENDU avec props:', {
    hasCommune: !!commune,
    hasIris: !!iris,
    irisType: iris?.type,
    irisFeaturesCount: iris?.features?.length || 0,
    selectedIrisCount: selectedIris.length
  })
  
  const communeGeoRef = useRef<any>(null)
  const irisGeoRef = useRef<any>(null)
  const communeLayerRef = useRef<L.Layer | null>(null)
  const [communeGeoData, setCommuneGeoData] = useState<any>(null)
  const [irisGeoData, setIrisGeoData] = useState<any>(null)
  const [isSatelliteView, setIsSatelliteView] = useState<boolean>(false)

  useEffect(() => {
    if (!commune) {
      console.log('IrisMap - Pas de commune')
      return
    }

    try {
      // Selon la procédure ChatGPT, geo_shape est directement dans l'objet
      let geoShape = commune.geo_shape
      
      if (!geoShape) {
        console.warn('IrisMap - Aucune géométrie trouvée pour la commune')
        communeGeoRef.current = null
        return
      }
      
      // geo_shape est un Feature avec geometry selon OpenDataSoft
      let communeFeature: any = null
      
      if (geoShape.type === 'Feature' && geoShape.geometry) {
        communeFeature = {
          type: 'Feature',
          geometry: geoShape.geometry,
          properties: geoShape.properties || {}
        }
        console.log('IrisMap - Géométrie de la commune préparée (Feature):', {
          type: communeFeature.type,
          geometryType: communeFeature.geometry.type,
          hasCoordinates: !!communeFeature.geometry.coordinates
        })
      } else if (geoShape.type && geoShape.coordinates) {
        // Si c'est directement une geometry
        communeFeature = {
          type: 'Feature',
          geometry: geoShape,
          properties: {}
        }
        console.log('IrisMap - Géométrie de la commune préparée (Geometry directe):', {
          type: communeFeature.type,
          geometryType: communeFeature.geometry.type
        })
      } else {
        console.warn('IrisMap - Format de géométrie inconnu:', {
          geoShapeType: geoShape?.type,
          hasGeometry: !!(geoShape as any)?.geometry,
          hasCoordinates: !!(geoShape as any)?.coordinates
        })
      }
      
      communeGeoRef.current = communeFeature
      setCommuneGeoData(communeFeature)
    } catch (error) {
      console.error('Erreur lors de la préparation de la géométrie de la commune:', error)
      communeGeoRef.current = null
    }
  }, [commune])

  useEffect(() => {
    console.log('IrisMap - iris reçu:', {
      type: typeof iris,
      isArray: Array.isArray(iris),
      irisType: (iris as any)?.type,
      featuresCount: (iris as any)?.features?.length,
      irisValue: iris
    })
    
    if (!iris) {
      console.log('IrisMap - Pas d\'IRIS, réinitialisation')
      irisGeoRef.current = null
      setIrisGeoData(null)
      return
    }

    try {
      // Si les IRIS sont déjà au format GeoJSON FeatureCollection (objet, pas tableau)
      if (Array.isArray(iris) === false && (iris as any).type === 'FeatureCollection' && (iris as any).features) {
        const featureCount = (iris as any).features.length
        console.log(`IrisMap - FeatureCollection détectée avec ${featureCount} features`)
        
        // Vérifier que les features ont des géométries valides
        const validFeatures = (iris as any).features.filter((f: any) => {
          const hasGeometry = f.geometry && f.geometry.type && f.geometry.coordinates
          if (!hasGeometry) {
            console.warn('IrisMap - Feature sans géométrie valide:', f.properties)
          }
          return hasGeometry
        })
        
        console.log(`IrisMap - ${validFeatures.length} features valides sur ${featureCount} total`)
        
        if (validFeatures.length === 0) {
          console.error('IrisMap - Aucune feature valide avec géométrie!')
          irisGeoRef.current = null
          setIrisGeoData(null)
          return
        }
        
        // Créer une copie profonde pour forcer le re-render
        const featureCollection = {
          type: 'FeatureCollection',
          features: validFeatures.map((f: any) => ({
            type: f.type,
            geometry: f.geometry,
            properties: { ...f.properties }
          }))
        }
        
        irisGeoRef.current = featureCollection
        setIrisGeoData(featureCollection)
        console.log('IrisMap - irisGeoRef.current assigné:', {
          type: irisGeoRef.current.type,
          featuresCount: irisGeoRef.current.features.length,
          firstFeatureGeometry: irisGeoRef.current.features[0]?.geometry?.type,
          firstFeatureCoordinates: irisGeoRef.current.features[0]?.geometry?.coordinates ? 'présents' : 'manquants'
        })
        return
      }

      // Si c'est un tableau vide
      if (Array.isArray(iris) && iris.length === 0) {
        irisGeoRef.current = null
        setIrisGeoData(null)
        return
      }

      // Sinon, convertir le format
      const irisFeatures = iris
        .map((item: any) => {
          // Si c'est déjà une Feature GeoJSON
          if (item.type === 'Feature') {
            return {
              type: 'Feature',
              geometry: item.geometry,
              properties: {
                code: item.properties?.code_iris || item.properties?.code || item.properties?.codeIris || item.properties?.code,
                name: item.properties?.nom_iris || item.properties?.nom || item.properties?.nomIris || item.properties?.code || item.properties?.code_iris || item.properties?.code,
              },
            }
          }

          // Sinon, extraire depuis la structure record ou OpenDataSoft
          let geoShape = item.geometry || item.record?.fields?.geo_shape || item.record?.fields?.geometry || item.geo_shape
          
          // Si geo_shape est un Feature, extraire la geometry
          if (geoShape && geoShape.type === 'Feature') {
            geoShape = geoShape.geometry
          }
          
          const code = item.properties?.code_iris || item.properties?.code || item.record?.fields?.code_iris || item.record?.fields?.code || item.code_iris || item.code
          const name = item.properties?.nom_iris || item.properties?.nom || item.record?.fields?.nom_iris || item.record?.fields?.nom || item.nom_iris || item.nom || code

          if (!geoShape) return null

          return {
            type: 'Feature',
            geometry: geoShape,
            properties: {
              code,
              name,
            },
          }
        })
        .filter((f: any) => f !== null)

      const featureCollection = {
        type: 'FeatureCollection',
        features: irisFeatures,
      }
      irisGeoRef.current = featureCollection
      setIrisGeoData(featureCollection)
      console.log(`IrisMap - ${irisFeatures.length} IRIS préparés et assignés à irisGeoRef`)
    } catch (error) {
      console.error('Erreur lors de la préparation des IRIS:', error)
      irisGeoRef.current = null
      setIrisGeoData(null)
    }
  }, [iris])

  // Mettre à jour le style de la commune quand selectedIris change
  useEffect(() => {
    if (!communeLayerRef.current || !commune || !communeGeoData) return
    
    // Vérifier si c'est une commune non irisée
    if (!irisGeoData || !irisGeoData.features || irisGeoData.features.length === 0) {
      let communeName = 'Commune'
      if (commune.com_name) {
        communeName = Array.isArray(commune.com_name) ? commune.com_name[0] : commune.com_name
      } else if (commune.record?.fields?.com_name) {
        communeName = Array.isArray(commune.record.fields.com_name) ? commune.record.fields.com_name[0] : commune.record.fields.com_name
      }
      const communeCode = `COMMUNE_NON_IRISEE_${communeName}`
      const isSelected = selectedIris.some(code => String(code || '').trim() === communeCode)
      
      if (communeLayerRef.current instanceof L.Path) {
        communeLayerRef.current.setStyle({
          color: isSelected ? '#fb6d25' : '#2563eb',
          weight: isSelected ? 5 : 4,
          fillColor: isSelected ? '#fb6d25' : '#3b82f6',
          fillOpacity: isSelected ? 0.4 : 0.1,
        })
      }
    }
  }, [selectedIris, commune, communeGeoData, irisGeoData])

  if (!commune) {
    return (
      <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement de la carte...</p>
      </div>
    )
  }

  // Style pour la commune - délimitée en bleu (plus visible) ou orange si sélectionnée
  const getCommuneStyle = (feature: any) => {
    // Pour les communes non irisées, vérifier si elles sont sélectionnées
    if (!irisGeoData || !irisGeoData.features || irisGeoData.features.length === 0) {
      let communeName = 'Commune'
      if (commune.com_name) {
        communeName = Array.isArray(commune.com_name) ? commune.com_name[0] : commune.com_name
      } else if (commune.record?.fields?.com_name) {
        communeName = Array.isArray(commune.record.fields.com_name) ? commune.record.fields.com_name[0] : commune.record.fields.com_name
      }
      const communeCode = `COMMUNE_NON_IRISEE_${communeName}`
      const isSelected = selectedIris.some(code => String(code || '').trim() === communeCode)
      
      return {
        color: isSelected ? '#fb6d25' : '#2563eb', // Orange si sélectionnée, bleu sinon
        weight: isSelected ? 5 : 4, // Contour plus épais si sélectionnée
        fillColor: isSelected ? '#fb6d25' : '#3b82f6', // Orange si sélectionnée, bleu sinon
        fillOpacity: isSelected ? 0.4 : 0.1, // Plus opaque si sélectionnée
      }
    }
    
    // Pour les communes avec IRIS, style par défaut
    return {
      color: '#2563eb', // Bleu plus foncé pour le contour
      weight: 4, // Contour plus épais
      fillColor: '#3b82f6',
      fillOpacity: 0.1, // Légèrement plus visible
    }
  }

  // Style pour les IRIS - sectionnés avec des bordures distinctes (plus visibles)
  const getIrisStyle = (feature: any) => {
    // Normaliser le code pour la comparaison
    const featureCode = String(feature?.properties?.code || feature?.properties?.code_iris || '').trim()
    const isSelected = selectedIris.some(code => String(code || '').trim() === featureCode)
    return {
      color: isSelected ? '#fb6d25' : '#1e40af', // Bleu foncé pour les bordures des IRIS
      weight: isSelected ? 3 : 2, // Bordures plus visibles
      fillColor: isSelected ? '#fb6d25' : '#3b82f6', // Bleu pour le remplissage (plus visible)
      fillOpacity: isSelected ? 0.6 : 0.3, // Plus opaque pour mieux voir les sections
    }
  }

  // Gestion du clic sur un IRIS
  const onEachIris = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        // Normaliser le code IRIS pour s'assurer qu'il correspond au format stocké
        const code = String(feature.properties.code || feature.properties.code_iris || '').trim()
        const name = feature.properties.name || feature.properties.nom_iris || code
        console.log('🗺️ Clic sur IRIS depuis la carte:', { code, name, properties: feature.properties })
        onIrisClick(code, name, feature.properties)
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path
        layer.setStyle({
          weight: 4,
          fillOpacity: 0.6,
        })
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path
        const featureCode = String(feature.properties.code || feature.properties.code_iris || '').trim()
        const isSelected = selectedIris.some(code => String(code || '').trim() === featureCode)
        layer.setStyle({
          weight: isSelected ? 3 : 2,
          fillOpacity: isSelected ? 0.5 : 0.3,
        })
      },
    })

    // Ajouter un tooltip avec le code IRIS (seulement au survol, pas au clic)
    // Ne pas utiliser 'center' pour éviter qu'un marqueur par défaut s'affiche
    layer.bindTooltip(feature.properties.name || feature.properties.code, {
      permanent: false,
      direction: 'auto', // Utiliser 'auto' au lieu de 'center' pour éviter les marqueurs
      className: 'iris-tooltip',
      offset: [0, 0] // Pas d'offset pour éviter les marqueurs
    })
  }

  console.log('🗺️ IrisMap RENDU - irisGeoData:', {
    hasIrisGeoData: !!irisGeoData,
    featuresCount: irisGeoData?.features?.length || 0,
    hasCommuneGeoData: !!communeGeoData
  })
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      {!commune && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,0,0,0.9)', color: 'white', padding: '10px', borderRadius: '4px', zIndex: 10000 }}>
          ⚠️ Pas de commune
        </div>
      )}
      {commune && !irisGeoData && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,165,0,0.9)', color: 'white', padding: '10px', borderRadius: '4px', zIndex: 999 }}>
          ⚠️ Commune non irisée
        </div>
      )}
      <MapContainer
        center={[48.8566, 2.3522]} // Coordonnées par défaut (Paris)
        zoom={12}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayerSwitcher isSatellite={isSatelliteView} />

        <MapBounds commune={commune} />
        <ResetViewButton commune={commune} />
        <SatelliteToggleButton 
          isSatellite={isSatelliteView} 
          onToggle={() => setIsSatelliteView(!isSatelliteView)} 
        />

        {/* Localisation de l'adresse recherchée */}
        <FlyToSearchLocation location={searchLocation} />
        {searchLocation && (
          <>
            <Circle
              center={[searchLocation.lat, searchLocation.lng]}
              radius={250}
              pathOptions={{
                color: '#fb6d25',
                weight: 2,
                fillColor: '#fb6d25',
                fillOpacity: 0.12,
              }}
            />
            <Marker
              position={[searchLocation.lat, searchLocation.lng]}
              icon={L.divIcon({
                className: 'address-search-marker',
                html: `
                  <div style="
                    width: 22px;
                    height: 22px;
                    border-radius: 999px;
                    background: linear-gradient(135deg, #fb6d25 0%, #ff8c42 100%);
                    border: 3px solid rgba(255,255,255,0.95);
                    box-shadow: 0 10px 22px rgba(251, 109, 37, 0.45);
                  "></div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              })}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
                  <strong>Adresse</strong>
                  <div style={{ marginTop: 6, color: '#111827' }}>
                    {searchLocation.label || `${searchLocation.lat.toFixed(5)}, ${searchLocation.lng.toFixed(5)}`}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Contour de la commune */}
        {communeGeoData ? (
          <GeoJSON
            key="commune-boundary"
            data={communeGeoData}
            style={getCommuneStyle}
            onEachFeature={(feature: any, layer: L.Layer) => {
              // Si pas d'IRIS, permettre le clic sur la commune pour les communes non irisées
              if ((!irisGeoData || !irisGeoData.features || irisGeoData.features.length === 0) && communeLogements) {
                // Stocker la référence de la couche
                communeLayerRef.current = layer
                
                // Extraire le nom de la commune pour créer le code
                let communeName = 'Commune'
                if (commune.com_name) {
                  communeName = Array.isArray(commune.com_name) ? commune.com_name[0] : commune.com_name
                } else if (commune.record?.fields?.com_name) {
                  communeName = Array.isArray(commune.record.fields.com_name) ? commune.record.fields.com_name[0] : commune.record.fields.com_name
                }
                const communeCode = `COMMUNE_NON_IRISEE_${communeName}`
                
                // Appliquer le style initial basé sur la sélection
                const initialStyle = getCommuneStyle(feature)
                layer.setStyle(initialStyle)
                
                layer.on({
                  click: () => {
                    console.log('🗺️ Clic sur commune non irisée:', { code: communeCode, name: communeName, logements: communeLogements })
                    onIrisClick(communeCode, communeName)
                    
                    // Mettre à jour le style après le clic
                    const isSelected = selectedIris.some(code => String(code || '').trim() === communeCode)
                    layer.setStyle({
                      color: isSelected ? '#fb6d25' : '#2563eb',
                      weight: isSelected ? 5 : 4,
                      fillColor: isSelected ? '#fb6d25' : '#3b82f6',
                      fillOpacity: isSelected ? 0.4 : 0.1,
                    })
                  },
                  mouseover: (e: L.LeafletMouseEvent) => {
                    const layer = e.target as L.Path
                    const isSelected = selectedIris.some(code => String(code || '').trim() === communeCode)
                    layer.setStyle({
                      weight: isSelected ? 6 : 5,
                      fillOpacity: isSelected ? 0.5 : 0.2,
                    })
                  },
                  mouseout: (e: L.LeafletMouseEvent) => {
                    const layer = e.target as L.Path
                    const isSelected = selectedIris.some(code => String(code || '').trim() === communeCode)
                    layer.setStyle({
                      color: isSelected ? '#fb6d25' : '#2563eb',
                      weight: isSelected ? 5 : 4,
                      fillColor: isSelected ? '#fb6d25' : '#3b82f6',
                      fillOpacity: isSelected ? 0.4 : 0.1,
                    })
                  },
                })
                // Ajouter un tooltip pour indiquer qu'on peut cliquer
                layer.bindTooltip('Cliquez pour sélectionner la commune', {
                  permanent: false,
                  direction: 'auto',
                  className: 'iris-tooltip',
                })
              }
            }}
          />
        ) : (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.8)', color: 'white', padding: '8px', borderRadius: '4px', zIndex: 1000, fontSize: '14px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
            ⚠️ Pas de géométrie commune
          </div>
        )}

        {/* IRIS */}
        {irisGeoData && irisGeoData.features && irisGeoData.features.length > 0 ? (
          <>
            <GeoJSON
              key={`iris-${irisGeoData.features.length}`}
              data={irisGeoData}
              style={getIrisStyle}
              onEachFeature={onEachIris}
            />
            {/* Marqueurs avec compteurs pour les IRIS sélectionnés */}
            {irisGeoData.features.map((feature: any) => {
              const irisCode = feature.properties.code || feature.properties.code_iris
              const count = irisCounts.get(irisCode) || 0
              
              if (count === 0) return null

              // Calculer le centre de la géométrie pour placer le marqueur
              let center: [number, number] | null = null
              
              if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
                const coords = feature.geometry.coordinates[0]
                const lats = coords.map((c: number[]) => c[1])
                const lngs = coords.map((c: number[]) => c[0])
                const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
                const avgLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
                center = [avgLat, avgLng]
              } else if (feature.geometry.type === 'MultiPolygon') {
                const firstPolygon = feature.geometry.coordinates[0]?.[0]
                if (firstPolygon) {
                  const lats = firstPolygon.map((c: number[]) => c[1])
                  const lngs = firstPolygon.map((c: number[]) => c[0])
                  const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
                  const avgLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
                  center = [avgLat, avgLng]
                }
              }

              if (!center) return null

              // Créer une icône personnalisée avec le nombre et un dégradé orange
              const icon = L.divIcon({
                className: 'iris-count-marker',
                html: `<div style="
                  background: linear-gradient(135deg, #fb6d25 0%, #ff8c42 100%);
                  color: white;
                  border-radius: 50%;
                  width: 36px;
                  height: 36px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 14px;
                  border: 2px solid white;
                  box-shadow: 0 4px 12px rgba(251, 109, 37, 0.4);
                  cursor: pointer;
                  transition: transform 0.2s;
                ">${count}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
              })

              return (
                <Marker 
                  key={`count-${irisCode}`} 
                  position={center} 
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      if (onIrisBubbleClick) {
                        onIrisBubbleClick(irisCode)
                      }
                    }
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: 'center', padding: '4px' }}>
                      <strong>{feature.properties.name || irisCode}</strong><br />
                      {count} participant{count > 1 ? 's' : ''}
                      {count < 3 && <span style={{ color: '#f44336' }}> (min: 3)</span>}
                      {count >= 5 && <span style={{ color: '#4caf50' }}> (complet)</span>}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,255,0,0.8)', color: 'white', padding: '8px', borderRadius: '4px', zIndex: 1000, fontSize: '14px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif' }}>
              ✅ {irisGeoData.features.length} IRIS affichés
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0, 0, 0, 0.5)', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: '6px', zIndex: 1000, fontSize: '12px', fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif', opacity: 0.7 }}>
            Commune non irisée
          </div>
        )}
      </MapContainer>

      <style jsx global>{`
        .iris-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-poppins), Poppins, Montserrat, sans-serif;
        }
        .iris-count-marker {
          background: transparent !important;
          border: none !important;
        }
        /* Désactiver les marqueurs par défaut de Leaflet qui pourraient apparaître au centre des polygones */
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        /* Cacher tous les marqueurs par défaut sauf nos bulles orange */
        .leaflet-marker-icon:not(.iris-count-marker) {
          display: none !important;
        }
        /* Cacher les marqueurs qui pourraient apparaître au centre des polygones sélectionnés */
        .leaflet-clickable path + .leaflet-marker-icon {
          display: none !important;
        }
        /* S'assurer qu'aucun marqueur par défaut ne s'affiche */
        .leaflet-container .leaflet-marker-icon:not(.iris-count-marker) {
          display: none !important;
        }
      `}</style>
    </div>
  )
}


import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const codeInsee = searchParams.get('codeInsee')

  if (!codeInsee) {
    return NextResponse.json(
      { error: 'Code INSEE requis' },
      { status: 400 }
    )
  }

  try {
    // Essayer plusieurs sources pour les IRIS
    
    // Source 1: API IGN (nécessite une clé API, mais on essaie quand même)
    try {
      const ignResponse = await fetch(
        `https://wxs.ign.fr/choisirgeoportail/geoportail/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&outputFormat=application/json&srsName=EPSG:4326&cql_filter=code_commune='${codeInsee}'&maxFeatures=500`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }
      )

      if (ignResponse.ok) {
        const data = await ignResponse.json()
        if (data.features && data.features.length > 0) {
          return NextResponse.json({
            type: 'FeatureCollection',
            features: data.features.map((feature: any) => ({
              type: 'Feature',
              geometry: feature.geometry,
              properties: {
                code_iris: feature.properties?.code_iris || feature.properties?.code || feature.id,
                nom_iris: feature.properties?.nom_iris || feature.properties?.nom || feature.properties?.code_iris || feature.properties?.code || feature.id,
                code: feature.properties?.code_iris || feature.properties?.code || feature.id,
                name: feature.properties?.nom_iris || feature.properties?.nom || feature.properties?.code_iris || feature.properties?.code || feature.id,
              },
            })),
          })
        }
      }
    } catch (ignError) {
      console.warn('API IGN non disponible:', ignError)
    }

    // Source 2: OpenDataSoft - Dataset georef-france-iris (plus fiable)
    try {
      const odsResponse = await fetch(
        `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-iris/records?where=com_code%20%3D%20%22${codeInsee}%22&limit=100`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (odsResponse.ok) {
        const data = await odsResponse.json()
        const totalCount = data.total_count || 0
        const results = data.results || []
        
        console.log(`API IRIS: ${totalCount} total, ${results.length} résultats reçus pour codeInsee ${codeInsee}`)
        
        if (results.length > 0) {
          const features = results
            .map((item: any) => {
              try {
                // Extraire geo_shape (c'est un Feature avec geometry)
                const geoFeature = item.geo_shape
                if (!geoFeature || geoFeature.type !== 'Feature' || !geoFeature.geometry) {
                  return null
                }
                
                const geometry = geoFeature.geometry
                if (!geometry || !geometry.type || !geometry.coordinates) {
                  return null
                }
                
                // Extraire le code IRIS (tableau dans OpenDataSoft)
                let code: string = ''
                if (Array.isArray(item.iris_code) && item.iris_code.length > 0) {
                  code = String(item.iris_code[0])
                } else if (item.iris_code) {
                  code = String(item.iris_code)
                }
                
                if (!code) {
                  return null
                }
                
                // Extraire le nom IRIS (tableau dans OpenDataSoft)
                let name: string = code
                if (Array.isArray(item.iris_name) && item.iris_name.length > 0) {
                  name = String(item.iris_name[0])
                } else if (item.iris_name) {
                  name = String(item.iris_name)
                }

                return {
                  type: 'Feature',
                  geometry: geometry,
                  properties: {
                    code_iris: code,
                    nom_iris: name,
                    code: code,
                    name: name,
                  },
                }
              } catch (err: any) {
                return null
              }
            })
            .filter((f: any) => f !== null)

          console.log(`API IRIS: ${features.length} features valides créées`)

          if (features.length > 0) {
            return NextResponse.json({
              type: 'FeatureCollection',
              features: features,
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
              },
            })
          }
        }
      } else {
        const errorText = await odsResponse.text()
        console.error(`OpenDataSoft erreur ${odsResponse.status}:`, errorText)
      }
    } catch (odsError: any) {
      console.error('Erreur OpenDataSoft:', odsError.message)
    }

    // Si aucune source ne fonctionne, retourner un tableau vide
    return NextResponse.json({
      type: 'FeatureCollection',
      features: [],
    })
  } catch (error: any) {
    console.error('Erreur lors du chargement des IRIS:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des IRIS', details: error.message },
      { status: 500 }
    )
  }
}


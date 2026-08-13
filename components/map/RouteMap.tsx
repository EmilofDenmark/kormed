'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getMapDisplayConfig } from '@/lib/geo/mapConfig'
import { decodePolyline } from '@/lib/geo/polyline'
import { roundForDisplay } from '@/lib/geo/approximate'

/**
 * Ride detail map: approximate origin/destination markers + the calculated
 * route line. Never plots the driver's exact meeting point — spec §5 & §11
 * ("Det præcise mødested aftales med chaufføren.") are enforced in the
 * surrounding page copy, this component just draws public road geometry.
 */
export function RouteMap({
  originName,
  originLat,
  originLng,
  destinationName,
  destinationLat,
  destinationLng,
  polyline,
  height = 320,
}: {
  originName: string
  originLat: number
  originLng: number
  destinationName: string
  destinationLat: number
  destinationLng: number
  polyline: string | null
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const config = getMapDisplayConfig()

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        config.type === 'style'
          ? config.styleUrl
          : {
              version: 8,
              sources: {
                osm: { type: 'raster', tiles: [config.tileUrl], tileSize: 256, attribution: config.attribution },
              },
              layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
            },
      center: [10.5, 56.0],
      zoom: 6,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const origin = roundForDisplay({ lat: originLat, lng: originLng })
    const destination = roundForDisplay({ lat: destinationLat, lng: destinationLng })
    const bounds = new maplibregl.LngLatBounds()

    map.on('load', () => {
      new maplibregl.Marker({ color: '#2f7d6d' })
        .setLngLat([origin.lng, origin.lat])
        .setPopup(new maplibregl.Popup().setText(originName))
        .addTo(map)
      new maplibregl.Marker({ color: '#17324d' })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(new maplibregl.Popup().setText(destinationName))
        .addTo(map)

      bounds.extend([origin.lng, origin.lat])
      bounds.extend([destination.lng, destination.lat])

      if (polyline) {
        const points = decodePolyline(polyline)
        const coordinates = points.map((p) => [p.lng, p.lat] as [number, number])
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#2f7d6d', 'line-width': 4, 'line-opacity': 0.8 },
        })
        coordinates.forEach((c) => bounds.extend(c))
      }

      map.fitBounds(bounds, { padding: 48, maxZoom: 11 })
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-card border border-ink-300/20"
      role="img"
      aria-label={`Kort over ruten fra ${originName} til ${destinationName}`}
    />
  )
}

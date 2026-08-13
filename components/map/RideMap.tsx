'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getMapDisplayConfig } from '@/lib/geo/mapConfig'
import { roundForDisplay } from '@/lib/geo/approximate'

export interface MapRide {
  id: string
  originName: string
  lat: number
  lng: number
  priceDkk: number
}

/**
 * Shows APPROXIMATE ride starting points only (spec §5) — coordinates are
 * rounded via roundForDisplay before ever reaching the map, never the
 * precise stored location.
 */
export function RideMap({ rides, height = 360 }: { rides: MapRide[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const config = getMapDisplayConfig()

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        config.type === 'style'
          ? config.styleUrl
          : {
              version: 8,
              sources: {
                osm: {
                  type: 'raster',
                  tiles: [config.tileUrl],
                  tileSize: 256,
                  attribution: config.attribution,
                },
              },
              layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
            },
      center: [10.5, 56.0],
      zoom: 6.2,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    rides.forEach((ride) => {
      const pos = roundForDisplay({ lat: ride.lat, lng: ride.lng })
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'ride-map-pin'
      el.setAttribute('aria-label', `${ride.originName}, ${ride.priceDkk} kr. pr. person`)
      el.onclick = () => router.push(`/tur/${ride.id}`)

      const marker = new maplibregl.Marker({ element: el }).setLngLat([pos.lng, pos.lat]).addTo(map)
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [rides, router])

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-card border border-ink-300/20"
      role="img"
      aria-label="Kort over kommende tures omtrentlige startpunkter"
    />
  )
}

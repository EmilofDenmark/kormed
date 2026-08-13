import type { LatLng } from './types'

/**
 * Google/OSRM-style precision-5 encoded polyline codec. Small and dependency
 * free — avoids pulling in a package just for this well-known, ~30-line
 * algorithm. Compatible with MapLibre/Mapbox GL and most map tooling.
 */

const PRECISION = 1e5

export function encodePolyline(points: LatLng[]): string {
  let output = ''
  let prevLat = 0
  let prevLng = 0

  for (const { lat, lng } of points) {
    const lat5 = Math.round(lat * PRECISION)
    const lng5 = Math.round(lng * PRECISION)
    output += encodeValue(lat5 - prevLat)
    output += encodeValue(lng5 - prevLng)
    prevLat = lat5
    prevLng = lng5
  }

  return output
}

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1
  let output = ''
  while (v >= 0x20) {
    output += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
    v >>= 5
  }
  output += String.fromCharCode(v + 63)
  return output
}

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    lat += decodeValue()
    lng += decodeValue()
    points.push({ lat: lat / PRECISION, lng: lng / PRECISION })
  }

  return points

  function decodeValue(): number {
    let result = 0
    let shift = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    return result & 1 ? ~(result >> 1) : result >> 1
  }
}

import type { MetadataRoute } from 'next'
import { brand } from '@/lib/config/brand'

/**
 * Web app manifest: gør, at sitet kan gemmes som "app" på telefonens
 * startskærm med eget ikon og navn (se /gem-som-app). Det er stadig den
 * samme hjemmeside — der er ingen app i app-butikkerne.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F8F6',
    theme_color: '#2F7D6D',
    lang: 'da',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}

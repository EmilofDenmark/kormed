import type { MetadataRoute } from 'next'
import { brand } from '@/lib/config/brand'

const PUBLIC_PATHS = [
  '',
  '/find-lift',
  '/tilbyd-lift',
  '/samkoersel',
  '/sikkerhed',
  '/kontakt',
  '/vilkaar',
  '/privatliv',
  '/cookies',
  '/anmeld-ulovligt-indhold',
  '/om-koermed',
  '/stoet-koermed',
  '/gem-som-app',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${brand.url}${path}`,
    lastModified: new Date(),
  }))
}

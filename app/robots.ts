import type { MetadataRoute } from 'next'
import { brand } from '@/lib/config/brand'

/**
 * Privacy-conscious SEO defaults (spec §32): only marketing pages are
 * crawlable. Ride detail pages, public profiles, account pages and the
 * admin panel are all excluded — they either carry user-generated data or
 * are private by nature.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/tur/',
        '/bruger/',
        '/profil',
        '/mine-ture',
        '/mine-bookinger',
        '/beskeder',
        '/admin',
        '/tilmeld',
        '/log-ind',
        '/glemt-kodeord',
        '/nyt-kodeord',
        '/bekraeft-telefon',
        '/api/',
      ],
    },
    sitemap: `${brand.url}/sitemap.xml`,
  }
}

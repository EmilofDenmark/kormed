/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Profile photos are stored in Supabase Storage; the hostname is derived
    // from NEXT_PUBLIC_SUPABASE_URL at deploy time — see README "Miljøvariabler".
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // SEO/privacy: indexing is controlled per-route via `generateMetadata` robots
  // fields and app/robots.ts (see spec §32) rather than a blanket regex header,
  // which is more reliable across the App Router.
}

export default nextConfig

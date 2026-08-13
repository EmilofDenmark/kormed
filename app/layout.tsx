import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/nav/Header'
import { Footer } from '@/components/nav/Footer'
import { brand } from '@/lib/config/brand'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-dark focus:px-4 focus:py-2 focus:text-white"
        >
          Spring til indhold
        </a>
        <Header />
        <main id="main-content" className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

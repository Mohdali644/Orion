import type { Metadata, Viewport } from 'next'
import { Inter, Syne, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { RootProviders as Providers } from '../components/providers/root-providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne',
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  weight: ['400', '500', '600']
})

export const metadata: Metadata = {
  title: 'Orion - Know your site\'s health before your users do',
  description: 'Precision meets autonomy. Monitor your site health in real-time.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8] text-[#1a1f35] font-sans antialiased min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

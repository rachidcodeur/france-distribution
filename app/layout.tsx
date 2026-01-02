import type { Metadata } from 'next'
import { Montserrat, Poppins } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'France Distribution - Distribution mutualisée de flyers',
  description: 'La distribution mutualisée qui réduit vos coûts jusqu\'à -50%. Couverture France entière, calendrier trimestriel, transparence totale.',
  icons: {
    icon: '/favicon-france-distribution.png',
    shortcut: '/favicon-france-distribution.png',
    apple: '/favicon-france-distribution.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${montserrat.variable} ${poppins.variable}`}>
        {children}
      </body>
    </html>
  )
}


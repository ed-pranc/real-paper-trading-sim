import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SimulationDateProvider } from '@/context/simulation-date'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

/** Geist Sans — registered as --font-sans variable */
const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] })

/** Geist Mono — registered as --font-mono variable, used as primary UI font */
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RPTSim — Real Paper Trading Simulator',
  description: 'Simulate stock trading with real historical prices',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-mono antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SimulationDateProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </SimulationDateProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

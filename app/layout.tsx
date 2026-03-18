import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SimulationDateProvider } from '@/context/simulation-date'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'RPTSim — Real Paper Trading Simulator',
  description: 'Simulate stock trading with real historical prices',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <SimulationDateProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton duration={10000} />
            </SimulationDateProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

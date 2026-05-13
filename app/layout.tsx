import type { Metadata } from 'next'
import './globals.css'
import UsernameModal from '@/components/UsernameModal'
import DankMode from '@/components/DankMode'

export const metadata: Metadata = {
  title: 'InterDiff — Calculus Practice',
  description: 'Timed integration and differentiation practice with live leaderboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-navy text-cream">
        <UsernameModal />
        {children}
        <DankMode />
        <div className="fixed bottom-3 left-3 text-cream/20 font-mono text-xs select-none pointer-events-none">
          v0.1.0
        </div>
      </body>
    </html>
  )
}

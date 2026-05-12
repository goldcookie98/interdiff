import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InteDiff — Calculus Practice',
  description: 'Timed integration and differentiation practice with live leaderboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-navy text-cream">
        {children}
      </body>
    </html>
  )
}

import Link from 'next/link'
import Leaderboard from '@/components/Leaderboard'

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">
            ← InterDiff
          </Link>
          <h1 className="font-serif text-4xl font-bold text-cream mt-4">Leaderboard</h1>
          <p className="text-cream/50 font-serif italic">Top 20 scores per difficulty — live</p>
        </div>

        {/* Leaderboard component */}
        <div className="card">
          <Leaderboard compact={false} />
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/play" className="btn-gold px-10 py-4 text-lg inline-block">
            Start a Sprint
          </Link>
        </div>
      </div>
    </main>
  )
}

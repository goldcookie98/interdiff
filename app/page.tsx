import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Title */}
        <div>
          <div className="font-mono text-gold/60 text-sm tracking-widest uppercase mb-3">
            ∫ · d/dx
          </div>
          <h1 className="font-serif text-6xl sm:text-7xl font-bold text-cream mb-3">
            Inte<span className="text-gold">Diff</span>
          </h1>
          <p className="font-serif text-cream/60 text-xl italic">
            Master calculus under pressure
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 text-xs font-mono">
          {[
            '⏱ Timed sprints',
            '📐 3 difficulty levels',
            '🏆 Live leaderboard',
            '∫ Integration',
            'd/dx Differentiation',
          ].map(f => (
            <span key={f} className="px-3 py-1 rounded-full border border-white/10 text-cream/50 bg-white/5">
              {f}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-cream/60 font-serif text-lg leading-relaxed max-w-lg mx-auto">
          Race through 10 calculus questions. Input your answers using the built-in math keyboard.
          Compete on the global leaderboard.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/play" className="btn-gold text-lg px-8 py-4 inline-block">
            Start Sprint 10
          </Link>
          <Link href="/leaderboard" className="btn-outline text-lg px-8 py-4 inline-block">
            Leaderboard
          </Link>
        </div>

        {/* Difficulty selector teaser */}
        <div className="flex justify-center gap-3 pt-2">
          {['Easy', 'Medium', 'Hard'].map((d, i) => (
            <div
              key={d}
              className={`px-3 py-1 rounded-full text-xs font-mono border ${
                i === 0 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                i === 1 ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                          'border-red-500/30 text-red-400 bg-red-500/10'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-cream/25 text-xs font-mono pt-4">
          No account needed · Powered by Firebase
        </p>
      </div>
    </main>
  )
}

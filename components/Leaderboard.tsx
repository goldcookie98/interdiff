'use client'
import { useEffect, useState } from 'react'
import type { Difficulty } from '@/lib/questions'

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  correct: number
  totalTimeMs: number
  difficulty: Difficulty
  createdAt: number
}

interface LeaderboardProps {
  highlightId?: string
  defaultDifficulty?: Difficulty
  compact?: boolean
}

const DIFF_TABS: Difficulty[] = ['easy', 'medium', 'hard']

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  const m = Math.floor(s / 60)
  if (m > 0) return `${m}:${String(s % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  return `${s}.${String(cs).padStart(2, '0')}s`
}

export default function Leaderboard({ highlightId, defaultDifficulty = 'easy', compact = false }: LeaderboardProps) {
  const [tab, setTab] = useState<Difficulty>(defaultDifficulty)
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let unsub: (() => void) | undefined

    async function subscribe() {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore')

        if (!db) throw new Error('Firebase not initialised')

        const q = query(
          collection(db, 'leaderboard'),
          orderBy('score', 'desc'),
          limit(200)
        )

        unsub = onSnapshot(
          q,
          snapshot => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardEntry))
            setNewIds(prev => {
              const added = new Set<string>()
              docs.forEach(d => { if (!prev.has(d.id)) added.add(d.id) })
              return added
            })
            setAllEntries(docs)
            setLoading(false)
          },
          err => {
            console.error('Firestore onSnapshot error:', err)
            setError(`Firestore: ${err.message}`)
            setLoading(false)
          }
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('Leaderboard setup error:', msg)
        setError(`Could not connect: ${msg}`)
        setLoading(false)
      }
    }

    subscribe()
    return () => unsub?.()
  }, [])

  const entries = allEntries.filter(e => e.difficulty === tab).slice(0, 20)

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg p-1" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        {DIFF_TABS.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setTab(d)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-mono capitalize transition-all cursor-pointer ${
              tab === d ? 'font-semibold' : 'text-cream/60 hover:text-cream'
            }`}
            style={tab === d ? { backgroundColor: 'var(--gold)', color: 'var(--navy)' } : undefined}
          >
            {d}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-center text-red-400 py-6 text-xs font-mono break-all px-2">{error}</div>
      )}

      {loading && !error && (
        <div className="text-center text-cream/40 py-10 font-mono text-sm animate-pulse">Loading…</div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center text-cream/40 py-10 font-serif text-sm">
          No scores yet for {tab}. Be the first!
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-1">
          {entries.map((entry, i) => {
            const isHighlight = entry.id === highlightId
            const isNew = newIds.has(entry.id)
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 border ${
                  isHighlight ? 'border-gold/40' : 'border-white/5'
                } ${isNew ? 'animate-slide-in' : ''}`}
                style={{ backgroundColor: isHighlight ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)' }}
              >
                <span className={`w-6 text-center text-sm font-mono flex-shrink-0 ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-cream/40'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>

                <span className={`flex-1 font-serif text-sm truncate ${isHighlight ? 'text-gold' : 'text-cream'}`}>
                  {entry.name}
                  {isHighlight && <span className="ml-2 text-xs text-gold/70 font-mono">(you)</span>}
                </span>

                <span className="font-mono text-sm font-semibold w-20 text-right flex-shrink-0 text-gold">
                  {Math.round(entry.score).toLocaleString()}
                </span>

                {!compact && (
                  <>
                    <span className="font-mono text-xs text-cream/50 w-12 text-right flex-shrink-0">
                      {entry.correct}/10
                    </span>
                    <span className="font-mono text-xs text-cream/40 w-16 text-right flex-shrink-0">
                      {formatTime(entry.totalTimeMs)}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

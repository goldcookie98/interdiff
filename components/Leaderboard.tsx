'use client'
import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    const q = query(
      collection(db, 'leaderboard'),
      where('difficulty', '==', tab),
      orderBy('score', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, snapshot => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardEntry))

      // Detect new entries for animation
      const incoming = new Set(docs.map(d => d.id))
      setNewIds(prev => {
        const added = new Set<string>()
        incoming.forEach(id => { if (!prev.has(id)) added.add(id) })
        return incoming
      })

      setEntries(docs)
      setLoading(false)
    }, () => setLoading(false))

    return () => unsub()
  }, [tab])

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-navy-light/50 rounded-lg p-1">
        {DIFF_TABS.map(d => (
          <button
            key={d}
            onClick={() => setTab(d)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-mono capitalize transition-all ${
              tab === d
                ? 'bg-gold text-navy font-semibold'
                : 'text-cream/60 hover:text-cream'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-cream/40 py-10 font-mono text-sm animate-pulse">
          Loading leaderboard…
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center text-cream/40 py-10 font-serif text-sm">
          No scores yet. Be the first!
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, i) => {
            const isHighlight = entry.id === highlightId
            const isNew = newIds.has(entry.id) && i < 3

            return (
              <div
                key={entry.id}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500
                  ${isHighlight ? 'bg-gold/15 border border-gold/40' : 'bg-navy-light/40 border border-white/5'}
                  ${isNew ? 'animate-slide-in' : ''}
                  ${!compact && 'hover:bg-white/5'}
                `}
              >
                {/* Rank */}
                <span className={`
                  w-6 text-center text-sm font-mono flex-shrink-0
                  ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-cream/40'}
                `}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>

                {/* Name */}
                <span className={`flex-1 font-serif text-sm truncate ${isHighlight ? 'text-gold' : 'text-cream'}`}>
                  {entry.name}
                  {isHighlight && <span className="ml-2 text-xs text-gold/70 font-mono">(you)</span>}
                </span>

                {/* Score */}
                <span className="font-mono text-sm text-gold font-semibold w-20 text-right flex-shrink-0">
                  {Math.round(entry.score).toLocaleString()}
                </span>

                {!compact && (
                  <>
                    {/* Correct */}
                    <span className="font-mono text-xs text-cream/50 w-12 text-right flex-shrink-0">
                      {entry.correct}/10
                    </span>
                    {/* Time */}
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

'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { generateQuestions, type Question, type Difficulty, type QuestionMode } from '@/lib/questions'
import { checkAnswer } from '@/lib/answerCheck'
import QuestionCard from '@/components/QuestionCard'
import MathInput, { type MathInputHandle } from '@/components/MathInput'

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamMode = 'ffa' | '2v2'

interface PlayerState {
  name: string
  progress: number
  done: boolean
  score: number | null
  correct: number | null
  totalTimeMs: number | null
  answers: Array<{ userAnswer: string; correct: boolean }> | null
  team: '1' | '2' | null
}

interface RoomSettings {
  difficulty: Difficulty
  questionType: QuestionMode
  teamMode: TeamMode
  questionCount: number
}

interface RoomDoc {
  code: string
  hostId: string
  status: 'lobby' | 'playing' | 'finished'
  settings: RoomSettings
  questions: Question[]
  createdAt: number
  startedAt: number | null
  players: Record<string, PlayerState>
}

interface LocalResult {
  question: Question
  userAnswer: string
  correct: boolean
  timeMs: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}s`
}

function LatexSpan({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try { katex.render(latex, ref.current, { throwOnError: false }) }
    catch { if (ref.current) ref.current.textContent = latex }
  }, [latex])
  return <span ref={ref} className="inline-block" />
}

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string; textColor: string }> = {
  easy:   { label: 'Easy',   color: 'border-emerald-500/50 bg-emerald-500/10', textColor: 'text-emerald-400' },
  medium: { label: 'Medium', color: 'border-amber-500/50 bg-amber-500/10',     textColor: 'text-amber-400'   },
  hard:   { label: 'Hard',   color: 'border-red-500/50 bg-red-500/10',         textColor: 'text-red-400'     },
}

const QTYPE_LABELS: Record<QuestionMode, string> = {
  both: 'Both', integration: '∫ Integ.', differentiation: 'd/dx Diff.',
}

const TEAM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '1': { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  '2': { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400' },
}

function teamScore(players: Record<string, PlayerState>, team: '1' | '2') {
  return Object.values(players)
    .filter(p => p.team === team && p.done)
    .reduce((sum, p) => sum + (p.score ?? 0), 0)
}

// ─── Player Sidebar ───────────────────────────────────────────────────────────

function PlayerSidebar({ players, userId, teamMode, compact = false }: {
  players: Record<string, PlayerState>
  userId: string
  teamMode: TeamMode
  compact?: boolean
}) {
  const entries = Object.entries(players).sort((a, b) => {
    if (a[1].done !== b[1].done) return a[1].done ? -1 : 1
    return b[1].progress - a[1].progress
  })

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {entries.map(([id, p]) => (
          <div key={id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono border ${
            id === userId ? 'border-gold/30 bg-gold/10' : 'border-white/10 bg-white/5'
          }`}>
            {teamMode === '2v2' && p.team && (
              <span className={`text-xs font-bold ${TEAM_COLORS[p.team]?.text}`}>T{p.team}</span>
            )}
            <span className={id === userId ? 'text-gold' : 'text-cream/70'}>{p.name}</span>
            <span className="text-cream/40">{p.progress}/{entries.length > 0 ? undefined : '?'}</span>
            {p.done && <span className="text-emerald-400">✓</span>}
          </div>
        ))}
      </div>
    )
  }

  if (teamMode === '2v2') {
    return (
      <div className="space-y-4">
        {(['1', '2'] as const).map(t => {
          const tc = TEAM_COLORS[t]
          const teamPlayers = entries.filter(([, p]) => p.team === t)
          return (
            <div key={t}>
              <div className={`text-xs font-mono uppercase tracking-wider mb-2 ${tc.text}`}>
                Team {t}
              </div>
              {teamPlayers.length === 0 && (
                <div className="text-cream/25 text-xs font-mono px-2">No players</div>
              )}
              {teamPlayers.map(([id, p]) => (
                <div key={id} className={`p-2 rounded-lg mb-1 ${id === userId ? 'bg-gold/10' : tc.bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-mono truncate max-w-[110px] ${id === userId ? 'text-gold' : 'text-cream/80'}`}>
                      {p.name}{id === userId ? ' (you)' : ''}
                    </span>
                    <span className="text-xs font-mono text-cream/40 ml-1">{p.progress}/10</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${tc.bg}`}>
                    <div className={`h-full rounded-full transition-all duration-300 ${p.done ? 'bg-emerald-400' : id === userId ? 'bg-gold' : tc.text.replace('text-', 'bg-')}`}
                      style={{ width: `${(p.progress / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-cream/40 text-xs font-mono uppercase tracking-wider mb-3">
        Players ({entries.length})
      </div>
      {entries.map(([id, p]) => (
        <div key={id} className={`p-2 rounded-lg ${id === userId ? 'bg-gold/10' : 'bg-white/5'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-mono truncate max-w-[120px] ${id === userId ? 'text-gold' : 'text-cream/80'}`}>
              {p.name}{id === userId ? ' (you)' : ''}
            </span>
            <span className="text-xs font-mono text-cream/40 ml-1 flex-shrink-0">{p.progress}/10</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${p.done ? 'bg-emerald-400' : id === userId ? 'bg-gold' : 'bg-cream/40'}`}
              style={{ width: `${(p.progress / 10) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Detailed Results ─────────────────────────────────────────────────────────

function DetailedResults({ players, questions, userId, teamMode }: {
  players: Record<string, PlayerState>
  questions: Question[]
  userId: string
  teamMode: TeamMode
}) {
  const [expanded, setExpanded] = useState<string | null>(userId)

  const donePlayers = Object.entries(players).filter(([, p]) => p.done)

  if (teamMode === '2v2') {
    const t1Score = teamScore(players, '1')
    const t2Score = teamScore(players, '2')
    const winner = t1Score > t2Score ? '1' : t2Score > t1Score ? '2' : null

    return (
      <div className="space-y-4">
        {/* Team banner */}
        <div className={`card text-center border-2 ${
          winner === '1' ? 'border-emerald-500/50 bg-emerald-500/5' :
          winner === '2' ? 'border-blue-500/50 bg-blue-500/5' :
          'border-white/20'
        }`}>
          {winner ? (
            <>
              <div className="text-3xl mb-1">🏆</div>
              <div className={`font-serif text-2xl font-bold ${winner === '1' ? 'text-emerald-400' : 'text-blue-400'}`}>
                Team {winner} Wins!
              </div>
            </>
          ) : (
            <div className="font-serif text-2xl font-bold text-cream">It's a Tie!</div>
          )}
          <div className="flex justify-center gap-10 mt-3">
            <div className="text-center">
              <div className="text-emerald-400 font-mono text-xl font-bold">{Math.round(t1Score).toLocaleString()}</div>
              <div className="text-cream/40 text-xs font-mono">Team 1</div>
            </div>
            <div className="text-cream/20 font-mono text-xl self-center">vs</div>
            <div className="text-center">
              <div className="text-blue-400 font-mono text-xl font-bold">{Math.round(t2Score).toLocaleString()}</div>
              <div className="text-cream/40 text-xs font-mono">Team 2</div>
            </div>
          </div>
        </div>

        {/* Per-team breakdown */}
        {(['1', '2'] as const).map(t => {
          const tc = TEAM_COLORS[t]
          const teamPlayers = donePlayers.filter(([, p]) => p.team === t)
            .sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))
          return (
            <div key={t} className={`card border ${tc.border}`}>
              <div className={`font-serif text-lg font-semibold ${tc.text} mb-3`}>Team {t}</div>
              <div className="space-y-2">
                {teamPlayers.map(([id, p]) => (
                  <PlayerResultRow key={id} id={id} p={p} userId={userId} questions={questions}
                    expanded={expanded === id} onToggle={() => setExpanded(expanded === id ? null : id)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // FFA
  const medals = ['🥇', '🥈', '🥉']
  const sorted = donePlayers.sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))

  return (
    <div className="card space-y-2">
      {sorted.map(([id, p], i) => (
        <PlayerResultRow key={id} id={id} p={p} userId={userId} questions={questions}
          medal={medals[i]} expanded={expanded === id}
          onToggle={() => setExpanded(expanded === id ? null : id)} />
      ))}
      {Object.entries(players).filter(([, p]) => !p.done).map(([id, p]) => (
        <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 opacity-50">
          <span className="w-7 text-center text-cream/20 font-mono text-sm">–</span>
          <div className="flex-1">
            <div className="font-mono text-sm text-cream/60">{p.name}</div>
            <div className="font-mono text-xs text-cream/30">{p.progress}/10 answered · did not finish</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlayerResultRow({ id, p, userId, questions, medal, expanded, onToggle }: {
  id: string; p: PlayerState; userId: string; questions: Question[]
  medal?: string; expanded: boolean; onToggle: () => void
}) {
  return (
    <div className={`rounded-xl border overflow-hidden ${id === userId ? 'border-gold/30' : 'border-white/10'}`}>
      {/* Summary row */}
      <button type="button" onClick={onToggle}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${
          id === userId ? 'bg-gold/10 hover:bg-gold/15' : 'bg-white/5 hover:bg-white/8'
        }`}>
        {medal && <span className="text-xl flex-shrink-0 w-7 text-center">{medal}</span>}
        <div className="flex-1 min-w-0">
          <div className={`font-mono text-sm font-semibold ${id === userId ? 'text-gold' : 'text-cream'}`}>
            {p.name}{id === userId ? ' (you)' : ''}
          </div>
          <div className="font-mono text-xs text-cream/40">
            {p.correct}/{questions.length} correct · {((p.totalTimeMs ?? 0) / 1000).toFixed(2)}s
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`font-mono text-base font-bold ${id === userId ? 'text-gold' : 'text-cream'}`}>
            {Math.round(p.score ?? 0).toLocaleString()}
          </div>
          <div className="text-cream/30 text-xs font-mono">pts</div>
        </div>
        <span className="text-cream/30 text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Per-question breakdown */}
      {expanded && p.answers && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {p.answers.map((a, i) => {
            const q = questions[i]
            if (!q) return null
            return (
              <div key={i} className={`flex items-start gap-3 px-4 py-2 text-xs ${
                a.correct ? 'bg-emerald-500/5' : 'bg-red-500/5'
              }`}>
                <span className={`flex-shrink-0 font-mono font-bold mt-0.5 ${a.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.correct ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-cream/40 font-mono mb-0.5">Q{i + 1} · {q.type}</div>
                  <div className="text-cream/60 font-mono">
                    Their answer: <span className={a.correct ? 'text-emerald-300' : 'text-red-300'}>{a.userAnswer || '—'}</span>
                  </div>
                  {!a.correct && q && (
                    <div className="text-cream/40 font-mono mt-0.5">
                      Correct: <LatexSpan latex={q.answer} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Create / Join landing ────────────────────────────────────────────────────

function LandingView() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = async () => {
    setCreating(true); setError(null)
    try {
      const { db } = await import('@/lib/firebase')
      if (!db) throw new Error('Firebase not initialised')
      const { doc, setDoc, getDoc } = await import('firebase/firestore')
      const { getUserId, getUsername } = await import('@/lib/user')
      const userId = getUserId()
      const username = getUsername() ?? 'Anonymous'

      let code = generateCode()
      for (let i = 0; i < 5; i++) {
        if (!(await getDoc(doc(db, 'rooms', code))).exists()) break
        code = generateCode()
      }

      await setDoc(doc(db, 'rooms', code), {
        code, hostId: userId, status: 'lobby',
        settings: { difficulty: 'easy', questionType: 'both', teamMode: 'ffa', questionCount: 10 },
        questions: [], createdAt: Date.now(), startedAt: null,
        players: { [userId]: { name: username, progress: 0, done: false, score: null, correct: null, totalTimeMs: null, answers: null, team: null } },
      })
      router.push(`/room?code=${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room')
      setCreating(false)
    }
  }

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true); setError(null)
    try {
      const { db } = await import('@/lib/firebase')
      if (!db) throw new Error('Firebase not initialised')
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'rooms', code))
      if (!snap.exists()) throw new Error('Room not found — check the code and try again')
      const room = snap.data()
      if (room.status === 'playing') throw new Error('Game already in progress')
      if (room.status === 'finished') throw new Error("This room's game has ended")
      router.push(`/room?code=${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room')
      setJoining(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        <div className="text-center">
          <Link href="/" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">← InterDiff</Link>
          <h1 className="font-serif text-4xl font-bold text-cream mt-4 mb-2">Group Room</h1>
          <p className="text-cream/60 font-serif italic">Compete with friends in real time</p>
        </div>

        {error && <div className="card border-red-500/30 bg-red-500/10"><p className="text-red-400 text-sm font-mono">{error}</p></div>}

        <div className="card space-y-4">
          <h2 className="font-serif text-xl text-cream">Create a Room</h2>
          <p className="text-cream/50 text-sm font-mono">Start a new room and share the code with friends.</p>
          <button type="button" onClick={createRoom} disabled={creating}
            className="w-full py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>
            {creating ? 'Creating…' : 'Create Room'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-cream/30 text-xs font-mono">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="card space-y-4">
          <h2 className="font-serif text-xl text-cream">Join a Room</h2>
          <p className="text-cream/50 text-sm font-mono">Enter the 6-character code from your friend.</p>
          <input type="text" value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="XXXXXX" maxLength={6}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-cream font-mono text-center text-2xl tracking-[0.4em] focus:outline-none focus:border-gold/50 placeholder:text-cream/20 placeholder:tracking-[0.4em]" />
          <button type="button" onClick={joinRoom} disabled={joining || joinCode.trim().length < 6}
            className="w-full py-3 rounded-xl font-semibold border border-white/20 text-cream transition-all hover:border-white/40 active:scale-95 disabled:opacity-40 cursor-pointer bg-white/5"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            {joining ? 'Joining…' : 'Join Room'}
          </button>
        </div>
      </div>
    </main>
  )
}

// ─── Room View ────────────────────────────────────────────────────────────────

function RoomView({ code }: { code: string }) {
  const router = useRouter()

  const [room, setRoom] = useState<RoomDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState<LocalResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [myDone, setMyDone] = useState(false)

  const gameStartRef = useRef(0)
  const qStartRef = useRef(0)
  const mathInputRef = useRef<MathInputHandle>(null)
  const prevStatusRef = useRef<string>('')

  useEffect(() => {
    import('@/lib/user').then(({ getUserId }) => setUserId(getUserId()))
  }, [])

  useEffect(() => {
    if (!code || !userId) return
    let joined = false

    const subscribe = async () => {
      const { db } = await import('@/lib/firebase')
      if (!db) { setError('Firebase not initialised'); setLoading(false); return }
      const { doc, onSnapshot, updateDoc } = await import('firebase/firestore')
      const { getUsername } = await import('@/lib/user')
      const ref = doc(db, 'rooms', code)

      const unsub = onSnapshot(ref, async snap => {
        if (!snap.exists()) { setError('Room not found'); setLoading(false); return }
        const data = snap.data() as RoomDoc

        // Backfill missing settings fields (for rooms created before these features)
        if (!data.settings.questionType && (data.settings as any).mode) {
          data.settings.questionType = (data.settings as any).mode
        }
        if (!data.settings.questionType) data.settings.questionType = 'both'
        if (!data.settings.teamMode) data.settings.teamMode = 'ffa'
        if (!data.settings.questionCount) data.settings.questionCount = 10

        if (!joined && !data.players[userId]) {
          joined = true
          const username = getUsername() ?? 'Anonymous'
          try {
            await updateDoc(ref, {
              [`players.${userId}`]: { name: username, progress: 0, done: false, score: null, correct: null, totalTimeMs: null, answers: null, team: null },
            })
          } catch { /* ignore */ }
        } else { joined = true }

        if (prevStatusRef.current !== 'playing' && data.status === 'playing') {
          setQIndex(0); setResults([]); setAnswer(''); setFeedback(null); setMyDone(false)
          gameStartRef.current = data.startedAt ?? Date.now()
          qStartRef.current = Date.now()
        }
        prevStatusRef.current = data.status
        setRoom(data); setLoading(false)
      }, err => { setError(err.message); setLoading(false) })

      return unsub
    }

    let cleanup: (() => void) | undefined
    subscribe().then(fn => { cleanup = fn })
    return () => { cleanup?.() }
  }, [code, userId])

  useEffect(() => {
    if (room?.status !== 'playing' || myDone) return
    const id = setInterval(() => setElapsed(Date.now() - gameStartRef.current), 100)
    return () => clearInterval(id)
  }, [room?.status, myDone])

  useEffect(() => {
    if (room?.status === 'playing' && !feedback && !myDone) {
      setTimeout(() => mathInputRef.current?.focus(), 50)
    }
  }, [room?.status, qIndex, feedback, myDone])

  const updateSettings = async (patch: Partial<RoomSettings>) => {
    if (!room) return
    const { db } = await import('@/lib/firebase')
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'rooms', code), { settings: { ...room.settings, ...patch } })
  }

  const assignTeam = async (targetUserId: string, team: '1' | '2') => {
    const { db } = await import('@/lib/firebase')
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'rooms', code), { [`players.${targetUserId}.team`]: team })
  }

  const startGame = async () => {
    if (!room) return
    setStarting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      const ref = doc(db, 'rooms', code)
      const count = room.settings.questionCount || 10
      const questions = generateQuestions(room.settings.difficulty, count, room.settings.questionType)

      const players: Record<string, PlayerState> = {}
      const playerIds = Object.keys(room.players)

      // Auto-assign unassigned players to teams if 2v2
      let t1 = 0, t2 = 0
      for (const [id, p] of Object.entries(room.players)) {
        let team = p.team
        if (room.settings.teamMode === '2v2' && !team) {
          team = t1 <= t2 ? '1' : '2'
          if (team === '1') t1++; else t2++
        }
        players[id] = { name: p.name, progress: 0, done: false, score: null, correct: null, totalTimeMs: null, answers: null, team: room.settings.teamMode === '2v2' ? team : null }
      }

      await updateDoc(ref, { status: 'playing', questions, startedAt: Date.now(), players })
    } catch (e) { console.error('startGame error:', e) }
    finally { setStarting(false) }
  }

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || feedback || !room || myDone) return
    const q = room.questions[qIndex]
    if (!q) return

    const isCorrect = checkAnswer(answer, q.answer)
    const qTime = Date.now() - qStartRef.current
    const newResults = [...results, { question: q, userAnswer: answer, correct: isCorrect, timeMs: qTime }]
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    setTimeout(async () => {
      const nextIndex = qIndex + 1
      const isLast = nextIndex >= room.questions.length
      try {
        const { db } = await import('@/lib/firebase')
        const { doc, updateDoc } = await import('firebase/firestore')
        const ref = doc(db, 'rooms', code)
        if (isLast) {
          const totalMs = Date.now() - gameStartRef.current
          const correctCount = newResults.filter(r => r.correct).length
          const score = correctCount * (1000000 / Math.max(totalMs, 1)) * 10
          const answers = newResults.map(r => ({ userAnswer: r.userAnswer, correct: r.correct }))
          await updateDoc(ref, {
            [`players.${userId}.progress`]: room.questions.length,
            [`players.${userId}.done`]: true,
            [`players.${userId}.score`]: score,
            [`players.${userId}.correct`]: correctCount,
            [`players.${userId}.totalTimeMs`]: totalMs,
            [`players.${userId}.answers`]: answers,
          })
          setResults(newResults); setMyDone(true)
        } else {
          await updateDoc(ref, { [`players.${userId}.progress`]: nextIndex })
          setResults(newResults); setQIndex(nextIndex); setAnswer(''); setFeedback(null)
          qStartRef.current = Date.now()
        }
      } catch {
        if (isLast) { setResults(newResults); setMyDone(true) }
        else { setResults(newResults); setQIndex(qIndex + 1); setAnswer(''); setFeedback(null); qStartRef.current = Date.now() }
      }
    }, 1200)
  }, [answer, feedback, room, myDone, qIndex, results, userId, code])

  const resetRoom = async () => {
    if (!room) return
    const { db } = await import('@/lib/firebase')
    const { doc, updateDoc } = await import('firebase/firestore')
    const players: Record<string, PlayerState> = {}
    for (const [id, p] of Object.entries(room.players)) {
      players[id] = { name: p.name, progress: 0, done: false, score: null, correct: null, totalTimeMs: null, answers: null, team: p.team }
    }
    await updateDoc(doc(db, 'rooms', code), { status: 'lobby', questions: [], startedAt: null, players })
    setMyDone(false); setResults([]); setQIndex(0); setAnswer(''); setFeedback(null)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-cream/40 font-mono animate-pulse">Joining room…</p>
    </main>
  )

  if (error || !room) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-red-400 font-mono">{error ?? 'Room not found'}</p>
      <Link href="/room" className="text-gold/60 text-sm font-mono hover:text-gold transition-colors">← Back to rooms</Link>
    </main>
  )

  const isHost = room.hostId === userId
  const qCount = room.settings.questionCount || 10
  const allDone = Object.values(room.players).length > 0 && Object.values(room.players).every(p => p.done)
  const waitingCount = Object.values(room.players).filter(p => !p.done).length

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (room.status === 'lobby') {
    const { difficulty, questionType, teamMode, questionCount } = room.settings

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-4 animate-fade-in">
          <div className="text-center">
            <Link href="/room" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">← Rooms</Link>
            <h1 className="font-serif text-4xl font-bold text-cream mt-3 mb-1">Room</h1>
            <button type="button" onClick={copyCode}
              className="font-mono text-3xl text-gold tracking-[0.25em] hover:opacity-70 transition-opacity cursor-pointer" title="Click to copy">
              {code}
            </button>
            <p className="text-cream/25 text-xs font-mono mt-1">{copied ? 'Copied!' : 'Click code to copy · Share with friends'}</p>
          </div>

          {/* Players */}
          <div className="card space-y-2">
            <div className="text-cream/40 text-xs font-mono uppercase tracking-wider">Players ({Object.keys(room.players).length})</div>
            {Object.entries(room.players).map(([id, p]) => (
              <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${id === userId ? 'bg-gold/10' : 'bg-white/5'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${id === room.hostId ? 'bg-gold' : 'bg-emerald-400'}`} />
                <span className={`font-mono text-sm flex-1 ${id === userId ? 'text-gold' : 'text-cream/80'}`}>
                  {p.name}{id === userId ? ' (you)' : ''}{id === room.hostId ? ' · host' : ''}
                </span>
                {/* Team assignment buttons (2v2, host only) */}
                {teamMode === '2v2' && (
                  <div className="flex gap-1">
                    <button type="button" disabled={!isHost} onClick={() => assignTeam(id, '1')}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                        p.team === '1' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'bg-white/5 text-cream/30 border border-white/10'
                      } ${isHost ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>T1</button>
                    <button type="button" disabled={!isHost} onClick={() => assignTeam(id, '2')}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                        p.team === '2' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-white/5 text-cream/30 border border-white/10'
                      } ${isHost ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>T2</button>
                  </div>
                )}
              </div>
            ))}
            {teamMode === '2v2' && isHost && (
              <p className="text-cream/25 text-xs font-mono">Click T1/T2 to assign teams · unassigned players auto-assigned on start</p>
            )}
            {teamMode === '2v2' && !isHost && (
              <p className="text-cream/25 text-xs font-mono">
                Your team: {room.players[userId]?.team ? `Team ${room.players[userId].team}` : 'Unassigned (host will assign)'}
              </p>
            )}
          </div>

          {/* Settings */}
          <div className="card space-y-4">
            <div className="text-cream/40 text-xs font-mono uppercase tracking-wider">Game Settings</div>

            <div>
              <div className="text-cream/50 text-xs font-mono mb-2">Difficulty</div>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                  const cfg = DIFF_CONFIG[d]; const sel = difficulty === d
                  return (
                    <button key={d} type="button" disabled={!isHost} onClick={() => updateSettings({ difficulty: d })}
                      className={`py-2 rounded-lg border text-xs font-mono transition-all ${sel ? `${cfg.color} ${cfg.textColor}` : 'border-white/10 text-cream/40'} ${isHost ? 'cursor-pointer hover:border-white/30' : 'cursor-default'}`}>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-cream/50 text-xs font-mono mb-2">Question Type</div>
              <div className="grid grid-cols-3 gap-2">
                {(['both', 'integration', 'differentiation'] as QuestionMode[]).map(m => {
                  const sel = questionType === m
                  return (
                    <button key={m} type="button" disabled={!isHost} onClick={() => updateSettings({ questionType: m })}
                      className={`py-2 rounded-lg border text-xs font-mono transition-all ${sel ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 text-cream/40'} ${isHost ? 'cursor-pointer hover:border-white/30' : 'cursor-default'}`}>
                      {QTYPE_LABELS[m]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-cream/50 text-xs font-mono mb-2">Questions</div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(n => {
                  const sel = (questionCount || 10) === n
                  return (
                    <button key={n} type="button" disabled={!isHost} onClick={() => updateSettings({ questionCount: n })}
                      className={`py-2 rounded-lg border text-xs font-mono transition-all ${sel ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 text-cream/40'} ${isHost ? 'cursor-pointer hover:border-white/30' : 'cursor-default'}`}>
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-cream/50 text-xs font-mono mb-2">Mode</div>
              <div className="grid grid-cols-2 gap-2">
                {(['ffa', '2v2'] as TeamMode[]).map(m => {
                  const sel = teamMode === m
                  const label = m === 'ffa' ? '⚔️ Free for All' : '🤝 2v2 Teams'
                  return (
                    <button key={m} type="button" disabled={!isHost} onClick={() => updateSettings({ teamMode: m })}
                      className={`py-2 rounded-lg border text-xs font-mono transition-all ${sel ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 text-cream/40'} ${isHost ? 'cursor-pointer hover:border-white/30' : 'cursor-default'}`}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {!isHost && <p className="text-cream/30 text-xs font-mono">Only the host can change settings</p>}
          </div>

          {isHost ? (
            <button type="button" onClick={startGame} disabled={starting}
              className="w-full py-4 text-xl rounded-xl font-semibold cursor-pointer transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>
              {starting ? 'Starting…' : 'Start Game'}
            </button>
          ) : (
            <div className="card text-center">
              <p className="text-cream/50 font-mono text-sm animate-pulse">Waiting for host to start the game…</p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  if (room.status === 'playing') {
    const teamMode = room.settings?.teamMode ?? 'ffa'

    if (myDone) {
      const donePlayers = Object.values(room.players).filter(p => p.done).length
      const total = Object.keys(room.players).length
      return (
        <main className="min-h-screen flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="font-mono text-sm text-cream/40 tracking-widest">{code}</div>
            <div className="font-mono text-gold text-xl font-bold">{formatElapsed(elapsed)}</div>
            <div className="font-mono text-xs text-cream/40 capitalize">{room.settings.difficulty}</div>
          </div>
          <div className="flex flex-1 min-h-0">
            <aside className="hidden sm:block w-52 xl:w-60 border-r border-white/10 p-4 flex-shrink-0 overflow-y-auto">
              <PlayerSidebar players={room.players} userId={userId} teamMode={teamMode} />
            </aside>
            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 py-12">
              <div className="sm:hidden w-full max-w-lg">
                <PlayerSidebar players={room.players} userId={userId} teamMode={teamMode} compact />
              </div>
              <div className="card text-center max-w-sm w-full space-y-3">
                <div className="text-emerald-400 text-3xl">✓</div>
                <p className="font-serif text-xl text-cream">You finished!</p>
                <div className="flex justify-center gap-6 pt-1">
                  <div className="text-center">
                    <div className="font-mono text-lg text-cream">{results.filter(r => r.correct).length}/{qCount}</div>
                    <div className="text-cream/40 text-xs font-mono">correct</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-lg text-cream">{formatElapsed(elapsed)}</div>
                    <div className="text-cream/40 text-xs font-mono">time</div>
                  </div>
                </div>
                <p className="text-cream/40 text-sm font-mono">
                  {donePlayers}/{total} players done
                  {!allDone && <span className="animate-pulse"> · waiting…</span>}
                </p>
              </div>
            </div>
          </div>
        </main>
      )
    }

    const q = room.questions[qIndex]
    if (!q) return <main className="min-h-screen flex items-center justify-center"><p className="text-cream/50 font-mono">Loading…</p></main>

    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <button type="button" onClick={() => router.push('/room')}
            className="text-cream/30 text-sm font-mono hover:text-cream/60 transition-colors cursor-pointer">← quit</button>
          <div className="text-center">
            <div className="text-gold font-mono text-2xl font-bold tabular-nums">{formatElapsed(elapsed)}</div>
            <div className="text-cream/30 text-xs font-mono">elapsed</div>
          </div>
          <div className="text-cream/40 text-sm font-mono capitalize">{room.settings.difficulty}</div>
        </div>
        <div className="flex flex-1 min-h-0">
          <aside className="hidden sm:block w-52 xl:w-60 border-r border-white/10 p-4 flex-shrink-0 overflow-y-auto">
            <PlayerSidebar players={room.players} userId={userId} teamMode={teamMode} />
          </aside>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
              <div className="sm:hidden">
                <PlayerSidebar players={room.players} userId={userId} teamMode={teamMode} compact />
              </div>
              <div className={`transition-all duration-300 ${feedback ? 'opacity-70' : 'opacity-100'}`}>
                <QuestionCard question={q} index={qIndex} total={room.questions.length} />
              </div>
              {feedback && (
                <div className={`rounded-xl p-4 text-center font-serif text-lg font-semibold border animate-slide-in ${
                  feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
                }`}>
                  {feedback === 'correct' ? '✓ Correct!' : <span>✗ Incorrect — answer: <LatexSpan latex={q.answer} /></span>}
                </div>
              )}
              {!feedback && (
                <div className="space-y-4">
                  <MathInput ref={mathInputRef} value={answer} onChange={setAnswer} onSubmit={handleSubmit} placeholder="Enter your answer…" autoFocus />
                  <button type="button" onClick={handleSubmit} disabled={!answer.trim()}
                    className="w-full py-4 text-lg rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>
                    Submit Answer →
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden sm:block w-52 xl:w-60 flex-shrink-0" />
        </div>
      </main>
    )
  }

  // ── Finished ──────────────────────────────────────────────────────────────
  if (room.status === 'finished' || allDone) {
    const teamMode = room.settings?.teamMode ?? 'ffa'
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="text-center">
            <Link href="/room" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">← Rooms</Link>
            <h1 className="font-serif text-4xl font-bold text-cream mt-4">Results</h1>
            <p className="text-cream/40 font-mono text-sm mt-1">
              Room {code} · {room.settings.difficulty} · {qCount} questions
            </p>
          </div>

          <DetailedResults players={room.players} questions={room.questions} userId={userId} teamMode={teamMode} />

          {isHost ? (
            <button type="button" onClick={resetRoom}
              className="w-full py-3 rounded-xl font-semibold cursor-pointer transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>
              Play Again
            </button>
          ) : (
            <div className="card text-center">
              <p className="text-cream/40 text-sm font-mono">Waiting for host to start a new game…</p>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/room" className="btn-outline flex-1 text-center py-3">Leave Room</Link>
            <Link href="/leaderboard" className="btn-outline flex-1 text-center py-3">Leaderboard</Link>
          </div>
        </div>
      </main>
    )
  }

  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function RoomPageInner() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')?.toUpperCase() ?? null
  if (code) return <RoomView code={code} />
  return <LandingView />
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-cream/40 font-mono animate-pulse">Loading…</p>
      </main>
    }>
      <RoomPageInner />
    </Suspense>
  )
}

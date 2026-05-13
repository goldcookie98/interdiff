'use client'
import { useState, useEffect, useCallback } from 'react'
import type { User } from 'firebase/auth'
import type { Difficulty } from '@/lib/questions'

interface Entry {
  id: string
  name: string
  score: number
  correct: number
  totalTimeMs: number
  difficulty: Difficulty
  createdAt: number
  updatedAt?: number
}

type SortKey = 'score' | 'name' | 'difficulty' | 'createdAt'

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  const m = Math.floor(s / 60)
  if (m > 0) return `${m}:${String(s % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  return `${s}.${String(cs).padStart(2, '0')}s`
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { auth } = await import('@/lib/firebase')
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const cred = await signInWithEmailAndPassword(auth, email, password)
      onLogin(cred.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-sm w-full space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="font-mono text-gold/60 text-xs tracking-widest uppercase mb-2">Admin</div>
          <h1 className="font-serif text-3xl font-bold text-cream">Sign in</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoFocus
            className="w-full rounded-xl px-4 py-3 font-mono placeholder:text-cream/30 focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--cream)' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-xl px-4 py-3 font-mono placeholder:text-cream/30 focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--cream)' }}
          />
          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-cream/25 text-xs font-mono text-center">
          Create admin account in Firebase Console → Authentication
        </p>
      </div>
    </main>
  )
}

// ─── Edit row ─────────────────────────────────────────────────────────────────
function EditRow({
  entry,
  onSave,
  onCancel,
}: {
  entry: Entry
  onSave: (id: string, updates: Partial<Entry>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(entry.name)
  const [score, setScore] = useState(String(Math.round(entry.score)))
  const [correct, setCorrect] = useState(String(entry.correct))
  const [timeMs, setTimeMs] = useState(String(entry.totalTimeMs))
  const [difficulty, setDifficulty] = useState<Difficulty>(entry.difficulty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const parsedScore = parseFloat(score)
    const parsedCorrect = parseInt(correct)
    const parsedTime = parseInt(timeMs)
    if (isNaN(parsedScore) || isNaN(parsedCorrect) || isNaN(parsedTime)) {
      setError('Score, correct, and time must be numbers')
      return
    }
    setSaving(true)
    try {
      await onSave(entry.id, { name: name.trim(), score: parsedScore, correct: parsedCorrect, totalTimeMs: parsedTime, difficulty })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <tr className="border-b border-white/5 bg-gold/5">
      <td className="px-3 py-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded px-2 py-1 font-mono text-sm bg-white/10 text-cream focus:outline-none border border-white/20"
          maxLength={24}
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={score}
          onChange={e => setScore(e.target.value)}
          className="w-24 rounded px-2 py-1 font-mono text-sm bg-white/10 text-cream focus:outline-none border border-white/20"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={correct}
          onChange={e => setCorrect(e.target.value)}
          className="w-12 rounded px-2 py-1 font-mono text-sm bg-white/10 text-cream focus:outline-none border border-white/20"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={timeMs}
          onChange={e => setTimeMs(e.target.value)}
          className="w-24 rounded px-2 py-1 font-mono text-sm bg-white/10 text-cream focus:outline-none border border-white/20"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value as Difficulty)}
          className="rounded px-2 py-1 font-mono text-sm bg-white/10 text-cream focus:outline-none border border-white/20"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </td>
      <td className="px-3 py-2 text-cream/40 font-mono text-xs">
        {new Date(entry.createdAt).toLocaleDateString()}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 rounded text-xs font-mono bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded text-xs font-mono bg-white/10 text-cream/60 hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          {error && <span className="text-red-400 text-xs font-mono">{error}</span>}
        </div>
      </td>
    </tr>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterDiff, setFilterDiff] = useState<Difficulty | 'all'>('all')
  const [search, setSearch] = useState('')

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore')
      const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'))
      const snap = await getDocs(q)
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Entry)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleSave = async (id: string, updates: Partial<Entry>) => {
    const { db } = await import('@/lib/firebase')
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'leaderboard', id), { ...updates, updatedAt: Date.now() })
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const { db } = await import('@/lib/firebase')
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'leaderboard', id))
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const visible = entries
    .filter(e => filterDiff === 'all' || e.difficulty === filterDiff)
    .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name)
      if (sortKey === 'difficulty') return dir * a.difficulty.localeCompare(b.difficulty)
      return dir * (a[sortKey] - b[sortKey])
    })

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(k)}
      className="flex items-center gap-1 hover:text-gold transition-colors"
    >
      {label}
      <span className="text-cream/30">{sortKey === k ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </button>
  )

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-gold/60 text-xs tracking-widest uppercase">Admin</div>
            <h1 className="font-serif text-3xl font-bold text-cream">Leaderboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cream/40 font-mono text-xs">{user.email}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg font-mono text-sm text-cream/60 hover:text-cream border border-white/10 hover:border-white/20 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="rounded-lg px-3 py-2 font-mono text-sm placeholder:text-cream/30 focus:outline-none flex-1 min-w-40"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--cream)' }}
          />
          <div className="flex gap-1">
            {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
              <button
                key={d}
                onClick={() => setFilterDiff(d)}
                className={`px-3 py-1 rounded-lg font-mono text-xs capitalize transition-colors ${
                  filterDiff === d ? 'text-navy font-semibold' : 'text-cream/50 hover:text-cream'
                }`}
                style={filterDiff === d ? { backgroundColor: 'var(--gold)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                {d}
              </button>
            ))}
          </div>
          <span className="text-cream/30 font-mono text-xs">{visible.length} entries</span>
          <button
            onClick={loadEntries}
            className="px-3 py-1 rounded-lg font-mono text-xs text-cream/50 hover:text-cream border border-white/10 hover:border-white/20 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Table */}
        {loading && (
          <div className="card text-center text-cream/40 font-mono text-sm animate-pulse py-10">Loading…</div>
        )}
        {error && (
          <div className="card text-red-400 font-mono text-sm">{error}</div>
        )}
        {!loading && !error && (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-cream/50 font-mono text-xs">
                  <th className="text-left px-3 py-3"><SortBtn k="name" label="Name" /></th>
                  <th className="text-left px-3 py-3"><SortBtn k="score" label="Score" /></th>
                  <th className="text-left px-3 py-3">Correct</th>
                  <th className="text-left px-3 py-3">Time</th>
                  <th className="text-left px-3 py-3"><SortBtn k="difficulty" label="Difficulty" /></th>
                  <th className="text-left px-3 py-3"><SortBtn k="createdAt" label="Date" /></th>
                  <th className="text-left px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(entry => {
                  if (editingId === entry.id) {
                    return (
                      <EditRow
                        key={entry.id}
                        entry={entry}
                        onSave={handleSave}
                        onCancel={() => setEditingId(null)}
                      />
                    )
                  }
                  return (
                    <tr key={entry.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-3 font-serif text-cream">{entry.name}</td>
                      <td className="px-3 py-3 font-mono text-gold font-semibold">
                        {Math.round(entry.score).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 font-mono text-cream/70">{entry.correct}/10</td>
                      <td className="px-3 py-3 font-mono text-cream/50">{formatTime(entry.totalTimeMs)}</td>
                      <td className="px-3 py-3">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                          entry.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' :
                          entry.difficulty === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {entry.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-cream/40">
                        {new Date(entry.createdAt).toLocaleDateString()}
                        {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                          <span className="ml-1 text-gold/40" title={`Updated ${new Date(entry.updatedAt).toLocaleString()}`}>✎</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {deletingId === entry.id ? (
                          <div className="flex gap-2 items-center">
                            <span className="text-red-400 text-xs font-mono">Delete?</span>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="px-2 py-1 rounded text-xs font-mono bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 rounded text-xs font-mono bg-white/10 text-cream/60 hover:bg-white/20 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingId(entry.id); setDeletingId(null) }}
                              className="px-3 py-1 rounded text-xs font-mono bg-white/10 text-cream/70 hover:bg-white/20 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setDeletingId(entry.id); setEditingId(null) }}
                              className="px-3 py-1 rounded text-xs font-mono bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-cream/30 font-mono text-sm py-10">
                      No entries match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let unsub: (() => void) | undefined
    import('@/lib/firebase').then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        unsub = onAuthStateChanged(auth, u => {
          setUser(u)
          setChecking(false)
        })
      })
    })
    return () => unsub?.()
  }, [])

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase')
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-cream/30 font-mono text-sm animate-pulse">Checking auth…</p>
      </main>
    )
  }

  if (!user) return <LoginForm onLogin={setUser} />
  return <Dashboard user={user} onLogout={handleLogout} />
}

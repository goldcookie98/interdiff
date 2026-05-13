'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function RoomPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = async () => {
    setCreating(true)
    setError(null)
    try {
      const { db } = await import('@/lib/firebase')
      if (!db) throw new Error('Firebase not initialised')
      const { doc, setDoc, getDoc } = await import('firebase/firestore')
      const { getUserId, getUsername } = await import('@/lib/user')

      const userId = getUserId()
      const username = getUsername() ?? 'Anonymous'

      let code = generateCode()
      // retry if code already exists
      for (let attempt = 0; attempt < 5; attempt++) {
        const ref = doc(db, 'rooms', code)
        const snap = await getDoc(ref)
        if (!snap.exists()) break
        code = generateCode()
      }

      const ref = doc(db, 'rooms', code)
      await setDoc(ref, {
        code,
        hostId: userId,
        status: 'lobby',
        settings: { difficulty: 'easy', mode: 'both' },
        questions: [],
        createdAt: Date.now(),
        startedAt: null,
        players: {
          [userId]: { name: username, progress: 0, done: false, score: null, correct: null, totalTimeMs: null },
        },
      })

      router.push(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room')
      setCreating(false)
    }
  }

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)
    setError(null)
    try {
      const { db } = await import('@/lib/firebase')
      if (!db) throw new Error('Firebase not initialised')
      const { doc, getDoc } = await import('firebase/firestore')

      const ref = doc(db, 'rooms', code)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Room not found — check the code and try again')
      const room = snap.data()
      if (room.status === 'playing') throw new Error('Game already in progress in this room')
      if (room.status === 'finished') throw new Error('This room\'s game has ended')

      router.push(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room')
      setJoining(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        <div className="text-center">
          <Link href="/" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">
            ← InterDiff
          </Link>
          <h1 className="font-serif text-4xl font-bold text-cream mt-4 mb-2">Group Room</h1>
          <p className="text-cream/60 font-serif italic">Compete with friends in real time</p>
        </div>

        {error && (
          <div className="card border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        <div className="card space-y-4">
          <h2 className="font-serif text-xl text-cream">Create a Room</h2>
          <p className="text-cream/50 text-sm font-mono">
            Start a new room and invite friends with a 6-character code.
          </p>
          <button
            type="button"
            onClick={createRoom}
            disabled={creating}
            className="w-full py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}
          >
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
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="XXXXXX"
            maxLength={6}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-cream font-mono text-center text-2xl tracking-[0.4em] focus:outline-none focus:border-gold/50 placeholder:text-cream/20 placeholder:tracking-[0.4em]"
          />
          <button
            type="button"
            onClick={joinRoom}
            disabled={joining || joinCode.trim().length < 6}
            className="w-full py-3 rounded-xl font-semibold border border-white/20 text-cream transition-all duration-200 hover:border-white/40 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white/5"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {joining ? 'Joining…' : 'Join Room'}
          </button>
        </div>
      </div>
    </main>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { getUsername, setUsername } from '@/lib/user'

export default function UsernameModal() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!getUsername()) setOpen(true)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  if (!open) return null

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Please enter a name'); return }
    if (trimmed.length > 24) { setError('Max 24 characters'); return }
    setUsername(trimmed)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm">
      <div className="card max-w-sm w-full mx-4 space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="font-mono text-gold/60 text-sm tracking-widest uppercase mb-3">Welcome</div>
          <h2 className="font-serif text-3xl font-bold text-cream">Choose a name</h2>
          <p className="text-cream/50 font-serif italic mt-2 text-sm">
            This appears on the leaderboard. You can&apos;t change it later.
          </p>
        </div>
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Your name…"
            maxLength={24}
            className="w-full rounded-xl px-4 py-3 font-mono placeholder:text-cream/30 focus:outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--cream)',
            }}
          />
          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}
          >
            Let&apos;s go →
          </button>
        </div>
      </div>
    </div>
  )
}

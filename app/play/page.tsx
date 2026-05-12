'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { generateQuestions, type Question, type Difficulty } from '@/lib/questions'
import { checkAnswer } from '@/lib/answerCheck'
import QuestionCard from '@/components/QuestionCard'
import MathInput from '@/components/MathInput'
import Leaderboard from '@/components/Leaderboard'

type Phase = 'select' | 'game' | 'result'

interface Result {
  question: Question
  userAnswer: string
  correct: boolean
  timeMs: number
}

const DIFF_CONFIG: Record<Difficulty, { label: string; desc: string; color: string; textColor: string }> = {
  easy:   { label: 'Easy',   desc: 'Power rule, e^x, ln(x), trig basics',   color: 'border-emerald-500/50 bg-emerald-500/10', textColor: 'text-emerald-400' },
  medium: { label: 'Medium', desc: 'Chain rule, product rule, substitution', color: 'border-amber-500/50 bg-amber-500/10',     textColor: 'text-amber-400'   },
  hard:   { label: 'Hard',   desc: 'By parts, partial fractions, implicit',  color: 'border-red-500/50 bg-red-500/10',         textColor: 'text-red-400'     },
}

function CorrectAnswerDisplay({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try { katex.render(latex, ref.current, { throwOnError: false }) }
    catch { if (ref.current) ref.current.textContent = latex }
  }, [latex])
  return <span ref={ref} className="inline-block" />
}

function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    setElapsed(0)
    const id = setInterval(() => {
      setElapsed(Date.now() - startRef.current)
    }, 100)
    return () => clearInterval(id)
  }, [running])

  return elapsed
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}s`
}

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>('select')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [noTrig, setNoTrig] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [totalMs, setTotalMs] = useState(0)
  const [startError, setStartError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [leaderboardId, setLeaderboardId] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const gameStartRef = useRef(0)
  const qStartRef = useRef(0)

  const timerRunning = phase === 'game' && !feedback
  const elapsed = useElapsedTimer(timerRunning)

  const startGame = () => {
    setStartError(null)
    try {
      const qs = generateQuestions(difficulty, 10, { noTrig })
      setQuestions(qs)
      setQIndex(0)
      setResults([])
      setAnswer('')
      setFeedback(null)
      gameStartRef.current = Date.now()
      qStartRef.current = Date.now()
      setPhase('game')
    } catch (e) {
      console.error('startGame error:', e)
      setStartError('Something went wrong generating questions. Try again.')
    }
  }

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || feedback) return
    const q = questions[qIndex]
    if (!q) return
    const isCorrect = checkAnswer(answer, q.answer)
    const qTime = Date.now() - qStartRef.current

    setFeedback(isCorrect ? 'correct' : 'incorrect')

    setTimeout(() => {
      const newResults = [...results, { question: q, userAnswer: answer, correct: isCorrect, timeMs: qTime }]
      if (qIndex + 1 >= questions.length) {
        setTotalMs(Date.now() - gameStartRef.current)
        setResults(newResults)
        setPhase('result')
      } else {
        setResults(newResults)
        setQIndex(qi => qi + 1)
        setAnswer('')
        setFeedback(null)
        qStartRef.current = Date.now()
      }
    }, 1200)
  }, [answer, questions, qIndex, results, feedback])

  const submitScore = async () => {
    if (!displayName.trim() || submitting) return
    const correct = results.filter(r => r.correct).length
    const score = correct * (1000000 / totalMs) * 10
    setSubmitting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc } = await import('firebase/firestore')
      const doc = await addDoc(collection(db, 'leaderboard'), {
        name: displayName.trim(),
        score,
        correct,
        totalTimeMs: totalMs,
        difficulty,
        createdAt: Date.now(),
      })
      setLeaderboardId(doc.id)
      setSubmitted(true)
      setShowLeaderboard(true)
    } catch (e) {
      console.error('submitScore error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Select ───────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full space-y-6 animate-fade-in">
          <div className="text-center">
            <Link href="/" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">
              ← InterDiff
            </Link>
            <h1 className="font-serif text-4xl font-bold text-cream mt-4 mb-2">Sprint 10</h1>
            <p className="text-cream/60 font-serif italic">10 questions · timed · no mercy</p>
          </div>

          <div className="space-y-3">
            {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => {
              const cfg = DIFF_CONFIG[d]
              const selected = difficulty === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selected ? cfg.color : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{ backgroundColor: selected ? undefined : 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-serif text-lg font-semibold ${selected ? cfg.textColor : 'text-cream'}`}>
                        {cfg.label}
                      </div>
                      <div className="text-cream/50 text-xs font-mono mt-1">{cfg.desc}</div>
                    </div>
                    {selected && <span className={`text-xl ${cfg.textColor}`}>✓</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* No trig toggle */}
          <button
            type="button"
            onClick={() => setNoTrig(v => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
              noTrig ? 'border-gold/50' : 'border-white/10 hover:border-white/20'
            }`}
            style={{ backgroundColor: noTrig ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-left">
              <div className={`font-serif text-base font-semibold ${noTrig ? 'text-gold' : 'text-cream/70'}`}>
                No trig
              </div>
              <div className="text-cream/40 text-xs font-mono mt-0.5">
                Only algebra, exponentials &amp; logarithms
              </div>
            </div>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              noTrig ? 'border-gold' : 'border-white/30'
            }`} style={{ backgroundColor: noTrig ? 'var(--gold)' : undefined }}>
              {noTrig && <span className="text-navy text-xs font-bold leading-none">✓</span>}
            </div>
          </button>

          {startError && (
            <p className="text-red-400 text-sm font-mono text-center">{startError}</p>
          )}

          <button
            type="button"
            onClick={startGame}
            className="w-full text-xl py-4 rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}
          >
            Begin
          </button>

          <div className="text-center">
            <Link href="/leaderboard" className="text-gold/60 text-sm font-mono hover:text-gold transition-colors">
              View leaderboard →
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ─── Game ─────────────────────────────────────────────────────────────────
  if (phase === 'game') {
    const q = questions[qIndex]
    if (!q) return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-cream/50 font-mono">Loading question…</p>
      </main>
    )

    return (
      <main className="min-h-screen flex flex-col px-4 py-6">
        <div className="max-w-2xl w-full mx-auto flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setPhase('select')}
            className="text-cream/30 text-sm font-mono hover:text-cream/60 transition-colors cursor-pointer"
          >
            ← quit
          </button>
          <div className="text-center">
            <div className="text-gold font-mono text-2xl font-bold tabular-nums">
              {formatElapsed(elapsed)}
            </div>
            <div className="text-cream/30 text-xs font-mono">elapsed</div>
          </div>
          <div className="text-cream/40 text-sm font-mono capitalize">{difficulty}</div>
        </div>

        <div className="max-w-2xl w-full mx-auto flex-1 space-y-6">
          <div className={`transition-all duration-300 ${feedback ? 'opacity-70' : 'opacity-100'}`}>
            <QuestionCard question={q} index={qIndex} total={questions.length} />
          </div>

          {feedback && (
            <div className={`rounded-xl p-4 text-center font-serif text-lg font-semibold border animate-slide-in ${
              feedback === 'correct'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/20 border-red-500/40 text-red-400'
            }`}>
              {feedback === 'correct'
                ? '✓ Correct!'
                : <span>✗ Incorrect — answer: <CorrectAnswerDisplay latex={q.answer} /></span>
              }
            </div>
          )}

          {!feedback && (
            <div className="space-y-4">
              <MathInput value={answer} onChange={setAnswer} onSubmit={handleSubmit} placeholder="Enter your answer…" />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="w-full py-4 text-lg rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}
              >
                Submit Answer →
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  const correctCount = results.filter(r => r.correct).length
  const score = correctCount * (1000000 / Math.max(totalMs, 1)) * 10

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="card text-center space-y-4">
          <div className="font-serif text-5xl font-bold text-gold">{Math.round(score).toLocaleString()}</div>
          <div className="text-cream/50 font-mono text-sm">points</div>
          <div className="flex justify-center gap-8 pt-2">
            <div className="text-center">
              <div className="font-mono text-2xl text-cream">{correctCount}/10</div>
              <div className="text-cream/40 text-xs font-mono">correct</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl text-cream">{(totalMs / 1000).toFixed(2)}s</div>
              <div className="text-cream/40 text-xs font-mono">total time</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl text-cream capitalize">{difficulty}</div>
              <div className="text-cream/40 text-xs font-mono">difficulty</div>
            </div>
          </div>
        </div>

        {!submitted ? (
          <div className="card space-y-4">
            <h2 className="font-serif text-xl text-cream">Submit to Leaderboard</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitScore()}
                placeholder="Your display name…"
                maxLength={24}
                className="flex-1 rounded-xl px-4 py-3 font-mono placeholder:text-cream/30 focus:outline-none transition-colors"
                style={{ backgroundColor: 'var(--navy)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--cream)' }}
              />
              <button
                type="button"
                onClick={submitScore}
                disabled={!displayName.trim() || submitting}
                className="px-6 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
              >
                {submitting ? '…' : 'Submit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card text-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <p className="text-emerald-400 font-serif text-lg">Score submitted!</p>
            <button
              type="button"
              onClick={() => setShowLeaderboard(v => !v)}
              className="text-cream/50 text-sm font-mono mt-2 hover:text-cream transition-colors cursor-pointer"
            >
              {showLeaderboard ? 'Hide' : 'Show'} leaderboard
            </button>
          </div>
        )}

        {showLeaderboard && (
          <div className="card animate-fade-in">
            <Leaderboard highlightId={leaderboardId} defaultDifficulty={difficulty} compact />
          </div>
        )}

        <div className="card space-y-3">
          <h2 className="font-serif text-xl text-cream mb-4">Results Breakdown</h2>
          {results.map((r, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
              r.correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
            }`}>
              <span className={`flex-shrink-0 font-mono ${r.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                {r.correct ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-cream/50 font-mono text-xs mb-1">
                  Q{i + 1} · {r.question.type} · {(r.timeMs / 1000).toFixed(1)}s
                </div>
                <div className="text-cream/70 text-xs">
                  Your answer: <code className="text-cream/90">{r.userAnswer || '—'}</code>
                </div>
                {!r.correct && (
                  <div className="text-cream/50 text-xs mt-1">
                    Correct: <CorrectAnswerDisplay latex={r.question.answer} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setPhase('select'); setSubmitted(false); setShowLeaderboard(false) }}
            className="flex-1 py-3 rounded-xl font-semibold cursor-pointer transition-all active:scale-95"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}
          >
            Play Again
          </button>
          <Link href="/leaderboard" className="btn-outline flex-1 text-center py-3">
            Full Leaderboard
          </Link>
        </div>
      </div>
    </main>
  )
}

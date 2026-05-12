'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { generateQuestions, type Question, type Difficulty } from '@/lib/questions'
import { checkAnswer } from '@/lib/answerCheck'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
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

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   desc: 'Power rule, basic trig, e^x, ln(x)',       color: 'emerald' },
  medium: { label: 'Medium', desc: 'Chain rule, product rule, substitution',    color: 'amber'   },
  hard:   { label: 'Hard',   desc: 'By parts, partial fractions, trig sub',     color: 'red'     },
}

function CorrectAnswerDisplay({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) {
      try { katex.render(latex, ref.current, { throwOnError: false }) }
      catch { if (ref.current) ref.current.textContent = latex }
    }
  }, [latex])
  return <span ref={ref} className="inline-block" />
}

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>('select')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [totalMs, setTotalMs] = useState(0)
  const [qStartMs, setQStartMs] = useState(0)
  const [gameStartMs, setGameStartMs] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [leaderboardId, setLeaderboardId] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const startGame = useCallback(() => {
    const qs = generateQuestions(difficulty, 10)
    setQuestions(qs)
    setQIndex(0)
    setResults([])
    setAnswer('')
    setFeedback(null)
    const now = Date.now()
    setGameStartMs(now)
    setQStartMs(now)
    setPhase('game')
  }, [difficulty])

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) return
    const now = Date.now()
    const q = questions[qIndex]
    const isCorrect = checkAnswer(answer, q.answer)
    const qTime = now - qStartMs

    const result: Result = {
      question: q,
      userAnswer: answer,
      correct: isCorrect,
      timeMs: qTime,
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect')

    setTimeout(() => {
      const newResults = [...results, result]
      if (qIndex + 1 >= questions.length) {
        const total = Date.now() - gameStartMs
        setTotalMs(total)
        setResults(newResults)
        setPhase('result')
      } else {
        setResults(newResults)
        setQIndex(qIndex + 1)
        setAnswer('')
        setFeedback(null)
        setQStartMs(Date.now())
      }
    }, 1200)
  }, [answer, questions, qIndex, results, qStartMs, gameStartMs])

  const submitScore = async () => {
    if (!displayName.trim() || submitting) return
    const correct = results.filter(r => r.correct).length
    const score = correct * (1000000 / totalMs) * 10
    setSubmitting(true)
    try {
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
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const correctCount = results.filter(r => r.correct).length

  // ─── Select phase ─────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full space-y-8 animate-fade-in">
          <div className="text-center">
            <Link href="/" className="text-cream/40 text-sm font-mono hover:text-cream/70 transition-colors">
              ← InteDiff
            </Link>
            <h1 className="font-serif text-4xl font-bold text-cream mt-4 mb-2">Sprint 10</h1>
            <p className="text-cream/60 font-serif italic">10 questions · timed · no mercy</p>
          </div>

          <div className="space-y-3">
            {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => {
              const cfg = DIFF_CONFIG[d]
              const selected = difficulty === d
              const colors: Record<string, string> = {
                emerald: 'border-emerald-500/50 bg-emerald-500/10',
                amber:   'border-amber-500/50 bg-amber-500/10',
                red:     'border-red-500/50 bg-red-500/10',
              }
              const textColors: Record<string, string> = {
                emerald: 'text-emerald-400',
                amber:   'text-amber-400',
                red:     'text-red-400',
              }
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all duration-200
                    ${selected ? colors[cfg.color] : 'border-white/10 bg-white/3 hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-serif text-lg font-semibold ${selected ? textColors[cfg.color] : 'text-cream'}`}>
                        {cfg.label}
                      </div>
                      <div className="text-cream/50 text-xs font-mono mt-1">{cfg.desc}</div>
                    </div>
                    {selected && (
                      <div className={`text-xl ${textColors[cfg.color]}`}>✓</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <button onClick={startGame} className="btn-gold w-full text-xl py-4">
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

  // ─── Game phase ───────────────────────────────────────────────────────────
  if (phase === 'game') {
    const q = questions[qIndex]
    const elapsed = Date.now() - gameStartMs

    return (
      <main className="min-h-screen flex flex-col px-4 py-6">
        {/* Header */}
        <div className="max-w-2xl w-full mx-auto flex items-center justify-between mb-6">
          <Link href="/" className="text-cream/30 text-sm font-mono hover:text-cream/60 transition-colors">
            ← quit
          </Link>
          <div className="text-center">
            <div className="text-gold font-mono text-2xl font-bold tabular-nums">
              {String(Math.floor(elapsed / 1000)).padStart(2, '0')}.
              {String(Math.floor((elapsed % 1000) / 10)).padStart(2, '0')}s
            </div>
            <div className="text-cream/30 text-xs font-mono">elapsed</div>
          </div>
          <div className="text-cream/40 text-sm font-mono capitalize">{difficulty}</div>
        </div>

        <div className="max-w-2xl w-full mx-auto flex-1 space-y-6">
          {/* Question */}
          <div className={`transition-all duration-300 ${feedback ? 'opacity-70' : 'opacity-100'}`}>
            <QuestionCard question={q} index={qIndex} total={questions.length} />
          </div>

          {/* Feedback overlay */}
          {feedback && (
            <div className={`
              rounded-xl p-4 text-center font-serif text-lg font-semibold border animate-slide-in
              ${feedback === 'correct'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/20 border-red-500/40 text-red-400'
              }
            `}>
              {feedback === 'correct' ? (
                '✓ Correct!'
              ) : (
                <span>
                  ✗ Incorrect — answer: <CorrectAnswerDisplay latex={q.answer} />
                </span>
              )}
            </div>
          )}

          {/* Input */}
          {!feedback && (
            <div className="space-y-4">
              <MathInput
                value={answer}
                onChange={setAnswer}
                onSubmit={handleSubmit}
                placeholder="Enter your answer…"
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="btn-gold w-full py-4 text-lg"
              >
                Submit Answer →
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ─── Result phase ─────────────────────────────────────────────────────────
  const score = correctCount * (1000000 / totalMs) * 10
  const totalSecs = totalMs / 1000

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        {/* Score card */}
        <div className="card text-center space-y-4">
          <div className="font-serif text-5xl font-bold text-gold">
            {Math.round(score).toLocaleString()}
          </div>
          <div className="text-cream/50 font-mono text-sm">points</div>

          <div className="flex justify-center gap-8 pt-2">
            <div className="text-center">
              <div className="font-mono text-2xl text-cream">{correctCount}/10</div>
              <div className="text-cream/40 text-xs font-mono">correct</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl text-cream">{totalSecs.toFixed(2)}s</div>
              <div className="text-cream/40 text-xs font-mono">total time</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl text-cream capitalize">{difficulty}</div>
              <div className="text-cream/40 text-xs font-mono">difficulty</div>
            </div>
          </div>
        </div>

        {/* Submit to leaderboard */}
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
                className="flex-1 bg-navy border border-white/15 rounded-xl px-4 py-3 text-cream font-mono placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
              />
              <button
                onClick={submitScore}
                disabled={!displayName.trim() || submitting}
                className="btn-gold px-6"
              >
                {submitting ? '…' : 'Submit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card bg-emerald-500/10 border-emerald-500/30 text-center">
            <p className="text-emerald-400 font-serif text-lg">Score submitted!</p>
            <button
              onClick={() => setShowLeaderboard(v => !v)}
              className="text-cream/50 text-sm font-mono mt-2 hover:text-cream transition-colors"
            >
              {showLeaderboard ? 'Hide' : 'Show'} leaderboard
            </button>
          </div>
        )}

        {/* Inline leaderboard after submit */}
        {showLeaderboard && (
          <div className="card animate-fade-in">
            <Leaderboard highlightId={leaderboardId} defaultDifficulty={difficulty} compact />
          </div>
        )}

        {/* Results breakdown */}
        <div className="card space-y-3">
          <h2 className="font-serif text-xl text-cream mb-4">Results Breakdown</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={`
                flex items-start gap-3 p-3 rounded-lg border text-sm
                ${r.correct
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-red-500/20 bg-red-500/5'
                }
              `}
            >
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

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={() => setPhase('select')} className="btn-gold flex-1">
            Play Again
          </button>
          <Link href="/leaderboard" className="btn-outline flex-1 text-center">
            Full Leaderboard
          </Link>
        </div>
      </div>
    </main>
  )
}

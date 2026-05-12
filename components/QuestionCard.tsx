'use client'
import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Question } from '@/lib/questions'

interface QuestionCardProps {
  question: Question
  index: number
  total: number
}

export default function QuestionCard({ question, index, total }: QuestionCardProps) {
  const exprRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (exprRef.current) {
      try {
        katex.render(question.expression, exprRef.current, {
          throwOnError: false,
          displayMode: true,
          trust: true,
        })
      } catch {
        exprRef.current.textContent = question.expression
      }
    }
  }, [question.expression])

  const verb = question.type === 'differentiate' ? 'Differentiate' : 'Integrate'
  const wrtx = question.type === 'integrate' ? ' with respect to x' : ''

  return (
    <div className="question-card">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-cream/50 mb-1 font-mono">
          <span>Question {index + 1} of {total}</span>
          <span className="capitalize text-gold">{question.difficulty}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question type badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono border border-gold/40 text-gold bg-gold/10">
          {question.type === 'differentiate' ? 'd/dx' : '∫ dx'}
        </span>
      </div>

      {/* Instruction */}
      <p className="text-cream/70 font-serif text-lg mb-4">
        {verb} the following{wrtx}:
      </p>

      {/* Expression */}
      <div className="bg-navy-light/50 border border-white/10 rounded-xl p-6 flex items-center justify-center min-h-[100px]">
        <span ref={exprRef} className="text-cream text-2xl" />
      </div>
    </div>
  )
}

'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathInputProps {
  value: string
  onChange: (latex: string) => void
  onSubmit?: () => void
  placeholder?: string
}

type PaletteSection = {
  label: string
  keys: Array<{ display: string; insert: string; isLatex?: boolean }>
}

const PALETTE: PaletteSection[] = [
  {
    label: 'Numbers',
    keys: [
      ...['7','8','9','4','5','6','1','2','3','0'].map(n => ({ display: n, insert: n })),
      { display: '.', insert: '.' },
      { display: '−', insert: '-' },
    ],
  },
  {
    label: 'Variables',
    keys: [
      { display: 'x', insert: 'x' },
      { display: 'y', insert: 'y' },
      { display: 'n', insert: 'n' },
      { display: 'a', insert: 'a' },
      { display: 'e', insert: 'e' },
      { display: 'π', insert: '\\pi' },
      { display: 'α', insert: '\\alpha' },
      { display: 'β', insert: '\\beta' },
      { display: 'θ', insert: '\\theta' },
      { display: 'C', insert: 'C' },
    ],
  },
  {
    label: 'Operators',
    keys: [
      { display: '+', insert: '+' },
      { display: '×', insert: '\\cdot' },
      { display: '÷', insert: '/' },
      { display: '=', insert: '=' },
      { display: '(', insert: '(' },
      { display: ')', insert: ')' },
      { display: '|x|', insert: '|', isLatex: false },
    ],
  },
  {
    label: 'Powers & Roots',
    keys: [
      { display: 'x²', insert: '^{2}' },
      { display: 'x³', insert: '^{3}' },
      { display: 'xⁿ', insert: '^{}', isLatex: false },
      { display: '√x', insert: '\\sqrt{}' },
      { display: 'ⁿ√x', insert: '\\sqrt[n]{}' },
      { display: 'x½', insert: '^{\\frac{1}{2}}' },
    ],
  },
  {
    label: 'Fractions',
    keys: [
      { display: 'a/b', insert: '\\frac{}{}' },
      { display: '½', insert: '\\frac{1}{2}' },
      { display: '⅓', insert: '\\frac{1}{3}' },
      { display: '¼', insert: '\\frac{1}{4}' },
    ],
  },
  {
    label: 'Functions',
    keys: [
      { display: 'sin', insert: '\\sin ' },
      { display: 'cos', insert: '\\cos ' },
      { display: 'tan', insert: '\\tan ' },
      { display: 'ln', insert: '\\ln ' },
      { display: 'log', insert: '\\log ' },
      { display: 'eˣ', insert: 'e^{}' },
      { display: 'arcsin', insert: '\\arcsin ' },
      { display: 'arccos', insert: '\\arccos ' },
      { display: 'arctan', insert: '\\arctan ' },
      { display: 'sec', insert: '\\sec ' },
      { display: 'csc', insert: '\\csc ' },
      { display: 'cot', insert: '\\cot ' },
    ],
  },
  {
    label: 'Calculus',
    keys: [
      { display: '∫', insert: '\\int ' },
      { display: 'd/dx', insert: '\\frac{d}{dx}' },
      { display: '+ C', insert: ' + C' },
      { display: 'lim', insert: '\\lim_{x\\to}' },
      { display: '∞', insert: '\\infty' },
    ],
  },
]

export default function MathInput({ value, onChange, onSubmit, placeholder }: MathInputProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showPalette, setShowPalette] = useState(true)
  const [activeSection, setActiveSection] = useState(0)
  const [, setCursorPos] = useState<number>(0)

  // Render KaTeX preview
  useEffect(() => {
    if (!previewRef.current) return
    if (!value.trim()) {
      previewRef.current.innerHTML = `<span class="text-cream/30">${placeholder ?? 'Your answer…'}</span>`
      return
    }
    try {
      katex.render(value, previewRef.current, {
        throwOnError: false,
        displayMode: false,
        trust: true,
      })
    } catch {
      previewRef.current.textContent = value
    }
  }, [value, placeholder])

  const insert = useCallback((text: string) => {
    const input = inputRef.current
    const pos = input ? (input.selectionStart ?? value.length) : value.length
    const newVal = value.slice(0, pos) + text + value.slice(pos)
    onChange(newVal)
    const newPos = pos + text.length
    setCursorPos(newPos)
    setTimeout(() => {
      input?.focus()
      input?.setSelectionRange(newPos, newPos)
    }, 0)
  }, [value, onChange])

  const backspace = useCallback(() => {
    const input = inputRef.current
    const pos = input ? (input.selectionStart ?? value.length) : value.length
    if (pos === 0) return
    // Try to delete a full LaTeX command \xxx
    const before = value.slice(0, pos)
    const cmdMatch = before.match(/\\[a-zA-Z]+\s?$/)
    if (cmdMatch) {
      const removed = cmdMatch[0].length
      onChange(value.slice(0, pos - removed) + value.slice(pos))
      const newPos = pos - removed
      setCursorPos(newPos)
      setTimeout(() => { input?.focus(); input?.setSelectionRange(newPos, newPos) }, 0)
      return
    }
    const newVal = value.slice(0, pos - 1) + value.slice(pos)
    onChange(newVal)
    const newPos = pos - 1
    setCursorPos(newPos)
    setTimeout(() => { input?.focus(); input?.setSelectionRange(newPos, newPos) }, 0)
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit?.() }
    if (e.key === 'Backspace') { e.preventDefault(); backspace() }
  }

  return (
    <div className="w-full space-y-3">
      {/* Live preview box */}
      <div
        className="relative bg-navy-light border border-white/20 rounded-xl p-4 min-h-[64px] flex items-center cursor-text focus-within:border-gold/60 transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        <div ref={previewRef} className="text-cream text-xl w-full overflow-x-auto katex-preview" />
        {/* Hidden real input for keyboard events */}
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute opacity-0 w-0 h-0"
          aria-label="Math input"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Palette toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPalette(v => !v)}
          className="text-xs text-cream/50 hover:text-gold transition-colors font-mono border border-white/10 rounded px-2 py-1"
        >
          {showPalette ? '▲ Hide keyboard' : '▼ Show keyboard'}
        </button>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono border border-red-400/20 rounded px-2 py-1"
          >
            Clear
          </button>
        )}
        <button
          onClick={backspace}
          className="text-xs text-cream/50 hover:text-cream transition-colors font-mono border border-white/10 rounded px-2 py-1"
        >
          ⌫
        </button>
      </div>

      {showPalette && (
        <div className="bg-navy-light border border-white/10 rounded-xl overflow-hidden">
          {/* Section tabs */}
          <div className="flex overflow-x-auto border-b border-white/10 scrollbar-hide">
            {PALETTE.map((section, i) => (
              <button
                key={section.label}
                onClick={() => setActiveSection(i)}
                className={`px-3 py-2 text-xs font-mono whitespace-nowrap flex-shrink-0 transition-colors ${
                  i === activeSection
                    ? 'text-gold border-b-2 border-gold bg-gold/5'
                    : 'text-cream/50 hover:text-cream/80'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Keys */}
          <div className="p-3 grid grid-cols-5 sm:grid-cols-7 gap-2">
            {PALETTE[activeSection].keys.map((key, i) => (
              <button
                key={i}
                onClick={() => insert(key.insert)}
                className="math-key"
                title={key.insert}
              >
                {key.display}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

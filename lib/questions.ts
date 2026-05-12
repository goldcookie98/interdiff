export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'differentiate' | 'integrate'

export interface Question {
  id: string
  type: QuestionType
  difficulty: Difficulty
  expression: string
  answer: string
}


function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a || 1
}

// ─── LaTeX helpers ────────────────────────────────────────────────────────────

function termLatex(coeff: number, power: number): string {
  if (power === 0) return String(coeff)
  const v = power === 1 ? 'x' : `x^{${power}}`
  if (coeff === 1) return v
  if (coeff === -1) return `-${v}`
  return `${coeff}${v}`
}

// Render a fraction coefficient times x^power
function fracTermLatex(num: number, den: number, power: number): string {
  const g = gcd(Math.abs(num), Math.abs(den))
  const n = num / g
  const d = den / g
  const negative = n < 0
  const absN = Math.abs(n)
  const absD = Math.abs(d)
  const sign = negative ? '-' : ''
  const v = power === 0 ? '' : power === 1 ? 'x' : `x^{${power}}`

  if (absD === 1) {
    if (power === 0) return `${sign}${absN}`
    if (absN === 1) return `${sign}${v}`
    return `${sign}${absN}${v}`
  }
  // proper fraction
  if (power === 0) return `${sign}\\frac{${absN}}{${absD}}`
  return `${sign}\\frac{${absN}}{${absD}}${v}`
}

// Join term strings respecting sign (each part already has its sign)
function joinTerms(parts: string[]): string {
  let out = ''
  for (const p of parts) {
    if (!out) { out = p; continue }
    if (p.startsWith('-')) out += ` ${p}`
    else out += ` + ${p}`
  }
  return out || '0'
}

// ─── Single-term generators ───────────────────────────────────────────────────

type TermSpec = { coeff: number; power: number }

function diffTerm(s: TermSpec): string | null {
  if (s.power === 0) return null  // constant vanishes
  const newC = s.coeff * s.power
  const newP = s.power - 1
  return termLatex(newC, newP)
}

function intTerm(s: TermSpec): string {
  // ∫ coeff·xⁿ dx = coeff/(n+1)·x^(n+1)
  return fracTermLatex(s.coeff, s.power + 1, s.power + 1)
}

// ─── Question builders ────────────────────────────────────────────────────────

function makeDiff(terms: TermSpec[], difficulty: Difficulty, id: number): Question {
  const expr = joinTerms(terms.map(t => termLatex(t.coeff, t.power)))
  const diffParts = terms.map(t => diffTerm(t)).filter((x): x is string => x !== null)
  const ans = diffParts.length ? joinTerms(diffParts) : '0'
  return { id: `diff-${difficulty}-${id}-${Date.now()}`, type: 'differentiate', difficulty, expression: expr, answer: ans }
}

function makeInt(terms: TermSpec[], difficulty: Difficulty, id: number): Question {
  const expr = joinTerms(terms.map(t => termLatex(t.coeff, t.power)))
  const intParts = terms.map(t => intTerm(t))
  const ans = joinTerms(intParts) + ' + C'
  return { id: `int-${difficulty}-${id}-${Date.now()}`, type: 'integrate', difficulty, expression: expr, answer: ans }
}

// Pick unique powers, ordered descending
function uniquePowers(count: number, minPow: number, maxPow: number): number[] {
  const pool: number[] = []
  for (let p = minPow; p <= maxPow; p++) pool.push(p)
  // fisher-yates shuffle then take count
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count).sort((a, b) => b - a)
}

// ─── Generate ─────────────────────────────────────────────────────────────────

export function generateQuestions(difficulty: Difficulty, count = 10): Question[] {
  const questions: Question[] = []

  for (let i = 0; i < count; i++) {
    const isDiff = Math.random() < 0.5
    let terms: TermSpec[]

    if (difficulty === 'easy') {
      // Single term: ax^n, n ∈ [2,6], a ∈ [2,9]
      const power = rand(2, 6)
      const coeff = rand(2, 9)
      terms = [{ coeff, power }]

    } else if (difficulty === 'medium') {
      // Two terms with distinct powers from [1,7], coefficients [1,8]
      const powers = uniquePowers(2, 1, 7)
      terms = powers.map(p => ({ coeff: rand(1, 8), power: p }))

    } else {
      // Three terms with distinct powers from [0,8], coefficients [1,9]
      const powers = uniquePowers(3, 0, 8)
      terms = powers.map(p => ({ coeff: rand(1, 9), power: p }))
    }

    questions.push(isDiff ? makeDiff(terms, difficulty, i) : makeInt(terms, difficulty, i))
  }

  return questions
}

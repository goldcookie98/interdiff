export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'differentiate' | 'integrate'

export interface Question {
  id: string
  type: QuestionType
  difficulty: Difficulty
  expression: string   // LaTeX
  answer: string       // LaTeX (canonical)
  hint?: string
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function coeff(n: number): string {
  if (n === 1) return ''
  if (n === -1) return '-'
  return String(n)
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

// ─── Easy templates ──────────────────────────────────────────────────────────

const easyDiff: Array<() => [string, string]> = [
  // ax^n → anx^(n-1)
  () => {
    const a = rand(1, 8), n = rand(2, 7)
    const an = a * n
    const nm1 = n - 1
    const expr = `${coeff(a)}x^{${n}}`
    const ans = nm1 === 1 ? `${an}x` : `${an}x^{${nm1}}`
    return [expr, ans]
  },
  // ax → a
  () => {
    const a = rand(2, 12)
    return [`${a}x`, String(a)]
  },
  // constant
  () => {
    const a = rand(1, 20)
    return [String(a), '0']
  },
  // e^x
  () => ['e^x', 'e^x'],
  // ae^x
  () => {
    const a = rand(2, 9)
    return [`${a}e^x`, `${a}e^x`]
  },
  // ln x
  () => ['\\ln x', '\\frac{1}{x}'],
  // sin x
  () => ['\\sin x', '\\cos x'],
  // cos x
  () => ['\\cos x', '-\\sin x'],
  // a sin x
  () => {
    const a = rand(2, 8)
    return [`${a}\\sin x`, `${a}\\cos x`]
  },
  // a cos x
  () => {
    const a = rand(2, 8)
    return [`${a}\\cos x`, `-${a}\\sin x`]
  },
  // x^n + ax
  () => {
    const n = rand(2, 5), a = rand(1, 7)
    return [`x^{${n}} ${signed(a)}x`, `${n}x^{${n-1}} ${signed(a)}`]
  },
  // sqrt(x) = x^(1/2) → 1/(2sqrt(x))
  () => ['\\sqrt{x}', '\\frac{1}{2\\sqrt{x}}'],
  // 1/x = x^-1 → -1/x^2
  () => ['\\frac{1}{x}', '-\\frac{1}{x^2}'],
  // x^(1/2) + c style — just ax^n
  () => {
    const a = rand(1, 6), n = rand(3, 8)
    const an = a * n, nm1 = n - 1
    return [`${coeff(a)}x^{${n}}`, nm1 === 1 ? `${an}x` : `${an}x^{${nm1}}`]
  },
]

const easyInt: Array<() => [string, string]> = [
  // ax^n → ax^(n+1)/(n+1)
  () => {
    const a = rand(1, 8), n = rand(1, 6)
    const np1 = n + 1
    const num = a === 1 ? `x^{${np1}}` : `${a}x^{${np1}}`
    const ans = np1 === 1 ? `${a}x + C` : `\\frac{${num}}{${np1}} + C`
    return [`${coeff(a)}x^{${n}}`, ans]
  },
  // a → ax
  () => {
    const a = rand(1, 12)
    return [String(a), `${a}x + C`]
  },
  // e^x
  () => ['e^x', 'e^x + C'],
  // ae^x
  () => {
    const a = rand(2, 9)
    return [`${a}e^x`, `${a}e^x + C`]
  },
  // 1/x
  () => ['\\frac{1}{x}', '\\ln|x| + C'],
  // sin x
  () => ['\\sin x', '-\\cos x + C'],
  // cos x
  () => ['\\cos x', '\\sin x + C'],
  // a sin x
  () => {
    const a = rand(2, 8)
    return [`${a}\\sin x`, `-${a}\\cos x + C`]
  },
  // a cos x
  () => {
    const a = rand(2, 8)
    return [`${a}\\cos x`, `${a}\\sin x + C`]
  },
  // x^n + a
  () => {
    const n = rand(2, 5), a = rand(1, 8)
    return [`x^{${n}} + ${a}`, `\\frac{x^{${n+1}}}{${n+1}} + ${a}x + C`]
  },
  // sqrt(x)
  () => ['\\sqrt{x}', '\\frac{2}{3}x^{\\frac{3}{2}} + C'],
  // x
  () => ['x', '\\frac{x^2}{2} + C'],
]

// ─── Medium templates ─────────────────────────────────────────────────────────

const mediumDiff: Array<() => [string, string]> = [
  // chain rule: sin(ax)
  () => {
    const a = rand(2, 8)
    return [`\\sin(${a}x)`, `${a}\\cos(${a}x)`]
  },
  // chain rule: cos(ax)
  () => {
    const a = rand(2, 8)
    return [`\\cos(${a}x)`, `-${a}\\sin(${a}x)`]
  },
  // chain rule: e^(ax)
  () => {
    const a = rand(2, 7)
    return [`e^{${a}x}`, `${a}e^{${a}x}`]
  },
  // chain rule: (ax+b)^n
  () => {
    const a = rand(2, 5), b = rand(1, 6), n = rand(2, 5)
    const an = a * n
    return [
      `(${a}x+${b})^{${n}}`,
      n - 1 === 1
        ? `${an}(${a}x+${b})`
        : `${an}(${a}x+${b})^{${n-1}}`,
    ]
  },
  // product rule: x * sin(x)
  () => ['x\\sin x', '\\sin x + x\\cos x'],
  // product rule: x * e^x
  () => ['xe^x', 'e^x + xe^x'],
  // product rule: x^2 * e^x
  () => ['x^2 e^x', '2xe^x + x^2 e^x'],
  // product rule: x * cos(x)
  () => ['x\\cos x', '\\cos x - x\\sin x'],
  // chain rule: ln(ax)
  () => {
    const a = rand(2, 8)
    return [`\\ln(${a}x)`, '\\frac{1}{x}']
  },
  // chain rule: (x^2+a)^n
  () => {
    const a = rand(1, 5), n = rand(2, 4)
    return [
      `(x^2+${a})^{${n}}`,
      `${2*n}x(x^2+${a})^{${n-1}}`,
    ]
  },
  // tan x
  () => ['\\tan x', '\\sec^2 x'],
  // sec x
  () => ['\\sec x', '\\sec x\\tan x'],
  // chain: sin^2(x)
  () => ['\\sin^2 x', '2\\sin x\\cos x'],
]

const mediumInt: Array<() => [string, string]> = [
  // substitution: sin(ax)
  () => {
    const a = rand(2, 8)
    return [`\\sin(${a}x)`, `-\\frac{\\cos(${a}x)}{${a}} + C`]
  },
  // substitution: cos(ax)
  () => {
    const a = rand(2, 8)
    return [`\\cos(${a}x)`, `\\frac{\\sin(${a}x)}{${a}} + C`]
  },
  // substitution: e^(ax)
  () => {
    const a = rand(2, 7)
    return [`e^{${a}x}`, `\\frac{e^{${a}x}}{${a}} + C`]
  },
  // substitution: (ax+b)^n
  () => {
    const a = rand(2, 5), b = rand(1, 6), n = rand(2, 5)
    return [
      `(${a}x+${b})^{${n}}`,
      `\\frac{(${a}x+${b})^{${n+1}}}{${a*(n+1)}} + C`,
    ]
  },
  // 1/(ax+b)
  () => {
    const a = rand(2, 6), b = rand(1, 5)
    return [`\\frac{1}{${a}x+${b}}`, `\\frac{\\ln|${a}x+${b}|}{${a}} + C`]
  },
  // definite: x^n from 0 to a
  () => {
    const n = rand(1, 4), a = rand(2, 5)
    const np1 = n + 1
    const val = Math.pow(a, np1) / np1
    const isWhole = Number.isInteger(val)
    const ans = isWhole ? String(val) : `\\frac{${Math.pow(a, np1)}}{${np1}}`
    return [`\\int_0^{${a}} x^{${n}}\\,dx`, ans]
  },
  // definite: sin from 0 to pi
  () => [`\\int_0^{\\pi} \\sin x\\,dx`, '2'],
  // definite: e^x from 0 to 1
  () => [`\\int_0^1 e^x\\,dx`, 'e - 1'],
  // x/(x^2+a) via sub
  () => {
    const a = rand(1, 6)
    return [`\\frac{x}{x^2+${a}}`, `\\frac{\\ln|x^2+${a}|}{2} + C`]
  },
  // tan x
  () => ['\\tan x', '\\ln|\\sec x| + C'],
  // sec^2 x
  () => ['\\sec^2 x', '\\tan x + C'],
  // x*e^(x^2) via sub
  () => ['xe^{x^2}', '\\frac{e^{x^2}}{2} + C'],
]

// ─── Hard templates ───────────────────────────────────────────────────────────

const hardDiff: Array<() => [string, string]> = [
  // quotient rule: sin(x)/x
  () => ['\\frac{\\sin x}{x}', '\\frac{x\\cos x - \\sin x}{x^2}'],
  // implicit: x^2 + y^2 = r^2
  () => ['x^2 + y^2 = r^2 \\text{ (implicit)}', '-\\frac{x}{y}'],
  // chain + product: x^2 sin(3x)
  () => ['x^2\\sin(3x)', '2x\\sin(3x) + 3x^2\\cos(3x)'],
  // chain: ln(sin x)
  () => ['\\ln(\\sin x)', '\\cot x'],
  // chain: e^(sin x)
  () => ['e^{\\sin x}', 'e^{\\sin x}\\cos x'],
  // quotient: e^x/x^2
  () => ['\\frac{e^x}{x^2}', '\\frac{e^x(x-2)}{x^3}'],
  // chain: tan(x^2)
  () => ['\\tan(x^2)', '2x\\sec^2(x^2)'],
  // product: x^3 ln(x)
  () => ['x^3\\ln x', '3x^2\\ln x + x^2'],
  // chain: (sin x)^3
  () => ['\\sin^3 x', '3\\sin^2 x\\cos x'],
  // quotient: ln(x)/x
  () => ['\\frac{\\ln x}{x}', '\\frac{1 - \\ln x}{x^2}'],
  // implicit: x^3 + y^3 = 6xy
  () => ['x^3 + y^3 = 6xy \\text{ (implicit)}', '\\frac{2y - x^2}{y^2 - 2x}'],
  // chain: arctan(x)
  () => ['\\arctan x', '\\frac{1}{1+x^2}'],
  // arcsin
  () => ['\\arcsin x', '\\frac{1}{\\sqrt{1-x^2}}'],
]

const hardInt: Array<() => [string, string]> = [
  // by parts: x e^x
  () => ['xe^x', 'e^x(x-1) + C'],
  // by parts: x sin x
  () => ['x\\sin x', '-x\\cos x + \\sin x + C'],
  // by parts: x cos x
  () => ['x\\cos x', 'x\\sin x + \\cos x + C'],
  // by parts: x^2 e^x
  () => ['x^2 e^x', 'e^x(x^2 - 2x + 2) + C'],
  // by parts: ln x
  () => ['\\ln x', 'x\\ln x - x + C'],
  // by parts: x ln x
  () => ['x\\ln x', '\\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C'],
  // partial fractions: 1/((x+1)(x+2))
  () => [
    '\\frac{1}{(x+1)(x+2)}',
    '\\ln|x+1| - \\ln|x+2| + C',
  ],
  // partial fractions: 1/(x^2-1)
  () => [
    '\\frac{1}{x^2-1}',
    '\\frac{1}{2}\\ln\\left|\\frac{x-1}{x+1}\\right| + C',
  ],
  // trig sub: sqrt(1-x^2)
  () => ['\\sqrt{1-x^2}', '\\frac{1}{2}\\left(x\\sqrt{1-x^2}+\\arcsin x\\right) + C'],
  // trig sub: 1/sqrt(1-x^2)
  () => ['\\frac{1}{\\sqrt{1-x^2}}', '\\arcsin x + C'],
  // trig sub: 1/(1+x^2)
  () => ['\\frac{1}{1+x^2}', '\\arctan x + C'],
  // by parts: x^2 sin x
  () => ['x^2\\sin x', '-x^2\\cos x + 2x\\sin x + 2\\cos x + C'],
  // sin^2 x
  () => ['\\sin^2 x', '\\frac{x}{2} - \\frac{\\sin(2x)}{4} + C'],
  // cos^2 x
  () => ['\\cos^2 x', '\\frac{x}{2} + \\frac{\\sin(2x)}{4} + C'],
]

function pickTemplate(
  pool: Array<() => [string, string]>,
  type: QuestionType,
  difficulty: Difficulty,
  index: number
): Question {
  const fn = pool[Math.floor(Math.random() * pool.length)]
  const [expression, answer] = fn()
  return {
    id: `${difficulty}-${type}-${index}-${Date.now()}`,
    type,
    difficulty,
    expression,
    answer,
  }
}

export function generateQuestions(difficulty: Difficulty, count = 10): Question[] {
  const questions: Question[] = []
  for (let i = 0; i < count; i++) {
    const isDiff = Math.random() < 0.5
    const type: QuestionType = isDiff ? 'differentiate' : 'integrate'
    let pool: Array<() => [string, string]>
    if (difficulty === 'easy') pool = isDiff ? easyDiff : easyInt
    else if (difficulty === 'medium') pool = isDiff ? mediumDiff : mediumInt
    else pool = isDiff ? hardDiff : hardInt
    questions.push(pickTemplate(pool, type, difficulty, i))
  }
  return questions
}

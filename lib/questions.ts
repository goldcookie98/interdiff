export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'differentiate' | 'integrate'

export interface Question {
  id: string
  type: QuestionType
  difficulty: Difficulty
  expression: string
  answer: string
  hint?: string
}

export interface GameOptions {
  noTrig?: boolean
}

type Template = { fn: () => [string, string]; trig: boolean }

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

// ─── Easy ────────────────────────────────────────────────────────────────────

const easyDiff: Template[] = [
  { trig: false, fn: () => { const a=rand(1,8),n=rand(2,7),an=a*n,nm1=n-1; return [`${coeff(a)}x^{${n}}`, nm1===1?`${an}x`:`${an}x^{${nm1}}`] } },
  { trig: false, fn: () => { const a=rand(2,12); return [`${a}x`, String(a)] } },
  { trig: false, fn: () => { const a=rand(1,20); return [String(a), '0'] } },
  { trig: false, fn: () => ['e^x', 'e^x'] },
  { trig: false, fn: () => { const a=rand(2,9); return [`${a}e^x`, `${a}e^x`] } },
  { trig: false, fn: () => ['\\ln x', '\\frac{1}{x}'] },
  { trig: false, fn: () => ['\\sqrt{x}', '\\frac{1}{2\\sqrt{x}}'] },
  { trig: false, fn: () => ['\\frac{1}{x}', '-\\frac{1}{x^2}'] },
  { trig: false, fn: () => { const a=rand(1,6),n=rand(3,8),an=a*n,nm1=n-1; return [`${coeff(a)}x^{${n}}`, nm1===1?`${an}x`:`${an}x^{${nm1}}`] } },
  { trig: false, fn: () => { const n=rand(2,5),a=rand(1,7); return [`x^{${n}} ${signed(a)}x`, `${n}x^{${n-1}} ${signed(a)}`] } },
  { trig: true,  fn: () => ['\\sin x', '\\cos x'] },
  { trig: true,  fn: () => ['\\cos x', '-\\sin x'] },
  { trig: true,  fn: () => { const a=rand(2,8); return [`${a}\\sin x`, `${a}\\cos x`] } },
  { trig: true,  fn: () => { const a=rand(2,8); return [`${a}\\cos x`, `-${a}\\sin x`] } },
]

const easyInt: Template[] = [
  { trig: false, fn: () => { const a=rand(1,8),n=rand(1,6),np1=n+1; const num=a===1?`x^{${np1}}`:`${a}x^{${np1}}`; return [`${coeff(a)}x^{${n}}`, `\\frac{${num}}{${np1}} + C`] } },
  { trig: false, fn: () => { const a=rand(1,12); return [String(a), `${a}x + C`] } },
  { trig: false, fn: () => ['e^x', 'e^x + C'] },
  { trig: false, fn: () => { const a=rand(2,9); return [`${a}e^x`, `${a}e^x + C`] } },
  { trig: false, fn: () => ['\\frac{1}{x}', '\\ln|x| + C'] },
  { trig: false, fn: () => ['\\sqrt{x}', '\\frac{2}{3}x^{\\frac{3}{2}} + C'] },
  { trig: false, fn: () => ['x', '\\frac{x^2}{2} + C'] },
  { trig: false, fn: () => { const n=rand(2,5),a=rand(1,8); return [`x^{${n}} + ${a}`, `\\frac{x^{${n+1}}}{${n+1}} + ${a}x + C`] } },
  { trig: true,  fn: () => ['\\sin x', '-\\cos x + C'] },
  { trig: true,  fn: () => ['\\cos x', '\\sin x + C'] },
  { trig: true,  fn: () => { const a=rand(2,8); return [`${a}\\sin x`, `-${a}\\cos x + C`] } },
  { trig: true,  fn: () => { const a=rand(2,8); return [`${a}\\cos x`, `${a}\\sin x + C`] } },
]

// ─── Medium ───────────────────────────────────────────────────────────────────

const mediumDiff: Template[] = [
  { trig: false, fn: () => { const a=rand(2,7); return [`e^{${a}x}`, `${a}e^{${a}x}`] } },
  { trig: false, fn: () => { const a=rand(2,5),b=rand(1,6),n=rand(2,5),an=a*n; return [`(${a}x+${b})^{${n}}`, n-1===1?`${an}(${a}x+${b})`:`${an}(${a}x+${b})^{${n-1}}`] } },
  { trig: false, fn: () => ['xe^x', 'e^x + xe^x'] },
  { trig: false, fn: () => ['x^2 e^x', '2xe^x + x^2 e^x'] },
  { trig: false, fn: () => { const a=rand(2,8); return [`\\ln(${a}x)`, '\\frac{1}{x}'] } },
  { trig: false, fn: () => { const a=rand(1,5),n=rand(2,4); return [`(x^2+${a})^{${n}}`, `${2*n}x(x^2+${a})^{${n-1}}`] } },
  { trig: true,  fn: () => { const a=rand(2,8); return [`\\sin(${a}x)`, `${a}\\cos(${a}x)`] } },
  { trig: true,  fn: () => { const a=rand(2,8); return [`\\cos(${a}x)`, `-${a}\\sin(${a}x)`] } },
  { trig: true,  fn: () => ['x\\sin x', '\\sin x + x\\cos x'] },
  { trig: true,  fn: () => ['x\\cos x', '\\cos x - x\\sin x'] },
  { trig: true,  fn: () => ['\\tan x', '\\sec^2 x'] },
  { trig: true,  fn: () => ['\\sec x', '\\sec x\\tan x'] },
  { trig: true,  fn: () => ['\\sin^2 x', '2\\sin x\\cos x'] },
]

const mediumInt: Template[] = [
  { trig: false, fn: () => { const a=rand(2,7); return [`e^{${a}x}`, `\\frac{e^{${a}x}}{${a}} + C`] } },
  { trig: false, fn: () => { const a=rand(2,5),b=rand(1,6),n=rand(2,5); return [`(${a}x+${b})^{${n}}`, `\\frac{(${a}x+${b})^{${n+1}}}{${a*(n+1)}} + C`] } },
  { trig: false, fn: () => { const a=rand(2,6),b=rand(1,5); return [`\\frac{1}{${a}x+${b}}`, `\\frac{\\ln|${a}x+${b}|}{${a}} + C`] } },
  { trig: false, fn: () => { const n=rand(1,4),a=rand(2,5),np1=n+1,val=Math.pow(a,np1)/np1,isWhole=Number.isInteger(val); return [`\\int_0^{${a}} x^{${n}}\\,dx`, isWhole?String(val):`\\frac{${Math.pow(a,np1)}}{${np1}}`] } },
  { trig: false, fn: () => [`\\int_0^1 e^x\\,dx`, 'e - 1'] },
  { trig: false, fn: () => { const a=rand(1,6); return [`\\frac{x}{x^2+${a}}`, `\\frac{\\ln|x^2+${a}|}{2} + C`] } },
  { trig: false, fn: () => ['xe^{x^2}', '\\frac{e^{x^2}}{2} + C'] },
  { trig: true,  fn: () => { const a=rand(2,8); return [`\\sin(${a}x)`, `-\\frac{\\cos(${a}x)}{${a}} + C`] } },
  { trig: true,  fn: () => { const a=rand(2,8); return [`\\cos(${a}x)`, `\\frac{\\sin(${a}x)}{${a}} + C`] } },
  { trig: true,  fn: () => [`\\int_0^{\\pi} \\sin x\\,dx`, '2'] },
  { trig: true,  fn: () => ['\\tan x', '\\ln|\\sec x| + C'] },
  { trig: true,  fn: () => ['\\sec^2 x', '\\tan x + C'] },
]

// ─── Hard ─────────────────────────────────────────────────────────────────────

const hardDiff: Template[] = [
  { trig: false, fn: () => ['x^3\\ln x', '3x^2\\ln x + x^2'] },
  { trig: false, fn: () => ['\\frac{e^x}{x^2}', '\\frac{e^x(x-2)}{x^3}'] },
  { trig: false, fn: () => ['\\frac{\\ln x}{x}', '\\frac{1 - \\ln x}{x^2}'] },
  { trig: false, fn: () => ['x^2 + y^2 = r^2 \\text{ (implicit)}', '-\\frac{x}{y}'] },
  { trig: false, fn: () => ['x^3 + y^3 = 6xy \\text{ (implicit)}', '\\frac{2y - x^2}{y^2 - 2x}'] },
  { trig: false, fn: () => ['e^{\\sin x}', 'e^{\\sin x}\\cos x'] },
  { trig: true,  fn: () => ['\\frac{\\sin x}{x}', '\\frac{x\\cos x - \\sin x}{x^2}'] },
  { trig: true,  fn: () => ['x^2\\sin(3x)', '2x\\sin(3x) + 3x^2\\cos(3x)'] },
  { trig: true,  fn: () => ['\\ln(\\sin x)', '\\cot x'] },
  { trig: true,  fn: () => ['\\tan(x^2)', '2x\\sec^2(x^2)'] },
  { trig: true,  fn: () => ['\\sin^3 x', '3\\sin^2 x\\cos x'] },
  { trig: true,  fn: () => ['\\arctan x', '\\frac{1}{1+x^2}'] },
  { trig: true,  fn: () => ['\\arcsin x', '\\frac{1}{\\sqrt{1-x^2}}'] },
]

const hardInt: Template[] = [
  { trig: false, fn: () => ['xe^x', 'e^x(x-1) + C'] },
  { trig: false, fn: () => ['x^2 e^x', 'e^x(x^2 - 2x + 2) + C'] },
  { trig: false, fn: () => ['\\ln x', 'x\\ln x - x + C'] },
  { trig: false, fn: () => ['x\\ln x', '\\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C'] },
  { trig: false, fn: () => ['\\frac{1}{(x+1)(x+2)}', '\\ln|x+1| - \\ln|x+2| + C'] },
  { trig: false, fn: () => ['\\frac{1}{x^2-1}', '\\frac{1}{2}\\ln\\left|\\frac{x-1}{x+1}\\right| + C'] },
  { trig: true,  fn: () => ['x\\sin x', '-x\\cos x + \\sin x + C'] },
  { trig: true,  fn: () => ['x\\cos x', 'x\\sin x + \\cos x + C'] },
  { trig: true,  fn: () => ['x^2\\sin x', '-x^2\\cos x + 2x\\sin x + 2\\cos x + C'] },
  { trig: true,  fn: () => ['\\sqrt{1-x^2}', '\\frac{1}{2}\\left(x\\sqrt{1-x^2}+\\arcsin x\\right) + C'] },
  { trig: true,  fn: () => ['\\frac{1}{\\sqrt{1-x^2}}', '\\arcsin x + C'] },
  { trig: true,  fn: () => ['\\frac{1}{1+x^2}', '\\arctan x + C'] },
  { trig: true,  fn: () => ['\\sin^2 x', '\\frac{x}{2} - \\frac{\\sin(2x)}{4} + C'] },
  { trig: true,  fn: () => ['\\cos^2 x', '\\frac{x}{2} + \\frac{\\sin(2x)}{4} + C'] },
]

function pickTemplate(
  pool: Template[],
  type: QuestionType,
  difficulty: Difficulty,
  index: number,
  noTrig: boolean
): Question {
  const filtered = noTrig ? pool.filter(t => !t.trig) : pool
  const available = filtered.length > 0 ? filtered : pool
  const t = available[Math.floor(Math.random() * available.length)]
  const [expression, answer] = t.fn()
  return {
    id: `${difficulty}-${type}-${index}-${Date.now()}`,
    type,
    difficulty,
    expression,
    answer,
  }
}

export function generateQuestions(difficulty: Difficulty, count = 10, options: GameOptions = {}): Question[] {
  const noTrig = options.noTrig ?? false
  const questions: Question[] = []
  for (let i = 0; i < count; i++) {
    const isDiff = Math.random() < 0.5
    const type: QuestionType = isDiff ? 'differentiate' : 'integrate'
    let pool: Template[]
    if (difficulty === 'easy') pool = isDiff ? easyDiff : easyInt
    else if (difficulty === 'medium') pool = isDiff ? mediumDiff : mediumInt
    else pool = isDiff ? hardDiff : hardInt
    questions.push(pickTemplate(pool, type, difficulty, i, noTrig))
  }
  return questions
}

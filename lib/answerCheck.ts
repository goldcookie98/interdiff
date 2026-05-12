// Normalise a LaTeX answer string for fuzzy comparison
function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '')
    // remove trailing + C variants
    .replace(/\+c$/i, '')
    // \frac{a}{b} → a/b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    // remove \left \right
    .replace(/\\left|\\right/g, '')
    // remove \, \! spacing
    .replace(/\\[,!;:]/g, '')
    // common aliases
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/1\/x/g, 'x^{-1}')
    // normalise |x| forms
    .replace(/\|/g, '')
    // strip display command wrappers
    .replace(/\\text\{[^}]*\}/g, '')
    // remove remaining backslash commands we don't care about
    .replace(/\\,/g, '')
}

// Additional equivalent forms map
const EQUIVALENTS: Array<[string, string]> = [
  ['\\frac{x^2}{2}', 'x^2/2'],
  ['\\frac{1}{2}x^2', 'x^2/2'],
  ['e^x+e^x', '2e^x'],
  ['\\ln|x|', '\\ln(x)'],
  ['\\sin x\\cos x', '\\frac{\\sin(2x)}{2}'],
]

function stripPlusC(s: string): string {
  return s.replace(/\s*\+\s*[Cc]\s*$/g, '').trim()
}

export function checkAnswer(userRaw: string, correctRaw: string): boolean {
  if (!userRaw.trim()) return false

  const user = normalise(userRaw)
  const correct = normalise(correctRaw)

  if (user === correct) return true

  // Try with stripped + C
  const userNoC = normalise(stripPlusC(userRaw))
  const correctNoC = normalise(stripPlusC(correctRaw))
  if (userNoC === correctNoC) return true

  // Check equivalents table
  for (const [a, b] of EQUIVALENTS) {
    const na = normalise(a), nb = normalise(b)
    if ((user === na && correct === nb) || (user === nb && correct === na)) return true
  }

  // Levenshtein tolerance for near-matches (max 2 edits, short strings)
  if (user.length < 30 && correct.length < 30) {
    const dist = levenshtein(user, correct)
    if (dist <= 2) return true
  }

  return false
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

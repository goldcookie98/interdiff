// Normalise a LaTeX polynomial answer for comparison
function normalise(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    // remove + C / + c
    .replace(/\s*\+\s*c\s*$/i, '')
    // \frac{a}{b} → (a/b) — handle before removing braces
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    // remove LaTeX spacing commands
    .replace(/\\[,!;: ]/g, '')
    // remove \left \right
    .replace(/\\left|\\right/g, '')
    // remove all whitespace
    .replace(/\s+/g, '')
    // normalise explicit multiplication
    .replace(/\\cdot|\*/g, '')
    // remove redundant parens around single char: (x) → x
    .replace(/\(([a-z0-9])\)/g, '$1')
}

// Check two LaTeX polynomial answers for equivalence
export function checkAnswer(userRaw: string, correctRaw: string): boolean {
  if (!userRaw.trim()) return false

  const user = normalise(userRaw)
  const correct = normalise(correctRaw)

  if (user === correct) return true

  // Try with both having + C stripped (user might omit it)
  const userNoC = normalise(userRaw.replace(/\s*\+\s*c\s*$/i, ''))
  const correctNoC = normalise(correctRaw.replace(/\s*\+\s*c\s*$/i, ''))
  if (userNoC === correctNoC) return true

  // Levenshtein tolerance — allow up to 2 edits for short answers
  if (user.length <= 30 && correct.length <= 30) {
    if (levenshtein(user, correct) <= 2) return true
  }

  return false
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

'use client'
import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  running: boolean
  onTick?: (ms: number) => void
  className?: string
}

export default function Timer({ running, onTick, className = '' }: TimerProps) {
  const [ms, setMs] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - ms
      const tick = () => {
        const elapsed = Date.now() - (startRef.current ?? Date.now())
        setMs(elapsed)
        onTick?.(elapsed)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const seconds = Math.floor(ms / 1000)
  const centis = Math.floor((ms % 1000) / 10)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  const display = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
    : `${secs}.${String(centis).padStart(2, '0')}s`

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {display}
    </span>
  )
}

export function useTimer() {
  const [running, setRunning] = useState(false)
  const [totalMs, setTotalMs] = useState(0)

  const start = () => { setTotalMs(0); setRunning(true) }
  const stop = () => setRunning(false)
  const reset = () => { setRunning(false); setTotalMs(0) }

  return { running, totalMs, setTotalMs, start, stop, reset }
}

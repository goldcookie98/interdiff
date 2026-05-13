'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const MEMES = [
  '🐸\nFEELS GOOD\nMAN',
  '🐶 WOW\nSUCH DANK\nVERY MEME\nMUCH WOW',
  'OH BABY\nA TRIPLE!',
  'MLG 🎯\n360\nNO SCOPE',
  'GET\nREKT',
  '📈\nSTONKS',
  'LEEEEROY\nJENKINS!!!',
  '🦍 RIP\nHARAMBE',
  "IT'S OVER\n9000!!! 💥",
  '🎵 NEVER\nGONNA GIVE\nYOU UP 🎵',
  'PRESS F\nTO PAY\nRESPECTS',
  '💯 YOLO\nSWAG 💯',
  '🐸 HERE\nCOMES\nDAT BOI',
  'BIG\nCHUNGUS 🐇',
  '🔴\nSUS',
  'TRIGGERED 😤',
  'TO BE\nCONTINUED...\n➡️',
  'PogChamp\n👀',
  'Kappa 🙃',
  '💎 DANK\nMEMES 💎',
  'SHREK IS\nLOVE 💚\nSHREK IS\nLIFE',
  '🎺 DA DA\nDA DAAA',
  'SOMEBODY\nONCE TOLD\nME... 🌳',
  '🌊 REKT\nSON',
  '✨ MLG ✨\nPRO GAMER',
  '💀 RIP IN\nPEPPERONI',
  'NOT TODAY\nSATAN 🙅',
  '👁️👄👁️\nIT IS WHAT\nIT IS',
  '📊 STONK\nOR 🔨 BONK',
  '🐸 PEPE\nTHE FROG\nSAYS HI',
  'HODL 📉📈\nTO THE MOON',
  '🎮 GIT GUD\nSCRUB',
  'YEET 🏀\nOR BE\nYEETED',
  '🌈 DOUBLE\nRAINBOW\nWHAT DOES\nIT MEAN',
  '😂😂😂\nDED\nI\'M 💀',
  '🥴 BRUH\nMOMENT',
  'WOOOOOSH\n🌬️',
  'BASED 😎\nAND\nREDPILLED',
  '🔥 THIS IS\nFINE 🔥',
  '🧠 BIG\nBRAIN TIME',
  '420\n🌿\nBLAZE IT',
]

const COLORS = ['#00ff00', '#39ff14', '#00ff41', '#7fff00', '#adff2f', '#ccff00', '#ffff00', '#00fa9a']

const ANIM_TYPES = ['dank-spin', 'dank-spin-reverse', 'dank-bounce', 'dank-wobble']

interface MemeItem {
  id: number
  text: string
  x: number
  y: number
  size: number
  animDuration: number
  animType: string
  color: string
}

let _id = 0
function mkMeme(): MemeItem {
  return {
    id: ++_id,
    text: MEMES[Math.floor(Math.random() * MEMES.length)],
    x: Math.random() * 88 + 6,
    y: Math.random() * 82 + 6,
    size: Math.random() * 1.6 + 0.7,
    animDuration: Math.random() * 2.5 + 0.8,
    animType: ANIM_TYPES[Math.floor(Math.random() * ANIM_TYPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

// ─── Sounds ───────────────────────────────────────────────────────────────────

function playAirHorn(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const shaper = ctx.createWaveShaper()
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1
    curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x))
  }
  shaper.curve = curve
  osc.connect(shaper)
  shaper.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 1.3)
  gain.gain.setValueAtTime(0.22, ctx.currentTime)
  gain.gain.setValueAtTime(0.22, ctx.currentTime + 1.0)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 1.3)
}

function playHitMarker(ctx: AudioContext) {
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime + i * 0.07
    osc.frequency.value = 1400 + i * 250
    gain.gain.setValueAtTime(0.12, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    osc.start(t)
    osc.stop(t + 0.06)
  }
}

function playVineBoom(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(110, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(22, ctx.currentTime + 0.7)
  gain.gain.setValueAtTime(0.7, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.7)
}

function playOhYeah(ctx: AudioContext) {
  // Kool-Aid Man "OH YEAH" approximation — rising slide whistle + boom
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3)
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5)
  gain.gain.setValueAtTime(0.35, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.55)
}

function playSadTrombone(ctx: AudioContext) {
  const freqs = [466, 415, 370, 311]
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    const t = ctx.currentTime + i * 0.22
    osc.frequency.setValueAtTime(f, t)
    gain.gain.setValueAtTime(0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    osc.start(t)
    osc.stop(t + 0.22)
  })
}

function playMemeSound() {
  try {
    const ctx = new AudioContext()
    const r = Math.random()
    if (r < 0.25) playAirHorn(ctx)
    else if (r < 0.5) playHitMarker(ctx)
    else if (r < 0.65) playVineBoom(ctx)
    else if (r < 0.82) playOhYeah(ctx)
    else playSadTrombone(ctx)
  } catch { /* audio blocked */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DankMode() {
  const [isDank, setIsDank] = useState(false)
  const [memes, setMemes] = useState<MemeItem[]>([])
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const spawnMeme = useCallback(() => {
    setMemes(prev => {
      const next = [...prev, mkMeme()]
      return next.length > 30 ? next.slice(next.length - 30) : next
    })
  }, [])

  useEffect(() => {
    if (isDank) {
      document.body.classList.add('dank-mode')
      setFlash(true)
      setTimeout(() => setFlash(false), 1200)
      for (let i = 0; i < 10; i++) setTimeout(spawnMeme, i * 80)
      intervalRef.current = setInterval(spawnMeme, 500)
    } else {
      document.body.classList.remove('dank-mode')
      setMemes([])
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isDank, spawnMeme])

  useEffect(() => {
    if (!isDank) return
    const handler = () => playMemeSound()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [isDank])

  useEffect(() => () => { document.body.classList.remove('dank-mode') }, [])

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsDank(d => !d)}
        className="fixed bottom-10 right-4 z-[9999] transition-all duration-300"
        style={isDank ? {
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: '11px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '2px solid #00ff00',
          backgroundColor: 'rgba(0,255,0,0.15)',
          color: '#00ff00',
          textShadow: '0 0 8px #00ff00',
          boxShadow: '0 0 15px rgba(0,255,0,0.4)',
          cursor: 'crosshair',
          letterSpacing: '0.1em',
          animation: 'dank-pulse 1s ease-in-out infinite',
        } : {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          padding: '5px 9px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          color: 'rgba(240,230,211,0.25)',
        }}
      >
        {isDank ? '🌿 DANK ON 🌿' : '🌿 dank'}
      </button>

      {/* Overlay */}
      {isDank && (
        <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden">
          {/* Green tint */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,80,0,0.12)' }} />

          {/* Scanlines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.025) 3px, rgba(0,255,0,0.025) 4px)',
          }} />

          {/* ACTIVATED flash */}
          {flash && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
              <div style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 'clamp(2rem, 8vw, 5rem)',
                color: '#00ff00',
                textShadow: '0 0 30px #00ff00, 3px 3px 0 #000',
                letterSpacing: '0.1em',
                textAlign: 'center',
                animation: 'dank-flash-in 1.2s ease-out forwards',
                whiteSpace: 'nowrap',
              }}>
                🌿 DANK MODE 🌿<br />
                <span style={{ fontSize: '60%', letterSpacing: '0.3em' }}>ACTIVATED</span>
              </div>
            </div>
          )}

          {/* Memes */}
          {memes.map(m => (
            <div
              key={m.id}
              className="absolute"
              style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontWeight: 900,
                fontSize: `${m.size * 1.6}rem`,
                color: m.color,
                textShadow: `2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 15px ${m.color}`,
                whiteSpace: 'pre',
                textAlign: 'center',
                lineHeight: 1.1,
                letterSpacing: '0.04em',
                userSelect: 'none',
                animation: `${m.animType} ${m.animDuration}s linear infinite`,
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

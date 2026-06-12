import { useEffect, useRef } from 'react'
import './HeroChimes.css'

// Vertical letter strings hanging like a curtain. Each string is a sentence
// read top-to-bottom; brushing the cursor across them scatters the letters
// with momentum and rings a windchime note tuned to that string.
const SENTENCES = [
  'founding designer',
  'i design and i ship',
  'art meets technology',
  'pixels with physics',
  'zero to one is home',
  'making cool shit',
  'engineer at heart',
  'let’s build together',
  'design with sound',
  'curious by default',
  'prototype everything',
  'taste plus velocity',
  'craft is my compass',
  'small teams big bets',
  'san francisco based',
]

// A-major pentatonic across two octaves — no wrong notes, so strumming the
// curtain in any order stays melodic and fairy-like.
const SCALE = [440.0, 493.88, 554.37, 659.25, 739.99, 880.0, 987.77, 1108.73]

// Tubular-bell partial ratios (inharmonic) give the metallic chime timbre a
// plain harmonic stack can't.
const PARTIALS = [
  { ratio: 1.0, gain: 1.0 },
  { ratio: 2.0, gain: 0.35 },
  { ratio: 2.76, gain: 0.22 },
  { ratio: 5.4, gain: 0.08 },
]

const FONT_SIZE = 14
const LETTER_GAP = 19      // vertical spacing between letters on a string
const INFLUENCE = 90       // px radius of the cursor's push field
const SPRING = 0.018       // pull back toward rest position
const DRAG = 0.945         // velocity retained per frame
const SWAY_AMP = 3         // idle curtain sway amplitude (px)
const BOUNCE = -0.65       // velocity retained (and flipped) on wall hit
const NOTE_COOLDOWN = 90   // ms between retriggers of the same string

function buildAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)

  // A soft feedback delay adds the lingering shimmer of real chimes.
  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.31
  const feedback = ctx.createGain()
  feedback.gain.value = 0.35
  const damp = ctx.createBiquadFilter()
  damp.type = 'lowpass'
  damp.frequency.value = 2200
  const wet = ctx.createGain()
  wet.gain.value = 0.3
  delay.connect(damp)
  damp.connect(feedback)
  feedback.connect(delay)
  damp.connect(wet)
  wet.connect(ctx.destination)

  const play = (freq, velocity, pan) => {
    const now = ctx.currentTime
    const voice = ctx.createGain()
    const panner = ctx.createStereoPanner()
    panner.pan.value = pan
    voice.connect(panner)
    panner.connect(master)
    panner.connect(delay)

    const level = 0.05 + Math.min(velocity, 1) * 0.12
    voice.gain.setValueAtTime(0, now)
    voice.gain.linearRampToValueAtTime(level, now + 0.006)
    voice.gain.exponentialRampToValueAtTime(0.0001, now + 2.8)

    for (const { ratio, gain } of PARTIALS) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      // Slight random detune keeps repeated notes organic.
      osc.frequency.value = freq * ratio * (1 + (Math.random() - 0.5) * 0.003)
      g.gain.value = gain
      // Upper partials die faster than the fundamental, as on a real chime.
      g.gain.setValueAtTime(gain, now)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 / ratio)
      osc.connect(g)
      g.connect(voice)
      osc.start(now)
      osc.stop(now + 3)
    }
  }

  return { ctx, play }
}

export default function HeroChimes() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx2d = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let particles = []
    let strings = []        // x positions + note index per string
    let width = 0
    let height = 0
    let raf = 0
    let audio = null

    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, lastString: -1 }

    const layout = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (!width || !height) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx2d.font = `${FONT_SIZE}px ${getComputedStyle(canvas).fontFamily}`
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'middle'

      const count = Math.max(3, Math.min(SENTENCES.length, Math.floor(width / 56)))
      const gap = width / (count + 1)
      particles = []
      strings = []
      for (let s = 0; s < count; s++) {
        const x = gap * (s + 1)
        strings.push({ x, note: SCALE[s % SCALE.length], lastPlayed: 0 })
        const text = SENTENCES[s % SENTENCES.length]
        const usable = height - 24
        const chars = Math.min(text.length, Math.floor(usable / LETTER_GAP))
        for (let i = 0; i < chars; i++) {
          const ch = text[i]
          if (ch === ' ') continue
          const y = 16 + i * LETTER_GAP
          particles.push({
            ch, string: s,
            x, y, vx: 0, vy: 0,
            restX: x, restY: y,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const strum = (speed) => {
      // Nearest string under the cursor; ring it when we cross onto a new one
      // so a sweep across the curtain plays a glissando.
      let nearest = -1
      let best = 14
      for (let s = 0; s < strings.length; s++) {
        const d = Math.abs(mouse.x - strings[s].x)
        if (d < best) { best = d; nearest = s }
      }
      if (nearest === -1) { mouse.lastString = -1; return }
      if (nearest === mouse.lastString) return
      mouse.lastString = nearest
      const str = strings[nearest]
      const now = performance.now()
      if (now - str.lastPlayed < NOTE_COOLDOWN) return
      // Hover alone can't unlock audio (see unlock() below). Until a real
      // gesture has started the context, stay silent rather than queue notes
      // that would all fire at once the moment it unlocks.
      if (!audio || audio.ctx.state !== 'running') return
      str.lastPlayed = now
      const pan = (str.x / width) * 1.4 - 0.7
      audio.play(str.note, speed / 30, pan)
    }

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouse.vx = x - (mouse.x === -9999 ? x : mouse.x)
      mouse.vy = y - (mouse.y === -9999 ? y : mouse.y)
      mouse.x = x
      mouse.y = y
      strum(Math.hypot(mouse.vx, mouse.vy))
    }

    const onPointerLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
      mouse.vx = 0
      mouse.vy = 0
      mouse.lastString = -1
    }

    // Browsers only start an AudioContext from a genuine user-activation event
    // — a click, key, or touch, NOT a hover. So we build and resume it on the
    // first such gesture anywhere on the page (priming with a silent buffer for
    // Safari/iOS), well before the cursor ever reaches the curtain.
    let unlocked = false
    const unlock = () => {
      if (unlocked) return
      unlocked = true
      if (!audio) audio = buildAudio()
      audio.ctx.resume()
      const buf = audio.ctx.createBuffer(1, 1, 22050)
      const src = audio.ctx.createBufferSource()
      src.buffer = buf
      src.connect(audio.ctx.destination)
      src.start(0)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('keydown', unlock)

    const tick = (t) => {
      ctx2d.clearRect(0, 0, width, height)
      const sway = reduceMotion ? 0 : SWAY_AMP

      for (const p of particles) {
        // Idle sway: each string ripples gently like fabric in a draft.
        const targetX = p.restX + Math.sin(t / 1600 + p.phase + p.restY * 0.012) * sway

        // Cursor push: force falls off linearly inside the influence radius
        // and inherits the cursor's velocity for a natural flick.
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < INFLUENCE && dist > 0.001) {
          const force = (1 - dist / INFLUENCE) * 0.5
          p.vx += (dx / dist) * force * 3 + mouse.vx * force * 0.22
          p.vy += (dy / dist) * force * 3 + mouse.vy * force * 0.22
        }

        // Spring back to rest, drag, integrate.
        p.vx += (targetX - p.x) * SPRING
        p.vy += (p.restY - p.y) * SPRING
        p.vx *= DRAG
        p.vy *= DRAG
        p.x += p.vx
        p.y += p.vy

        // Reflect off the canvas bounds with energy loss.
        if (p.x < 4) { p.x = 4; p.vx *= BOUNCE }
        else if (p.x > width - 4) { p.x = width - 4; p.vx *= BOUNCE }
        if (p.y < 4) { p.y = 4; p.vy *= BOUNCE }
        else if (p.y > height - 4) { p.y = height - 4; p.vy *= BOUNCE }

        // Letters fade up as they get agitated, then settle back to gray.
        const energy = Math.min(1, Math.hypot(p.vx, p.vy) / 6)
        ctx2d.fillStyle = `rgba(0, 0, 0, ${0.32 + energy * 0.55})`
        ctx2d.fillText(p.ch, p.x, p.y)
      }
      raf = requestAnimationFrame(tick)
    }

    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(canvas.parentElement)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('keydown', unlock)
      if (audio) audio.ctx.close()
    }
  }, [])

  return (
    <div className="hero-chimes" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-chimes__canvas" />
    </div>
  )
}

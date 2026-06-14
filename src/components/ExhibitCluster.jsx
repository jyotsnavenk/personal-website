import { useEffect, useRef, useState } from 'react'
import './ExhibitCluster.css'

// A cluster of jumbled letters. Each click scatters them with a burst, then
// springs them into place to spell the next sentence — and drops a looping
// drum-&-bass groove, sequenced live with Strudel (strudel.cc).
const SENTENCES = [
  'playing with music and code',
  'tinkering with touchdesigner',
  'always projecting art onto a wall',
  'move your body to create cool things',
  'every experience tells a story',
]

// Five loose anchor points (fractions of the canvas) — the invisible "cluster"
// the letters drift around when idle. Spread top-to-bottom so the jumble fills
// the full-height space the homepage strings occupy.
const ANCHORS = [
  { fx: 0.32, fy: 0.14, r: 42 },
  { fx: 0.70, fy: 0.30, r: 46 },
  { fx: 0.22, fy: 0.50, r: 44 },
  { fx: 0.62, fy: 0.68, r: 48 },
  { fx: 0.38, fy: 0.86, r: 42 },
]

// One drum-&-bass groove per sentence, written in Strudel's mini-notation.
// `drums` is a 16-step two-step break (kick on 1 + the "&", snare on 2 & 4);
// `bass` is a sub/reese line. Cycled on each click.
const GROOVES = [
  { drums: 'bd ~ ~ ~ sd ~ ~ ~ ~ ~ bd ~ sd ~ ~ ~', bass: 'c1 ~ c1 ~ ~ ~ eb1 ~' },
  { drums: 'bd ~ ~ bd sd ~ ~ ~ ~ bd ~ ~ sd ~ ~ ~', bass: 'c1 ~ ~ g0 c1 ~ ~ ~' },
  { drums: 'bd ~ ~ ~ sd ~ ~ bd ~ ~ bd ~ sd ~ sd ~', bass: 'f0 ~ f0 ~ ~ ab0 ~ ~' },
  { drums: 'bd ~ bd ~ sd ~ ~ ~ ~ ~ bd ~ sd ~ ~ bd', bass: 'c1 ~ ~ ~ eb1 ~ d1 ~' },
  { drums: 'bd ~ ~ ~ sd ~ bd ~ ~ ~ bd ~ sd ~ ~ ~', bass: 'g0 ~ g0 ~ bb0 ~ ~ c1' },
]

const FONT_SIZE = 17
const LINE_HEIGHT = FONT_SIZE * 1.45
const PAD = 16            // px inset for the wrapped sentence
const SPRING = 0.16       // pull toward target slot
const DRAG = 0.82         // velocity retained per frame
const SWAY = 2.2          // idle drift amplitude (px)

export default function ExhibitCluster() {
  const canvasRef = useRef(null)
  const apiRef = useRef(null)
  // Whether a groove is currently looping — flips the caption to a stop control.
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx2d = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let raf = 0
    let particles = []      // { ch, x, y, vx, vy, tx, ty, active, phase }
    let anchors = []        // resolved pixel positions of ANCHORS
    let idx = -1            // index of the sentence currently formed (-1 = jumbled)

    // --- Strudel (loaded lazily on the first click, inside the user gesture). ---
    let S = null            // the @strudel/web module namespace
    let strudelLoading = false
    let isPlaying = false   // whether a groove is currently looping
    let fadeTimer = 0       // pending "fade then stop" timeout (scroll-away)
    let autoTimer = 0       // pending auto-advance to the next sentence
    const FADE_SECONDS = 1.8
    const AUTO_ADVANCE_MS = 1500

    const ensureStrudel = async () => {
      if (S) return S
      if (strudelLoading) return null
      strudelLoading = true
      const mod = await import('@strudel/web')
      // initStrudel only registers synth voices; load a drum sample bank too.
      await mod.initStrudel({
        prebake: () => mod.samples('github:tidalcycles/dirt-samples'),
      })
      try { mod.getAudioContext?.().resume?.() } catch { /* started by gesture */ }
      S = mod
      return S
    }

    const playGroove = (i) => {
      if (!S) return
      const g = GROOVES[i % GROOVES.length]
      try {
        const drums = S.s(g.drums).gain(0.9)
        const hats = S.s('hh*16').gain(0.25)
        const bass = S.note(g.bass).sound('sawtooth').lpf(500).gain(0.7)
        // 170 bpm in 4/4 (one cycle = one bar) → drum-&-bass tempo.
        S.stack(drums, hats, bass).cpm(170 / 4).play()
      } catch (err) {
        console.error('[ExhibitCluster] strudel groove failed:', err)
      }
    }

    const stopGroove = () => {
      try { S?.hush?.() } catch { /* nothing playing */ }
    }

    // Strudel's master output gain — ramping this gives a smooth fade.
    const masterGain = () => {
      try { return S?.getSuperdoughAudioController?.()?.output?.destinationGain || null }
      catch { return null }
    }

    // Reset the master gain back to full so the next groove starts at volume.
    const restoreGain = () => {
      const mg = masterGain()
      if (!mg) return
      try {
        const now = S.getAudioContext().currentTime
        mg.gain.cancelScheduledValues(now)
        mg.gain.setValueAtTime(1, now)
      } catch { /* context gone */ }
    }

    // Scrolled out of view without stopping: ease the volume to silence, then
    // halt the groove and re-jumble. (Manual "stop" cuts immediately instead.)
    const fadeOutAndStop = () => {
      if (!isPlaying || fadeTimer) return
      clearAuto()
      const mg = masterGain()
      let ctx = null
      try { ctx = S.getAudioContext() } catch { /* not ready */ }
      if (!mg || !ctx) { stop(); return }
      const now = ctx.currentTime
      mg.gain.cancelScheduledValues(now)
      mg.gain.setValueAtTime(mg.gain.value, now)
      mg.gain.linearRampToValueAtTime(0.0001, now + FADE_SECONDS)
      fadeTimer = setTimeout(() => {
        fadeTimer = 0
        stopGroove()
        restoreGain()
        finishStop()
      }, FADE_SECONDS * 1000 + 60)
    }

    // Shared visual/state teardown for any kind of stop.
    const finishStop = () => {
      clearAuto()
      isPlaying = false
      setPlaying(false)
      idx = -1
      jumble()
    }

    // Auto-advance: if the visitor doesn't click again within 3s, move on to
    // the next sentence on our own, so the cluster loops through them all.
    const clearAuto = () => { clearTimeout(autoTimer); autoTimer = 0 }
    const scheduleAuto = () => {
      clearAuto()
      autoTimer = setTimeout(() => { strike() }, AUTO_ADVANCE_MS)
    }

    const fontOf = () =>
      `${FONT_SIZE}px ${getComputedStyle(canvas).fontFamily}`

    const randomClusterPoint = () => {
      const c = anchors[Math.floor(Math.random() * anchors.length)] || { x: width / 2, y: height / 2, r: 24 }
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * c.r
      return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d }
    }

    const makeParticle = (ch) => {
      const p = randomClusterPoint()
      return {
        ch,
        x: p.x, y: p.y, vx: 0, vy: 0,
        tx: p.x, ty: p.y,
        active: false,
        phase: Math.random() * Math.PI * 2,
      }
    }

    // Lay a sentence out as centered, word-wrapped lines; return one target
    // {ch,x,y} per non-space character.
    const layoutSentence = (text) => {
      ctx2d.font = fontOf()
      const maxW = width - PAD * 2
      const spaceW = ctx2d.measureText(' ').width
      const words = text.split(' ')
      const lines = []
      let line = []
      let lineW = 0
      for (const word of words) {
        const wW = ctx2d.measureText(word).width
        if (line.length && lineW + spaceW + wW > maxW) {
          lines.push(line.join(' '))
          line = [word]
          lineW = wW
        } else {
          lineW = line.length ? lineW + spaceW + wW : wW
          line.push(word)
        }
      }
      if (line.length) lines.push(line.join(' '))

      const blockH = lines.length * LINE_HEIGHT
      const top = (height - blockH) / 2 + LINE_HEIGHT / 2
      const targets = []
      lines.forEach((ln, li) => {
        const lnW = ctx2d.measureText(ln).width
        let x = (width - lnW) / 2
        const y = top + li * LINE_HEIGHT
        for (const ch of ln) {
          const cw = ctx2d.measureText(ch).width
          if (ch !== ' ') targets.push({ ch, x: x + cw / 2, y })
          x += cw
        }
      })
      return targets
    }

    // Scatter every active particle back into the cluster as faint jumble.
    const jumble = () => {
      for (const p of particles) {
        const t = randomClusterPoint()
        p.tx = t.x
        p.ty = t.y
        p.active = false
      }
    }

    // Burst, then re-aim the letters to spell SENTENCES[i].
    const form = (i) => {
      const targets = layoutSentence(SENTENCES[i])
      // Grow the pool if this sentence needs more letters than we have.
      while (particles.length < targets.length) particles.push(makeParticle(' '))
      for (let k = 0; k < particles.length; k++) {
        const p = particles[k]
        // Throw every letter outward — the scramble before the snap.
        const ang = Math.random() * Math.PI * 2
        const sp = 5 + Math.random() * 9
        p.vx += Math.cos(ang) * sp
        p.vy += Math.sin(ang) * sp
        if (k < targets.length) {
          p.ch = targets[k].ch
          p.tx = targets[k].x
          p.ty = targets[k].y
          p.active = true
        } else {
          // Leftover letters drift home to the cluster, faded.
          const t = randomClusterPoint()
          p.tx = t.x
          p.ty = t.y
          p.active = false
        }
      }
    }

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
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'middle'

      anchors = ANCHORS.map((c) => ({ x: c.fx * width, y: c.fy * height, r: c.r }))

      if (!particles.length) {
        // Seed with the longest sentence's letters, scattered (idle jumble).
        const seed = SENTENCES.reduce((a, b) => (b.length > a.length ? b : a))
        particles = [...seed.replace(/\s/g, '')].map((ch) => makeParticle(ch))
      } else if (idx >= 0) {
        form(idx)        // re-flow the formed sentence to the new size
      } else {
        jumble()
      }
    }

    // Click the cluster: advance to the next sentence and swap the groove.
    const strike = async () => {
      clearTimeout(fadeTimer)   // cancel any in-flight scroll-away fade
      fadeTimer = 0
      restoreGain()
      idx = (idx + 1) % SENTENCES.length
      form(idx)
      isPlaying = true
      setPlaying(true)
      await ensureStrudel()
      restoreGain()             // ensure full volume now Strudel exists
      playGroove(idx)
      scheduleAuto()            // keep looping if they don't click again
    }

    // Click the caption while playing: silence the groove immediately.
    const stop = () => {
      clearAuto()
      clearTimeout(fadeTimer)
      fadeTimer = 0
      stopGroove()
      restoreGain()
      finishStop()
    }

    apiRef.current = { strike, stop }

    const tick = (t) => {
      ctx2d.clearRect(0, 0, width, height)

      ctx2d.font = fontOf()
      for (const p of particles) {
        const sway = reduceMotion ? 0 : Math.sin(t / 1500 + p.phase) * (p.active ? 0 : SWAY)
        p.vx += (p.tx + sway - p.x) * SPRING
        p.vy += (p.ty - p.y) * SPRING
        p.vx *= DRAG
        p.vy *= DRAG
        p.x += p.vx
        p.y += p.vy

        const speed = Math.hypot(p.vx, p.vy)
        // Active letters settle to near-solid; idle jumble stays faint, and
        // everything brightens while it's moving fast (the scramble).
        const base = p.active ? 0.85 : 0.22
        const alpha = Math.min(1, base + Math.min(speed / 8, 0.4))
        ctx2d.fillStyle = `rgba(0, 0, 0, ${alpha})`
        ctx2d.fillText(p.ch, p.x, p.y)
      }
      raf = requestAnimationFrame(tick)
    }

    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(canvas.parentElement)
    raf = requestAnimationFrame(tick)

    // When the cluster scrolls out of view while still playing, fade out and
    // stop on its own — so the groove never follows the visitor down the page.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) fadeOutAndStop()
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      clearTimeout(fadeTimer)
      clearTimeout(autoTimer)
      stopGroove()
      restoreGain()
    }
  }, [])

  return (
    <div className="exhibit-cluster">
      <canvas
        ref={canvasRef}
        className="exhibit-cluster__canvas"
        aria-hidden="true"
        onClick={() => apiRef.current?.strike()}
      />
      <button
        type="button"
        className="exhibit-cluster__cta"
        onClick={() => (playing ? apiRef.current?.stop() : apiRef.current?.strike())}
      >
        {playing ? 'stop' : 'click me'}
      </button>
    </div>
  )
}

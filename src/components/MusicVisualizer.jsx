import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import './MusicVisualizer.css'

const BAR_COUNT = 48
const IDLE_SPEED = 0.6

export default function MusicVisualizer({ isPlaying = false, trackName = '', currentTime = '' }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const phaseRef = useRef(0)
  const barsRef = useRef(new Float32Array(BAR_COUNT).fill(0.1))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (timestamp) => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      // Smooth bars toward target
      const bars = barsRef.current
      phaseRef.current += IDLE_SPEED * 0.016

      for (let i = 0; i < BAR_COUNT; i++) {
        const freq = (i / BAR_COUNT) * Math.PI * 2
        const sineVal = Math.sin(freq * 2 + phaseRef.current)
        const sineVal2 = Math.sin(freq * 0.7 + phaseRef.current * 1.3)
        let target

        if (isPlaying) {
          target = 0.15 + Math.abs(sineVal) * 0.55 + Math.abs(sineVal2) * 0.3
        } else {
          // Gentle idle wave
          target = 0.05 + Math.abs(Math.sin(freq + phaseRef.current * 0.4)) * 0.25
        }

        bars[i] += (target - bars[i]) * 0.12
      }

      const barW = W / BAR_COUNT
      const gap = barW * 0.25

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * barW + gap / 2
        const barHeight = bars[i] * H * 0.85
        const y = (H - barHeight) / 2

        // Gradient per bar
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight)
        if (isPlaying) {
          grad.addColorStop(0, 'rgba(74, 222, 128, 0.9)')
          grad.addColorStop(0.5, 'rgba(74, 222, 128, 0.5)')
          grad.addColorStop(1, 'rgba(74, 222, 128, 0.9)')
        } else {
          grad.addColorStop(0, 'rgba(212, 168, 83, 0.5)')
          grad.addColorStop(0.5, 'rgba(212, 168, 83, 0.2)')
          grad.addColorStop(1, 'rgba(212, 168, 83, 0.5)')
        }

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x, y, barW - gap, barHeight, 2)
        ctx.fill()
      }

      // Draw track name overlay using pretext for layout
      if (trackName) {
        document.fonts.ready.then(() => {
          ctx.font = '400 13px "IBM Plex Mono"'
          ctx.fillStyle = 'rgba(240, 240, 240, 0.5)'

          const prepared = prepareWithSegments(trackName, '400 13px "IBM Plex Mono"')
          const { lines } = layoutWithLines(prepared, W - 32, 18)
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i].text, 16, 18 + i * 18)
          }

          if (currentTime) {
            ctx.font = '300 11px "IBM Plex Mono"'
            ctx.fillStyle = 'rgba(136, 136, 136, 0.6)'
            ctx.fillText(currentTime, 16, H - 10)
          }
        })
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [isPlaying, trackName, currentTime])

  return (
    <div className="music-visualizer">
      <canvas ref={canvasRef} className="music-visualizer__canvas" aria-hidden="true" />
      <div
        className={['music-visualizer__glow', isPlaying ? 'music-visualizer__glow--active' : ''].join(' ')}
        aria-hidden="true"
      />
    </div>
  )
}

import { useEffect, useRef } from 'react'

// Drives a scroll-linked "ink mask" on registered elements. Each element gets a
// --p custom property (0 → 1) tracking how far it has scrolled through its
// reveal window; CSS combines --p with each letter's --pos to sweep a gray→black
// mask across the text, letter by letter. The window spans the lower half of the
// viewport so the sweep is gradual: it begins when the element's top enters from
// the bottom edge (1.0 * viewport height) and completes only once it reaches the
// middle (0.5 * viewport height).
const START = 1.0 // begins as the element enters from the bottom
const END = 0.5 // fully swept by the time its top reaches 50vh

export function useInkReveal() {
  const elements = useRef([])
  const frame = useRef(0)

  // Ref callback handed to each animated element; dedupes on remount.
  const register = (el) => {
    if (el && !elements.current.includes(el)) elements.current.push(el)
  }

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const update = () => {
      frame.current = 0
      const vh = window.innerHeight
      for (const el of elements.current) {
        if (reduceMotion) {
          el.style.setProperty('--p', '1')
          continue
        }
        const { top } = el.getBoundingClientRect()
        // Linear in scroll position so the ink advances exactly as fast as the
        // page scrolls — no easing that races ahead or lags behind the gesture.
        const raw = (START * vh - top) / ((START - END) * vh)
        const clamped = Math.min(1, Math.max(0, raw))
        el.style.setProperty('--p', clamped.toFixed(4))
      }
    }

    // Coalesce scroll/resize bursts into a single rAF-aligned update.
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  return register
}

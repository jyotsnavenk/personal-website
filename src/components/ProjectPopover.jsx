import { useLayoutEffect, useRef, useState } from 'react'
import './ProjectPopover.css'

// A macOS-style floating window: glass header (drag handle, title with image
// indicator, close) above an image area. Dragging inside the image flips
// between images — right-to-left for next, left-to-right for previous.
// Windows live inside the projects section and never leave it: they are
// absolutely positioned children of the section, and dragging is clamped to
// the section bounds.
const SWIPE_THRESHOLD = 60
const FALLBACK_RATIO = 1080 / 650
const MIN_IMAGE_WIDTH = 220
const SLIDE_MS = 240

export default function ProjectPopover({ data, onClose, onFocus }) {
  const { id, title, images, z } = data
  const [pos, setPos] = useState({ x: data.x, y: data.y })
  const [size, setSize] = useState({ w: data.w, h: data.h })
  const [index, setIndex] = useState(0)
  // Filmstrip offset in px; `animating` switches the CSS transition on for
  // snaps and commits, off for live pointer tracking.
  const [strip, setStrip] = useState({ dx: 0, animating: false })
  const popRef = useRef(null)
  const imageRef = useRef(null)
  const lockRef = useRef(false) // ignores input while a slide commit animates

  // Chrome = everything around the image area (header + paddings). Measured
  // live so resizing can hold the image area exactly at the image's ratio.
  const measureChrome = () => {
    const el = popRef.current
    const imgArea = el.querySelector('.project-popover__image')
    const imgEl = imgArea.querySelector('img')
    return {
      el,
      chromeW: el.offsetWidth - imgArea.clientWidth,
      chromeH: el.offsetHeight - imgArea.clientHeight,
      ratio: imgEl?.naturalWidth ? imgEl.naturalWidth / imgEl.naturalHeight : FALLBACK_RATIO,
    }
  }

  // Snap the initial height so the image area matches the image ratio exactly
  // (the opener only estimates the header height).
  useLayoutEffect(() => {
    const { chromeW, chromeH, ratio } = measureChrome()
    setSize((s) => ({ w: s.w, h: Math.round((s.w - chromeW) / ratio + chromeH) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dragging works from anywhere in the info container — except the close
  // button, which must stay a plain click. Movement is clamped so the window
  // stays inside the projects section.
  const onHandleDown = (e) => {
    if (e.target.closest('.project-popover__close')) return
    e.preventDefault()
    onFocus(id)
    const el = popRef.current
    const bounds = el?.offsetParent
    let lastX = e.clientX
    let lastY = e.clientY
    const move = (ev) => {
      const dx = ev.clientX - lastX
      const dy = ev.clientY - lastY
      lastX = ev.clientX
      lastY = ev.clientY
      const maxX = bounds ? Math.max(0, bounds.clientWidth - el.offsetWidth) : Infinity
      const maxY = bounds ? Math.max(0, bounds.clientHeight - el.offsetHeight) : Infinity
      setPos((p) => ({
        x: Math.min(Math.max(0, p.x + dx), maxX),
        y: Math.min(Math.max(0, p.y + dy), maxY),
      }))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Corner-grip resize, locked to the image aspect ratio and clamped to the
  // section bounds.
  const onResizeDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onFocus(id)
    const { el, chromeW, chromeH, ratio } = measureChrome()
    const bounds = el.offsetParent
    const startX = e.clientX
    const startImgW = el.offsetWidth - chromeW
    const maxImgW = bounds
      ? Math.min(
          bounds.clientWidth - el.offsetLeft - chromeW,
          (bounds.clientHeight - el.offsetTop - chromeH) * ratio
        )
      : Infinity
    const move = (ev) => {
      const imgW = Math.max(MIN_IMAGE_WIDTH, Math.min(startImgW + (ev.clientX - startX), maxImgW))
      setSize({
        w: Math.round(imgW + chromeW),
        h: Math.round(imgW / ratio + chromeH),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Slides the strip one image over (animated), then commits the new index
  // and resets the strip offset — the swap is invisible because the incoming
  // slide lands exactly where the current one renders at rest. Commit fires
  // on transitionend, with a timer fallback for robustness.
  const slideTo = (target) => {
    const el = imageRef.current
    const stripEl = el?.querySelector('.project-popover__strip')
    if (!el || !stripEl || target < 0 || target > images.length - 1) return
    const dir = target > index ? -1 : 1
    lockRef.current = true
    let done = false
    let fallback
    const commit = () => {
      if (done) return
      done = true
      stripEl.removeEventListener('transitionend', commit)
      window.clearTimeout(fallback)
      setIndex(target)
      setStrip({ dx: 0, animating: false })
      lockRef.current = false
    }
    stripEl.addEventListener('transitionend', commit)
    fallback = window.setTimeout(commit, SLIDE_MS + 160)
    setStrip({ dx: dir * el.clientWidth, animating: true })
  }

  // Pointer interactions on the image container:
  // - plain click: right half → next image, left half → previous
  // - drag: the strip tracks the pointer 1:1 (current image moves out while
  //   the neighbor moves in); past the threshold it commits, else snaps back.
  const onImageDown = (e) => {
    if (images.length < 2 || lockRef.current) return
    e.preventDefault()
    const el = imageRef.current
    const hasPrev = index > 0
    const hasNext = index < images.length - 1
    const startX = e.clientX
    let moved = false
    const move = (ev) => {
      let dx = ev.clientX - startX
      if (Math.abs(dx) > 3) moved = true
      // Rubber-band when dragging toward a neighbor that doesn't exist.
      if ((dx < 0 && !hasNext) || (dx > 0 && !hasPrev)) dx *= 0.25
      setStrip({ dx, animating: false })
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const dx = ev.clientX - startX
      if (!moved) {
        const rect = el.getBoundingClientRect()
        if (ev.clientX > rect.left + rect.width / 2) {
          if (hasNext) slideTo(index + 1)
        } else if (hasPrev) {
          slideTo(index - 1)
        }
        return
      }
      if (dx <= -SWIPE_THRESHOLD && hasNext) slideTo(index + 1)
      else if (dx >= SWIPE_THRESHOLD && hasPrev) slideTo(index - 1)
      else setStrip({ dx: 0, animating: true })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={popRef}
      className="project-popover"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: z }}
      onPointerDown={() => onFocus(id)}
      role="dialog"
      aria-label={title}
    >
      <div className="project-popover__header" onPointerDown={onHandleDown}>
        <button
          className="project-popover__drag"
          aria-label="Move window"
          type="button"
        >
          {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
        </button>
        <p className="project-popover__title">
          {title} ({index + 1}/{images.length})
        </p>
        <button
          className="project-popover__close"
          onClick={() => onClose(id)}
          type="button"
        >
          [CLOSE]
        </button>
      </div>
      <div
        ref={imageRef}
        className={[
          'project-popover__image',
          images.length < 2 ? 'project-popover__image--static' : '',
        ].filter(Boolean).join(' ')}
        onPointerDown={onImageDown}
      >
        <div
          className={[
            'project-popover__strip',
            strip.animating ? 'project-popover__strip--animating' : '',
          ].filter(Boolean).join(' ')}
          style={{ transform: `translateX(${strip.dx}px)` }}
        >
          {index > 0 && (
            <img
              className="project-popover__slide project-popover__slide--prev"
              src={images[index - 1]}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          )}
          <img
            className="project-popover__slide"
            src={images[index]}
            alt={`${title} — image ${index + 1} of ${images.length}`}
            draggable={false}
          />
          {index < images.length - 1 && (
            <img
              className="project-popover__slide project-popover__slide--next"
              src={images[index + 1]}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          )}
        </div>
      </div>
      <div
        className="project-popover__resize"
        onPointerDown={onResizeDown}
        role="button"
        aria-label="Resize window"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="13" cy="5" r="1.3" />
          <circle cx="9" cy="9" r="1.3" />
          <circle cx="13" cy="9" r="1.3" />
          <circle cx="5" cy="13" r="1.3" />
          <circle cx="9" cy="13" r="1.3" />
          <circle cx="13" cy="13" r="1.3" />
        </svg>
      </div>
    </div>
  )
}

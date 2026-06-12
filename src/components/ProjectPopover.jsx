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

export default function ProjectPopover({ data, onClose, onFocus }) {
  const { id, title, images, z } = data
  const [pos, setPos] = useState({ x: data.x, y: data.y })
  const [size, setSize] = useState({ w: data.w, h: data.h })
  const [index, setIndex] = useState(0)
  const popRef = useRef(null)

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

  const onImageDown = (e) => {
    if (images.length < 2) return
    e.preventDefault()
    const startX = e.clientX
    const up = (ev) => {
      const dx = ev.clientX - startX
      if (dx <= -SWIPE_THRESHOLD) setIndex((i) => Math.min(images.length - 1, i + 1))
      else if (dx >= SWIPE_THRESHOLD) setIndex((i) => Math.max(0, i - 1))
      window.removeEventListener('pointerup', up)
    }
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
      <div className="project-popover__image" onPointerDown={onImageDown}>
        <img
          src={images[index]}
          alt={`${title} — image ${index + 1} of ${images.length}`}
          draggable={false}
        />
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

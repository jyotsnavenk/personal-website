import { useState } from 'react'
import { createPortal } from 'react-dom'
import './ProjectPopover.css'

// A macOS-style floating window: glass header (drag handle, title with image
// indicator, close) above an image area. Dragging inside the image flips
// between images — right-to-left for next, left-to-right for previous.
const SWIPE_THRESHOLD = 60

export default function ProjectPopover({ data, onClose, onFocus }) {
  const { id, title, images, w, h, z } = data
  const [pos, setPos] = useState({ x: data.x, y: data.y })
  const [index, setIndex] = useState(0)

  const onHandleDown = (e) => {
    e.preventDefault()
    onFocus(id)
    let lastX = e.clientX
    let lastY = e.clientY
    const move = (ev) => {
      const dx = ev.clientX - lastX
      const dy = ev.clientY - lastY
      lastX = ev.clientX
      lastY = ev.clientY
      setPos((p) => ({ x: p.x + dx, y: p.y + dy }))
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

  return createPortal(
    <div
      className="project-popover"
      style={{ left: pos.x, top: pos.y, width: w, height: h, zIndex: z }}
      onPointerDown={() => onFocus(id)}
      role="dialog"
      aria-label={title}
    >
      <div className="project-popover__header">
        <button
          className="project-popover__drag"
          onPointerDown={onHandleDown}
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
    </div>,
    document.body
  )
}

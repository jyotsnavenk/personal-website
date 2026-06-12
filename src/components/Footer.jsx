import { useEffect, useRef, useState } from 'react'
import { usePretextMeasure } from '../hooks/usePretext'
import { version } from '../../package.json'
import './Footer.css'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/jyotsnavenk/' },
  { label: 'X',         href: 'https://x.com/jyotsnavenk' },
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/in/jyotsnavenk/' },
  { label: 'GitHub',    href: 'https://github.com/jyotsnavenk' },
]

const COLOPHON_ITEMS = [
  'Type set in Martina Plantijn',
  'Hosted on Vercel',
  'Source on GitHub',
  'Paired with Claude Code',
]

function FooterLink({ label, href }) {
  const measure = usePretextMeasure(label, '400 12px "Martina Plantijn"', 200, 14)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="footer__link link-underline"
      aria-label={label}
      style={measure.ready ? { minWidth: measure.height > 0 ? 'auto' : undefined } : undefined}
    >
      {label}
    </a>
  )
}

function Colophon() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handlePointer(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <span className="footer__colophon" ref={ref}>
      <button
        type="button"
        className="footer__colophon-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        COLOPHON
      </button>
      {open && (
        <div className="footer__colophon-popover" role="dialog" aria-label="Colophon">
          <ul className="footer__colophon-list">
            {COLOPHON_ITEMS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}
    </span>
  )
}

export default function Footer() {
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <footer className="footer">
      <nav className="footer__links" aria-label="Social links">
        {SOCIAL_LINKS.map(({ label, href }) => (
          <FooterLink key={label} label={label} href={href} />
        ))}
      </nav>
      <div className="footer__meta">
        <span className="footer__meta-item">Happy {dayOfWeek}</span>
        <span className="footer__meta-dot" aria-hidden="true">·</span>
        <span className="footer__meta-item">© Jyotsna 2026</span>
        <span className="footer__meta-dot" aria-hidden="true">·</span>
        <span className="footer__meta-item">v{version}</span>
        <span className="footer__meta-dot" aria-hidden="true">·</span>
        <Colophon />
      </div>
    </footer>
  )
}

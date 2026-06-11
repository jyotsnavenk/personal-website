import { usePretextMeasure } from '../hooks/usePretext'
import './Footer.css'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/jyotsnavenk/' },
  { label: 'X',         href: 'https://x.com/jyotsnavenk' },
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/in/jyotsnavenk/' },
  { label: 'GitHub',    href: 'https://github.com/jyotsnavenk' },
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

export default function Footer() {
  const taglineMeasure = usePretextMeasure('happily tinkering', 'italic 400 12px "Martina Plantijn"', 300, 14)

  return (
    <footer className="footer">
      <span
        className="footer__tagline"
        style={taglineMeasure.ready ? { minHeight: taglineMeasure.height } : undefined}
      >
        happily tinkering
      </span>
      <nav className="footer__links" aria-label="Social links">
        {SOCIAL_LINKS.map(({ label, href }) => (
          <FooterLink key={label} label={label} href={href} />
        ))}
      </nav>
    </footer>
  )
}

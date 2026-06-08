import { useLocation } from 'react-router-dom'
import SynthButton from './SynthButton'
import './Nav.css'

const NAV_ITEMS = [
  { label: 'DESIGN',   number: 1, href: '/',        variant: 'black', theme: 'light' },
  { label: 'VIBECODE', number: 2, href: '/codes',   variant: 'black', theme: 'light' },
  { label: 'MUSIC',    number: 3, href: '/plays',   variant: 'black', theme: 'light', pulseColor: 'var(--color-music-glow)', accentColor: 'var(--color-music-active)' },
  { label: 'EXHIBIT',  number: 4, href: '/creates', variant: 'black', theme: 'light' },
  { label: 'ABOUT',    number: 5, href: 'https://x.com/jyotsnavenk', variant: 'gray', theme: 'light' },
]

export default function Nav() {
  const location = useLocation()

  return (
    <nav className="nav animate-slide-down" aria-label="Main navigation">
      <div className="nav__inner">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href.startsWith('http')
            ? false
            : item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href)

          return (
            <SynthButton
              key={item.label}
              label={item.label}
              number={item.number}
              variant={isActive ? 'blue' : item.variant}
              theme={item.theme}
              size="medium"
              href={item.href}
              isActive={isActive}
              accentColor={item.accentColor}
              pulseColor={item.pulseColor}
            />
          )
        })}
      </div>
    </nav>
  )
}

import { Link } from 'react-router-dom'
import './SynthButton.css'

const SIZE_MAP = {
  small:  { tile: 48, button: 34, indicator: 3, labelSize: 7, radius: 8 },
  medium: { tile: 56, button: 40, indicator: 4, labelSize: 8, radius: 10 },
  large:  { tile: 70, button: 52, indicator: 5, labelSize: 10, radius: 14 },
}

export default function SynthButton({
  label,
  number,
  variant = 'black',
  theme = 'dark',
  accentColor,
  size = 'medium',
  href,
  isActive = false,
  pulseColor,
}) {
  const dims = SIZE_MAP[size]
  const resolvedAccent = accentColor || 'var(--color-accent)'
  const resolvedPulse = pulseColor || accentColor || 'var(--color-accent-glow)'
  const isBlue = variant === 'blue'
  const numberColor = isBlue ? '#ffffff' : isActive ? resolvedAccent : undefined
  const numberSize = Math.round(dims.button * 0.35)

  const buttonContent = (
    <div
      className={[
        'synth-wrapper',
        `synth-wrapper--${theme}`,
        isActive ? 'synth-wrapper--active' : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--pulse-color': resolvedPulse,
        '--accent': resolvedAccent,
      }}
    >
      <div className="synth-wrapper__header">
        <span
          className={[
            'synth-wrapper__indicator',
            isActive ? 'synth-wrapper__indicator--active' : '',
          ].filter(Boolean).join(' ')}
          style={{
            width: dims.indicator,
            height: dims.indicator,
            minWidth: dims.indicator,
            minHeight: dims.indicator,
          }}
          aria-hidden="true"
        />
        <span
          className="synth-wrapper__label"
          style={{ fontSize: dims.labelSize }}
        >
          {label}
        </span>
      </div>

      <div
        className={[
          'synth-tile',
          `synth-tile--${variant}`,
          `synth-tile--${size}`,
        ].filter(Boolean).join(' ')}
        style={{ width: dims.tile, height: dims.tile }}
      >
        <div
          className="synth-tile__button"
          style={{ width: dims.button, height: dims.button }}
        >
          <span
            className="synth-tile__number"
            style={{
              fontSize: numberSize,
              letterSpacing: '-0.02em',
              ...(numberColor ? { color: numberColor } : {}),
            }}
          >
            {number}
          </span>
        </div>
      </div>
    </div>
  )

  if (href) {
    const isExternal = href.startsWith('http')
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="synth-button-link"
          aria-label={label}
        >
          {buttonContent}
        </a>
      )
    }
    return (
      <Link to={href} className="synth-button-link" aria-label={label}>
        {buttonContent}
      </Link>
    )
  }

  return buttonContent
}

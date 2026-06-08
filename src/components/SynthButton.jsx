import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePretextFit, usePretextMeasure } from '../hooks/usePretext'
import './SynthButton.css'

const SIZE_MAP = {
  small:  { tile: 48, button: 34, indicator: 3, fontSize: 7 },
  medium: { tile: 56, button: 40, indicator: 4, fontSize: 8 },
  large:  { tile: 70, button: 52, indicator: 5, fontSize: 10 },
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
  const labelRef = useRef(null)
  const dims = SIZE_MAP[size]
  const resolvedAccent = accentColor || 'var(--color-accent)'
  const resolvedPulse = pulseColor || accentColor || 'var(--color-accent-glow)'

  const labelFont = `500 ${dims.fontSize}px "IBM Plex Mono"`
  const numberFont = `400 ${dims.fontSize * 1.4}px "IBM Plex Mono"`
  const maxLabelWidth = dims.tile * 2

  const labelFits = usePretextFit(label, labelFont, maxLabelWidth)
  const labelMeasure = usePretextMeasure(label, labelFont, maxLabelWidth, dims.fontSize * 1.4)
  const numberMeasure = usePretextMeasure(String(number), numberFont, dims.button, dims.fontSize * 1.4 * 1.2)

  if (!labelFits && labelMeasure.ready) {
    console.warn(`SynthButton "${label}": label may overflow at size=${size}`)
  }

  const isBlue = variant === 'blue'
  const numberColor = isBlue
    ? '#ffffff'
    : isActive
      ? resolvedAccent
      : undefined

  const buttonContent = (
    <div
      className={[
        'synth-tile',
        `synth-tile--${variant}`,
        `synth-tile--${size}`,
        `synth-tile--${theme}`,
        isActive ? 'synth-tile--active' : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--pulse-color': resolvedPulse,
        '--accent': resolvedAccent,
        minWidth: dims.tile,
        height: dims.tile,
        width: 'auto',
      }}
    >
      <div className="synth-tile__header">
        <span
          ref={labelRef}
          className="synth-tile__label"
          style={{
            fontSize: dims.fontSize,
            minWidth: labelMeasure.ready ? labelMeasure.height > 0 ? 'auto' : undefined : undefined,
          }}
        >
          {label}
        </span>
        <span
          className={['synth-tile__indicator', isActive ? 'synth-tile__indicator--active' : ''].filter(Boolean).join(' ')}
          style={{
            width: dims.indicator,
            height: dims.indicator,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </div>
      <div
        className="synth-tile__button"
        style={{
          width: dims.button,
          height: dims.button,
        }}
      >
        <span
          className="synth-tile__number"
          style={{
            fontSize: dims.fontSize * 1.4,
            color: numberColor,
          }}
        >
          {number}
        </span>
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

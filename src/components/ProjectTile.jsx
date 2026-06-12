import './ProjectTile.css'

// A single project tile: a synth-style header (status indicator dot + label)
// sitting above the project image. Clicking opens the project's popover;
// the indicator lights up while a popover for this project is open.
export default function ProjectTile({ label, imageSrc, alt, isActive = false, onClick, style }) {
  const onKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <article
      className={['project-tile', isActive ? 'project-tile--active' : ''].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open ${label}`}
    >
      <div className="project-tile__header">
        <span className="project-tile__indicator" aria-hidden="true" />
        <span className="project-tile__label">{label}</span>
      </div>
      <div className="project-tile__image">
        {imageSrc ? (
          <img src={imageSrc} alt={alt || label} loading="lazy" />
        ) : (
          <div className="project-tile__placeholder" aria-hidden="true" />
        )}
      </div>
    </article>
  )
}

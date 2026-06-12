import './ProjectTile.css'

// A single project tile: a synth-style header (status indicator dot + label)
// sitting above the project image. The indicator activates on hover.
export default function ProjectTile({ label, imageSrc, alt }) {
  return (
    <article className="project-tile">
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

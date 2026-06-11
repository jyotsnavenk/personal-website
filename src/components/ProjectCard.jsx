import { useEffect, useRef, useState } from 'react'
import './ProjectCard.css'

export default function ProjectCard({ number, company, title, description, imageSrc, index = 0, disableReveal = false }) {
  const [visible, setVisible] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (disableReveal) return
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 60)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [index, disableReveal])

  return (
    <article
      ref={cardRef}
      className={[
        'project-card',
        disableReveal ? 'project-card--static' : visible ? 'project-card--visible' : '',
      ].join(' ')}
    >
      <div className="project-card__image-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={`${company} — ${title}`} loading="lazy" />
        ) : (
          <div className="project-card__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="project-card__info">
        <p className="project-card__title">{title}</p>
        <p className="project-card__desc">{description}</p>
      </div>
    </article>
  )
}

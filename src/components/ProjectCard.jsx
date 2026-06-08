import { useEffect, useRef, useState } from 'react'
import { usePretextMeasure } from '../hooks/usePretext'
import './ProjectCard.css'

export default function ProjectCard({ number, company, title, description, imageSrc, index = 0 }) {
  const [visible, setVisible] = useState(false)
  const [cardWidth, setCardWidth] = useState(320)
  const cardRef = useRef(null)

  useEffect(() => {
    if (cardRef.current) setCardWidth(cardRef.current.offsetWidth)
  }, [])

  const descWidth = cardWidth - 48
  const descMeasure = usePretextMeasure(description, '400 14px "IBM Plex Sans"', descWidth, 21)
  const titleMeasure = usePretextMeasure(title, '700 18px "Playfair Display"', cardWidth - 40, 20)
  const companyMeasure = usePretextMeasure(company, '500 10px "IBM Plex Mono"', cardWidth - 40, 14)
  const numMeasure = usePretextMeasure(String(number).padStart(2, '0'), '300 48px "IBM Plex Mono"', cardWidth, 52)

  useEffect(() => {
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
  }, [index])

  return (
    <article
      ref={cardRef}
      className={['project-card', visible ? 'project-card--visible' : ''].join(' ')}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="project-card__image-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={`${company} — ${title}`} loading="lazy" />
        ) : (
          <div className="project-card__placeholder" aria-hidden="true">
            <span className="project-card__placeholder-num">{String(number).padStart(2, '0')}</span>
          </div>
        )}
        <div className="project-card__overlay">
          <div className="project-card__meta">
            <span
              className="project-card__company"
              style={companyMeasure.ready ? { minHeight: companyMeasure.height } : undefined}
            >
              {company}
            </span>
            <h3
              className="project-card__title"
              style={titleMeasure.ready ? { minHeight: titleMeasure.height } : undefined}
            >
              {title}
            </h3>
          </div>
        </div>
      </div>
      <div
        className="project-card__desc-wrap"
        style={descMeasure.ready ? { minHeight: descMeasure.height + 32 } : undefined}
      >
        <p className="project-card__desc">{description}</p>
      </div>
    </article>
  )
}

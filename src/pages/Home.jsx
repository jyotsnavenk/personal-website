import { useLayoutEffect, useState, useRef } from 'react'
import ProjectTile from '../components/ProjectTile'
import Footer from '../components/Footer'
import projectContentRaw from '../data/project-content.md?raw'
import './Home.css'

const INTRO = "I have spent my whole career being the only designer in the room. That experience has pushed me to prototype highly polished designs quickly, and pitch decisions to get product and engineering on the same page."

const PROJECTS = [
  { number: 1, label: 'Analytics Dashboard',         imageSrc: '/project-images/img-lossruns.jpg' },
  { number: 2, label: 'Design Systems',              imageSrc: '/project-images/img-chat.jpg' },
  { number: 3, label: 'Workflow automation',         imageSrc: '/project-images/img-proposals.jpg' },
  { number: 4, label: 'Accounts Control Center',     imageSrc: '/project-images/img-accounts.jpg' },
  { number: 5, label: 'Desktop Intelligence Layer',  imageSrc: '/project-images/img-desktopcad.jpg' },
  { number: 6, label: 'Web Platform Design',         imageSrc: '/project-images/img-cadplatform.jpg' },
  { number: 7, label: 'E-commerce website',          imageSrc: '/project-images/img-vanrysel.jpg' },
]

function parseProjectContent(raw) {
  return raw.trim().split(/\n\n/).map((block) => {
    const [first, ...rest] = block.split('\n')
    const title = first.replace(/\*\*/g, '')
    const body = rest.join(' ')
    return { title, body }
  })
}

const companyDescriptions = parseProjectContent(projectContentRaw)

function ProjectsGrid({ companyDescriptions }) {
  return (
    <section className="projects grid" aria-label="Portfolio projects">
      <hr className="projects__divider" />

      <div className="projects__text">
        <div className="projects__intro">
          <p className="projects__heading">All Projects</p>
          <p className="projects__intro-body">{INTRO}</p>
        </div>
        {companyDescriptions.map((entry) => (
          <div key={entry.title} className="projects__company-block">
            <p className="projects__company-name">{entry.title}</p>
            <p className="projects__company-desc">{entry.body}</p>
          </div>
        ))}
      </div>

      <div className="projects__cards">
        {PROJECTS.map((project) => (
          <ProjectTile
            key={project.number}
            label={project.label}
            imageSrc={project.imageSrc}
          />
        ))}
      </div>
    </section>
  )
}

const FULCRUM_LINK = (
  <a href="https://www.withfulcrum.com/" target="_blank" rel="noopener noreferrer" className="link-underline">Fulcrum</a>
)
const HANOMI_LINK = (
  <a href="https://www.hanomi.ai/" target="_blank" rel="noopener noreferrer" className="link-underline">Hanomi</a>
)

export default function Home() {
  const [expanded, setExpanded] = useState(false)
  const bodyRef = useRef(null)
  const prevHeight = useRef(null)

  // Animate the body between its collapsed and expanded heights. React has
  // already swapped in the new content by the time this runs, so we use the
  // previous height (captured in a ref) as the start, measure the new content's
  // natural height as the target, then ease between them before releasing to
  // `auto`. Height is cleared before measuring so a stale fixed height from an
  // in-flight animation can't skew the target.
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const from = prevHeight.current

    el.style.transition = 'none'
    el.style.overflow = 'hidden'
    el.style.height = 'auto'
    const to = el.getBoundingClientRect().height
    prevHeight.current = to

    if (from == null || Math.abs(from - to) < 0.5) {
      el.style.height = ''
      el.style.overflow = ''
      el.style.transition = ''
      return
    }

    el.style.height = `${from}px`
    el.getBoundingClientRect() // force reflow so the start height is committed
    const isCollapsing = to < from
    el.style.transition = isCollapsing
      ? 'height 0.35s cubic-bezier(0.33, 0, 0, 1)'
      : 'height 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
    el.style.height = `${to}px`

    // Release the fixed height back to `auto` once the ease finishes. A timeout
    // backs up transitionend in case it doesn't fire (e.g. a backgrounded tab).
    let done = false
    let timer
    const finish = () => {
      if (done) return
      done = true
      el.style.height = 'auto'
      el.style.overflow = ''
      el.style.transition = ''
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(timer)
    }
    const onEnd = (e) => {
      if (e.propertyName === 'height') finish()
    }
    el.addEventListener('transitionend', onEnd)
    timer = setTimeout(finish, 550)
    return () => {
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(timer)
    }
  }, [expanded])

  return (
    <div className="page home animate-page-enter">
      <section className="hero grid">
        <div className="hero__content">
          <h1 className="hero__name">Jyotsna Venkatesh</h1>
          <p className="hero__subtitle">I'm a product designer pivoting to design engineering. Based in San Francisco.</p>
          <div className="hero__body" ref={bodyRef}>
            {expanded ? (
              <>
                <p className="hero__paragraph">Previously I was a founding designer at two early stage startups {FULCRUM_LINK} and {HANOMI_LINK}. I am currently looking for my next role at a small startup to operate across EPD; engineering, product and design.</p>
                <p className="hero__paragraph">I have found myself consistently at the intersection of design and engineering. I have a Master's in Creative Technology and Design to push the boundaries of my degree in electrical engineering and pursue blending art and technology for the sole purpose of making cool shit.</p>
                <p className="hero__paragraph">Having recently returned from a sabbatical, I have a renewed sense of commitment to follow my creative pursuits; making short films, shooting photos on film, and writing essays. <em>Expose yourself to much of the world and see what emerges.</em></p>
                <p className="hero__paragraph">Let's build together. Email <span className="link-underline">jyotsna.venk@gmail.com</span></p>
                <button className="hero__toggle" onClick={() => setExpanded(false)}><span className="hero__toggle-label">less information</span> &minus;</button>
              </>
            ) : (
              <>
                <p className="hero__paragraph">Previously I was a founding designer at {FULCRUM_LINK} and {HANOMI_LINK}.</p>
                <button className="hero__toggle" onClick={() => setExpanded(true)}><span className="hero__toggle-label">more information</span> +</button>
              </>
            )}
          </div>
        </div>
      </section>

      <ProjectsGrid companyDescriptions={companyDescriptions} />

      <Footer />
    </div>
  )
}

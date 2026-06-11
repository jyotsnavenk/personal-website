import { useEffect, useState, useRef } from 'react'
import { usePretextLines, usePretextMeasure } from '../hooks/usePretext'
import ProjectCard from '../components/ProjectCard'
import Footer from '../components/Footer'
import projectContentRaw from '../data/project-content.md?raw'
import './Home.css'

const HERO_LINES = ['design AND', 'creative technology']
const HERO_FONT = 'italic 700 80px "Playfair Display"'
const BODY_TEXT = 'Jyotsna is a product designer based in SF. 2x founding designer who enjoys being a part of early-stage startups to build products from the ground up.'

const PROJECTS = [
  { number: 1, title: 'Analytics Dashboard, Prototype',                 description: 'Prototypes the loss runs analytics dashboard with Claude Code. Blank canvas to engineering handoff in a single day.', imageSrc: '/project-images/img-lossruns.jpg' },
  { number: 2, title: 'Chat Assistant, Design Systems',                 description: 'I built the chat component system: consistent patterns and visual guidelines across every chat assistant workflow.', imageSrc: '/project-images/img-chat.jpg' },
  { number: 3, title: 'Proposal Documents, End-to-end workflow automation', description: 'I designed a document editor covering the full flow from file ingestion to Word export. Shipped in under a week to close a major deal.', imageSrc: '/project-images/img-proposals.jpg' },
  { number: 4, title: 'Accounts Control Center',                        description: 'I designed the account dashboard: a single hub for managing activity, documents, coverage, and kicking off workflows.', imageSrc: '/project-images/img-accounts.jpg' },
  { number: 5, title: 'Desktop Intelligence Layer for Solidworks',      description: 'I led discovery and design for an intelligence layer that sits on top of CAD Softwares. Guided engineers through chat and analysis from 3D model to production-ready 2D drawings.', imageSrc: '/project-images/img-desktopcad.jpg' },
  { number: 6, title: 'Web Platform Design',                            description: 'I designed the upload-to-download flow for a 3D CAD platform, and created brand assets for marketing events.', imageSrc: '/project-images/img-cadplatform.jpg' },
  { number: 7, title: 'Design for an e-commerce website',               description: 'I designed the full e-commerce experience, from navigation to content, for a French luxury bike brand entering the US market.', imageSrc: '/project-images/img-vanrysel.jpg' },
]

// Maps each project card (by index) to its company block on the left.
// companyDescriptions order is [Fulcrum, Hanomi, Decathlon].
//   cards 0–3 → Fulcrum, cards 4–5 → Hanomi, card 6 → Decathlon
const CARD_COMPANY = [0, 0, 0, 0, 1, 1, 2]

function parseProjectContent(raw) {
  return raw.trim().split(/\n\n/).map((block) => {
    const [first, ...rest] = block.split('\n')
    const title = first.replace(/\*\*/g, '')
    const body = rest.join(' ')
    return { title, body }
  })
}

const companyDescriptions = parseProjectContent(projectContentRaw)

function HeroLine({ text, delay, lineHeight }) {
  const [revealed, setRevealed] = useState(false)
  const lineMeasure = usePretextMeasure(text, HERO_FONT, 1100, lineHeight || 88)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300 + delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="hero__line-wrap"
      style={lineMeasure.ready ? { minHeight: lineMeasure.height } : undefined}
    >
      <span className={['hero__line', revealed ? 'hero__line--revealed' : ''].join(' ')}>
        {text}
      </span>
    </div>
  )
}

function StickyProjects({ companyDescriptions }) {
  const outerRef = useRef(null)
  const cardsRef = useRef(null)
  const textRef = useRef(null)
  const sectionRef = useRef(null)
  const [outerHeight, setOuterHeight] = useState('auto')

  useEffect(() => {
    const outer = outerRef.current
    const cards = cardsRef.current
    const text = textRef.current
    const section = sectionRef.current
    if (!outer || !cards || !section) return

    // SPEED > 1 lengthens the scroll runway so the cards travel slower than the
    // page scroll. EASE controls the trailing lag (lower = laggier/softer).
    const SPEED = 2.2
    const EASE = 0.07

    let travel = 0   // how far the card column must move to show the last card
    let runway = 0   // scroll distance allotted for that travel (travel * SPEED)
    let target = 0   // resting position derived from scroll
    let current = 0  // eased position actually rendered
    let stops = [0]  // translate values that center each card (dwell points)
    let rafId = null
    let running = false
    let reduceMotion = false

    const measure = () => {
      // Build the dwell points: for each card, the translate amount that lands
      // its center on the viewport center. The section pins to top:0, so we
      // measure each card's center as an offset from the section top (which
      // becomes the viewport top once pinned) — this is independent of where
      // the section currently sits on the page (e.g. below the hero). The eased
      // mapping below slows to a near-stop at each of these, so every project
      // gets a beat in the center before the column moves on.
      const prevTransform = cards.style.transform
      cards.style.transform = 'translate3d(0, 0, 0)'
      const viewportCenter = window.innerHeight / 2
      const sectionTop = section.getBoundingClientRect().top
      const centers = []
      for (const card of cards.children) {
        const r = card.getBoundingClientRect()
        centers.push(Math.max(0, r.top - sectionTop + r.height / 2 - viewportCenter))
      }
      cards.style.transform = prevTransform

      // Travel must reach far enough that even the LAST card lands on center —
      // not merely become visible at the bottom — so each project can dwell.
      const lastCenter = centers.length ? centers[centers.length - 1] : 0
      travel = Math.max(0, cards.scrollHeight - window.innerHeight, lastCenter)
      runway = Math.round(travel * SPEED)
      setOuterHeight(runway > 0 ? `calc(100vh + ${runway}px)` : 'auto')

      const raw = [0, ...centers.map((c) => Math.min(travel, c))]
      raw.sort((a, b) => a - b)
      stops = raw.filter((v, i) => i === 0 || v - raw[i - 1] > 1)
    }

    // 6t^5 - 15t^4 + 10t^3 — eases in and out with zero velocity at both ends,
    // so the column decelerates into each dwell point and accelerates out of it.
    const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)

    const computeTarget = () => {
      if (runway <= 0 || stops.length < 2) {
        target = 0
        return
      }
      const top = outer.getBoundingClientRect().top
      const progress = Math.min(1, Math.max(0, -top / runway))
      // Spread the stops evenly across the runway, then ease between each pair.
      const segments = stops.length - 1
      const t = progress * segments
      let k = Math.floor(t)
      if (k >= segments) k = segments - 1
      const frac = smootherstep(t - k)
      target = stops[k] + (stops[k + 1] - stops[k]) * frac
    }

    let activeCompany = -1

    // Highlight the company block whose card is closest to the viewport center.
    const updateActive = () => {
      if (!text) return
      const viewportCenter = window.innerHeight / 2
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < cards.children.length; i++) {
        const r = cards.children[i].getBoundingClientRect()
        const center = r.top + r.height / 2
        const dist = Math.abs(center - viewportCenter)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      const company = CARD_COMPANY[best] ?? 0
      if (company === activeCompany) return
      activeCompany = company
      for (let i = 0; i < text.children.length; i++) {
        text.children[i].classList.toggle('is-active', i === company)
      }
    }

    const render = () => {
      cards.style.transform = `translate3d(0, ${-current}px, 0)`
      updateActive()
    }

    const tick = () => {
      current += (target - current) * EASE
      if (Math.abs(target - current) < 0.15) current = target
      render()
      if (Math.abs(target - current) > 0.15) {
        rafId = requestAnimationFrame(tick)
      } else {
        running = false
      }
    }

    const start = () => {
      if (running) return
      running = true
      rafId = requestAnimationFrame(tick)
    }

    const onScroll = () => {
      computeTarget()
      if (reduceMotion) {
        current = target
        render()
      } else {
        start()
      }
    }

    const onResize = () => {
      measure()
      onScroll()
    }

    reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    measure()
    computeTarget()
    current = target
    render()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      className="projects-outer"
      style={{ height: outerHeight }}
    >
      <section
        ref={sectionRef}
        className="projects projects--sticky grid"
        aria-label="Portfolio projects"
      >
        <hr className="projects__divider" />
        <div ref={textRef} className="projects__text">
          {companyDescriptions.map((entry) => (
            <div key={entry.title} className="projects__company-block">
              <p className="projects__company-name">{entry.title}</p>
              <p className="projects__company-desc">{entry.body}</p>
            </div>
          ))}
        </div>
        <div ref={cardsRef} className="projects__cards">
          {PROJECTS.map((project, i) => (
            <ProjectCard
              key={project.number}
              {...project}
              index={i}
              disableReveal
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Home() {
  const [bodyRevealed, setBodyRevealed] = useState(false)
  const [heroWidth, setHeroWidth] = useState(1100)
  const heroRef = useRef(null)

  const bodyMeasure = usePretextMeasure(
    BODY_TEXT,
    '300 16px "IBM Plex Sans"',
    Math.min(heroWidth, 620),
    28
  )

  useEffect(() => {
    if (heroRef.current) setHeroWidth(heroRef.current.offsetWidth)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setBodyRevealed(true), 700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="page home animate-page-enter">
      <section className="hero grid" ref={heroRef}>
        <div className="hero__heading-wrap">
          <h1 className="hero__heading">
            {HERO_LINES.map((line, i) => (
              <HeroLine key={line} text={line} delay={i * 80} lineHeight={88} />
            ))}
          </h1>
        </div>

        <div className="hero__body-wrap">
          <div
            className={['hero__body', bodyRevealed ? 'hero__body--visible' : ''].join(' ')}
            style={bodyMeasure.ready ? { minHeight: bodyMeasure.height } : undefined}
          >
            <p>
              <span className="hero__body-bold">Jyotsna is a product designer based in SF ツ</span><br />
              2x founding designer who enjoys being a part of early-stage startups to build
              products from the ground up. Most recently I was a founding designer at{' '}
              <a href="https://www.withfulcrum.com/" target="_blank" rel="noopener noreferrer" className="link-underline">
                Fulcrum
              </a>{' '}
              designing end-to-end agentic workflows for insurance brokerages and prior to that
              I was a founding designer at{' '}
              <a href="https://hanomi.ai/" target="_blank" rel="noopener noreferrer" className="link-underline">
                Hanomi
              </a>{' '}
              designing intelligence layers for mechanical engineers.
            </p>
            <p>Every pixel of the work you see below is entirely my own.</p>
          </div>
        </div>
      </section>

      <StickyProjects companyDescriptions={companyDescriptions} />

      <Footer />
    </div>
  )
}

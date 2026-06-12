import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import ProjectCard from '../components/ProjectCard'
import Footer from '../components/Footer'
import projectContentRaw from '../data/project-content.md?raw'
import './Home.css'

const PROJECTS = [
  { number: 1, title: 'Analytics Dashboard, Prototype',                 description: 'Prototypes the loss runs analytics dashboard with Claude Code. Blank canvas to engineering handoff in a single day.', imageSrc: '/project-images/img-lossruns.jpg' },
  { number: 2, title: 'Chat Assistant, Design Systems',                 description: 'I built the chat component system: consistent patterns and visual guidelines across every chat assistant workflow.', imageSrc: '/project-images/img-chat.jpg' },
  { number: 3, title: 'Proposal Documents, End-to-end workflow automation', description: 'I designed a document editor covering the full flow from file ingestion to Word export. Shipped in under a week to close a major deal.', imageSrc: '/project-images/img-proposals.jpg' },
  { number: 4, title: 'Accounts Control Center',                        description: 'I designed the account dashboard: a single hub for managing activity, documents, coverage, and kicking off workflows.', imageSrc: '/project-images/img-accounts.jpg' },
  { number: 5, title: 'Desktop Intelligence Layer for Solidworks',      description: 'I led discovery and design for an intelligence layer that sits on top of CAD Softwares. Guided engineers through chat and analysis from 3D model to production-ready 2D drawings.', imageSrc: '/project-images/img-desktop.jpg' },
  { number: 6, title: 'Web Platform Design',                            description: 'I designed the upload-to-download flow for a 3D CAD platform, and created brand assets for marketing events.', imageSrc: '/project-images/img-hanomi.jpg' },
  { number: 7, title: 'Design for an e-commerce website',               description: 'I designed the full e-commerce experience, from navigation to content, for a French luxury bike brand entering the US market.', imageSrc: '/project-images/img-vanrysel.jpg' },
]

// Maps each project card (by index) to its company block on the left.
// companyDescriptions order is [Fulcrum, Hanomi, Decathlon].
//   cards 0–3 → Fulcrum, cards 4–5 → Hanomi, card 6 → Decathlon
const CARD_COMPANY = [0, 0, 0, 0, 1, 1, 2]

// First card index for each company — clicking a company block scrolls to it.
//   Fulcrum → card 0, Hanomi → card 4 (Desktop CAD), Decathlon → card 6 (Van Rysel)
const COMPANY_FIRST_CARD = CARD_COMPANY.reduce((acc, company, card) => {
  if (acc[company] === undefined) acc[company] = card
  return acc
}, [])

function parseProjectContent(raw) {
  return raw.trim().split(/\n\n/).map((block) => {
    const [first, ...rest] = block.split('\n')
    const title = first.replace(/\*\*/g, '')
    const body = rest.join(' ')
    return { title, body }
  })
}

const companyDescriptions = parseProjectContent(projectContentRaw)

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
    let stops = [0]      // translate values that center each card (dwell points)
    let cardTargets = [] // per-card translate that lands that card on center
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

      cardTargets = centers.map((c) => Math.min(travel, c))
      const raw = [0, ...cardTargets]
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

    // Scroll the page so a given card lands on the viewport center. The card's
    // dwell translate equals one of the stops, and the eased mapping hits each
    // stop exactly at its segment boundary, so the matching progress is just
    // stopIndex / segments. We convert that progress back into a page scrollY.
    const scrollToCard = (cardIndex) => {
      if (runway <= 0 || stops.length < 2) return
      const targetTranslate = cardTargets[cardIndex]
      if (targetTranslate === undefined) return
      let stopIndex = 0
      let bestDist = Infinity
      stops.forEach((s, i) => {
        const d = Math.abs(s - targetTranslate)
        if (d < bestDist) {
          bestDist = d
          stopIndex = i
        }
      })
      const progress = stopIndex / (stops.length - 1)
      const outerTopDoc = outer.getBoundingClientRect().top + window.scrollY
      const targetScrollY = Math.round(outerTopDoc + progress * runway)
      window.scrollTo({ top: targetScrollY, behavior: reduceMotion ? 'auto' : 'smooth' })
    }

    const blockListeners = []
    if (text) {
      for (let i = 0; i < text.children.length; i++) {
        const block = text.children[i]
        const firstCard = COMPANY_FIRST_CARD[i]
        if (firstCard === undefined) continue
        const onClick = () => scrollToCard(firstCard)
        const onKeyDown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            scrollToCard(firstCard)
          }
        }
        block.addEventListener('click', onClick)
        block.addEventListener('keydown', onKeyDown)
        blockListeners.push({ block, onClick, onKeyDown })
      }
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
      blockListeners.forEach(({ block, onClick, onKeyDown }) => {
        block.removeEventListener('click', onClick)
        block.removeEventListener('keydown', onKeyDown)
      })
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
            <div
              key={entry.title}
              className="projects__company-block"
              role="button"
              tabIndex={0}
              aria-label={`Scroll to ${entry.title} projects`}
            >
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

      <StickyProjects companyDescriptions={companyDescriptions} />

      <Footer />
    </div>
  )
}

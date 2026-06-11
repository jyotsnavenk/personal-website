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

      <section className="projects grid" aria-label="Portfolio projects">
        <hr className="projects__divider" />
        <div className="projects__text">
          {companyDescriptions.map((entry) => (
            <div key={entry.title} className="projects__company-block">
              <p className="projects__company-name">{entry.title}</p>
              <p className="projects__company-desc">{entry.body}</p>
            </div>
          ))}
        </div>
        <div className="projects__cards">
          {PROJECTS.map((project, i) => (
            <ProjectCard
              key={project.number}
              {...project}
              index={i}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}

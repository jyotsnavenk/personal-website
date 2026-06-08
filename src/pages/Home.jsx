import { useEffect, useState, useRef } from 'react'
import { usePretextLines, usePretextMeasure } from '../hooks/usePretext'
import ProjectCard from '../components/ProjectCard'
import Footer from '../components/Footer'
import './Home.css'

const HERO_LINES = ['design AND', 'creative technology']
const HERO_FONT = 'italic 700 80px "Playfair Display"'
const BODY_TEXT = 'Jyotsna is a product designer based in SF. 2x founding designer who enjoys being a part of early-stage startups to build products from the ground up.'

const PROJECTS = [
  { number: 1, company: 'Fulcrum',   title: 'Loss Runs Analytics Dashboard',         description: 'End-to-end data visualisation for insurance brokerages — surfacing risk signals from raw loss run documents into actionable analytics.' },
  { number: 2, company: 'Fulcrum',   title: 'Design Systems & Chat Components',       description: 'Built and maintained the full component library powering Fulcrum\'s agentic workflow UI, including a conversational interface system.' },
  { number: 3, company: 'Fulcrum',   title: 'End-to-end Workflow Automation',         description: 'Designed the document editor and processing pipeline that lets brokers automate multi-step insurance workflows with AI.' },
  { number: 4, company: 'Fulcrum',   title: 'User Dashboard',                         description: 'The primary command surface for Fulcrum — task management, status tracking, and workflow orchestration in a single view.' },
  { number: 5, company: 'Hanomi',    title: 'Intelligence Layer Product Exploration', description: 'Zero-to-one product explorations for an AI layer built on top of CAD and mechanical engineering workflows.' },
  { number: 6, company: 'Hanomi',    title: 'B2B Platform Design',                    description: 'Designed the core B2B product experience for mechanical engineers — onboarding, feature discovery, and collaboration flows.' },
  { number: 7, company: 'Van Rysel', title: 'E-commerce Design',                      description: 'Full e-commerce design for a cycling brand — product pages, checkout flows, and mobile-first responsive layouts.' },
]

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
      <section className="hero" ref={heroRef}>
        <h1 className="hero__heading">
          {HERO_LINES.map((line, i) => (
            <HeroLine key={line} text={line} delay={i * 80} lineHeight={88} />
          ))}
        </h1>

        <div
          className={['hero__body', bodyRevealed ? 'hero__body--visible' : ''].join(' ')}
          style={bodyMeasure.ready ? { minHeight: bodyMeasure.height } : undefined}
        >
          <p>
            Jyotsna is a product designer based in SF ツ<br />
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
            designing intelligence layers for mechanical engineers. Every pixel of the work
            you see below is entirely my own.
          </p>
        </div>
      </section>

      <section className="projects" aria-label="Portfolio projects">
        <div className="projects__grid">
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

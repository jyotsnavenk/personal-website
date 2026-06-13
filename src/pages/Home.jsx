import { useLayoutEffect, useState, useRef } from 'react'
import ProjectTile from '../components/ProjectTile'
import ProjectPopover from '../components/ProjectPopover'
import Footer from '../components/Footer'
import HeroChimes from '../components/HeroChimes'
import { getProjectImages } from '../data/projectImages'
import projectContentRaw from '../data/project-content.md?raw'
import './Home.css'

// `folder` names a subfolder of /project-images — its imgN.jpg files become
// the popover gallery for that project. `company` ties the tile to a company
// block so the desktop layout can align them on the same grid row.
const PROJECTS = [
  { number: 1, label: 'Analytics Dashboard',         imageSrc: '/project-images/img-lossruns.jpg',    folder: 'Loss Runs',                  company: 'Fulcrum' },
  { number: 2, label: 'Design Systems',              imageSrc: '/project-images/img-chat.jpg',        folder: 'Chat Assistant',             company: 'Fulcrum' },
  { number: 3, label: 'Workflow automation',         imageSrc: '/project-images/img-proposals.jpg',   folder: 'Proposals',                  company: 'Fulcrum' },
  { number: 4, label: 'Accounts Control Center',     imageSrc: '/project-images/img-accounts.jpg',    folder: 'Accounts',                   company: 'Fulcrum' },
  { number: 5, label: 'Desktop Intelligence Layer',  imageSrc: '/project-images/img-desktopcad.jpg',  folder: 'Desktop Intelligence Layer', company: 'Hanomi' },
  { number: 6, label: 'Web Platform Design',         imageSrc: '/project-images/img-cadplatform.jpg', folder: 'Hanomi Platform',            company: 'Hanomi' },
  { number: 7, label: 'E-commerce website',          imageSrc: '/project-images/img-vanrysel.jpg',    folder: 'Van Rysel',                  company: 'Decathlon' },
]

// Tiles flow into a two-column grid, so a project's grid row is its index / 2.
// The first project of each company fixes where that company's block aligns.
const COMPANY_START_ROW = PROJECTS.reduce((acc, project, i) => {
  if (!(project.company in acc)) acc[project.company] = Math.floor(i / 2) + 1
  return acc
}, {})

// Tiles fill a nested two-column grid (left then right) that spans one section
// row per pair, so column is 1 or 2 and row is the pair index.
const tileColumn = (i) => (i % 2) + 1
const tileRow = (i) => Math.floor(i / 2) + 1

// Splits a company description into its opening sentence (shown black on
// desktop) and the remainder (light gray). Falls back to the whole body if
// there is no sentence break.
const splitLead = (body) => {
  const match = body.match(/^(.*?\.)\s+(.*)$/)
  return match ? { lead: match[1], rest: match[2] } : { lead: body, rest: '' }
}

const IMAGE_RATIO = 1080 / 650
const POPOVER_HEADER = 38 // px — header row height used to derive width
const POPOVER_PAD = 24    // px — margins around the image area

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
  const [popovers, setPopovers] = useState([])
  const zRef = useRef(20)
  const idRef = useRef(0)

  // Opens a popover to the left of the clicked tile, sized to 55vh with the
  // width derived from the image aspect ratio. Repeat opens cascade like
  // stacked macOS windows. Coordinates are relative to the projects section —
  // popovers live inside it and never bleed into other sections.
  const openPopover = (project, e) => {
    const section = e.currentTarget.closest('.projects')
    const sec = section.getBoundingClientRect()
    const tile = e.currentTarget.getBoundingClientRect()
    const h = Math.round(window.innerHeight * 0.55)
    const w = Math.round((h - POPOVER_HEADER - POPOVER_PAD) * IMAGE_RATIO + POPOVER_PAD)
    const cascade = (popovers.length % 5) * 24
    const x = Math.max(12, tile.left - sec.left - w - 20) + cascade
    const y = Math.min(
      Math.max(12, tile.top - sec.top + cascade),
      Math.max(12, sec.height - h - 12)
    )
    const images = getProjectImages(project.folder)
    idRef.current += 1
    setPopovers((ps) => [...ps, {
      id: idRef.current,
      projectNumber: project.number,
      title: project.label,
      images: images.length ? images : [project.imageSrc],
      x, y, w, h,
      z: ++zRef.current,
    }])
  }

  const closePopover = (id) => setPopovers((ps) => ps.filter((p) => p.id !== id))
  const focusPopover = (id) =>
    setPopovers((ps) => ps.map((p) => (p.id === id ? { ...p, z: ++zRef.current } : p)))

  const tiles = PROJECTS.map((project, i) => (
    <ProjectTile
      key={project.number}
      label={project.label}
      imageSrc={project.imageSrc}
      isActive={popovers.some((p) => p.projectNumber === project.number)}
      onClick={(e) => openPopover(project, e)}
      style={{ '--tile-col': tileColumn(i), '--tile-row': tileRow(i) }}
    />
  ))

  return (
    <section className="projects grid projects--aligned" aria-label="Portfolio projects">
      {companyDescriptions.map((entry) => {
        const { lead, rest } = splitLead(entry.body)
        return (
          <div
            key={entry.title}
            className="projects__company-block projects__company-block--aligned"
            style={{ '--block-row': COMPANY_START_ROW[entry.title] }}
          >
            <p className="projects__company-name">{entry.title}</p>
            <p className="projects__company-desc">
              <span className="projects__company-lead">{lead}</span>
              {rest && ` ${rest}`}
            </p>
          </div>
        )
      })}

      <div className="projects__cards">{tiles}</div>

      {popovers.map((p) => (
        <ProjectPopover key={p.id} data={p} onClose={closePopover} onFocus={focusPopover} />
      ))}
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
                <p className="hero__paragraph">I enjoy exploring wild possibilities in ambiguous problem spaces to come up with thoughtfully designed solutions. At the moment, I'm interested in how we can simplify existing workflows so people can focus on more valuable work.</p>
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
        <HeroChimes />
      </section>

      <ProjectsGrid companyDescriptions={companyDescriptions} />

      <section className="about grid" aria-label="About me">
        <hr className="about__divider" />
        <div className="about__content">
          <p className="about__mark" aria-hidden="true">(&ldquo;)</p>
          <p className="about__body">Welcome to my little corner of the internet. My name is Jyotsna, I'm a San Francisco based designer. I am currently exploring the vast expanse of creative computation and this website is my small, growing playground of projects. Having recently returned from a sabbatical, I have a renewed sense of commitment to always follow my creative pursuits; making short films, shooting photos on film, and writing essays. On the side, I enjoy making music with code, playing with my composer, and creating small playlists.<br /><em>Expose yourself to much of the world and see what emerges.</em></p>
        </div>
      </section>

      <Footer />
    </div>
  )
}

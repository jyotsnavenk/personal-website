import Footer from '../components/Footer'
import ExhibitSection from '../components/ExhibitSection'
import ExhibitCluster from '../components/ExhibitCluster'
import { EXHIBITS } from '../data/exhibits'
import './Exhibit.css'

export default function Exhibit() {
  return (
    <div className="page exhibit animate-page-enter">
      <section className="exhibit-hero grid">
        <div className="exhibit-hero__content">
          <span className="exhibit-hero__label">exhibits</span>
          <h1 className="exhibit-hero__name">Jyotsna Venkatesh</h1>
          <p className="exhibit-hero__subtitle">I was an audio/visual installation artist for two years in grad school.</p>
          <div className="exhibit-hero__body">
            <p className="exhibit-hero__paragraph">I have been consistently at the intersection of design and engineering. I have a Master's in Creative Technology and Design to push the boundaries of my degree in electrical engineering and pursue blending art and technology for the sole purpose of making cool shit. I was tinkering around with touchdesigner, sensors, and projectors.</p>
            <p className="exhibit-hero__paragraph">I enjoyed exploring stories blending music, dreams and reality through movement.</p>
          </div>
        </div>
        <ExhibitCluster />
      </section>

      {EXHIBITS.map((project) => (
        <ExhibitSection key={project.title} {...project} />
      ))}

      <Footer />
    </div>
  )
}

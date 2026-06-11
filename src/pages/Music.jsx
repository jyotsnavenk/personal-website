import { usePretextMeasure } from '../hooks/usePretext'
import Footer from '../components/Footer'
import './Placeholder.css'

export default function Music() {
  const labelMeasure = usePretextMeasure('music', '400 12px "Martina Plantijn"', 300, 14)
  const titleMeasure = usePretextMeasure('coming soon', 'italic 500 16px "Martina Plantijn"', 800, 70)
  const subMeasure = usePretextMeasure('music & sound experiments', '400 14px "Martina Plantijn"', 600, 24)

  return (
    <div className="page placeholder animate-page-enter">
      <div className="placeholder__content">
        <span
          className="placeholder__label"
          style={labelMeasure.ready ? { minHeight: labelMeasure.height } : undefined}
        >
          music
        </span>
        <h1
          className="placeholder__title"
          style={titleMeasure.ready ? { minHeight: titleMeasure.height } : undefined}
        >
          coming soon
        </h1>
        <p
          className="placeholder__sub"
          style={subMeasure.ready ? { minHeight: subMeasure.height } : undefined}
        >
          music & sound experiments
        </p>
      </div>
      <Footer />
    </div>
  )
}

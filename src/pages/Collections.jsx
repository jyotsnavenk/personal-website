import { usePretextMeasure } from '../hooks/usePretext'
import Footer from '../components/Footer'
import './Placeholder.css'

export default function Collections() {
  const labelMeasure = usePretextMeasure('collections', '400 12px "Martina Plantijn"', 300, 14)
  const titleMeasure = usePretextMeasure('coming soon', 'italic 500 16px "Martina Plantijn"', 800, 70)
  const subMeasure = usePretextMeasure('curated collections & references', '400 14px "Martina Plantijn"', 600, 24)

  return (
    <div className="page placeholder animate-page-enter">
      <div className="placeholder__content grid">
        <span
          className="placeholder__label"
          style={labelMeasure.ready ? { minHeight: labelMeasure.height } : undefined}
        >
          collections
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
          curated collections & references
        </p>
      </div>
      <Footer />
    </div>
  )
}

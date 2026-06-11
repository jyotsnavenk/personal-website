import { Link } from 'react-router-dom'
import './TopBar.css'

export default function TopBar() {
  return (
    <header className="topbar grid">
      <span className="topbar__name">Jyotsna</span>

      <div className="topbar__index">
        <span className="topbar__heading">A. Index</span>
        <div className="topbar__links">
          <Link to="/">Design</Link>, <Link to="/codes">Playground</Link>, <Link to="/creates">Exhibits</Link>, <Link to="/plays">Playground</Link>
        </div>
      </div>

      <div className="topbar__follow">
        <span className="topbar__heading">B. Follow</span>
        <div className="topbar__links">
          <a href="https://instagram.com/jyotsnavenk" target="_blank" rel="noopener noreferrer">Instagram</a>, <a href="https://x.com/jyotsnavenk" target="_blank" rel="noopener noreferrer">Twitter</a>, <a href="https://github.com/jyotsnavenkatesh" target="_blank" rel="noopener noreferrer">Github</a>, <a href="https://substack.com/@jyotsnavenk" target="_blank" rel="noopener noreferrer">Substack</a>
        </div>
      </div>
    </header>
  )
}

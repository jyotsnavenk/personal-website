import { Routes, Route, useLocation } from 'react-router-dom'
import TopBar from './components/TopBar'
import Nav from './components/Nav'
import Home from './pages/Home'
import Vibecode from './pages/Vibecode'
import Music from './pages/Music'
import Exhibit from './pages/Exhibit'

export default function App() {
  const location = useLocation()

  return (
    <>
      <TopBar />
      <Nav />
      <main>
        <Routes location={location} key={location.pathname}>
          <Route path="/"        element={<Home />} />
          <Route path="/codes"   element={<Vibecode />} />
          <Route path="/plays"   element={<Music />} />
          <Route path="/creates" element={<Exhibit />} />
        </Routes>
      </main>
    </>
  )
}

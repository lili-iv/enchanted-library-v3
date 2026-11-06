import { useState, useEffect, useMemo, useRef } from 'react'
import { CFG } from './config'
import { GAMES } from './games'
import './styles.css'

function Task({ i, onWin, onClose }) {
  const [state, setState] = useState('play')
  const [n, setN] = useState(0)
  const G = GAMES[i]
  return <div className="modal"><div className="card">
    <h2>{CFG.pages[i].task}</h2>
    {state === 'play' && <G key={n} win={() => setState('won')} fail={() => setState('lost')} />}
    {state === 'won' && <><p className="big">You found the page!</p><button className="btn" onClick={onWin}>Take the page 📜</button></>}
    {state === 'lost' && <><p className="big">The page fluttered away…</p>
      <button className="btn" onClick={() => { setN(n + 1); setState('play') }}>Try again 🕯️</button></>}
    <button className="ghost" onClick={onClose}>← Back to the library</button>
  </div></div>
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [got, setGot] = useState(() => { try { return JSON.parse(localStorage.getItem('pages')) || [] } catch { return [] } })
  const [task, setTask] = useState(null)
  const [read, setRead] = useState(null)
  const [book, setBook] = useState(false)
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('muted') === '1' } catch { return false } })
  const audio = useRef(null)
  const playing = useRef(false)
  useEffect(() => {
    const a = new Audio(import.meta.env.BASE_URL + CFG.music)
    a.loop = true; a.volume = 0.4; audio.current = a
    // pause when the tab/phone screen is hidden, resume when back
    const vis = () => { if (document.hidden) a.pause(); else if (playing.current && !a.muted) a.play().catch(() => {}) }
    document.addEventListener('visibilitychange', vis)
    return () => { document.removeEventListener('visibilitychange', vis); a.pause() }
  }, [])
  useEffect(() => {
    if (!audio.current) return
    audio.current.muted = muted
    try { localStorage.setItem('muted', muted ? '1' : '0') } catch {}
  }, [muted])
  const startGame = () => { setStarted(true); playing.current = true; audio.current?.play().catch(() => {}) }
  useEffect(() => { try { localStorage.setItem('pages', JSON.stringify(got)) } catch {} }, [got])
  useEffect(() => { document.title = CFG.title }, [])
  const sparkles = useMemo(() => Array.from({ length: 36 }, () => ({
    l: Math.random() * 100, t: Math.random() * 100, d: Math.random() * 5, s: 2 + Math.random() * 4 })), [])
  const win = i => { setGot(g => g.includes(i) ? g : [...g, i]); setTask(null); setRead(i) }
  const all = got.length === 7

  return <div className="app">
    <button className="mute" onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute music' : 'Mute music'}>{muted ? '🔇' : '🎵'}</button>
    {sparkles.map((s, k) => <i key={k} className="sp" style={{ left: s.l + '%', top: s.t + '%', width: s.s, height: s.s, animationDelay: s.d + 's' }} />)}
    {!started ? <main className="center">
      <div className="bookicon">💜</div>
      <h1>{CFG.title}</h1>
      <p className="sub">For {CFG.her}</p>
      <p className="intro">{CFG.intro}</p>
      <button className="btn" onClick={startGame}>▶ Start Adventure</button>
    </main> : <main>
      <h1>The Lost Pages</h1>
      <p className="sub">{got.length} / 7 pages found</p>
      <div className="progress"><div style={{ width: (got.length / 7) * 100 + '%' }} /></div>
      <div className="shelf">{CFG.pages.map((p, i) => got.includes(i)
        ? <button key={i} className="page found" onClick={() => setRead(i)}><em>⭐ LVL {i + 1}</em><b>{p.title}</b><span>📜 Read</span></button>
        : i === 6 && got.filter(g => g < 6).length < 6
          ? <button key={i} className="page locked" disabled><em>🔒 LVL {i + 1}</em><b>{p.title}</b><span>Find the other 6 pages first…</span></button>
          : <button key={i} className="page" onClick={() => setTask(i)}><em>{i === 6 ? '🔓' : '🔒'} LVL {i + 1}</em><b>{p.title}</b><span>{p.task}</span></button>)}</div>
      {all && <button className="btn glow" onClick={() => setBook(true)}>Open the finished book 📖</button>}
    </main>}
    {task !== null && <Task i={task} onWin={() => win(task)} onClose={() => setTask(null)} />}
    {read !== null && <div className="modal" onClick={() => setRead(null)}><div className="card parchment">
      <h2>{CFG.pages[read].title}</h2><p className="story">{CFG.pages[read].text}</p><button className="ghost">Close</button></div></div>}
    {book && <div className="modal"><div className="card parchment wide">
      <h2>Our Story</h2>
      {CFG.pages.map((p, i) => <p key={i} className="story"><b>{p.title}.</b> {p.text}</p>)}
      <p className="story fin">{CFG.finale}</p>
      <p className="story">— {CFG.from}</p>
      <button className="ghost" onClick={() => setBook(false)}>Close</button></div></div>}
  </div>
}
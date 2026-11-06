import { useState, useEffect } from 'react'
import { CFG } from './config'

const shuffle = a => [...a].sort(() => Math.random() - 0.5)
const EMO = ['🌙', '⭐', '🕯️', '🦋', '🍄', '🌹']

// EASY MODE: mistakes are forgiving and timers are generous.

function Memory({ win, fail }) {
  const [cards] = useState(() => shuffle([...EMO, ...EMO]))
  const [open, setOpen] = useState([])
  const [done, setDone] = useState([])
  const [lives, setLives] = useState(15)
  const flip = i => {
    if (open.length === 2 || open.includes(i) || done.includes(i)) return
    const o = [...open, i]
    setOpen(o)
    if (o.length === 2) setTimeout(() => {
      if (cards[o[0]] === cards[o[1]]) {
        const d = [...done, ...o]; setDone(d); if (d.length === 12) win()
      } else { if (lives <= 1) fail(); setLives(l => l - 1) }
      setOpen([])
    }, 1000)
  }
  return <>
    <p>Match all the pairs. Tries left: {lives} 💛</p>
    <div className="grid4">{cards.map((c, i) =>
      <button key={i} className={'tile ' + (open.includes(i) || done.includes(i) ? 'up' : '')} onClick={() => flip(i)}>
        {open.includes(i) || done.includes(i) ? c : '✦'}</button>)}</div>
  </>
}

function Stars({ win, fail }) {
  const [n, setN] = useState(0)
  const [t, setT] = useState(40)
  const [p, setP] = useState({ x: 50, y: 0 })

  // countdown timer
  useEffect(() => {
    const id = setInterval(() => setT(x => x - 1), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => { if (t <= 0) fail() }, [t])

  // falling animation — star continuously drifts downward
  useEffect(() => {
    let raf
    const tick = () => {
      setP(prev => {
        if (prev.y >= 90) {
          // reached the bottom — respawn at top with new x
          return { x: 12 + Math.random() * 76, y: 0 }
        }
        return { x: prev.x, y: prev.y + 0.6 }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const hit = () => {
    if (n + 1 >= 4) return win()
    setN(n + 1)
    setP({ x: 12 + Math.random() * 76, y: 0 })
  }

  return <>
    <p>Catch 4 stars in 40 seconds! ⭐ {n}/4 · ⏳ {t}s</p>
    <div className="sky">
      <button
        className="star"
        style={{ left: p.x + '%', top: p.y + '%' }}
        onClick={hit}
      >⭐</button>
    </div>
  </>
}

// Wrong answers just grey out — you can keep guessing until you get it.
function Quiz({ win, qs }) {
  const [i, setI] = useState(0)
  const [wrong, setWrong] = useState([])
  const q = qs[i]
  const pick = k => {
    if (k !== q.c) return setWrong(w => [...w, k])
    setWrong([])
    i + 1 >= qs.length ? win() : setI(i + 1)
  }
  return <>
    <p className="q">{q.q}</p>
    {wrong.length > 0 && <p className="hint">Not quite, try another! 💭</p>}
    {q.a.map((a, k) => <button key={k} className={'opt ' + (wrong.includes(k) ? 'no' : '')}
      disabled={wrong.includes(k)} onClick={() => pick(k)}>{a}</button>)}
  </>
}
const Riddle = p => <Quiz {...p} qs={CFG.riddles} />
const Us = p => <Quiz {...p} qs={CFG.quiz} />

function Scramble({ win }) {
  const [letters] = useState(() => {
    let s; do { s = shuffle(CFG.word.split('')) } while (s.join('') === CFG.word); return s
  })
  const [v, setV] = useState('')
  const [bad, setBad] = useState(false)
  return <>
    <p>Unscramble the spell word:</p>
    <div className="letters">{letters.map((l, i) => <span key={i}>{l}</span>)}</div>
    <p className="hint">Hint: it starts with "{CFG.word[0]}" and has {CFG.word.length} letters 💡</p>
    <input value={v} onChange={e => { setV(e.target.value.toUpperCase()); setBad(false) }} placeholder="Type the word…" />
    {bad && <p className="hint">Almost! Check the letters and try again 💭</p>}
    <button className="opt" onClick={() => v.trim() === CFG.word ? win() : setBad(true)}>Cast it ✨</button>
  </>
}

// 3 candles in the pattern, slower; a wrong tap just restarts your turn.
function Candles({ win }) {
  const [seq] = useState(() => Array.from({ length: 3 }, () => Math.floor(Math.random() * 4)))
  const [lit, setLit] = useState(-1)
  const [show, setShow] = useState(true)
  const [step, setStep] = useState(0)
  const [oops, setOops] = useState(false)
  useEffect(() => {
    const ids = []
    seq.forEach((c, k) => {
      ids.push(setTimeout(() => setLit(c), 900 + k * 1400))
      ids.push(setTimeout(() => setLit(-1), 1700 + k * 1400))
    })
    ids.push(setTimeout(() => setShow(false), 900 + seq.length * 1400))
    return () => ids.forEach(clearTimeout)
  }, [])
  const tap = c => {
    if (show) return
    if (c !== seq[step]) { setStep(0); return setOops(true) }
    setOops(false)
    step + 1 >= seq.length ? win() : setStep(step + 1)
  }
  return <>
    <p>{show ? 'Watch the candles glow…' : oops ? 'Oops! Start again from the first one 💭' : `Now light them in the same order! (${step}/${seq.length})`}</p>
    <div className="candles">{[0, 1, 2, 3].map(c =>
      <button key={c} className={'candle ' + (lit === c ? 'lit' : '')} onClick={() => tap(c)}>🕯️</button>)}</div>
  </>
}

// Light the Heart Lanterns: lanterns float up, tap each to light it, together they glow into a heart. Can't lose.
const N = 14
const HEART = Array.from({ length: N }, (_, k) => {
  const t = (k / N) * Math.PI * 2
  const x = 16 * Math.sin(t) ** 3
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
  return { x: 50 + x * 2.6, y: 46 - y * 2.9 }
})

function Lanterns({ win }) {
  const [lit, setLit] = useState([])
  const light = k => setLit(l => l.includes(k) ? l : [...l, k])
  const full = lit.length === N
  useEffect(() => {
    if (!full) return
    const id = setTimeout(win, 2200)
    return () => clearTimeout(id)
  }, [full])
  return <>
    <p>{full ? 'A heart made of light…' : `Tap each floating lantern to light it! (${lit.length}/${N})`}</p>
    <div className={'heartsky ' + (full ? 'done' : '')}>
      {HEART.map((p, k) => <button key={k} className="lan" style={{ left: p.x + '%', top: p.y + '%', animationDelay: k * 0.18 + 's' }} onClick={() => light(k)}>
        <span className={lit.includes(k) ? 'on' : ''} style={{ animationDelay: (k % 5) * 0.25 + 's' }}>🏮</span></button>)}
    </div>
  </>
}

export const GAMES = [Memory, Stars, Riddle, Scramble, Candles, Us, Lanterns]
import { useState, useEffect, useRef, useCallback } from 'react'
import GamePage from './GamePage'

// Educational floating icons as SVG strings
const EDU_ICONS = [
  // Book
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="22" height="30" rx="3" fill="#a8d8ea" stroke="#5ba8c9" stroke-width="1.5"/><rect x="10" y="5" width="3" height="30" fill="#7ec8e3" rx="1"/><line x1="13" y1="13" x2="25" y2="13" stroke="#5ba8c9" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="18" x2="25" y2="18" stroke="#5ba8c9" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="23" x2="21" y2="23" stroke="#5ba8c9" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  // Pencil
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="4" width="8" height="28" rx="2" transform="rotate(15 17 4)" fill="#ffe08a" stroke="#f5c842" stroke-width="1.5"/><polygon points="14,30 20,28 17,36" fill="#f5a623" stroke="#e08a00" stroke-width="1"/><rect x="16.5" y="4" width="9" height="5" rx="1.5" transform="rotate(15 16.5 4)" fill="#d4a0a0" stroke="#b07070" stroke-width="1"/></svg>`,
  // Star / gold star
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,4 23.5,14.5 35,14.5 25.5,21.5 29,32 20,25.5 11,32 14.5,21.5 5,14.5 16.5,14.5" fill="#ffe08a" stroke="#f5c842" stroke-width="1.5"/></svg>`,
  // Graduation cap
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,8 36,16 20,24 4,16" fill="#a0c8f0" stroke="#5a9fd4" stroke-width="1.5"/><path d="M30 18v8c0 3-4.5 6-10 6s-10-3-10-6v-8" stroke="#5a9fd4" stroke-width="1.5" fill="#c8e4f8"/><line x1="36" y1="16" x2="36" y2="26" stroke="#5a9fd4" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="27" r="2" fill="#f5c842"/></svg>`,
  // Light bulb
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6a10 10 0 0 1 6 18v2h-12v-2A10 10 0 0 1 20 6z" fill="#fff9c4" stroke="#f5c842" stroke-width="1.5"/><rect x="14" y="26" width="12" height="3" rx="1.5" fill="#f5c842" stroke="#e0a800" stroke-width="1"/><rect x="15" y="29" width="10" height="2" rx="1" fill="#f5c842" stroke="#e0a800" stroke-width="1"/><line x1="20" y1="2" x2="20" y2="4" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="6" x2="28.5" y2="7.5" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="6" x2="11.5" y2="7.5" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/></svg>`,
  // Ruler
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="14" width="30" height="12" rx="2" fill="#b8f0d8" stroke="#3cbf8a" stroke-width="1.5" transform="rotate(-10 5 14)"/><line x1="11" y1="15" x2="11" y2="19" stroke="#3cbf8a" stroke-width="1.5" stroke-linecap="round" transform="rotate(-10 5 14)"/><line x1="16" y1="15" x2="16" y2="18" stroke="#3cbf8a" stroke-width="1.5" stroke-linecap="round" transform="rotate(-10 5 14)"/><line x1="21" y1="15" x2="21" y2="19" stroke="#3cbf8a" stroke-width="1.5" stroke-linecap="round" transform="rotate(-10 5 14)"/><line x1="26" y1="15" x2="26" y2="18" stroke="#3cbf8a" stroke-width="1.5" stroke-linecap="round" transform="rotate(-10 5 14)"/></svg>`,
  // Atom
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="20" rx="16" ry="7" stroke="#a0c8f0" stroke-width="1.5" fill="none"/><ellipse cx="20" cy="20" rx="16" ry="7" stroke="#a0c8f0" stroke-width="1.5" fill="none" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="16" ry="7" stroke="#a0c8f0" stroke-width="1.5" fill="none" transform="rotate(120 20 20)"/><circle cx="20" cy="20" r="3" fill="#5bc8f5"/></svg>`,
  // Calculator
  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="4" width="24" height="32" rx="3" fill="#e8f4f8" stroke="#5ba8c9" stroke-width="1.5"/><rect x="11" y="8" width="18" height="8" rx="2" fill="#a8d8ea"/><rect x="11" y="20" width="5" height="4" rx="1" fill="#5ba8c9"/><rect x="17.5" y="20" width="5" height="4" rx="1" fill="#5ba8c9"/><rect x="24" y="20" width="5" height="4" rx="1" fill="#f5c842"/><rect x="11" y="27" width="5" height="4" rx="1" fill="#5ba8c9"/><rect x="17.5" y="27" width="5" height="4" rx="1" fill="#5ba8c9"/><rect x="24" y="27" width="5" height="8" rx="1" fill="#3cbf8a"/></svg>`,
]

interface FloatingIcon {
  id: number
  x: number
  y: number
  scale: number
  duration: number
  delay: number
  rotate: number
  rotateSpeed: number
  icon: number
  opacity: number
}

function useFloatingIcons(count: number): FloatingIcon[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + (i / count) * 90 + (Math.random() - 0.5) * 8,
    y: 5 + Math.random() * 85,
    scale: 0.5 + Math.random() * 0.7,
    duration: 5 + Math.random() * 6,
    delay: Math.random() * 6,
    rotate: (Math.random() - 0.5) * 30,
    rotateSpeed: (Math.random() - 0.5) * 8,
    icon: i % EDU_ICONS.length,
    opacity: 0.18 + Math.random() * 0.22,
  }))
}

export default function App() {
  const icons = useFloatingIcons(24)
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [page, setPage] = useState<'home' | 'game'>('home')
  const [hiding, setHiding] = useState(false)
  const [pageKey, setPageKey] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const navigateTo = useCallback((target: 'home' | 'game') => {
    setHiding(true)
    setTimeout(() => {
      setPage(target)
      setPageKey(k => k + 1)
      setHiding(false)
    }, 360)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Soft pastel background
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      bg.addColorStop(0, '#edf7ff')
      bg.addColorStop(0.4, '#f5fcff')
      bg.addColorStop(0.75, '#f0fbf5')
      bg.addColorStop(1, '#e8f8f0')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Subtle dot grid (notebook paper feel)
      ctx.globalAlpha = 0.18
      const dotSpacing = 32
      for (let x = dotSpacing; x < canvas.width; x += dotSpacing) {
        for (let y = dotSpacing; y < canvas.height; y += dotSpacing) {
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fillStyle = '#90c8e8'
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // Soft blue circle top-left
      const c1 = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.5)
      c1.addColorStop(0, 'rgba(180, 225, 255, 0.45)')
      c1.addColorStop(1, 'transparent')
      ctx.fillStyle = c1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Soft green circle bottom-right
      const c2 = ctx.createRadialGradient(canvas.width, canvas.height, 0, canvas.width, canvas.height, canvas.width * 0.55)
      c2.addColorStop(0, 'rgba(160, 240, 200, 0.38)')
      c2.addColorStop(1, 'transparent')
      ctx.fillStyle = c2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Warm center glow
      const center = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.45, 0, canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.4)
      center.addColorStop(0, 'rgba(255,255,255,0.65)')
      center.addColorStop(1, 'transparent')
      ctx.fillStyle = center
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div
      key={pageKey}
      style={{
        opacity: hiding ? 0 : 1,
        transform: hiding ? 'translateY(24px) scale(0.97)' : 'translateY(0) scale(1)',
        transition: hiding
          ? 'opacity 0.32s ease, transform 0.32s ease'
          : 'none',
        animation: hiding ? 'none' : 'pageEnter 0.45s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
    {page === 'game' ? (
      <GamePage onBack={() => navigateTo('home')} />
    ) : (
    <div className="relative w-full min-h-screen overflow-hidden" style={{ backgroundColor: '#edf7ff' }}>
      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating educational icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {icons.map(ic => (
          <div
            key={ic.id}
            className="absolute"
            style={{
              left: `${ic.x}%`,
              top: `${ic.y}%`,
              width: `${ic.scale * 52}px`,
              height: `${ic.scale * 52}px`,
              opacity: ic.opacity,
              animation: `float ${ic.duration}s ease-in-out ${ic.delay}s infinite`,
              transform: `rotate(${ic.rotate}deg)`,
              filter: 'drop-shadow(0 2px 6px rgba(90,160,220,0.18))',
            }}
            dangerouslySetInnerHTML={{ __html: EDU_ICONS[ic.icon] }}
          />
        ))}
      </div>

      {/* Subtle horizontal lines (ruled notebook) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className="absolute w-full"
            style={{
              top: `${(i + 1) * 5.5}%`,
              height: '1px',
              background: 'rgba(160,210,240,0.12)',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">

        {/* Top icon cluster */}
        <div
          className="flex gap-4 mb-6 items-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(-16px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
          }}
        >
          {[0, 4, 3].map(idx => (
            <div
              key={idx}
              style={{ width: 36, height: 36, opacity: 0.75 }}
              dangerouslySetInnerHTML={{ __html: EDU_ICONS[idx] }}
            />
          ))}
        </div>

        {/* Subtitle */}
        <p
          className="font-cinzel text-xs tracking-[0.35em] uppercase mb-3"
          style={{
            color: 'rgba(30,110,90,0.8)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
          }}
        >
          Ash Mateus Vinicius Aléxia
        </p>

        {/* Ornament */}
        <div
          className="w-56 mb-5"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.3s',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="ornament-line flex-1" />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="4" fill="rgba(46,180,138,0.7)" />
              <circle cx="7" cy="7" r="2" fill="rgba(91,200,245,0.9)" />
            </svg>
            <div className="ornament-line flex-1" />
          </div>
        </div>

        {/* Main title */}
        <h1
          className="font-cinzel font-black text-center leading-none mb-3 title-glow"
          style={{
            fontSize: 'clamp(2.8rem, 11vw, 7rem)',
            color: '#0d5a7a',
            letterSpacing: '0.06em',
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(28px) scale(0.96)',
            transition: 'opacity 1s ease 0.35s, transform 1s ease 0.35s',
          }}
        >
          BEM VINDOS
        </h1>

        {/* Tagline */}
        <p
          className="font-crimson italic text-center mb-3"
          style={{
            fontSize: 'clamp(1rem, 2.8vw, 1.3rem)',
            color: 'rgba(13, 80, 110, 0.65)',
            letterSpacing: '0.06em',
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.9s ease 0.55s, transform 0.9s ease 0.55s',
          }}
        >
          Vamos testar seus conhecimentos
        </p>

        {/* Decorative pencil line */}
        <div
          className="flex items-center gap-2 mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.8s ease 0.65s',
          }}
        >
          <div style={{ width: 22, height: 22, opacity: 0.6 }} dangerouslySetInnerHTML={{ __html: EDU_ICONS[1] }} />
          <div className="ornament-line" style={{ width: 80 }} />
          <div style={{ width: 22, height: 22, opacity: 0.6 }} dangerouslySetInnerHTML={{ __html: EDU_ICONS[5] }} />
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col items-center gap-4 w-full max-w-xs"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(28px)',
            transition: 'opacity 0.9s ease 0.8s, transform 0.9s ease 0.8s',
          }}
        >
          <button
            className="btn-play w-full py-4 text-base cursor-pointer"
            style={{ borderRadius: '10px' }}
            onClick={() => navigateTo('game')}
          >
            ✏️ &nbsp; Jogar
          </button>

          <button
            className="btn-menu w-full py-3 text-sm cursor-pointer"
            style={{ borderRadius: '10px' }}
            onClick={() => setMenuOpen(v => !v)}
          >
            📋 &nbsp; Menu
          </button>
        </div>

        {/* Menu dropdown */}
        {menuOpen && (
          <div
            className="mt-4 w-full max-w-xs border"
            style={{
              background: 'rgba(245, 252, 255, 0.97)',
              borderColor: 'rgba(91,200,245,0.35)',
              borderRadius: '10px',
              backdropFilter: 'blur(12px)',
              animation: 'rise 0.25s ease-out forwards',
              boxShadow: '0 8px 32px rgba(91,180,240,0.12)',
            }}
          >
            {[
              { label: 'Continuar Jogo', emoji: '▶️' },
              { label: 'Nova Partida',   emoji: '🆕' },
              { label: 'Configurações',  emoji: '⚙️' },
              { label: 'Créditos',       emoji: '🏆' },
              { label: 'Sair',           emoji: '🚪' },
            ].map(({ label, emoji }, i, arr) => (
              <button
                key={label}
                className="font-cinzel w-full text-left px-6 py-3 text-xs tracking-widest uppercase transition-all duration-150 cursor-pointer block"
                style={{
                  color: 'rgba(13, 74, 110, 0.75)',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(91,200,245,0.13)' : 'none',
                  background: 'transparent',
                  border: i < arr.length - 1 ? undefined : 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.color = '#1a8c5e'
                  el.style.paddingLeft = '2rem'
                  el.style.background = 'rgba(46,204,138,0.07)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.color = 'rgba(13, 74, 110, 0.75)'
                  el.style.paddingLeft = '1.5rem'
                  el.style.background = 'transparent'
                }}
                onClick={() => alert(`Selecionado: ${label}`)}
              >
                {emoji} &nbsp; {label}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <p
          className="font-cinzel absolute bottom-5 text-center"
          style={{
            fontSize: '0.58rem',
            letterSpacing: '0.28em',
            color: 'rgba(13,74,110,0.3)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease 1.2s',
          }}
        >
          VERSÃO 1.0.0 &nbsp;•&nbsp; © 2026 QUIZ EDUCACIONAL
        </p>
      </div>
    </div>
    )}
    </div>
  )
}

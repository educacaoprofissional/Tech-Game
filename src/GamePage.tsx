import { useState, useEffect, useRef, useCallback } from 'react'

// ── Tile grid ──────────────────────────────────────
const TS   = 44   // tile size px
const COLS = 14
const ROWS = 8
const GOAL_COL = 13
const GOAL_ROW = 4

const TILES: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,0,1,1,1,0,1,1,1,1,1,1],
  [1,1,1,0,1,1,1,0,1,1,1,1,1,1],
  [1,1,1,0,1,1,1,0,1,1,1,1,1,1],
]

function getGroundRow(col: number): number {
  if (col < 0 || col >= COLS) return ROWS
  for (let r = 0; r < ROWS; r++) if (TILES[r][col] === 1) return r - 1
  return ROWS
}

// ── Pixel-art drawing ──────────────────────────────
function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.arc(cx,        cy,        r,        0, Math.PI * 2)
  ctx.arc(cx + r*1.2, cy - r*0.3, r*0.85, 0, Math.PI * 2)
  ctx.arc(cx + r*2.4, cy,        r*0.75,  0, Math.PI * 2)
  ctx.arc(cx + r*1.1, cy + r*0.5, r*0.9, 0, Math.PI * 2)
  ctx.fill()
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isTop: boolean) {
  ctx.fillStyle = '#8B5E3C'
  ctx.fillRect(x, y, size, size)
  if (isTop) {
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(x, y, size, Math.ceil(size * 0.33))
    ctx.fillStyle = '#81C784'
    ctx.fillRect(x + 3, y + 2, 5, 3)
    ctx.fillRect(x + Math.floor(size * 0.42), y + 2, 4, 2)
    ctx.fillStyle = '#2E7D32'
    ctx.fillRect(x, y + Math.floor(size * 0.31), size, 2)
  }
  ctx.fillStyle = '#A0522D'
  ctx.fillRect(x + Math.floor(size * 0.18), y + Math.floor(size * (isTop ? 0.52 : 0.25)), 4, 4)
  ctx.fillRect(x + Math.floor(size * 0.55), y + Math.floor(size * (isTop ? 0.70 : 0.55)), 3, 3)
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.fillRect(x, y + size - 2, size, 2)
  ctx.fillRect(x + size - 2, y, 2, size)
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(x, y, 2, size)
  ctx.fillRect(x, y, size, 2)
}

function drawFlag(ctx: CanvasRenderingContext2D, gx: number, groundY: number, size: number) {
  const px = gx + size * 0.5
  const poleTop = groundY - size * 2.2
  ctx.fillStyle = '#9e9e9e'
  ctx.fillRect(px - 2, poleTop, 4, groundY + size - poleTop)
  ctx.fillStyle = '#ffd600'
  ctx.beginPath()
  ctx.arc(px, poleTop, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e53935'
  ctx.beginPath()
  ctx.moveTo(px + 2, poleTop + 8)
  ctx.lineTo(px + size * 0.6, poleTop + 22)
  ctx.lineTo(px + 2, poleTop + 36)
  ctx.closePath()
  ctx.fill()
}

type CharStatus = 'idle' | 'success' | 'error'

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  facing: 'left' | 'right',
  jumping: boolean,
  status: CharStatus,
) {
  const px = Math.max(3, Math.floor(size / 8))
  const SPRITE = [
    [0,0,'R','R','R','R',0,0],
    [0,'R','R','R','R','R','R',0],
    [0,0,'S','S','E','S',0,0],
    [0,'S','S','S','S','S','S',0],
    [0,'B','B','W','W','B','B',0],
    [0,'B','B','B','B','B','B',0],
    [0,'B','S','B',0,'S','B',0],
    [0,'T','T',0,0,'T','T',0],
  ] as const

  type Color = 'R'|'S'|'E'|'B'|'W'|'T'
  const COLORS: Record<Color, string> = status === 'error'
    ? { R:'#888', S:'#aaa', E:'#666', B:'#777', W:'#ccc', T:'#999' }
    : { R:'#e52b2b', S:'#f5b58a', E:'#4a2e0a', B:'#1565C0', W:'#ffffff', T:'#795548' }

  ctx.save()
  const offY = jumping ? -px * 1.8 : 0
  if (facing === 'left') {
    ctx.translate(x + 8 * px, y + offY)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(x, y + offY)
  }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const col = SPRITE[r][c] as Color | 0
      if (col && COLORS[col]) {
        ctx.fillStyle = COLORS[col]
        ctx.fillRect(c * px, r * px, px, px)
      }
    }
  }
  if (jumping) {
    ctx.fillStyle = 'rgba(255,240,80,0.75)'
    ctx.beginPath()
    ctx.arc(4 * px, -px, px * 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

interface CharState { col: number; row: number; facing: 'left'|'right'; jumping: boolean }

function drawGame(
  ctx: CanvasRenderingContext2D,
  char: CharState,
  status: CharStatus,
) {
  const W = COLS * TS, H = ROWS * TS
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62)
  sky.addColorStop(0, '#3a7bd5')
  sky.addColorStop(1, '#7aadff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  drawCloud(ctx, 55,  26, 12)
  drawCloud(ctx, 195, 38, 10)
  drawCloud(ctx, 370, 20, 13)
  drawCloud(ctx, 510, 42, 9)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tx = c * TS, ty = r * TS
      if (TILES[r][c] === 1) {
        drawTile(ctx, tx, ty, TS, r === 0 || TILES[r - 1][c] !== 1)
      } else if (r >= 5) {
        const depth = r - 5
        ctx.fillStyle = `rgba(0,0,0,${0.65 + depth * 0.15})`
        ctx.fillRect(tx, ty, TS, TS)
      }
    }
  }

  if (status !== 'success') {
    drawFlag(ctx, GOAL_COL * TS, GOAL_ROW * TS, TS)
  } else {
    const cx = GOAL_COL * TS + TS / 2
    const cy = GOAL_ROW * TS + TS / 2
    const burst = ['#ffd600','#ff6b35','#ff0099','#00ff88','#00cfff','#fff']
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      ctx.fillStyle = burst[i % burst.length]
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * TS * 1.1, cy + Math.sin(a) * TS * 0.8, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawCharacter(ctx, char.col * TS, char.row * TS, TS, char.facing, char.jumping, status)
}

// ── Block definitions ──────────────────────────────
type BlockType = 'move-right' | 'move-left' | 'jump-right' | 'jump-left'

const BLOCK_DEFS = [
  { type: 'move-right' as BlockType, label: 'Andar Frente', icon: '👉', bg: '#dcfce7', border: '#22c55e', text: '#15803d', desc: '1 passo →' },
  { type: 'move-left'  as BlockType, label: 'Andar Trás',   icon: '👈', bg: '#fce7f3', border: '#ec4899', text: '#be185d', desc: '1 passo ←' },
  { type: 'jump-right' as BlockType, label: 'Pular Frente', icon: '🦘', bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', desc: 'Salta 2 →' },
  { type: 'jump-left'  as BlockType, label: 'Pular Trás',   icon: '🐸', bg: '#fef3c7', border: '#f59e0b', text: '#b45309', desc: 'Salta 2 ←' },
]

interface Block { id: string; type: BlockType }
let bCtr = 0
const mkBlock = (type: BlockType): Block => ({ id: `b${++bCtr}`, type })

// ── GamePage ───────────────────────────────────────
interface GamePageProps { onBack: () => void }

export default function GamePage({ onBack }: GamePageProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const programRef  = useRef<HTMLDivElement>(null)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [char,      setChar]      = useState<CharState>({ col: 0, row: getGroundRow(0), facing: 'right', jumping: false })
  const [program,   setProgram]   = useState<Block[]>([])
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [running,   setRunning]   = useState(false)
  const [status,    setStatus]    = useState<CharStatus>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [dragSrc,   setDragSrc]   = useState<{ kind: 'palette'; blockType: BlockType } | { kind: 'program'; idx: number } | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawGame(canvas.getContext('2d')!, char, status)
  }, [char, status])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const resetGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setChar({ col: 0, row: getGroundRow(0), facing: 'right', jumping: false })
    setActiveIdx(null)
    setRunning(false)
    setStatus('idle')
    setErrorMsg('')
  }, [])

  const runProgram = useCallback(() => {
    if (running || program.length === 0) return
    resetGame()

    let col = 0, row = getGroundRow(0)
    let facing: 'left' | 'right' = 'right'

    interface Frame { col: number; row: number; facing: 'left'|'right'; jumping: boolean; inter?: boolean; ok: boolean; msg?: string }
    const trace: Frame[] = []

    for (const block of program) {
      let newCol = col

      if (block.type === 'move-right') { newCol = col + 1; facing = 'right' }
      else if (block.type === 'move-left') { newCol = col - 1; facing = 'left' }
      else if (block.type === 'jump-right') {
        facing = 'right'
        trace.push({ col: col + 1, row: row - 1, facing, jumping: true, inter: true, ok: true })
        newCol = col + 2
      } else if (block.type === 'jump-left') {
        facing = 'left'
        trace.push({ col: col - 1, row: row - 1, facing, jumping: true, inter: true, ok: true })
        newCol = col - 2
      }

      if (newCol < 0 || newCol >= COLS) {
        trace.push({ col: Math.max(0, Math.min(COLS - 1, newCol)), row, facing, jumping: false, ok: false, msg: 'Saiu da tela! 💨' })
        break
      }
      const landRow = getGroundRow(newCol)
      if (landRow >= ROWS) {
        trace.push({ col: newCol, row: ROWS - 2, facing, jumping: false, ok: false, msg: 'Caiu no buraco! 💀' })
        break
      }
      col = newCol; row = landRow
      trace.push({ col, row, facing, jumping: false, ok: true })
    }

    setRunning(true)
    let step = 0, cmdIdx = 0

    const animate = () => {
      if (step >= trace.length) {
        const last = trace[trace.length - 1]
        if (!last.ok) { setStatus('error'); setErrorMsg(last.msg!) }
        else if (last.col === GOAL_COL && last.row === GOAL_ROW) setStatus('success')
        else setStatus('idle')
        setActiveIdx(null); setRunning(false); return
      }
      const frame = trace[step]
      setChar({ col: frame.col, row: frame.row, facing: frame.facing, jumping: frame.jumping })
      if (!frame.inter) { setActiveIdx(cmdIdx); cmdIdx++ }
      step++
      if (!frame.ok) {
        setTimeout(() => { setStatus('error'); setErrorMsg(frame.msg!); setActiveIdx(null); setRunning(false) }, 400)
        return
      }
      timerRef.current = setTimeout(animate, frame.inter ? 210 : 460)
    }
    timerRef.current = setTimeout(animate, 120)
  }, [running, program, resetGame])

  const addBlock = (type: BlockType) => {
    if (running) return
    setProgram(p => [...p, mkBlock(type)])
    setTimeout(() => programRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 40)
  }
  const removeBlock = (idx: number) => { if (!running) setProgram(p => p.filter((_, i) => i !== idx)) }

  const def = (type: BlockType) => BLOCK_DEFS.find(b => b.type === type)!

  const onPalDragStart  = (type: BlockType) => setDragSrc({ kind: 'palette', blockType: type })
  const onProgDragStart = (idx: number)     => setDragSrc({ kind: 'program', idx })

  const onDropProg = (tIdx: number | null) => {
    if (!dragSrc) return
    if (dragSrc.kind === 'palette') {
      setProgram(p => { const c = [...p]; c.splice(tIdx ?? c.length, 0, mkBlock(dragSrc.blockType)); return c })
    } else {
      const fi = dragSrc.idx
      setProgram(p => { const c = [...p]; const [mv] = c.splice(fi, 1); const ia = tIdx === null ? c.length : tIdx > fi ? tIdx - 1 : tIdx; c.splice(ia, 0, mv); return c })
    }
    setDragSrc(null); setDragOverIdx(null)
  }

  const onDropTrash = () => {
    if (dragSrc?.kind === 'program') { removeBlock(dragSrc.idx); setDragSrc(null); setDragOverIdx(null) }
  }

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg,#edf7ff,#f0fbf5)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(144,200,232,.2) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* LEFT — Game */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: 14, position: 'relative', minWidth: 0 }}>
        <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 16px', color: '#0d5a7a', background: 'rgba(255,255,255,.75)', border: '1px solid rgba(91,200,245,.5)', borderRadius: 8, backdropFilter: 'blur(6px)', cursor: 'pointer' }}>← Voltar</button>

        <p style={{ fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(13,90,122,.5)' }}>Nível 1</p>

        <div style={{ borderRadius: 10, overflow: 'hidden', border: '3px solid #0d4a6e', boxShadow: '0 8px 40px rgba(13,74,110,.35), 0 0 0 1px rgba(91,200,245,.3)' }}>
          <canvas ref={canvasRef} width={COLS * TS} height={ROWS * TS} style={{ display: 'block', imageRendering: 'pixelated' }} />
        </div>

        <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {status === 'success' && <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, letterSpacing: '0.15em', color: '#15803d', background: '#dcfce7', border: '1px solid #22c55e', padding: '8px 24px', borderRadius: 24, animation: 'rise .4s ease-out' }}>🎉 Nível Completo! Parabéns!</div>}
          {status === 'error'   && <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, letterSpacing: '0.12em', color: '#b91c1c', background: '#fee2e2', border: '1px solid #ef4444', padding: '8px 24px', borderRadius: 24, animation: 'rise .4s ease-out' }}>{errorMsg}</div>}
          {status === 'idle' && !running && <p style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(13,90,122,.4)', textTransform: 'uppercase' }}>Leve o personagem até a bandeira 🚩</p>}
        </div>

        {/* Level legend */}
        <div style={{ display: 'flex', gap: 20, opacity: .55 }}>
          {[{ bg: '#4CAF50', label: 'Chão' }, { bg: '#000', label: 'Buraco' }, { bg: '#e53935', label: 'Meta' }].map(({ bg, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, background: bg, borderRadius: 3, border: '1.5px solid rgba(0,0,0,.2)' }} />
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: '0.1em', color: '#0d5a7a' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 1, background: 'rgba(91,200,245,.3)', margin: '24px 0', flexShrink: 0 }} />

      {/* RIGHT — Commands */}
      <div style={{ width: 340, flexShrink: 0, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(13,90,122,.5)', textAlign: 'center' }}>Comandos</p>

        {/* Palette */}
        <div style={{ background: 'rgba(255,255,255,.6)', border: '1px solid rgba(91,200,245,.3)', borderRadius: 12, padding: 12, backdropFilter: 'blur(8px)' }}>
          <p style={{ fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(13,90,122,.4)', marginBottom: 10, textTransform: 'uppercase' }}>Blocos — arraste ou clique</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {BLOCK_DEFS.map(b => (
              <div key={b.type} draggable
                onDragStart={() => onPalDragStart(b.type)}
                onDragEnd={() => { setDragSrc(null); setDragOverIdx(null) }}
                onClick={() => addBlock(b.type)}
                style={{ background: b.bg, border: `2px solid ${b.border}`, borderRadius: 10, padding: '10px', cursor: running ? 'not-allowed' : 'grab', opacity: running ? .6 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, userSelect: 'none', transition: 'transform .15s' }}
                onMouseEnter={e => { if (!running) (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
              >
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <span style={{ fontFamily: 'Cinzel,serif', fontSize: 11, fontWeight: 700, color: b.text, letterSpacing: '0.05em' }}>{b.label}</span>
                <span style={{ fontSize: 10, color: b.text, opacity: .7, fontFamily: 'Crimson Text,serif', fontStyle: 'italic' }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Program area */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,.5)', border: `2px dashed ${dragSrc ? 'rgba(91,200,245,.8)' : 'rgba(91,200,245,.35)'}`, borderRadius: 12, padding: 10, backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', minHeight: 200, transition: 'border-color .2s' }}
          onDragOver={e => { e.preventDefault(); setDragOverIdx(program.length) }}
          onDrop={() => onDropProg(program.length)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(13,90,122,.4)', textTransform: 'uppercase' }}>Programa ({program.length})</p>
            {program.length > 0 && !running && <button onClick={() => setProgram([])} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cinzel,serif' }}>Limpar</button>}
          </div>
          <div ref={programRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {program.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: .4, padding: '20px 0' }}>
                <span style={{ fontSize: 28 }}>📋</span>
                <p style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: '0.2em', color: '#0d5a7a', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.7 }}>Arraste blocos<br />para programar</p>
              </div>
            )}
            {program.map((block, idx) => {
              const b = def(block.type)
              const isActive = activeIdx === idx
              return (
                <div key={block.id}>
                  <div style={{ height: dragOverIdx === idx && dragSrc ? 8 : 2, background: dragOverIdx === idx && dragSrc ? b.border : 'transparent', borderRadius: 4, transition: 'height .15s,background .15s' }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIdx(idx) }}
                    onDrop={e => { e.stopPropagation(); onDropProg(idx) }} />
                  <div draggable
                    onDragStart={() => onProgDragStart(idx)}
                    onDragEnd={() => { setDragSrc(null); setDragOverIdx(null) }}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: isActive ? b.border : b.bg, border: `2px solid ${b.border}`, borderRadius: 8, padding: '7px 10px', cursor: running ? 'default' : 'grab', opacity: dragSrc?.kind === 'program' && dragSrc.idx === idx ? .4 : 1, transition: 'all .25s', boxShadow: isActive ? `0 0 14px ${b.border}99` : 'none' }}>
                    <span style={{ fontSize: 16, minWidth: 20, textAlign: 'center' }}>{b.icon}</span>
                    <span style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: isActive ? '#fff' : b.text, fontWeight: 700, letterSpacing: '0.05em', flex: 1 }}>{idx + 1}. {b.label}</span>
                    {!running && <button onClick={() => removeBlock(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.text, opacity: .5, fontSize: 14, padding: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '.5' }}>✕</button>}
                  </div>
                </div>
              )
            })}
            <div style={{ height: dragOverIdx === program.length && dragSrc ? 8 : 2, background: dragOverIdx === program.length && dragSrc ? '#5bc8f5' : 'transparent', borderRadius: 4, transition: 'height .15s,background .15s' }}
              onDragOver={e => { e.preventDefault(); setDragOverIdx(program.length) }}
              onDrop={() => onDropProg(program.length)} />
          </div>
        </div>

        {/* Trash drop zone */}
        <div style={{ textAlign: 'center', padding: '6px 0', color: dragSrc?.kind === 'program' ? '#ef4444' : 'rgba(13,90,122,.2)', fontSize: 11, fontFamily: 'Cinzel,serif', letterSpacing: '0.12em', border: `1px dashed ${dragSrc?.kind === 'program' ? 'rgba(239,68,68,.5)' : 'transparent'}`, borderRadius: 8, transition: 'all .2s', background: dragSrc?.kind === 'program' ? 'rgba(239,68,68,.05)' : 'transparent' }}
          onDragOver={e => e.preventDefault()} onDrop={onDropTrash}>
          🗑 SOLTAR AQUI PARA REMOVER
        </div>

        {/* Run / Reset */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={runProgram} disabled={running || program.length === 0}
            style={{ flex: 1, padding: '12px 0', fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', background: running || program.length === 0 ? '#94a3b8' : 'linear-gradient(135deg,#26b87a,#2ecc8a)', border: 'none', borderRadius: 10, cursor: running || program.length === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s', boxShadow: running || program.length === 0 ? 'none' : '0 4px 20px rgba(46,204,138,.4)' }}>
            {running ? '▶ Executando…' : '▶ Executar'}
          </button>
          <button onClick={resetGame} disabled={running}
            style={{ flex: 1, padding: '12px 0', fontFamily: 'Cinzel,serif', fontWeight: 600, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0d5a7a', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(91,200,245,.5)', borderRadius: 10, cursor: running ? 'not-allowed' : 'pointer', backdropFilter: 'blur(4px)' }}>
            ↺ Reiniciar
          </button>
        </div>
      </div>
    </div>
  )
}

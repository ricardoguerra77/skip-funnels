import { useEffect, useRef } from 'react'

/** Ponto vermelho pequeno. Não intercepta cliques. Esc sai da apresentação. */
export function PresentationLaser({ onExit }: { onExit: () => void }) {
  const dot = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const exit = useRef(onExit)
  exit.current = onExit

  useEffect(() => {
    const surface = canvas.current
    const ctx = surface?.getContext('2d')
    if (!surface || !ctx) return
    const resize = () => {
      surface.width = window.innerWidth
      surface.height = window.innerHeight
    }
    resize()
    const spots: { x: number; y: number; a: number }[] = []
    let frame = 0
    const draw = () => {
      ctx.clearRect(0, 0, surface.width, surface.height)
      for (const spot of spots) {
        spot.a *= 0.82
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 42, 42, ${spot.a})`
        ctx.arc(spot.x, spot.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      while (spots.length && spots[0].a < 0.04) spots.shift()
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    const move = (e: PointerEvent) => {
      if (dot.current) {
        dot.current.hidden = false
        dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
      spots.push({ x: e.clientX, y: e.clientY, a: 0.35 })
      if (spots.length > 12) spots.shift()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit.current()
    }
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move)
    window.addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('keydown', key)
    }
  }, [])

  return (
    <div className="fn-laser-layer" aria-hidden>
      <canvas ref={canvas} className="fn-laser-trail" />
      <div ref={dot} className="fn-laser-dot" hidden />
    </div>
  )
}

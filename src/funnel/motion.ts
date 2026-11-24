// Movimento "padrão Apple": curvas com desaceleração suave, rodinha do mouse
// suavizada, inércia ao soltar o arraste da tela, saídas animadas e respeito
// ao "reduzir movimento" do sistema. Só transform/opacity nas animações.
import type { ReactFlowInstance } from '@xyflow/react'
import { useEffect, useReducer, useRef, type RefObject } from 'react'
import type { Viewport } from './types'

// ------------------------------------------------------------ curvas

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Durações de câmera (zoom/enquadrar), já zeradas com "reduzir movimento". */
export function cameraMs(ms: number): number {
  return reducedMotion() ? 0 : ms
}

// ------------------------------------------------------------ saída animada

/**
 * Mantém o último valor visível por `ms` depois que ele vira null, para dar
 * tempo da animação de saída. Devolve [valor a mostrar, está saindo?].
 * Só re-renderiza quando entra/sai — trocar o valor (ex.: nó arrastado) não.
 */
export function useLeaving<T>(value: T | null, ms: number): [T | null, boolean] {
  const last = useRef<T | null>(value)
  const [, force] = useReducer((n: number) => n + 1, 0)
  if (value !== null) last.current = value
  const gone = value === null
  useEffect(() => {
    if (!gone || last.current === null) return
    const t = window.setTimeout(
      () => {
        last.current = null
        force()
      },
      reducedMotion() ? 0 : ms,
    )
    return () => window.clearTimeout(t)
  }, [gone, ms])
  return [value ?? last.current, gone && last.current !== null]
}

// ------------------------------------------------------------ câmera suave

type Sample = { t: number; x: number; y: number }

/**
 * - Roda do mouse (passos grandes de ~100px) vira movimento suave até o alvo;
 *   touchpad (deltas pequenos e contínuos) segue 1:1 pelo React Flow.
 * - Ao soltar um arraste da tela com velocidade, ela continua deslizando e
 *   desacelera (inércia).
 * - A camada da tela fica sempre na GPU; depois de um zoom ela é redesenhada
 *   uma vez para o texto voltar nítido.
 */
/** O que a câmera precisa do React Flow. */
type Camera = Pick<ReactFlowInstance, 'getViewport' | 'setViewport'>

export function useSmoothCamera(
  rf: Camera,
  wrapRef: RefObject<HTMLDivElement>,
  wheelZooms: () => boolean,
) {
  const anim = useRef(0)
  const samples = useRef<Sample[]>([])
  const zoomAtStart = useRef(1)
  const rasterZoom = useRef<number | null>(null) // zoom em que a camada foi pintada por último
  const rerasterTimer = useRef(0)
  const api = useRef<{
    onMoveStart: (e: MouseEvent | TouchEvent | null, vp: Viewport) => void
    onMove: (e: MouseEvent | TouchEvent | null, vp: Viewport) => void
    onMoveEnd: (e: MouseEvent | TouchEvent | null, vp: Viewport) => void
    release: () => void
    stop: () => void
  } | null>(null)

  const stop = () => {
    if (anim.current) cancelAnimationFrame(anim.current)
    anim.current = 0
  }

  // ---- roda do mouse suavizada
  useEffect(() => {
    const root = wrapRef.current
    if (!root) return
    type Target = {
      x: number
      y: number
      zoom: number
      anchor?: { px: number; py: number; fx: number; fy: number }
    }
    let target: Target | null = null
    let lastT = 0

    const step = (now: number) => {
      if (!target) return
      const dt = Math.min(48, now - (lastT || now - 16))
      lastT = now
      const a = 1 - Math.exp(-dt / 65) // ~200ms para assentar
      const cur = rf.getViewport()
      let z = Math.exp(Math.log(cur.zoom) + (Math.log(target.zoom) - Math.log(cur.zoom)) * a)
      let x: number
      let y: number
      if (target.anchor) {
        // zoom em volta do cursor: o ponto sob o mouse não sai do lugar
        x = target.anchor.px - target.anchor.fx * z
        y = target.anchor.py - target.anchor.fy * z
      } else {
        x = cur.x + (target.x - cur.x) * a
        y = cur.y + (target.y - cur.y) * a
      }
      const done =
        Math.abs(z - target.zoom) < 0.0005 &&
        (target.anchor ? true : Math.abs(x - target.x) < 0.3 && Math.abs(y - target.y) < 0.3)
      if (done) {
        z = target.zoom
        if (target.anchor) {
          x = target.anchor.px - target.anchor.fx * z
          y = target.anchor.py - target.anchor.fy * z
        } else {
          x = target.x
          y = target.y
        }
        rf.setViewport({ x, y, zoom: z })
        target = null
        anim.current = 0
        return
      }
      rf.setViewport({ x, y, zoom: z })
      anim.current = requestAnimationFrame(step)
    }

    const onWheel = (e: WheelEvent) => {
      const el = e.target as Element | null
      if (!el?.closest?.('.react-flow') || el.closest('.nowheel')) return
      // roda de mouse: passos grandes e inteiros (touchpad manda deltas pequenos/fracionados)
      const mouseWheel =
        e.deltaMode !== 0 ||
        (Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY) && e.deltaX === 0)
      if (!mouseWheel || reducedMotion()) {
        stop()
        target = null
        return // deixa o React Flow tratar (1:1)
      }
      e.preventDefault()
      e.stopPropagation()
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1
      const dy = e.deltaY * unit
      const base = target ? { ...target } : { ...rf.getViewport() }
      const rect = root.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey || wheelZooms()) {
        const px = e.clientX - rect.left
        const py = e.clientY - rect.top
        const curVp = rf.getViewport()
        const zoom = Math.min(3, Math.max(0.1, base.zoom * Math.pow(2, -dy / 520)))
        // ponto do funil sob o cursor (fixo durante a animação)
        const fx = (px - curVp.x) / curVp.zoom
        const fy = (py - curVp.y) / curVp.zoom
        target = { x: px - fx * zoom, y: py - fy * zoom, zoom, anchor: { px, py, fx, fy } }
      } else {
        const horizontal = e.shiftKey
        const amount = dy * 0.9
        target = {
          x: base.x - (horizontal ? amount : 0),
          y: base.y - (horizontal ? 0 : amount),
          zoom: base.zoom,
        }
      }
      if (!anim.current) {
        lastT = 0
        anim.current = requestAnimationFrame(step)
      }
    }

    root.addEventListener('wheel', onWheel, { capture: true, passive: false })
    const cancel = () => {
      stop()
      target = null
    }
    root.addEventListener('pointerdown', cancel, true)
    // soltar o arraste da tela (pode acontecer fora do canvas). Escuta na janela,
    // em captura: o d3 do React Flow também escuta ali e interrompe o evento,
    // mas o nosso foi registrado antes e roda primeiro.
    const win = root.ownerDocument.defaultView ?? window
    const onUp = () => api.current?.release()
    win.addEventListener('mouseup', onUp, true)
    win.addEventListener('touchend', onUp, true)
    return () => {
      root.removeEventListener('wheel', onWheel, { capture: true })
      root.removeEventListener('pointerdown', cancel, true)
      win.removeEventListener('mouseup', onUp, true)
      win.removeEventListener('touchend', onUp, true)
      cancel()
    }
  }, [rf, wrapRef]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- inércia ao soltar o arraste + nitidez depois do zoom
  const onMoveStart = (event: MouseEvent | TouchEvent | null, vp: Viewport) => {
    if (rasterZoom.current === null) rasterZoom.current = vp.zoom
    if (event) {
      samples.current = []
      zoomAtStart.current = vp.zoom
    }
  }

  const onMove = (event: MouseEvent | TouchEvent | null, vp: Viewport) => {
    if (!event || !/move/.test(event.type)) return // só arraste de verdade (não animações)
    const t = performance.now()
    samples.current.push({ t, x: vp.x, y: vp.y })
    while (samples.current.length > 2 && t - samples.current[0].t > 100) samples.current.shift()
  }

  const onMoveEnd = (event: MouseEvent | TouchEvent | null, vp: Viewport) => {
    // redesenha nítido depois de mudar o zoom (a camada na GPU fica borrada se ampliada);
    // pan puro não precisa — a imagem já pintada só é deslocada
    if (rasterZoom.current === null) rasterZoom.current = zoomAtStart.current
    if (Math.abs(vp.zoom - rasterZoom.current) > 1e-4) {
      window.clearTimeout(rerasterTimer.current)
      rerasterTimer.current = window.setTimeout(() => {
        const root = wrapRef.current
        if (!root || anim.current) return
        rasterZoom.current = rf.getViewport().zoom
        root.classList.add('is-rerastering')
        requestAnimationFrame(() =>
          requestAnimationFrame(() => root.classList.remove('is-rerastering')),
        )
      }, 180)
    }
  }

  /**
   * Soltou o botão depois de arrastar a tela: se ainda estava em movimento,
   * ela continua deslizando. (Escutado direto no mouse: o React Flow só avisa
   * o fim do movimento 150ms depois, tarde demais para medir a velocidade.)
   */
  const release = () => {
    const s = samples.current
    samples.current = []
    if (reducedMotion() || s.length < 2) return
    const vp = rf.getViewport()
    if (Math.abs(vp.zoom - zoomAtStart.current) > 1e-4) return
    const a = s[0]
    const b = s[s.length - 1]
    const dt = b.t - a.t
    if (dt <= 0 || performance.now() - b.t > 70) return // parou antes de soltar: sem inércia
    let vx = (b.x - a.x) / dt
    let vy = (b.y - a.y) / dt
    if (Math.hypot(vx, vy) < 0.35) return
    // desaceleração exponencial (tau ~ 280ms), como a rolagem do macOS
    let x = vp.x
    let y = vp.y
    let last = 0 // relógio do quadro (rAF): passo regular desde o 1º quadro, sem tranco
    const zoom = vp.zoom
    const glide = (now: number) => {
      const d = last ? Math.min(48, now - last) : 1000 / 60
      last = now
      const decay = Math.exp(-d / 280)
      x += vx * d
      y += vy * d
      vx *= decay
      vy *= decay
      rf.setViewport({ x, y, zoom })
      if (Math.hypot(vx, vy) < 0.02) {
        anim.current = 0
        return
      }
      anim.current = requestAnimationFrame(glide)
    }
    stop()
    anim.current = requestAnimationFrame(glide)
  }

  // funções estáveis (só usam refs): o React Flow não recebe props novas a cada quadro
  api.current ??= { onMoveStart, onMove, onMoveEnd, release, stop }
  return api.current
}

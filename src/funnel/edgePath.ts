// Caminho das conexões com curvatura controlável. Puro (sem React): usado pelo
// canvas e pelas miniaturas da galeria.
//
// - "curve": curva suave (padrão). Com `bend`, a curva passa pelo ponto arrastado.
// - "straight": reta. Com `bend`, dois trechos retos pelo ponto.
// - "step": cotovelo (ângulos retos arredondados). `bend` move o "degrau".
//
// `bend` é o deslocamento do ponto do meio em relação à posição que ele teria
// sem ajuste — assim a curva acompanha quando os blocos se movem, e bend = 0 é
// exatamente a linha padrão.

export type EdgePathKind = 'curve' | 'straight' | 'step'
export type Side = 'top' | 'right' | 'bottom' | 'left'

export interface PathInput {
  sx: number
  sy: number
  sSide: Side
  tx: number
  ty: number
  tSide: Side
  kind?: EdgePathKind
  bend?: { x: number; y: number } | null
}

export interface PathOut {
  d: string
  /** Onde ficam o rótulo e a bolinha de curvatura. */
  mx: number
  my: number
}

const DIR: Record<Side, [number, number]> = {
  top: [0, -1],
  right: [1, 0],
  bottom: [0, 1],
  left: [-1, 0],
}
const f = (v: number) => Math.round(v * 10) / 10
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Só aceita números (o caminho também vai para o SVG das miniaturas). */
export function cleanBend(b: unknown): { x: number; y: number } | null {
  if (!b || typeof b !== 'object') return null
  const { x, y } = b as { x?: unknown; y?: unknown }
  if (!finite(x) || !finite(y) || (!x && !y)) return null
  return { x, y }
}

/**
 * Curva: a mesma do React Flow (curvatura 0.35). Com `bend`, os dois pontos de
 * controle andam juntos 4/3 do deslocamento — numa cúbica isso move o ponto do
 * meio (t = 0.5) exatamente `bend`, sem quinas nem laços.
 */
function curve(p: PathInput, bend: { x: number; y: number } | null): PathOut {
  const off = (dist: number) => (dist >= 0 ? 0.5 * dist : 0.35 * 25 * Math.sqrt(-dist))
  const ctrl = (side: Side, x1: number, y1: number, x2: number, y2: number): [number, number] => {
    switch (side) {
      case 'left':
        return [x1 - off(x1 - x2), y1]
      case 'right':
        return [x1 + off(x2 - x1), y1]
      case 'top':
        return [x1, y1 - off(y1 - y2)]
      default:
        return [x1, y1 + off(y2 - y1)]
    }
  }
  let [c1x, c1y] = ctrl(p.sSide, p.sx, p.sy, p.tx, p.ty)
  let [c2x, c2y] = ctrl(p.tSide, p.tx, p.ty, p.sx, p.sy)
  if (bend) {
    const wx = (bend.x * 4) / 3
    const wy = (bend.y * 4) / 3
    c1x += wx
    c1y += wy
    c2x += wx
    c2y += wy
  }
  // ponto da curva em t = 0.5
  const mx = p.sx * 0.125 + c1x * 0.375 + c2x * 0.375 + p.tx * 0.125
  const my = p.sy * 0.125 + c1y * 0.375 + c2y * 0.375 + p.ty * 0.125
  return {
    d: `M${f(p.sx)},${f(p.sy)} C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p.tx)},${f(p.ty)}`,
    mx,
    my,
  }
}

/** O cotovelo sai na horizontal quando a bolinha de origem está num lado. */
export function stepHorizontalFirst(sSide: Side): boolean {
  return sSide === 'left' || sSide === 'right'
}

/** Cotovelo com cantos arredondados; o trecho do meio passa em (cx, cy). */
function stepPath(p: PathInput, cx: number, cy: number): string {
  const gap = 20 // sai um pouco da bolinha antes de virar
  const [adx, ady] = DIR[p.sSide]
  const [bdx, bdy] = DIR[p.tSide]
  const a = [p.sx + adx * gap, p.sy + ady * gap]
  const b = [p.tx + bdx * gap, p.ty + bdy * gap]
  const pts: number[][] = stepHorizontalFirst(p.sSide)
    ? [[p.sx, p.sy], a, [cx, a[1]], [cx, b[1]], b, [p.tx, p.ty]]
    : [[p.sx, p.sy], a, [a[0], cy], [b[0], cy], b, [p.tx, p.ty]]
  // cantos arredondados
  const r = 12
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const l1 = Math.hypot(x1 - x0, y1 - y0)
    const l2 = Math.hypot(x2 - x1, y2 - y1)
    const rr = Math.min(r, l1 / 2, l2 / 2)
    if (rr < 0.5) {
      d += ` L${f(x1)},${f(y1)}`
      continue
    }
    const ux0 = (x1 - x0) / l1
    const uy0 = (y1 - y0) / l1
    const ux1 = (x2 - x1) / l2
    const uy1 = (y2 - y1) / l2
    // segue reto (não há canto aqui)
    if (Math.abs(ux0 * uy1 - uy0 * ux1) < 1e-6 && ux0 * ux1 + uy0 * uy1 > 0) continue
    d += ` L${f(x1 - ux0 * rr)},${f(y1 - uy0 * rr)} Q${f(x1)},${f(y1)} ${f(x1 + ux1 * rr)},${f(y1 + uy1 * rr)}`
  }
  const last = pts[pts.length - 1]
  return d + ` L${f(last[0])},${f(last[1])}`
}

export function edgePath(p: PathInput): PathOut {
  const kind = p.kind === 'straight' || p.kind === 'step' ? p.kind : 'curve'
  const midX = (p.sx + p.tx) / 2
  const midY = (p.sy + p.ty) / 2
  const bend = cleanBend(p.bend)
  if (kind === 'straight') {
    if (!bend) return { d: `M${f(p.sx)},${f(p.sy)} L${f(p.tx)},${f(p.ty)}`, mx: midX, my: midY }
    const px = midX + bend.x
    const py = midY + bend.y
    return { d: `M${f(p.sx)},${f(p.sy)} L${f(px)},${f(py)} L${f(p.tx)},${f(p.ty)}`, mx: px, my: py }
  }
  if (kind === 'step') {
    const cx = midX + (bend?.x ?? 0)
    const cy = midY + (bend?.y ?? 0)
    // a bolinha fica sobre o trecho do meio (que é o que ela move)
    const horizontalFirst = stepHorizontalFirst(p.sSide)
    return {
      d: stepPath(p, cx, cy),
      mx: horizontalFirst ? cx : midX,
      my: horizontalFirst ? midY : cy,
    }
  }
  return curve(p, bend)
}

/**
 * Deslocamento a gravar quando o ponto do meio é arrastado até (x, y).
 * `undefined` = sem ajuste. No cotovelo só conta um eixo; na reta e no
 * cotovelo, chegar perto da posição original "encaixa" de volta.
 */
export function bendFor(p: PathInput, x: number, y: number): { x: number; y: number } | undefined {
  const kind = p.kind ?? 'curve'
  const base = edgePath({ ...p, bend: null })
  let bx = Math.round(x - base.mx)
  let by = Math.round(y - base.my)
  if (kind === 'step') {
    if (stepHorizontalFirst(p.sSide)) by = 0
    else bx = 0
  }
  if (kind !== 'curve' && Math.hypot(bx, by) < 8) return undefined
  if (!bx && !by) return undefined
  return { x: bx, y: by }
}

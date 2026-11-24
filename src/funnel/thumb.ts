// Miniatura SVG de um funil para a galeria: desenho esquemático (sem texto),
// gerado direto do JSON, sem React Flow. As cores de tema vêm de classes CSS
// (o SVG fica no DOM, então herda as variáveis do Obsidian).
import { getItem } from './catalog'
import { DEFAULT_SIZE, edgeKind, edgeStyle, isImagePath } from './doc'
import { edgePath, type Side } from './edgePath'
import type { FileNode, FunnelFile, NodeKind } from './types'

const sideOf = (p: { dx: number; dy: number }): Side =>
  p.dx > 0 ? 'right' : p.dx < 0 ? 'left' : p.dy < 0 ? 'top' : 'bottom'

/** Só aceita cores simples: o SVG vai para innerHTML, então nada de texto livre do arquivo. */
export function safeColor(c: unknown, fallback: string): string {
  if (typeof c !== 'string') return fallback
  if (/^#[0-9a-f]{3,8}$/i.test(c)) return c
  const hex = c.match(/#[0-9a-f]{6}/i) // gradientes do catálogo: usa a primeira cor
  return hex ? hex[0] : fallback
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

function boxOf(n: FileNode): Box {
  const d = DEFAULT_SIZE[n.type as NodeKind] ?? { w: 100, h: 100 }
  if (n.type === 'drawing')
    return { x: num(n.x, 0), y: num(n.y, 0), w: num(n.data.w, 10), h: num(n.data.h, 10) }
  return { x: num(n.x, 0), y: num(n.y, 0), w: num(n.w, d.w), h: num(n.h, d.h) }
}

/** Área "conectável" do nó: o disco nos círculos/decisões, o cartão nos demais. */
function anchorBox(n: FileNode): Box {
  const b = boxOf(n)
  if (n.type === 'circle') return { x: b.x + b.w / 2 - 26, y: b.y, w: 52, h: 52 }
  if (n.type === 'decision') return { x: b.x + b.w / 2 - 23, y: b.y + 32, w: 46, h: 46 }
  return b
}

function handlePoint(
  n: FileNode,
  handle: string | null | undefined,
  other: Box,
): { x: number; y: number; dx: number; dy: number } {
  const b = anchorBox(n)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  let h = handle
  if (h === 'yes' || h === 'no')
    return { x: b.x + b.w, y: h === 'yes' ? b.y + b.h * 0.18 : b.y + b.h * 0.82, dx: 1, dy: 0 }
  if (!h) {
    // sem lado definido: o lado virado para o outro nó
    const ox = other.x + other.w / 2 - cx
    const oy = other.y + other.h / 2 - cy
    h = Math.abs(ox) > Math.abs(oy) ? (ox > 0 ? 'r' : 'l') : oy > 0 ? 'b' : 't'
  }
  if (h === 'r') return { x: b.x + b.w, y: cy, dx: 1, dy: 0 }
  if (h === 'l') return { x: b.x, y: cy, dx: -1, dy: 0 }
  if (h === 't') return { x: cx, y: b.y, dx: 0, dy: -1 }
  return { x: cx, y: b.y + b.h, dx: 0, dy: 1 }
}

const f1 = (v: number) => Math.round(v * 10) / 10

export function funnelThumbnail(file: FunnelFile): string {
  const nodes = file.nodes
  if (!nodes.length) {
    return `<svg class="fn-thumb" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg"><text x="160" y="96" text-anchor="middle" class="t-empty">funil vazio</text></svg>`
  }
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const n of nodes) {
    const b = boxOf(n)
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  const pad = 40
  x0 -= pad
  y0 -= pad
  let w = x1 - x0 + pad
  let h = y1 - y0 + pad
  // proporção mínima de cartão (16:9), centralizando o desenho
  if (w / h > 16 / 9) {
    const nh = (w * 9) / 16
    y0 -= (nh - h) / 2
    h = nh
  } else {
    const nw = (h * 16) / 9
    x0 -= (nw - w) / 2
    w = nw
  }
  const k = w / 320 // escala para manter traços legíveis na miniatura
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const out: string[] = []

  // seções por baixo
  for (const n of nodes.filter((n) => n.type === 'section')) {
    const b = boxOf(n)
    const c = safeColor(n.data.color, '#3b82f6')
    out.push(
      `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="${18}" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-opacity="0.55" stroke-width="${f1(1.4 * k)}"/>`,
    )
  }

  // conexões
  for (const e of file.edges) {
    const s = byId.get(e.source)
    const t = byId.get(e.target)
    if (!s || !t) continue
    const a = handlePoint(s, e.sourceHandle, anchorBox(t))
    const b = handlePoint(t, e.targetHandle, anchorBox(s))
    // mesmo desenho do canvas (formato e curvatura); edgePath só devolve números
    const { d } = edgePath({
      sx: a.x,
      sy: a.y,
      sSide: sideOf(a),
      tx: b.x,
      ty: b.y,
      tSide: sideOf(b),
      kind: edgeKind(e.data),
      bend: e.data?.bend,
    })
    const color =
      e.sourceHandle === 'yes'
        ? '#4ade80'
        : e.sourceHandle === 'no'
          ? '#f87171'
          : safeColor(e.data?.color, '')
    const dash =
      edgeStyle(e.data) === 'solid' ? '' : ` stroke-dasharray="${f1(6 * k)} ${f1(5 * k)}"`
    out.push(
      `<path class="t-edge" d="${d}" stroke-width="${f1(1.8 * k)}"${dash}${color ? ` style="stroke:${color}"` : ''}/>`,
    )
  }

  // nós
  for (const n of nodes) {
    if (n.type === 'section') continue
    const b = boxOf(n)
    const item = getItem(n.data.ref as string | undefined)
    switch (n.type) {
      case 'circle': {
        const c = safeColor(n.data.color ?? item?.bg, '#64748b')
        const light = c.toLowerCase() === '#ffffff'
        out.push(
          `<circle cx="${f1(b.x + b.w / 2)}" cy="${f1(b.y + 26)}" r="26" fill="${c}"${light ? ` class="t-light"` : ''}/>`,
        )
        out.push(
          `<rect class="t-label" x="${f1(b.x + 20)}" y="${f1(b.y + 62)}" width="${f1(b.w - 40)}" height="9" rx="4.5"/>`,
        )
        break
      }
      case 'page': {
        const accent = safeColor(n.data.buttonColor ?? item?.page?.accent, '#64748b')
        out.push(
          `<rect class="t-card" x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="14" stroke-width="${f1(1.2 * k)}"/>`,
        )
        out.push(
          `<rect class="t-sk" x="${f1(b.x + 30)}" y="${f1(b.y + 40)}" width="${f1(b.w - 60)}" height="10" rx="5"/>`,
        )
        out.push(
          `<rect class="t-sk" x="${f1(b.x + 16)}" y="${f1(b.y + 66)}" width="${f1(b.w - 32)}" height="86" rx="9"/>`,
        )
        out.push(
          `<rect x="${f1(b.x + 12)}" y="${f1(b.y + b.h - 86)}" width="${f1(b.w - 24)}" height="30" rx="7" fill="${accent}"/>`,
        )
        break
      }
      case 'decision':
        out.push(
          `<circle class="t-decision" cx="${f1(b.x + b.w / 2)}" cy="${f1(b.y + 55)}" r="23" stroke-width="${f1(1.4 * k)}" stroke-dasharray="${f1(4 * k)} ${f1(3 * k)}"/>`,
        )
        break
      case 'orderbump':
        out.push(
          `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="10" fill="#14b8a6" fill-opacity="0.12" stroke="#14b8a6" stroke-width="${f1(1.4 * k)}" stroke-dasharray="${f1(5 * k)} ${f1(4 * k)}"/>`,
        )
        break
      case 'note': {
        const c = safeColor(NOTE_HEX[n.data.color as string] ?? n.data.color, NOTE_HEX.yellow)
        out.push(
          `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="4" fill="${c}"/>`,
        )
        break
      }
      case 'shape': {
        const stroke = safeColor(n.data.stroke, '')
        const fill = safeColor(n.data.fill, '')
        const attrs = `class="t-shape" stroke-width="${f1(1.6 * k)}"${fill ? ` style="fill:${fill}${stroke ? `;stroke:${stroke}` : ''}"` : stroke ? ` style="stroke:${stroke}"` : ''}`
        if (n.data.shape === 'ellipse')
          out.push(
            `<ellipse cx="${f1(b.x + b.w / 2)}" cy="${f1(b.y + b.h / 2)}" rx="${f1(b.w / 2)}" ry="${f1(b.h / 2)}" ${attrs}/>`,
          )
        else if (n.data.shape === 'diamond')
          out.push(
            `<path d="M${f1(b.x + b.w / 2)},${f1(b.y)} L${f1(b.x + b.w)},${f1(b.y + b.h / 2)} L${f1(b.x + b.w / 2)},${f1(b.y + b.h)} L${f1(b.x)},${f1(b.y + b.h / 2)} Z" ${attrs}/>`,
          )
        else
          out.push(
            `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="${n.data.shape === 'rounded' ? 16 : 3}" ${attrs}/>`,
          )
        break
      }
      case 'text':
        out.push(
          `<rect class="t-label" x="${f1(b.x)}" y="${f1(b.y + 8)}" width="${f1(b.w * 0.8)}" height="14" rx="7"/>`,
        )
        break
      case 'file':
        out.push(
          `<rect class="${isImagePath(n.data.file as string) ? 't-sk' : 't-card'}" x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="10" stroke-width="${f1(1.2 * k)}"/>`,
        )
        break
      case 'product': {
        const c = safeColor(n.data.color ?? item?.bg, '#6366f1')
        out.push(
          `<rect class="t-card" x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="12" stroke-width="${f1(1.2 * k)}"/>`,
        )
        out.push(
          `<rect x="${f1(b.x + 12)}" y="${f1(b.y + 14)}" width="40" height="40" rx="10" fill="${c}"/>`,
        )
        out.push(
          `<rect class="t-label" x="${f1(b.x + 64)}" y="${f1(b.y + 22)}" width="${f1(Math.max(20, b.w - 90))}" height="10" rx="5"/>`,
        )
        break
      }
      case 'drawing': {
        const pts = Array.isArray(n.data.points)
          ? (n.data.points as unknown[]).filter((v): v is number => typeof v === 'number')
          : []
        if (pts.length >= 4) {
          const d: string[] = []
          for (let i = 0; i + 1 < pts.length; i += 2)
            d.push(`${i ? 'L' : 'M'}${f1(b.x + pts[i])},${f1(b.y + pts[i + 1])}`)
          const c = safeColor(n.data.color, '')
          out.push(
            `<path class="t-ink" d="${d.join(' ')}" stroke-width="${f1(num(n.data.size, 3))}"${c ? ` style="stroke:${c}"` : ''}/>`,
          )
        }
        break
      }
    }
  }

  return `<svg class="fn-thumb" viewBox="${f1(x0)} ${f1(y0)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${out.join('')}</svg>`
}

const NOTE_HEX: Record<string, string> = {
  yellow: '#fde68a',
  orange: '#fdba74',
  pink: '#f9a8d4',
  green: '#86efac',
  blue: '#93c5fd',
  purple: '#c4b5fd',
  gray: '#e2e8f0',
}

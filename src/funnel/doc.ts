// Funções puras do documento: conversão arquivo <-> React Flow, tamanhos,
// seções, soma de preços e histórico. Sem React aqui (testado em tests/).
import type { Edge, Node } from '@xyflow/react'
import { getItem, type CatalogItem } from './catalog'
import type {
  BaseData,
  Currency,
  EdgeData,
  EdgeStyle,
  FileEdge,
  FileNode,
  FunnelFile,
  NodeKind,
  ShapeType,
} from './types'

export type FNode = Node<BaseData, NodeKind>
export type FEdge = Edge<EdgeData, 'fn'>

/** Padrão das conexões: linha sólida com seta no fim (o que não estiver gravado na aresta). */
export function edgeStyle(d: EdgeData | undefined): EdgeStyle {
  return d?.style ?? 'solid'
}
export function edgeArrow(d: EdgeData | undefined): boolean {
  return d?.arrow !== false
}
export type EdgeKind = NonNullable<EdgeData['path']>
export function edgeKind(d: EdgeData | undefined): EdgeKind {
  return d?.path === 'straight' || d?.path === 'step' ? d.path : 'curve'
}
/** Trocar o formato zera a curvatura (cada formato usa o ponto de um jeito). */
export function edgeKindPatch(k: EdgeKind): Partial<EdgeData> {
  return { path: k === 'curve' ? undefined : k, bend: undefined }
}

export function emptyFile(): FunnelFile {
  return { type: 'funil', version: 1, nodes: [], edges: [] }
}

/** Lê o conteúdo do arquivo. Vazio vira funil vazio; JSON inválido lança erro. */
export function parseFile(text: string): FunnelFile {
  if (!text || !text.trim()) return emptyFile()
  const raw = JSON.parse(text)
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo .funil inválido')
  const nodes: FileNode[] = Array.isArray(raw.nodes)
    ? raw.nodes.filter((n: FileNode) => n && n.id && n.type)
    : []
  const ids = new Set(nodes.map((n) => n.id))
  const edges: FileEdge[] = Array.isArray(raw.edges)
    ? raw.edges.filter((e: FileEdge) => e && e.id && ids.has(e.source) && ids.has(e.target))
    : []
  return { type: 'funil', version: 1, nodes, edges }
}

export function serialize(file: FunnelFile): string {
  return JSON.stringify(file, null, '\t')
}

// ------------------------------------------------------------- conversão

/** Seções ficam atrás de tudo; traços à mão por cima das seções. */
export function zIndexFor(kind: NodeKind): number | undefined {
  return kind === 'section' ? -10 : undefined
}

/**
 * Seção travada (cadeado): fica no fundo e não reage ao mouse — não seleciona,
 * não arrasta nem redimensiona; só os elementos de cima são mexíveis.
 * O estado fica em `data.locked`; aqui viram as flags do React Flow.
 */
export function applyLock(n: FNode): FNode {
  if (n.type !== 'section') return n
  if (n.data.locked) return { ...n, draggable: false, selectable: false, selected: false }
  if (n.draggable === false || n.selectable === false) {
    const { draggable: _d, selectable: _s, ...rest } = n
    return rest as FNode
  }
  return n
}

export function isLocked(n: FNode): boolean {
  return n.type === 'section' && !!n.data.locked
}

export function toFlow(file: FunnelFile): { nodes: FNode[]; edges: FEdge[] } {
  const nodes: FNode[] = file.nodes.map((n) => {
    const node: FNode = {
      id: n.id,
      type: n.type,
      position: { x: n.x, y: n.y },
      data: { ...n.data },
    }
    if (n.w) node.width = n.w
    if (n.h) node.height = n.h
    const z = zIndexFor(n.type)
    if (z !== undefined) node.zIndex = z
    return applyLock(node)
  })
  // seções primeiro: assim ficam por baixo também na ordem do DOM
  nodes.sort((a, b) => (a.type === 'section' ? 0 : 1) - (b.type === 'section' ? 0 : 1))
  const edges: FEdge[] = file.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
    type: 'fn',
    data: { ...(e.data ?? {}) },
  }))
  return { nodes, edges }
}

const r = (v: number) => Math.round(v)

function cleanData<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out as T
}

export function fromFlow(nodes: FNode[], edges: FEdge[]): FunnelFile {
  return {
    type: 'funil',
    version: 1,
    nodes: nodes.map((n) => {
      const out: FileNode = {
        id: n.id,
        type: n.type as NodeKind,
        x: r(n.position.x),
        y: r(n.position.y),
        data: cleanData(n.data),
      }
      if (n.width) out.w = r(n.width)
      if (n.height) out.h = r(n.height)
      return out
    }),
    edges: edges.map((e) => {
      const out: FileEdge = { id: e.id, source: e.source, target: e.target }
      if (e.sourceHandle) out.sourceHandle = e.sourceHandle
      if (e.targetHandle) out.targetHandle = e.targetHandle
      const d = cleanData(e.data ?? {})
      if (Object.keys(d).length) out.data = d
      return out
    }),
  }
}

export function snapshot(nodes: FNode[], edges: FEdge[]): string {
  return JSON.stringify(fromFlow(nodes, edges))
}

// ------------------------------------------------------------- criação

let seq = 0
export function newId(prefix = 'n'): string {
  seq = (seq + 1) % 1e6
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Tamanho aproximado antes de o React Flow medir (para centralizar ao soltar). */
export const DEFAULT_SIZE: Record<NodeKind, { w: number; h: number }> = {
  circle: { w: 120, h: 96 },
  page: { w: 200, h: 270 },
  decision: { w: 120, h: 90 },
  orderbump: { w: 190, h: 84 },
  note: { w: 220, h: 150 },
  shape: { w: 160, h: 100 },
  text: { w: 220, h: 40 },
  section: { w: 640, h: 420 },
  drawing: { w: 100, h: 100 },
  file: { w: 220, h: 64 },
  product: { w: 230, h: 92 },
}

export function nodeSize(n: FNode): { w: number; h: number } {
  const d = DEFAULT_SIZE[n.type as NodeKind] ?? { w: 100, h: 100 }
  return { w: n.width ?? n.measured?.width ?? d.w, h: n.height ?? n.measured?.height ?? d.h }
}

export function dataForItem(item: CatalogItem): BaseData {
  if (item.kind === 'page') {
    const p = item.page!
    return {
      ref: item.id,
      label: item.label,
      button: p.button,
      currency: 'BRL',
      ...(p.billing ? { billing: 'unica' } : {}),
      ...(p.format ? { format: 'vsl' } : {}),
    }
  }
  if (item.kind === 'orderbump')
    return { ref: item.id, label: 'Order Bump', showPrice: true, price: 0, currency: 'BRL' }
  if (item.kind === 'decision') return { ref: item.id, label: 'Condição?' }
  if (item.kind === 'product') {
    const p = item.product!
    // nome fica vazio: o cartão pede "Nome do produto" e o painel abre para preencher
    return {
      ref: item.id,
      label: '',
      category: p.category,
      currency: 'BRL',
      billing: p.recurring ? 'mensal' : 'unica',
      ...(p.bundle ? { bundle: true, includes: [], extras: [] } : {}),
    }
  }
  return { ref: item.id, label: item.label }
}

/** Cria um nó do catálogo centralizado no ponto. */
export function nodeFromItem(ref: string, center: { x: number; y: number }): FNode | null {
  const item = getItem(ref)
  if (!item) return null
  const kind: NodeKind = item.kind
  const s = DEFAULT_SIZE[kind]
  return {
    id: newId(),
    type: kind,
    position: { x: r(center.x - s.w / 2), y: r(center.y - s.h / 2) },
    data: dataForItem(item),
  }
}

export const SHAPE_SIZE: Record<ShapeType, { w: number; h: number }> = {
  rect: { w: 160, h: 100 },
  rounded: { w: 160, h: 100 },
  ellipse: { w: 150, h: 100 },
  diamond: { w: 140, h: 120 },
  triangle: { w: 140, h: 120 },
  hexagon: { w: 160, h: 110 },
  parallelogram: { w: 170, h: 90 },
  arrow: { w: 170, h: 80 },
}

export type ToolKind = 'note' | 'text' | 'section' | `shape:${ShapeType}`

export function nodeFromTool(tool: ToolKind, center: { x: number; y: number }): FNode {
  let node: FNode
  if (tool === 'note') {
    node = {
      id: newId(),
      type: 'note',
      position: { x: 0, y: 0 },
      data: { text: '', color: 'yellow' },
      width: 220,
      height: 150,
    }
  } else if (tool === 'text') {
    node = {
      id: newId(),
      type: 'text',
      position: { x: 0, y: 0 },
      data: { text: 'Texto', fontSize: 20 },
      width: 220,
    }
  } else if (tool === 'section') {
    node = {
      id: newId(),
      type: 'section',
      position: { x: 0, y: 0 },
      data: { label: 'Nova seção', color: '#3b82f6' },
      width: 640,
      height: 420,
      zIndex: -10,
    }
  } else {
    const shape = tool.slice(6) as ShapeType
    const s = SHAPE_SIZE[shape]
    node = {
      id: newId(),
      type: 'shape',
      position: { x: 0, y: 0 },
      data: { shape, text: '' },
      width: s.w,
      height: s.h,
    }
  }
  const { w, h } = nodeSize(node)
  node.position = { x: r(center.x - w / 2), y: r(center.y - (node.type === 'text' ? 20 : h / 2)) }
  return node
}

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'])

export function isImagePath(path: string | undefined): boolean {
  const ext = path?.split('.').pop()?.toLowerCase()
  return !!ext && IMAGE_EXT.has(ext)
}

/** Cartão de arquivo do cofre (imagem vira imagem; o resto, cartão com nome). */
export function nodeFromFile(path: string, center: { x: number; y: number }): FNode {
  const img = isImagePath(path)
  const w = img ? 260 : 220
  const h = img ? 180 : 64
  return {
    id: newId(),
    type: 'file',
    position: { x: r(center.x - w / 2), y: r(center.y - h / 2) },
    data: { file: path },
    ...(img ? { width: w, height: h } : {}),
  }
}

/** Seção nova envolvendo os nós informados (com folga para o cabeçalho). */
export function sectionAround(nodes: FNode[], label = 'Nova seção'): FNode | null {
  const list = nodes
  if (!list.length) return null
  const pad = 40
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const n of list) {
    const { w, h } = nodeSize(n)
    x0 = Math.min(x0, n.position.x)
    y0 = Math.min(y0, n.position.y)
    x1 = Math.max(x1, n.position.x + w)
    y1 = Math.max(y1, n.position.y + h)
  }
  return {
    id: newId(),
    type: 'section',
    position: { x: r(x0 - pad), y: r(y0 - pad - 30) },
    width: r(x1 - x0 + pad * 2),
    height: r(y1 - y0 + pad * 2 + 30),
    zIndex: -10,
    data: { label, color: '#3b82f6' },
  }
}

// ------------------------------------------------------------- seções e preços

export function centerOf(n: FNode): { x: number; y: number } {
  const { w, h } = nodeSize(n)
  return { x: n.position.x + w / 2, y: n.position.y + h / 2 }
}

/** Nós cujo centro está dentro da seção (inclui seções menores dentro dela). */
export function nodesInSection(section: FNode, nodes: FNode[]): FNode[] {
  const { w, h } = nodeSize(section)
  const x0 = section.position.x
  const y0 = section.position.y
  return nodes.filter((n) => {
    if (n.id === section.id) return false
    if (n.type === 'section') {
      const s = nodeSize(n)
      if (s.w * s.h >= w * h) return false // seção maior nunca fica "dentro"
    }
    const c = centerOf(n)
    return c.x >= x0 && c.x <= x0 + w && c.y >= y0 && c.y <= y0 + h
  })
}

export function hasPrice(d: BaseData): boolean {
  return !!d.showPrice && typeof d.price === 'number' && d.price > 0
}

export interface MoneyTotal {
  currency: Currency
  value: number
}

/** Ids de produtos que estão dentro de algum bundle (o preço que conta é o do bundle). */
export function bundledIds(nodes: FNode[]): Set<string> {
  const ids = new Set<string>()
  for (const n of nodes) {
    if (n.type !== 'product' || !n.data.bundle) continue
    for (const id of (n.data.includes as string[] | undefined) ?? []) if (id !== n.id) ids.add(id)
  }
  return ids
}

/** Soma dos preços dos produtos incluídos num bundle (o "valor de" da oferta). */
export function bundleValue(bundle: FNode, nodes: FNode[]): MoneyTotal[] {
  const ids = new Set((bundle.data.includes as string[] | undefined) ?? [])
  return priceTotals(
    nodes.filter((n) => ids.has(n.id) && n.id !== bundle.id),
    [],
  )
}

/**
 * Soma dos preços visíveis. `all` é o funil inteiro: produtos que fazem parte
 * de um bundle não somam de novo (o cliente paga o bundle, não cada item).
 */
export function priceTotals(nodes: FNode[], all: FNode[] = nodes): MoneyTotal[] {
  const inBundle = bundledIds(all)
  const sums = new Map<Currency, number>()
  for (const n of nodes) {
    if (n.type === 'section' || !hasPrice(n.data) || inBundle.has(n.id)) continue
    const cur = (n.data.currency as Currency) || 'BRL'
    sums.set(cur, (sums.get(cur) ?? 0) + (n.data.price as number))
  }
  const order: Currency[] = ['BRL', 'USD', 'EUR']
  return order
    .filter((c) => sums.has(c))
    .map((c) => ({ currency: c, value: Math.round(sums.get(c)! * 100) / 100 }))
}

const SYMBOL: Record<Currency, string> = { BRL: 'R$', USD: 'US$', EUR: '€' }

export function currencySymbol(c: Currency | undefined): string {
  return SYMBOL[c ?? 'BRL']
}

export function formatMoney(value: number, currency: Currency = 'BRL', compact = false): string {
  const digits = compact && Number.isInteger(value) ? 0 : 2
  const num = value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return `${SYMBOL[currency]} ${num}`
}

export function billingSuffix(b: unknown): string {
  return b === 'mensal' ? '/mês' : b === 'anual' ? '/ano' : ''
}

/** "1.997,00" / "1997.5" / "97" -> número. */
export function parseMoney(text: string): number | undefined {
  const t = text.replace(/[^\d,.-]/g, '')
  if (!t) return undefined
  let s = t
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/\.\d{3}($|\.)/.test(s)) s = s.replace(/\./g, '')
  const v = Number(s)
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : undefined
}

/** Resumo para a galeria: nº de etapas e soma dos preços. */
export function fileStats(file: FunnelFile): { steps: number; totals: MoneyTotal[] } {
  const { nodes } = toFlow(file)
  const steps = nodes.filter(
    (n) =>
      n.type === 'circle' ||
      n.type === 'page' ||
      n.type === 'decision' ||
      n.type === 'orderbump' ||
      n.type === 'file' ||
      n.type === 'product',
  ).length
  return { steps, totals: priceTotals(nodes) }
}

// ------------------------------------------------------------- histórico

export class History {
  past: string[] = []
  future: string[] = []
  private lastKey = ''
  private lastTime = 0
  constructor(private limit = 150) {}

  /** Guarda o estado atual antes de uma mudança. Mesma `key` em sequência
   *  (ex.: digitar num campo) vira um passo só. */
  checkpoint(current: string, key = '', now = Date.now()): void {
    if (key && key === this.lastKey && now - this.lastTime < 1500) {
      this.lastTime = now
      return
    }
    this.lastKey = key
    this.lastTime = now
    if (this.past[this.past.length - 1] !== current) {
      this.past.push(current)
      if (this.past.length > this.limit) this.past.shift()
    }
    this.future = []
  }

  undo(current: string): string | null {
    while (this.past.length && this.past[this.past.length - 1] === current) this.past.pop()
    const prev = this.past.pop()
    if (prev === undefined) return null
    this.future.push(current)
    this.lastKey = ''
    return prev
  }

  redo(current: string): string | null {
    const next = this.future.pop()
    if (next === undefined) return null
    this.past.push(current)
    this.lastKey = ''
    return next
  }

  clear(): void {
    this.past = []
    this.future = []
    this.lastKey = ''
  }
}

// ------------------------------------------------------------- copiar/colar

export interface Clip {
  nodes: FileNode[]
  edges: FileEdge[]
}

export function copySelection(nodes: FNode[], edges: FEdge[]): Clip | null {
  const sel = nodes.filter((n) => n.selected)
  if (!sel.length) return null
  // seção copiada leva junto o que está dentro dela
  const ids = new Set(sel.map((n) => n.id))
  for (const s of sel.filter((n) => n.type === 'section'))
    for (const n of nodesInSection(s, nodes)) ids.add(n.id)
  const file = fromFlow(
    nodes.filter((n) => ids.has(n.id)),
    edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
  )
  return { nodes: file.nodes, edges: file.edges }
}

/** Cria cópias com ids novos, deslocadas. */
export function pasteClip(
  clip: Clip,
  offset: { x: number; y: number },
): { nodes: FNode[]; edges: FEdge[] } {
  const map = new Map<string, string>()
  const file: FunnelFile = {
    type: 'funil',
    version: 1,
    nodes: clip.nodes.map((n) => {
      const id = newId()
      map.set(n.id, id)
      return { ...n, id, x: n.x + offset.x, y: n.y + offset.y, data: { ...n.data } }
    }),
    edges: [],
  }
  file.edges = clip.edges.map((e) => ({
    ...e,
    id: newId('e'),
    source: map.get(e.source)!,
    target: map.get(e.target)!,
    data: e.data ? { ...e.data } : undefined,
  }))
  // bundle colado junto com seus produtos aponta para as cópias deles
  for (const n of file.nodes) {
    const inc = n.data.includes as string[] | undefined
    if (Array.isArray(inc)) n.data.includes = inc.map((id) => map.get(id) ?? id)
  }
  const out = toFlow(file)
  for (const n of out.nodes) n.selected = true
  return out
}

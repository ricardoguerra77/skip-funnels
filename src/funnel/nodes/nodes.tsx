import {
  Handle,
  NodeResizer,
  Position,
  useStore,
  type NodeProps,
  type ReactFlowState,
} from '@xyflow/react'
import {
  Check,
  ExternalLink,
  File,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  GitBranch,
  ImageOff,
  Lock,
  LockOpen,
  Plus,
  X,
} from 'lucide-react'
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as RMouseEvent,
} from 'react'
import { getItem } from '../catalog'
import { useEditor } from '../context'
import {
  billingSuffix,
  bundleValue,
  formatMoney,
  hasPrice,
  isImagePath,
  nodesInSection,
  priceTotals,
  type FNode,
} from '../doc'
import { Glyph } from '../icons'
import type {
  BaseData,
  Currency,
  NodeKind,
  PageData,
  ProductData,
  ShapeData,
  TextData,
} from '../types'
import { PageArt, Sk } from './pageArt'

type P = NodeProps<FNode>

const cls = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ')

// ------------------------------------------------------------------ peças comuns

function SideHandles({ only }: { only?: ('t' | 'r' | 'b' | 'l')[] }) {
  const all: ['t' | 'r' | 'b' | 'l', Position][] = [
    ['t', Position.Top],
    ['r', Position.Right],
    ['b', Position.Bottom],
    ['l', Position.Left],
  ]
  return (
    <>
      {all
        .filter(([id]) => !only || only.includes(id))
        .map(([id, pos]) => (
          <Handle key={id} id={id} type="source" position={pos} className="fn-h" />
        ))}
    </>
  )
}

/** Atalho para o link da página. */
function Badges({ data }: { data: BaseData }) {
  const ed = useEditor()
  if (!data.url) return null
  return (
    <div className="fn-badges nodrag">
      {data.url && (
        <button
          className="fn-badge"
          title={`Abrir link: ${data.url}`}
          onClick={(e) => {
            e.stopPropagation()
            ed.host.openUrl(data.url!)
          }}
        >
          <ExternalLink size={11} />
        </button>
      )}
    </div>
  )
}

function PricePill({ data }: { data: BaseData }) {
  if (!hasPrice(data)) return null
  return (
    <div className="fn-price-pill">
      {formatMoney(data.price as number, data.currency as Currency)}
      {billingSuffix(data.billing)}
    </div>
  )
}

/** Texto que vira campo de edição com duplo clique (notas, formas, textos, seções). */
function EditableText({
  id,
  value,
  field,
  className,
  style,
  placeholder,
  multiline = true,
}: {
  id: string
  value: string
  field: string
  className?: string
  style?: CSSProperties
  placeholder?: string
  multiline?: boolean
}) {
  const ed = useEditor()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    if (ed.editRequest === id) {
      ed.clearEditRequest()
      setDraft(value)
      setEditing(true)
    }
  }, [ed.editRequest, id]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (editing && ref.current) {
      cancelled.current = false
      ref.current.focus()
      ref.current.select()
      autoGrow(ref.current)
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (cancelled.current) return // Esc: descarta
    if (draft !== value) ed.update(id, { [field]: draft }, `${id}:${field}`)
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        className={cls('fn-edit nodrag nowheel nopan', className)}
        style={style}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value)
          autoGrow(e.target)
        }}
        onBlur={commit}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          e.stopPropagation()
          // ao sair da edição pelo teclado, o foco volta ao canvas (atalhos continuam valendo)
          const root = e.currentTarget.closest('.fn-root') as HTMLElement | null
          if (e.key === 'Escape') {
            cancelled.current = true
            setDraft(value)
            setEditing(false)
            root?.focus({ preventScroll: true })
          } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            root?.focus({ preventScroll: true }) // dispara o blur → commit
          }
        }}
      />
    )
  }
  return (
    <div
      className={cls(className, !value && 'is-empty')}
      style={style}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setDraft(value)
        setEditing(true)
      }}
    >
      {value || placeholder}
    </div>
  )
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// ------------------------------------------------------------------ círculo

export const CircleNode = memo(function CircleNode({ data, selected }: P) {
  const item = getItem(data.ref)
  const bg = (data.color as string) || item?.bg || '#64748b'
  const fg = item?.fg || '#ffffff'
  const light =
    !data.color && (item?.bg === '#ffffff' || item?.bg === '#FFFC00' || item?.bg === '#FFE01B')
  return (
    <div className={cls('fn-cnode', selected && 'is-selected')}>
      <div className={cls('fn-cnode-disc', light && 'is-light')} style={{ background: bg }}>
        <Glyph spec={item?.icon ?? { lucide: 'Circle' }} size={24} color={fg} />
        <SideHandles />
      </div>
      <div className="fn-cnode-label">{data.label}</div>
      <PricePill data={data} />
      <Badges data={data} />
    </div>
  )
})

// ------------------------------------------------------------------ página

export const PageNode = memo(function PageNode({ data, selected }: P) {
  const d = data as PageData
  const item = getItem(d.ref)
  const spec = item?.page ?? {
    variant: 'generic' as const,
    button: 'Saiba mais',
    accent: '#64748b',
  }
  const accent = (d.buttonColor as string) || spec.accent
  const isCheckout = spec.variant === 'checkout'
  return (
    <div className={cls('fn-page', selected && 'is-selected')}>
      <SideHandles />
      <div className="fn-page-chrome">
        <i style={{ background: '#ff5f57' }} />
        <i style={{ background: '#febc2e' }} />
        <i style={{ background: '#28c840' }} />
      </div>
      <div className="fn-page-body">
        <div className="fn-page-title">{d.label || item?.label || 'Página'}</div>
        {isCheckout ? (
          <div className="fn-art">
            <div className="fn-progress">
              <span style={{ background: accent }} />
            </div>
            <div className="fn-co-row">
              <span className="fn-co-thumb" />
              {hasPrice(d) ? (
                <strong className="fn-co-price">
                  {formatMoney(d.price as number, d.currency as Currency)}
                  <small>{billingSuffix(d.billing)}</small>
                </strong>
              ) : (
                <Sk w="55%" h={8} />
              )}
            </div>
            <Sk w="90%" />
            <Sk w="75%" />
            <div className="fn-paybadges">
              <span>PIX</span>
              <span>VISA</span>
              <span>MC</span>
              <span>Pay</span>
            </div>
          </div>
        ) : (
          <>
            <PageArt variant={spec.variant} accent={accent} format={d.format} />
            {hasPrice(d) && (
              <div className="fn-page-price">
                {formatMoney(d.price as number, d.currency as Currency)}
                <small>{billingSuffix(d.billing)}</small>
              </div>
            )}
          </>
        )}
        {d.button !== '' && (
          <div className="fn-page-btn" style={{ background: accent }}>
            {d.button ?? spec.button}
          </div>
        )}
        <div className="fn-lines fn-page-foot">
          <Sk w="88%" />
          <Sk w="70%" />
          <Sk w="56%" />
        </div>
      </div>
      <Badges data={d} />
    </div>
  )
})

// ------------------------------------------------------------------ decisão (Se/ou)

export const DecisionNode = memo(function DecisionNode({ data, selected }: P) {
  return (
    <div className={cls('fn-dnode', selected && 'is-selected')}>
      <div className="fn-dnode-label">{data.label}</div>
      <div className="fn-dnode-disc">
        <GitBranch size={18} />
        <SideHandles only={['t', 'b', 'l']} />
        <Handle
          id="yes"
          type="source"
          position={Position.Right}
          className="fn-h-out is-yes"
          style={{ top: '18%' }}
          title="Sim"
        >
          <Check size={10} strokeWidth={3.5} />
        </Handle>
        <Handle
          id="no"
          type="source"
          position={Position.Right}
          className="fn-h-out is-no"
          style={{ top: '82%' }}
          title="Não"
        >
          <X size={10} strokeWidth={3.5} />
        </Handle>
      </div>
      <Badges data={data} />
    </div>
  )
})

// ------------------------------------------------------------------ order bump

export const OrderBumpNode = memo(function OrderBumpNode({ data, selected }: P) {
  const accent = (data.color as string) || '#14b8a6'
  return (
    <div
      className={cls('fn-bump', selected && 'is-selected')}
      style={{ '--fn-bump': accent } as CSSProperties}
    >
      <SideHandles />
      <span className="fn-bump-check" style={{ background: accent }}>
        <Check size={13} strokeWidth={3} color="#fff" />
      </span>
      <div className="fn-bump-text">
        <div className="fn-bump-kicker">ORDER BUMP</div>
        <div className="fn-bump-title">{data.label}</div>
        {hasPrice(data) && (
          <div className="fn-bump-price">
            {formatMoney(data.price as number, data.currency as Currency)}
            {billingSuffix(data.billing)}
          </div>
        )}
      </div>
      <Badges data={data} />
    </div>
  )
})

// ------------------------------------------------------------------ nota adesiva

export const NOTE_COLORS: Record<string, string> = {
  yellow: '#fde68a',
  orange: '#fdba74',
  pink: '#f9a8d4',
  green: '#86efac',
  blue: '#93c5fd',
  purple: '#c4b5fd',
  gray: '#e2e8f0',
}

export const NoteNode = memo(function NoteNode({ id, data, selected }: P) {
  const ed = useEditor()
  const bg =
    NOTE_COLORS[(data.color as string) ?? 'yellow'] ?? (data.color as string) ?? NOTE_COLORS.yellow
  return (
    <div className={cls('fn-note', selected && 'is-selected')} style={{ background: bg }}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={100}
        minHeight={60}
        lineClassName="fn-resize-line"
        handleClassName="fn-resize-handle"
        onResizeStart={() => ed.checkpoint()}
      />
      <SideHandles />
      <EditableText
        id={id}
        value={(data.text as string) ?? ''}
        field="text"
        className="fn-note-text"
        placeholder="Duplo clique para escrever"
      />
    </div>
  )
})

// ------------------------------------------------------------------ formas

function shapePath(shape: string, w: number, h: number): string {
  const s = 1 // meia espessura do traço, para não cortar
  switch (shape) {
    case 'diamond':
      return `M${w / 2},${s} L${w - s},${h / 2} L${w / 2},${h - s} L${s},${h / 2} Z`
    case 'triangle':
      return `M${w / 2},${s} L${w - s},${h - s} L${s},${h - s} Z`
    case 'hexagon': {
      const k = Math.min(w * 0.22, h * 0.5)
      return `M${k},${s} L${w - k},${s} L${w - s},${h / 2} L${w - k},${h - s} L${k},${h - s} L${s},${h / 2} Z`
    }
    case 'parallelogram': {
      const k = Math.min(w * 0.2, 40)
      return `M${k},${s} L${w - s},${s} L${w - k},${h - s} L${s},${h - s} Z`
    }
    case 'arrow': {
      const head = Math.min(w * 0.35, h)
      return `M${s},${h * 0.28} L${w - head},${h * 0.28} L${w - head},${s} L${w - s},${h / 2} L${w - head},${h - s} L${w - head},${h * 0.72} L${s},${h * 0.72} Z`
    }
    default:
      return ''
  }
}

export const ShapeNode = memo(function ShapeNode({ id, data, selected, width, height }: P) {
  const ed = useEditor()
  const d = data as ShapeData
  const w = width ?? 160
  const h = height ?? 100
  const shape = d.shape ?? 'rect'
  const fill = d.fill || 'var(--fn-shape-fill)'
  const stroke = d.stroke || 'var(--fn-shape-stroke)'
  const path = shapePath(shape, w, h)
  return (
    <div className={cls('fn-shape', selected && 'is-selected')}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={40}
        minHeight={30}
        lineClassName="fn-resize-line"
        handleClassName="fn-resize-handle"
        onResizeStart={() => ed.checkpoint()}
      />
      <SideHandles />
      <svg className="fn-shape-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {shape === 'ellipse' ? (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - 1}
            ry={h / 2 - 1}
            fill={fill}
            stroke={stroke}
            strokeWidth={2}
          />
        ) : path ? (
          <path d={path} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
        ) : (
          <rect
            x={1}
            y={1}
            width={w - 2}
            height={h - 2}
            rx={shape === 'rounded' ? Math.min(18, h / 3) : 3}
            fill={fill}
            stroke={stroke}
            strokeWidth={2}
          />
        )}
      </svg>
      <EditableText
        id={id}
        value={d.text ?? ''}
        field="text"
        className="fn-shape-text"
        style={{
          fontSize: d.fontSize ?? 14,
          ...(shape === 'triangle' ? { paddingTop: '30%' } : {}),
        }}
      />
    </div>
  )
})

// ------------------------------------------------------------------ texto livre

export const TextNode = memo(function TextNode({ id, data, selected }: P) {
  const ed = useEditor()
  const d = data as TextData
  return (
    <div className={cls('fn-text', selected && 'is-selected')}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={60}
        minHeight={24}
        lineClassName="fn-resize-line"
        handleClassName="fn-resize-handle"
        onResizeStart={() => ed.checkpoint()}
      />
      <EditableText
        id={id}
        value={d.text ?? ''}
        field="text"
        className="fn-text-body"
        placeholder="Texto"
        style={{
          fontSize: d.fontSize ?? 20,
          fontWeight: d.bold ? 700 : 500,
          color: (d.color as string) || undefined,
        }}
      />
    </div>
  )
})

// ------------------------------------------------------------------ seção

/** Seletor com cache: só recalcula quando a lista de nós muda (mover o canvas não recalcula). */
function sectionTotalKey(id: string) {
  let lastNodes: unknown = null
  let last = ''
  return (s: ReactFlowState) => {
    if (s.nodes === lastNodes) return last
    lastNodes = s.nodes
    const nodes = s.nodes as FNode[]
    const self = nodes.find((n) => n.id === id)
    last = self ? JSON.stringify(priceTotals(nodesInSection(self, nodes), nodes)) : ''
    return last
  }
}

export const SectionNode = memo(function SectionNode({ id, data, selected }: P) {
  const ed = useEditor()
  const selector = useMemo(() => sectionTotalKey(id), [id])
  const totalsJson = useStore(selector)
  const totals = totalsJson
    ? (JSON.parse(totalsJson) as { currency: Currency; value: number }[])
    : []
  const color = (data.color as string) || '#3b82f6'
  const locked = !!data.locked
  return (
    <div
      className={cls('fn-section', selected && 'is-selected', locked && 'is-locked')}
      style={{ '--fn-sec': color } as CSSProperties}
    >
      <NodeResizer
        isVisible={!!selected && !locked}
        minWidth={200}
        minHeight={120}
        lineClassName="fn-resize-line"
        handleClassName="fn-resize-handle"
        onResizeStart={() => ed.checkpoint()}
      />
      <div className="fn-section-head">
        <span className="fn-section-kicker">SEÇÃO ·</span>
        <EditableText
          id={id}
          value={data.label ?? ''}
          field="label"
          className="fn-section-title"
          placeholder="Sem nome"
          multiline={false}
        />
        {/* cadeado: travada fica sempre à vista (é o jeito de destravar); destravada aparece ao passar o mouse */}
        <button
          className="fn-section-lock nodrag"
          title={
            locked
              ? 'Destravar seção (para mover, redimensionar ou renomear)'
              : 'Travar seção (fica no fundo, só os elementos de cima se mexem)'
          }
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            ed.setSectionLock(id, !locked, locked)
          }}
        >
          {locked ? <Lock size={13} strokeWidth={2.4} /> : <LockOpen size={13} strokeWidth={2.4} />}
        </button>
        {totals.length > 0 && (
          <span className="fn-section-total">
            {totals.map((t) => formatMoney(t.value, t.currency, true)).join(' · ')}
          </span>
        )}
      </div>
    </div>
  )
})

// ------------------------------------------------------------------ traço à mão livre

export function strokePath(points: number[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) return `M${points[0]},${points[1]} l0.1,0`
  let d = `M${points[0]},${points[1]}`
  for (let i = 2; i < points.length - 2; i += 2) {
    const mx = (points[i] + points[i + 2]) / 2
    const my = (points[i + 1] + points[i + 3]) / 2
    d += ` Q${points[i]},${points[i + 1]} ${mx},${my}`
  }
  d += ` L${points[points.length - 2]},${points[points.length - 1]}`
  return d
}

export const DrawingNode = memo(function DrawingNode({ data, selected }: P) {
  const pts = (data.points as number[]) ?? []
  const w = (data.w as number) ?? 10
  const h = (data.h as number) ?? 10
  const size = (data.size as number) ?? 3
  return (
    <div className={cls('fn-drawing', selected && 'is-selected')} style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
        <path
          d={strokePath(pts)}
          fill="none"
          stroke={(data.color as string) || 'var(--fn-ink)'}
          strokeWidth={size}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
})

// ------------------------------------------------------------------ arquivo do cofre

function fileIcon(ext: string) {
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return <FileVideo size={20} />
  if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return <FileAudio size={20} />
  if (['csv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={20} />
  if (['md', 'pdf', 'txt', 'docx'].includes(ext)) return <FileText size={20} />
  return <File size={20} />
}

export const FileNode = memo(function FileNode({ data, selected }: P) {
  const ed = useEditor()
  const path = data.file as string | undefined
  const name = path ? (ed.host.displayName?.(path) ?? path.split('/').pop()!) : 'Arquivo'
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  const title = (data.label as string) || name.replace(/\.md$/, '')
  const folder =
    path && path.includes('/') && !ed.host.displayName ? path.slice(0, path.lastIndexOf('/')) : ''
  const missing = !!path && !!ed.host.noteExists && !ed.host.noteExists(path)
  const open = (e: RMouseEvent) => {
    e.stopPropagation()
    if (path) ed.openNote(path, !(e.ctrlKey || e.metaKey))
  }
  if (isImagePath(path)) {
    const url = !missing && path && ed.host.resourceUrl ? ed.host.resourceUrl(path) : null
    return (
      <div
        className={cls('fn-file is-image', selected && 'is-selected')}
        onDoubleClick={open}
        title={name}
      >
        <NodeResizer
          keepAspectRatio
          isVisible={!!selected}
          minWidth={60}
          minHeight={40}
          lineClassName="fn-resize-line"
          handleClassName="fn-resize-handle"
          onResizeStart={() => ed.checkpoint()}
        />
        <SideHandles />
        {url ? (
          <img
            loading="lazy"
            decoding="async"
            className="fn-file-img"
            src={url}
            draggable={false}
            alt={name}
          />
        ) : (
          <div className="fn-file-img is-missing">
            <ImageOff size={22} />
          </div>
        )}
        <div className="fn-file-caption">{title}</div>
      </div>
    )
  }
  return (
    <div
      className={cls('fn-file', selected && 'is-selected', missing && 'is-missing')}
      onDoubleClick={open}
      title={name}
    >
      <SideHandles />
      <span className="fn-file-icon">{fileIcon(ext)}</span>
      <div className="fn-file-text">
        <div className="fn-file-name">{title}</div>
        <div className="fn-file-path">
          {missing
            ? 'arquivo não encontrado'
            : [ext.toUpperCase(), folder].filter(Boolean).join(' · ')}
        </div>
      </div>
      <button
        className="fn-badge fn-file-open nodrag"
        onClick={open}
        title="Abrir (Ctrl+clique abre ao lado)"
      >
        <ExternalLink size={11} />
      </button>
    </div>
  )
})

// ------------------------------------------------------------------ produto / bundle

/** Nomes dos produtos incluídos no bundle + soma dos preços deles (com cache por lista de nós). */
function bundleInfoKey(id: string) {
  let lastNodes: unknown = null
  let last = ''
  return (s: ReactFlowState) => {
    if (s.nodes === lastNodes) return last
    lastNodes = s.nodes
    const nodes = s.nodes as FNode[]
    const self = nodes.find((n) => n.id === id)
    if (!self || !self.data.bundle) return (last = '')
    const ids = (self.data.includes as string[] | undefined) ?? []
    const names = ids
      .map((i) => nodes.find((n) => n.id === i))
      .filter((n): n is FNode => !!n)
      .map((n) => (n.data.label as string) || (n.data.category as string) || 'Produto')
    last = JSON.stringify({ names, value: bundleValue(self, nodes) })
    return last
  }
}

export const ProductNode = memo(function ProductNode({ id, data, selected }: P) {
  const d = data as ProductData
  const item = getItem(d.ref)
  const accent = (d.color as string) || item?.bg || '#6366f1'
  const bundle = !!d.bundle
  const selector = useMemo(() => bundleInfoKey(id), [id])
  const infoJson = useStore(selector)
  const info = infoJson
    ? (JSON.parse(infoJson) as { names: string[]; value: { currency: Currency; value: number }[] })
    : { names: [], value: [] }
  const extras = (d.extras ?? []).filter(Boolean)
  const cur = (d.currency as Currency) ?? 'BRL'
  // "de R$ X por R$ Y": soma dos itens maior que o preço do bundle
  const anchor =
    bundle && hasPrice(d)
      ? info.value.find((v) => v.currency === cur && v.value > (d.price as number))
      : undefined
  return (
    <div
      className={cls('fn-product', bundle && 'is-bundle', selected && 'is-selected')}
      style={{ '--fn-prod': accent } as CSSProperties}
    >
      <SideHandles />
      <div className="fn-product-head">
        <span className="fn-product-icon" style={{ background: accent }}>
          <Glyph spec={item?.icon ?? { lucide: 'Package' }} size={20} color="#fff" />
        </span>
        <div className="fn-product-text">
          <div className="fn-product-kicker">
            {bundle ? 'BUNDLE' : 'PRODUTO'}
            {d.category && d.category !== 'Bundle' ? ` · ${d.category}` : ''}
          </div>
          <div className={cls('fn-product-name', !d.label && 'is-empty')}>
            {d.label || 'Nome do produto'}
          </div>
          {hasPrice(d) && (
            <div className="fn-product-price">
              {anchor && <s>{formatMoney(anchor.value, cur, true)}</s>}
              {formatMoney(d.price as number, cur)}
              <small>{billingSuffix(d.billing)}</small>
            </div>
          )}
        </div>
      </div>
      {bundle && (
        <ul className="fn-product-items">
          {info.names.map((n, i) => (
            <li key={`p${i}`}>
              <Check size={12} strokeWidth={3} />
              <span>{n}</span>
            </li>
          ))}
          {extras.map((n, i) => (
            <li key={`x${i}`} className="is-extra">
              <Plus size={12} strokeWidth={3} />
              <span>{n}</span>
            </li>
          ))}
          {!info.names.length && !extras.length && (
            <li className="is-empty">Escolha os itens no painel ao lado</li>
          )}
        </ul>
      )}
      <Badges data={d} />
    </div>
  )
})

export const NODE_TYPES: Record<NodeKind, React.ComponentType<P>> = {
  circle: CircleNode,
  page: PageNode,
  decision: DecisionNode,
  orderbump: OrderBumpNode,
  note: NoteNode,
  shape: ShapeNode,
  text: TextNode,
  section: SectionNode,
  drawing: DrawingNode,
  file: FileNode,
  product: ProductNode,
}

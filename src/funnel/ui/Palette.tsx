import {
  AppWindow,
  Circle,
  Diamond,
  Frame,
  Hand,
  Hexagon,
  MessageCircle,
  MousePointer2,
  MousePointerClick,
  MoveRight,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plug,
  RectangleHorizontal,
  Search,
  Shapes,
  Square,
  StickyNote,
  Triangle,
  Type,
  Users,
  X,
} from 'lucide-react'
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type ReactNode,
} from 'react'
import { GROUPS, searchCatalog, type CatalogItem, type Group } from '../catalog'
import type { ToolKind } from '../doc'
import { Glyph } from '../icons'
import { useLeaving } from '../motion'

export type Panel = 'search' | Group | 'shapes' | 'pen' | null
export type Tool = 'select' | 'hand' | 'pen'

/** O que se arrasta (ou clica) na barra: um item do catálogo ou uma ferramenta. */
export type DragPayload = { ref: string } | { tool: ToolKind }

/**
 * Clique adiciona no meio da tela; segurar e arrastar leva até o ponto do
 * canvas onde soltar. O arraste é feito com eventos de ponteiro (não com o
 * drag-and-drop nativo do navegador, que o Obsidian intercepta).
 */
export interface ItemHandlers {
  add(p: DragPayload): void
  down(e: RPointerEvent, p: DragPayload): void
}

export const PEN_COLORS = ['', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']
export const PEN_SIZES = [2, 4, 8]

const WIDE_KEY = 'funis-palette-wide'

const GROUP_ICON: Record<Group, ReactNode> = {
  traffic: <Users size={18} />,
  pages: <AppWindow size={18} />,
  events: <MousePointerClick size={18} />,
  messages: <MessageCircle size={18} />,
  integrations: <Plug size={18} />,
  products: <Package size={18} />,
}

export function ItemIcon({ item, size = 40 }: { item: CatalogItem; size?: number }) {
  if (item.kind === 'page') return <PageThumb item={item} />
  const light = item.bg === '#ffffff' || item.bg === '#FFFC00' || item.bg === '#FFE01B'
  return (
    <span
      className={`fn-pal-disc${light ? ' is-light' : ''}${item.kind === 'product' ? ' is-square' : ''}`}
      style={{ background: item.bg, width: size, height: size }}
    >
      <Glyph spec={item.icon} size={size * 0.48} color={item.fg ?? '#fff'} />
    </span>
  )
}

export function PageThumb({ item }: { item: CatalogItem }) {
  const accent = item.page!.accent
  return (
    <span className="fn-pal-page">
      <span className="fn-pal-page-dots">
        <i style={{ background: '#ff5f57' }} />
        <i style={{ background: '#febc2e' }} />
        <i style={{ background: '#28c840' }} />
      </span>
      <span className="fn-pal-page-hero">
        <Glyph spec={item.icon} size={14} color={accent} />
      </span>
      <span className="fn-pal-page-line" style={{ width: '70%' }} />
      <span className="fn-pal-page-line" style={{ width: '50%' }} />
      <span className="fn-pal-page-btn" style={{ background: accent }} />
    </span>
  )
}

function ItemGrid({ items, h, pages }: { items: CatalogItem[]; h: ItemHandlers; pages?: boolean }) {
  if (!items.length) return <div className="fn-pal-empty">Nada encontrado.</div>
  return (
    <div className={`fn-pal-grid${pages ? ' is-pages' : ''}`}>
      {items.map((it) => (
        <button
          key={it.id}
          className="fn-pal-item"
          onPointerDown={(e) => h.down(e, { ref: it.id })}
          onClick={() => h.add({ ref: it.id })}
          title={`${it.label} — clique para adicionar ou segure e arraste até o lugar no canvas`}
        >
          <ItemIcon item={it} />
          <span className="fn-pal-label">{it.label}</span>
        </button>
      ))}
    </div>
  )
}

function GroupPanel({ group, h, onClose }: { group: Group; h: ItemHandlers; onClose: () => void }) {
  const meta = GROUPS.find((g) => g.id === group)!
  const [q, setQ] = useState('')
  const [chip, setChip] = useState<string | undefined>()
  const items = useMemo(() => searchCatalog(q, group, chip), [q, group, chip])
  return (
    <div className="fn-pal-panel">
      <PanelHead title={meta.title} onClose={onClose} />
      <SearchBox value={q} onChange={setQ} />
      {meta.chips.length > 0 && (
        <div className="fn-chips">
          <button className={`fn-chip${!chip ? ' is-on' : ''}`} onClick={() => setChip(undefined)}>
            {group === 'pages' ? 'Todas' : 'Todos'}
          </button>
          {meta.chips.map((c) => (
            <button
              key={c}
              className={`fn-chip${chip === c ? ' is-on' : ''}`}
              onClick={() => setChip(chip === c ? undefined : c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="fn-pal-scroll">
        <ItemGrid items={items} h={h} pages={group === 'pages'} />
      </div>
    </div>
  )
}

function SearchPanel({ h, onClose }: { h: ItemHandlers; onClose: () => void }) {
  const [q, setQ] = useState('')
  const results = useMemo(() => (q.trim() ? searchCatalog(q) : []), [q])
  return (
    <div className="fn-pal-panel">
      <PanelHead title="Buscar elementos" onClose={onClose} />
      <SearchBox value={q} onChange={setQ} autoFocus />
      <div className="fn-pal-scroll">
        {!q.trim() ? (
          <div className="fn-pal-empty">
            Digite para buscar em tráfego, páginas, eventos, mensagens e integrações.
          </div>
        ) : (
          GROUPS.map((g) => {
            const items = results.filter((r) => r.group === g.id)
            if (!items.length) return null
            return (
              <div key={g.id} className="fn-pal-section">
                <div className="fn-pal-section-title">{g.title}</div>
                <ItemGrid items={items} h={h} pages={g.id === 'pages'} />
              </div>
            )
          })
        )}
        {q.trim() && !results.length && <div className="fn-pal-empty">Nada encontrado.</div>}
      </div>
    </div>
  )
}

const SHAPES: { tool: ToolKind; label: string; icon: ReactNode }[] = [
  { tool: 'shape:rect', label: 'Retângulo', icon: <Square size={22} /> },
  { tool: 'shape:rounded', label: 'Arredondado', icon: <RectangleHorizontal size={22} /> },
  { tool: 'shape:ellipse', label: 'Elipse', icon: <Circle size={22} /> },
  { tool: 'shape:diamond', label: 'Losango', icon: <Diamond size={22} /> },
  { tool: 'shape:triangle', label: 'Triângulo', icon: <Triangle size={22} /> },
  { tool: 'shape:hexagon', label: 'Hexágono', icon: <Hexagon size={22} /> },
  {
    tool: 'shape:parallelogram',
    label: 'Paralelogramo',
    icon: <span className="fn-parallelogram" />,
  },
  { tool: 'shape:arrow', label: 'Seta', icon: <MoveRight size={22} /> },
  { tool: 'text', label: 'Texto', icon: <Type size={22} /> },
  { tool: 'note', label: 'Nota', icon: <StickyNote size={22} /> },
  { tool: 'section', label: 'Seção', icon: <Frame size={22} /> },
]

/** Nome e ícone de uma ferramenta (para a "fantasma" do arraste). */
export function toolInfo(tool: ToolKind): { label: string; icon: ReactNode } {
  return SHAPES.find((s) => s.tool === tool) ?? { label: 'Forma', icon: <Square size={22} /> }
}

function ShapesPanel({ h, onClose }: { h: ItemHandlers; onClose: () => void }) {
  return (
    <div className="fn-pal-panel is-small">
      <PanelHead title="Formas" onClose={onClose} />
      <div className="fn-shape-grid">
        {SHAPES.map((s) => (
          <button
            key={s.tool}
            className="fn-pal-item"
            onPointerDown={(e) => h.down(e, { tool: s.tool })}
            onClick={() => h.add({ tool: s.tool })}
            title={`${s.label} — clique ou segure e arraste`}
          >
            <span className="fn-shape-icon">{s.icon}</span>
            <span className="fn-pal-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PenPanel({
  color,
  size,
  setColor,
  setSize,
  onClose,
}: {
  color: string
  size: number
  setColor: (c: string) => void
  setSize: (n: number) => void
  onClose: () => void
}) {
  return (
    <div className="fn-pal-panel is-small">
      <PanelHead title="Lápis" onClose={onClose} />
      <div className="fn-pen-row">
        {PEN_COLORS.map((c) => (
          <button
            key={c || 'ink'}
            className={`fn-swatch${color === c ? ' is-on' : ''}`}
            style={{ background: c || 'var(--fn-ink)' }}
            onClick={() => setColor(c)}
            title={c ? c : 'Cor do texto'}
          />
        ))}
      </div>
      <div className="fn-pen-row">
        {PEN_SIZES.map((s) => (
          <button
            key={s}
            className={`fn-pen-size${size === s ? ' is-on' : ''}`}
            onClick={() => setSize(s)}
            title={`Espessura ${s}`}
          >
            <span style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}
      </div>
      <div className="fn-pal-hint">
        Desenhe arrastando no canvas. Esc ou V volta para a seleção.
      </div>
    </div>
  )
}

function PanelHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fn-pal-head">
      <span>{title}</span>
      <button className="fn-icon-btn" onClick={onClose} title="Fechar (Esc)">
        <X size={16} />
      </button>
    </div>
  )
}

function SearchBox({
  value,
  onChange,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])
  return (
    <label className="fn-search">
      <Search size={15} />
      <input
        ref={ref}
        value={value}
        placeholder="Buscar elementos..."
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </label>
  )
}

/** memo: não re-renderiza a cada quadro de arraste no canvas. */
export const Palette = memo(function Palette(props: {
  panel: Panel
  setPanel: (p: Panel) => void
  tool: Tool
  setTool: (t: Tool) => void
  items: ItemHandlers
  penColor: string
  setPenColor: (c: string) => void
  penSize: number
  setPenSize: (n: number) => void
}) {
  const { panel, setPanel, tool, setTool, items: h } = props
  // ao fechar, o painel fica um instante para deslizar para fora
  const [shown, leaving] = useLeaving(panel, 160)
  const [wide, setWide] = useState(() => localStorage.getItem(WIDE_KEY) !== '0')
  const toggleWide = () => {
    setWide(!wide)
    localStorage.setItem(WIDE_KEY, wide ? '0' : '1')
  }
  const toggle = (p: Panel) => {
    if (tool === 'pen') setTool('select')
    setPanel(panel === p ? null : p)
  }
  const btn = (
    key: string,
    label: string,
    title: string,
    icon: ReactNode,
    active: boolean,
    onClick: () => void,
    extra = '',
  ) => (
    <button
      key={key}
      className={`fn-tb-btn${active ? ' is-on' : ''}${extra}`}
      title={title}
      onClick={onClick}
    >
      {icon}
      {wide && <span className="fn-tb-label">{label}</span>}
    </button>
  )
  // Seção, Nota e Texto também podem ser arrastados direto da barra
  const toolBtn = (t: ToolKind, label: string, title: string, icon: ReactNode, extra = '') => (
    <button
      key={t}
      className={`fn-tb-btn is-draggable${extra}`}
      title={`${title} — clique ou segure e arraste`}
      onPointerDown={(e) => h.down(e, { tool: t })}
      onClick={() => h.add({ tool: t })}
    >
      {icon}
      {wide && <span className="fn-tb-label">{label}</span>}
    </button>
  )
  return (
    <div className="fn-palette nowheel">
      <div className={`fn-toolbar${wide ? ' is-wide' : ''}`}>
        {btn('search', 'Buscar', 'Buscar elementos', <Search size={18} />, panel === 'search', () =>
          toggle('search'),
        )}
        {GROUPS.map((g) =>
          btn(g.id, g.title, g.title, GROUP_ICON[g.id], panel === g.id, () => toggle(g.id)),
        )}
        <div className="fn-tb-sep" />
        {btn(
          'select',
          'Selecionar',
          'Selecionar (V)',
          <MousePointer2 size={18} />,
          tool === 'select',
          () => setTool('select'),
        )}
        {btn(
          'hand',
          'Mover canvas',
          'Mover o canvas (H) — ou segure Espaço',
          <Hand size={18} />,
          tool === 'hand',
          () => setTool('hand'),
        )}
        {toolBtn(
          'section',
          'Seção',
          'Seção com soma dos preços (S)',
          <Frame size={18} />,
          ' is-tool-blue',
        )}
        {toolBtn('note', 'Nota', 'Nota adesiva (N)', <StickyNote size={18} />, ' is-tool-orange')}
        {btn('shapes', 'Formas', 'Formas', <Shapes size={18} />, panel === 'shapes', () =>
          toggle('shapes'),
        )}
        {toolBtn('text', 'Texto', 'Texto (T)', <Type size={18} />)}
        {btn('pen', 'Lápis', 'Lápis (P)', <Pencil size={18} />, tool === 'pen', () => {
          if (tool === 'pen') {
            setTool('select')
            if (panel === 'pen') setPanel(null)
          } else {
            setTool('pen')
            setPanel('pen')
          }
        })}
        <div className="fn-tb-sep" />
        {wide
          ? btn(
              'wide',
              'Recolher',
              'Voltar à barra só com ícones',
              <PanelLeftClose size={18} />,
              false,
              toggleWide,
            )
          : btn(
              'wide',
              'Ampliar',
              'Ampliar barra (mostrar nomes)',
              <PanelLeftOpen size={18} />,
              false,
              toggleWide,
            )}
      </div>
      {shown && (
        <div className={`fn-pal-slot${leaving ? ' is-leaving' : ''}`}>
          {shown === 'search' && <SearchPanel h={h} onClose={() => setPanel(null)} />}
          {GROUPS.some((g) => g.id === shown) && (
            <GroupPanel key={shown} group={shown as Group} h={h} onClose={() => setPanel(null)} />
          )}
          {shown === 'shapes' && <ShapesPanel h={h} onClose={() => setPanel(null)} />}
          {shown === 'pen' && (
            <PenPanel
              color={props.penColor}
              size={props.penSize}
              setColor={props.setPenColor}
              setSize={props.setPenSize}
              onClose={() => setPanel(null)}
            />
          )}
        </div>
      )}
    </div>
  )
})

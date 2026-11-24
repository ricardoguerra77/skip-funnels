import {
  Copy,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  Plus,
  Replace,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { memo, useEffect, useState, type ReactNode } from 'react'
import { getItem, PRODUCT_CATEGORIES } from '../catalog'
import {
  currencySymbol,
  edgeArrow,
  edgeKind,
  edgeKindPatch,
  edgeStyle,
  formatMoney,
  parseMoney,
  SHAPE_SIZE,
  type FEdge,
  type FNode,
} from '../doc'
import { NOTE_COLORS } from '../nodes/nodes'
import type {
  BaseData,
  Billing,
  Currency,
  EdgeData,
  FunnelHost,
  ProductData,
  ShapeType,
} from '../types'

/** Produto do funil, para a lista de itens do bundle. */
export interface ProductOption {
  id: string
  name: string
  price?: number
  currency?: Currency
  bundle?: boolean
}

const KIND_LABEL: Record<string, string> = {
  note: 'Nota',
  shape: 'Forma',
  text: 'Texto',
  section: 'Seção',
  drawing: 'Desenho',
  decision: 'Se/ou',
  orderbump: 'Order Bump',
  file: 'Arquivo',
  product: 'Produto',
}

const SWATCHES = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#64748b',
]

const SHAPE_LABEL: Record<ShapeType, string> = {
  rect: 'Retângulo',
  rounded: 'Arredondado',
  ellipse: 'Elipse',
  diamond: 'Losango',
  triangle: 'Triângulo',
  hexagon: 'Hexágono',
  parallelogram: 'Paralelogramo',
  arrow: 'Seta',
}

function Field({
  label,
  children,
  aside,
}: {
  label: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="fn-field-row">
      <div className="fn-field-label">
        <span>{label}</span>
        {aside}
      </div>
      {children}
    </div>
  )
}

/** Campo de texto que mantém o rascunho local e grava a cada tecla. */
function TextInput({
  value,
  onChange,
  placeholder,
  area,
  rows,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  area?: boolean
  rows?: number
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const common = {
    className: area ? 'fn-input fn-textarea' : 'fn-input',
    value: draft,
    placeholder,
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value)
      onChange(e.target.value)
    },
  }
  return area ? <textarea {...common} rows={rows ?? 3} /> : <input type="text" {...common} />
}

function PriceInput({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  const fmt = (v: number | undefined) =>
    v === undefined
      ? ''
      : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const [draft, setDraft] = useState(fmt(value))
  useEffect(() => setDraft(fmt(value)), [value])
  return (
    <input
      className="fn-input fn-price-input"
      inputMode="decimal"
      placeholder="0,00"
      value={draft}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      onChange={(e) => {
        setDraft(e.target.value)
        onChange(parseMoney(e.target.value))
      }}
      onBlur={() => setDraft(fmt(value))}
    />
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="fn-seg">
      {options.map(([v, label]) => (
        <button key={v} className={value === v ? 'is-on' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      className={`fn-toggle${on ? ' is-on' : ''}`}
      onClick={() => onChange(!on)}
    />
  )
}

function Swatches({
  value,
  onChange,
  colors = SWATCHES,
  allowNone,
}: {
  value?: string
  onChange: (c: string | undefined) => void
  colors?: string[]
  allowNone?: boolean
}) {
  return (
    <div className="fn-swatches">
      {allowNone && (
        <button
          className={`fn-swatch is-none${!value ? ' is-on' : ''}`}
          title="Padrão"
          onClick={() => onChange(undefined)}
        />
      )}
      {colors.map((c) => (
        <button
          key={c}
          className={`fn-swatch${value === c ? ' is-on' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
      <label className="fn-swatch is-custom" title="Outra cor">
        <input
          type="color"
          value={value && value.startsWith('#') ? value : '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}

function PriceFields({
  d,
  set,
  billing,
}: {
  d: BaseData
  set: (p: Partial<BaseData>, key?: string) => void
  billing?: boolean
}) {
  return (
    <>
      <Field
        label="Mostrar preço"
        aside={<Toggle on={!!d.showPrice} onChange={(v) => set({ showPrice: v })} />}
      >
        {null}
      </Field>
      {d.showPrice && (
        <>
          <Field label="Preço">
            <div className="fn-money">
              <select
                className="fn-currency"
                value={(d.currency as Currency) ?? 'BRL'}
                onChange={(e) => set({ currency: e.target.value as Currency })}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {(['BRL', 'USD', 'EUR'] as Currency[]).map((c) => (
                  <option key={c} value={c}>
                    {currencySymbol(c)}
                  </option>
                ))}
              </select>
              <PriceInput
                value={d.price as number | undefined}
                onChange={(v) => set({ price: v }, 'price')}
              />
            </div>
          </Field>
          {billing && (
            <Field label="Cobrança">
              <Segmented
                value={(d.billing as Billing) ?? 'unica'}
                options={[
                  ['unica', 'Única'],
                  ['mensal', 'Mensal'],
                  ['anual', 'Anual'],
                ]}
                onChange={(v) => set({ billing: v })}
              />
            </Field>
          )}
        </>
      )}
    </>
  )
}

function FileField({
  d,
  set,
  host,
  openNote,
}: {
  d: BaseData
  set: (p: Partial<BaseData>) => void
  host: FunnelHost
  openNote: (p: string, newTab?: boolean) => void
}) {
  const path = (d.file as string) ?? ''
  const missing = !!path && host.noteExists && !host.noteExists(path)
  const name = path ? (host.displayName?.(path) ?? path.split('/').pop()!) : '—'
  return (
    <Field label="Arquivo">
      <div className="fn-note-link">
        <button
          className={`fn-note-chip${missing ? ' is-missing' : ''}`}
          onClick={(e) => path && openNote(path, !(e.ctrlKey || e.metaKey))}
          title={missing ? 'Arquivo não encontrado' : name}
        >
          <FileText size={13} />
          <span>{name}</span>
        </button>
        {host.pickFile && (
          <button
            className="fn-icon-btn"
            title="Trocar arquivo"
            onClick={async () => {
              const p = await host.pickFile!()
              if (p) set({ file: p })
            }}
          >
            <Replace size={14} />
          </button>
        )}
      </div>
    </Field>
  )
}

/** Categoria (select), Individual/Bundle e, no bundle, os produtos incluídos + itens avulsos. */
function ProductFields({
  node,
  set,
  products,
}: {
  node: FNode
  set: (p: Partial<BaseData>, key?: string) => void
  products: ProductOption[]
}) {
  const d = node.data as ProductData
  const [extra, setExtra] = useState('')
  const includes = d.includes ?? []
  const extras = d.extras ?? []
  const cats =
    !d.category || PRODUCT_CATEGORIES.includes(d.category)
      ? PRODUCT_CATEGORIES
      : [d.category, ...PRODUCT_CATEGORIES]
  const options = products.filter((p) => p.id !== node.id && !p.bundle)
  const chosen = options.filter((p) => includes.includes(p.id))

  const toggle = (id: string) =>
    set({ includes: includes.includes(id) ? includes.filter((x) => x !== id) : [...includes, id] })
  const addExtra = () => {
    const v = extra.trim()
    if (!v) return
    set({ extras: [...extras, v] })
    setExtra('')
  }

  // soma dos itens marcados (o "valor de" da oferta)
  const sums = new Map<Currency, number>()
  for (const p of chosen)
    if (p.price) sums.set(p.currency ?? 'BRL', (sums.get(p.currency ?? 'BRL') ?? 0) + p.price)
  const cur = (d.currency as Currency) ?? 'BRL'
  const sumSame = sums.get(cur)
  const saving =
    d.showPrice && typeof d.price === 'number' && sumSame && sumSame > d.price
      ? sumSame - d.price
      : 0

  return (
    <>
      <Field label="Categoria">
        <select
          className="fn-input"
          value={d.category ?? ''}
          onChange={(e) => set({ category: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!d.category && <option value="">Escolha…</option>}
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tipo">
        <Segmented
          value={d.bundle ? 'bundle' : 'individual'}
          options={[
            ['individual', 'Individual'],
            ['bundle', 'Bundle (vários)'],
          ]}
          onChange={(v) =>
            set(v === 'bundle' ? { bundle: true, includes, extras } : { bundle: false })
          }
        />
      </Field>
      {d.bundle && (
        <Field
          label="Itens do bundle"
          aside={<span className="fn-field-aside">{chosen.length + extras.length} itens</span>}
        >
          {options.length ? (
            <div className="fn-checklist">
              {options.map((p) => (
                <label key={p.id} className="fn-check">
                  <input
                    type="checkbox"
                    checked={includes.includes(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="fn-check-name">{p.name}</span>
                  {p.price ? (
                    <span className="fn-check-price">
                      {formatMoney(p.price, p.currency ?? 'BRL', true)}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          ) : (
            <div className="fn-hint">
              Coloque outros produtos no funil (barra Produtos) para marcar aqui quais fazem parte
              do bundle.
            </div>
          )}
          {extras.map((x, i) => (
            <div key={`${i}-${x}`} className="fn-extra-row">
              <Plus size={12} />
              <span>{x}</span>
              <button
                className="fn-icon-btn is-tiny"
                title="Remover item"
                onClick={() => set({ extras: extras.filter((_, j) => j !== i) })}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="fn-extra-add">
            <input
              className="fn-input"
              placeholder="Item avulso (ex.: Bônus: planilha)"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addExtra()
                }
              }}
            />
            <button className="fn-icon-btn" title="Adicionar item" onClick={addExtra}>
              <Plus size={15} />
            </button>
          </div>
          {sums.size > 0 && (
            <div className="fn-hint">
              Soma dos itens:{' '}
              <strong>
                {[...sums.entries()].map(([c, v]) => formatMoney(v, c, true)).join(' · ')}
              </strong>
              {saving > 0 && <> — o bundle sai {formatMoney(saving, cur, true)} mais barato</>}
            </div>
          )}
        </Field>
      )}
    </>
  )
}

function NotesField({
  d,
  set,
}: {
  d: BaseData
  set: (p: Partial<BaseData>, key?: string) => void
}) {
  const [big, setBig] = useState(false)
  return (
    <Field
      label="Notas"
      aside={
        <button
          className="fn-icon-btn is-tiny"
          title={big ? 'Diminuir' : 'Aumentar'}
          onClick={() => setBig(!big)}
        >
          {big ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      }
    >
      <TextInput
        area
        rows={big ? 12 : 3}
        value={(d.notes as string) ?? ''}
        placeholder="Anotações..."
        onChange={(v) => set({ notes: v }, 'notes')}
      />
    </Field>
  )
}

function NodeInspectorImpl({
  node,
  update,
  remove,
  duplicate,
  close,
  host,
  openNote,
  products,
  lockSection,
}: {
  node: FNode
  update: (id: string, patch: Partial<BaseData>, key?: string) => void
  remove: () => void
  duplicate: () => void
  close: () => void
  host: FunnelHost
  openNote: (p: string, newTab?: boolean) => void
  /** Produtos do funil (para montar bundles). */
  products?: ProductOption[]
  /** Cadeado da seção. */
  lockSection?: (id: string, locked: boolean) => void
}) {
  const d = node.data
  const item = getItem(d.ref)
  const set = (patch: Partial<BaseData>, key?: string) =>
    update(node.id, patch, key ? `${node.id}:${key}` : undefined)
  const kind = node.type
  const title = item?.label ?? KIND_LABEL[kind] ?? 'Elemento'
  const page = item?.page

  return (
    <div className="fn-inspector nowheel">
      <div className="fn-insp-head">
        <span>{title}</span>
        <button className="fn-icon-btn" onClick={close} title="Fechar">
          <X size={16} />
        </button>
      </div>
      <div className="fn-insp-body">
        {kind === 'file' && <FileField d={d} set={set} host={host} openNote={openNote} />}

        {(kind === 'circle' ||
          kind === 'page' ||
          kind === 'decision' ||
          kind === 'orderbump' ||
          kind === 'section' ||
          kind === 'file' ||
          kind === 'product') && (
          <Field
            label={
              kind === 'decision'
                ? 'Pergunta'
                : kind === 'section'
                  ? 'Nome da seção'
                  : kind === 'file'
                    ? 'Legenda'
                    : kind === 'product'
                      ? d.bundle
                        ? 'Nome do bundle'
                        : 'Nome do produto'
                      : 'Título'
            }
          >
            <TextInput
              value={d.label ?? ''}
              placeholder={
                kind === 'file'
                  ? ((d.file as string) ?? '').split('/').pop()
                  : kind === 'product'
                    ? 'Ex.: Método Funil Perfeito'
                    : item?.label
              }
              onChange={(v) => set({ label: v }, 'label')}
            />
          </Field>
        )}

        {kind === 'product' && <ProductFields node={node} set={set} products={products ?? []} />}

        {(kind === 'note' || kind === 'shape' || kind === 'text') && (
          <Field label="Texto">
            <TextInput
              area
              value={(d.text as string) ?? ''}
              onChange={(v) => set({ text: v }, 'text')}
            />
          </Field>
        )}

        {kind === 'page' && (
          <>
            <PriceFields d={d} set={set} billing={page?.billing} />
            {page?.format && (
              <Field label="Formato">
                <Segmented
                  value={(d.format as 'vsl' | 'tsl') ?? 'vsl'}
                  options={[
                    ['vsl', 'VSL (vídeo)'],
                    ['tsl', 'TSL (texto)'],
                  ]}
                  onChange={(v) => set({ format: v })}
                />
              </Field>
            )}
            <Field label="Texto do botão">
              <TextInput
                value={(d.button as string) ?? page?.button ?? ''}
                placeholder="(sem botão)"
                onChange={(v) => set({ button: v }, 'button')}
              />
            </Field>
            <Field label="Cor do botão">
              <Swatches
                value={d.buttonColor as string | undefined}
                onChange={(c) => set({ buttonColor: c })}
                allowNone
              />
            </Field>
          </>
        )}

        {(kind === 'circle' || kind === 'orderbump' || kind === 'product') && (
          <PriceFields d={d} set={set} billing />
        )}

        {kind === 'product' && (
          <Field label="Cor">
            <Swatches
              value={d.color as string | undefined}
              onChange={(c) => set({ color: c })}
              allowNone
            />
          </Field>
        )}

        {kind === 'circle' && (
          <Field label="Cor">
            <Swatches
              value={d.color as string | undefined}
              onChange={(c) => set({ color: c })}
              allowNone
            />
          </Field>
        )}

        {kind === 'note' && (
          <Field label="Cor">
            <div className="fn-swatches">
              {Object.entries(NOTE_COLORS).map(([k, c]) => (
                <button
                  key={k}
                  className={`fn-swatch${(d.color ?? 'yellow') === k ? ' is-on' : ''}`}
                  style={{ background: c }}
                  onClick={() => set({ color: k })}
                />
              ))}
            </div>
          </Field>
        )}

        {kind === 'shape' && (
          <>
            <Field label="Forma">
              <select
                className="fn-input"
                value={(d.shape as string) ?? 'rect'}
                onChange={(e) => set({ shape: e.target.value as ShapeType })}
              >
                {(Object.keys(SHAPE_SIZE) as ShapeType[]).map((s) => (
                  <option key={s} value={s}>
                    {SHAPE_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preenchimento">
              <Swatches
                value={d.fill as string | undefined}
                onChange={(c) => set({ fill: c })}
                allowNone
              />
            </Field>
            <Field label="Borda">
              <Swatches
                value={d.stroke as string | undefined}
                onChange={(c) => set({ stroke: c })}
                allowNone
              />
            </Field>
            <Field label="Tamanho do texto">
              <Segmented
                value={String(d.fontSize ?? 14)}
                options={[
                  ['12', 'P'],
                  ['14', 'M'],
                  ['18', 'G'],
                  ['24', 'GG'],
                ]}
                onChange={(v) => set({ fontSize: Number(v) })}
              />
            </Field>
          </>
        )}

        {kind === 'text' && (
          <>
            <Field label="Tamanho">
              <Segmented
                value={String(d.fontSize ?? 20)}
                options={[
                  ['14', 'P'],
                  ['20', 'M'],
                  ['28', 'G'],
                  ['40', 'GG'],
                ]}
                onChange={(v) => set({ fontSize: Number(v) })}
              />
            </Field>
            <Field
              label="Negrito"
              aside={<Toggle on={!!d.bold} onChange={(v) => set({ bold: v })} />}
            >
              {null}
            </Field>
            <Field label="Cor">
              <Swatches
                value={d.color as string | undefined}
                onChange={(c) => set({ color: c })}
                allowNone
              />
            </Field>
          </>
        )}

        {kind === 'section' && (
          <>
            <Field label="Cor">
              <Swatches
                value={d.color as string | undefined}
                onChange={(c) => set({ color: c ?? '#3b82f6' })}
              />
            </Field>
            {lockSection && (
              <Field
                label="Travar seção"
                aside={<Toggle on={!!d.locked} onChange={(v) => lockSection(node.id, v)} />}
              >
                <div className="fn-hint">
                  Travada, ela vai para o fundo: não sai do lugar nem muda de tamanho, e você mexe
                  só nos elementos de cima. Para destravar, clique no cadeado do título.
                </div>
              </Field>
            )}
          </>
        )}

        {kind === 'drawing' && (
          <Field label="Cor do traço">
            <Swatches
              value={d.color as string | undefined}
              onChange={(c) => set({ color: c })}
              allowNone
            />
          </Field>
        )}

        {kind !== 'drawing' && kind !== 'text' && (
          <>
            {(kind === 'circle' ||
              kind === 'page' ||
              kind === 'orderbump' ||
              kind === 'decision' ||
              kind === 'product') && (
              <Field
                label="Link"
                aside={
                  d.url ? (
                    <button
                      className="fn-icon-btn is-tiny"
                      title="Abrir link"
                      onClick={() => host.openUrl(d.url!)}
                    >
                      <ExternalLink size={12} />
                    </button>
                  ) : undefined
                }
              >
                <TextInput
                  value={(d.url as string) ?? ''}
                  placeholder="https://..."
                  onChange={(v) => set({ url: v.trim() || undefined }, 'url')}
                />
              </Field>
            )}
            {kind !== 'note' && <NotesField d={d} set={set} />}
          </>
        )}
      </div>
      <div className="fn-insp-foot">
        <button className="fn-btn" onClick={duplicate} title="Duplicar (Ctrl+D)">
          <Copy size={14} /> Duplicar
        </button>
        <button className="fn-btn is-danger" onClick={remove} title="Excluir (Delete)">
          <Trash2 size={14} /> Excluir
        </button>
      </div>
    </div>
  )
}

function EdgeInspectorImpl({
  edge,
  update,
  remove,
  close,
}: {
  edge: FEdge
  update: (id: string, patch: Partial<EdgeData>, key?: string) => void
  remove: () => void
  close: () => void
}) {
  const d = edge.data ?? {}
  const set = (patch: Partial<EdgeData>, key?: string) =>
    update(edge.id, patch, key ? `${edge.id}:${key}` : undefined)
  return (
    <div className="fn-inspector nowheel">
      <div className="fn-insp-head">
        <span>Conexão</span>
        <button className="fn-icon-btn" onClick={close} title="Fechar">
          <X size={16} />
        </button>
      </div>
      <div className="fn-insp-body">
        <Field label="Rótulo">
          <TextInput
            value={d.label ?? ''}
            placeholder="ex.: 30% convertem"
            onChange={(v) => set({ label: v }, 'label')}
          />
        </Field>
        <Field label="Estilo">
          <Segmented
            value={edgeStyle(d)}
            options={[
              ['solid', 'Sólida'],
              ['dashed', 'Tracejada'],
              ['animated', 'Animada'],
            ]}
            onChange={(v) => set({ style: v })}
          />
        </Field>
        <Field label="Formato">
          <Segmented
            value={edgeKind(d)}
            options={[
              ['curve', 'Curva'],
              ['straight', 'Reta'],
              ['step', 'Cotovelo'],
            ]}
            onChange={(v) => set(edgeKindPatch(v))}
          />
          <div className="fn-hint">
            Arraste a bolinha no meio da conexão para{' '}
            {edgeKind(d) === 'step' ? 'mover o degrau' : 'curvar'}. Dois cliques nela endireitam.
          </div>
          {d.bend && (
            <button className="fn-btn fn-edge-straighten" onClick={() => set({ bend: undefined })}>
              <Undo2 size={14} /> Endireitar curva
            </button>
          )}
        </Field>
        <Field
          label="Seta no fim"
          aside={<Toggle on={edgeArrow(d)} onChange={(v) => set({ arrow: v })} />}
        >
          {null}
        </Field>
        <Field label="Cor">
          <Swatches value={d.color} onChange={(c) => set({ color: c })} allowNone />
        </Field>
      </div>
      <div className="fn-insp-foot">
        <button className="fn-btn is-danger" onClick={remove}>
          <Trash2 size={14} /> Excluir conexão
        </button>
      </div>
    </div>
  )
}

// memo: mover um nó (só muda a posição) não re-renderiza o painel
export const NodeInspector = memo(NodeInspectorImpl, (a, b) => {
  const { node: na, ...ra } = a
  const { node: nb, ...rb } = b
  if (na.id !== nb.id || na.type !== nb.type || na.data !== nb.data) return false
  return (Object.keys(ra) as (keyof typeof ra)[]).every((k) => ra[k] === rb[k])
})

export const EdgeInspector = memo(EdgeInspectorImpl, (a, b) => {
  const { edge: ea, ...ra } = a
  const { edge: eb, ...rb } = b
  if (ea.id !== eb.id || ea.data !== eb.data) return false
  return (Object.keys(ra) as (keyof typeof ra)[]).every((k) => ra[k] === rb[k])
})

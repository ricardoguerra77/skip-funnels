import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, GROUPS, searchCatalog } from '../catalog'
import { ItemIcon } from './Palette'

/** Busca rápida que aparece ao soltar uma conexão no vazio. */
export function QuickAdd({
  x,
  y,
  placeholder,
  onPick,
  onClose,
}: {
  x: number
  y: number
  placeholder?: string
  onPick: (ref: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => {
    if (q.trim()) return searchCatalog(q).slice(0, 60)
    // sem busca: os mais usados em funis
    const common = [
      'pages:pagina',
      'pages:vendas',
      'pages:captura',
      'pages:obrigado',
      'pages:checkout',
      'pages:webinar',
      'pages:oto',
      'events:lead',
      'events:compra',
      'events:tag',
      'events:esperar',
      'events:se-ou',
      'events:order-bump',
      'events:carrinho-abandonado',
      'messages:email',
      'messages:sequencia-emails',
      'messages:whatsapp',
    ]
    return common.map((id) => CATALOG.find((c) => c.id === id)!).filter(Boolean)
  }, [q])

  useEffect(() => inputRef.current?.focus({ preventScroll: true }), [])
  useEffect(() => setIdx(0), [q])
  useEffect(() => {
    // rola só a lista (scrollIntoView rolaria também os contêineres do Obsidian)
    const list = listRef.current
    const a = list?.querySelector<HTMLElement>('.is-active')
    if (!list || !a) return
    if (a.offsetTop < list.scrollTop) list.scrollTop = a.offsetTop
    else if (a.offsetTop + a.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = a.offsetTop + a.offsetHeight - list.clientHeight
  }, [idx])

  return (
    <div
      className="fn-quick nowheel"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <label className="fn-search">
        <Search size={15} />
        <input
          ref={inputRef}
          value={q}
          placeholder={placeholder ?? 'Adicionar e conectar...'}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => setTimeout(onClose, 150)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIdx((i) => Math.min(items.length - 1, i + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIdx((i) => Math.max(0, i - 1))
            } else if (e.key === 'Enter' && items[idx]) onPick(items[idx].id)
          }}
        />
      </label>
      <div className="fn-quick-list" ref={listRef}>
        {items.map((it, i) => (
          <button
            key={it.id}
            className={`fn-quick-item${i === idx ? ' is-active' : ''}`}
            onMouseEnter={() => setIdx(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(it.id)}
          >
            <span className="fn-quick-icon">
              <ItemIcon item={it} size={22} />
            </span>
            <span className="fn-quick-label">{it.label}</span>
            <span className="fn-quick-group">{GROUPS.find((g) => g.id === it.group)?.label}</span>
          </button>
        ))}
        {!items.length && <div className="fn-pal-empty">Nada encontrado.</div>}
      </div>
    </div>
  )
}

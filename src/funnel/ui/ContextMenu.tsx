import { Check } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export type MenuEntry =
  | 'sep'
  | {
      label: string
      icon?: ReactNode
      onClick: () => void
      hint?: string // atalho, mostrado à direita
      danger?: boolean
      checked?: boolean
      disabled?: boolean
    }

/** Menu de botão direito no estilo do canvas (posicionado dentro da área visível). */
export function ContextMenu({
  x,
  y,
  items,
  onClose,
  leaving,
}: {
  x: number
  y: number
  items: MenuEntry[]
  onClose: () => void
  leaving?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  // encosta na borda se não couber
  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    const w = el.offsetWidth
    const h = el.offsetHeight
    setPos({
      x: Math.max(6, Math.min(x, parent.clientWidth - w - 6)),
      y: Math.max(6, Math.min(y, parent.clientHeight - h - 6)),
    })
  }, [x, y])

  useEffect(() => {
    const doc = ref.current?.ownerDocument ?? document
    const away = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    doc.addEventListener('pointerdown', away, true)
    doc.addEventListener('wheel', onClose, { capture: true, passive: true })
    doc.addEventListener('keydown', key, true)
    return () => {
      doc.removeEventListener('pointerdown', away, true)
      doc.removeEventListener('wheel', onClose, true)
      doc.removeEventListener('keydown', key, true)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`fn-menu nowheel${leaving ? ' is-leaving' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
    >
      {items.map((it, i) =>
        it === 'sep' ? (
          <div key={`sep${i}`} className="fn-menu-sep" />
        ) : (
          <button
            key={it.label}
            role="menuitem"
            className={`fn-menu-item${it.danger ? ' is-danger' : ''}`}
            disabled={it.disabled}
            onClick={() => {
              onClose()
              it.onClick()
            }}
          >
            <span className="fn-menu-icon">{it.checked ? <Check size={15} /> : it.icon}</span>
            <span className="fn-menu-label">{it.label}</span>
            {it.hint && <span className="fn-menu-hint">{it.hint}</span>}
          </button>
        ),
      )}
    </div>
  )
}

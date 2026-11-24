import { createPortal } from 'react-dom'
import { ContextMenu, type MenuEntry } from '@/funnel/ui/ContextMenu'

export type { MenuEntry }

export interface MenuState {
  x: number
  y: number
  items: MenuEntry[]
}

/** O menu do canvas usado fora dele (cartões da galeria, barra do editor). */
export function FloatingMenu({ menu, onClose }: { menu: MenuState | null; onClose: () => void }) {
  if (!menu) return null
  return createPortal(
    <div className="fn-root fn-menu-host">
      <ContextMenu
        key={`${menu.x},${menu.y}`}
        x={menu.x}
        y={menu.y}
        items={menu.items}
        onClose={onClose}
      />
    </div>,
    document.body,
  )
}

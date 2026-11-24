import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  useStore,
  useStoreApi,
  type EdgeProps,
} from '@xyflow/react'
import {
  memo,
  useRef,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
} from 'react'
import { useEditor } from './context'
import { edgeArrow, edgeStyle, type FEdge } from './doc'
import { bendFor, edgePath, type EdgePathKind, type PathInput, type Side } from './edgePath'

/** Pixels de tela antes de começar a curvar: um clique simples não mexe na linha. */
const DRAG_START = 3
const BEND_TIP = 'Arraste para curvar · dois cliques para endireitar'

interface BendHandlers {
  onPointerDown(e: RPointerEvent): void
  onPointerMove(e: RPointerEvent): void
  onPointerUp(e: RPointerEvent): void
  onDoubleClick(e: RMouseEvent): void
}

/** Geometria atual da conexão + onde está o ponto do meio. */
interface BendGeo {
  path: PathInput
  mx: number
  my: number
}

/** Arrastar a bolinha (ou o rótulo) do meio da conexão grava `bend`. */
function useBend(id: string, selected: boolean, geo: BendGeo, hasBend: boolean): BendHandlers {
  const ed = useEditor()
  const rf = useReactFlow()
  const store = useStoreApi()
  // o componente re-renderiza durante o arraste; os handlers leem sempre o valor atual
  const cur = useRef(geo)
  cur.current = geo
  const drag = useRef<{ x0: number; y0: number; ox: number; oy: number; on: boolean } | null>(null)

  return {
    onPointerDown(e) {
      if (e.button !== 0) return
      e.stopPropagation()
      if (!selected) store.getState().addSelectedEdges([id])
      const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      // guarda onde a bolinha foi "pega" para ela não pular para baixo do cursor
      drag.current = {
        x0: e.clientX,
        y0: e.clientY,
        ox: cur.current.mx - p.x,
        oy: cur.current.my - p.y,
        on: false,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove(e) {
      const g = drag.current
      if (!g) return
      if (!g.on) {
        if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < DRAG_START) return
        g.on = true
        e.currentTarget.classList.add('is-bending')
      }
      const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const bend = bendFor(cur.current.path, p.x + g.ox, p.y + g.oy)
      ed.updateEdge(id, { bend }, `${id}:bend`)
    },
    onPointerUp(e) {
      drag.current = null
      const el = e.currentTarget
      el.classList.remove('is-bending')
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    },
    onDoubleClick(e) {
      e.stopPropagation()
      if (hasBend) ed.updateEdge(id, { bend: undefined })
    },
  }
}

/** Bolinha do meio: tamanho fixo na tela, qualquer que seja o zoom. */
function BendHandle({ x, y, bent, h }: { x: number; y: number; bent: boolean; h: BendHandlers }) {
  const zoom = useStore((s) => s.transform[2])
  const k = Math.min(3, 1 / zoom)
  return (
    <div
      className={`fn-edge-bend nodrag nopan${bent ? ' is-bent' : ''}`}
      style={{ transform: `translate(-50%,-50%) translate(${x}px,${y}px) scale(${k})` }}
      title={BEND_TIP}
      onPointerDown={h.onPointerDown}
      onPointerMove={h.onPointerMove}
      onPointerUp={h.onPointerUp}
      onPointerCancel={h.onPointerUp}
      onDoubleClick={h.onDoubleClick}
    >
      <span className="fn-edge-bend-dot" />
    </div>
  )
}

/** Conexão sólida com seta (padrão), tracejada ou animada; curva, reta ou cotovelo, com curvatura ajustável. */
export const FunnelEdge = memo(function FunnelEdge(props: EdgeProps<FEdge>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    sourceHandleId,
  } = props
  const kind: EdgePathKind = data?.path ?? 'curve'
  const path: PathInput = {
    sx: sourceX,
    sy: sourceY,
    sSide: sourcePosition as Side,
    tx: targetX,
    ty: targetY,
    tSide: targetPosition as Side,
    kind,
  }
  const { d, mx, my } = edgePath({ ...path, bend: data?.bend })
  const hasBend = !!data?.bend
  const bend = useBend(id, !!selected, { path, mx, my }, hasBend)

  const style = edgeStyle(data)
  const arrow = edgeArrow(data)
  let color = data?.color || 'var(--fn-edge)'
  if (!data?.color && sourceHandleId === 'yes') color = 'var(--fn-yes-edge)'
  if (!data?.color && sourceHandleId === 'no') color = 'var(--fn-no-edge)'
  const markerId = `fn-arrow-${id}`
  return (
    <>
      {arrow && (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={color} />
          </marker>
        </defs>
      )}
      <BaseEdge
        id={id}
        path={d}
        interactionWidth={18}
        markerEnd={arrow ? `url(#${markerId})` : undefined}
        className={`fn-edge is-${style}${selected ? ' is-selected' : ''}`}
        style={{ stroke: color }}
      />
      {(data?.label || selected) && (
        <EdgeLabelRenderer>
          {data?.label ? (
            // com rótulo, o próprio rótulo faz o papel da bolinha
            <div
              className={`fn-edge-label nodrag nopan${selected ? ' is-selected' : ''}`}
              style={{ transform: `translate(-50%,-50%) translate(${mx}px,${my}px)` }}
              title={selected ? BEND_TIP : undefined}
              onPointerDown={bend.onPointerDown}
              onPointerMove={bend.onPointerMove}
              onPointerUp={bend.onPointerUp}
              onPointerCancel={bend.onPointerUp}
              onDoubleClick={bend.onDoubleClick}
            >
              {data.label}
            </div>
          ) : (
            <BendHandle x={mx} y={my} bent={hasBend} h={bend} />
          )}
        </EdgeLabelRenderer>
      )}
    </>
  )
})

export const EDGE_TYPES = { fn: FunnelEdge }

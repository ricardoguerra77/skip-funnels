import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ConnectionMode,
  ReactFlow,
  reconnectEdge,
  SelectionMode,
  useNodesInitialized,
  useReactFlow,
  useStore,
  useViewport,
  type Connection,
  type EdgeChange,
  type FinalConnectionState,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import {
  ArrowRight,
  BringToFront,
  ClipboardPaste,
  Copy,
  ExternalLink,
  Frame,
  LayoutTemplate,
  Maximize,
  Minus,
  MousePointer2,
  Paperclip,
  PenLine,
  Plus,
  Redo2,
  SendToBack,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  Lock,
  LockOpen,
} from 'lucide-react'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
} from 'react'
import { EditorCtx, type EditorApi } from './context'
import {
  applyLock,
  copySelection,
  edgeArrow,
  edgeKind,
  edgeKindPatch,
  edgeStyle,
  formatMoney,
  fromFlow,
  History,
  isLocked,
  newId,
  nodeFromFile,
  nodeFromItem,
  nodeFromTool,
  nodeSize,
  nodesInSection,
  parseFile,
  pasteClip,
  priceTotals,
  sectionAround,
  serialize,
  snapshot,
  toFlow,
  type Clip,
  type EdgeKind,
  type FEdge,
  type FNode,
  type ToolKind,
} from './doc'
import { EDGE_TYPES } from './edges'
import { NODE_TYPES } from './nodes/nodes'
import {
  DEFAULT_PREFS,
  type BaseData,
  type EdgeData,
  type EdgeStyle,
  type FunnelFile,
  type FunnelHost,
  type FunnelPrefs,
  type Viewport,
} from './types'
import { ContextMenu, type MenuEntry } from './ui/ContextMenu'
import { EdgeInspector, NodeInspector, type ProductOption } from './ui/Inspector'
import { getItem } from './catalog'
import {
  ItemIcon,
  Palette,
  toolInfo,
  type DragPayload,
  type ItemHandlers,
  type Panel,
  type Tool,
} from './ui/Palette'
import { QuickAdd } from './ui/QuickAdd'
import { cameraMs, easeInOutCubic, easeOutCubic, useLeaving, useSmoothCamera } from './motion'

/** Área de transferência compartilhada entre funis abertos. */
let clipboard: Clip | null = null

export interface EditorHandle {
  loadText(text: string): void
  flush(): void
}

type Side = 't' | 'r' | 'b' | 'l'
const OPPOSITE: Record<string, Side> = { r: 'l', yes: 'l', no: 'l', l: 'r', t: 'b', b: 't' }

// Props constantes do React Flow: objetos/arrays novos a cada render fariam o
// React Flow atualizar o store e re-registrar atalhos a cada quadro de arraste.
const PAN_BUTTONS = [1] // botão do meio (o direito abre o menu)
const MULTI_KEYS = ['Shift', 'Control', 'Meta']
const ZOOM_KEYS = ['Control', 'Meta']
const SNAP: [number, number] = [10, 10]
const FIT_OPTIONS = { padding: 0.15, maxZoom: 1 }
const PRO = { hideAttribution: true }
const EDGE_DEFAULTS = { type: 'fn' }
const START_VIEWPORT = { x: 80, y: 80, zoom: 1 }
/** Classe temporária de quem acabou de nascer (anima a entrada; não vai para o arquivo). */
const ENTER = 'fn-enter'

function isTyping(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null
  if (!t || !t.tagName) return false
  return (
    t.tagName === 'INPUT' ||
    t.tagName === 'TEXTAREA' ||
    t.tagName === 'SELECT' ||
    t.isContentEditable
  )
}

type QuickState = {
  x: number
  y: number
  flow: { x: number; y: number }
  from: string | null
  fromHandle: string | null
}
type MenuState = { x: number; y: number; items: MenuEntry[] }

export function Editor({
  initial,
  host,
  prefs = DEFAULT_PREFS,
  readOnly = false,
  onReady,
}: {
  initial: FunnelFile
  host: FunnelHost
  prefs?: FunnelPrefs
  readOnly?: boolean
  onReady: (h: EditorHandle) => void
}) {
  const rf = useReactFlow<FNode, FEdge>()
  const start = useMemo(() => toFlow(initial), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [nodes, setNodes] = useState<FNode[]>(start.nodes)
  const [edges, setEdges] = useState<FEdge[]>(start.edges)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  // tira a marca de entrada depois que a animação terminou
  // (a contagem reinicia o tempo se nascer outro elemento no meio da animação)
  const enterCount =
    nodes.filter((n) => n.className === ENTER).length +
    edges.filter((e) => e.className === ENTER).length
  useEffect(() => {
    if (!enterCount) return
    const t = window.setTimeout(() => {
      setNodes((nds) =>
        nds.some((n) => n.className === ENTER)
          ? nds.map((n) => (n.className === ENTER ? { ...n, className: undefined } : n))
          : nds,
      )
      setEdges((eds) =>
        eds.some((e) => e.className === ENTER)
          ? eds.map((e) => (e.className === ENTER ? { ...e, className: undefined } : e))
          : eds,
      )
    }, 500)
    return () => window.clearTimeout(t)
  }, [enterCount])

  const wrapRef = useRef<HTMLDivElement>(null)
  const history = useRef(new History())
  const lastSaved = useRef(serialize(initial))
  const [, bump] = useState(0) // força re-render dos botões de desfazer

  const [panel, setPanel] = useState<Panel>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [penColor, setPenColor] = useState('')
  const [penSize, setPenSize] = useState(4)
  const [quick, setQuick] = useState<QuickState | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [editRequest, setEditRequest] = useState<string | null>(null)
  const [inspectorHidden, setInspectorHidden] = useState(false)
  const mouse = useRef<{ x: number; y: number } | null>(null)
  const addCount = useRef(0)

  /** Devolve o foco ao canvas (para os atalhos) quando o elemento focado some. */
  const refocus = useCallback(() => {
    window.setTimeout(() => {
      const doc = wrapRef.current?.ownerDocument ?? document
      const a = doc.activeElement
      if (!a || a === doc.body) wrapRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [])

  /** Posição relativa ao canvas (para popups) a partir de coordenadas de tela. */
  const local = useCallback((clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top, w: rect.width, h: rect.height }
  }, [])

  // ------------------------------------------------------------ salvar
  const flush = useCallback(() => {
    const text = serialize(fromFlow(nodesRef.current, edgesRef.current))
    if (text !== lastSaved.current) {
      lastSaved.current = text
      host.save(text)
    }
  }, [host])

  useEffect(() => {
    const t = window.setTimeout(flush, 300)
    return () => window.clearTimeout(t)
  }, [nodes, edges, flush])

  useEffect(() => () => flush(), [flush])

  // ------------------------------------------------------------ histórico
  const checkpoint = useCallback((key?: string) => {
    history.current.checkpoint(snapshot(nodesRef.current, edgesRef.current), key)
    bump((n) => n + 1)
  }, [])

  const restore = useCallback((snap: string) => {
    const f = toFlow(JSON.parse(snap) as FunnelFile)
    setNodes(f.nodes)
    setEdges(f.edges)
    bump((n) => n + 1)
  }, [])

  const undo = useCallback(() => {
    const prev = history.current.undo(snapshot(nodesRef.current, edgesRef.current))
    if (prev) restore(prev)
  }, [restore])

  const redo = useCallback(() => {
    const next = history.current.redo(snapshot(nodesRef.current, edgesRef.current))
    if (next) restore(next)
  }, [restore])

  // ------------------------------------------------------------ API externa (página do editor)
  useEffect(() => {
    onReady({
      loadText(text: string) {
        if (text === lastSaved.current) return
        let file: FunnelFile
        try {
          file = parseFile(text)
        } catch {
          host.notify('O funil mudou em outra aba, mas o conteúdo não é válido — mudança ignorada.')
          return
        }
        checkpoint()
        const f = toFlow(file)
        lastSaved.current = text
        setNodes(f.nodes)
        setEdges(f.edges)
      },
      flush,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------ mudanças do React Flow
  const onNodesChange = useCallback(
    (changes: NodeChange<FNode>[]) => {
      if (readOnly) return
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [readOnly],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<FEdge>[]) => {
      if (readOnly) return
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [readOnly],
  )

  useEffect(() => {
    if (!readOnly) return
    setNodes((nds) =>
      nds.some((n) => n.selected)
        ? nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        : nds,
    )
    setEdges((eds) =>
      eds.some((e) => e.selected)
        ? eds.map((e) => (e.selected ? { ...e, selected: false } : e))
        : eds,
    )
  }, [readOnly])

  const connectionOk = useCallback((c: Connection | FEdge) => c.source !== c.target, [])

  const onConnect = useCallback(
    (c: Connection) => {
      if (readOnly || c.source === c.target) return
      checkpoint()
      setEdges((eds) =>
        addEdge({ ...c, id: newId('e'), type: 'fn', data: {}, className: ENTER }, eds),
      )
    },
    [checkpoint, readOnly],
  )

  const onReconnect = useCallback(
    (old: FEdge, c: Connection) => {
      checkpoint()
      setEdges((eds) => reconnectEdge(old, c, eds, { shouldReplaceId: false }))
    },
    [checkpoint],
  )

  const openQuick = useCallback(
    (clientX: number, clientY: number, from: string | null, fromHandle: string | null) => {
      const p = local(clientX, clientY)
      // popup sempre dentro da área visível
      const x = Math.max(8, Math.min(p.x, p.w - 330))
      const y = Math.max(8, Math.min(p.y, p.h - 380))
      setQuick({
        x,
        y,
        flow: rf.screenToFlowPosition({ x: clientX, y: clientY }),
        from,
        fromHandle,
      })
    },
    [local, rf],
  )

  /** Soltar a conexão em cima de um nó liga no lado mais próximo; no vazio abre a busca rápida. */
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid || !state.fromNode) return
      const pt = 'changedTouches' in event ? event.changedTouches[0] : event
      const fromId = state.fromNode.id
      const fromHandle = state.fromHandle?.id ?? null
      // ownerDocument: funciona também em janela destacada do Obsidian
      const doc = wrapRef.current?.ownerDocument ?? document
      const el = doc
        .elementFromPoint(pt.clientX, pt.clientY)
        ?.closest('.react-flow__node') as HTMLElement | null
      const targetId = el?.dataset.id
      if (targetId && targetId !== fromId) {
        const target = nodesRef.current.find((n) => n.id === targetId)
        if (!target || target.type === 'drawing') return
        const p = rf.screenToFlowPosition({ x: pt.clientX, y: pt.clientY })
        const { w, h } = nodeSize(target)
        const rel = {
          l: p.x - target.position.x,
          r: target.position.x + w - p.x,
          t: p.y - target.position.y,
          b: target.position.y + h - p.y,
        }
        const sides: Side[] = target.type === 'decision' ? ['l', 't', 'b'] : ['l', 'r', 't', 'b']
        const side = sides.reduce((a, b) => (rel[b] < rel[a] ? b : a))
        onConnect({
          source: fromId,
          sourceHandle: fromHandle,
          target: targetId,
          targetHandle: side,
        })
        return
      }
      if (el) return
      openQuick(pt.clientX, pt.clientY, fromId, fromHandle)
    },
    [rf, onConnect, openQuick],
  )

  const closeQuick = useCallback(() => {
    setQuick(null)
    refocus()
  }, [refocus])

  const pickQuick = useCallback(
    (ref: string) => {
      if (!quick) return
      const node = nodeFromItem(ref, quick.flow)
      setQuick(null)
      refocus()
      if (!node) return
      checkpoint()
      if (!quick.from) {
        // "Nova etapa aqui": só cria, centralizado no ponto
        setNodes((nds) => [
          ...nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
          { ...node, selected: true, className: ENTER },
        ])
        return
      }
      const { w, h } = nodeSize(node)
      const side: Side = OPPOSITE[quick.fromHandle ?? 'r'] ?? 'l'
      // encosta o lado de entrada do nó novo no ponto onde a conexão foi solta
      const pos = {
        l: { x: quick.flow.x, y: quick.flow.y - h / 2 },
        r: { x: quick.flow.x - w, y: quick.flow.y - h / 2 },
        t: { x: quick.flow.x - w / 2, y: quick.flow.y },
        b: { x: quick.flow.x - w / 2, y: quick.flow.y - h },
      }[side]
      node.position = { x: Math.round(pos.x), y: Math.round(pos.y) }
      const targetHandle = node.type === 'decision' && side === 'r' ? 'l' : side
      setNodes((nds) => [
        ...nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
        { ...node, selected: true, className: ENTER },
      ])
      setEdges((eds) =>
        addEdge(
          {
            id: newId('e'),
            source: quick.from!,
            sourceHandle: quick.fromHandle,
            target: node.id,
            targetHandle,
            type: 'fn',
            data: {},
            className: ENTER,
          },
          eds,
        ),
      )
    },
    [quick, checkpoint, refocus],
  )

  // ------------------------------------------------------------ arrastar seção leva o conteúdo junto
  const drag = useRef<{
    starts: Map<string, { x: number; y: number }>
    members: Map<string, string>
  } | null>(null)

  const onNodeDragStart = useCallback(
    (_: unknown, __: FNode, dragged: FNode[]) => {
      checkpoint()
      const sections = dragged.filter((n) => n.type === 'section')
      if (!sections.length) {
        drag.current = null
        return
      }
      const draggedIds = new Set(dragged.map((n) => n.id))
      const starts = new Map<string, { x: number; y: number }>()
      const members = new Map<string, string>()
      for (const s of sections) {
        starts.set(s.id, { ...s.position })
        for (const m of nodesInSection(s, nodesRef.current)) {
          // seção travada dentro de outra não sai do lugar
          if (draggedIds.has(m.id) || members.has(m.id) || isLocked(m)) continue
          members.set(m.id, s.id)
          starts.set(m.id, { ...m.position })
        }
      }
      drag.current = { starts, members }
    },
    [checkpoint],
  )

  const onNodeDrag = useCallback((_: unknown, __: FNode, dragged: FNode[]) => {
    const d = drag.current
    if (!d || !d.members.size) return
    const delta = new Map<string, { x: number; y: number }>()
    for (const s of dragged) {
      const st = d.starts.get(s.id)
      if (st) delta.set(s.id, { x: s.position.x - st.x, y: s.position.y - st.y })
    }
    setNodes((nds) =>
      nds.map((n) => {
        const sec = d.members.get(n.id)
        if (!sec) return n
        const dl = delta.get(sec)
        const st = d.starts.get(n.id)!
        return dl ? { ...n, position: { x: st.x + dl.x, y: st.y + dl.y } } : n
      }),
    )
  }, [])

  const onNodeDragStop = useCallback(() => {
    drag.current = null
  }, [])

  // ------------------------------------------------------------ adicionar
  /** Centro da área livre do canvas (descontando o painel da barra e o de propriedades abertos). */
  const viewCenter = useCallback(() => {
    const root = wrapRef.current!
    const rect = root.getBoundingClientRect()
    let left = rect.left
    let right = rect.right
    const pal = root.querySelector('.fn-palette')
    if (pal) left = Math.max(left, pal.getBoundingClientRect().right)
    const insp = root.querySelector('.fn-inspector')
    if (insp) right = Math.min(right, insp.getBoundingClientRect().left)
    if (right - left < 160) {
      left = rect.left
      right = rect.right
    }
    const c = rf.screenToFlowPosition({ x: (left + right) / 2, y: rect.top + rect.height / 2 })
    const k = addCount.current++ % 6
    return { x: c.x + k * 24, y: c.y + k * 24 }
  }, [rf])

  const insert = useCallback(
    (added: FNode | FNode[]) => {
      const list = Array.isArray(added) ? added : [added]
      if (!list.length) return
      checkpoint()
      setNodes((nds) => {
        const rest = nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        const sel = list.map((n) => ({ ...n, selected: true, className: ENTER }))
        // seção nova vai para o começo da lista (fica por baixo)
        return [
          ...sel.filter((n) => n.type === 'section'),
          ...rest,
          ...sel.filter((n) => n.type !== 'section'),
        ]
      })
      setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)))
    },
    [checkpoint],
  )

  const addItem = useCallback(
    (ref: string, at?: { x: number; y: number }) => {
      const node = nodeFromItem(ref, at ?? viewCenter())
      if (node) insert(node)
    },
    [insert, viewCenter],
  )

  const addTool = useCallback(
    (t: ToolKind, at?: { x: number; y: number }) => {
      const node = nodeFromTool(t, at ?? viewCenter())
      insert(node)
      if (t === 'note' || t === 'text' || t === 'section') setEditRequest(node.id)
      setTool('select')
    },
    [insert, viewCenter],
  )

  const addFiles = useCallback(
    (paths: string[], at?: { x: number; y: number }) => {
      const c = at ?? viewCenter()
      insert(paths.map((p, i) => nodeFromFile(p, { x: c.x + i * 30, y: c.y + i * 30 })))
    },
    [insert, viewCenter],
  )

  const pickAndAddFile = useCallback(
    async (at?: { x: number; y: number }) => {
      if (!host.pickFile) return
      const path = await host.pickFile()
      if (path) addFiles([path], at)
      refocus()
    },
    [host, addFiles, refocus],
  )

  // arquivo(s) arrastado(s) do computador: sobem para o Skip Cloud e viram cartões
  const onDragOver = useCallback(
    (e: DragEvent) => {
      if (!host.uploadFiles || !e.dataTransfer.types.includes('Files')) return
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    },
    [host],
  )

  const onDrop = useCallback(
    (e: DragEvent) => {
      const files = Array.from(e.dataTransfer.files ?? [])
      if (!host.uploadFiles || !files.length) return
      e.preventDefault()
      e.stopPropagation()
      const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      void host.uploadFiles(files).then((paths) => {
        if (paths.length) addFiles(paths, at)
      })
    },
    [rf, host, addFiles],
  )

  // ------------------------------------------------------------ arrastar da barra lateral para o canvas
  // Segurar um item e arrastar mostra uma "fantasma" que segue o cursor; ao
  // soltar no canvas o elemento nasce ali. Soltar sobre a barra (ou Esc) cancela.
  const [ghost, setGhost] = useState<{ payload: DragPayload; x: number; y: number } | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)
  const cancelItemDrag = useRef<(() => void) | null>(null)

  const insideEl = (sel: string, x: number, y: number) => {
    const el = wrapRef.current?.querySelector(sel)
    if (!el) return false
    const b = el.getBoundingClientRect()
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom
  }

  const onItemDown = useCallback(
    (e: RPointerEvent, payload: DragPayload) => {
      if (e.button !== 0 || !e.isPrimary) return
      const root = wrapRef.current
      if (!root) return
      const doc = root.ownerDocument
      const start = { x: e.clientX, y: e.clientY }
      let moved = false
      let leftPanel = false // depois que sai do painel, ele some e dá para soltar onde ele estava
      const blocked = (x: number, y: number) => {
        const r = root.getBoundingClientRect()
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) return true
        return insideEl('.fn-toolbar', x, y) || (!leftPanel && insideEl('.fn-pal-panel', x, y))
      }
      const finish = () => {
        doc.removeEventListener('pointermove', move)
        doc.removeEventListener('pointerup', up)
        doc.removeEventListener('pointercancel', cancel)
        cancelItemDrag.current = null
        root.classList.remove('is-dragging-item', 'is-dragging-out')
        setGhost(null)
      }
      const move = (ev: PointerEvent) => {
        if (!moved) {
          if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return
          moved = true
          root.classList.add('is-dragging-item')
          const p = local(ev.clientX, ev.clientY)
          setGhost({ payload, x: p.x, y: p.y })
        }
        // arrastou de verdade (ou saiu do painel): o painel fica translúcido e o canvas
        // inteiro, inclusive embaixo dele, vira área de soltar
        const far = Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 30
        if (
          !leftPanel &&
          (far ||
            (!insideEl('.fn-pal-panel', ev.clientX, ev.clientY) &&
              !insideEl('.fn-toolbar', ev.clientX, ev.clientY)))
        ) {
          leftPanel = true
          root.classList.add('is-dragging-out')
        }
        const g = ghostRef.current
        if (g) {
          const p = local(ev.clientX, ev.clientY)
          g.style.transform = `translate(${p.x}px, ${p.y}px)`
          g.classList.toggle('is-blocked', blocked(ev.clientX, ev.clientY))
        }
      }
      const up = (ev: PointerEvent) => {
        const isBlocked = blocked(ev.clientX, ev.clientY)
        const underPanel = insideEl('.fn-pal-panel', ev.clientX, ev.clientY)
        finish()
        if (!moved) return // foi só um clique: o onClick do botão cuida
        // o navegador ainda manda um "click" depois do arraste; ignora esse
        suppressClick.current = true
        window.setTimeout(() => (suppressClick.current = false), 0)
        if (isBlocked) return
        const at = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
        if ('ref' in payload) addItem(payload.ref, at)
        else addTool(payload.tool, at)
        // soltou onde o painel estava: fecha o painel para o elemento novo ficar à vista
        if (underPanel) setPanel(null)
        refocus()
      }
      const cancel = () => finish()
      cancelItemDrag.current = cancel
      doc.addEventListener('pointermove', move)
      doc.addEventListener('pointerup', up)
      doc.addEventListener('pointercancel', cancel)
    },
    [rf, local, addItem, addTool, refocus],
  )

  const itemHandlers: ItemHandlers = useMemo(
    () => ({
      down: onItemDown,
      add: (p: DragPayload) => {
        if (suppressClick.current) return
        if ('ref' in p) addItem(p.ref)
        else addTool(p.tool)
      },
    }),
    [onItemDown, addItem, addTool],
  )

  // ------------------------------------------------------------ editar / excluir / copiar
  const updateNode = useCallback(
    (id: string, patch: Partial<BaseData>, key?: string) => {
      if (readOnly) return
      checkpoint(key)
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [checkpoint],
  )

  const updateEdge = useCallback(
    (id: string, patch: Partial<EdgeData>, key?: string) => {
      if (readOnly) return
      checkpoint(key)
      setEdges((eds) =>
        eds.map((e) => (e.id === id ? { ...e, data: { ...(e.data ?? {}), ...patch } } : e)),
      )
    },
    [checkpoint],
  )

  const deleteSelected = useCallback(() => {
    const gone = new Set(
      nodesRef.current.filter((n) => n.selected && !isLocked(n)).map((n) => n.id),
    )
    const edgeSel = edgesRef.current.some((e) => e.selected)
    if (!gone.size && !edgeSel) return
    checkpoint()
    setNodes((nds) => nds.filter((n) => !gone.has(n.id)))
    setEdges((eds) => eds.filter((e) => !e.selected && !gone.has(e.source) && !gone.has(e.target)))
    refocus()
  }, [checkpoint, refocus])

  const pasteAt = useCallback(
    (clip: Clip, atMouse: boolean) => {
      let offset = { x: 40, y: 40 }
      if (atMouse && mouse.current) {
        const p = rf.screenToFlowPosition(mouse.current)
        const minX = Math.min(...clip.nodes.map((n) => n.x))
        const minY = Math.min(...clip.nodes.map((n) => n.y))
        offset = { x: Math.round(p.x - minX), y: Math.round(p.y - minY) }
      }
      const out = pasteClip(clip, offset)
      checkpoint()
      setNodes((nds) => {
        const rest = nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        const pasted = out.nodes.map((n) => ({ ...n, className: ENTER }))
        const secs = pasted.filter((n) => n.type === 'section')
        const others = pasted.filter((n) => n.type !== 'section')
        return [...secs, ...rest, ...others]
      })
      setEdges((eds) => [
        ...eds.map((e) => (e.selected ? { ...e, selected: false } : e)),
        ...out.edges.map((e) => ({ ...e, className: ENTER })),
      ])
    },
    [rf, checkpoint],
  )

  const copy = useCallback(() => {
    const c = copySelection(nodesRef.current, edgesRef.current)
    if (c) clipboard = c
    return c
  }, [])

  const duplicate = useCallback(() => {
    const c = copySelection(nodesRef.current, edgesRef.current)
    if (c) pasteAt(c, false)
  }, [pasteAt])

  const selectAll = useCallback(() => {
    // seção travada fica de fora (não seleciona, logo nem Delete nem arraste a pegam)
    setNodes((nds) => nds.map((n) => (isLocked(n) ? n : { ...n, selected: true })))
  }, [])

  /** Cadeado da seção. Travar tira a seleção; destravar pelo cadeado já seleciona. */
  const setSectionLock = useCallback(
    (id: string, locked: boolean, select = false) => {
      checkpoint()
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id)
            return applyLock({
              ...n,
              data: { ...n.data, locked: locked || undefined },
              selected: !locked && select,
            })
          return select && !locked && n.selected ? { ...n, selected: false } : n
        }),
      )
      if (select && !locked)
        setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)))
      refocus()
    },
    [checkpoint, refocus],
  )

  const deselect = useCallback(() => {
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)))
    setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)))
  }, [])

  /** Ordem de desenho: frente = fim da lista; trás = logo depois das seções. */
  const reorder = useCallback(
    (front: boolean) => {
      checkpoint()
      setNodes((nds) => {
        const sel = nds.filter((n) => n.selected && n.type !== 'section')
        if (!sel.length) return nds
        const rest = nds.filter((n) => !(n.selected && n.type !== 'section'))
        if (front) return [...rest, ...sel]
        const firstNonSection = rest.findIndex((n) => n.type !== 'section')
        const at = firstNonSection < 0 ? rest.length : firstNonSection
        return [...rest.slice(0, at), ...sel, ...rest.slice(at)]
      })
    },
    [checkpoint],
  )

  const wrapInSection = useCallback(() => {
    const sel = nodesRef.current.filter((n) => n.selected)
    const sec = sectionAround(sel)
    if (!sec) return
    insert(sec)
    setEditRequest(sec.id)
  }, [insert])

  const openNote = useCallback(
    (path: string, newTab = true) => host.openNote?.(path, newTab),
    [host],
  )
  const closeInspector = useCallback(() => setInspectorHidden(true), [])

  // ------------------------------------------------------------ menus de botão direito
  const closeMenu = useCallback(() => setMenu(null), [])

  const openMenu = useCallback(
    (e: RMouseEvent | MouseEvent, items: MenuEntry[]) => {
      e.preventDefault()
      e.stopPropagation()
      setQuick(null)
      const p = local(e.clientX, e.clientY)
      setMenu({ x: p.x, y: p.y, items })
    },
    [local],
  )

  const onPaneContextMenu = useCallback(
    (e: RMouseEvent | MouseEvent) => {
      const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const cx = e.clientX
      const cy = e.clientY
      // clicou dentro de uma seção travada (o clique atravessa ela): oferece destravar
      const locked = nodesRef.current
        .filter((n) => {
          if (!isLocked(n)) return false
          const { w, h } = nodeSize(n)
          return (
            at.x >= n.position.x &&
            at.x <= n.position.x + w &&
            at.y >= n.position.y &&
            at.y <= n.position.y + h
          )
        })
        .sort((a, b) => nodeSize(a).w * nodeSize(a).h - nodeSize(b).w * nodeSize(b).h)[0]
      const items: MenuEntry[] = [
        ...(locked
          ? ([
              {
                label: `Destravar seção “${locked.data.label || 'sem nome'}”`,
                icon: <LockOpen size={15} />,
                onClick: () => setSectionLock(locked.id, false, true),
              },
              'sep',
            ] as MenuEntry[])
          : []),
        {
          label: 'Nova etapa aqui',
          icon: <Plus size={15} />,
          onClick: () => openQuick(cx, cy, null, null),
        },
        ...(clipboard
          ? [
              {
                label: 'Colar aqui',
                icon: <ClipboardPaste size={15} />,
                hint: 'Ctrl+V',
                onClick: () => clipboard && pasteAt(clipboard, true),
              },
            ]
          : []),
        {
          label: 'Selecionar tudo',
          icon: <MousePointer2 size={15} />,
          hint: 'Ctrl+A',
          onClick: selectAll,
        },
        {
          label: 'Ajustar à tela',
          icon: <Maximize size={15} />,
          hint: 'Shift+1',
          onClick: () =>
            rf.fitView({ padding: 0.15, duration: cameraMs(480), ease: easeInOutCubic }),
        },
        'sep',
        {
          label: 'Nota',
          icon: <StickyNote size={15} />,
          hint: 'N',
          onClick: () => addTool('note', at),
        },
        {
          label: 'Seção',
          icon: <Frame size={15} />,
          hint: 'S',
          onClick: () => addTool('section', at),
        },
        { label: 'Texto', icon: <Type size={15} />, hint: 'T', onClick: () => addTool('text', at) },
        {
          label: 'Forma',
          icon: <Square size={15} />,
          hint: 'R',
          onClick: () => addTool('shape:rounded', at),
        },
        ...(host.pickFile
          ? ([
              'sep',
              {
                label: 'Enviar arquivo…',
                icon: <Paperclip size={15} />,
                onClick: () => void pickAndAddFile(at),
              },
            ] as MenuEntry[])
          : []),
      ]
      openMenu(e, items)
    },
    [rf, host, openQuick, pasteAt, selectAll, addTool, pickAndAddFile, openMenu, setSectionLock],
  )

  const selectionMenu = useCallback((): MenuEntry[] => {
    const sel = nodesRef.current.filter((n) => n.selected)
    const one = sel.length === 1 ? sel[0] : null
    const items: MenuEntry[] = []
    if (
      one &&
      (one.type === 'note' || one.type === 'shape' || one.type === 'text' || one.type === 'section')
    )
      items.push({
        label: one.type === 'section' ? 'Renomear seção' : 'Editar texto',
        icon: <PenLine size={15} />,
        onClick: () => setEditRequest(one.id),
      })
    if (one?.type === 'file' && one.data.file)
      items.push({
        label: 'Abrir arquivo',
        icon: <ExternalLink size={15} />,
        onClick: () => openNote(one.data.file as string, true),
      })
    if (items.length) items.push('sep')
    items.push(
      { label: 'Duplicar', icon: <Copy size={15} />, hint: 'Ctrl+D', onClick: duplicate },
      { label: 'Copiar', icon: <Copy size={15} />, hint: 'Ctrl+C', onClick: () => void copy() },
    )
    if (sel.length > 1 || (one && one.type !== 'section'))
      items.push({ label: 'Envolver em seção', icon: <Frame size={15} />, onClick: wrapInSection })
    if (one?.type === 'section')
      items.push({
        label: 'Travar seção',
        icon: <Lock size={15} />,
        onClick: () => setSectionLock(one.id, true),
      })
    if (sel.some((n) => n.type !== 'section'))
      items.push(
        {
          label: 'Trazer para frente',
          icon: <BringToFront size={15} />,
          onClick: () => reorder(true),
        },
        {
          label: 'Enviar para trás',
          icon: <SendToBack size={15} />,
          onClick: () => reorder(false),
        },
      )
    items.push('sep', {
      label: sel.length > 1 ? `Excluir ${sel.length} itens` : 'Excluir',
      icon: <Trash2 size={15} />,
      hint: 'Del',
      danger: true,
      onClick: deleteSelected,
    })
    return items
  }, [openNote, duplicate, copy, wrapInSection, reorder, deleteSelected, setSectionLock])

  const onNodeContextMenu = useCallback(
    (e: RMouseEvent, node: FNode) => {
      // clique direito num nó fora da seleção seleciona só ele
      if (!node.selected) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? n.selected
                ? n
                : { ...n, selected: true }
              : n.selected
                ? { ...n, selected: false }
                : n,
          ),
        )
        setEdges((eds) => eds.map((x) => (x.selected ? { ...x, selected: false } : x)))
        nodesRef.current = nodesRef.current.map((n) => ({ ...n, selected: n.id === node.id }))
      }
      openMenu(e, selectionMenu())
    },
    [openMenu, selectionMenu],
  )

  const onSelectionContextMenu = useCallback(
    (e: RMouseEvent) => openMenu(e, selectionMenu()),
    [openMenu, selectionMenu],
  )

  const onEdgeContextMenu = useCallback(
    (e: RMouseEvent, edge: FEdge) => {
      setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)))
      setEdges((eds) =>
        eds.map((x) =>
          x.id === edge.id ? { ...x, selected: true } : x.selected ? { ...x, selected: false } : x,
        ),
      )
      setInspectorHidden(false)
      const style = edgeStyle(edge.data)
      const arrow = edgeArrow(edge.data)
      const setStyle = (s: EdgeStyle) => () => updateEdge(edge.id, { style: s })
      const kind = edgeKind(edge.data)
      const setKind = (k: EdgeKind) => () => updateEdge(edge.id, edgeKindPatch(k))
      openMenu(e, [
        { label: 'Sólida', checked: style === 'solid', onClick: setStyle('solid') },
        { label: 'Tracejada', checked: style === 'dashed', onClick: setStyle('dashed') },
        { label: 'Animada', checked: style === 'animated', onClick: setStyle('animated') },
        'sep',
        { label: 'Curva', checked: kind === 'curve', onClick: setKind('curve') },
        { label: 'Reta', checked: kind === 'straight', onClick: setKind('straight') },
        { label: 'Cotovelo', checked: kind === 'step', onClick: setKind('step') },
        ...(edge.data?.bend
          ? [
              {
                label: 'Endireitar curva',
                icon: <Undo2 size={15} />,
                onClick: () => updateEdge(edge.id, { bend: undefined }),
              },
            ]
          : []),
        'sep',
        {
          label: arrow ? 'Tirar seta' : 'Seta no fim',
          icon: <ArrowRight size={15} />,
          onClick: () => updateEdge(edge.id, { arrow: !arrow }),
        },
        'sep',
        {
          label: 'Excluir conexão',
          icon: <Trash2 size={15} />,
          danger: true,
          onClick: () => {
            checkpoint()
            setEdges((eds) => eds.filter((x) => x.id !== edge.id))
          },
        },
      ])
    },
    [openMenu, updateEdge, checkpoint],
  )

  // ------------------------------------------------------------ teclado
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (readOnly || isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      let handled = true
      if (mod && k === 'z' && !e.shiftKey) undo()
      else if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) redo()
      else if (mod && k === 'c') copy()
      else if (mod && k === 'x') {
        if (copy()) deleteSelected()
      } else if (mod && k === 'v') {
        if (clipboard) pasteAt(clipboard, true)
      } else if (mod && k === 'd') duplicate()
      else if (mod && k === 'a') selectAll()
      else if (mod && k === 'g') wrapInSection()
      else if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) deleteSelected()
      else if (e.key === 'Escape') {
        if (cancelItemDrag.current) cancelItemDrag.current()
        else if (menu) setMenu(null)
        else if (quick) setQuick(null)
        else if (tool !== 'select') {
          setTool('select')
          if (panel === 'pen') setPanel(null)
        } else if (panel) setPanel(null)
        else deselect()
      } else if (!mod && !e.altKey) {
        if (k === 'v') setTool('select')
        else if (k === 'h') setTool('hand')
        else if (k === 'p') {
          setTool('pen')
          setPanel('pen')
        } else if (k === 'n') addTool('note')
        else if (k === 't') addTool('text')
        else if (k === 's') addTool('section')
        else if (k === 'r') addTool('shape:rounded')
        else if (k === '1' && e.shiftKey)
          rf.fitView({ padding: 0.15, duration: cameraMs(480), ease: easeInOutCubic })
        else handled = false
      } else handled = false
      if (handled) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [
      undo,
      redo,
      copy,
      deleteSelected,
      pasteAt,
      duplicate,
      selectAll,
      wrapInSection,
      deselect,
      menu,
      quick,
      panel,
      tool,
      addTool,
      rf,
    ],
  )

  const focusWrap = useCallback((e: RPointerEvent) => {
    if (!isTyping(e.target)) wrapRef.current?.focus({ preventScroll: true })
  }, [])

  // ------------------------------------------------------------ lápis
  const addStroke = useCallback(
    (screenPts: { x: number; y: number }[]) => {
      if (screenPts.length < 2) return
      const pts = screenPts.map((p) => rf.screenToFlowPosition(p))
      const pad = penSize
      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const x0 = Math.min(...xs) - pad
      const y0 = Math.min(...ys) - pad
      const w = Math.max(...xs) - x0 + pad
      const h = Math.max(...ys) - y0 + pad
      const flat: number[] = []
      for (const p of pts)
        flat.push(Math.round((p.x - x0) * 10) / 10, Math.round((p.y - y0) * 10) / 10)
      checkpoint()
      const node: FNode = {
        id: newId(),
        type: 'drawing',
        position: { x: Math.round(x0), y: Math.round(y0) },
        data: {
          points: flat,
          w: Math.ceil(w),
          h: Math.ceil(h),
          size: penSize,
          ...(penColor ? { color: penColor } : {}),
        },
      }
      setNodes((nds) => [...nds, node])
    },
    [rf, penSize, penColor, checkpoint],
  )

  // ------------------------------------------------------------ câmera: roda suave, inércia, nitidez após zoom
  // A tela fica sempre numa camada da GPU (mover só desloca a imagem já pintada);
  // ver motion.ts.
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs
  const camera = useSmoothCamera(rf, wrapRef, () => prefsRef.current.wheelZooms)
  const vpTimer = useRef(0)
  const onMoveStart = useCallback(
    (e: MouseEvent | TouchEvent | null, vp: Viewport) => {
      camera.onMoveStart(e, vp)
      setMenu(null)
    },
    [camera],
  )
  const onMove = useCallback(
    (e: MouseEvent | TouchEvent | null, vp: Viewport) => camera.onMove(e, vp),
    [camera],
  )
  const onMoveEnd = useCallback(
    (e: MouseEvent | TouchEvent | null, vp: Viewport) => {
      camera.onMoveEnd(e, vp)
      if (!host.saveViewport) return
      window.clearTimeout(vpTimer.current)
      vpTimer.current = window.setTimeout(() => host.saveViewport!(rf.getViewport()), 400)
    },
    [host, camera, rf],
  )
  const savedViewport = useMemo(() => host.loadViewport?.() ?? null, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------ seleção / inspetor
  const selNodes = nodes.filter((n) => n.selected)
  const selEdges = edges.filter((e) => e.selected)
  const one = selNodes.length === 1 ? selNodes[0] : null
  const oneEdge = !selNodes.length && selEdges.length === 1 ? selEdges[0] : null
  // painéis e menu continuam montados um instante ao fechar, para a animação de saída
  const [inspNode, inspNodeLeaving] = useLeaving(one && !inspectorHidden ? one : null, 170)
  const [inspEdge, inspEdgeLeaving] = useLeaving(oneEdge && !inspectorHidden ? oneEdge : null, 170)
  const [menuShown, menuLeaving] = useLeaving(menu, 110)
  const onSelectionChange = useCallback(
    (_: OnSelectionChangeParams) => setInspectorHidden(false),
    [],
  )

  const totals = useMemo(() => priceTotals(nodes), [nodes])

  // produtos do funil para o painel do bundle — só muda quando nome/preço de algum produto muda
  const productsKey = useMemo(
    () =>
      JSON.stringify(
        nodes
          .filter((n) => n.type === 'product')
          .map((n) => [
            n.id,
            n.data.label || n.data.category || 'Produto',
            n.data.showPrice ? (n.data.price ?? null) : null,
            n.data.currency ?? 'BRL',
            !!n.data.bundle,
          ]),
      ),
    [nodes],
  )
  const productOptions = useMemo<ProductOption[]>(
    () =>
      (
        JSON.parse(productsKey) as [
          string,
          string,
          number | null,
          ProductOption['currency'],
          boolean,
        ][]
      ).map(([id, name, price, currency, bundle]) => ({
        id,
        name,
        price: price ?? undefined,
        currency,
        bundle,
      })),
    [productsKey],
  )
  const totalsText = totals.map((t) => formatMoney(t.value, t.currency, true)).join(' · ')

  const api: EditorApi = useMemo(
    () => ({
      host,
      update: updateNode,
      updateEdge,
      checkpoint,
      openNote,
      editRequest,
      clearEditRequest: () => setEditRequest(null),
      setSectionLock,
    }),
    [host, updateNode, updateEdge, checkpoint, openNote, editRequest, setSectionLock],
  )

  // enquadra depois que o React Flow mediu os nós novos
  const [fitPending, setFitPending] = useState(false)
  const measured = useNodesInitialized()
  useEffect(() => {
    if (fitPending && measured) {
      setFitPending(false)
      rf.fitView({ padding: 0.12, duration: cameraMs(560), ease: easeInOutCubic })
    }
  }, [fitPending, measured, rf])

  const loadTemplate = useCallback(
    (json: string) => {
      checkpoint()
      const f = toFlow(parseFile(json))
      setNodes(f.nodes)
      setEdges(f.edges)
      setFitPending(true)
    },
    [checkpoint],
  )

  const chooseTemplate = useCallback(async () => {
    if (host.pickTemplate) {
      const json = await host.pickTemplate()
      if (json) loadTemplate(json)
      return
    }
    const first = host.templates?.[0]
    if (first) loadTemplate(first.json)
  }, [host, loadTemplate])

  /**
   * O miolo da seção deixa o clique passar (para dar para selecionar em caixa
   * lá dentro). Então um clique simples no vazio de uma seção a seleciona —
   * aí ela pode ser arrastada por qualquer ponto e redimensionada.
   */
  const onPaneClick = useCallback(
    (e: RMouseEvent) => {
      if (readOnly) return
      setPanel((p) => (p === 'pen' ? p : null))
      const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const hit = nodesRef.current
        .filter((n) => {
          if (n.type !== 'section' || isLocked(n)) return false // travada: o clique atravessa
          const { w, h } = nodeSize(n)
          return (
            p.x >= n.position.x &&
            p.x <= n.position.x + w &&
            p.y >= n.position.y &&
            p.y <= n.position.y + h
          )
        })
        .sort((a, b) => nodeSize(a).w * nodeSize(a).h - nodeSize(b).w * nodeSize(b).h)[0]
      if (!hit) return
      // depois da limpeza de seleção que o React Flow faz no mesmo clique
      window.setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === hit.id
              ? n.selected
                ? n
                : { ...n, selected: true }
              : n.selected
                ? { ...n, selected: false }
                : n,
          ),
        )
        setEdges((eds) => eds.map((x) => (x.selected ? { ...x, selected: false } : x)))
      }, 0)
    },
    [readOnly, rf],
  )
  const onMouseMove = useCallback((e: RMouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const isDark = typeof document !== 'undefined' && document.body.classList.contains('theme-dark')

  return (
    <EditorCtx.Provider value={api}>
      <div
        ref={wrapRef}
        className={`fn-root fn-tool-${tool}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDownCapture={focusWrap}
        onMouseMove={onMouseMove}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onReconnect={onReconnect}
          isValidConnection={connectionOk}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionContextMenu={onSelectionContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onMoveStart={onMoveStart}
          onMove={onMove}
          onMoveEnd={onMoveEnd}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={44}
          defaultEdgeOptions={EDGE_DEFAULTS}
          // nós/arestas não recebem foco: o foco fica no canvas (atalhos e edição de texto estáveis)
          disableKeyboardA11y
          deleteKeyCode={null}
          // setinha: arrastar no vazio seleciona; mãozinha (H): arrastar move a tela.
          // Mover também com Espaço + arrastar, botão do meio ou roda/touchpad.
          selectionKeyCode={null}
          selectionOnDrag={!readOnly && tool === 'select'}
          panOnDrag={readOnly || tool === 'hand' ? true : PAN_BUTTONS}
          // seção selecionada não pula para cima dos blocos de dentro
          elevateNodesOnSelect={false}
          panActivationKeyCode="Space"
          multiSelectionKeyCode={MULTI_KEYS}
          zoomActivationKeyCode={ZOOM_KEYS}
          panOnScroll={!prefs.wheelZooms}
          zoomOnScroll={prefs.wheelZooms}
          selectionMode={SelectionMode.Partial}
          zoomOnDoubleClick={false}
          elementsSelectable={!readOnly && tool !== 'hand'}
          nodesDraggable={!readOnly && tool === 'select'}
          nodesConnectable={!readOnly && tool === 'select'}
          edgesReconnectable={!readOnly && tool === 'select'}
          snapToGrid
          snapGrid={SNAP}
          minZoom={0.1}
          maxZoom={3}
          fitView={!savedViewport && start.nodes.length > 0}
          fitViewOptions={FIT_OPTIONS}
          defaultViewport={savedViewport ?? START_VIEWPORT}
          colorMode={isDark ? 'dark' : 'light'}
          proOptions={PRO}
        >
          <DotsBackground />
        </ReactFlow>

        {!readOnly && tool === 'pen' && (
          <PenOverlay color={penColor} size={penSize} onStroke={addStroke} />
        )}

        {!readOnly && (
          <Palette
            panel={panel}
            setPanel={setPanel}
            tool={tool}
            setTool={setTool}
            items={itemHandlers}
            penColor={penColor}
            setPenColor={setPenColor}
            penSize={penSize}
            setPenSize={setPenSize}
          />
        )}

        {totals.length > 0 && <TotalPill text={totalsText} />}

        {/* casca fixa: entra/sai deslizando; trocar de elemento troca só o conteúdo */}
        {!readOnly && inspNode && (
          <div className={`fn-insp-shell${inspNodeLeaving ? ' is-leaving' : ''}`}>
            <NodeInspector
              key={inspNode.id}
              node={inspNode}
              update={updateNode}
              remove={deleteSelected}
              duplicate={duplicate}
              close={closeInspector}
              host={host}
              openNote={openNote}
              products={productOptions}
              lockSection={setSectionLock}
            />
          </div>
        )}
        {!readOnly && inspEdge && (
          <div className={`fn-insp-shell${inspEdgeLeaving ? ' is-leaving' : ''}`}>
            <EdgeInspector
              key={inspEdge.id}
              edge={inspEdge}
              update={updateEdge}
              remove={deleteSelected}
              close={closeInspector}
            />
          </div>
        )}

        <Controls
          undo={undo}
          redo={redo}
          canUndo={history.current.past.length > 0}
          canRedo={history.current.future.length > 0}
          hideHistory={readOnly}
        />

        {!readOnly && quick && (
          <QuickAdd
            x={quick.x}
            y={quick.y}
            placeholder={quick.from ? 'Adicionar e conectar...' : 'Nova etapa aqui...'}
            onPick={pickQuick}
            onClose={closeQuick}
          />
        )}

        {!readOnly && menuShown && (
          <ContextMenu
            key={`${menuShown.x},${menuShown.y}`}
            x={menuShown.x}
            y={menuShown.y}
            items={menuShown.items}
            onClose={closeMenu}
            leaving={menuLeaving}
          />
        )}

        {ghost && (
          <div
            ref={ghostRef}
            className="fn-drag-ghost"
            style={{ transform: `translate(${ghost.x}px, ${ghost.y}px)` }}
          >
            <DragPreview payload={ghost.payload} />
          </div>
        )}

        {nodes.length === 0 && (
          <div className="fn-empty">
            <div className="fn-empty-card">
              <div className="fn-empty-title">Funil vazio</div>
              <p>
                Arraste elementos da barra à esquerda, clique neles, ou use o botão direito no
                canvas. Puxe uma conexão de um nó para o vazio para criar o próximo passo.
              </p>
              {(host.pickTemplate || (host.templates && host.templates.length > 0)) && (
                <div className="fn-empty-actions">
                  <button
                    type="button"
                    className="fn-btn is-primary"
                    onClick={() => void chooseTemplate()}
                  >
                    <LayoutTemplate size={15} /> Escolher template
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </EditorCtx.Provider>
  )
}

/** Prévia que acompanha o cursor ao arrastar da barra lateral. */
function DragPreview({ payload }: { payload: DragPayload }) {
  if ('ref' in payload) {
    const item = getItem(payload.ref)
    if (!item) return null
    return (
      <div className={`fn-drag-ghost-inner${item.kind === 'page' ? ' is-page' : ''}`}>
        <ItemIcon item={item} size={52} />
        <span className="fn-drag-ghost-label">{item.label}</span>
      </div>
    )
  }
  const t = toolInfo(payload.tool)
  return (
    <div className="fn-drag-ghost-inner">
      <span className="fn-shape-icon">{t.icon}</span>
      <span className="fn-drag-ghost-label">{t.label}</span>
    </div>
  )
}

const TotalPill = memo(function TotalPill({ text }: { text: string }) {
  return (
    <div
      className="fn-total"
      title="Soma dos preços visíveis (com “Mostrar preço” ligado). Cada seção mostra a sua soma no canto."
    >
      <span>Ticket total</span>
      <strong>{text}</strong>
    </div>
  )
})

/**
 * Fundo pontilhado: uma camada própria que só é deslocada (transform) ao mover
 * o canvas — não repinta a cada quadro. Só repinta quando o zoom muda.
 */
function DotsBackground() {
  const { x, y, zoom } = useViewport()
  const gap = 20 * zoom
  const ox = (((x % gap) + gap) % gap) - gap
  const oy = (((y % gap) + gap) % gap) - gap
  return (
    <div
      className="fn-dots"
      style={{
        backgroundSize: `${gap}px ${gap}px`,
        transform: `translate3d(${ox}px, ${oy}px, 0)`,
        opacity: zoom < 0.35 ? 0 : 1,
      }}
    />
  )
}

const zoomPercent = (s: { transform: [number, number, number] }) => Math.round(s.transform[2] * 100)

const Controls = memo(function Controls({
  undo,
  redo,
  canUndo,
  canRedo,
  hideHistory = false,
}: {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  hideHistory?: boolean
}) {
  const rf = useReactFlow()
  const zoom = useStore(zoomPercent) // só re-renderiza quando o % muda
  return (
    <div className="fn-controls">
      {!hideHistory && (
        <>
          <button
            className="fn-icon-btn"
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            className="fn-icon-btn"
            onClick={redo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
        </>
      )}
      {!hideHistory && <span className="fn-ctl-sep" />}
      <button
        className="fn-icon-btn"
        onClick={() => rf.zoomOut({ duration: cameraMs(280), ease: easeOutCubic })}
        title="Diminuir zoom"
      >
        <Minus size={16} />
      </button>
      <button
        className="fn-zoom"
        onClick={() => rf.zoomTo(1, { duration: cameraMs(340), ease: easeInOutCubic })}
        title="Zoom 100%"
      >
        {zoom}%
      </button>
      <button
        className="fn-icon-btn"
        onClick={() => rf.zoomIn({ duration: cameraMs(280), ease: easeOutCubic })}
        title="Aumentar zoom"
      >
        <Plus size={16} />
      </button>
      <button
        className="fn-icon-btn"
        onClick={() => rf.fitView({ padding: 0.15, duration: cameraMs(480), ease: easeInOutCubic })}
        title="Ver tudo (Shift+1)"
      >
        <Maximize size={16} />
      </button>
    </div>
  )
})

/** Camada que captura o traço do lápis em coordenadas de tela. */
function PenOverlay({
  color,
  size,
  onStroke,
}: {
  color: string
  size: number
  onStroke: (pts: { x: number; y: number }[]) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pts, setPts] = useState<{ x: number; y: number }[] | null>(null)
  const ptsRef = useRef<{ x: number; y: number }[] | null>(null)
  const { zoom } = useViewport()
  const rect = () => ref.current!.getBoundingClientRect()
  const local =
    pts && ref.current ? pts.map((p) => ({ x: p.x - rect().left, y: p.y - rect().top })) : null
  return (
    <div
      ref={ref}
      className="fn-pen-layer"
      onPointerDown={(e) => {
        if (e.button !== 0) return
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        ptsRef.current = [{ x: e.clientX, y: e.clientY }]
        setPts(ptsRef.current)
      }}
      onPointerMove={(e) => {
        const cur = ptsRef.current
        if (!cur) return
        const last = cur[cur.length - 1]
        if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < 2) return
        ptsRef.current = [...cur, { x: e.clientX, y: e.clientY }]
        setPts(ptsRef.current)
      }}
      onPointerUp={() => {
        const cur = ptsRef.current
        ptsRef.current = null
        setPts(null)
        if (cur) onStroke(cur)
      }}
    >
      {local && (
        <svg className="fn-pen-live">
          <polyline
            points={local.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={color || 'var(--fn-ink)'}
            strokeWidth={size * zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

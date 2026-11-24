// Modelo do documento .funil e dos dados de cada tipo de nó.

export type NodeKind =
  | 'circle' // fonte de tráfego, evento, mensagem, integração
  | 'page' // página (mockup de navegador)
  | 'decision' // Se/ou (saídas Sim / Não)
  | 'orderbump'
  | 'note' // nota adesiva
  | 'shape'
  | 'text'
  | 'section' // seção com soma dos preços
  | 'drawing' // traço à mão livre
  | 'file' // arquivo enviado (imagem, PDF…)
  | 'product' // produto à venda (curso, mentoria, físico…) ou bundle

export type Currency = 'BRL' | 'USD' | 'EUR'
export type Billing = 'unica' | 'mensal' | 'anual'
export type ShapeType =
  | 'rect'
  | 'rounded'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'parallelogram'
  | 'arrow'
export type EdgeStyle = 'dashed' | 'animated' | 'solid'

/** Campos que qualquer nó pode ter. */
export interface BaseData {
  ref?: string // id do item do catálogo
  label?: string
  notes?: string
  url?: string
  color?: string
  showPrice?: boolean
  price?: number
  currency?: Currency
  billing?: Billing
  [key: string]: unknown
}

export interface PageData extends BaseData {
  button?: string
  buttonColor?: string
  format?: 'vsl' | 'tsl'
}

export interface NoteData extends BaseData {
  text?: string
}

export interface ShapeData extends BaseData {
  shape?: ShapeType
  text?: string
  fill?: string
  stroke?: string
  fontSize?: number
}

export interface TextData extends BaseData {
  text?: string
  fontSize?: number
  bold?: boolean
}

export interface DrawingData extends BaseData {
  points?: number[] // x,y achatados, relativos ao canto do nó
  w?: number
  h?: number
  size?: number
}

export interface EdgeData {
  label?: string
  style?: EdgeStyle
  color?: string
  arrow?: boolean
  /** Formato da linha (padrão: curva). */
  path?: 'curve' | 'straight' | 'step'
  /** Deslocamento do ponto de curvatura em relação ao meio da conexão. */
  bend?: { x: number; y: number }
  [key: string]: unknown
}

/** Formato gravado no arquivo .funil (JSON). */
export interface FunnelFile {
  type: 'funil'
  version: 1
  nodes: FileNode[]
  edges: FileEdge[]
}

export interface FileNode {
  id: string
  type: NodeKind
  x: number
  y: number
  w?: number
  h?: number
  data: BaseData
}

export interface FileEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  data?: EdgeData
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface ProductData extends BaseData {
  category?: string // select "Categoria"
  bundle?: boolean // bundle = oferta que junta vários produtos
  includes?: string[] // ids de nós de produto que fazem parte do bundle
  extras?: string[] // itens avulsos do bundle (texto livre)
}

export interface FileData extends BaseData {
  file?: string // referência do arquivo enviado
}

/** Preferências de navegação (configurações do plugin). */
// Arrastar no vazio segue a ferramenta: setinha seleciona, mãozinha move a tela.
export interface FunnelPrefs {
  /** Roda do mouse dá zoom. Se falso, a roda move o canvas e Ctrl + roda dá zoom. */
  wheelZooms: boolean
}

export const DEFAULT_PREFS: FunnelPrefs = { wheelZooms: false }

/** O que o app precisa do lugar onde roda. */
export interface FunnelHost {
  save(json: string): void
  notify(message: string): void
  openUrl(url: string): void
  openNote?(path: string, newTab: boolean): void
  noteExists?(path: string): boolean
  /** Nome legível de um arquivo vinculado. */
  displayName?(path: string): string
  /** Escolher e enviar um arquivo (imagem, PDF…); devolve a referência dele ou null. */
  pickFile?(): Promise<string | null>
  /** URL para exibir uma imagem enviada. */
  resourceUrl?(path: string): string | null
  /** Envia arquivos soltos no canvas (arrastados do computador); devolve as referências. */
  uploadFiles?(files: File[]): Promise<string[]>
  loadViewport?(): Viewport | null
  saveViewport?(vp: Viewport): void
  /** Lista de modelos disponíveis para começar um funil vazio. */
  templates?: { id: string; label: string; json: string }[]
  /** Abre o seletor de modelos da conta; devolve o JSON do modelo ou null. */
  pickTemplate?(): Promise<string | null>
}

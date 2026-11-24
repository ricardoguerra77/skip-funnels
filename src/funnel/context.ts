import { createContext, useContext } from 'react'
import type { BaseData, EdgeData, FunnelHost } from './types'

/** API estável que os nós usam (o valor só muda quando `editRequest` muda). */
export interface EditorApi {
  host: FunnelHost
  /** Altera dados de um nó (com passo de desfazer agrupado por `key`). */
  update(id: string, patch: Partial<BaseData>, key?: string): void
  /** Mesmo que `update`, para conexões (ex.: arrastar a curvatura). */
  updateEdge(id: string, patch: Partial<EdgeData>, key?: string): void
  /** Marca um passo de desfazer antes de uma mudança feita pelo React Flow (ex.: redimensionar). */
  checkpoint(key?: string): void
  openNote(path: string, newTab?: boolean): void
  /** Trava/destrava uma seção; `select` seleciona ao destravar (para já poder mexer). */
  setSectionLock(id: string, locked: boolean, select?: boolean): void
  /** Id do nó cujo texto deve entrar em edição assim que montar. */
  editRequest: string | null
  clearEditRequest(): void
}

export const EditorCtx = createContext<EditorApi | null>(null)

export function useEditor(): EditorApi {
  const ctx = useContext(EditorCtx)
  if (!ctx) throw new Error('EditorCtx ausente')
  return ctx
}

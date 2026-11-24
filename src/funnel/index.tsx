import '@xyflow/react/dist/base.css'
import './styles.css'
import './theme.css'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import { parseFile } from './doc'
import { Editor, type EditorHandle } from './Editor'
import { DEFAULT_PREFS, type FunnelHost, type FunnelPrefs } from './types'

export type { EditorHandle } from './Editor'
export type { FunnelHost, FunnelPrefs, Viewport } from './types'
export { DEFAULT_PREFS } from './types'
export { TEMPLATES, webinarTemplate } from './templates'
export { funnelThumbnail } from './thumb'
export { fileStats, formatMoney, parseFile, serialize, emptyFile } from './doc'

function ErrorView({ message }: { message: string }) {
  return (
    <div className="fn-root fn-error">
      <div className="fn-empty-card">
        <div className="fn-empty-title">Não deu para abrir este funil</div>
        <p>O conteúdo salvo não é um JSON de funil válido. Nada foi alterado nele.</p>
        <code>{message}</code>
      </div>
    </div>
  )
}

/** Editor de um funil. Monte com `key` diferente para trocar de funil. */
export function FunnelEditor({
  text,
  host,
  prefs = DEFAULT_PREFS,
  readOnly = false,
  onReady,
}: {
  text: string
  host: FunnelHost
  prefs?: FunnelPrefs
  readOnly?: boolean
  onReady: (h: EditorHandle) => void
}) {
  const parsed = useMemo(() => {
    try {
      return { file: parseFile(text), error: null }
    } catch (err) {
      return { file: null, error: String((err as Error)?.message ?? err) }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!parsed.file) return <ErrorView message={parsed.error ?? ''} />
  return (
    <ReactFlowProvider>
      <Editor
        initial={parsed.file}
        host={host}
        prefs={prefs}
        readOnly={readOnly}
        onReady={onReady}
      />
    </ReactFlowProvider>
  )
}

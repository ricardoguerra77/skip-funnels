import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getNote, updateNote } from '@/services/notes'

type Status = 'loading' | 'saved' | 'pending' | 'saving' | 'error' | 'missing'

const STATUS_TEXT: Record<Status, string> = {
  loading: 'Carregando...',
  saved: 'Salvo',
  pending: 'Editando...',
  saving: 'Salvando...',
  error: 'Erro ao salvar',
  missing: 'Nota não encontrada',
}

/** Nota vinculada a um elemento do funil: título + texto livre, salva sozinha. */
export function NoteEditorDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const dirty = useRef<{ title?: string; body?: string }>({})
  const timer = useRef(0)

  useEffect(() => {
    getNote(id)
      .then((n) => {
        setTitle(n.title)
        setBody(n.body)
        setStatus('saved')
      })
      .catch(() => setStatus('missing'))
  }, [id])

  const save = useCallback(async () => {
    window.clearTimeout(timer.current)
    const patch = dirty.current
    if (!Object.keys(patch).length) return
    dirty.current = {}
    if (patch.title !== undefined && !patch.title.trim()) patch.title = 'Sem título'
    setStatus('saving')
    try {
      await updateNote(id, patch)
      setStatus(Object.keys(dirty.current).length ? 'pending' : 'saved')
    } catch (err) {
      dirty.current = { ...patch, ...dirty.current }
      setStatus('error')
      toast.error(getErrorMessage(err))
    }
  }, [id])

  const change = (patch: { title?: string; body?: string }) => {
    dirty.current = { ...dirty.current, ...patch }
    setStatus('pending')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void save(), 700)
  }

  const close = () => {
    void save()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Nota</DialogTitle>
          <DialogDescription className="text-xs">{STATUS_TEXT[status]}</DialogDescription>
        </DialogHeader>
        {status === 'missing' ? (
          <p className="text-sm text-muted-foreground">
            Esta nota foi excluída. Desvincule-a no painel do elemento.
          </p>
        ) : (
          <div className="grid gap-3">
            <Input
              className="text-lg font-semibold"
              value={title}
              disabled={status === 'loading'}
              placeholder="Título da nota"
              onChange={(e) => {
                setTitle(e.target.value)
                change({ title: e.target.value })
              }}
            />
            <Textarea
              className="min-h-[340px] resize-y leading-relaxed"
              value={body}
              disabled={status === 'loading'}
              placeholder="Roteiro, copy, ideias, checklist..."
              onChange={(e) => {
                setBody(e.target.value)
                change({ body: e.target.value })
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

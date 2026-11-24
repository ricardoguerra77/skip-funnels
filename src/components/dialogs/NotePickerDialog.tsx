import { useEffect, useMemo, useState } from 'react'
import { NotebookPen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { createNote, listNotes, type NoteRecord } from '@/services/notes'

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Escolher uma nota existente ou criar uma nova com o texto digitado. */
export function NotePickerDialog({ onDone }: { onDone: (id: string | null) => void }) {
  const [notes, setNotes] = useState<NoteRecord[] | null>(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listNotes()
      .then(setNotes)
      .catch((err) => {
        toast.error(getErrorMessage(err))
        setNotes([])
      })
  }, [])

  const shown = useMemo(() => {
    const q = norm(query.trim())
    return (notes ?? []).filter((n) => !q || norm(n.title).includes(q))
  }, [notes, query])

  const create = async () => {
    const title = query.trim() || 'Nova nota'
    setBusy(true)
    try {
      const rec = await createNote(title)
      onDone(rec.id)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular a qual nota?</DialogTitle>
          <DialogDescription>Escolha uma nota sua ou crie uma nova.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Buscar ou dar nome a uma nota nova..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (shown.length && query.trim() && norm(shown[0].title) === norm(query.trim()))
                onDone(shown[0].id)
              else void create()
            }
          }}
        />
        <div className="max-h-72 overflow-y-auto -mx-2">
          {notes === null && (
            <p className="px-2 py-3 text-sm text-muted-foreground">Carregando notas...</p>
          )}
          {notes !== null && shown.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              {notes.length ? 'Nenhuma nota com esse nome.' : 'Você ainda não tem notas.'}
            </p>
          )}
          {shown.map((n) => (
            <button
              key={n.id}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => onDone(n.id)}
            >
              <NotebookPen className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{n.title}</span>
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => void create()} disabled={busy}>
          <Plus /> Criar nota {query.trim() ? `“${query.trim()}”` : ''}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

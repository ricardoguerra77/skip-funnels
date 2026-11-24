import { useCallback, useEffect, useState } from 'react'
import { Copy, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  createMcpToken,
  listMcpTokens,
  revokeMcpToken,
  type CreatedToken,
  type McpTokenRecord,
} from '@/services/mcp'
import { copyText } from './McpCodeBlock'

const fmt = (s: string) => (s ? new Date(s.replace(' ', 'T')).toLocaleString('pt-BR') : '')

/** Seção de tokens: criar, ver uma única vez, regenerar e revogar. */
export function McpTokens({ onToken }: { onToken: (token: string | null) => void }) {
  const [tokens, setTokens] = useState<McpTokenRecord[] | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [revealed, setRevealed] = useState<CreatedToken | null>(null)
  const [revoking, setRevoking] = useState<McpTokenRecord | null>(null)

  const load = useCallback(async () => {
    try {
      setTokens(await listMcpTokens())
    } catch (err) {
      toast.error(getErrorMessage(err))
      setTokens([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const reveal = (created: CreatedToken) => {
    setRevealed(created)
    onToken(created.token)
  }

  const dismiss = () => {
    setRevealed(null)
    onToken(null)
  }

  const create = async () => {
    const clean = name.trim()
    if (!clean) {
      toast.error('Dê um nome ao token')
      return
    }
    setBusy(true)
    try {
      const created = await createMcpToken(clean)
      setName('')
      reveal(created)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // cria o novo antes de revogar o antigo: se a criação falhar, o acesso atual continua
  const regenerate = async (t: McpTokenRecord) => {
    setBusy(true)
    try {
      const created = await createMcpToken(t.name)
      await revokeMcpToken(t.id)
      reveal(created)
      toast.success('Token regenerado. O anterior foi revogado.')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const confirmRevoke = async () => {
    if (!revoking) return
    try {
      await revokeMcpToken(revoking.id)
      toast.success('Token revogado')
      setRevoking(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Nome do token (ex.: Claude Code no notebook)"
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void create()
          }}
        />
        <Button disabled={busy} onClick={() => void create()}>
          Criar token
        </Button>
      </div>

      {revealed && (
        <div className="grid gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm font-medium">Token “{revealed.name}”</p>
          <p className="text-xs text-muted-foreground">
            Copie agora. Este token não aparece de novo: se perder, gere outro.
          </p>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
              {revealed.token}
            </code>
            <Button size="sm" onClick={() => copyText(revealed.token)}>
              <Copy /> Copiar
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="justify-self-start" onClick={dismiss}>
            Já copiei
          </Button>
        </div>
      )}

      {tokens === null ? (
        <p className="text-sm text-muted-foreground">Carregando tokens…</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum token ainda.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  <code>{t.token_prefix}…</code> · Criado em {fmt(t.created)} ·{' '}
                  {t.last_used_at ? `Último uso ${fmt(t.last_used_at)}` : 'Nunca usado'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void regenerate(t)}
                >
                  <RefreshCw /> Regenerar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRevoking(t)}
                >
                  <Trash2 /> Revogar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar “{revoking?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Quem usa este token perde o acesso imediatamente. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRevoke()}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

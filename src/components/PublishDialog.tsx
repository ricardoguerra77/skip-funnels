import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { LoadingBlock } from '@/components/LoadingBlock'
import {
  newShareToken,
  updateFunnel,
  type FunnelRecord,
  type FunnelVisibility,
} from '@/services/funnels'
import {
  ROLE_LABEL,
  ensureMyTeam,
  listMembers,
  syncRoster,
  type MemberRecord,
  type TeamRole,
} from '@/services/teams'

type Choice = 'none' | 'view' | 'edit'

const VISIBILITY: { value: FunnelVisibility; title: string; hint: string }[] = [
  { value: 'private', title: 'Não publicado', hint: 'Só você abre este funil.' },
  {
    value: 'public',
    title: 'Público',
    hint: 'Qualquer pessoa com o link vê, sem precisar entrar. Ninguém edita.',
  },
  {
    value: 'team',
    title: 'Time',
    hint: 'Só as pessoas marcadas abaixo entram com o link. Quem pode editar também abre o editor.',
  },
]

export function PublishDialog({
  funnel,
  onClose,
  onSaved,
}: {
  funnel: FunnelRecord
  onClose: () => void
  onSaved: (next: FunnelRecord) => void
}) {
  const [visibility, setVisibility] = useState<FunnelVisibility>(
    funnel.visibility === 'public' || funnel.visibility === 'team' ? funnel.visibility : 'private',
  )
  const [token, setToken] = useState(funnel.share_token ?? '')
  const [members, setMembers] = useState<MemberRecord[] | null>(null)
  const [choice, setChoice] = useState<Record<string, Choice>>({})
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensureMyTeam()
      .then(async (team) => {
        const list = await listMembers(team.id)
        await syncRoster(team, list).catch(() => undefined)
        if (cancelled) return
        setMembers(list)
        const next: Record<string, Choice> = {}
        for (const member of list) {
          if (!member.user) continue
          if ((funnel.editors ?? []).includes(member.user)) next[member.id] = 'edit'
          else if ((funnel.viewers ?? []).includes(member.user)) next[member.id] = 'view'
          else next[member.id] = 'none'
        }
        setChoice(next)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getErrorMessage(err))
          setMembers([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [funnel.editors, funnel.viewers])

  const link = token ? `${window.location.origin}/v/${token}` : ''

  const save = async () => {
    setBusy(true)
    try {
      const share = visibility === 'private' ? token : token || newShareToken()
      const active = (members ?? []).filter((m) => m.status === 'active' && m.user)
      const viewers: string[] = []
      const editors: string[] = []
      if (visibility === 'team') {
        for (const member of active) {
          const picked = choice[member.id] ?? 'none'
          if (picked === 'none') continue
          const capped = picked === 'edit' && member.role === 'viewer' ? 'view' : picked
          if (capped === 'edit') editors.push(member.user)
          else viewers.push(member.user)
        }
      }
      const next = await updateFunnel(funnel.id, {
        visibility,
        share_token: share,
        viewers,
        editors,
      })
      setToken(next.share_token ?? share)
      onSaved(next)
      toast.success(visibility === 'private' ? 'Funil despublicado.' : 'Publicação atualizada.')
      if (visibility === 'private') onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publicar funil</DialogTitle>
          <DialogDescription>
            O link abre uma visualização, sem a barra de edição. Quem pode editar também encontra o
            funil na galeria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {VISIBILITY.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                visibility === option.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input
                type="radio"
                className="mt-1"
                checked={visibility === option.value}
                onChange={() => setVisibility(option.value)}
              />
              <span>
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {visibility === 'team' && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Quem do time</p>
              <Link
                to="/time"
                className="text-xs font-medium text-primary hover:underline"
                onClick={onClose}
              >
                Gerenciar time
              </Link>
            </div>
            {members === null ? (
              <LoadingBlock variant="rows" label="Carregando pessoas do time" />
            ) : members.filter((m) => m.status === 'active' && m.user).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ninguém ativo no time ainda. Convide pessoas em Time; o convite vale quando elas
                entram com o mesmo e-mail.
              </p>
            ) : (
              <ul className="grid max-h-56 gap-2 overflow-auto">
                {members
                  .filter((m) => m.status === 'active' && m.user)
                  .map((member) => (
                    <li key={member.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{member.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_LABEL[member.role as TeamRole]}
                        </span>
                      </span>
                      <select
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                        value={choice[member.id] ?? 'none'}
                        onChange={(e) =>
                          setChoice((current) => ({
                            ...current,
                            [member.id]: e.target.value as Choice,
                          }))
                        }
                      >
                        <option value="none">Sem acesso</option>
                        <option value="view">Ver</option>
                        <option value="edit" disabled={member.role === 'viewer'}>
                          Editar
                        </option>
                      </select>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {visibility !== 'private' && link && (
          <div className="flex gap-2">
            <input
              readOnly
              className="h-9 min-w-0 flex-1 rounded-md border bg-muted px-2 text-xs"
              value={link}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setToken(newShareToken())}
            >
              Novo link
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void save()} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

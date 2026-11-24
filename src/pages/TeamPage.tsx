import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingBlock } from '@/components/LoadingBlock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import {
  ROLE_LABEL,
  acceptInvites,
  ensureMyTeam,
  inviteMember,
  listMembers,
  listMyMemberships,
  listMyTeams,
  removeMember,
  syncRoster,
  updateMember,
  updateTeam,
  type MemberRecord,
  type TeamRecord,
  type TeamRole,
} from '@/services/teams'

const ROLES: TeamRole[] = ['viewer', 'editor', 'admin']

export default function TeamPage() {
  const me = pb.authStore.record?.id ?? ''
  const [team, setTeam] = useState<TeamRecord | null>(null)
  const [name, setName] = useState('')
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('viewer')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await acceptInvites()
      const mine = await listMyTeams()
      let owned = mine.find((item) => item.owner === me) ?? null
      const memberships = await listMyMemberships()
      if (!owned && memberships.length === 0) owned = await ensureMyTeam()
      if (owned) {
        const synced = await syncRoster(owned, await listMembers(owned.id))
        setTeam(synced)
        setMembers(await listMembers(owned.id))
        setName(synced.name)
      } else {
        setTeam(null)
        setMembers(memberships)
        setName('')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createOwn = async () => {
    try {
      const created = await ensureMyTeam()
      setTeam(created)
      setName(created.name)
      setMembers([])
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const isOwner = team?.owner === me
  const isManager = !!team && (team.managers ?? []).includes(me)
  const canInvite = isOwner || isManager

  const saveName = async () => {
    if (!team || !isOwner) return
    const next = name.trim()
    if (!next || next === team.name) {
      setName(team.name)
      return
    }
    try {
      const updated = await updateTeam(team.id, { name: next })
      setTeam(updated)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setName(team.name)
    }
  }

  const invite = async () => {
    if (!team) return
    const value = email.trim().toLowerCase()
    if (!value.includes('@')) {
      toast.error('Digite um e-mail válido.')
      return
    }
    if (members.some((m) => m.email === value)) {
      toast.error('Esse e-mail já está no time.')
      return
    }
    try {
      await inviteMember(team.id, value, isOwner ? role : role === 'admin' ? 'editor' : role)
      setEmail('')
      toast.success('Convite criado. Vale quando a pessoa entrar com esse e-mail.')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const changeRole = async (member: MemberRecord, next: TeamRole) => {
    if (!team) return
    try {
      await updateMember(member, { role: next })
      const list = members.map((m) => (m.id === member.id ? { ...m, role: next } : m))
      setMembers(list)
      const synced = await syncRoster(team, list)
      setTeam(synced)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const remove = async (member: MemberRecord) => {
    if (!team) return
    try {
      await removeMember(member.id)
      const list = members.filter((m) => m.id !== member.id)
      setMembers(list)
      const synced = await syncRoster(team, list)
      setTeam(synced)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
      <h1 className="text-lg font-semibold">Time</h1>
      {loading ? (
        <LoadingBlock variant="list" label="Carregando time" />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : team ? (
        <>
          <section className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="team-name">
              Nome do time
            </label>
            <Input
              id="team-name"
              value={name}
              disabled={!isOwner}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => void saveName()}
            />
            <p className="text-sm text-muted-foreground">
              Quem você convida entra no time ao fazer login com o mesmo e-mail. Na publicação de um
              funil, você escolhe quem só vê e quem pode editar. “Pode ver” não pode receber edição.
              “Administra o time” também convida e remove quem não administra.
            </p>
          </section>

          {canInvite && (
            <section className="grid gap-3 rounded-xl border p-4">
              <h2 className="text-sm font-semibold">Convidar</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void invite()
                  }}
                />
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                >
                  {ROLES.filter((item) => isOwner || item !== 'admin').map((item) => (
                    <option key={item} value={item}>
                      {ROLE_LABEL[item]}
                    </option>
                  ))}
                </select>
                <Button onClick={() => void invite()}>Convidar</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O app não envia e-mail. Passe o endereço do Funis para a pessoa criar a conta ou
                entrar com esse e-mail.
              </p>
            </section>
          )}

          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">Pessoas</h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém além de você.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {members.map((member) => {
                  const locked = !isOwner && (member.role === 'admin' || !canInvite)
                  return (
                    <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.status === 'active' ? 'No time' : 'Aguardando entrar'}
                        </p>
                      </div>
                      <select
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                        disabled={locked}
                        value={member.role}
                        onChange={(e) => void changeRole(member, e.target.value as TeamRole)}
                      >
                        {ROLES.map((item) => (
                          <option key={item} value={item} disabled={!isOwner && item === 'admin'}>
                            {ROLE_LABEL[item]}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={locked}
                        title="Remover"
                        onClick={() => void remove(member)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Você participa de um time, mas ainda não administra o seu. Quem publicou cada funil
            escolhe se você vê ou edita.
          </p>
          {members.length > 0 && (
            <ul className="divide-y rounded-xl border">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="truncate">{member.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABEL[member.role]} ·{' '}
                    {member.status === 'active' ? 'No time' : 'Aguardando entrar'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button className="w-fit" onClick={() => void createOwn()}>
            Criar meu time
          </Button>
        </section>
      )}
    </div>
  )
}

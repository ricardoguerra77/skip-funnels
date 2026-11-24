import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { request, write } from '@/lib/pocketbase/request'

export type TeamRole = 'viewer' | 'editor' | 'admin'
export type MemberStatus = 'pending' | 'active'

export const ROLE_LABEL: Record<TeamRole, string> = {
  viewer: 'Pode ver',
  editor: 'Pode editar',
  admin: 'Administra o time',
}

export interface TeamRecord extends RecordModel {
  owner: string
  name: string
  members: string[]
  managers: string[]
}

export interface MemberRecord extends RecordModel {
  team: string
  email: string
  user: string
  role: TeamRole
  status: MemberStatus
}

const userId = () => pb.authStore.record?.id ?? ''
const myEmail = () => String(pb.authStore.record?.email ?? '').toLowerCase()

export const listMyTeams = () =>
  request('teams:mine', () => pb.collection<TeamRecord>('teams').getFullList({ sort: 'name' }))

export const ensureMyTeam = async () => {
  const id = userId()
  const mine = await request('teams:owned', () =>
    pb.collection<TeamRecord>('teams').getFullList({
      filter: pb.filter('owner = {:id}', { id }),
      sort: 'created',
    }),
  )
  if (mine[0]) return mine[0]
  return write(() =>
    pb.collection<TeamRecord>('teams').create({
      owner: id,
      name: 'Meu time',
      members: [],
      managers: [],
    }),
  )
}

export const updateTeam = (
  id: string,
  data: Partial<Pick<TeamRecord, 'name' | 'members' | 'managers'>>,
) => write(() => pb.collection<TeamRecord>('teams').update(id, data))

export const listMembers = (teamId: string) =>
  request(`team_members:${teamId}`, () =>
    pb.collection<MemberRecord>('team_members').getFullList({
      filter: pb.filter('team = {:team}', { team: teamId }),
      sort: 'created',
    }),
  )

export const listMyMemberships = () =>
  request('team_members:mine', () =>
    pb.collection<MemberRecord>('team_members').getFullList({
      filter: pb.filter('user = {:id} || email = {:email}', { id: userId(), email: myEmail() }),
      sort: 'created',
    }),
  )

export const inviteMember = (teamId: string, email: string, role: TeamRole) =>
  write(() =>
    pb.collection<MemberRecord>('team_members').create({
      team: teamId,
      email: email.trim().toLowerCase(),
      role,
      status: 'pending',
      user: '',
    }),
  )

export const updateMember = (
  member: MemberRecord,
  data: Partial<Pick<MemberRecord, 'role' | 'status' | 'user'>>,
) =>
  write(() =>
    pb.collection<MemberRecord>('team_members').update(member.id, {
      team: member.team,
      email: member.email,
      user: data.user ?? member.user ?? '',
      role: data.role ?? member.role,
      status: data.status ?? member.status,
    }),
  )

export const removeMember = (id: string) => write(() => pb.collection('team_members').delete(id))

/** Convites para o e-mail logado passam a valer sozinhos. */
export async function acceptInvites() {
  const email = myEmail()
  const id = userId()
  if (!email || !id) return
  const pending = await pb.collection<MemberRecord>('team_members').getFullList({
    filter: pb.filter('email = {:email} && status = "pending"', { email }),
  })
  for (const member of pending) {
    await pb.collection('team_members').update(member.id, {
      team: member.team,
      email: member.email,
      role: member.role,
      user: id,
      status: 'active',
    })
  }
}

/** O dono espelha quem está ativo nas relações que as regras de acesso usam. */
export async function syncRoster(team: TeamRecord, members: MemberRecord[]) {
  if (team.owner !== userId()) return team
  const active = members.filter((m) => m.status === 'active' && m.user)
  const memberIds = active.map((m) => m.user)
  const managerIds = active.filter((m) => m.role === 'admin').map((m) => m.user)
  const same = (a: string[] = [], b: string[]) =>
    a.length === b.length && a.every((id) => b.includes(id))
  if (same(team.members, memberIds) && same(team.managers, managerIds)) return team
  return updateTeam(team.id, { members: memberIds, managers: managerIds })
}

import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { request, write } from '@/lib/pocketbase/request'

export type FunnelVisibility = '' | 'private' | 'public' | 'team'

export interface FunnelRecord extends RecordModel {
  owner: string
  name: string
  content: string
  is_template: boolean
  visibility?: FunnelVisibility
  share_token?: string
  viewers?: string[]
  editors?: string[]
  folder?: string
  created: string
  updated: string
}

export interface BodyRecord extends RecordModel {
  funnel: string
  name: string
  content: string
}

const userId = () => pb.authStore.record?.id ?? ''
const TOKEN = /^[a-zA-Z0-9]{16,40}$/

export type FunnelAccess = 'owner' | 'edit' | 'view' | 'none'

export function funnelAccess(funnel: FunnelRecord, uid = userId()): FunnelAccess {
  if (funnel.owner === uid) return 'owner'
  if (funnel.visibility === 'team' && (funnel.editors ?? []).includes(uid)) return 'edit'
  if (funnel.visibility === 'team' && (funnel.viewers ?? []).includes(uid)) return 'view'
  return 'none'
}

export function newShareToken() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(22)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

const applyBody = (funnel: FunnelRecord, body?: BodyRecord | null): FunnelRecord =>
  body ? { ...funnel, name: body.name, content: body.content ?? '' } : funnel

async function bodiesByFunnel(): Promise<Map<string, BodyRecord>> {
  const list = await request('funnel_bodies:list', () =>
    pb.collection<BodyRecord>('funnel_bodies').getFullList({ sort: '-updated' }),
  )
  const map = new Map<string, BodyRecord>()
  for (const body of list) if (!map.has(body.funnel)) map.set(body.funnel, body)
  return map
}

async function findBody(funnelId: string, share?: string): Promise<BodyRecord | null> {
  if (share) {
    const query = new URLSearchParams({
      page: '1',
      perPage: '1',
      skipTotal: '1',
      filter: `funnel="${funnelId}"`,
      share,
    })
    const res = await request(`funnel_bodies:share:${funnelId}`, () =>
      pb.send(`/api/collections/funnel_bodies/records?${query}`, { method: 'GET' }),
    )
    return ((res as { items?: BodyRecord[] }).items ?? [])[0] ?? null
  }
  const page = await request(`funnel_bodies:${funnelId}`, () =>
    pb.collection<BodyRecord>('funnel_bodies').getList(1, 1, {
      filter: pb.filter('funnel = {:id}', { id: funnelId }),
    }),
  )
  return page.items[0] ?? null
}

async function upsertBody(funnel: FunnelRecord, patch: { name?: string; content?: string }) {
  const existing = await findBody(funnel.id).catch(() => null)
  if (existing) {
    await write(() =>
      pb.collection('funnel_bodies').update(existing.id, {
        funnel: funnel.id,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.content !== undefined ? { content: patch.content } : {}),
      }),
    )
    return
  }
  await write(() =>
    pb.collection('funnel_bodies').create({
      funnel: funnel.id,
      name: patch.name ?? funnel.name,
      content: patch.content ?? funnel.content ?? '',
    }),
  )
}

export const listFunnels = async () => {
  const funnels = await request('funnels:list', () =>
    pb.collection<FunnelRecord>('funnels').getFullList({ sort: '-updated' }),
  )
  const bodies = await bodiesByFunnel().catch(() => new Map<string, BodyRecord>())
  return funnels.map((funnel) => applyBody(funnel, bodies.get(funnel.id)))
}

export const listTemplates = async () => {
  const funnels = await request('funnels:templates', () =>
    pb.collection<FunnelRecord>('funnels').getFullList({
      filter: pb.filter('is_template = true'),
      sort: 'name',
    }),
  )
  const bodies = await bodiesByFunnel().catch(() => new Map<string, BodyRecord>())
  return funnels.map((funnel) => applyBody(funnel, bodies.get(funnel.id)))
}

export const getFunnel = async (id: string) => {
  const funnel = await request(`funnels:${id}`, () =>
    pb.collection<FunnelRecord>('funnels').getOne(id),
  )
  const body = await findBody(id).catch(() => null)
  return applyBody(funnel, body)
}

/** Funil publicado, achado pelo token do link. O pedido manda o token também na query `share`. */
export async function getSharedFunnel(token: string): Promise<FunnelRecord | null> {
  if (!TOKEN.test(token)) return null
  const query = new URLSearchParams({
    page: '1',
    perPage: '1',
    skipTotal: '1',
    filter: `share_token="${token}"`,
    share: token,
  })
  const res = await request(`funnels:share:${token}`, () =>
    pb.send(`/api/collections/funnels/records?${query}`, { method: 'GET' }),
  )
  const funnel = ((res as { items?: FunnelRecord[] }).items ?? [])[0]
  if (!funnel) return null
  const body = await findBody(funnel.id, token).catch(() => null)
  return applyBody(funnel, body)
}

export const createFunnel = async (data: {
  name: string
  content: string
  is_template?: boolean
}) => {
  const created = await write(() =>
    pb.collection<FunnelRecord>('funnels').create({
      owner: userId(),
      name: data.name,
      content: data.content,
      is_template: !!data.is_template,
    }),
  )
  await upsertBody(created, { name: data.name, content: data.content }).catch(() => undefined)
  return created
}

export const updateFunnel = async (
  id: string,
  data: Partial<
    Pick<
      FunnelRecord,
      | 'name'
      | 'content'
      | 'is_template'
      | 'visibility'
      | 'share_token'
      | 'viewers'
      | 'editors'
      | 'folder'
    >
  >,
) => {
  const current = await pb.collection<FunnelRecord>('funnels').getOne(id)
  const access = funnelAccess(current)
  const hasText = data.name !== undefined || data.content !== undefined
  if (hasText) {
    await upsertBody(current, data)
    if (access === 'owner') {
      const text: { name?: string; content?: string } = {}
      if (data.name !== undefined) text.name = data.name
      if (data.content !== undefined) text.content = data.content
      await write(() => pb.collection('funnels').update(id, text))
    }
  }
  const share: Record<string, unknown> = {}
  if (data.is_template !== undefined) share.is_template = data.is_template
  if (data.visibility !== undefined) share.visibility = data.visibility
  if (data.share_token !== undefined) share.share_token = data.share_token
  if (data.viewers !== undefined) share.viewers = data.viewers
  if (data.editors !== undefined) share.editors = data.editors
  if (data.folder !== undefined) share.folder = data.folder
  if (Object.keys(share).length) {
    if (access !== 'owner') throw new Error('Só quem criou o funil pode alterar a publicação.')
    await write(() => pb.collection('funnels').update(id, share))
  }
  return getFunnel(id)
}

export const deleteFunnel = (id: string) => write(() => pb.collection('funnels').delete(id))

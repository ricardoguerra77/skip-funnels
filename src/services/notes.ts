import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { request, write } from '@/lib/pocketbase/request'

export interface NoteRecord extends RecordModel {
  owner: string
  title: string
  body: string
  created: string
  updated: string
}

const userId = () => pb.authStore.record?.id ?? ''

export const listNotes = () =>
  request('notes:list', () =>
    pb.collection<NoteRecord>('notes').getFullList({
      filter: pb.filter('owner = {:owner}', { owner: userId() }),
      sort: '-updated',
      fields: 'id,title,updated',
    }),
  )

export const getNote = (id: string) =>
  request(`notes:${id}`, () => pb.collection<NoteRecord>('notes').getOne(id))

export const createNote = (title: string, body = '') =>
  write(() => pb.collection<NoteRecord>('notes').create({ owner: userId(), title, body }))

export const updateNote = (id: string, data: Partial<Pick<NoteRecord, 'title' | 'body'>>) =>
  write(() => pb.collection<NoteRecord>('notes').update(id, data))

export const deleteNote = (id: string) => write(() => pb.collection('notes').delete(id))

import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { request, write } from '@/lib/pocketbase/request'

export interface FolderRecord extends RecordModel {
  owner: string
  name: string
  created: string
  updated: string
}

const userId = () => pb.authStore.record?.id ?? ''

export const listFolders = () =>
  request('folders:list', () =>
    pb.collection<FolderRecord>('folders').getFullList({ sort: 'name' }),
  )

export const createFolder = (name: string) =>
  write(() => pb.collection<FolderRecord>('folders').create({ owner: userId(), name }))

export const renameFolder = (id: string, name: string) =>
  write(() => pb.collection('folders').update(id, { name }))

export const deleteFolder = (id: string) => write(() => pb.collection('folders').delete(id))

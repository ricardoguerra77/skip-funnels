import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { request, write } from '@/lib/pocketbase/request'

export interface AssetRecord extends RecordModel {
  owner: string
  file: string
  name: string
  created: string
  updated: string
}

const userId = () => pb.authStore.record?.id ?? ''

export const listAssets = () =>
  request('assets:list', () =>
    pb.collection<AssetRecord>('assets').getFullList({
      filter: pb.filter('owner = {:owner}', { owner: userId() }),
      fields: 'id,collectionId,collectionName,file,name',
    }),
  )

export const uploadAsset = (file: File) => {
  const form = new FormData()
  form.append('owner', userId())
  form.append('name', file.name)
  form.append('file', file)
  return write(() => pb.collection<AssetRecord>('assets').create(form))
}

export const assetUrl = (record: AssetRecord) => pb.files.getURL(record, record.file)

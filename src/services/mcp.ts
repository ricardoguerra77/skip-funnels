import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { request, write } from '@/lib/pocketbase/request'

export interface McpTokenRecord extends RecordModel {
  name: string
  token_prefix: string
  last_used_at: string
}

/** Resposta de POST /backend/v1/mcp-tokens: o token completo vem só aqui, uma vez. */
export interface CreatedToken {
  id: string
  name: string
  token: string
}

export const MCP_PATH = '/backend/v1/mcp'

/** URL pública do servidor MCP (backend + caminho). */
export const mcpUrl = () => `${pb.baseURL.replace(/\/$/, '')}${MCP_PATH}`

export const listMcpTokens = () =>
  request('mcp_tokens:mine', () =>
    pb.collection<McpTokenRecord>('mcp_tokens').getFullList({ sort: '-created' }),
  )

export const createMcpToken = (name: string) =>
  write(() => pb.send<CreatedToken>('/backend/v1/mcp-tokens', { method: 'POST', body: { name } }))

export const revokeMcpToken = (id: string) => write(() => pb.collection('mcp_tokens').delete(id))

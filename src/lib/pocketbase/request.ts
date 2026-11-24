import { ClientResponseError } from 'pocketbase'

const MAX_RETRIES = 3
const inFlight = new Map<string, Promise<unknown>>()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class BusyError extends Error {}
/** A write failed on the network: the server may already have saved it. Never retried automatically. */
export class UncertainWriteError extends Error {}

const statusOf = (err: unknown) =>
  err instanceof ClientResponseError && !err.isAbort ? err.status : undefined

const backoffMs = (attempt: number) =>
  Math.min(30_000, 1_000 * 2 ** attempt) * (0.5 + Math.random() / 2)

async function withBackoff<T>(call: () => Promise<T>, retryOn: number[]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call()
    } catch (err) {
      const status = statusOf(err)
      if (status === undefined || !retryOn.includes(status)) throw err
      if (attempt >= MAX_RETRIES)
        throw new BusyError('Servidor ocupado. Tente de novo em instantes.')
      await sleep(backoffMs(attempt))
    }
  }
}

/** READS only: one request per `key` in flight; backs off on 429/503/network. */
export function request<T>(key: string, call: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key)
  if (pending) return pending as Promise<T>
  const run = withBackoff(call, [0, 429, 503]).finally(() => inFlight.delete(key))
  inFlight.set(key, run)
  return run
}

/** WRITES: no dedup; retries only explicit 429/503. Network error: it may already be saved. */
export async function write<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await withBackoff(call, [429, 503])
  } catch (err) {
    if (statusOf(err) !== 0) throw err
    throw new UncertainWriteError(
      'Sem conexão com o servidor. Confira se foi salvo antes de tentar de novo.',
    )
  }
}

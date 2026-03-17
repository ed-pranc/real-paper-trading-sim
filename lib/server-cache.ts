/**
 * Simple in-memory TTL cache for server-side API responses.
 * Works in both dev and production — unlike { next: { revalidate } } which
 * is bypassed in Next.js dev mode, this Map persists across requests within
 * the same server process.
 */
const store = new Map<string, { data: unknown; expiresAt: number }>()

export function getCached(key: string): unknown | null {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key: string, data: unknown, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
}

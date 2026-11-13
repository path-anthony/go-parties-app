import { ADMIN_API } from "@/lib/adminApi"
import { mockMode } from "@/lib/mock"
import type { OccasionId } from "@/data/catalog"

/* Block G1. Ask GO's tappable replies (S9-CONTRACT sections 15 and 16).
   Every POST /api/recommend reply carries `suggestions`, a short list the
   customer can tap to send as their next message; before the first message
   the same kind of list comes from GET /api/recommend/starters. The admin
   never falls back to fixed text and neither does the store: an empty or
   missing list means no buttons, and a failed starters call means none too.
   The strings are shown and sent exactly as they come. */

/* An array of plain strings, kept in order, at most four. Anything else is
   an empty list. */
export function cleanSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x !== "string") continue
    const t = x.trim()
    if (t && !out.includes(t)) out.push(t)
    if (out.length === 4) break
  }
  return out
}

/* The store's occasion as the starters call names it. */
const KIND: Record<OccasionId, string> = { kids: "Kids party", adult: "Adult party", wedding: "Wedding", corporate: "Corporate" }

/* The admin allows few of these an hour and caches them for five minutes,
   so a list is kept here for as long (a failure for one minute) and a call
   already on its way is shared. */
const cache = new Map<string, { at: number; list: string[]; ttl: number }>()
const inflight = new Map<string, Promise<string[]>>()

export function fetchStarters(occ: OccasionId | null): Promise<string[]> {
  const key = occ ?? ""
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < hit.ttl) return Promise.resolve(hit.list)
  const pending = inflight.get(key)
  if (pending) return pending
  const run = (async () => {
    try {
      let list: string[]
      if (import.meta.env.DEV && mockMode("ask")) {
        list = await (await import("@/lib/askMock")).mockStarters()
      } else {
        const res = await fetch(`${ADMIN_API}/api/recommend/starters${occ ? `?occasion=${encodeURIComponent(KIND[occ])}` : ""}`, { credentials: "omit" })
        if (!res.ok) throw new Error("starters")
        list = cleanSuggestions(((await res.json()) as { suggestions?: unknown }).suggestions)
      }
      cache.set(key, { at: Date.now(), list, ttl: 5 * 60_000 })
      return list
    } catch {
      cache.set(key, { at: Date.now(), list: [], ttl: 60_000 })
      return []
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, run)
  return run
}

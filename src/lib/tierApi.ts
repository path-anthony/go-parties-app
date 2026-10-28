import { parseGoDocument, type GoDocument } from "@/components/go/contract/types"
import { ADMIN_API } from "@/lib/adminApi"
import { mockMode } from "@/lib/mock"

/* The tier decision for a cart: which agreement the booking needs. The admin
   alone knows the thresholds (they are not public), so the storefront asks
   once the cart and date are fixed, and again right before the hold. A tier
   2 answer carries the contract quote: the GO document built from the cart
   (client fields empty until the hold fills them) and the hash the signature
   must match. A quote expires at the end of the day, Eastern; the admin
   refuses a hold on an expired or changed quote and the page starts over. */

export type Tier = 1 | 2 | 3

export interface TierQuote {
  quoteId: string
  contentHash: string
  termsVersion: number | null
  format: "go-v2"
  document: GoDocument
}

export interface TierInfo {
  tier: Tier
  reasons: string[]
  total: number | null
  retainerPercent: number | null
  retainerAmount: number | null
  /* Tier 1 only: the rental policy to tick. */
  policy: { version: number; text: string } | null
  /* Tier 2 only. */
  contract: TierQuote | null
  quoteExpiresAt: string | null
}

export interface TierInput {
  itemIds: string[]
  packageId: string | null
  addons: Record<string, string[]> | null
  eventDate: string
  eventTime: string | null
  occasion: string | null
}

export type TierResult = { ok: true; tier: TierInfo } | { ok: false; message: string }

const FALLBACK = "That didn't go through. Try again, or text us."

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)

export function parseTier(data: unknown): TierInfo | null {
  const d = data as Record<string, unknown> | null
  if (!d || typeof d !== "object") return null
  const tier = d.tier
  if (tier !== 1 && tier !== 2 && tier !== 3) return null
  const p = d.policy as Record<string, unknown> | null | undefined
  const c = d.contract as Record<string, unknown> | null | undefined
  const document = c ? parseGoDocument(c.document) : null
  const quoteId = c ? str(c.quoteId) : null
  const contentHash = c ? str(c.contentHash) : null
  return {
    tier,
    reasons: Array.isArray(d.reasons) ? d.reasons.filter((r): r is string => typeof r === "string") : [],
    total: num(d.total),
    retainerPercent: num(d.retainerPercent),
    retainerAmount: num(d.retainerAmount),
    policy: p && str(p.text) ? { version: num(p.version) ?? 0, text: str(p.text) as string } : null,
    contract: tier === 2 && document && quoteId && contentHash ? { quoteId, contentHash, termsVersion: num(c?.termsVersion), format: "go-v2", document } : null,
    quoteExpiresAt: str(d.quoteExpiresAt),
  }
}

export function tierBody(input: TierInput): Record<string, unknown> {
  const body: Record<string, unknown> = { eventDate: input.eventDate, eventTime: input.eventTime }
  if (input.itemIds.length === 1) body.itemId = input.itemIds[0]
  else body.itemIds = input.itemIds
  if (input.packageId) body.packageId = input.packageId
  if (input.addons) body.addons = input.addons
  if (input.occasion) body.occasion = input.occasion
  return body
}

export async function fetchTier(input: TierInput, signal?: AbortSignal): Promise<TierResult> {
  if (import.meta.env.DEV && mockMode("checkout")) {
    return (await import("./checkoutMock")).mockTier(input)
  }
  try {
    const res = await fetch(`${ADMIN_API}/api/bookings/tier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tierBody(input)),
      signal,
    })
    const data = await res.json().catch(() => null)
    const tier = res.ok ? parseTier(data) : null
    if (tier) return { ok: true, tier }
    // A refusal with the admin's own sentence (a 429 says the connection has
    // made too many booking attempts) is shown as written, so the customer
    // knows what happened; anything else is the bank's calm line.
    // A tier 2 answer that cannot be rendered is not a tier 2 the customer
    // can sign; treated as a failed read rather than a silent downgrade.
    const said = (data as { error?: unknown } | null)?.error
    return { ok: false, message: !res.ok && typeof said === "string" && said.trim() ? said : FALLBACK }
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") throw err
    return { ok: false, message: FALLBACK }
  }
}

/* The quote the hold must match: tier 2 only. */
export const quoteOf = (t: TierInfo | null) => (t && t.tier === 2 ? t.contract : null)

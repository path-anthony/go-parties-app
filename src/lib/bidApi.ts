import { ADMIN_API } from "@/lib/adminApi"

/* The crew gig page's calls to go-parties-admin, by the offer's unguessable
   token. Public on the admin side (no session, no cookies), a plain fetch,
   like the contract page. One shape comes back from GET, from the bid and
   from the decline, so every screen just renders the latest gig.

   Mock mode, local only: with `import.meta.env.DEV` true and a token that
   starts with "mock-", the calls are answered from fixtures in memory
   (bidMock.ts) so the whole flow is clickable before the admin has these
   endpoints. The condition is written inline at each call so a production
   build folds it to `false` and drops the branch and the fixtures with it. */

export type BidState = "open" | "bid_submitted" | "accepted" | "not_selected" | "expired" | "declined"

const STATES: readonly string[] = ["open", "bid_submitted", "accepted", "not_selected", "expired", "declined"]

export interface BidGig {
  state: BidState
  role: string | null
  eventType: string | null
  guestCount: number | null
  /* YYYY-MM-DD */
  eventDate: string | null
  /* Display text as the admin holds it ("6 PM"). */
  startTime: string | null
  endTime: string | null
  /* Town only, never a street address. */
  town: string | null
  /* Whole dollars; either end may be missing. */
  payRange: { min: number | null; max: number | null } | null
  /* ISO instant; shown in Eastern. */
  deadlineAt: string | null
  myBid: { amount: number; note: string | null; submittedAt: string | null } | null
  /* Only when accepted. */
  address: string | null
  arrivalNotes: string | null
  contactPhone: string | null
  crewFirstName: string | null
  confirmedAt: string | null
  questions: { text: string; createdAt: string }[]
}

export type BidLoad = { kind: "ok"; gig: BidGig } | { kind: "invalid" } | { kind: "error"; message: string }

export type BidReason = "deadline-passed" | "already-filled" | "bid-invalid" | "not-open" | "rate-limited" | "error"

export type BidResult<T> = { ok: true; data: T } | { ok: false; reason: BidReason; message: string }

const FALLBACK = "That didn't go through. Try again, or text us."

/* What each refusal says to crew. The admin's own sentence is not shown: the
   words here are ours, one per reason. */
const REASON_TEXT: Record<BidReason, string> = {
  "deadline-passed": "Bids closed before that went through.",
  "already-filled": "Someone else already has this gig.",
  "bid-invalid": "Enter a whole dollar amount, like 250.",
  "not-open": "This gig isn't taking bids right now.",
  "rate-limited": "Too many tries. Give it a minute and try again.",
  error: FALLBACK,
}

/* Shared with the mock, so its refusals read exactly as the real ones. */
export const reasonText = (reason: BidReason): string => REASON_TEXT[reason]

const REASONS: readonly string[] = ["deadline-passed", "already-filled", "bid-invalid", "not-open", "rate-limited"]

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null)
const int = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null)

/* Whatever the admin sends becomes a BidGig with every optional field either
   a real value or null, so no screen ever meets a stray undefined. An unknown
   state is not guessed at: it returns null. */
export function parseGig(data: unknown): BidGig | null {
  const d = data as Record<string, unknown> | null
  if (!d || typeof d !== "object" || typeof d.state !== "string" || !STATES.includes(d.state)) return null
  const pr = d.payRange as { min?: unknown; max?: unknown } | null | undefined
  const bid = d.myBid as { amount?: unknown; note?: unknown; submittedAt?: unknown } | null | undefined
  const bidAmount = bid ? int(bid.amount) : null
  const qs = Array.isArray(d.questions) ? d.questions : []
  return {
    state: d.state as BidState,
    role: str(d.role),
    eventType: str(d.eventType),
    guestCount: int(d.guestCount),
    eventDate: str(d.eventDate),
    startTime: str(d.startTime),
    endTime: str(d.endTime),
    town: str(d.town),
    payRange: pr && typeof pr === "object" ? { min: int(pr.min), max: int(pr.max) } : null,
    deadlineAt: str(d.deadlineAt),
    myBid: bid && bidAmount !== null ? { amount: bidAmount, note: str(bid.note), submittedAt: str(bid.submittedAt) } : null,
    address: str(d.address),
    arrivalNotes: str(d.arrivalNotes),
    contactPhone: str(d.contactPhone),
    crewFirstName: str(d.crewFirstName),
    confirmedAt: str(d.confirmedAt),
    questions: qs.flatMap((q) => {
      const text = str((q as { text?: unknown })?.text)
      const createdAt = str((q as { createdAt?: unknown })?.createdAt)
      return text && createdAt ? [{ text, createdAt }] : []
    }),
  }
}

const url = (token: string, path = "") => `${ADMIN_API}/api/bids/${encodeURIComponent(token)}${path}`

async function send(token: string, path: string, method: "PUT" | "POST", body?: unknown): Promise<{ status: number; data: unknown }> {
  const res = await fetch(url(token, path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}

function failure(status: number, data: unknown): { ok: false; reason: BidReason; message: string } {
  const r = (data as { reason?: unknown } | null)?.reason
  const reason: BidReason = typeof r === "string" && REASONS.includes(r) ? (r as BidReason) : status === 429 ? "rate-limited" : "error"
  return { ok: false, reason, message: REASON_TEXT[reason] }
}

const NETWORK: { ok: false; reason: BidReason; message: string } = { ok: false, reason: "error", message: FALLBACK }

async function gigResult(call: () => Promise<{ status: number; data: unknown }>): Promise<BidResult<BidGig>> {
  try {
    const { status, data } = await call()
    if (status >= 200 && status < 300) {
      const gig = parseGig(data)
      return gig ? { ok: true, data: gig } : NETWORK
    }
    return failure(status, data)
  } catch {
    return NETWORK
  }
}

export async function loadBid(token: string, signal?: AbortSignal): Promise<BidLoad> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./bidMock")).mockLoad(token)
  }
  try {
    const res = await fetch(url(token), { signal })
    if (res.status === 404) return { kind: "invalid" }
    const gig = res.ok ? parseGig(await res.json().catch(() => null)) : null
    return gig ? { kind: "ok", gig } : { kind: "error", message: FALLBACK }
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") throw err
    return { kind: "error", message: FALLBACK }
  }
}

/* amount is whole dollars. */
export async function submitBid(token: string, body: { amount: number; note: string | null }): Promise<BidResult<BidGig>> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./bidMock")).mockSubmit(token, body)
  }
  return gigResult(() => send(token, "/bid", "PUT", { amount: body.amount, ...(body.note ? { note: body.note } : {}) }))
}

export async function declineBid(token: string): Promise<BidResult<BidGig>> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./bidMock")).mockDecline(token)
  }
  return gigResult(() => send(token, "/decline", "POST"))
}

export async function confirmSet(token: string): Promise<BidResult<{ confirmedAt: string }>> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./bidMock")).mockConfirm(token)
  }
  try {
    const { status, data } = await send(token, "/confirm", "POST")
    const at = str((data as { confirmedAt?: unknown } | null)?.confirmedAt)
    if (status >= 200 && status < 300 && at) return { ok: true, data: { confirmedAt: at } }
    return failure(status, data)
  } catch {
    return NETWORK
  }
}

export async function askQuestion(token: string, text: string): Promise<BidResult<{ ok: true }>> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./bidMock")).mockQuestion(token, text)
  }
  try {
    const { status, data } = await send(token, "/question", "POST", { text })
    if (status >= 200 && status < 300 && (data as { ok?: unknown } | null)?.ok === true) return { ok: true, data: { ok: true } }
    return failure(status, data)
  } catch {
    return NETWORK
  }
}

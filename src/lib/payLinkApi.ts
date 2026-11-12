import { ADMIN_API } from "@/lib/adminApi"
import { parseOffer, type PaymentOffer } from "@/lib/paymentApi"

/* Block S9b. The admin's private pay link, as a storefront screen
   (S9-CONTRACT section 6). The token in /pay/:token is the only credential:
   no account, no session cookie, so every call here omits credentials. The
   token is a secret like the contract link's: it is never put in a page tag,
   a title, a log line or an analytics event, and the page is served with a
   referrer policy that keeps it out of requests to other sites. */

export type PayStep = "sign" | "retainer" | "balance" | "nothing" | "closed"

export interface PayView {
  step: PayStep
  /* Dollars, as the admin says; never computed here. */
  amount: number | null
  kind: "retainer" | "balance" | null
  stage: string
  /* "2026-12-26" */
  eventDate: string
  customerFirstName: string
  total: number | null
  paid: number
  retainerPaid: boolean
  balancePaid: boolean
  /* The signing page for step "sign". */
  contractLink: string | null
  /* The rental policy for a booking with no contract; its numbers are
     already filled in. */
  policy: { id: string; version: number; text: string } | null
  hasAccount: boolean
  /* Block S9c (S9-CONTRACT section 11). The policy must be accepted before
     the pay form when it is required and not yet accepted. */
  policyRequired: boolean
  policyAccepted: boolean
  eventTime: string | null
  guestCount: number | null
  /* The package's name when the booking is a package; items is still filled. */
  package: string | null
  items: Array<{ name: string; quantity: number }>
  /* What is left after the retainer, and when it is due ("2026-12-12"). */
  balance: number | null
  balanceDueDate: string | null
}

export type PayLoad = { kind: "ok"; view: PayView } | { kind: "not-found" } | { kind: "error" }

export type PolicyResult = { ok: true } | { ok: false; reason: "policy-changed" | "closed" | "error"; message: string; policy?: { id: string; version: number; text: string } }

export type PaySession = { ok: true; offer: PaymentOffer } | { ok: false; reason: "not-payable" | "nothing-due" | "error"; message: string }

const FALLBACK = "That didn't go through. Try again, or text us."
const STEPS: PayStep[] = ["sign", "retainer", "balance", "nothing", "closed"]
const str = (v: unknown) => (typeof v === "string" ? v : "")
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)

function readPolicy(p: Record<string, unknown> | null | undefined): PayView["policy"] {
  return p && typeof p === "object" && str(p.text).trim() !== "" ? { id: str(p.id), version: num(p.version) ?? 0, text: str(p.text) } : null
}

export function parsePay(raw: unknown): PayView | null {
  const d = (raw ?? {}) as Record<string, unknown>
  const step = STEPS.find((s) => s === d.step)
  if (!step) return null
  const p = d.policy as Record<string, unknown> | null | undefined
  const policy = readPolicy(p)
  const items = Array.isArray(d.items)
    ? d.items.flatMap((i: unknown) => {
        const r = (i ?? {}) as Record<string, unknown>
        return str(r.name).trim() ? [{ name: str(r.name), quantity: num(r.quantity) ?? 1 }] : []
      })
    : []
  return {
    step,
    amount: num(d.amount),
    kind: d.kind === "retainer" || d.kind === "balance" ? d.kind : null,
    stage: str(d.stage),
    eventDate: str(d.eventDate).slice(0, 10),
    customerFirstName: str(d.customerFirstName),
    total: num(d.total),
    paid: num(d.paid) ?? 0,
    retainerPaid: d.retainerPaid === true,
    balancePaid: d.balancePaid === true,
    contractLink: str(d.contractLink) || null,
    policy,
    hasAccount: d.hasAccount === true,
    // An older admin sends no flag: a policy present means it is required.
    policyRequired: typeof d.policyRequired === "boolean" ? d.policyRequired : policy !== null,
    policyAccepted: d.policyAccepted === true,
    eventTime: str(d.eventTime).trim() || null,
    guestCount: num(d.guestCount),
    package: str(d.package).trim() || null,
    items,
    balance: num(d.balance),
    balanceDueDate: str(d.balanceDueDate).slice(0, 10) || null,
  }
}

export const payLinkApi = {
  get: async (token: string, signal?: AbortSignal): Promise<PayLoad> => {
    if (import.meta.env.DEV && token.startsWith("mock-")) return (await import("./payLinkMock")).mockPayGet(token)
    try {
      const res = await fetch(`${ADMIN_API}/api/pay/${encodeURIComponent(token)}`, { credentials: "omit", cache: "no-store", signal })
      if (res.status === 404) return { kind: "not-found" }
      if (!res.ok) return { kind: "error" }
      const view = parsePay(await res.json().catch(() => null))
      return view ? { kind: "ok", view } : { kind: "error" }
    } catch {
      return { kind: "error" }
    }
  },
  /* Tells the admin the customer ticked the policy box (S9-CONTRACT section
     10), before the pay form opens. The first acceptance stands, so calling
     again is harmless. A 409 policy-changed carries the current text. The
     admin does not refuse a payment without it; the screen does. */
  policy: async (token: string, policyId: string): Promise<PolicyResult> => {
    if (import.meta.env.DEV && token.startsWith("mock-")) return (await import("./payLinkMock")).mockPayPolicy(token, policyId)
    try {
      const res = await fetch(`${ADMIN_API}/api/pay/${encodeURIComponent(token)}/policy`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true, policyId }),
      })
      if (res.ok) return { ok: true }
      const d = (await res.json().catch(() => ({}))) as Record<string, unknown>
      const message = typeof d.error === "string" ? d.error : FALLBACK
      // Nothing to accept here: the contract is the agreement, or no policy exists.
      if (d.reason === "not-needed" || d.reason === "no-policy") return { ok: true }
      if (d.reason === "policy-changed") return { ok: false, reason: "policy-changed", message, policy: readPolicy(d.policy as Record<string, unknown> | undefined) ?? undefined }
      if (d.reason === "closed") return { ok: false, reason: "closed", message }
      return { ok: false, reason: "error", message }
    } catch {
      return { ok: false, reason: "error", message: FALLBACK }
    }
  },
  /* An embedded Stripe form for what is owed. The form's completion is
     confirmed by the admin through GET /api/payments/status (waitForPayment). */
  session: async (token: string): Promise<PaySession> => {
    if (import.meta.env.DEV && token.startsWith("mock-")) return (await import("./payLinkMock")).mockPaySession(token)
    try {
      const res = await fetch(`${ADMIN_API}/api/pay/${encodeURIComponent(token)}/session`, { method: "POST", credentials: "omit" })
      const d = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (res.ok) {
        const offer = parseOffer(d)
        return offer ? { ok: true, offer } : { ok: false, reason: "error", message: FALLBACK }
      }
      const reason = d.reason === "not-payable" || d.reason === "nothing-due" ? d.reason : "error"
      return { ok: false, reason, message: typeof d.error === "string" ? d.error : FALLBACK }
    } catch {
      return { ok: false, reason: "error", message: FALLBACK }
    }
  },
}

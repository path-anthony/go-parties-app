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
}

export type PayLoad = { kind: "ok"; view: PayView } | { kind: "not-found" } | { kind: "error" }

export type PaySession = { ok: true; offer: PaymentOffer } | { ok: false; reason: "not-payable" | "nothing-due" | "error"; message: string }

const FALLBACK = "That didn't go through. Try again, or text us."
const STEPS: PayStep[] = ["sign", "retainer", "balance", "nothing", "closed"]
const str = (v: unknown) => (typeof v === "string" ? v : "")
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)

export function parsePay(raw: unknown): PayView | null {
  const d = (raw ?? {}) as Record<string, unknown>
  const step = STEPS.find((s) => s === d.step)
  if (!step) return null
  const p = d.policy as Record<string, unknown> | null | undefined
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
    policy: p && typeof p === "object" && str(p.text).trim() !== "" ? { id: str(p.id), version: num(p.version) ?? 0, text: str(p.text) } : null,
    hasAccount: d.hasAccount === true,
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

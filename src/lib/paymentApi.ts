import { ADMIN_API } from "@/lib/adminApi"
import { mockMode } from "@/lib/mock"
import { isMockSecret } from "@/lib/stripe"

/* Payment status, as the admin knows it. The page never decides a booking is
   paid on its own: Stripe tells the admin by webhook, and the admin tells
   the page here. After the embedded form reports completion the page asks a
   few times, a second and a half apart, until the admin says paid. */

export interface PaymentOffer {
  kind: "retainer" | "balance"
  /* Dollars. */
  amount: number
  clientSecret: string
  sessionId: string
}

export interface PaymentStatus {
  status: "complete" | "open" | "expired"
  paid: boolean
  bookingId: string | null
  kind: string | null
}

/* A Checkout Session's client secret is "<session id>_secret_<key>"; the
   admin's status endpoint wants the session id. The admin may also send
   sessionId outright, which wins. */
export function sessionIdOf(clientSecret: string, sessionId?: unknown): string {
  if (typeof sessionId === "string" && sessionId.trim() !== "") return sessionId
  return clientSecret.split("_secret_")[0]
}

export function parseOffer(raw: unknown): PaymentOffer | null {
  const d = raw as Record<string, unknown> | null
  if (!d || typeof d !== "object") return null
  const clientSecret = typeof d.clientSecret === "string" ? d.clientSecret : ""
  const amount = typeof d.amount === "number" && Number.isFinite(d.amount) ? d.amount : null
  if (!clientSecret || amount === null) return null
  const kind = d.kind === "balance" ? "balance" : "retainer"
  return { kind, amount, clientSecret, sessionId: sessionIdOf(clientSecret, d.sessionId) }
}

export async function paymentStatus(sessionId: string): Promise<PaymentStatus | null> {
  if (import.meta.env.DEV && isMockSecret(sessionId) && (mockMode("checkout") || mockMode("portal"))) {
    return (await import("./paymentMockState")).mockPaymentStatus(sessionId)
  }
  try {
    const res = await fetch(`${ADMIN_API}/api/payments/status?sessionId=${encodeURIComponent(sessionId)}`, { credentials: "include" })
    const d = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!res.ok || !d) return null
    const status = d.status === "complete" || d.status === "open" || d.status === "expired" ? d.status : "open"
    return { status, paid: d.paid === true, bookingId: typeof d.bookingId === "string" ? d.bookingId : null, kind: typeof d.kind === "string" ? d.kind : null }
  } catch {
    return null
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* Polls until the admin says paid, the session is expired, or the tries run
   out. The last answer (or null) comes back either way. */
export async function waitForPayment(sessionId: string, tries = 8, delayMs = 1500): Promise<PaymentStatus | null> {
  let last: PaymentStatus | null = null
  for (let i = 0; i < tries; i++) {
    last = await paymentStatus(sessionId)
    if (last?.paid || last?.status === "expired") return last
    await sleep(delayMs)
  }
  return last
}

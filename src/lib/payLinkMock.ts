import type { PayLoad, PaySession, PayView } from "@/lib/payLinkApi"
import { sessionIdOf } from "@/lib/paymentApi"
import { mockPaymentStatus } from "@/lib/paymentMockState"

/* Pay link fixtures, DEV only (loaded lazily behind import.meta.env.DEV).
   Tokens that start with "mock-":
     mock-retainer   a small rental, retainer $45, policy to accept
     mock-balance    the same booking after the retainer: balance $180
     mock-sign       a contract booking not yet signed
     mock-nothing    all paid up
     mock-closed     cancelled
   Anything else under "mock-" is a link the admin does not know. */

const policy = {
  id: "pol-mock",
  version: 4,
  text: "Cancellation and retainer policy\n\nThe retainer is 20% of your total. It holds your date and is not refundable.\n\nThe balance is due 7 days before your event. If you cancel, the retainer stays with GO. We review anything else you paid case by case.\n\nWe deliver and set up at the address on your booking. Please make sure the ground is clear and flat.",
}

const base: PayView = {
  step: "retainer",
  amount: 45,
  kind: "retainer",
  stage: "Held",
  eventDate: "2026-12-26",
  customerFirstName: "Sarah",
  total: 225,
  paid: 0,
  retainerPaid: false,
  balancePaid: false,
  contractLink: null,
  policy,
  hasAccount: false,
}

const secretFor = (token: string) => `cs_test_mock_pay_${token}_secret_1`

export async function mockPayGet(token: string): Promise<PayLoad> {
  await new Promise((r) => setTimeout(r, 250))
  const paid = mockPaymentStatus(secretFor(token)).paid
  if (token === "mock-retainer") return { kind: "ok", view: paid ? { ...base, step: "balance", amount: 180, kind: "balance", stage: "Confirmed", paid: 45, retainerPaid: true } : base }
  if (token === "mock-balance") return { kind: "ok", view: paid ? { ...base, step: "nothing", amount: null, kind: null, stage: "Confirmed", paid: 225, retainerPaid: true, balancePaid: true } : { ...base, step: "balance", amount: 180, kind: "balance", stage: "Confirmed", paid: 45, retainerPaid: true } }
  if (token === "mock-sign") return { kind: "ok", view: { ...base, step: "sign", amount: 999, policy: null, total: 3330, contractLink: "https://parties.thegoeventgroup.com/sign/mock-open-token", hasAccount: true } }
  if (token === "mock-nothing") return { kind: "ok", view: { ...base, step: "nothing", amount: null, kind: null, stage: "Confirmed", paid: 225, retainerPaid: true, balancePaid: true, policy: null } }
  if (token === "mock-closed") return { kind: "ok", view: { ...base, step: "closed", amount: null, kind: null, stage: "Cancelled", policy: null } }
  return { kind: "not-found" }
}

export async function mockPaySession(token: string): Promise<PaySession> {
  await new Promise((r) => setTimeout(r, 250))
  const view = await mockPayGet(token)
  if (view.kind !== "ok") return { ok: false, reason: "error", message: "That pay link isn't known." }
  const v = view.view
  if (v.step !== "retainer" && v.step !== "balance") return { ok: false, reason: "nothing-due", message: "Nothing is due right now." }
  const clientSecret = secretFor(token)
  return { ok: true, offer: { kind: v.step, amount: v.amount ?? 0, clientSecret, sessionId: sessionIdOf(clientSecret) } }
}

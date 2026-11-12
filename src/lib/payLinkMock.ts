import type { PayLoad, PolicyResult, PaySession, PayView } from "@/lib/payLinkApi"
import { sessionIdOf } from "@/lib/paymentApi"
import { mockPaymentStatus } from "@/lib/paymentMockState"

/* Pay link fixtures, DEV only (loaded lazily behind import.meta.env.DEV).
   Tokens that start with "mock-":
     mock-retainer   a small rental, retainer $45, policy to accept
     mock-balance    the same booking after the retainer: balance $180
     mock-sign       a contract booking not yet signed
     mock-nothing    all paid up
     mock-closed     cancelled
     mock-accepted   the policy was already accepted: no policy box
     mock-changed    the policy was saved again after the page loaded: the
                     first tick is refused with the new text (policy-changed)
     mock-package    a package booking with a time, guests and items
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
  policyRequired: true,
  policyAccepted: false,
  eventTime: "2 PM",
  guestCount: 80,
  package: null,
  items: [
    { name: "Snow Cone Station", quantity: 2 },
    { name: "Attendant", quantity: 1 },
  ],
  balance: 180,
  balanceDueDate: "2026-12-12",
}

/* Tokens whose policy was accepted in this tab, and the ones that already
   refused once with a newer policy. */
const accepted = new Set<string>()
const refusedOnce = new Set<string>()
const newer = { id: "pol-mock-5", version: 5, text: policy.text.replace("20%", "25%").replace("Cancellation and retainer policy", "Cancellation and retainer policy, updated") }

const secretFor = (token: string) => `cs_test_mock_pay_${token}_secret_1`

const gate = (token: string, v: PayView): PayView => {
  const open = { ...v, policyRequired: v.policy !== null && v.policyRequired }
  if (token === "mock-accepted" || token === "mock-balance" || accepted.has(token)) return { ...open, policyAccepted: true }
  return open
}

export async function mockPayGet(token: string): Promise<PayLoad> {
  await new Promise((r) => setTimeout(r, 250))
  const load = await mockPayView(token)
  return load.kind === "ok" ? { kind: "ok", view: gate(token, load.view) } : load
}

export async function mockPolicyAccept(token: string, policyId: string): Promise<PolicyResult> {
  await new Promise((r) => setTimeout(r, 250))
  if (token === "mock-changed" && !refusedOnce.has(token)) {
    refusedOnce.add(token)
    return { ok: false, reason: "policy-changed", message: "The policy was updated. Please read it again.", policy: newer }
  }
  void policyId
  accepted.add(token)
  return { ok: true }
}

async function mockPayView(token: string): Promise<PayLoad> {
  const paid = mockPaymentStatus(secretFor(token)).paid
  if (token === "mock-accepted") return { kind: "ok", view: base }
  if (token === "mock-changed") return { kind: "ok", view: base }
  if (token === "mock-package") return { kind: "ok", view: { ...base, package: "Birthday Fun Package", guestCount: 40, eventTime: "11 AM", total: 450, amount: 90, balance: 360, balanceDueDate: "2026-12-19", items: [{ name: "Portable Bar", quantity: 2 }, { name: "Bartender", quantity: 1 }, { name: "Cooler", quantity: 4 }] } }
  if (token === "mock-retainer") return { kind: "ok", view: paid ? { ...base, step: "balance", amount: 180, kind: "balance", stage: "Confirmed", paid: 45, retainerPaid: true, policyAccepted: true, balance: 180 } : base }
  if (token === "mock-balance") return { kind: "ok", view: paid ? { ...base, step: "nothing", amount: null, kind: null, stage: "Confirmed", paid: 225, retainerPaid: true, balancePaid: true } : { ...base, step: "balance", amount: 180, kind: "balance", stage: "Confirmed", paid: 45, retainerPaid: true } }
  if (token === "mock-sign") return { kind: "ok", view: { ...base, step: "sign", amount: 999, policy: null, total: 3330, contractLink: "https://parties.thegoeventgroup.com/sign/mock-open-token", hasAccount: true } }
  if (token === "mock-nothing") return { kind: "ok", view: { ...base, step: "nothing", amount: null, kind: null, stage: "Confirmed", paid: 225, retainerPaid: true, balancePaid: true, policy: null } }
  if (token === "mock-closed") return { kind: "ok", view: { ...base, step: "closed", amount: null, kind: null, stage: "Cancelled", policy: null } }
  return { kind: "not-found" }
}

export const mockPayPolicy = mockPolicyAccept

export async function mockPaySession(token: string): Promise<PaySession> {
  await new Promise((r) => setTimeout(r, 250))
  const view = await mockPayGet(token)
  if (view.kind !== "ok") return { ok: false, reason: "error", message: "That pay link isn't known." }
  const v = view.view
  if (v.step !== "retainer" && v.step !== "balance") return { ok: false, reason: "nothing-due", message: "Nothing is due right now." }
  const clientSecret = secretFor(token)
  return { ok: true, offer: { kind: v.step, amount: v.amount ?? 0, clientSecret, sessionId: sessionIdOf(clientSecret) } }
}

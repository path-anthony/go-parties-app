import { FULL, SIGNED_DOC } from "@/lib/contractMock"
import type { ApiResult, CustomerBooking, CustomerContract, SignBody } from "@/lib/customerApi"
import { MOCK_SECRET, mockPaymentStatus } from "@/lib/paymentMockState"
import { sessionIdOf, type PaymentOffer } from "@/lib/paymentApi"

/* Portal fixtures, DEV only (loaded lazily behind import.meta.env.DEV):
   `?mock=portal` signs a fake customer in with one booking per stage,
   including Released, an unpaid retainer, a balance due, an unsigned tier 2
   contract and a tier 3 request in review. Signing and paying change the
   fixtures in memory. Nothing here touches the admin. */

const CUSTOMER = { id: "cus_mock", name: "Jordan Sample", phone: "8605550142", email: "jordan.sample@example.com", createdAt: "2026-09-01T12:00:00.000Z" }

const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10) + "T00:00:00.000Z"
const unit = (itemName: string, i = 1) => ({ unitId: `u${i}`, unitLabel: `Unit #${i}`, itemId: `it-${itemName.toLowerCase().replace(/\W+/g, "-")}`, itemName })

type Row = CustomerBooking & { _signed: boolean; _sessions?: Partial<Record<"retainer" | "balance", string>> }

const base = (id: string, stage: string, tier: 1 | 2 | 3, units: ReturnType<typeof unit>[], extra: Partial<CustomerBooking> & { _signed?: boolean }): Row => ({
  id,
  eventDate: day(30),
  eventTime: "2 PM",
  address: "14 Maple Ln, Avon",
  customerName: CUSTOMER.name,
  phone: CUSTOMER.phone,
  email: CUSTOMER.email,
  status: stage === "Cancelled" || stage === "Released" ? "Cancelled" : stage === "Completed" ? "Completed" : "Confirmed",
  stage,
  depositPaid: false,
  createdAt: "2026-10-01T12:00:00.000Z",
  units,
  tier,
  rescheduleMode: tier === 1 ? "self" : "request",
  pendingRequest: null,
  _signed: false,
  ...extra,
})

const rows: Row[] = [
  base("bk-held", "Held", 1, [unit("Test Gladiator Bounce House")], {
    steps: [{ key: "retainer", state: "next" }],
    contract: null,
    retainer: { amount: 210, paid: false, payable: true },
    balance: { amount: 490, dueDate: day(23).slice(0, 10), paid: false, payable: false },
  }),
  base("bk-requested", "Requested", 2, [unit("Go DJ"), unit("Uplighting", 2)], {
    eventDate: day(45),
    steps: [
      { key: "sign", state: "next" },
      { key: "retainer", state: "blocked" },
    ],
    contract: { agreementId: "ag-req", status: "ready" },
    retainer: { amount: 999, paid: false, payable: true },
    balance: { amount: 2331, dueDate: day(15).slice(0, 10), paid: false, payable: false },
  }),
  base("bk-signed", "Signed", 2, [unit("Go DJ")], {
    eventDate: day(60),
    steps: [
      { key: "sign", state: "done", at: "2026-10-12T18:20:00.000Z" },
      { key: "retainer", state: "next" },
    ],
    contract: { agreementId: "ag-signed", status: "signed", signedAt: "2026-10-12T18:20:00.000Z", pdfUrl: "https://example.com/contracts/mock-signed.pdf" },
    retainer: { amount: 999, paid: false, payable: true },
    balance: { amount: 2331, dueDate: day(30).slice(0, 10), paid: false, payable: false },
    _signed: true,
  }),
  base("bk-confirmed", "Confirmed", 2, [unit("Go DJ"), unit("Sound System", 2)], {
    eventDate: day(20),
    depositPaid: true,
    steps: [
      { key: "sign", state: "done", at: "2026-10-05T15:00:00.000Z" },
      { key: "retainer", state: "done", at: "2026-10-05T15:10:00.000Z" },
      { key: "balance", state: "next" },
    ],
    contract: { agreementId: "ag-conf", status: "signed", signedAt: "2026-10-05T15:00:00.000Z", pdfUrl: "https://example.com/contracts/mock-signed.pdf" },
    retainer: { amount: 999, paid: true, paidAt: "2026-10-05T15:10:00.000Z", payable: false },
    balance: { amount: 2331, dueDate: day(-10).slice(0, 10), paid: false, payable: true },
    _signed: true,
  }),
  base("bk-review", "In review", 3, [unit("Dream Wedding Package")], {
    eventDate: day(120),
    steps: [{ key: "proposal", state: "waiting" }],
    contract: null,
    retainer: null,
    balance: null,
  }),
  base("bk-proposal", "Proposal ready", 3, [unit("Dream Wedding Package")], {
    eventDate: day(150),
    steps: [{ key: "proposal", state: "next" }],
    contract: null,
    retainer: null,
    balance: null,
  }),
  base("bk-done", "Completed", 1, [unit("Snow Cone Station")], { eventDate: day(-14), depositPaid: true, steps: [], retainer: { amount: 60, paid: true, payable: false }, balance: { amount: 140, dueDate: day(-21).slice(0, 10), paid: true, payable: false } }),
  base("bk-cancelled", "Cancelled", 1, [], { eventDate: day(-3), steps: [], retainer: null, balance: null }),
  base("bk-released", "Released", 1, [unit("Test Gladiator Bounce House")], { eventDate: day(40), steps: [], retainer: null, balance: null }),
]

const strip = ({ _signed, _sessions, ...b }: Row): CustomerBooking => {
  void _signed
  void _sessions
  return structuredClone(b)
}
const wait = () => new Promise((r) => setTimeout(r, 250))

export async function mockMe(): Promise<ApiResult<{ customer: typeof CUSTOMER }>> {
  await wait()
  return { ok: true, data: { customer: CUSTOMER } }
}

/* A mock session the Simulate button marked paid settles the fixture the next
   time anything reads it, the way the admin's webhook would. */
function settle(b: Row) {
  for (const kind of ["retainer", "balance"] as const) {
    const sid = b._sessions?.[kind]
    const money = kind === "retainer" ? b.retainer : b.balance
    if (!sid || !money || money.paid || !mockPaymentStatus(sid).paid) continue
    money.paid = true
    money.payable = false
    b.steps = (b.steps ?? []).map((s) => (s.key === kind ? { ...s, state: "done", at: new Date().toISOString() } : s))
    if (kind === "retainer") {
      b.depositPaid = true
      b.stage = b.tier === 1 ? "Held" : b._signed ? "Confirmed" : "Retainer Paid"
    }
  }
}

export async function mockBookings(): Promise<ApiResult<CustomerBooking[]>> {
  await wait()
  rows.forEach(settle)
  return { ok: true, data: rows.map(strip) }
}

export async function mockContract(id: string): Promise<ApiResult<CustomerContract>> {
  await wait()
  const b = rows.find((r) => r.id === id)
  if (!b || !b.contract) return { ok: false, status: 404, message: "There is no contract on this booking." }
  if (b._signed) {
    return {
      ok: true,
      data: { signed: true, title: "Service Contract and Retainer Agreement", format: "go-v2", document: structuredClone(SIGNED_DOC), signedName: "Jordan Sample", signedAt: b.contract.signedAt ?? "2026-10-12T18:20:00.000Z", pdfUrl: "https://example.com/contracts/mock-signed.pdf" },
    }
  }
  return { ok: true, data: { signed: false, title: "Service Contract and Retainer Agreement", format: "go-v2", document: structuredClone(FULL), contentHash: "mock-hash" } }
}

export async function mockSign(id: string, body: SignBody): Promise<ApiResult<{ signed: true; signedAt: string; signedName: string; pdfUrl: string }>> {
  await wait()
  const b = rows.find((r) => r.id === id)
  if (!b || !b.contract) return { ok: false, status: 404, message: "There is no contract on this booking." }
  if (b._signed) return { ok: false, status: 409, reason: "already-signed", message: "This contract was already signed. Nothing more is needed from you." }
  const name = body.fullName.trim()
  if (name.length < 3 || !name.includes(" ")) return { ok: false, status: 400, reason: "name-required", message: "Type your full name, first and last." }
  if (body.esignConsent !== true) return { ok: false, status: 400, reason: "consent-required", message: "You need to consent to sign electronically to continue." }
  const signedAt = new Date().toISOString()
  b._signed = true
  b.stage = "Signed"
  b.contract = { ...b.contract, status: "signed", signedAt, pdfUrl: "https://example.com/contracts/mock-signed.pdf" }
  b.steps = (b.steps ?? []).map((s) => (s.key === "sign" ? { ...s, state: "done", at: signedAt } : s.key === "retainer" ? { ...s, state: "next" } : s))
  return { ok: true, data: { signed: true, signedAt, signedName: name, pdfUrl: "https://example.com/contracts/mock-signed.pdf" } }
}

export async function mockPaymentSession(id: string, kind: "retainer" | "balance"): Promise<ApiResult<PaymentOffer>> {
  await wait()
  const b = rows.find((r) => r.id === id)
  if (b) settle(b)
  const money = kind === "retainer" ? b?.retainer : b?.balance
  if (!b || !money || money.paid || money.amount === null) return { ok: false, status: 409, reason: "nothing-due", message: "Nothing is due right now." }
  if (!money.payable) return { ok: false, status: 409, reason: "not-payable", message: "Online payment is not open for this yet." }
  // One session per booking and kind until it is paid, so asking twice (as
  // React's dev double-run does) gives the same one.
  const secret = b._sessions?.[kind] ?? `${MOCK_SECRET.split("_secret_")[0]}_${kind}_${id}_secret_1`
  b._sessions = { ...(b._sessions ?? {}), [kind]: secret }
  return { ok: true, data: { kind, amount: money.amount, clientSecret: secret, sessionId: sessionIdOf(secret) } }
}

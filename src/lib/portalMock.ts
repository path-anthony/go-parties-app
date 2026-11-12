import { FULL, SIGNED_DOC } from "@/lib/contractMock"
import type { ApiResult, CancelAsked, CancelInfo, CancelTerms, CustomerBooking, CustomerContract, CustomerRequests, SignBody } from "@/lib/customerApi"
import { MOCK_SECRET, mockPaymentStatus } from "@/lib/paymentMockState"
import { sessionIdOf, type PaymentOffer } from "@/lib/paymentApi"

/* Portal fixtures, DEV only (loaded lazily behind import.meta.env.DEV):
   `?mock=portal` signs a fake customer in with one booking per stage,
   including Released, an unpaid retainer, a balance due, an unsigned tier 2
   contract and a tier 3 request in review. Signing and paying change the
   fixtures in memory. Nothing here touches the admin. */

const CUSTOMER = { id: "cus_mock", name: "Jordan Sample", phone: "8605550142", email: "jordan.sample@example.com", homeAddress: "14 Maple Ln, Avon, CT 06001, USA", createdAt: "2026-09-01T12:00:00.000Z" }

const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10) + "T00:00:00.000Z"
const unit = (itemName: string, i = 1) => ({ unitId: `u${i}`, unitLabel: `Unit #${i}`, itemId: `it-${itemName.toLowerCase().replace(/\W+/g, "-")}`, itemName })

type Row = CustomerBooking & { _signed: boolean; _sessions?: Partial<Record<"retainer" | "balance", string>> }

const base = (id: string, stage: string, tier: 1 | 2 | 3, units: ReturnType<typeof unit>[], extra: Partial<CustomerBooking> & { _signed?: boolean }): Row => ({
  id,
  eventDate: day(30),
  eventTime: "2 PM",
  address: "14 Maple Ln, Avon, CT 06001, USA",
  delivery: { formattedAddress: "14 Maple Ln, Avon, CT 06001, USA", setupLat: 41.8102, setupLng: -72.8309, setupNotes: "Backyard, gate on the left", verified: true },
  // The admin's link to the exact address (Block A9), as bookingMapsUrl builds it.
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=41.810200,-72.830900&query_place_id=mock-place-maple",
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
    // Booked before the address was verified: plain address, no map.
    address: "9 Elm St, Farmington",
    delivery: null,
    mapsUrl: null,
    steps: [{ key: "retainer", state: "next" }],
    contract: null,
    retainer: { amount: 210, paid: false, payable: true },
    balance: { amount: 490, dueDate: day(23).slice(0, 10), paid: false, payable: false },
    // Staff made this one by phone: the policy is not accepted yet.
    policyRequired: true,
    policyAccepted: false,
    policyAcceptedAt: null,
    guestCount: 1,
  }),
  // S9c: the same kind of booking after the customer accepted the policy.
  base("bk-held-ok", "Held", 1, [unit("Cotton Candy Machine")], {
    eventDate: day(38),
    steps: [{ key: "retainer", state: "next" }],
    contract: null,
    retainer: { amount: 40, paid: false, payable: true },
    balance: { amount: 160, dueDate: day(31).slice(0, 10), paid: false, payable: false },
    policyRequired: true,
    policyAccepted: true,
    policyAcceptedAt: "2026-11-13T15:02:40.000Z",
    guestCount: 60,
    total: 200,
  }),
  base("bk-requested", "Requested", 2, [unit("Go DJ"), unit("Uplighting", 2)], {
    eventDate: day(45),
    // A verified address with no setup pin: the link shows, no map.
    delivery: { formattedAddress: "228 Ridge Rd, Avon, CT 06001, USA", setupLat: null, setupLng: null, setupNotes: null, verified: true },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=41.809800,-72.830700&query_place_id=mock-place-ridge",
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
  // S7: three wedding bookings; the questionnaire on them is answered by
  // weddingMock.ts under ?mock=wedding (404 under ?mock=portal alone).
  base("bk-wedding-new", "Signed", 2, [unit("Wedding Film, Essential")], {
    eventDate: day(75),
    eventTime: "3 PM",
    steps: [
      { key: "sign", state: "done", at: "2026-10-20T18:20:00.000Z" },
      { key: "retainer", state: "next" },
    ],
    contract: { agreementId: "ag-wed-1", status: "signed", signedAt: "2026-10-20T18:20:00.000Z", pdfUrl: "https://example.com/contracts/mock-signed.pdf" },
    retainer: { amount: 2400, paid: false, payable: true },
    balance: { amount: 5600, dueDate: day(45).slice(0, 10), paid: false, payable: false },
    _signed: true,
  }),
  base("bk-wedding-progress", "Confirmed", 2, [unit("Wedding Film, Dream")], {
    eventDate: day(40),
    eventTime: "3 PM",
    depositPaid: true,
    steps: [
      { key: "sign", state: "done", at: "2026-09-02T15:00:00.000Z" },
      { key: "retainer", state: "done", at: "2026-09-02T15:10:00.000Z" },
      { key: "balance", state: "next" },
    ],
    contract: { agreementId: "ag-wed-2", status: "signed", signedAt: "2026-09-02T15:00:00.000Z", pdfUrl: "https://example.com/contracts/mock-signed.pdf" },
    retainer: { amount: 3700, paid: true, paidAt: "2026-09-02T15:10:00.000Z", payable: false },
    balance: { amount: 8700, dueDate: day(10).slice(0, 10), paid: false, payable: true },
    _signed: true,
  }),
  base("bk-wedding-submitted", "Confirmed", 2, [unit("Wedding Film, Essential")], {
    eventDate: day(90),
    eventTime: "4 PM",
    depositPaid: true,
    steps: [
      { key: "sign", state: "done", at: "2026-09-20T15:00:00.000Z" },
      { key: "retainer", state: "done", at: "2026-09-20T15:10:00.000Z" },
      { key: "balance", state: "next" },
    ],
    contract: { agreementId: "ag-wed-3", status: "signed", signedAt: "2026-09-20T15:00:00.000Z", pdfUrl: "https://example.com/contracts/mock-signed.pdf" },
    retainer: { amount: 2400, paid: true, paidAt: "2026-09-20T15:10:00.000Z", payable: false },
    balance: { amount: 5600, dueDate: day(60).slice(0, 10), paid: false, payable: true },
    _signed: true,
  }),
  // Block S9b: a small rental whose retainer is paid (terms from the policy),
  // and one with a cancellation request already waiting on staff.
  base("bk-small-confirmed", "Confirmed", 1, [unit("Snow Cone Station")], {
    eventDate: day(26),
    depositPaid: true,
    steps: [
      { key: "retainer", state: "done", at: "2026-11-02T15:10:00.000Z" },
      { key: "balance", state: "next" },
    ],
    contract: null,
    retainer: { amount: 45, paid: true, paidAt: "2026-11-02T15:10:00.000Z", payable: false },
    balance: { amount: 180, dueDate: day(19).slice(0, 10), paid: false, payable: true },
    total: 225,
    policyRequired: true,
    policyAccepted: true,
    policyAcceptedAt: "2026-11-02T15:05:00.000Z",
    guestCount: 80,
    // Asked to cancel once and staff said no: the booking is as it was.
    cancellation: { id: "cr-old", status: "declined", requestedAt: "2026-11-09T15:04:11.000Z", decidedAt: "2026-11-10T14:30:00.000Z", reason: "We moved the party." },
  }),
  base("bk-allset", "Confirmed", 1, [unit("Cotton Candy Machine")], {
    eventDate: day(35),
    depositPaid: true,
    steps: [
      { key: "retainer", state: "done", at: "2026-11-02T15:10:00.000Z" },
      { key: "balance", state: "done", at: "2026-11-04T15:10:00.000Z" },
    ],
    contract: null,
    retainer: { amount: 40, paid: true, paidAt: "2026-11-02T15:10:00.000Z", payable: false },
    balance: { amount: 0, dueDate: day(28).slice(0, 10), paid: true, payable: false },
    total: 40,
  }),
  base("bk-cancel-pending", "Confirmed", 1, [unit("Popcorn Machine")], {
    eventDate: day(33),
    depositPaid: true,
    steps: [
      { key: "retainer", state: "done", at: "2026-11-02T15:10:00.000Z" },
      { key: "balance", state: "next" },
    ],
    contract: null,
    retainer: { amount: 30, paid: true, paidAt: "2026-11-02T15:10:00.000Z", payable: false },
    balance: { amount: 120, dueDate: day(26).slice(0, 10), paid: false, payable: true },
    pendingRequest: { type: "cancellation", id: "cr-1", status: "open", requestedAt: new Date().toISOString(), reason: "We moved the party." },
    cancellation: { id: "cr-1", status: "waiting", requestedAt: new Date().toISOString(), decidedAt: null, reason: "We moved the party." },
  }),
  base("bk-done", "Completed", 1, [unit("Snow Cone Station")], { eventDate: day(-14), depositPaid: true, steps: [], retainer: { amount: 60, paid: true, payable: false }, balance: { amount: 140, dueDate: day(-21).slice(0, 10), paid: true, payable: false } }),
  base("bk-cancelled", "Cancelled", 1, [], { eventDate: day(-3), steps: [], retainer: null, balance: null }),
  // S9c: a cancelled booking whose request staff approved.
  base("bk-cancel-approved", "Cancelled", 1, [unit("Test Gladiator Bounce House")], {
    eventDate: day(20),
    steps: [],
    retainer: null,
    balance: null,
    cancellation: { id: "cr-ok", status: "approved", requestedAt: "2026-11-11T15:04:11.000Z", decidedAt: "2026-11-12T14:30:00.000Z", reason: "We moved the party." },
  }),
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
      // Block F1: a small rental is Confirmed the moment its retainer is paid.
      b.stage = b.tier === 1 || b._signed ? "Confirmed" : "Retainer Paid"
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

/* Block F2: the customer's review requests, one in each of the four
   statuses the admin sends, newest first. No total, as on the real call. */
const PROMISE = "We will contact you within 3 business days."
export async function mockRequests(): Promise<ApiResult<CustomerRequests>> {
  await wait()
  const maps = "https://www.google.com/maps/search/?api=1&query=41.810200,-72.830900&query_place_id=mock-place-maple"
  return {
    ok: true,
    data: {
      responseDays: 3,
      promise: PROMISE,
      requests: [
        { id: "dr-received", status: "received", statusLabel: "Received", bookingId: null, createdAt: day(-1), eventDate: day(120).slice(0, 10), eventTime: "4 PM", occasion: "Reception only", address: "14 Maple Ln, Avon, CT 06001, USA", mapsUrl: maps, setupNotes: "Backyard, gate on the left", guestCount: 120, package: null, items: [{ name: "Grand Tent", quantity: 1 }, { name: "Round Tables", quantity: 12 }], addons: [{ itemName: "Grand Tent", groupName: "Sides", addonName: "With walls" }], promise: PROMISE },
        { id: "dr-reviewing", status: "being-reviewed", statusLabel: "Being reviewed", bookingId: null, createdAt: day(-4), eventDate: day(150).slice(0, 10), eventTime: null, occasion: "Wedding", address: "228 Ridge Rd, Avon, CT 06001, USA", mapsUrl: null, setupNotes: null, guestCount: null, package: "Dream Wedding Package", items: [{ name: "Wedding Film, Dream", quantity: 1 }], addons: [], promise: null },
        { id: "dr-booked", status: "booked", statusLabel: "Turned into a booking", bookingId: "bk-held", createdAt: day(-9), eventDate: day(30).slice(0, 10), eventTime: "2 PM", occasion: "Birthday", address: "9 Elm St, Farmington", mapsUrl: null, setupNotes: null, guestCount: 40, package: null, items: [{ name: "Test Gladiator Bounce House", quantity: 1 }], addons: [], promise: null },
        { id: "dr-closed", status: "closed", statusLabel: "Closed", bookingId: null, createdAt: day(-20), eventDate: day(10).slice(0, 10), eventTime: null, occasion: null, address: null, mapsUrl: null, setupNotes: null, guestCount: null, package: null, items: [{ name: "Snow Cone Station", quantity: 2 }], addons: [], promise: null },
      ],
    },
  }
}

/* Block F1: the cancel call. Terms are asked for once anything is paid; the
   text here is made up for the mock (the real wording is the admin's). */
const paidOn = (b: Row) => (b.retainer?.paid ? (b.retainer.amount ?? 0) : 0) + (b.balance?.paid ? (b.balance.amount ?? 0) : 0)
const termsFor = (b: Row): CancelTerms =>
  b.contract
    ? { source: "contract", title: "Your retainer and cancellation terms", text: "The retainer holds your date and is not refundable. If you cancel, GO keeps the retainer. Any other amount you paid is reviewed by our team case by case.\n\nThese are the terms from the contract you signed." }
    : { source: "policy", title: "Cancellation and retainer policy", text: "The retainer holds your date and is not refundable. If you cancel, GO keeps the retainer. Any other amount you paid is reviewed by our team case by case." }
const notChangeable = (b: Row) =>
  b.stage === "Cancelled" ? "This booking was cancelled." : b.stage === "Released" ? "This hold was released because it wasn't confirmed in time." : b.stage === "Completed" ? "This booking already happened." : null

export async function mockCancelInfo(id: string): Promise<ApiResult<CancelInfo>> {
  await wait()
  const b = rows.find((r) => r.id === id)
  if (!b) return { ok: false, status: 404, message: "booking not found" }
  const why = notChangeable(b)
  if (why) return { ok: false, status: 409, message: why }
  const paid = paidOn(b)
  return {
    ok: true,
    data: {
      paid,
      retainerPaid: b.retainer?.paid === true,
      termsRequired: paid > 0,
      terms: paid > 0 ? termsFor(b) : null,
      pendingRequest: b.pendingRequest ? { id: b.pendingRequest.id, status: "open", requestedAt: b.pendingRequest.requestedAt, reason: b.pendingRequest.reason } : null,
    },
  }
}

export async function mockRequestCancel(id: string, body: { reason: string; acceptTerms: boolean }): Promise<ApiResult<CancelAsked>> {
  await wait()
  const b = rows.find((r) => r.id === id)
  if (!b) return { ok: false, status: 404, message: "booking not found" }
  const why = notChangeable(b)
  if (why) return { ok: false, status: 409, message: why }
  const paid = paidOn(b)
  if (paid > 0 && body.acceptTerms !== true) {
    return { ok: false, status: 409, reason: "terms-required", message: "A retainer has been paid on this booking. Read and accept the retainer terms to ask to cancel, or call or text GO." }
  }
  if (!b.pendingRequest) {
    const at = new Date().toISOString()
    b.pendingRequest = { type: "cancellation", id: `cr-${id}`, status: "open", requestedAt: at, reason: body.reason || null }
    b.cancellation = { id: `cr-${id}`, status: "waiting", requestedAt: at, decidedAt: null, reason: body.reason || null }
  }
  return { ok: true, data: { ...strip(b), paid, terms: paid > 0 ? termsFor(b) : null, message: "We got your request to cancel. Your booking is still in place until our team reviews it, and we will email you with the outcome." } }
}

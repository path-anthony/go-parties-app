import { reasonText, type BidGig, type BidLoad, type BidResult } from "@/lib/bidApi"

/* Fixtures for the crew gig page, DEV only. bidApi imports this dynamically
   behind `import.meta.env.DEV && token.startsWith("mock-")`, so a production
   build never contains it. State lives in memory: mutations change the
   fixture so the flow can be clicked through, and a reload resets it.

   Tokens: mock-open, mock-submitted, mock-accepted, mock-not-selected,
   mock-expired, mock-declined (one state each). Two extras exercise the
   refusals: mock-deadline (open; a bid comes back deadline-passed and the gig
   turns expired) and mock-filled (open; a bid comes back already-filled and
   the gig turns not_selected). Anything else after "mock-" is an unknown
   link. */

const hours = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString()

const BASE: BidGig = {
  state: "open",
  role: "DJ",
  eventType: "Kids birthday",
  guestCount: 40,
  eventDate: "2026-10-17",
  startTime: "1 PM",
  endTime: "5 PM",
  town: "Avon",
  payRange: { min: 250, max: 350 },
  deadlineAt: hours(30),
  myBid: null,
  address: null,
  arrivalNotes: null,
  contactPhone: null,
  crewFirstName: null,
  confirmedAt: null,
  questions: [],
}

const FIXTURES: Record<string, () => BidGig> = {
  "mock-open": () => ({ ...BASE }),
  "mock-deadline": () => ({ ...BASE }),
  "mock-filled": () => ({ ...BASE }),
  "mock-submitted": () => ({ ...BASE, state: "bid_submitted", myBid: { amount: 300, note: "Bringing my own speakers.", submittedAt: hours(-2) } }),
  "mock-accepted": () => ({
    ...BASE,
    state: "accepted",
    myBid: { amount: 300, note: null, submittedAt: hours(-20) },
    address: "14 Maple Ln, Avon, CT 06001",
    arrivalNotes: "Park on the street. Load in through the side gate. Ask for Dana.",
    contactPhone: "860-555-0142",
    crewFirstName: "Jordan",
    confirmedAt: null,
    questions: [{ text: "Is there power near the patio?", createdAt: hours(-5) }],
  }),
  "mock-not-selected": () => ({ ...BASE, state: "not_selected", myBid: { amount: 300, note: null, submittedAt: hours(-30) } }),
  "mock-expired": () => ({ ...BASE, state: "expired", deadlineAt: hours(-6) }),
  "mock-declined": () => ({ ...BASE, state: "declined" }),
}

const store = new Map<string, BidGig>()

function get(token: string): BidGig | null {
  if (!store.has(token)) {
    const make = FIXTURES[token]
    if (!make) return null
    store.set(token, make())
  }
  return store.get(token) ?? null
}

const wait = () => new Promise((r) => setTimeout(r, 350))

export async function mockLoad(token: string): Promise<BidLoad> {
  await wait()
  const gig = get(token)
  return gig ? { kind: "ok", gig: structuredClone(gig) } : { kind: "invalid" }
}

const fail = (reason: "deadline-passed" | "already-filled" | "bid-invalid" | "not-open"): BidResult<never> => ({
  ok: false,
  reason,
  message: reasonText(reason),
})

export async function mockSubmit(token: string, body: { amount: number; note: string | null }): Promise<BidResult<BidGig>> {
  await wait()
  const gig = get(token)
  if (!gig) return fail("not-open")
  if (gig.state !== "open" && gig.state !== "bid_submitted") return fail("not-open")
  if (!Number.isInteger(body.amount) || body.amount < 1) return fail("bid-invalid")
  if (token === "mock-deadline") {
    gig.state = "expired"
    return fail("deadline-passed")
  }
  if (token === "mock-filled") {
    gig.state = "not_selected"
    return fail("already-filled")
  }
  gig.state = "bid_submitted"
  gig.myBid = { amount: body.amount, note: body.note, submittedAt: new Date().toISOString() }
  return { ok: true, data: structuredClone(gig) }
}

export async function mockDecline(token: string): Promise<BidResult<BidGig>> {
  await wait()
  const gig = get(token)
  if (!gig || (gig.state !== "open" && gig.state !== "bid_submitted")) return fail("not-open")
  gig.state = "declined"
  return { ok: true, data: structuredClone(gig) }
}

export async function mockConfirm(token: string): Promise<BidResult<{ confirmedAt: string }>> {
  await wait()
  const gig = get(token)
  if (!gig || gig.state !== "accepted") return fail("not-open")
  gig.confirmedAt = gig.confirmedAt ?? new Date().toISOString()
  return { ok: true, data: { confirmedAt: gig.confirmedAt } }
}

export async function mockQuestion(token: string, text: string): Promise<BidResult<{ ok: true }>> {
  await wait()
  const gig = get(token)
  if (!gig || gig.state !== "accepted") return fail("not-open")
  gig.questions.push({ text, createdAt: new Date().toISOString() })
  return { ok: true, data: { ok: true } }
}

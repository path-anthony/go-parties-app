import type { Availability, DirectBooking, DirectResult, PublicItem } from "@/lib/adminApi"
import { BLANK, FULL } from "@/lib/contractMock"
import { mockMode } from "@/lib/mock"
import { MOCK_SECRET } from "@/lib/paymentMockState"
import { sessionIdOf } from "@/lib/paymentApi"
import type { TierInfo, TierInput, TierResult } from "@/lib/tierApi"

/* Checkout fixtures, DEV only (loaded lazily behind import.meta.env.DEV).
   `?mock=<name>` picks the scenario for the tab:
     tier1          a policy-check booking, retainer payable after the hold
     tier1-nopay    the same, but the admin offers no online payment (null)
     tier2          a crewed booking: the contract quote (a fake wedding), signed in checkout
     tier2-expired  tier 2 whose first hold is refused quote-expired (the next quote is fresh)
     tier2-changed  tier 2 whose first hold is refused contract-changed
     tier2-retier   tier 2 whose first hold is refused tier-changed; the cart is tier 1 after that
     tier3          a review booking: the hold answers 202
   Nothing here touches the admin. */

const POLICY = {
  version: 3,
  text: "Rental policy. Equipment is yours for the day booked. Keep it dry, keep it on level ground, and keep kids supervised while it is in use. You are responsible for damage beyond normal wear. Cancel more than 7 days out and the hold is released with nothing owed.",
}

const endOfDayEastern = () => {
  const now = new Date()
  const d = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  d.setHours(23, 59, 59, 0)
  return new Date(now.getTime() + (d.getTime() - new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" })).getTime())).toISOString()
}

let hashRound = 1
let refusedOnce = false
let retiered = false

const quoteDocument = () => ({
  ...structuredClone(FULL),
  client: structuredClone(BLANK.client),
  header: { ...FULL.header, confirmByDate: "Friday, October 30, 2026" },
  signatures: { client: null, additional: null, go: { printedName: "Sam Representative", signedAt: new Date().toISOString() } },
})

function tierFor(scenario: string, input: TierInput): TierInfo {
  const base = { reasons: [] as string[], policy: null, contract: null, quoteExpiresAt: endOfDayEastern() }
  if (scenario === "tier3") return { ...base, tier: 3, reasons: ["review-occasion"], total: 18400, retainerPercent: 30, retainerAmount: 5520 }
  if (scenario.startsWith("tier2") && !(scenario === "tier2-retier" && retiered)) {
    return {
      ...base,
      tier: 2,
      reasons: ["crewed"],
      total: 3330,
      retainerPercent: 30,
      retainerAmount: 999,
      contract: { quoteId: `q_mock_${hashRound}`, contentHash: `mock-hash-${hashRound}`, termsVersion: 1, format: "go-v2", document: quoteDocument() },
    }
  }
  const n = Math.max(1, input.itemIds.length)
  return { ...base, tier: 1, policy: POLICY, total: 1499 * n, retainerPercent: 30, retainerAmount: Math.round(1499 * n * 0.3 * 100) / 100 }
}

export async function mockTier(input: TierInput): Promise<TierResult> {
  await new Promise((r) => setTimeout(r, 250))
  return { ok: true, tier: tierFor(mockMode("checkout") ?? "tier1", input) }
}

export async function mockHold(input: { itemIds: string[]; eventDate: string; eventTime: string | null; address: string | null; customerName: string | null; tier: number | null; signature: { contentHash: string } | null }): Promise<DirectResult> {
  await new Promise((r) => setTimeout(r, 400))
  const scenario = mockMode("checkout") ?? "tier1"
  const refuse = (reason: "quote-expired" | "contract-changed" | "tier-changed"): DirectResult => ({
    ok: false,
    reason,
    message: "Your cart or the contract changed. Please read it again.",
  })
  if (scenario === "tier3") {
    return { ok: true, kind: "review", review: { designRequestId: "dr_mock", eventDate: input.eventDate, total: 18400, message: "This one goes to our team first." } }
  }
  if (scenario === "tier2-expired" && !refusedOnce) {
    refusedOnce = true
    hashRound += 1
    return refuse("quote-expired")
  }
  if (scenario === "tier2-changed" && !refusedOnce) {
    refusedOnce = true
    hashRound += 1
    return refuse("contract-changed")
  }
  if (scenario === "tier2-retier" && !retiered) {
    retiered = true
    return refuse("tier-changed")
  }
  const tier = scenario.startsWith("tier2") && !retiered ? 2 : 1
  if (tier === 2 && input.signature?.contentHash !== `mock-hash-${hashRound}`) return refuse("contract-changed")
  const total = tier === 2 ? 3330 : 1499 * Math.max(1, input.itemIds.length)
  const retainer = Math.round(total * 0.3 * 100) / 100
  const booking: DirectBooking = {
    bookingId: "bk_mock",
    leadId: "ld_mock",
    eventDate: input.eventDate,
    status: "Confirmed",
    stage: tier === 2 ? "Requested" : "Held",
    depositPaid: false,
    total,
    addonsTotal: 0,
    addons: [],
    packageId: null,
    package: null,
    items: input.itemIds.map((id, i) => ({ id, name: tier === 2 ? ["Go DJ", "Uplighting", "Sound System"][i % 3] : "Test Gladiator Bounce House", unit: { id: `u${i}`, label: `Unit #${i + 1}` } })),
    tier,
    payment: scenario === "tier1-nopay" ? null : { kind: "retainer", amount: retainer, clientSecret: MOCK_SECRET, sessionId: sessionIdOf(MOCK_SECRET) },
    contract: tier === 2 ? { agreementId: "ag_mock", signed: true, signedAt: new Date().toISOString(), pdfUrl: "https://example.com/contracts/mock-signed.pdf" } : null,
  }
  return { ok: true, kind: "held", booking }
}

/* A small catalog so Browse works with no admin: one physical item (tier 1
   territory) and two crewed ones. Every item is open on every date. */
const ITEMS: PublicItem[] = [
  { id: "it-bounce", name: "Test Gladiator Bounce House", category: "Bounce House", price: 700, priceUnit: "per day", photoUrl: null, hasUnits: true, freeUnits: 1, addonGroups: [] },
  { id: "it-dj", name: "Go DJ", category: "DJ and MC", price: 1800, priceUnit: "per event", photoUrl: null, hasUnits: true, freeUnits: 2, addonGroups: [] },
  { id: "it-uplight", name: "Uplighting", category: "Lighting and Decor", price: 450, priceUnit: "per event", photoUrl: null, hasUnits: true, freeUnits: 4, addonGroups: [] },
]

export async function mockPublicItems(q: string, category: string): Promise<{ items: PublicItem[]; categories: string[] }> {
  await new Promise((r) => setTimeout(r, 150))
  const items = ITEMS.filter((i) => (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase())) && (!category || i.category === category))
  return { items, categories: [...new Set(ITEMS.map((i) => i.category))] }
}

export async function mockAvailability(itemId: string, date: string): Promise<Availability> {
  await new Promise((r) => setTimeout(r, 150))
  const item = ITEMS.find((i) => i.id === itemId)
  return { itemId, date, directBooking: true, available: true, freeUnits: item?.freeUnits ?? 1, totalUnits: item?.freeUnits ?? 1 }
}

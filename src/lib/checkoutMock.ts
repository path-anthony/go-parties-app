import type { Availability, DirectBooking, DirectResult, PublicItem, PublicPackage } from "@/lib/adminApi"
import { PHONE_HINT } from "@/lib/phone"
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
     tier1-taken    tier 1 whose first hold is refused (409 unavailable, the admin's own words); the next one holds
     tier1-account  tier 1 whose first hold is refused 401 account-required (S3); the next one holds
   Block S9a: Browse and Home carry two packages (a fixed one and a per-guest
   one, 25 to 100 guests), the tier answer for tier 3 carries responseDays 3,
   the hold logs the guest count, the same-as-home tick and the setup pin, a
   phone of 860 555 0123 is refused 400 phone-invalid (sign in with "serverphone"
   in the email), and a hold with a wedding occasion makes a wedding booking.
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
  const base = { reasons: [] as string[], policy: null, contract: null, quoteExpiresAt: endOfDayEastern(), responseDays: null }
  if (scenario === "tier3") return { ...base, tier: 3, reasons: ["threshold"], total: 18400, retainerPercent: 30, retainerAmount: 5520, responseDays: 3 }
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
  const total = input.packageId === PER_GUEST_ID && input.guestCount ? PER_GUEST_BASE + PER_GUEST_RATE * input.guestCount : 1499 * n
  return { ...base, tier: 1, policy: POLICY, total, retainerPercent: 30, retainerAmount: Math.round(total * 0.3 * 100) / 100 }
}

/* Block A8: the per-guest package's rule, as the admin's packagePrice states it. */
const PER_GUEST_ID = "pkg-perguest"
const PER_GUEST_RATE = 12
const PER_GUEST_BASE = 150
const guestRefusal = (packageId: string | null | undefined, guestCount: number | null | undefined) => {
  if (packageId !== PER_GUEST_ID) return null
  if (!guestCount) return { reason: "guest-count-required", message: "Tell us how many guests, so we can price this package." }
  if (guestCount < 25 || guestCount > 100) return { reason: "guest-count-range", message: "This package is for 25 to 100 guests." }
  return null
}

export async function mockTier(input: TierInput): Promise<TierResult> {
  await new Promise((r) => setTimeout(r, 250))
  console.debug("mock tier body", JSON.stringify({ packageId: input.packageId, guestCount: input.guestCount ?? null }))
  const refusal = guestRefusal(input.packageId, input.guestCount)
  if (refusal) return { ok: false, message: refusal.message, reason: refusal.reason }
  if (input.address || input.placeId) console.debug("mock tier address", JSON.stringify({ placeId: input.placeId ?? null, address: input.address ?? null }))
  if (input.placeId === "mock-place-refused") return { ok: false, message: NOT_EXACT, reason: "address-not-exact", field: "address" }
  return { ok: true, tier: tierFor(mockMode("checkout") ?? "tier1", input) }
}

/* The admin's refusal of a vague address (Block A9), word for word. */
const NOT_EXACT = "We couldn't find that exact address. Pick it from the suggestions, or check the street number."

/* The mock admin's address rule: an exact address has a street number, and
   the fixture "3 Refused Rd" is one it refuses anyway (to walk the red line
   after a pick). */
const vague = (text: string | null | undefined) => !!text && (!/\d/.test(text) || /refused/i.test(text))

let wedding = false
/* Block S9a: whether the last mock hold was a wedding, which is what gives
   "bk_mock" a wedding details form (weddingMock.ts reads this). */
export const mockIsWedding = () => wedding

export async function mockHold(input: { occasion?: string | null; itemIds: string[]; packageId?: string | null; eventDate: string; eventTime: string | null; address: string | null; homeAddress?: string | null; delivery: unknown; customerName: string | null; phone?: string | null; guestCount?: number | null; eventAddressSameAsHome?: boolean | null; tier: number | null; signature: { contentHash: string } | null }): Promise<DirectResult> {
  await new Promise((r) => setTimeout(r, 400))
  console.debug("mock hold delivery", JSON.stringify(input.delivery))
  console.debug("mock hold occasion", JSON.stringify(input.occasion ?? null))
  console.debug("mock hold extras", JSON.stringify({ guestCount: input.guestCount ?? null, eventAddressSameAsHome: input.eventAddressSameAsHome ?? null, packageId: input.packageId ?? null }))
  if (input.phone && input.phone.replace(/\D/g, "") === "8605550123") return { ok: false, reason: "phone-invalid", message: PHONE_HINT, field: "phone" }
  const guests = guestRefusal(input.packageId, input.guestCount)
  if (guests) return { ok: false, reason: "guest-count", message: guests.message, field: "guestCount" }
  wedding = /wedding|rehearsal|reception/i.test(input.occasion ?? "")
  const placeId = (input.delivery as { placeId?: string } | null)?.placeId ?? null
  console.debug("mock hold address", JSON.stringify({ placeId, address: input.address, homeAddress: input.homeAddress ?? null }))
  if (input.homeAddress && vague(input.homeAddress)) return { ok: false, reason: "address-not-exact", message: NOT_EXACT, field: "homeAddress" }
  if (placeId === "mock-place-refused" || (!input.delivery && vague(input.address))) return { ok: false, reason: "address-not-exact", message: NOT_EXACT, field: "address" }
  const scenario = mockMode("checkout") ?? "tier1"
  const refuse = (reason: "quote-expired" | "contract-changed" | "tier-changed"): DirectResult => ({
    ok: false,
    reason,
    message: "Your cart or the contract changed. Please read it again.",
  })
  if (scenario === "tier3") {
    return { ok: true, kind: "review", review: { designRequestId: "dr_mock", eventDate: input.eventDate, total: 18400, responseDays: 3, message: "This one goes to our team first." } }
  }
  if (scenario === "tier1-account" && !refusedOnce) {
    refusedOnce = true
    return { ok: false, reason: "account-required", message: "Please sign in or create an account to book." }
  }
  if (scenario === "tier1-taken" && !refusedOnce) {
    refusedOnce = true
    return { ok: false, reason: "unavailable", message: "Test Gladiator Bounce House is booked solid that day. Pick another date." }
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
  // S5: the admin's category names, a description on one item, a per
  // hour unit, and one item priced on request (null price).
  { id: "it-bounce", name: "Test Gladiator Bounce House", category: "Bounce Houses", price: 700, priceUnit: "per day", description: "Two lanes, a climb and a slide. Fits a 20 by 20 yard with room to spare.", photoUrl: null, hasUnits: true, freeUnits: 1, addonGroups: [] },
  { id: "it-dj", name: "Go DJ", category: "DJ and AV", price: 1800, priceUnit: "per event", description: null, photoUrl: null, hasUnits: true, freeUnits: 2, addonGroups: [] },
  { id: "it-bartender", name: "Test Bartender", category: "Bar and Cigar", price: 45, priceUnit: "per hour", description: null, photoUrl: null, hasUnits: true, freeUnits: 3, addonGroups: [] },
  { id: "it-trailer", name: "Test Cigar Lounge Trailer", category: "Bar and Cigar", price: null, priceUnit: "per event", description: "The mobile lounge, cigars and a cigarist. Priced per party.", photoUrl: null, hasUnits: true, freeUnits: 1, addonGroups: [] },
  {
    id: "it-uplight",
    name: "Uplighting",
    category: "Lighting and Decor",
    price: 450,
    priceUnit: "per event",
    photoUrl: null,
    hasUnits: true,
    freeUnits: 4,
    // Block A3 shapes: a "one" group and a "many" group with a limit.
    addonGroups: [
      { id: "g-color", name: "Color", required: true, selectMode: "one", maxSelect: null, addons: [{ id: "a-amber", name: "Amber", priceDelta: 0 }, { id: "a-blue", name: "Blue", priceDelta: 0 }, { id: "a-pink", name: "Pink", priceDelta: 25 }] },
      { id: "g-extras", name: "Extras", required: false, selectMode: "many", maxSelect: 2, addons: [{ id: "a-gobo", name: "Gobo monogram", priceDelta: 150 }, { id: "a-stand", name: "Extra stands", priceDelta: 40 }, { id: "a-wash", name: "Wall wash", priceDelta: 60 }] },
    ],
  },
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

/* Block S9a: a fixed package and a per-guest one, so Home shows both and the
   cart asks for a guest count on the second. The items are the mock catalog's. */
export async function mockPackages(): Promise<PublicPackage[]> {
  await new Promise((r) => setTimeout(r, 150))
  const item = (itemId: string, name: string, category: string, price: number, quantity = 1) => ({ itemId, name, category, price, priceUnit: "per event", quantity, addonGroups: [] })
  return [
    { id: "pkg-fixed", name: "Backyard Bash", description: null, price: 899, theme: null, tag: "Most booked", guestNote: "Up to 25 kids", occasion: "Birthday", photoUrl: null, pricingMode: "fixed", items: [item("it-bounce", "Test Gladiator Bounce House", "Bounce Houses", 700)] },
    { id: PER_GUEST_ID, name: "Taco Night", description: null, price: PER_GUEST_RATE, theme: null, tag: null, guestNote: null, occasion: "Birthday", photoUrl: null, pricingMode: "per_guest", basePrice: PER_GUEST_BASE, minGuests: 25, maxGuests: 100, items: [item("it-bartender", "Test Bartender", "Bar and Cigar", 45), item("it-dj", "Go DJ", "DJ and AV", 1800)] },
  ]
}

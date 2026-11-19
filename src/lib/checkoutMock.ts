import type { Availability, DirectBooking, DirectResult, PublicItem, PublicPackage } from "@/lib/adminApi"
import { PHONE_HINT } from "@/lib/phone"
import { BLANK, FULL } from "@/lib/contractMock"
import { mockMode } from "@/lib/mock"
import { MOCK_SECRET } from "@/lib/paymentMockState"
import { sessionIdOf } from "@/lib/paymentApi"
import type { TierInfo, TierInput, TierResult } from "@/lib/tierApi"
import type { PublicSettings } from "@/lib/settings"
import { isPerGuestUnit } from "@/lib/pricing"
import { refusedItems } from "@/lib/refusals"

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
   Block FIX1: the catalog adds a per-guest item (Mediterranean Spread,
   $58.56 per guest, no unit), a per-guest item booked out every day (Taco
   Bar), Gold Chiavari Chair (10 units, 7 free, so 8 is refused with the
   admin's "only 7 of ... are free" and `short`), the Waterslide for search,
   and 30 small items for a big cart. The tier answer prices by the admin's
   rule and carries `lines`; a per-guest item with no guest count is refused
   guest-count-required; more than 40 items is refused too-many-items.
   mockSettings stands in for GET /api/settings/public.
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
  const base = { reasons: [] as string[], lines: [], guestCount: null, policy: null, contract: null, quoteExpiresAt: endOfDayEastern(), responseDays: null }
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
  const priced = priceMock(input.itemIds, input.quantities ?? null, input.guestCount ?? null)
  const total = input.packageId === PER_GUEST_ID && input.guestCount ? PER_GUEST_BASE + PER_GUEST_RATE * input.guestCount : priced.total
  return { ...base, tier: 1, lines: priced.lines, guestCount: input.guestCount ?? null, policy: POLICY, total, retainerPercent: 30, retainerAmount: Math.round(total * 0.3 * 100) / 100 }
}

/* The admin's pricing rule over the mock catalog (S9-CONTRACT section 18). */
function priceMock(ids: string[], quantities: Record<string, number> | null, guests: number | null) {
  const lines = ids.map((id) => {
    const it = ITEMS.find((i) => i.id === id)
    const perGuest = isPerGuestUnit(it?.priceUnit)
    const quantity = perGuest ? 1 : (quantities?.[id] ?? 1)
    const price = it?.price ?? null
    const lineTotal = price === null ? null : Math.round(price * (perGuest ? (guests ?? 0) : quantity) * 100) / 100
    return { itemId: id, name: it?.name ?? id, perGuest, quantity, guests: perGuest ? guests : null, unitPrice: price, lineTotal }
  })
  return { lines, total: Math.round(lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0) * 100) / 100 }
}

/* The refusals the admin makes before pricing (sections 19 and 20). */
function cartRefusal(ids: string[], guests: number | null | undefined): { reason: string; message: string; field?: string } | null {
  if (ids.length > MAX_ITEMS) return { reason: "too-many-items", message: `A booking can have up to ${MAX_ITEMS} items. Remove some, or call or text us and we'll put it together with you.` }
  const per = ids.map((id) => ITEMS.find((i) => i.id === id)).filter((i) => i && isPerGuestUnit(i.priceUnit)).map((i) => i!.name)
  if (per.length > 0 && !guests) return { reason: "guest-count-required", field: "guestCount", message: `Tell us how many guests, so we can price ${per.join(" and ")}. ${per.length === 1 ? "It is" : "They are"} priced per guest.` }
  return null
}
const MAX_ITEMS = 40

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
  console.debug("mock tier quantities", JSON.stringify({ quantities: input.quantities ?? null, guestCount: input.guestCount ?? null }))
  const refusal = guestRefusal(input.packageId, input.guestCount) ?? cartRefusal(input.itemIds, input.guestCount)
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

export async function mockHold(input: { quantities?: Record<string, number> | null; occasion?: string | null; itemIds: string[]; packageId?: string | null; eventDate: string; eventTime: string | null; address: string | null; homeAddress?: string | null; delivery: unknown; customerName: string | null; phone?: string | null; guestCount?: number | null; eventAddressSameAsHome?: boolean | null; tier: number | null; signature: { contentHash: string } | null }): Promise<DirectResult> {
  await new Promise((r) => setTimeout(r, 400))
  console.debug("mock hold delivery", JSON.stringify(input.delivery))
  console.debug("mock hold occasion", JSON.stringify(input.occasion ?? null))
  console.debug("mock hold extras", JSON.stringify({ guestCount: input.guestCount ?? null, eventAddressSameAsHome: input.eventAddressSameAsHome ?? null, packageId: input.packageId ?? null }))
  if (input.phone && input.phone.replace(/\D/g, "") === "8605550123") return { ok: false, reason: "phone-invalid", message: PHONE_HINT, field: "phone" }
  console.debug("mock hold quantities", JSON.stringify({ quantities: input.quantities ?? null, guestCount: input.guestCount ?? null }))
  const guests = guestRefusal(input.packageId, input.guestCount) ?? cartRefusal(input.itemIds, input.guestCount)
  if (guests) return { ok: false, reason: guests.reason === "too-many-items" ? "error" : "guest-count", message: guests.message, field: "guestCount" }
  // Block FIX1: more chairs than are free, and a per-guest item booked out.
  const asked = input.quantities?.["it-chair"] ?? 1
  if (input.itemIds.includes("it-chair") && asked > CHAIR_FREE) {
    return { ok: false, reason: "unavailable", message: `Not enough free that date: only ${CHAIR_FREE} of Gold Chiavari Chair are free (you asked for ${asked}). Nothing was booked.`, refusedNames: refusedItems({ reason: "unavailable", error: `Not enough free that date: only ${CHAIR_FREE} of Gold Chiavari Chair are free (you asked for ${asked}). Nothing was booked.`, unavailable: ["Gold Chiavari Chair"], short: [{ name: "Gold Chiavari Chair", asked, free: CHAIR_FREE }] }) ?? undefined }
  }
  if (input.itemIds.includes("it-taco")) {
    const said = "Taco Bar is fully booked that day, so nothing was booked. Drop it or try another date."
    return { ok: false, reason: "unavailable", message: said, refusedNames: refusedItems({ reason: "unavailable", error: said, unavailable: ["Taco Bar"] }) ?? undefined }
  }
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
  const total = tier === 2 ? 3330 : priceMock(input.itemIds, input.quantities ?? null, input.guestCount ?? null).total
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

// Block FIX1 fixtures.
const CHAIR_FREE = 7
ITEMS.push(
  { id: "it-spread", name: "Mediterranean Spread", category: "Catering", price: 58.56, priceUnit: "per guest", description: "Hummus, tabbouleh, grilled chicken and warm pita.", photoUrl: null, hasUnits: false, freeUnits: 999, addonGroups: [] },
  { id: "it-taco", name: "Taco Bar", category: "Catering", price: 14, priceUnit: "per guest", description: "Booked out every day in this fixture: the daily maximum is reached.", photoUrl: null, hasUnits: false, freeUnits: 0, addonGroups: [] },
  { id: "it-chair", name: "Gold Chiavari Chair", category: "Venue Essentials", price: 8, priceUnit: "each", description: null, photoUrl: null, hasUnits: true, freeUnits: CHAIR_FREE, addonGroups: [] },
  { id: "it-slide", name: "Big Wave Single Lane Waterslide", category: "Inflatables", price: 425, priceUnit: "per day", description: "A tall single lane water slide with a splash pool.", photoUrl: null, hasUnits: true, freeUnits: 1, addonGroups: [] },
  { id: "it-cups", name: "Snow Cone Cups", category: "Fun Foods", price: 30, priceUnit: "per 10 guests", description: "Sold in tens, by quantity.", photoUrl: null, hasUnits: true, freeUnits: 20, addonGroups: [] },
  ...Array.from({ length: 30 }, (_, i): PublicItem => ({ id: `it-small-${i + 1}`, name: `Test Table Linen ${i + 1}`, category: "Lighting and Decor", price: 12, priceUnit: "each", description: null, photoUrl: null, hasUnits: true, freeUnits: 5, addonGroups: [] }))
)
const TOTAL_UNITS: Record<string, number> = { "it-chair": 10, "it-spread": 999, "it-taco": 999, ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`it-small-${i + 1}`, 7])) }

export async function mockSettings(): Promise<PublicSettings> {
  await new Promise((r) => setTimeout(r, 100))
  return {
    minBookingNoticeHours: 72,
    rushContactPhone: "(860) 555-0100",
    companyPhone: "(860) 555-0100",
    policy: { version: 4, text: "A retainer of {{retainerPercent}}% of your total holds your date." },
    policyFilled: "A retainer of 30% of your total holds your date. The balance is due 30 days before your event.",
    tokens: { minBookingNoticeHours: 72, retainerPercent: 30, depositPercentage: 30, balanceDueDays: 30, cancellationWindowDays: 30, rescheduleFeePercent: 20, maxItemsPerBooking: MAX_ITEMS, requestResponseDays: 2 },
  }
}

export async function mockPublicItems(q: string, category: string): Promise<{ items: PublicItem[]; categories: string[] }> {
  await new Promise((r) => setTimeout(r, 150))
  const items = ITEMS.filter((i) => (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase())) && (!category || i.category === category))
  return { items, categories: [...new Set(ITEMS.map((i) => i.category))] }
}

export async function mockAvailability(itemId: string, date: string): Promise<Availability> {
  await new Promise((r) => setTimeout(r, 150))
  const item = ITEMS.find((i) => i.id === itemId)
  // The chair answers 10 free here and only 7 at the hold: someone booked
  // three between the date check and the hold, which is the case the hold's
  // own refusal (409 with `short`) is for.
  const free = itemId === "it-chair" ? 10 : (item?.freeUnits ?? 1)
  return { itemId, date, directBooking: true, available: free > 0, freeUnits: free, totalUnits: TOTAL_UNITS[itemId] ?? free }
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

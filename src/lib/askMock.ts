import { loadCatalog } from "@/lib/storeCatalog"
import type { RecommendItem } from "@/state/ask"
import { isPerGuestUnit } from "@/lib/pricing"

/* Ask GO fixture, DEV only and loaded lazily behind import.meta.env.DEV:
   `?mock=ask` answers POST /api/recommend without the AI, the way the admin
   does since Block FIX1 (S9-CONTRACT section 21): it reads the cart it is
   sent and says what it did to it in `cartAction`.
     first message          a question (budget), cart untouched (none)
     second message         adds a lineup to whatever is in the cart (add);
                            the whole cart comes back in `items`
     "rain", "power",
     "deliver", "space"     a question: an answer, the cart untouched (none)
     "under $"              keeps the three cheapest (replace)
     "add a dj"             adds one item (add)
     "book it", "empty"     no suggestions, the cart untouched
   `occasion` is what the customer's own words describe ("team building",
   "graduation", "birthday", "wedding"), from the whole conversation.
   Totals follow the pricing rule: per-guest items x the guest count, and
   `guestCountNeeded` when there is a per-guest item and no count.
   Block G1: every reply carries `suggestions`. mockStarters answers GET
   /api/recommend/starters; add ?starters=none to the address for a failed
   call (no buttons). */
export async function mockStarters(): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 300))
  if (new URLSearchParams(window.location.search).get("starters") === "none") return []
  return ["Backyard birthday for 20 kids", "40th birthday for 40 guests", "Company picnic for 100", "Wedding reception for 120"]
}

type Body = { messages: { role: string; content: string }[]; cart: { itemId: string; quantity?: number }[]; guestCount?: number }
type Reply = {
  ready: boolean
  message: string
  cartAction: "none" | "add" | "remove" | "replace"
  items?: (Partial<RecommendItem> & { id: string; quantity?: number })[]
  added?: string[]
  removed?: string[]
  total?: number | null
  guestCount?: number | null
  guestCountNeeded?: boolean
  occasion?: string | null
  suggestConcierge?: boolean
  suggestions: string[]
}

const OCCASIONS: [RegExp, string][] = [
  [/team building/i, "Team building"],
  [/graduat/i, "Graduation"],
  [/wedding/i, "Wedding"],
  [/birthday/i, "Birthday"],
  [/picnic|company/i, "Company picnic"],
]

// The occasion the customer's own words describe, newest first.
const occasionOf = (msgs: Body["messages"]): string | null => {
  for (const m of [...msgs].reverse()) {
    if (m.role !== "user") continue
    for (const [re, name] of OCCASIONS) if (re.test(m.content)) return name
  }
  return null
}

// "for 60", "60 guests", "60 people"
const guestsIn = (msgs: Body["messages"]): number | null => {
  for (const m of [...msgs].reverse()) {
    if (m.role !== "user") continue
    const g = m.content.match(/\b(\d{1,4})\s*(guests|people|kids|adults)\b/i) ?? m.content.match(/\bfor\s+(\d{1,4})\b/i)
    if (g) return Number(g[1])
  }
  return null
}

export async function mockRecommend(body: Body): Promise<Reply> {
  await new Promise((r) => setTimeout(r, 600))
  console.debug("mock ask body", JSON.stringify({ subOcc: (body as { subOcc?: unknown }).subOcc ?? null, cart: body.cart, guestCount: body.guestCount ?? null }))
  const msgs = body.messages
  const turns = msgs.filter((m) => m.role === "user").length
  const last = msgs[msgs.length - 1]?.content.toLowerCase() ?? ""
  const occasion = occasionOf(msgs)
  const chatGuests = guestsIn(msgs)
  const guests = body.guestCount ?? chatGuests
  const base = { occasion, guestCount: guests, suggestConcierge: false }

  // A question: the cart is left exactly as it is.
  if (/rain|power|deliver|space|weather/.test(last)) {
    return { ...base, ready: false, cartAction: "none", message: "If rain is in the forecast you can move the date for free until the crew leaves. Inflatables need a dry, level spot and one outlet within 50 feet.", suggestions: ["Does it need power", "Looks good, book it"] }
  }
  if (/talk|a person|call me/.test(last)) return { ...base, ready: false, cartAction: "none", suggestConcierge: true, message: "Happy to put you with our team. Grab a time below.", suggestions: [] }
  if (/book it|empty/.test(last)) return { ...base, ready: false, cartAction: "none", message: "Great. Open your cart and press Book this party when you're ready.", suggestions: [] }
  if (turns === 1) {
    return { ...base, ready: false, cartAction: "none", message: "Sounds fun. Is there a budget in mind?", suggestions: ["Under $1000", "$2000 to $5000", "$5000 and up", "Not sure yet, a few extra long ones to test wrapping on a phone"] }
  }

  // With no admin running the catalog never answers: after a moment a small
  // fixed lineup stands in so the chat can still be clicked through.
  const fallback: RecommendItem[] = [
    { id: "mock-1", name: "6 ft Portable Bar", category: "Bar and Cigar", price: 225, priceUnit: null, photoUrl: null },
    { id: "mock-2", name: "Go DJ", category: "Entertainment", price: 600, priceUnit: null, photoUrl: null },
    { id: "mock-3", name: "Lawn Games", category: "Games", price: 150, priceUnit: null, photoUrl: null },
  ]
  const catalog: RecommendItem[] = await Promise.race([
    loadCatalog().then((c) => c.items as RecommendItem[]).catch(() => fallback),
    new Promise<RecommendItem[]>((r) => setTimeout(() => r(fallback), 1200)),
  ])
  const byId = new Map(catalog.map((i) => [i.id, i]))
  const priced = catalog.filter((i) => i.price !== null && Number(i.price) > 0)
  const cart = body.cart.map((c) => ({ id: c.itemId, quantity: c.quantity ?? 1 }))
  const inCart = new Set(cart.map((c) => c.id))

  let items = cart
  let added: string[] = []
  let removed: string[] = []
  let action: Reply["cartAction"] = "add"
  let message = "Here's a lineup. Everything on it is free that day. Swap or remove anything you don't love."
  if (/under \$/.test(last)) {
    const keep = [...cart].sort((a, b) => Number(byId.get(a.id)?.price ?? 0) - Number(byId.get(b.id)?.price ?? 0)).slice(0, 3)
    removed = cart.filter((c) => !keep.includes(c)).map((c) => c.id)
    items = keep
    action = "replace"
    message = "Trimmed it to the three that matter most."
  } else if (/add a dj/.test(last)) {
    const dj = priced.find((i) => /dj/i.test(i.name) && !inCart.has(i.id))
    if (dj) {
      items = [...cart, { id: dj.id, quantity: 1 }]
      added = [dj.id]
    }
    message = "Added a DJ."
  } else {
    // A lineup: one per category, a per-guest item first when there is one.
    const seen = new Set<string>()
    const perGuest = priced.find((i) => isPerGuestUnit(i.priceUnit) && !inCart.has(i.id))
    const picks = [...(perGuest ? [perGuest] : []), ...priced.filter((i) => !inCart.has(i.id) && i !== perGuest)].filter((i) => !seen.has(i.category) && seen.add(i.category)).slice(0, 4)
    added = picks.map((i) => i.id)
    items = [...cart, ...picks.map((i) => ({ id: i.id, quantity: 1 }))]
  }

  const rows = items.flatMap((c) => {
    const row = byId.get(c.id)
    // Items the store already has go back as the id and quantity only.
    return row ? [inCart.has(c.id) ? { id: c.id, quantity: c.quantity } : { ...row, quantity: c.quantity }] : [{ id: c.id, quantity: c.quantity }]
  })
  const needsCount = items.some((c) => isPerGuestUnit(byId.get(c.id)?.priceUnit)) && !guests
  const total = items.reduce((s, c) => {
    const row = byId.get(c.id)
    if (!row || row.price === null) return s
    const per = isPerGuestUnit(row.priceUnit)
    if (per && !guests) return s
    return s + Number(row.price) * (per ? (guests as number) : c.quantity)
  }, 0)
  return {
    ...base,
    ready: true,
    cartAction: action,
    message,
    items: rows,
    added,
    removed,
    total: Math.round(total * 100) / 100,
    guestCountNeeded: needsCount,
    suggestions: ["Add a DJ", "Keep it under $2500", "What if it rains", "Looks good, book it"],
  }
}

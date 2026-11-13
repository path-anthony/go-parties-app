import { loadCatalog } from "@/lib/storeCatalog"
import type { RecommendItem } from "@/state/ask"

/* Ask GO fixture, DEV only and loaded lazily behind import.meta.env.DEV:
   `?mock=ask` answers POST /api/recommend without the AI. The first turn
   asks one question; the second turn recommends five real catalog items,
   one per category, so the party panel, swaps and booking are clickable
   with no Anthropic key. The reply reads the last message for "parent"
   (adds one more item) and "800" (drops to three).
   Block G1: every reply carries `suggestions` as the admin's does: budget
   answers after the question, next moves after a lineup, and an empty list
   once the customer says "Looks good, book it" (or types "empty"), the case
   where the admin sends none. mockStarters answers GET
   /api/recommend/starters; add ?starters=none to the address for a failed
   call (no buttons). */
export async function mockStarters(): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 300))
  if (new URLSearchParams(window.location.search).get("starters") === "none") return []
  return ["Backyard birthday for 20 kids", "40th birthday for 40 guests", "Company picnic for 100", "Wedding reception for 120"]
}

export async function mockRecommend(messages: { role: string; content: string }[]): Promise<{ ready: boolean; message: string; items?: RecommendItem[]; total?: number; suggestConcierge?: boolean; suggestions: string[] }> {
  await new Promise((r) => setTimeout(r, 600))
  const turns = messages.filter((m) => m.role === "user").length
  if (turns === 1) return { ready: false, message: "Sounds fun. Roughly how many guests, and is there a budget in mind?", suggestions: ["Under $1,000", "$1,000 to $2,500", "$2,500 and up", "Not sure yet, a few extra long ones to test wrapping on a phone"] }
  // With no admin running the catalog never answers: after a moment a small
  // fixed lineup stands in so the chat can still be clicked through.
  const fallback = [
    { id: "mock-1", name: "6 ft Portable Bar", category: "Bar and Cigar", price: 225, priceUnit: null, photoUrl: null, addonGroups: undefined },
    { id: "mock-2", name: "Go DJ", category: "Entertainment", price: 600, priceUnit: null, photoUrl: null, addonGroups: undefined },
    { id: "mock-3", name: "Lawn Games", category: "Games", price: 150, priceUnit: null, photoUrl: null, addonGroups: undefined },
  ]
  const items = await Promise.race([loadCatalog().then((c) => c.items).catch(() => fallback), new Promise<typeof fallback>((r) => setTimeout(() => r(fallback), 1200))])
  const seen = new Set<string>()
  let picks = items.filter((i) => i.price !== null && i.price > 0 && !seen.has(i.category) && seen.add(i.category)).slice(0, 5)
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? ""
  if (last.includes("800")) picks = picks.slice(0, 3)
  if (last.includes("parent")) picks = [...picks, ...items.filter((i) => i.price !== null && !picks.includes(i)).slice(0, 1)]
  const total = picks.reduce((s, i) => s + (i.price ?? 0), 0)
  return {
    ready: true,
    message: turns === 2 ? "Here's a party for the day. Everything on it is free that day. Swap or remove anything you don't love." : "Got it. I updated your party.",
    items: picks.map((i) => ({ id: i.id, name: i.name, category: i.category, price: i.price, priceUnit: i.priceUnit, photoUrl: i.photoUrl, addonGroups: i.addonGroups })),
    total,
    suggestConcierge: false,
    suggestions: last.includes("book it") || last.includes("empty") ? [] : ["Add a DJ", "Keep it under $800", "Make it for 30", "Looks good, book it"],
  }
}

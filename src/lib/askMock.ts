import { loadCatalog } from "@/lib/storeCatalog"
import type { RecommendItem } from "@/state/ask"

/* Ask GO fixture, DEV only and loaded lazily behind import.meta.env.DEV:
   `?mock=ask` answers POST /api/recommend without the AI. The first turn
   asks one question; the second turn recommends five real catalog items,
   one per category, so the party panel, swaps and booking are clickable
   with no Anthropic key. The reply reads the last message for "parent"
   (adds one more item) and "800" (drops to three). */
export async function mockRecommend(messages: { role: string; content: string }[]): Promise<{ ready: boolean; message: string; items?: RecommendItem[]; total?: number; suggestConcierge?: boolean }> {
  await new Promise((r) => setTimeout(r, 600))
  const turns = messages.filter((m) => m.role === "user").length
  if (turns === 1) return { ready: false, message: "Sounds fun. Roughly how many guests, and is there a budget in mind?" }
  const { items } = await loadCatalog()
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
  }
}

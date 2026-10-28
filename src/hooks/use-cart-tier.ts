import { useEffect } from "react"
import { fetchTier, type TierInfo } from "@/lib/tierApi"
import { tierInput } from "@/lib/directInput"
import { useBooking } from "@/state/booking"
import { usePublicSettings } from "@/lib/settings"

/* The tier for the cart as it stands (Block S1): asked from the admin once
   there are items and a date, kept in the booking store (which clears it
   whenever the cart, picks, date or time change), and read by the drawer
   and Ask GO for their one-line note. Nothing about money is decided here:
   the retainer comes from the tier answer, or from the settings'
   depositPercentage while the tier is not known yet. */
/* `enabled` is the drawer being open: the tier endpoint shares the admin's
   booking budget (five calls an hour per connection), so it is asked only
   when the note is on screen, after a short pause, and never twice for the
   same cart and date. */
const PAUSE_MS = 1500

export function useCartTier(enabled = true): TierInfo | null {
  const b = useBooking()
  const key = `${b.items.map((i) => `${i.id}:${i.quantity ?? 1}:${JSON.stringify(i.picks ?? {})}`).join(",")}|${b.bundle?.id ?? ""}|${b.itemDate}|${b.itemTime}`
  useEffect(() => {
    if (!enabled || b.tier || !b.itemDate || b.items.length === 0) return
    let live = true
    const t = setTimeout(() => {
      fetchTier(tierInput(b)).then((r) => {
        if (live && r.ok) b.set("tier", r.tier)
      })
    }, PAUSE_MS)
    return () => {
      live = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, b.tier, key])
  return b.tier
}

export const TIER_LINE: Record<1 | 2 | 3, string> = {
  1: "Checkout asks you to agree to the rental policy.",
  2: "Checkout includes GO's contract to sign.",
  3: "GO reviews this one and sends you a proposal.",
}

/* The retainer due today, in dollars, when it can be known: the tier's
   amount first, else the settings' deposit percent of the total. */
export function useRetainer(total: number, tier: TierInfo | null): { amount: number | null; percent: number | null } {
  const settings = usePublicSettings()
  if (tier?.retainerAmount !== null && tier?.retainerAmount !== undefined) return { amount: tier.retainerAmount, percent: tier.retainerPercent }
  const pct = tier?.retainerPercent ?? settings?.tokens.depositPercentage ?? null
  if (pct === null || total <= 0) return { amount: null, percent: pct }
  return { amount: Math.round((total * pct) / 100), percent: pct }
}

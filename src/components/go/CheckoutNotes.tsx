import { cartTotal } from "@/components/go/CartItems"
import { fmt } from "@/data/catalog"
import { useRetainer } from "@/hooks/use-cart-tier"
import { usePublicSettings } from "@/lib/settings"
import type { Tier } from "@/lib/tierApi"
import { useBooking } from "@/state/booking"
import { cn } from "@/lib/utils"

/* Two plain lines on the who and account screens (Block S2), in place of
   the old "Remaining balance" preference chips and the "Nothing to pay
   right now" line.

   BalanceLine: "Your balance of $X is due N days before your event. We'll
   email you a secure payment link." X is the total less the retainer (the
   tier's amount, else the settings' deposit percent). N is the admin's
   `balanceDueDays` once GET /api/settings/public carries it (settings
   keeps every number it sends, so no change is needed here then); until it
   does, the line says "before your event" with no count rather than a
   made-up one. Tier 3 holds nothing, so it shows no balance line.

   CheckoutNext: what actually happens after the button, per tier. Tier 1
   and 2 pay the retainer at the next step; tier 3 is reviewed first and
   nothing is paid yet. Nothing shows while the tier is still being asked. */

export function BalanceLine({ className }: { className?: string }) {
  const b = useBooking()
  const settings = usePublicSettings()
  const tier = b.tier
  const total = tier?.total ?? cartTotal(b.items, b.bundle)
  const retainer = useRetainer(total, tier)
  if (tier?.tier === 3 || total <= 0) return null
  const days = settings?.tokens.balanceDueDays ?? null
  const when = days !== null ? `${days} ${days === 1 ? "day" : "days"} before your event` : "before your event"
  const balance = retainer.amount !== null ? Math.max(0, Math.round(total - retainer.amount)) : null
  return (
    <p className={cn("text-small text-charcoal-soft", className)}>
      {balance !== null ? `Your balance of ${fmt(balance)} is due ${when}.` : `Your balance is due ${when}.`} We'll email you a secure payment link.
    </p>
  )
}

const NEXT_LINE: Record<Tier, string> = {
  1: "Your retainer is next. Paying it holds the date.",
  2: "This booking comes with a contract. You'll read and sign it on the next screen, then pay the retainer.",
  3: "Nothing to pay yet. GO reviews this one first and sends you a proposal.",
}

export function CheckoutNext({ tier, className }: { tier: Tier | null; className?: string }) {
  if (tier === null) return null
  return <p className={cn("text-small text-charcoal-soft", className)}>{NEXT_LINE[tier]}</p>
}

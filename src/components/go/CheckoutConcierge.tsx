import { ConciergeOffer } from "@/components/go/ConciergeOffer"
import { OCC } from "@/data/catalog"
import type { ConciergeContext } from "@/lib/concierge"
import { useBooking } from "@/state/booking"

/* The quiet "Talk to us instead" under the final Hold my date action: the
   signed-in who screen and the guest account screen. It reads the cart the
   customer is about to hold, so the lead and the Calendly note carry the
   occasion, what they picked and the date. Never a stop of its own. */
export function CheckoutConcierge({ className }: { className?: string }) {
  const b = useBooking()
  const occasion = [b.occ ? OCC[b.occ].label : null, b.subOcc].filter((s): s is string => !!s).join(", ") || null
  const what = b.bundle ? b.bundle.name : b.items.map((i) => i.name).join(", ")
  const ctx: ConciergeContext = { source: "checkout", occasion, itemOrPackage: what || null, eventDate: b.itemDate }
  return <ConciergeOffer ctx={ctx} className={className} quiet />
}

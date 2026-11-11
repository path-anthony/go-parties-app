import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Honeypot } from "@/components/go/Honeypot"
import { calendlyUrl, logConcierge, type ConciergeContext } from "@/lib/concierge"
import { contactFrom } from "@/lib/contact"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* The one concierge call to action, shared by the checkout's last screen
   (quiet: a small ghost button under the Hold my date action, so it never
   competes with it) and the Ask GO nudge (full width, the default). A real link, not a script-opened window: target="_blank"
   keeps the cart here, rel keeps Calendly from reaching back. The lead is
   logged on the tap and never awaited, with the customer's name, email and
   phone when they are signed in or have typed them (Block S9b). After the tap a small line says
   where the booking went, so a customer who comes back isn't lost. */
export function ConciergeOffer({ ctx, className, quiet, startedAt = 0 }: { ctx: ConciergeContext; className?: string; quiet?: boolean; startedAt?: number }) {
  const [opened, setOpened] = useState(false)
  const [hp, setHp] = useState("")
  const { customer } = useCustomer()
  const b = useBooking()
  return (
    <div className={`relative ${className ?? ""}`}>
      <Honeypot value={hp} onChange={setHp} />
      <Button asChild className={quiet ? undefined : "w-full"} variant={quiet ? "ghost" : "default"} size={quiet ? "sm" : "default"}>
        <a
          href={calendlyUrl(ctx)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            logConcierge(ctx, { hpField: hp, formStartedAt: startedAt }, contactFrom(customer, { name: b.contactName, email: b.email, phone: b.phone }))
            setOpened(true)
          }}
        >
          {quiet ? "Talk to us instead" : "Talk to GO Event Group"}
        </a>
      </Button>
      {opened && <p className="mt-2 text-small text-muted">Booking opened in a new tab. Your cart stays right here.</p>}
    </div>
  )
}

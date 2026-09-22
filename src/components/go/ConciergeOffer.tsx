import { useState } from "react"
import { Button } from "@/components/ui/button"
import { calendlyUrl, logConcierge, type ConciergeContext } from "@/lib/concierge"

/* The one concierge call to action, shared by the checkout offer screen and
   the Ask GO nudge. A real link, not a script-opened window: target="_blank"
   keeps the cart here, rel keeps Calendly from reaching back. The lead is
   logged on the tap and never awaited. After the tap a small line says
   where the booking went, so a customer who comes back isn't lost. */
export function ConciergeOffer({ ctx, onTalk, className }: { ctx: ConciergeContext; onTalk?: () => void; className?: string }) {
  const [opened, setOpened] = useState(false)
  return (
    <div className={className}>
      <Button asChild className="w-full">
        <a
          href={calendlyUrl(ctx)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            logConcierge(ctx)
            setOpened(true)
            onTalk?.()
          }}
        >
          Talk to GO Event Group
        </a>
      </Button>
      {opened && <p className="mt-2 text-small text-muted">Booking opened in a new tab. Your cart stays right here.</p>}
    </div>
  )
}

import { Navigate, useNavigate } from "react-router-dom"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { MetaCard } from "@/components/go/MetaCard"
import { labelForIso } from "@/lib/availability"
import { useBooking } from "@/state/booking"

/* Direct item booking, sent to the team. The admin answered 202: the cart is
   over its review threshold or is for an occasion it reviews by hand, so
   nothing was held and a request was opened for staff. That is an expected,
   good outcome for a big or one-of-a-kind event, not an error, and it must
   never look like a booking: no check mark, no "Held", and the words are ours
   (the admin's message field is not shown). The cart stays until Done. */

export default function ItemReview() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.review || b.items.length === 0) return <Navigate to="/home" replace />
  const { review, items } = b
  const what = b.bundle ? b.bundle.name : items.map((i) => i.name).join(", ")

  return (
    <AppShell>
      <Body className="text-center">
        <div className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-orange-tint">
          <Users className="size-[30px] stroke-orange" strokeWidth={2.25} />
        </div>
        <h1 className="text-hero text-charcoal">Our team takes it from here.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Big events get a personal look. We'll reach out within one business day.</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-left">
          <MetaCard label="What" value={what} />
          <MetaCard label="When" value={labelForIso(review.eventDate)} />
        </div>
        <p className="mt-4 text-small text-muted">Nothing is held and nothing is charged. We'll reach out by phone or email.</p>
      </Body>
      <Foot>
        <Button
          onClick={() => {
            b.setItems([])
            b.set("review", null)
            b.set("agreed", false)
            navigate("/home")
          }}
        >
          Done
        </Button>
      </Foot>
    </AppShell>
  )
}

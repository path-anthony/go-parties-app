import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { pickedOf } from "@/lib/addons"
import { qtyOf } from "@/components/go/CartItems"
import { useResponseDays } from "@/hooks/use-response-days"
import { labelForIso } from "@/lib/availability"
import { clockLabel as clockFor } from "@/data/catalog"
import { showPhone } from "@/lib/phone"
import { reviewLine } from "@/lib/review"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct item booking, sent to the team. The admin answered 202: the order
   is at or over its review amount (Block F2), so nothing was held and a
   request was opened for staff. That is an expected, good outcome, not an
   error, and it must never look like a booking: no check mark, no "Held",
   and no dollar, because nothing is due (the admin's `message` is not shown
   either; the words are ours).

   Block S9a: the last screen says so in plain words, "Nothing is due yet. We
   will contact you within N business days." (N from the admin's 202), shows
   back what was sent (items, date, address, setup notes, guest count, phone
   and email), and links to the request in My party. The cart stays until
   Done or until the customer goes to My party. */

export default function ItemReview() {
  const navigate = useNavigate()
  const b = useBooking()
  const { customer } = useCustomer()
  const days = useResponseDays()
  // Clearing the cart empties the guards below; this keeps them from
  // sending the customer home while they are on their way elsewhere.
  const [leaving, setLeaving] = useState(false)

  if (!b.review || b.items.length === 0) return leaving ? null : <Navigate to="/home" replace />
  const { review, items } = b
  const responseDays = review.responseDays ?? days
  const clock = clockFor(b.itemTime)
  const day = labelForIso(review.eventDate)
  const when = clock ? `${day}, ${clock}` : day
  const where = b.address.trim()
  const notes = b.verified ? b.setupNotes.trim() : ""
  const phone = customer ? showPhone(customer.phone) : b.phone.trim()
  const email = customer ? customer.email : b.email.trim()

  const finish = (to: string) => {
    setLeaving(true)
    b.setItems([])
    b.set("review", null)
    b.set("agreed", false)
    navigate(to)
  }

  return (
    <AppShell>
      <Body className="text-center">
        <span className="mx-auto mb-3.5 inline-block rounded-full bg-orange-tint px-3 py-1 text-[11px] font-bold tracking-[.14em] text-charcoal uppercase">In review</span>
        <h1 className="text-hero text-charcoal">Our team takes it from here.</h1>
        <p className="mt-2 text-body text-charcoal-soft">{reviewLine(responseDays)}</p>
        <p className="mt-5 text-left text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">What you sent</p>
        <div className="mt-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-left">
          {b.bundle && <b className="block text-sm text-charcoal">{b.bundle.name}</b>}
          {items.map((i) => (
            <div key={i.id}>
              <span className={b.bundle ? "block text-small text-charcoal-soft" : "block text-sm font-bold text-charcoal"}>
                {i.name}
                {qtyOf(i) > 1 ? ` x ${qtyOf(i)}` : ""}
              </span>
              {pickedOf(i).map(({ group, addon }) => (
                <span key={group.id} className="block text-small text-muted">
                  {group.name}: {addon.name}
                </span>
              ))}
            </div>
          ))}
          <span className="mt-2 block text-small text-charcoal-soft">{b.guestCount !== null ? `${when} · ${b.guestCount} guests` : when}</span>
          {where && <span className="block text-small text-charcoal-soft">{where}</span>}
          {notes && <span className="block text-small text-muted">Setup: {notes}</span>}
          {phone && <span className="mt-2 block text-small text-charcoal-soft">{phone}</span>}
          {email && <span className="block text-small break-words text-charcoal-soft">{email}</span>}
        </div>
        <p className="mt-4 text-small text-muted">You can follow it in My party.</p>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => finish("/party")}>
          See it in My party
        </Button>
        <Button onClick={() => finish("/home")}>Done</Button>
      </Foot>
    </AppShell>
  )
}

import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { AiLine } from "@/components/go/AiLine"
import { customerApi, isoDay, whatOf, whenOf, type CustomerBooking } from "@/lib/customerApi"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"
import { useAsk } from "@/state/ask"

/* Change the item on one booking, same date. The storefront's only way to
   browse real items is an Ask GO recommendation (the admin has no public
   item list yet), so this screen arms Ask GO: while changeFor is set, the
   item button in a recommendation reads "Switch to this" and calls the
   change-item endpoint instead of starting a new booking. Leaving the screen
   disarms it. */

export default function PartyChange() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { customer, ready } = useCustomer()
  const { openAsk } = useAsk()
  const b = useBooking()
  const [booking, setBooking] = useState<CustomerBooking | null | undefined>(undefined)

  useEffect(() => {
    if (!customer || !id) return
    customerApi.bookings().then((result) => {
      const found = result.ok ? result.data.find((x) => x.id === id) ?? null : null
      setBooking(found)
      if (found) b.set("changeFor", { bookingId: found.id, itemName: whatOf(found), eventDate: isoDay(found.eventDate) })
    })
    return () => b.set("changeFor", null)
    // b.set is stable for the provider's lifetime; the store itself is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, id])

  if (ready && !customer) return <Navigate to="/party/signin" replace />
  if (booking === null) return <Navigate to="/party" replace />

  return (
    <AppShell>
      <Body>
        <GoLabel>Change item</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Something else instead?</h1>
        <p className="mt-2 text-body text-charcoal-soft">Tell Ask GO what you'd rather have, then tap Switch to this on the item. Same date.</p>
        {booking && (
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <MetaCard label="Now" value={whatOf(booking)} />
            <MetaCard label="When" value={whenOf(booking)} />
          </div>
        )}
        <AiLine prompt="What would you rather have?" onClick={() => openAsk("home")} />
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/party")}>Back</Button>
      </Foot>
    </AppShell>
  )
}

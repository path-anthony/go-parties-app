import { Navigate, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { MetaCard } from "@/components/go/MetaCard"
import { LineItems } from "@/components/go/LineItems"
import { labelForIso } from "@/lib/availability"
import { bookedNames } from "@/lib/adminApi"
import { cartTotal, lineTotal, qtyOf } from "@/components/go/CartItems"
import { useBooking } from "@/state/booking"
import { itemClock as clockFor } from "@/data/catalog"

/* Direct item booking, confirmation. Same pattern as Held (screen 11): check
   mark, "Held. You're good.", what, when and where, a line per item, one
   button. */

export default function ItemHeld() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.direct || b.items.length === 0) return <Navigate to="/home" replace />
  const { direct, items } = b
  const day = labelForIso(direct.eventDate)
  const clock = clockFor(b.itemTime)
  const when = clock ? `${day}, ${clock}` : day
  const where = b.addressLater || b.address.trim() === "" ? "We'll text you for it" : b.address.trim()
  const names = bookedNames(direct)
  const priced = items.filter((i) => i.price !== null)
  const lines: [string, number][] = priced.map((i) => [qtyOf(i) > 1 ? `${i.name} x ${qtyOf(i)}` : i.name, lineTotal(i)])
  // The admin's total is the truth (the package's bundle price, or the
  // items times quantity); the cart's own sum only fills in if it's absent.
  const total = direct.total ?? cartTotal(items, b.bundle)

  return (
    <AppShell>
      <Body className="text-center">
        <div className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-orange-tint">
          <Check className="size-[30px] stroke-orange" strokeWidth={2.5} />
        </div>
        <h1 className="text-hero text-charcoal">Held. You're good.</h1>
        <p className="mt-2 text-body text-charcoal-soft">
          {day} is yours. Contract and deposit link are on their way to your phone.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-left">
          <MetaCard label="What" value={(names.length ? names : items.map((i) => i.name)).join(", ")} />
          <MetaCard label="When" value={when} />
          <div className="col-span-2">
            <MetaCard label="Where" value={where} />
          </div>
        </div>
        {lines.length > 0 && (
          <div className="mt-2.5 text-left">
            <LineItems lines={lines} total={total} note={b.bundle ? `Package price, ${b.bundle.name}.` : undefined} />
          </div>
        )}
        <p className="mt-4 text-small text-muted">
          Contract and payment run through our booking system. Reply STOP anytime to opt out of texts.
        </p>
      </Body>
      <Foot>
        <Button
          onClick={() => {
            // The booking is made; an emptied cart means Browse starts clean.
            b.setItems([])
            b.set("direct", null)
            navigate("/home")
          }}
        >
          Done
        </Button>
      </Foot>
    </AppShell>
  )
}

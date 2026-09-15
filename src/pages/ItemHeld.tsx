import { Navigate, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { MetaCard } from "@/components/go/MetaCard"
import { LineItems } from "@/components/go/LineItems"
import { labelForIso } from "@/lib/availability"
import { bookedNames } from "@/lib/adminApi"
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
  const priced = items.filter((i): i is typeof i & { price: number } => i.price !== null)
  const lines: [string, number][] = priced.map((i) => [i.name, i.price])
  const total = priced.reduce((sum, i) => sum + i.price, 0)

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
            <LineItems lines={lines} total={total} />
          </div>
        )}
        <p className="mt-4 text-small text-muted">
          Contract and payment run through our booking system. Reply STOP anytime to opt out of texts.
        </p>
      </Body>
      <Foot>
        <Button onClick={() => navigate("/home")}>Done</Button>
      </Foot>
    </AppShell>
  )
}

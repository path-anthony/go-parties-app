import { Navigate, useNavigate } from "react-router-dom"
import { Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { MetaCard } from "@/components/go/MetaCard"
import { LineItems, type Line, type SubLine } from "@/components/go/LineItems"
import { pickedOf } from "@/lib/addons"
import { labelForIso } from "@/lib/availability"
import { bookedNames } from "@/lib/adminApi"
import { cartTotal, lineTotal, qtyOf } from "@/components/go/CartItems"
import { usePublicSettings } from "@/lib/settings"
import { useBooking } from "@/state/booking"
import { clockLabel as clockFor } from "@/data/catalog"

/* Direct item booking, confirmation. Same pattern as Held (screen 11): check
   mark, "Held. You're good.", what, when and where, a line per item, one
   button. */

export default function ItemHeld() {
  const navigate = useNavigate()
  const b = useBooking()
  const settings = usePublicSettings()

  if (!b.direct || b.items.length === 0) return <Navigate to="/home" replace />
  const { direct, items } = b
  const rush = direct.rush === true
  const day = labelForIso(direct.eventDate)
  const clock = clockFor(b.itemTime)
  const when = clock ? `${day}, ${clock}` : day
  const where = b.addressLater || b.address.trim() === "" ? "We'll text you for it" : b.address.trim()
  const names = bookedNames(direct)
  // Each item's line carries its own add-ons under it. The admin's record
  // of what it sold is the truth (names and prices as booked, tied to the
  // item by id); the cart's own picks only fill in if that's absent.
  const subsOf = (i: (typeof items)[number]): SubLine[] =>
    direct.addons
      ? direct.addons.filter((a) => a.itemId === i.id).map((a) => [`${a.groupName}: ${a.addonName}`, a.priceDelta * a.quantity])
      : pickedOf(i).map(({ group, addon }) => [`${group.name}: ${addon.name}`, addon.priceDelta * qtyOf(i)])
  const priced = items.filter((i) => i.price !== null || subsOf(i).length > 0)
  const lines: Line[] = priced.map((i) => [qtyOf(i) > 1 ? `${i.name} x ${qtyOf(i)}` : i.name, lineTotal(i), subsOf(i), i.photoUrl ?? null])
  const extras = direct.addonsTotal ?? 0
  // The admin's total is the truth (the package's bundle price, or the
  // items times quantity); the cart's own sum only fills in if it's absent.
  const total = direct.total ?? cartTotal(items, b.bundle)

  return (
    <AppShell>
      <Body className="text-center">
        <div className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-orange-tint">
          {rush ? <Clock className="size-[30px] stroke-orange" strokeWidth={2.5} /> : <Check className="size-[30px] stroke-orange" strokeWidth={2.5} />}
        </div>
        <h1 className="text-hero text-charcoal">{rush ? "Pending. We'll be in touch." : "Held. You're good."}</h1>
        <p className="mt-2 text-body text-charcoal-soft">
          {rush
            ? `${day} is on our list. It's short notice, so a person confirms it first and texts you soon.`
            : `${day} is held. We'll reach out to confirm and finish your booking.`}
          {rush && settings?.rushContactPhone && ` Need it faster? Call or text ${settings.rushContactPhone}.`}
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
            <LineItems lines={lines} total={total} note={b.bundle ? `Package price, ${b.bundle.name}${extras !== 0 ? ", plus what you picked." : "."}` : undefined} />
          </div>
        )}
        <p className="mt-4 text-small text-muted">
          Reply STOP anytime to opt out of texts.
        </p>
      </Body>
      <Foot>
        <Button
          onClick={() => {
            // The booking is made; an emptied cart means Browse starts clean.
            b.setItems([])
            b.set("direct", null)
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

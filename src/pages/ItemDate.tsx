import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { ItemWhen } from "@/components/go/ItemWhen"
import { CartItems } from "@/components/go/CartItems"
import { missingRequired } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct item booking, step 1 of 2. One or more items, one date, a time, all
   held in the booking store; ItemWhen does the live check per item. The
   route carries the first item's id. Entered from an Ask GO recommendation. */

export default function ItemDate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer } = useCustomer()
  const [available, setAvailable] = useState(false)

  // The route carries the first item's id. If that item was just removed,
  // the URL follows the new first item rather than bouncing out.
  // An empty cart goes back to Browse; the guard does it, so removing the
  // last item needs no navigation of its own.
  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}`} replace />
  // Nothing gets a date while a required option is unanswered, whichever
  // door the cart came through.
  if (b.items.some((i) => missingRequired(i).length > 0)) return <Navigate to={`/item/${b.items[0].id}/options`} replace />
  const items = b.items
  const steps = checkoutSteps(b.optionsStep, customer !== null)
  const here = `/item/${items[0].id}`
  const timeSettled = b.itemTime !== null || b.itemTimeLater

  const removeItem = (rid: string) => b.setItems(items.filter((i) => i.id !== rid))

  return (
    <AppShell>
      <Body>
        <GoLabel>{items.length === 1 ? "Just this" : "Just these"} · Step {steps.date} of {steps.total}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">When do you need {items.length === 1 ? "it" : "them"}?</h1>
        <div className="mt-3.5">
          <CartItems
            items={items}
            bundle={b.bundle}
            onRemove={removeItem}
            onConfigure={() => navigate(`${here}/options`, { state: { from: here } })}
            showTotal
          />
        </div>
        <ItemWhen
          items={items}
          month={b.itemMonth}
          onMonth={(i) => b.set("itemMonth", i)}
          iso={b.itemDate}
          onIso={(iso) => b.set("itemDate", iso)}
          time={b.itemTime}
          onTime={(label) => b.set("itemTime", label)}
          timeLater={b.itemTimeLater}
          onTimeLater={(v) => b.set("itemTimeLater", v)}
          onAvailable={setAvailable}
        />
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate(b.optionsStep ? `${here}/options` : "/home")}>Back</Button>
        <Button disabled={!available || !timeSettled} onClick={() => navigate(`/item/${items[0].id}/concierge`)}>Next</Button>
      </Foot>
    </AppShell>
  )
}

import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { ItemWhen } from "@/components/go/ItemWhen"
import { fmt } from "@/data/catalog"
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

  if (b.items.length === 0 || b.items[0].id !== id) return <Navigate to="/home" replace />
  const items = b.items
  const timeSettled = b.itemTime !== null || b.itemTimeLater

  return (
    <AppShell>
      <Body>
        <GoLabel>{items.length === 1 ? "Just this" : "Just these"} · Step 1 of {customer ? 2 : 3}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">When do you need {items.length === 1 ? "it" : "them"}?</h1>
        <div className="mt-3.5 grid gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3.5">
              <div className="min-w-0">
                <b className="block text-sm text-charcoal">{item.name}</b>
                <small className="block text-small text-muted">{item.category}</small>
              </div>
              {item.price !== null && (
                <div className="flex-none text-right">
                  <b className="block text-price text-charcoal">{fmt(item.price)}</b>
                  {item.priceUnit && <small className="block text-[11px] text-muted">{item.priceUnit}</small>}
                </div>
              )}
            </div>
          ))}
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
        <Button variant="ghost" onClick={() => navigate("/home")}>Back</Button>
        <Button disabled={!available || !timeSettled} onClick={() => navigate(`/item/${items[0].id}/who`)}>Next</Button>
      </Foot>
    </AppShell>
  )
}

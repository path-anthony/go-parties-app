import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { ItemWhen } from "@/components/go/ItemWhen"
import { fmt } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Direct item booking, step 1 of 2. One item, one date, a time, all held in
   the booking store; ItemWhen does the live check. Entered from an item in an
   Ask GO recommendation. */

export default function ItemDate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const [available, setAvailable] = useState(false)

  if (!b.item || b.item.id !== id) return <Navigate to="/home" replace />
  const item = b.item
  const timeSettled = b.itemTime !== null || b.itemTimeLater

  return (
    <AppShell>
      <Body>
        <GoLabel>Just this · Step 1 of 2</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">When do you need it?</h1>
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3.5">
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
        <ItemWhen
          itemId={item.id}
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
        <Button disabled={!available || !timeSettled} onClick={() => navigate(`/item/${item.id}/who`)}>Next</Button>
      </Foot>
    </AppShell>
  )
}

import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MonthChips, DayCarousel, Reveal } from "@/components/go/DatePicker"
import { daysForItem } from "@/lib/availability"
import { checkAvailability, type Availability } from "@/lib/adminApi"
import { fmt } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Direct item booking, step 1 of 2. One item, one date. Availability is
   checked live against go-parties-admin the moment a day is tapped, one
   request per tap, never prefetched for the whole month. Entered from an
   item in an Ask GO recommendation. */

type Check = { iso: string; state: "loading" | "done" | "error"; result?: Availability }

export default function ItemDate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const [check, setCheck] = useState<Check | null>(null)
  const itemId = b.item?.id

  useEffect(() => {
    if (!b.itemDate || !itemId) {
      setCheck(null)
      return
    }
    const iso = b.itemDate
    let cancelled = false
    setCheck({ iso, state: "loading" })
    checkAvailability(itemId, iso)
      .then((result) => {
        if (!cancelled) setCheck({ iso, state: "done", result })
      })
      .catch(() => {
        if (!cancelled) setCheck({ iso, state: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [b.itemDate, itemId])

  if (!b.item || b.item.id !== id) return <Navigate to="/home" replace />
  const item = b.item

  const days = daysForItem(b.itemMonth)
  const selectedKey = days.find((d) => d.iso === b.itemDate)?.key ?? null
  const current = check && check.iso === b.itemDate ? check : null
  const available = current?.state === "done" && current.result?.available === true

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
        <MonthChips
          active={b.itemMonth}
          onPick={(i) => {
            b.set("itemMonth", i)
            b.set("itemDate", null)
          }}
        />
        <DayCarousel
          days={days}
          selected={selectedKey}
          onPick={(key) => b.set("itemDate", days.find((d) => d.key === key)?.iso ?? null)}
        />
        <p className="mt-1 text-[11.5px] text-muted">Tap a day. We check the calendar live.</p>
        <Reveal open={!!current} className="mt-3.5">
          <div className="rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {current?.state === "loading" && <span className="text-muted">Checking the calendar.</span>}
            {current?.state === "error" && "That didn't go through. Try again, or text us."}
            {current?.state === "done" && current.result && !current.result.directBooking && current.result.message}
            {current?.state === "done" && current.result?.directBooking && current.result.available && (
              <span className="flex items-center gap-2.5">
                <i className="inline-block size-1.5 flex-none rounded-full bg-good" />
                Open. {current.result.freeUnits} of {current.result.totalUnits} ready.
              </span>
            )}
            {current?.state === "done" && current.result?.directBooking && !current.result.available && "Booked solid that day. Try another date."}
          </div>
        </Reveal>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/home")}>Back</Button>
        <Button disabled={!available} onClick={() => navigate(`/item/${item.id}/who`)}>Next</Button>
      </Foot>
    </AppShell>
  )
}

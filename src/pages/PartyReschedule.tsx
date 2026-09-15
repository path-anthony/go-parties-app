import { useEffect, useRef, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { ItemWhen } from "@/components/go/ItemWhen"
import { ITEM_TIMES, MONTHS, itemClock } from "@/data/catalog"
import { customerApi, isoDay, whatOf, whenOf, type CustomerBooking } from "@/lib/customerApi"
import { useCustomer } from "@/state/customer"

/* Reschedule one booking. Same date and time picker as the direct booking,
   checked live against the booking's item. The admin re-locks a unit on the
   new date before releasing the old one, so a taken date leaves the booking
   exactly as it was; its message is shown as sent. */

const monthIndexFor = (iso: string) => {
  const [y, m] = iso.split("-").map(Number)
  const i = MONTHS.findIndex(([, year, monthIndex]) => year === y && monthIndex === m - 1)
  return i === -1 ? 0 : i
}

const labelForClock = (clock: string | null) => ITEM_TIMES.find(([, t]) => t === clock)?.[0] ?? null

export default function PartyReschedule() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { customer, ready } = useCustomer()
  const { toast } = useToast()
  const [booking, setBooking] = useState<CustomerBooking | null | undefined>(undefined)
  const [month, setMonth] = useState(0)
  const [iso, setIso] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [timeLater, setTimeLater] = useState(false)
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  // The picker starts on the booking's month and time exactly once. A second
  // fetch resolving later (StrictMode runs effects twice in dev) must not
  // yank the month back after the customer has already tapped elsewhere.
  const seeded = useRef(false)

  useEffect(() => {
    if (!customer || !id) return
    customerApi.bookings().then((result) => {
      const found = result.ok ? result.data.find((b) => b.id === id) ?? null : null
      setBooking(found)
      if (found && !seeded.current) {
        seeded.current = true
        setMonth(monthIndexFor(isoDay(found.eventDate)))
        const label = labelForClock(found.eventTime)
        setTime(label)
        setTimeLater(!label)
      }
    })
  }, [customer, id])

  if (ready && !customer) return <Navigate to="/party/signin" replace />
  if (booking === null) return <Navigate to="/party" replace />
  const whenItems = booking ? [...new Map(booking.units.map((u) => [u.itemId, { id: u.itemId, name: u.itemName }])).values()] : []

  const timeSettled = time !== null || timeLater
  const canSubmit = !!booking && !!iso && available && timeSettled && !busy

  const submit = async () => {
    if (!booking || !iso || !canSubmit) return
    setBusy(true)
    setNotice(null)
    const result = await customerApi.reschedule(booking.id, { eventDate: iso, eventTime: timeLater ? null : itemClock(time) })
    setBusy(false)
    if (result.ok) {
      toast({ title: "Moved." })
      navigate("/party")
      return
    }
    setNotice(result.message)
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>Reschedule</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">When instead?</h1>
        {booking && (
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <MetaCard label="What" value={whatOf(booking)} />
            <MetaCard label="Now" value={whenOf(booking)} />
          </div>
        )}
        {booking && whenItems.length > 0 && (
          <ItemWhen
            items={whenItems}
            month={month}
            onMonth={setMonth}
            iso={iso}
            onIso={setIso}
            time={time}
            onTime={setTime}
            timeLater={timeLater}
            onTimeLater={setTimeLater}
            onAvailable={setAvailable}
          />
        )}
        {notice && (
          <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">{notice}</div>
        )}
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/party")}>Back</Button>
        <Button disabled={!canSubmit} onClick={submit}>Move it</Button>
      </Foot>
    </AppShell>
  )
}

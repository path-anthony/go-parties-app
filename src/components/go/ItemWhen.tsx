import { useEffect, useState } from "react"
import { MonthCalendar, Reveal } from "@/components/go/DatePicker"
import { TimeField } from "@/components/go/TimeField"
import { usePublicSettings } from "@/lib/settings"
import { isShortNotice } from "@/lib/rush"
import { checkAvailability, type Availability } from "@/lib/adminApi"

/* Date and time for one or more items, checked live. A month calendar (Fri
   Sat Sun open, past days grayed), one availability request per item per
   tapped day, a heads-up when the day is inside the admin's notice window
   (non-blocking), then a real time input. Owned by whoever holds the
   state: the direct booking (ItemDate) and the portal's reschedule use the
   same one. */

export interface WhenItem {
  id: string
  name: string
  /* Units needed that day; missing means one. */
  quantity?: number
}

type Check = { iso: string; state: "loading" | "done" | "error"; results?: Availability[] }

export interface ItemWhenProps {
  items: WhenItem[]
  month: number
  onMonth: (i: number) => void
  iso: string | null
  onIso: (iso: string | null) => void
  /* "HH:mm" or null */
  time: string | null
  onTime: (hhmm: string | null) => void
  onAvailable: (available: boolean) => void
}

const needOf = (item: WhenItem) => item.quantity ?? 1
const isOpen = (r: Availability, need = 1) => r.directBooking && r.available && (r.freeUnits ?? 1) >= need

export function ItemWhen({ items, month, onMonth, iso, onIso, time, onTime, onAvailable }: ItemWhenProps) {
  const [check, setCheck] = useState<Check | null>(null)
  const key = items.map((i) => i.id).join(",")

  useEffect(() => {
    if (!iso || items.length === 0) {
      setCheck(null)
      return
    }
    let cancelled = false
    setCheck({ iso, state: "loading" })
    Promise.all(items.map((i) => checkAvailability(i.id, iso)))
      .then((results) => {
        if (!cancelled) setCheck({ iso, state: "done", results })
      })
      .catch(() => {
        if (!cancelled) setCheck({ iso, state: "error" })
      })
    return () => {
      cancelled = true
    }
    // items is identified by key so a re-created array with the same ids doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, key])

  const settings = usePublicSettings()
  const rush = !!iso && !!settings && isShortNotice(iso, settings.minBookingNoticeHours)
  const current = check && check.iso === iso ? check : null
  const results = current?.state === "done" ? (current.results ?? []) : []
  const available = current?.state === "done" && results.length === items.length && results.every((r, i) => isOpen(r, needOf(items[i])))

  useEffect(() => {
    onAvailable(available)
  }, [available, onAvailable])

  const single = items.length === 1

  return (
    <>
      <MonthCalendar month={month} onMonth={onMonth} selected={iso} onPick={onIso} />
      <p className="mt-1 text-[11.5px] text-muted">Tap a day. We check the calendar live.</p>
      <Reveal open={!!current} className="mt-3.5">
        <div className="rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
          {current?.state === "loading" && <span className="text-muted">Checking the calendar.</span>}
          {current?.state === "error" && "That didn't go through. Try again, or text us."}
          {current?.state === "done" && single && results[0] && !results[0].directBooking && results[0].message}
          {current?.state === "done" && single && results[0] && isOpen(results[0], needOf(items[0])) && (
            <span className="flex items-center gap-2.5">
              <i className="inline-block size-1.5 flex-none rounded-full bg-good" />
              Open. {results[0].freeUnits} of {results[0].totalUnits} ready.
            </span>
          )}
          {current?.state === "done" && single && results[0]?.directBooking && !results[0].available && "Booked solid that day. Try another date."}
          {current?.state === "done" && single && results[0]?.directBooking && results[0].available && !isOpen(results[0], needOf(items[0])) &&
            `Only ${results[0].freeUnits} open that day, this needs ${needOf(items[0])}. Try another date.`}
          {current?.state === "done" && !single && (
            <div className="space-y-1.5">
              {items.map((item, i) => {
                const r = results[i]
                if (!r) return null
                return (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <i className={`mt-[7px] inline-block size-1.5 flex-none rounded-full ${isOpen(r, needOf(item)) ? "bg-good" : "bg-line"}`} />
                    <span>
                      {item.name}
                      {needOf(item) > 1 ? ` x ${needOf(item)}` : ""}:{" "}
                      {!r.directBooking
                        ? r.message
                        : !r.available
                          ? "Booked solid that day."
                          : isOpen(r, needOf(item))
                            ? `Open, ${r.freeUnits} of ${r.totalUnits}.`
                            : `Only ${r.freeUnits} open, this needs ${needOf(item)}.`}
                    </span>
                  </div>
                )
              })}
              {!available && <p className="pt-1 text-charcoal-soft">Try another date.</p>}
            </div>
          )}
        </div>
      </Reveal>
      <Reveal open={available && rush} className="mt-3.5">
        {rush && settings && (
          <div className="rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            This date needs at least {settings.minBookingNoticeHours} hours notice to book automatically. We'll still hold this as a pending booking.
            {settings.rushContactPhone && (
              <>
                {" "}If you need it faster, call or text us at{" "}
                <a href={`tel:${settings.rushContactPhone}`} className="font-bold text-charcoal">{settings.rushContactPhone}</a>.
              </>
            )}
          </div>
        )}
      </Reveal>
      <Reveal open={available} className="mt-3.5">
        <TimeField value={time} onChange={onTime} />
      </Reveal>
    </>
  )
}

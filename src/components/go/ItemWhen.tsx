import { useEffect, useState } from "react"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MonthChips, DayCarousel, Reveal } from "@/components/go/DatePicker"
import { daysForItem } from "@/lib/availability"
import { checkAvailability, type Availability } from "@/lib/adminApi"
import { ITEM_TIMES } from "@/data/catalog"

/* Date and time for one item, checked live. Month chips, the Fri Sat Sun day
   carousel with past days grayed, one availability request per tapped day,
   then the time chips (same Chip pattern as the package flow) with "Decide
   later" as the explicit skip. Owned by whoever holds the state: the direct
   booking (ItemDate) and the portal's reschedule use the same one. */

type Check = { iso: string; state: "loading" | "done" | "error"; result?: Availability }

export interface ItemWhenProps {
  itemId: string
  month: number
  onMonth: (i: number) => void
  iso: string | null
  onIso: (iso: string | null) => void
  time: string | null
  onTime: (label: string | null) => void
  timeLater: boolean
  onTimeLater: (v: boolean) => void
  onAvailable: (available: boolean) => void
}

export function ItemWhen({ itemId, month, onMonth, iso, onIso, time, onTime, timeLater, onTimeLater, onAvailable }: ItemWhenProps) {
  const [check, setCheck] = useState<Check | null>(null)

  useEffect(() => {
    if (!iso) {
      setCheck(null)
      return
    }
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
  }, [iso, itemId])

  const days = daysForItem(month)
  const selectedKey = days.find((d) => d.iso === iso)?.key ?? null
  const current = check && check.iso === iso ? check : null
  const available = current?.state === "done" && current.result?.available === true

  useEffect(() => {
    onAvailable(available)
  }, [available, onAvailable])

  return (
    <>
      <MonthChips
        active={month}
        onPick={(i) => {
          onMonth(i)
          onIso(null)
        }}
      />
      <DayCarousel days={days} selected={selectedKey} onPick={(key) => onIso(days.find((d) => d.key === key)?.iso ?? null)} />
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
      <Reveal open={available} className="mt-3.5">
        <GoLabel className="mb-2">What time</GoLabel>
        <div className="grid grid-cols-3 gap-2 pb-px">
          {ITEM_TIMES.map(([label, t]) => (
            <Chip
              key={label}
              selected={time === label}
              sub={t}
              onClick={() => {
                onTime(label)
                onTimeLater(false)
              }}
            >
              {label}
            </Chip>
          ))}
          <Chip
            selected={timeLater}
            sub="No rush"
            onClick={() => {
              onTime(null)
              onTimeLater(true)
            }}
          >
            Decide later
          </Chip>
        </div>
      </Reveal>
    </>
  )
}

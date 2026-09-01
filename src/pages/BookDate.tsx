import { useNavigate } from "react-router-dom"
import { Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MonthChips, DayCarousel, Reveal } from "@/components/go/DatePicker"
import { daysFor } from "@/lib/availability"
import { GUESTS, OCC, TIMES } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Screen 4, Date, time, guests. SCREENS.md: month chips, day carousel with
   snap and open dots, time chips reveal on tap, guest chips, Back and Next. */

export default function BookDate() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.occ) return <Navigate to="/home" replace />
  const o = OCC[b.occ]

  return (
    <AppShell step={1}>
      <Body>
        <GoLabel>{o.label} · Step 1 of 4</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">{o.q}</h1>
        <MonthChips
          active={b.month}
          onPick={(i) => {
            b.set("month", i)
            b.set("date", null)
            b.set("time", null)
          }}
        />
        <DayCarousel
          days={daysFor(b.month, b.occ)}
          selected={b.date}
          onPick={(key) => {
            b.set("date", key)
            b.set("time", null)
          }}
        />
        <div className="mt-1 flex items-center gap-2.5 text-[11.5px] text-muted">
          <i className="inline-block size-1.5 flex-none rounded-full bg-good" />
          Open. Grayed days are booked solid, crew and gear included.
        </div>
        <Reveal open={!!b.date} className="mt-3.5">
          <GoLabel className="mb-2">What time</GoLabel>
          <div className="grid grid-cols-3 gap-2">
            {TIMES[b.occ].map(([label, t]) => (
              <Chip key={label} selected={b.time === label} sub={t} onClick={() => b.set("time", label)}>
                {label}
              </Chip>
            ))}
          </div>
        </Reveal>
        <div className="mt-5">
          <GoLabel className="mb-2">How many people</GoLabel>
          <div className="grid grid-cols-3 gap-2">
            {GUESTS[b.occ].map((g) => (
              <Chip key={g} selected={b.guests === g} onClick={() => b.set("guests", g)}>
                {g}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-small text-muted">Rough is fine. You can change it up to a week out.</p>
        </div>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/home")}>Back</Button>
        <Button onClick={() => navigate("/book/budget")}>Next</Button>
      </Foot>
    </AppShell>
  )
}

import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { LineItems } from "@/components/go/LineItems"
import { useBooking } from "@/state/booking"

/* Screen 10, Review. SCREENS.md: four meta cards (when, who, where, setup),
   line items, total, deposit note, "Hold my date, $200". */

export default function BookReview() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.occ || !b.pkg) return <Navigate to="/home" replace />

  const lines: [string, number][] = [[b.pkg.n, b.pkg.p], ...Object.entries(b.addons)]

  return (
    <AppShell step={4}>
      <Body>
        <GoLabel>Last look</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Look good?</h1>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetaCard label="When" value={`${b.date ?? "Date TBD"}${b.time ? ", " + b.time : ""}`} />
          <MetaCard label="Who" value={`${b.guests ?? "?"} people`} />
          <MetaCard label="Where" value={b.addr || "Address TBD"} />
          <MetaCard label="Setup" value={`${b.venue}, ${b.power ? "power ok" : "no power"}`} />
        </div>
        <div className="mt-3">
          <LineItems
            lines={lines}
            total={b.total()}
            note="$200 holds the date for 48 hours. Balance due a week out. Contract and receipt come by text."
          />
        </div>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/book/where")}>Back</Button>
        <Button
          onClick={() => {
            b.set("held", true)
            navigate("/held")
          }}
        >
          Hold my date, $200
        </Button>
      </Foot>
    </AppShell>
  )
}

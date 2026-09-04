import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MapPlate } from "@/components/go/MapPlate"
import { useBooking } from "@/state/booking"

/* Screen 9, Where's the party. SCREENS.md: address input, map plate with pin,
   venue chips, power and water toggles, note. */

const VENUES = ["Backyard", "Venue", "Park", "Driveway"]

export default function BookWhere() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.occ || !b.pkg) return <Navigate to="/home" replace />

  return (
    <AppShell step={4}>
      <Body>
        <GoLabel>Almost there</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Where's the party?</h1>
        <div className="mt-3.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Address</GoLabel>
          <Input
            placeholder="14 Maple Ln, Farmington"
            value={b.addr}
            onChange={(e) => b.set("addr", e.target.value)}
          />
        </div>
        <MapPlate />
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {VENUES.map((v) => (
            <Chip key={v} selected={b.venue === v} onClick={() => b.set("venue", v)}>
              {v}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between rounded-[14px] border border-line bg-white px-3.5 py-[13px] text-sm font-semibold text-charcoal">
          <div>
            Power outlet within 100 ft
            <small className="block text-[11.5px] font-medium text-muted">Blowers and stations need it</small>
          </div>
          <Switch checked={b.power} onCheckedChange={(v) => b.set("power", v)} />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-[14px] border border-line bg-white px-3.5 py-[13px] text-sm font-semibold text-charcoal">
          <div>
            Water spigot nearby
            <small className="block text-[11.5px] font-medium text-muted">Only matters for slides</small>
          </div>
          <Switch checked={b.water} onCheckedChange={(v) => b.set("water", v)} />
        </div>
        <p className="mt-2.5 text-small text-muted">Gate width, stairs, dogs: tell the crew on the next screen. We've seen it all.</p>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/book/addons")}>Back</Button>
        <Button onClick={() => navigate("/book/review")}>Review</Button>
      </Foot>
    </AppShell>
  )
}

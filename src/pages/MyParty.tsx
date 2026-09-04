import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { PhotoPlate, PlateText } from "@/components/go/PhotoPlate"
import { MetaCard } from "@/components/go/MetaCard"
import { fmt } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Screen 12, My party. SCREENS.md: if held, hero, countdown, deposit and
   balance, Add to my party. Else empty state. */

export default function MyParty() {
  const navigate = useNavigate()
  const b = useBooking()

  if (b.held && b.pkg) {
    const meta = `${b.date ?? ""}${b.time ? " · " + b.time : ""}`
    return (
      <AppShell>
        <Body>
          <GoLabel>My party</GoLabel>
          <h1 className="mt-1.5 text-hero text-charcoal">{b.pkg.n}</h1>
          <PhotoPlate variant={b.pkg.plate} spec={`MEL · ${b.pkg.n.toUpperCase()}`} className="mt-3 aspect-[4/3]">
            <PlateText eyebrow={meta} title="16 days out" />
          </PhotoPlate>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MetaCard label="Deposit" value="$200 paid" />
            <MetaCard label="Balance" value={`${fmt(b.total() - 200)} due`} />
          </div>
          <p className="mt-3 text-body text-charcoal-soft">Add something anytime. Crew ETA shows here the morning of.</p>
          <Button variant="ghost" className="mt-3 w-full" onClick={() => navigate("/book/addons")}>
            Add to my party
          </Button>
        </Body>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Body className="flex flex-col justify-center text-center">
        <h1 className="text-hero text-charcoal">Nothing here yet.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Build a party and it'll live here: countdown, balance, crew ETA.</p>
        <div className="mt-[18px]">
          <Button onClick={() => navigate("/home")}>Build one</Button>
        </div>
      </Body>
    </AppShell>
  )
}

import { useNavigate } from "react-router-dom"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { OccasionCard } from "@/components/go/OccasionCard"
import { AiLine } from "@/components/go/AiLine"
import { Rail } from "@/components/go/Rail"
import { RailCard } from "@/components/go/RailCard"
import { useBooking } from "@/state/booking"
import { useAsk } from "@/state/ask"
import { NEXT_OPEN, OCC, PKGS, occOf, type OccasionId } from "@/data/catalog"

/* Screen 3, Home. SCREENS.md: label, screen title, four 1:1 occasion plates,
   Ask GO dashed line, Recommended rail, small availability note. */

export default function Home() {
  const navigate = useNavigate()
  const { pick, jump } = useBooking()
  const { openAsk } = useAsk()
  const recs = [PKGS.kids[3], PKGS.kids[2], PKGS.adult[3], PKGS.wedding[1]]

  return (
    <AppShell>
      <Body>
        <GoLabel>Hey Sarah</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">What are we celebrating?</h1>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {(Object.keys(OCC) as OccasionId[]).map((id) => (
            <OccasionCard
              key={id}
              label={OCC[id].label}
              plate={OCC[id].plate}
              onClick={() => {
                pick(id)
                navigate("/book/date")
              }}
            />
          ))}
        </div>
        <AiLine prompt="Not sure? Describe the party" onClick={() => openAsk("home")} />
        <div className="mt-5">
          <GoLabel>Recommended for you</GoLabel>
          <Rail>
            {recs.map((p) => (
              <RailCard
                key={p.id}
                pkg={p}
                nextOpen={NEXT_OPEN[occOf(p)]}
                onClick={() => {
                  jump(occOf(p), p.id)
                  navigate("/book/package")
                }}
              />
            ))}
          </Rail>
        </div>
        <p className="mt-3 text-small text-muted">Dates are live off the unit calendar. If it's open, it's real.</p>
      </Body>
    </AppShell>
  )
}

import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { OccasionCard } from "@/components/go/OccasionCard"
import { Chip } from "@/components/go/Chip"
import { Reveal } from "@/components/go/DatePicker"
import { AiLine } from "@/components/go/AiLine"
import { Rail } from "@/components/go/Rail"
import { RailCard } from "@/components/go/RailCard"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/state/booking"
import { useAsk } from "@/state/ask"
import { NEXT_OPEN, OCC, PKGS, SUB_OCC, occOf, recsFor, type OccasionId, type Pkg } from "@/data/catalog"

/* Screen 3, Home. SCREENS.md: label, screen title, four 1:1 occasion plates,
   Ask GO dashed line, Recommended rail, small availability note. Three doors:
   the occasion cards (sub-occasion chips reveal beneath, then a rail scoped
   to that pick, then Continue), the search row (one item, /browse), and the
   Ask GO line. Nothing here overlays anything else. */

export default function Home() {
  const navigate = useNavigate()
  const { occ, subOcc, pick, jump, set } = useBooking()
  const { openAsk } = useAsk()
  const recs = [PKGS.kids[3], PKGS.kids[2], PKGS.adult[3], PKGS.wedding[1]]
  const scoped = occ && subOcc ? recsFor(occ, subOcc) : []

  const openPackage = (p: Pkg) => {
    jump(occOf(p), p.id)
    navigate("/book/package")
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>Hey Sarah</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">What are we celebrating?</h1>
        <button
          className="mt-3.5 flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[13px] text-left text-[13.5px] text-muted hover:border-charcoal"
          onClick={() => navigate("/browse")}
        >
          <Search className="size-[18px] flex-none stroke-charcoal" strokeWidth={1.75} />
          Pick a day. See what's open.
          <b className="ml-auto text-[12.5px] font-bold whitespace-nowrap text-charcoal">Browse</b>
        </button>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {(Object.keys(OCC) as OccasionId[]).map((id) => (
            <OccasionCard key={id} label={OCC[id].label} plate={OCC[id].plate} onClick={() => pick(id)} />
          ))}
        </div>
        <Reveal open={!!occ} className="mt-3.5">
          <GoLabel className="mb-2">What kind</GoLabel>
          <div className="grid grid-cols-2 gap-2">
            {occ &&
              SUB_OCC[occ].map((s) => (
                <Chip key={s} selected={subOcc === s} onClick={() => set("subOcc", s)}>
                  {s}
                </Chip>
              ))}
          </div>
        </Reveal>
        <Reveal open={scoped.length > 0} className="mt-5">
          <GoLabel>Recommended for {subOcc}</GoLabel>
          <Rail>
            {scoped.map((p) => (
              <RailCard key={p.id} pkg={p} nextOpen={NEXT_OPEN[occOf(p)]} onClick={() => openPackage(p)} />
            ))}
          </Rail>
        </Reveal>
        {occ && (
          <Button className="mt-3.5 w-full" onClick={() => navigate("/book/date")}>
            Continue
          </Button>
        )}
        <AiLine prompt="Not sure? Describe the party" onClick={() => openAsk("home")} />
        <div className="mt-5">
          <GoLabel>Recommended for you</GoLabel>
          <Rail>
            {recs.map((p) => (
              <RailCard key={p.id} pkg={p} nextOpen={NEXT_OPEN[occOf(p)]} onClick={() => openPackage(p)} />
            ))}
          </Rail>
        </div>
        <p className="mt-3 text-small text-muted">Dates are live off the unit calendar. If it's open, it's real.</p>
      </Body>
    </AppShell>
  )
}

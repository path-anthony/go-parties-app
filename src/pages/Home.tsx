import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { OccasionCard } from "@/components/go/OccasionCard"
import { Chip } from "@/components/go/Chip"
import { Reveal } from "@/components/go/DatePicker"
import { AskCard } from "@/components/go/AskCard"
import { Rail } from "@/components/go/Rail"
import { RailCard } from "@/components/go/RailCard"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/state/booking"
import { useAsk } from "@/state/ask"
import { NEXT_OPEN, OCC, SUB_OCC, occOf, recsFor, type OccasionId, type Pkg } from "@/data/catalog"

/* Screen 3, Home. Three doors, in this order: Ask GO as a card near the top
   (the AI event builder), the Build-your-own row (date first, then a cart,
   /browse), and the occasion cards (sub-occasion chips reveal beneath, then a
   rail scoped to that pick, then Continue). "Recommended for you" lives on My
   party now. Nothing here overlays anything else. */

export default function Home() {
  const navigate = useNavigate()
  const { occ, subOcc, pick, jump, set } = useBooking()
  const { openAsk } = useAsk()
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
        <AskCard onClick={() => openAsk("home")} />
        <button
          className="mt-2.5 flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[13px] text-left text-[13.5px] text-charcoal hover:border-charcoal"
          onClick={() => navigate("/browse")}
        >
          <Search className="size-[18px] flex-none stroke-charcoal" strokeWidth={1.75} />
          <span>
            <b className="font-bold">Build your own.</b> <span className="text-muted">Pick a day, add what's open.</span>
          </span>
          <b className="ml-auto text-[12.5px] font-bold whitespace-nowrap text-charcoal">Build</b>
        </button>
        <GoLabel className="mt-5">Or pick the occasion</GoLabel>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
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
        <p className="mt-4 text-small text-muted">Dates are live off the unit calendar. If it's open, it's real.</p>
      </Body>
    </AppShell>
  )
}

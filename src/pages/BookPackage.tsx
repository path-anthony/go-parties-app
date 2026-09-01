import { Navigate, useNavigate } from "react-router-dom"
import { Sparkle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { PackageHero } from "@/components/go/PackageHero"
import { PackageSelect } from "@/components/go/PackageSelect"
import { OCC, PKGS } from "@/data/catalog"
import { useBooking } from "@/state/booking"
import { useAsk } from "@/state/ask"

/* Screen 6, Your package. SCREENS.md: package hero 4:3 with date, time and
   guests overlay, name and price with "before add-ons", inclusions with
   checks, native select to switch packages, "Ask about this package". */

export default function BookPackage() {
  const navigate = useNavigate()
  const b = useBooking()
  const { openAsk } = useAsk()

  if (!b.occ || !b.pkg) return <Navigate to="/home" replace />
  const p = b.pkg

  const meta = `${b.date ?? "Date TBD"}${b.time ? " · " + b.time : ""}${b.guests ? " · " + b.guests + " people" : ""}`

  return (
    <AppShell step={3}>
      <Body>
        <GoLabel>
          {OCC[b.occ].label} · Step 3 of 4{p.demo ? " · demo pricing" : ""}
        </GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Here's your party.</h1>
        <PackageHero pkg={p} meta={meta} />
        <PackageSelect pkgs={PKGS[b.occ]} value={p.id} onChange={(id) => b.swapPkg(id)} />
        <button
          className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[12px] border-[1.5px] border-line bg-white p-3 text-[13.5px] font-bold text-charcoal"
          onClick={() => openAsk("pkg")}
        >
          <Sparkle className="size-4 stroke-orange" strokeWidth={1.75} />
          Ask about this package
        </button>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/book/detail")}>What's in it</Button>
        <Button onClick={() => navigate("/book/addons")}>Make it mine</Button>
      </Foot>
    </AppShell>
  )
}

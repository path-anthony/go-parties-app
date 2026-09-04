import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { ItemRow, SwapList } from "@/components/go/ItemRow"
import { useBooking } from "@/state/booking"
import { useToast } from "@/hooks/use-toast"
import type { PlateVariant } from "@/data/catalog"

/* Screen 7, What's in it. SCREENS.md: item rows with thumbnails and Swap
   unfold with price deltas. */

const PLATE_CYCLE: PlateVariant[] = ["", "warm", "cool", "stone"]

export default function BookDetail() {
  const navigate = useNavigate()
  const b = useBooking()
  const { toast } = useToast()
  const [swapOpen, setSwapOpen] = useState<number | null>(null)

  if (!b.occ || !b.pkg) return <Navigate to="/home" replace />
  const p = b.pkg

  return (
    <AppShell step={3}>
      <Body>
        <GoLabel>{p.n}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">What's in it.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Swap anything. Price updates as you go.</p>
        <div className="mt-3.5">
          {p.items.map((it, i) => {
            const current = b.swaps[i] || it.name
            const options = [it.name, ...it.alts]
            return (
              <div key={it.name}>
                <ItemRow
                  name={current}
                  cat={it.cat}
                  plate={PLATE_CYCLE[i % PLATE_CYCLE.length]}
                  swappable={it.alts.length > 0}
                  swapOpen={swapOpen === i}
                  onToggleSwap={() => setSwapOpen(swapOpen === i ? null : i)}
                />
                <SwapList
                  open={swapOpen === i}
                  options={options}
                  current={current}
                  onPick={(o) => {
                    b.set("swaps", { ...b.swaps, [i]: o })
                    setSwapOpen(null)
                    toast({ title: "Swapped." })
                  }}
                />
              </div>
            )
          })}
        </div>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/book/package")}>Back</Button>
        <Button onClick={() => navigate("/book/addons")}>Make it mine</Button>
      </Foot>
    </AppShell>
  )
}

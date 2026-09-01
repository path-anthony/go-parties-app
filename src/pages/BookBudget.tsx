import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { BUDGETS, OCC } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Screen 5, Budget. SCREENS.md: four chips 2 per row, Back and Show me. */

export default function BookBudget() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.occ) return <Navigate to="/home" replace />

  return (
    <AppShell step={2}>
      <Body>
        <GoLabel>{OCC[b.occ].label} · Step 2 of 4</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Ballpark?</h1>
        <p className="mt-2 text-body text-charcoal-soft">No wrong answer. We build to the number and show what's possible.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {BUDGETS[b.occ].map(([label, v]) => (
            <Chip key={label} selected={b.budget === v} className="px-2 py-4" onClick={() => b.set("budget", v)}>
              {label}
            </Chip>
          ))}
        </div>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/book/date")}>Back</Button>
        <Button
          onClick={() => {
            b.suggest()
            navigate("/book/package")
          }}
        >
          Show me
        </Button>
      </Foot>
    </AppShell>
  )
}

import { Navigate, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { LineItems } from "@/components/go/LineItems"
import { useBooking } from "@/state/booking"

/* Screen 11, Held. SCREENS.md: check mark, "Held. You're good.", summary,
   See my party. */

export default function Held() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.pkg) return <Navigate to="/home" replace />

  const lines: [string, number][] = [[b.pkg.n, b.pkg.p], ...Object.entries(b.addons)]

  return (
    <AppShell>
      <Body className="text-center">
        <div className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-orange-tint">
          <Check className="size-[30px] stroke-orange" strokeWidth={2.5} />
        </div>
        <h1 className="text-hero text-charcoal">Held. You're good.</h1>
        <p className="mt-2 text-body text-charcoal-soft">
          {b.date ?? "Your date"} is yours for 48 hours. Contract and deposit link are on their way to your phone.
        </p>
        <div className="mt-5 text-left">
          <LineItems lines={lines} total={b.total()} />
        </div>
        <p className="mt-4 text-small text-muted">
          Contract and payment run through our booking system. Reply STOP anytime to opt out of texts.
        </p>
      </Body>
      <Foot>
        <Button onClick={() => navigate("/party")}>See my party</Button>
      </Foot>
    </AppShell>
  )
}

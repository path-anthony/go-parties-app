import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { ConciergeOffer } from "@/components/go/ConciergeOffer"
import { OCC, itemClock } from "@/data/catalog"
import { missingRequired } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { conciergeWhen, type ConciergeContext } from "@/lib/concierge"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct booking, the concierge offer. Right after the date, before who:
   the one point that is the same for a guest and a signed-in customer. The
   customer can hand the party to a person (Calendly, in a new tab, the
   cart untouched) or keep going. Either answer sets the store's concierge
   flag, which the who screen requires, so the offer is met once per cart
   and never skipped by URL. Same guards as every other checkout screen. */

export default function ItemConcierge() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer } = useCustomer()

  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/concierge`} replace />
  const firstId = b.items[0].id
  if (b.items.some((i) => missingRequired(i).length > 0)) return <Navigate to={`/item/${firstId}/options`} replace />
  if (!b.itemDate) return <Navigate to={`/item/${firstId}`} replace />

  const steps = checkoutSteps(b.optionsStep, customer !== null)
  const occasion = [b.occ ? OCC[b.occ].label : null, b.subOcc].filter((s): s is string => !!s).join(", ") || null
  const what = b.bundle ? b.bundle.name : b.items.map((i) => i.name).join(", ")
  const ctx: ConciergeContext = { source: "checkout", occasion, itemOrPackage: what, eventDate: b.itemDate }
  const clock = itemClock(b.itemTime)
  const when = `${conciergeWhen(b.itemDate)}${clock ? `, ${clock}` : ""}`

  const keepGoing = () => {
    b.set("concierge", "skipped")
    navigate(`/item/${firstId}/who`)
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>
          {b.items.length === 1 ? "Just this" : "Just these"} · Step {steps.concierge} of {steps.total}
        </GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Prefer to just talk it through?</h1>
        <p className="mt-2 text-body text-charcoal-soft">Some parties are easier to plan with a real person. Grab 30 minutes with our team, on us.</p>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <MetaCard label="What" value={what} />
          <MetaCard label="When" value={when} />
        </div>
        <ConciergeOffer ctx={ctx} className="mt-3.5" onTalk={() => b.set("concierge", "talk")} />
        <p className="mt-2.5 text-small text-muted">Or keep going and finish here. Nothing changes until you hold the date.</p>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate(`/item/${firstId}`)}>Back</Button>
        <Button variant="ghost" onClick={keepGoing}>I'll keep going</Button>
      </Foot>
    </AppShell>
  )
}

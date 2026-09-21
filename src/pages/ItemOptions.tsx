import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { AddonPicker } from "@/components/go/AddonPicker"
import { fmt } from "@/data/catalog"
import { missingRequired, needsConfig, withPick } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { cartTotal, qtyOf } from "@/components/go/CartItems"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct booking, the options step. A batch that arrives all at once (Ask
   GO's checked items, a package) has no moment per item, so everything that
   needs configuring is answered here, once, before the date. Organized by
   item, never as a flat list of pickers: each item with add-on groups gets
   its own card with its real name as the heading and its groups nested
   inside, so a "Flavor" or a "Surface" is never apart from the thing it is
   for. Items with nothing to configure have no card; a batch with nothing
   to configure never sees this screen. Also the place "Change" on any cart
   row comes back to; it then returns to where it was opened from. */

export default function ItemOptions() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const b = useBooking()
  const { customer } = useCustomer()

  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/options`} replace />
  const firstId = b.items[0].id
  const configurable = b.items.filter(needsConfig)
  if (configurable.length === 0) return <Navigate to={`/item/${firstId}`} replace />

  const from = (location.state as { from?: string } | null)?.from ?? null
  const steps = checkoutSteps(b.optionsStep, customer !== null)
  const ready = configurable.every((i) => missingRequired(i).length === 0)
  const plain = b.items.length - configurable.length

  return (
    <AppShell>
      <Body>
        <GoLabel>
          {b.items.length === 1 ? "Just this" : "Just these"}
          {b.optionsStep ? ` · Step ${steps.options} of ${steps.total}` : ""}
        </GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Make it yours.</h1>
        <p className="mt-2 text-body text-charcoal-soft">A few picks before the day. Each one sits under the thing it's for.</p>
        <div className="mt-3.5 space-y-2.5">
          {configurable.map((item) => {
            const missing = missingRequired(item)
            return (
              <section key={item.id} aria-label={item.name} className="rounded-[14px] border border-line bg-white px-4 py-3.5">
                <h2 className="text-base font-extrabold text-charcoal">
                  {item.name}
                  {qtyOf(item) > 1 && <span className="font-medium text-muted"> x {qtyOf(item)}</span>}
                </h2>
                <small className="mb-3 block text-small text-muted">
                  {item.category}
                  {missing.length > 0 ? ` · Still needs: ${missing.map((g) => g.name).join(", ")}` : ""}
                </small>
                <AddonPicker item={item} picks={item.picks ?? {}} onPick={(g, a) => b.setPicks(item.id, withPick(item.picks ?? {}, g, a))} />
              </section>
            )
          })}
        </div>
        {plain > 0 && <p className="mt-2.5 text-small text-muted">Everything else is ready as is.</p>}
        <div className="mt-3.5 flex justify-between rounded-[14px] border border-line bg-white px-4 py-3.5 text-base">
          <span className="text-charcoal-soft">Total</span>
          <b className="text-price text-charcoal">{fmt(cartTotal(b.items, b.bundle))}</b>
        </div>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate(from ?? "/home")}>Back</Button>
        <Button disabled={!ready} onClick={() => navigate(from ?? `/item/${firstId}`)}>{from ? "Done" : "Next"}</Button>
      </Foot>
    </AppShell>
  )
}

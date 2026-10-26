import { useCallback, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { PAYMENT_SOON, PaymentForm } from "@/components/go/PaymentForm"
import { labelForIso } from "@/lib/availability"
import { waitForPayment } from "@/lib/paymentApi"
import { checkoutSteps } from "@/lib/steps"
import { paymentAvailable } from "@/lib/stripe"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct booking, the retainer, right after the hold (tiers 1 and 2). The
   amount and what it is, then Stripe's embedded form. When the form says the
   payment went through the page asks the admin until it says paid; only
   then is it "Paid". Skipping is allowed: the hold stands and My party shows
   the retainer as the next step. No online payment (the admin sent none, or
   there is no key here) means the honest line and nothing to tap. */

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Phase = "form" | "checking" | "paid" | "unconfirmed"

export default function ItemPay() {
  const navigate = useNavigate()
  const b = useBooking()
  const { customer } = useCustomer()
  const [phase, setPhase] = useState<Phase>("form")

  const offer = b.payment
  const onComplete = useCallback(() => {
    if (!offer) return
    setPhase("checking")
    waitForPayment(offer.sessionId).then((s) => setPhase(s?.paid ? "paid" : "unconfirmed"))
  }, [offer])

  if (!b.direct || b.items.length === 0) return <Navigate to="/home" replace />
  const { direct } = b
  const tier = direct.tier ?? b.tier?.tier ?? 1
  const steps = checkoutSteps(b.optionsStep, customer !== null, tier === 3 ? 1 : tier)
  const available = paymentAvailable(offer)
  const day = labelForIso(direct.eventDate)

  const finish = () => {
    b.setItems([])
    b.set("direct", null)
    b.set("payment", null)
    b.set("agreed", false)
    navigate("/home")
  }

  if (phase === "paid") {
    return (
      <AppShell>
        <Body className="text-center">
          <div className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-orange-tint">
            <Check className="size-[30px] stroke-orange" strokeWidth={2.5} />
          </div>
          <h1 className="text-hero text-charcoal">{tier === 2 ? "Signed and paid. Your date is confirmed." : "Paid. Your date is held."}</h1>
          <p className="mt-2 text-body text-charcoal-soft">{day} is yours. The rest lives in My party.</p>
        </Body>
        <Foot>
          <Button onClick={finish}>Done</Button>
        </Foot>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>
          {b.items.length === 1 ? "Just this" : "Just these"} · Step {steps.pay} of {steps.total}
        </GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Your retainer</h1>
        <p className="mt-2 text-body text-charcoal-soft">
          {offer ? `Your ${b.tier?.retainerPercent ?? 30}% retainer holds the date. It is non-refundable.` : "Your retainer holds the date. It is non-refundable."}
        </p>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <MetaCard label="Retainer" value={offer ? usd(offer.amount) : "To be confirmed"} />
          <MetaCard label="When" value={day} />
        </div>
        {available && offer ? (
          <div className="mt-4">
            {phase === "form" && <PaymentForm clientSecret={offer.clientSecret} onComplete={onComplete} />}
            {phase === "checking" && <p className="text-body text-muted">Checking with our booking system.</p>}
            {phase === "unconfirmed" && (
              <div className="rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
                We haven't heard back from the payment yet. Your hold stands either way; My party will show it as paid once it lands.
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">{PAYMENT_SOON}</p>
        )}
      </Body>
      <Foot>
        {available && offer && phase === "form" ? (
          <Button variant="ghost" onClick={() => navigate("/item/held")}>
            Pay later
          </Button>
        ) : (
          <Button onClick={() => navigate("/item/held")}>Continue</Button>
        )}
      </Foot>
    </AppShell>
  )
}

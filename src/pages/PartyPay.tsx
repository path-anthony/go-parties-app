import { useCallback, useEffect, useState } from "react"
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { PAYMENT_SOON, PAYMENT_SOON_BALANCE, PaymentForm } from "@/components/go/PaymentForm"
import { customerApi } from "@/lib/customerApi"
import { waitForPayment, type PaymentOffer } from "@/lib/paymentApi"
import { paymentAvailable } from "@/lib/stripe"
import { useCustomer } from "@/state/customer"

/* Paying from the portal: the retainer (?kind=retainer) or the balance
   (?kind=balance). The admin mints the session for this booking, the form is
   Stripe's embedded one, and paid means the admin said so. "Nothing due" and
   "not payable yet" are said as they are. */

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type State =
  | { kind: "loading" }
  | { kind: "offer"; offer: PaymentOffer }
  | { kind: "nothing-due" }
  | { kind: "not-payable" }
  | { kind: "error"; message: string }

/* Keyed by booking and kind, so moving from one payment to another (the
   retainer, then the balance) starts the screen over instead of carrying a
   "paid" phase across. */
export default function PartyPay() {
  const { id = "" } = useParams()
  const [params] = useSearchParams()
  const kind: "retainer" | "balance" = params.get("kind") === "balance" ? "balance" : "retainer"
  return <PartyPayFor key={`${id}:${kind}`} id={id} kind={kind} />
}

function PartyPayFor({ id, kind }: { id: string; kind: "retainer" | "balance" }) {
  const navigate = useNavigate()
  const { customer, ready } = useCustomer()
  const [state, setState] = useState<State>({ kind: "loading" })
  const [phase, setPhase] = useState<"form" | "checking" | "paid" | "unconfirmed">("form")

  const fetchIt = useCallback(
    () =>
      customerApi.paymentSession(id, kind).then((r) => {
        if (r.ok) setState({ kind: "offer", offer: r.data })
        else if (r.reason === "nothing-due") setState({ kind: "nothing-due" })
        else if (r.reason === "not-payable") setState({ kind: "not-payable" })
        else setState({ kind: "error", message: r.message })
      }),
    [id, kind]
  )
  const load = useCallback(() => {
    setState({ kind: "loading" })
    void fetchIt()
  }, [fetchIt])

  useEffect(() => {
    if (customer) void fetchIt()
  }, [customer, fetchIt])

  const offer = state.kind === "offer" ? state.offer : null
  const onComplete = useCallback(() => {
    if (!offer) return
    setPhase("checking")
    waitForPayment(offer.sessionId).then((s) => setPhase(s?.paid ? "paid" : "unconfirmed"))
  }, [offer])

  if (ready && !customer) return <Navigate to="/party/signin" replace />

  const label = kind === "balance" ? "Your balance" : "Your retainer"
  const available = paymentAvailable(offer)

  if (phase === "paid") {
    return (
      <AppShell>
        <Body className="text-center">
          <span className="mx-auto mb-3.5 inline-block rounded-full bg-orange-tint px-3 py-1 text-[11px] font-bold tracking-[.14em] text-charcoal uppercase">Paid</span>
          <h1 className="text-hero text-charcoal">Paid. Thank you.</h1>
          <p className="mt-2 text-body text-charcoal-soft">{kind === "balance" ? "Your balance is settled." : "Your retainer is in. Your booking shows it in My party."}</p>
        </Body>
        <Foot>
          <Button onClick={() => navigate("/party")}>Back to My party</Button>
        </Foot>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>My party</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">{label}</h1>
        {kind === "retainer" && <p className="mt-2 text-body text-charcoal-soft">Your retainer holds the date. It is non-refundable.</p>}
        {kind === "balance" && <p className="mt-2 text-body text-charcoal-soft">The rest of your total, due before the event.</p>}
        {state.kind === "loading" && <p className="mt-4 text-body text-muted">Getting the amount.</p>}
        {state.kind === "nothing-due" && <p className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">Nothing is due right now.</p>}
        {state.kind === "not-payable" && <p className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">{kind === "balance" ? PAYMENT_SOON_BALANCE : PAYMENT_SOON}</p>}
        {state.kind === "error" && (
          <div className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {state.message}
            <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={load}>
              Try again
            </Button>
          </div>
        )}
        {offer && (
          <>
            <div className="mt-3.5">
              <MetaCard label={kind === "balance" ? "Balance" : "Retainer"} value={usd(offer.amount)} />
            </div>
            {available ? (
              <div className="mt-4">
                {phase === "form" && <PaymentForm clientSecret={offer.clientSecret} onComplete={onComplete} />}
                {phase === "checking" && <p className="text-body text-muted">Checking with our booking system.</p>}
                {phase === "unconfirmed" && (
                  <div className="rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
                    We haven't heard back from the payment yet. My party will show it as paid once it lands.
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">{kind === "balance" ? PAYMENT_SOON_BALANCE : PAYMENT_SOON}</p>
            )}
          </>
        )}
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/party")}>
          Back
        </Button>
      </Foot>
    </AppShell>
  )
}

import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body } from "@/components/go/AppShell"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import { GoLabel } from "@/components/go/GoLabel"
import { Letterhead } from "@/components/go/Letterhead"
import { MetaCard } from "@/components/go/MetaCard"
import { PAYMENT_SOON, PAYMENT_SOON_BALANCE, PaymentForm } from "@/components/go/PaymentForm"
import { usePrivateLink } from "@/hooks/use-private-link"
import { longDay, shortDay } from "@/lib/nextStep"
import { payLinkApi, type PayLoad, type PayView } from "@/lib/payLinkApi"
import { waitForPayment, type PaymentOffer } from "@/lib/paymentApi"
import { paymentAvailable } from "@/lib/stripe"
import { usePublicSettings } from "@/lib/settings"

/* /pay/:token, the pay screen for the admin's private pay link (Block S9b,
   S9-CONTRACT section 6). The link comes by text and email; the token is the
   only credential, so there is no account and no session. Like the contract
   page it stands alone (the wordmark and nothing to wander off with) and is
   kept out of search engines, referrers and analytics (use-private-link.ts).

   What it shows is what the admin returns for the token: who it is for, the
   event date, the amount owed and whether it is the retainer or the balance,
   and what has been paid. Block S9c adds what the admin now returns: the
   items (or package name), the event time, the guest count, and the balance
   with its due date.
   The amount is the admin's and never computed here. By step:
     sign      the contract comes first: a button to the existing contract page
     retainer  the rental policy (for a booking with no contract) to read and
               accept; ticking the box tells the admin (POST /api/pay/:token
               /policy) before Pay opens Stripe's own form on this page. A
               policy the customer already accepted is not shown again, and a
               policy saved since the page loaded is shown again to re-accept
     balance   the amount, then Pay
     nothing   all paid up; closed: nothing is owed
   After the form reports done the admin is asked (never assumed) and the
   screen says Paid, with a link to My party. */

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })

const card = "rounded-[14px] border border-line bg-white px-4 py-3.5"

/* The signing page is a path on this site; the admin sends a full address.
   Only the path is used, and only for /sign/, so the link can only lead
   inside the store. */
function signPath(link: string | null): string | null {
  if (!link) return null
  try {
    const p = new URL(link, window.location.origin).pathname
    return p.startsWith("/sign/") ? p : null
  } catch {
    return null
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <AppShell bare>
      <Letterhead />
      <Body>{children}</Body>
    </AppShell>
  )
}

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Frame>
      <GoLabel>Payment</GoLabel>
      <h1 className="mt-1.5 text-hero text-charcoal">{title}</h1>
      {children}
    </Frame>
  )
}

export default function Pay() {
  usePrivateLink()
  const { token = "" } = useParams()
  const settings = usePublicSettings()
  const phone = settings?.companyPhone ?? settings?.rushContactPhone ?? null
  const [load, setLoad] = useState<PayLoad | null>(null)
  const [round, setRound] = useState(0)
  // The policy box: ticking it tells the admin, so it is only "ticked" once
  // that is recorded. A newer policy (409 policy-changed) replaces the text.
  const [ticked, setTicked] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [newerPolicy, setNewerPolicy] = useState<PayView["policy"]>(null)
  const [offer, setOffer] = useState<PaymentOffer | null>(null)
  const [phase, setPhase] = useState<"view" | "starting" | "form" | "checking" | "paid" | "unconfirmed">("view")
  const [error, setError] = useState<string | null>(null)
  const [paidView, setPaidView] = useState<PayView | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    payLinkApi.get(token, controller.signal).then(setLoad)
    return () => controller.abort()
  }, [token, round])

  const retry = useCallback(() => {
    setLoad(null)
    setRound((n) => n + 1)
  }, [])

  const tick = async (checked: boolean, policyId: string) => {
    setError(null)
    if (!checked) return setTicked(false)
    setTicked(true)
    setRecording(true)
    const r = await payLinkApi.policy(token, policyId)
    setRecording(false)
    if (r.ok) return setRecorded(true)
    setTicked(false)
    if (r.reason === "policy-changed" && r.policy) {
      setNewerPolicy(r.policy)
      setError("The policy was updated. Read it again, then check the box.")
      return
    }
    setError(r.message)
    if (r.reason !== "error") retry()
  }

  const start = async () => {
    setError(null)
    setPhase("starting")
    const r = await payLinkApi.session(token)
    if (!r.ok) {
      setError(r.message)
      setPhase("view")
      if (r.reason !== "error") retry()
      return
    }
    setOffer(r.offer)
    setPhase("form")
  }

  const onComplete = useCallback(() => {
    if (!offer) return
    setPhase("checking")
    waitForPayment(offer.sessionId).then(async (s) => {
      if (!s?.paid) return setPhase("unconfirmed")
      // The admin's own word on where the booking stands now.
      const again = await payLinkApi.get(token)
      setPaidView(again.kind === "ok" ? again.view : null)
      setPhase("paid")
    })
  }, [offer, token])

  if (!load) {
    return (
      <Frame>
        <GoLabel>Payment</GoLabel>
        <p className="mt-2 text-body text-muted">Opening your payment.</p>
      </Frame>
    )
  }
  if (load.kind === "not-found") {
    return (
      <Notice title="This link doesn't work.">
        <p className="mt-2 text-body text-charcoal-soft">Check that you opened the whole link from our message. If it still fails, call or text GO{phone ? ` at ${phone}` : ""}.</p>
      </Notice>
    )
  }
  if (load.kind === "error") {
    return (
      <Notice title="We couldn't open this.">
        <ErrorNotice className="mt-3">That didn't load. Nothing was charged.</ErrorNotice>
        <Button className="mt-3" variant="dark" onClick={retry}>
          Try again
        </Button>
      </Notice>
    )
  }

  const v = load.view
  const date = v.eventDate ? longDay(v.eventDate) : ""
  const who = v.customerFirstName ? `For ${v.customerFirstName}` : "Your booking"

  if (phase === "paid") {
    const confirmed = paidView?.stage === "Confirmed"
    const kind = offer?.kind ?? v.kind
    return (
      <Frame>
        <div className="text-center">
          <span className="mx-auto mb-3.5 inline-block rounded-full bg-orange-tint px-3 py-1 text-[11px] font-bold tracking-[.14em] text-charcoal uppercase">Paid</span>
          <h1 className="text-hero text-charcoal">{confirmed ? "Paid. You're confirmed." : "Paid. Thank you."}</h1>
          <p className="mt-2 text-body text-charcoal-soft">
            {kind === "balance" ? "Your balance is settled." : "Your retainer is in."}
            {confirmed && date ? ` Your event is ${date}.` : ""}
          </p>
          <p className="mt-2 text-body text-charcoal-soft">A confirmation is on its way by text and email.</p>
          <Button className="mt-5 w-full" variant="dark" asChild>
            <Link to="/party">Go to My party</Link>
          </Button>
        </div>
      </Frame>
    )
  }

  if (v.step === "closed") {
    return (
      <Notice title="Nothing to pay.">
        <p className="mt-2 text-body text-charcoal-soft">This booking is cancelled or already finished, so nothing is owed.</p>
        <Button className="mt-5 w-full" variant="dark" asChild>
          <Link to="/party">Go to My party</Link>
        </Button>
      </Notice>
    )
  }
  if (v.step === "nothing") {
    return (
      <Notice title="You're all paid up.">
        <p className="mt-2 text-body text-charcoal-soft">Nothing is owed on your booking{date ? ` for ${date}` : ""}. Thank you.</p>
        <Button className="mt-5 w-full" variant="dark" asChild>
          <Link to="/party">Go to My party</Link>
        </Button>
      </Notice>
    )
  }
  if (v.step === "sign") {
    const to = signPath(v.contractLink)
    return (
      <Notice title="Sign your contract first.">
        <p className="mt-2 text-body text-charcoal-soft">{who}{date ? `, ${date}` : ""}. Your contract comes before the retainer{v.amount !== null ? ` of ${usd(v.amount)}` : ""}.</p>
        {to ? (
          <Button className="mt-5 w-full" variant="dark" asChild>
            <Link to={to}>Read and sign</Link>
          </Button>
        ) : (
          <p className="mt-4 text-body text-charcoal-soft">Call or text GO{phone ? ` at ${phone}` : ""} and we will send it again.</p>
        )}
      </Notice>
    )
  }

  // retainer or balance
  const kind = v.step
  const owed = v.amount ?? 0
  const policy = newerPolicy ?? v.policy
  const needsPolicy = v.policyRequired && !v.policyAccepted && policy !== null
  const ready = !needsPolicy || recorded
  const available = offer ? paymentAvailable(offer) : true
  const soon = kind === "balance" ? PAYMENT_SOON_BALANCE : PAYMENT_SOON
  const when = v.eventDate ? `${shortDay(v.eventDate)}${v.eventTime ? `, ${v.eventTime}` : ""}` : "To be set"
  const afterRetainer = kind === "retainer" && v.balance !== null && v.balance > 0 ? `Then your balance of ${usd(v.balance)} is due${v.balanceDueDate ? ` ${shortDay(v.balanceDueDate)}` : " before the event"}.` : null
  const balanceDue = kind === "balance" && v.balanceDueDate ? `Due ${shortDay(v.balanceDueDate)}.` : null

  return (
    <Frame>
      <GoLabel>Payment</GoLabel>
      <h1 className="mt-1.5 text-hero text-charcoal">{kind === "balance" ? "Your balance" : "Your retainer"}</h1>
      <p className="mt-2 text-body text-charcoal-soft">
        {who}
        {kind === "balance" ? ". The rest of your total, due before the event." : ". The retainer holds your date."}
      </p>

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <MetaCard label="Event" value={when} />
        <MetaCard label={kind === "balance" ? "Balance due" : "Retainer due"} value={usd(owed)} />
      </div>
      {(afterRetainer || balanceDue) && <p className="mt-2 text-small text-charcoal-soft">{afterRetainer ?? balanceDue}</p>}
      {v.total !== null && v.total > 0 && (
        <p className="mt-1 text-small text-muted">
          Total {usd(v.total)}. Paid so far {usd(v.paid)}.
        </p>
      )}

      {(v.package || v.items.length > 0 || v.guestCount !== null) && (
        <div className="mt-4">
          <GoLabel>What you booked</GoLabel>
          <div className={`mt-1.5 ${card}`}>
            {v.package && <b className="block text-sm text-charcoal">{v.package}</b>}
            {v.items.map((i, n) => (
              <div key={`${i.name}-${n}`} className="flex items-baseline justify-between gap-3 text-small text-charcoal-soft">
                <span>{i.name}</span>
                {i.quantity > 1 && <span className="flex-none text-muted">x{i.quantity}</span>}
              </div>
            ))}
            {v.guestCount !== null && <p className={`${v.package || v.items.length > 0 ? "mt-1.5 " : ""}text-small text-muted`}>{v.guestCount === 1 ? "1 guest" : `${v.guestCount} guests`}</p>}
          </div>
        </div>
      )}

      {needsPolicy && policy && !recorded && (
        <div className="mt-4">
          <GoLabel>Rental policy</GoLabel>
          <div className={`mt-1.5 ${card}`}>
            <p className="max-h-64 overflow-y-auto text-small whitespace-pre-line text-charcoal-soft">{policy.text}</p>
          </div>
          <label className="mt-2.5 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              className="mt-0.5 size-5 flex-none cursor-pointer accent-charcoal"
              checked={ticked}
              onChange={(e) => tick(e.target.checked, policy.id)}
              disabled={phase !== "view" || recording}
            />
            <span>I have read and agree to the rental policy</span>
          </label>
          {recording ? <p className="mt-1 pl-8 text-small text-muted">Saving.</p> : !ticked && <p className="mt-1 pl-8 text-small text-muted">Check the box to pay.</p>}
        </div>
      )}
      {(v.policyAccepted || recorded) && v.policyRequired && <p className="mt-3 text-small text-muted">Rental policy accepted.</p>}

      {error && <ErrorNotice className="mt-4">{error}</ErrorNotice>}

      <div className="mt-4">
        {(phase === "view" || phase === "starting") && (
          <Button className="w-full" variant="dark" disabled={!ready || phase === "starting"} onClick={start}>
            {phase === "starting" ? "Opening payment" : `Pay ${usd(owed)}`}
          </Button>
        )}
        {phase === "form" && offer && (available ? <PaymentForm clientSecret={offer.clientSecret} onComplete={onComplete} /> : <p className={card + " text-sm text-charcoal"}>{soon}</p>)}
        {phase === "checking" && <p className="text-body text-muted">Checking with our booking system.</p>}
        {phase === "unconfirmed" && (
          <div className={card + " text-sm text-charcoal"}>
            We haven't heard back from the payment yet. You will get a text and an email as soon as it lands. You can close this page.
          </div>
        )}
      </div>
    </Frame>
  )
}

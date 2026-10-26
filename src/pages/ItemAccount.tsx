import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MetaCard } from "@/components/go/MetaCard"
import { CartItems } from "@/components/go/CartItems"
import { CheckoutConcierge } from "@/components/go/CheckoutConcierge"
import { Honeypot } from "@/components/go/Honeypot"
import { CheckoutAgreement } from "@/components/go/CheckoutAgreement"
import { BalancePreference } from "@/components/go/BalancePreference"
import { Reveal } from "@/components/go/DatePicker"
import { SignUpFields } from "@/components/go/SignUpFields"
import { labelForIso } from "@/lib/availability"
import { bookDirect, type DirectReason } from "@/lib/adminApi"
import { directInput, tierInput } from "@/lib/directInput"
import { fetchTier } from "@/lib/tierApi"
import { clockLabel } from "@/data/catalog"
import { missingRequired } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { canSignUp, useSignUp, type SignUpValues } from "@/hooks/use-signup"
import { useBooking } from "@/state/booking"
import { useAgreementBlocked } from "@/hooks/use-agreement"
import { useCustomer } from "@/state/customer"

/* Direct booking, step 3 of 3, guests only. Before the date is held: make an
   account (the same sign-up as the portal, prefilled from the who screen) or
   continue as a guest. An account books exactly like a signed-in customer
   does today: the request carries no contact and the account fills it, so
   the booking is tied to it. A guest books exactly as before. Signed-in
   customers never see this screen. A refusal that isn't about the date
   shows the bank's calm line and a Try again with everything typed still
   in place; if the sign-up went through and only the booking failed, the
   who screen takes over (the account is real now) and gets the notice. */

type Choice = "account" | "guest" | null
type Notice = { reason: DirectReason; message: string }

export default function ItemAccount() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer, ready } = useCustomer()
  const { signUp, busy: signingUp, notice: signUpNotice, setNotice: setSignUpNotice } = useSignUp()
  const [choice, setChoice] = useState<Choice>(null)
  const [values, setValues] = useState<SignUpValues>({ name: b.contactName, phone: b.phone, email: b.email, password: "" })
  const [booking, setBooking] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const agreementBlocked = useAgreementBlocked()

  const tierKey = `${b.items.map((i) => `${i.id}:${JSON.stringify(i.picks ?? {})}`).join(",")}|${b.bundle?.id ?? ""}|${b.itemDate}|${b.itemTime}`
  useEffect(() => {
    if (b.tier || !b.itemDate || b.items.length === 0) return
    let live = true
    fetchTier(tierInput(b)).then((r) => {
      if (live && r.ok) b.set("tier", r.tier)
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.tier, tierKey])

  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/account`} replace />
  const firstId = b.items[0].id
  if (!b.itemDate) return <Navigate to={`/item/${firstId}`} replace />
  if (b.items.some((i) => missingRequired(i).length > 0)) return <Navigate to={`/item/${firstId}/options`} replace />
  const tier = b.tier?.tier ?? null
  const steps = checkoutSteps(b.optionsStep, false, tier)
  const here = `/item/${firstId}/account`
  // Not while a hold is in flight, and not after one that left this screen.
  // A fresh sign-up sets the customer before the booking after it has
  // answered, and navigate() is deferred: if `booking` dropped back to
  // false on success, this guard would re-fire on the very next render and
  // its Navigate to the who screen would beat the pending one to held,
  // handing the customer a fresh "Hold my date" for a booking that already
  // exists. So `booking` stays true on every path that leaves the screen
  // and is reset only when the screen stays to show a notice.
  if (ready && customer && !booking) return <Navigate to={`/item/${firstId}/who`} replace />
  if (b.contactName.trim() === "" || b.phone.trim() === "" || b.email.trim() === "") return <Navigate to={`/item/${firstId}/who`} replace />

  const iso = b.itemDate
  const clock = clockLabel(b.itemTime)
  const when = clock ? `${labelForIso(iso)}, ${clock}` : labelForIso(iso)
  const busy = signingUp || booking

  const removeItem = (rid: string) => b.setItems(b.items.filter((i) => i.id !== rid))
  const canHold = !busy && !agreementBlocked && (choice === "guest" || (choice === "account" && canSignUp(values)))

  // Signed up but not booked: the who screen owns the retry now, with the
  // notice in hand (booking stays true so the guard above can't race this
  // navigation and drop the notice). Still a guest: the notice shows here
  // and the button comes back.
  const fail = (n: Notice, who: typeof customer) => {
    if (who) {
      navigate(`/item/${firstId}/who`, { replace: true, state: { notice: n } })
      return
    }
    setNotice(n)
    setBooking(false)
  }

  const hold = async () => {
    if (!canHold) return
    setNotice(null)
    setSignUpNotice(null)
    let who = customer
    if (choice === "account") {
      who = await signUp(values)
      if (!who) return
      b.set("contactName", values.name.trim())
      b.set("phone", values.phone.trim())
      b.set("email", values.email.trim())
    }
    setBooking(true)
    try {
      // Asked again right before the hold. Tier 2 goes on to the contract
      // instead of holding here; `booking` stays true so the guard above
      // cannot bounce a freshly signed-up customer back to who on the way.
      const t = await fetchTier(tierInput(b))
      if (!t.ok) {
        fail({ reason: "error", message: t.message }, who)
        return
      }
      b.set("tier", t.tier)
      if (t.tier.tier === 2) {
        navigate(`/item/${firstId}/contract`)
        return
      }
      const result = await bookDirect(directInput({ ...b, tier: t.tier, contactName: values.name || b.contactName }, who))
      if (result.ok) {
        // Leaving: `booking` stays true on purpose, see the guard above. The
        // admin's 202 (sent to the team, nothing held) leaves the same way.
        if (result.kind === "review") {
          b.set("review", result.review)
          navigate("/item/review")
          return
        }
        b.set("direct", result.booking)
        b.set("payment", result.booking.payment ?? null)
        navigate("/item/pay")
        return
      }
      fail({ reason: result.reason, message: result.message }, who)
    } catch {
      fail({ reason: "error", message: "That didn't go through. Try again, or text us." }, who)
    }
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>{b.items.length === 1 ? "Just this" : "Just these"} · Step {steps.account} of {steps.total}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Make an account?</h1>
        <p className="mt-2 text-body text-charcoal-soft">Sign in later to move it or cancel it. No account needed either way.</p>
        <div className="mt-3.5">
          <MetaCard label="When" value={when} />
        </div>
        <div className="mt-2">
          <CartItems
            items={b.items}
            bundle={b.bundle}
            onRemove={removeItem}
            onConfigure={() => navigate(`/item/${firstId}/options`, { state: { from: here } })}
            showTotal
          />
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Chip selected={choice === "account"} sub="Phone, email, a password" onClick={() => setChoice("account")}>
            Create account
          </Chip>
          <Chip selected={choice === "guest"} sub="No account needed" onClick={() => setChoice("guest")}>
            Continue as guest
          </Chip>
        </div>
        <Reveal open={choice === "account"} max="max-h-[44rem]" className="mt-3.5 pb-1">
          <SignUpFields values={values} onChange={setValues} onSubmit={hold} />
          {signUpNotice && (
            <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
              {signUpNotice}{" "}
              {/sign in/i.test(signUpNotice) && (
                <Link to="/party/signin" state={{ returnTo: `/item/${firstId}/who` }} className="font-bold text-charcoal">
                  Sign in
                </Link>
              )}
            </div>
          )}
        </Reveal>
        {notice && (
          <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {notice.message}
            {notice.reason === "unavailable" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2.5 block"
                onClick={() => {
                  b.set("itemDate", null)
                  navigate(`/item/${firstId}`)
                }}
              >
                Pick another date
              </Button>
            )}
            {notice.reason === "addons" && (
              <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={() => navigate(`/item/${firstId}/options`, { state: { from: here } })}>
                Pick options
              </Button>
            )}
            {notice.reason === "error" && (
              <Button variant="ghost" size="sm" className="mt-2.5 block" disabled={!canHold} onClick={hold}>
                Try again
              </Button>
            )}
          </div>
        )}
        <p className="mt-2.5 text-small text-muted">Nothing to pay right now. We'll reach out to confirm and finish your booking.</p>
        <Honeypot value={b.hp} onChange={(v) => b.set("hp", v)} />
        <BalancePreference className="mt-4" />
        {tier !== 2 && <CheckoutAgreement className="mt-4" />}
        {tier === 2 && <p className="mt-4 text-small text-charcoal-soft">This booking comes with a contract. You'll read and sign it on the next screen.</p>}
        <CheckoutConcierge className="mt-1.5" />
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate(`/item/${firstId}/who`)}>Back</Button>
        <Button disabled={!canHold} onClick={hold}>{tier === 2 ? "Next" : "Hold my date"}</Button>
      </Foot>
    </AppShell>
  )
}

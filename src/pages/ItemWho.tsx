import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { CartItems } from "@/components/go/CartItems"
import { CheckoutConcierge } from "@/components/go/CheckoutConcierge"
import { Honeypot } from "@/components/go/Honeypot"
import { CheckoutAgreement } from "@/components/go/CheckoutAgreement"
import { BalanceLine, CheckoutNext } from "@/components/go/CheckoutNotes"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import { AddressField } from "@/components/go/AddressField"
import { SetupMap } from "@/components/go/SetupMap"
import { mapsAvailable } from "@/lib/maps"
import type { VerifiedAddress } from "@/lib/places"
import { labelForIso } from "@/lib/availability"
import { bookDirect, type DirectReason } from "@/lib/adminApi"
import { directInput, tierInput } from "@/lib/directInput"
import { fetchTier } from "@/lib/tierApi"
import { clockLabel as clockFor } from "@/data/catalog"
import { missingRequired } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { useBooking } from "@/state/booking"
import { useAgreementBlocked } from "@/hooks/use-agreement"
import { useCustomer } from "@/state/customer"

/* Direct booking, "Event details" (Block S3): the step after sign in, for
   a signed-in customer only (anyone else is sent to the account step).
   Name, phone and email come from the account and are shown read-only at
   the top with a "Change" link to My party (a name is asked here only when
   the account has none). Then the event address, required, with "Same as
   my home address" above it: ticked, the event address is the home address
   and the field is locked; unticked, it is cleared. A customer whose
   account has no home address yet gets a "Your home address" field first,
   required, sent with the hold (the admin saves it to the account). With a
   Google key the event address is picked from Places suggestions, then a
   pin and setup notes (Block M); without one it is the plain field. Tier 1
   holds here ("Hold my date"); tier 2 goes on to the contract ("Next").
   Every refusal is the red notice directly above the button; a 401
   account-required sends the customer back to the account step, cart
   kept. The contract step can hand a notice over in location state. */

type Notice = { reason: DirectReason; message: string }

export default function ItemWho() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer, ready, setCustomer } = useCustomer()
  const [submitting, setSubmitting] = useState(false)
  const agreementBlocked = useAgreementBlocked()
  const [notice, setNotice] = useState<Notice | null>(null)

  // The tier is asked for as soon as this screen opens, so the button and
  // the step count can say what comes next; it is cleared by the store
  // whenever the cart or date changes, and asked again then.
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
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/who`} replace />
  if (!b.itemDate) return <Navigate to={`/item/${b.items[0].id}`} replace />
  if (b.items.some((i) => missingRequired(i).length > 0)) return <Navigate to={`/item/${b.items[0].id}/options`} replace />
  if (ready && !customer) return <Navigate to={`/item/${b.items[0].id}/account`} replace />
  const items = b.items
  const firstId = items[0].id
  const iso = b.itemDate

  const needsName = !!customer && !customer.name
  const mapsOn = mapsAvailable()
  const homeOnFile = customer?.homeAddress?.trim() || ""
  // The home address the checkbox copies from: the account's, else the one
  // typed here.
  const home = homeOnFile || b.homeAddress.trim()
  const homeSettled = homeOnFile !== "" || b.homeAddress.trim() !== ""
  const addressSettled = b.sameAsHome ? b.address.trim() !== "" : mapsOn ? b.verified !== null : b.address.trim() !== ""
  const setVerified = (v: VerifiedAddress | null) => {
    b.set("verified", v)
    b.set("setup", v ? { lat: v.addressLat, lng: v.addressLng } : null)
    if (!v) b.set("setupNotes", "")
  }
  const setSame = (on: boolean) => {
    b.set("sameAsHome", on)
    setVerified(null)
    b.set("address", on ? home : "")
  }
  const setHome = (text: string) => {
    b.set("homeAddress", text)
    if (b.sameAsHome) b.set("address", text)
  }
  const SETUP_MAX = 200
  const nameSettled = needsName ? b.contactName.trim() !== "" : true
  // Only the last screen holds the date, so only there does the policy wait.
  const canSubmit = !!customer && nameSettled && homeSettled && addressSettled && !submitting && !agreementBlocked

  const tier = b.tier?.tier ?? null
  const steps = checkoutSteps(b.optionsStep, !b.accountStep, tier)
  const here = `/item/${firstId}/who`

  const removeItem = (rid: string) => b.setItems(items.filter((i) => i.id !== rid))

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setNotice(null)
    try {
      // The tier held in the store is used when there is one (the store drops
      // it on any cart or date change); the admin recomputes the tier at the
      // hold anyway and refuses a mismatch (S1.2).
      const t = b.tier ? ({ ok: true, tier: b.tier } as const) : await fetchTier(tierInput(b))
      if (!t.ok) {
        setNotice({ reason: "error", message: t.message })
        return
      }
      b.set("tier", t.tier)
      if (t.tier.tier === 2) {
        navigate(`/item/${firstId}/contract`)
        return
      }
      const result = await bookDirect(directInput({ ...b, tier: t.tier }, customer))
      if (result.ok) {
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
      if (result.reason === "account-required") {
        // The admin saw no session, so there is none here either: dropping
        // the customer sends the guard above to the account step, cart kept,
        // with the line to show.
        b.set("accountNotice", result.message)
        setCustomer(null)
        return
      }
      setNotice({ reason: result.reason, message: result.message })
    } catch {
      setNotice({ reason: "error", message: "That didn't go through. Try again, or text us." })
    } finally {
      setSubmitting(false)
    }
  }

  const clock = clockFor(b.itemTime)
  const when = clock ? `${labelForIso(iso)}, ${clock}` : labelForIso(iso)

  return (
    <AppShell>
      <Body>
        <GoLabel>{items.length === 1 ? "Just this" : "Just these"} · Step {steps.who} of {steps.total}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Event details</h1>
        <p className="mt-2 text-body text-charcoal-soft">Where the party is. The rest is on your account.</p>
        <div className="mt-3.5">
          <MetaCard label="When" value={when} />
        </div>
        <div className="mt-2">
          <CartItems
            items={items}
            bundle={b.bundle}
            onRemove={removeItem}
            onConfigure={() => navigate(`/item/${firstId}/options`, { state: { from: here } })}
            showTotal
          />
        </div>
        {customer && (
          <div className="mt-3.5 flex items-start justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3.5">
            <div className="min-w-0">
              <small className="block text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">Booking as</small>
              {customer.name && <b className="mt-[3px] block text-sm text-charcoal">{customer.name}</b>}
              <span className="block text-small text-charcoal-soft">{customer.phone}</span>
              <span className="block truncate text-small text-charcoal-soft">{customer.email}</span>
            </div>
            <Link to="/party" state={{ returnTo: here }} className="inline-flex min-h-[44px] flex-none items-center text-[13px] font-bold text-charcoal underline underline-offset-2">
              Change
            </Link>
          </div>
        )}
        {needsName && (
          <div className="mt-3.5">
            <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
            <Input placeholder="Sarah Lin" autoComplete="name" value={b.contactName} onChange={(e) => b.set("contactName", e.target.value)} />
          </div>
        )}
        {customer && !homeOnFile && (
          <div className="mt-3.5">
            <GoLabel className="mb-1.5 tracking-[.1em]">Your home address</GoLabel>
            <Input placeholder="14 Maple Ln, Farmington, CT 06032" autoComplete="street-address" value={b.homeAddress} onChange={(e) => setHome(e.target.value)} />
            <p className="mt-1.5 text-small text-muted">Saved to your account for next time.</p>
          </div>
        )}
        <label className="mt-3.5 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-semibold text-charcoal">
          <input type="checkbox" className="size-5 flex-none accent-charcoal" checked={b.sameAsHome} disabled={!homeSettled} onChange={(e) => setSame(e.target.checked)} />
          Same as my home address
        </label>
        <div className="mt-1.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Event address</GoLabel>
          {b.sameAsHome ? (
            <Input value={b.address} readOnly aria-readonly="true" autoComplete="off" className="bg-cream" />
          ) : mapsOn ? (
            <AddressField value={b.address} verified={b.verified} onText={(t) => b.set("address", t)} onVerified={setVerified} />
          ) : (
            <>
              <Input placeholder="14 Maple Ln, Farmington" autoComplete="street-address" value={b.address} onChange={(e) => b.set("address", e.target.value)} />
              <p className="mt-1.5 text-small text-muted">We'll confirm your exact address by text.</p>
            </>
          )}
        </div>
        {mapsOn && !b.sameAsHome && b.verified && (
          <div className="mt-3">
            <SetupMap
              address={{ lat: b.verified.addressLat, lng: b.verified.addressLng }}
              setup={b.setup ?? { lat: b.verified.addressLat, lng: b.verified.addressLng }}
              onSetup={(p) => b.set("setup", p)}
            />
          </div>
        )}
        {mapsOn && !b.sameAsHome && b.verified && (
          <div className="mt-2.5">
            <GoLabel className="mb-1.5 tracking-[.1em]">Setup notes</GoLabel>
            <Input placeholder="Backyard, gate on the left" maxLength={SETUP_MAX} value={b.setupNotes} onChange={(e) => b.set("setupNotes", e.target.value.slice(0, SETUP_MAX))} />
            <small className="mt-1 block text-[11.5px] text-muted">Optional. Where the crew should set up, in a line.</small>
          </div>
        )}
        <Honeypot value={b.hp} onChange={(v) => b.set("hp", v)} />
        <CheckoutNext tier={tier} className="mt-3.5" />
        <BalanceLine className="mt-1.5" />
        {tier !== 2 && <CheckoutAgreement className="mt-4" />}
        <CheckoutConcierge className="mt-1.5" />
      </Body>
      {/* The refusal sits directly above the button that was tapped. */}
      {notice && (
        <ErrorNotice className="mx-5 mb-2">
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
            <Button variant="ghost" size="sm" className="mt-2.5 block" disabled={!canSubmit} onClick={submit}>
              Try again
            </Button>
          )}
        </ErrorNotice>
      )}
      <Foot>
        <Button variant="ghost" onClick={() => navigate(`/item/${firstId}`)}>Back</Button>
        <Button disabled={!canSubmit} onClick={submit}>{tier === 2 ? "Next" : "Hold my date"}</Button>
      </Foot>
    </AppShell>
  )
}

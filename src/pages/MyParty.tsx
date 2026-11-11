import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AppShell, Body } from "@/components/go/AppShell"
import { ErrorNotice, FieldError } from "@/components/go/ErrorNotice"
import { GoLabel } from "@/components/go/GoLabel"
import { Reveal } from "@/components/go/DatePicker"
import { BookingMoney } from "@/components/go/BookingMoney"
import { CancelRequest } from "@/components/go/CancelRequest"
import { NextSteps } from "@/components/go/NextStep"
import { askedBefore, forgetAsked, rememberAsked } from "@/lib/cancelMemory"
import { clearWeddingCache } from "@/hooks/use-wedding"
import { customerApi, whatOf, whenOf, type BookingStep, type Customer, type CustomerBooking, type CustomerRequests } from "@/lib/customerApi"
import { usePublicSettings } from "@/lib/settings"
import { MiniMap, OpenInMapsLink } from "@/components/go/MiniMap"
import { AddressField } from "@/components/go/AddressField"
import { AddressPreview } from "@/components/go/AddressPreview"
import { useAddressMode } from "@/hooks/use-address-mode"
import type { VerifiedAddress } from "@/lib/places"
import { mapsUrlFor, safeMapsUrl } from "@/lib/maps"
import { stageView, type StageView } from "@/lib/stage"
import { WeddingRow } from "@/components/go/WeddingRow"
import { RequestsList } from "@/components/go/RequestsList"
import { PhoneField } from "@/components/go/PhoneField"
import { phoneDigits, phoneProblem, showPhone } from "@/lib/phone"
import { useCustomer } from "@/state/customer"
import { cn } from "@/lib/utils"

/* Screen 12, My party. Signed in: a Next step box for each booking (S9b), then
   the customer's real bookings from go-parties-admin, each with Reschedule
   and Change item (small rentals only) and Request to cancel (Block S9b: the
   admin no longer cancels on the customer's say-so; the request opens inline
   under the card, never a popup, and the booking shows "Cancellation
   requested" until staff decide). "Your details" (S3): name, phone
   and home address, edited in place through PATCH /api/customer/me; the
   email is shown and not editable (the admin refuses it). A phone another
   account holds (409, field "phone") shows in red under the field; any
   other refusal is the red notice above Save. The home address is picked
   from Google's suggestions (Block S6) unless it is left as it is; the
   admin's address-not-exact shows in red under it and drops the pick. Each
   booking shows its verified address and "Open in Google Maps" (the
   admin's mapsUrl). Signed out: the doors to sign in or sign up. */

/* Moved here from Home. A stub until real personalization exists: no logic,
   just the place where picks will show up. */
function RecommendedStub({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <GoLabel>Recommended for you</GoLabel>
      <p className="mt-1.5 text-body text-charcoal-soft">Book a few things and picks for you show up here.</p>
    </div>
  )
}

/* The stage as the customer reads it. Confirmed is the only green; a
   cancelled booking is set apart by an outlined tag, not just a color. */
function Status({ view }: { view: StageView }) {
  return (
    <span
      className={cn(
        "flex flex-none items-center gap-1.5 text-[11.5px] font-bold",
        view.tone === "good" ? "text-good" : view.tone === "cancelled" ? "rounded-full border border-charcoal px-2 py-0.5 text-charcoal" : "text-muted"
      )}
    >
      {view.tone === "good" && <i className="inline-block size-1.5 rounded-full bg-good" />}
      {view.label}
    </span>
  )
}

/* What is left to do on a booking, from the admin's steps list, as a plain
   progress list: "done" a check, "next" is what the Next step box at the top
   of the page has the button for (Block S9b, so there is one button for it,
   not two), "waiting" is on GO, "blocked" waits on an earlier step. */
const STEP_LABEL: Record<BookingStep["key"], string> = {
  sign: "Sign your contract",
  retainer: "Pay your retainer",
  balance: "Pay your balance",
  proposal: "Review your proposal",
  "confirm-date": "Confirm the new date",
}

function Steps({ booking }: { booking: CustomerBooking }) {
  const steps = booking.steps ?? []
  if (steps.length === 0) return null
  return (
    <ol className="mt-3 space-y-1.5">
      {steps.map((s) => (
        <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
          <span className={cn("flex items-center gap-2", s.state === "done" ? "text-muted" : "text-charcoal")}>
            {s.state === "done" && <i className="inline-block size-1.5 rounded-full bg-good" />}
            {STEP_LABEL[s.key]}
          </span>
          <span className="text-small text-muted">{s.state === "done" ? "Done" : s.state === "next" ? "Next" : s.state === "waiting" ? "Waiting on GO" : "After the step above"}</span>
        </li>
      ))}
    </ol>
  )
}

/* The setup pin when the admin has one; the address point is never shown
   without it. */
function setupOf(b: CustomerBooking): { lat: number; lng: number } | null {
  const d = b.delivery
  return d && typeof d.setupLat === "number" && typeof d.setupLng === "number" ? { lat: d.setupLat, lng: d.setupLng } : null
}

function BookingCard({ booking, onChanged }: { booking: CustomerBooking; onChanged: (b: CustomerBooking) => void }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const settings = usePublicSettings()
  const [asking, setAsking] = useState(false)
  // What this device saw happen to a cancellation request (see
  // lib/cancelMemory.ts): the admin says nothing when staff decline.
  const [dismissed, setDismissed] = useState(false)
  const pending = booking.pendingRequest ?? null
  const asked = askedBefore(booking.id)
  const view = stageView(booking, { cancelApproved: asked })
  const live = view.live
  const declined = live && !pending && asked && !dismissed
  useEffect(() => {
    if (pending) rememberAsked(booking.id)
  }, [pending, booking.id])
  // The admin's link to the exact address; the pin's own link when it has
  // sent none (an older admin).
  const setup = setupOf(booking)
  const mapsHref = safeMapsUrl(booking.mapsUrl) ?? (setup ? mapsUrlFor(setup) : null)
  // Tier 1 keeps self-serve changes. A booking with a contract (tier 2) or a
  // proposal (tier 3) changes only through GO: the contract's reschedule fee
  // and written-agreement terms apply, and that is a request, not a button.
  const selfServe = (booking.tier ?? 1) === 1 && booking.rescheduleMode !== "request"
  const phone = settings?.companyPhone ?? settings?.rushContactPhone ?? null

  return (
    <div id={`booking-${booking.id}`} className="scroll-mt-20 rounded-[14px] border border-line bg-white px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-sm text-charcoal">{whatOf(booking)}</b>
          {(booking.addons ?? []).map((a) => (
            <span key={`${a.itemName}-${a.groupName}`} className="block text-small text-charcoal-soft">
              {a.itemName}, {a.groupName}: {a.addonName}
            </span>
          ))}
          <span className="block text-small text-charcoal-soft">{whenOf(booking)}</span>
          {booking.occasion && <span className="block text-small text-charcoal-soft">{booking.occasion}</span>}
          {typeof booking.guestCount === "number" && <span className="block text-small text-charcoal-soft">{booking.guestCount} guests</span>}
          {(booking.delivery?.formattedAddress ?? booking.address) && (
            <span className="block text-small text-muted">{booking.delivery?.formattedAddress ?? booking.address}</span>
          )}
          {booking.delivery?.setupNotes && <span className="block text-small text-muted">Setup: {booking.delivery.setupNotes}</span>}
        </div>
        <Status view={view} />
      </div>
      <p className={`mt-2 text-small ${view.tone === "cancelled" ? "text-charcoal" : "text-charcoal-soft"}`}>{view.message}</p>
      {declined && (
        <div className="mt-3 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-sm text-charcoal">
          <b className="block">We did not approve your request to cancel.</b>
          Your booking is still in place. Call or text GO{phone ? ` at ${phone}` : ""} with any questions.
          <Button
            variant="ghost"
            size="sm"
            className="mt-2.5 block"
            onClick={() => {
              forgetAsked(booking.id)
              setDismissed(true)
            }}
          >
            Got it
          </Button>
        </div>
      )}
      {setupOf(booking) ? (
        <MiniMap setup={setupOf(booking)!} href={mapsHref} className="mt-3" />
      ) : (
        mapsHref && <OpenInMapsLink href={mapsHref} />
      )}
      <BookingMoney booking={booking} />
      {live && !pending && <Steps booking={booking} />}
      {live && !pending && <WeddingRow booking={booking} />}
      {live && booking.contract?.status === "signed" && booking.contract.pdfUrl?.startsWith("https://") && (
        <a href={booking.contract.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-[44px] items-center text-small font-bold text-charcoal underline">
          Your signed contract (PDF)
        </a>
      )}
      {live && !pending && !selfServe && (
        <p className="mt-3 text-small text-charcoal-soft">To change this booking, call or text GO{phone ? ` at ${phone}` : ""}.</p>
      )}
      {live && !pending && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selfServe && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/party/${booking.id}/reschedule`)}>
                Reschedule
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/party/${booking.id}/change`)}>
                Change item
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" aria-expanded={asking} onClick={() => setAsking((v) => !v)}>
            Request to cancel
          </Button>
        </div>
      )}
      <Reveal open={asking && !pending} className="mt-3" max="max-h-[1400px]">
        {asking && !pending && (
          <CancelRequest
            bookingId={booking.id}
            onClose={() => setAsking(false)}
            onAsked={(updated) => {
              rememberAsked(booking.id)
              setAsking(false)
              onChanged(updated)
              toast({ title: "Request sent." })
            }}
          />
        )}
      </Reveal>
    </div>
  )
}

/* Your details (S3). Opens read-only; "Edit" turns the three fields on. */
function Details({ customer, onSaved, fixPhone }: { customer: Customer; onSaved: (c: Customer) => void; fixPhone: boolean }) {
  const { toast } = useToast()
  // Block S9a: sent here from checkout because the number on the account is
  // refused, so the fields open ready to fix it.
  const [editing, setEditing] = useState(fixPhone)
  const [name, setName] = useState(customer.name ?? "")
  const [phone, setPhone] = useState(showPhone(customer.phone))
  const [home, setHome] = useState(customer.homeAddress ?? "")
  const [homeVerified, setHomeVerified] = useState<VerifiedAddress | null>(null)
  const pick = useAddressMode() === "pick"
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<{ message: string; field: string | null } | null>(() => {
    const bad = fixPhone ? phoneProblem(customer.phone) : null
    return bad ? { message: bad, field: "phone" } : null
  })

  const open = () => {
    setName(customer.name ?? "")
    setPhone(showPhone(customer.phone))
    setHome(customer.homeAddress ?? "")
    setHomeVerified(null)
    setProblem(null)
    setEditing(true)
  }
  // A changed home address must be picked (when Google is working); one
  // left as it is, or cleared, is fine: the admin already holds it.
  const homeText = home.trim()
  const homeSettled = !pick || homeText === "" || homeText === (customer.homeAddress ?? "").trim() || homeVerified !== null
  const save = async () => {
    if (busy || phone.trim() === "" || !homeSettled) return
    // The admin's phone rule, checked here first (Block S9a).
    const bad = phoneProblem(phone)
    if (bad) {
      setProblem({ message: bad, field: "phone" })
      return
    }
    setBusy(true)
    setProblem(null)
    const result = await customerApi.updateMe({ name: name.trim() || null, phone: phoneDigits(phone) ?? phone.trim(), homeAddress: home.trim() || null }, customer)
    setBusy(false)
    if (result.ok) {
      onSaved(result.data.customer)
      setEditing(false)
      toast({ title: "Saved." })
      return
    }
    if (result.reason === "address-not-exact") {
      setHomeVerified(null)
      setProblem({ message: result.message, field: "homeAddress" })
      return
    }
    setProblem({ message: result.message, field: result.field === "phone" ? "phone" : null })
  }

  return (
    <section aria-label="Your details" className="mt-6">
      <div className="flex items-center justify-between">
        <GoLabel>Your details</GoLabel>
        {!editing && (
          <button className="min-h-[44px] text-[13px] font-bold text-charcoal underline underline-offset-2" onClick={open}>
            Edit
          </button>
        )}
      </div>
      {!editing ? (
        <div className="mt-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5">
          {customer.name && <b className="block text-sm text-charcoal">{customer.name}</b>}
          <span className="block text-small text-charcoal-soft">{showPhone(customer.phone)}</span>
          {phoneProblem(customer.phone) && <FieldError>{phoneProblem(customer.phone)}</FieldError>}
          <span className="block text-small text-charcoal-soft">{customer.email}</span>
          <span className="block text-small text-charcoal-soft">{customer.homeAddress?.trim() || "No home address yet."}</span>
        </div>
      ) : (
        <form
          className="mt-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
          <Input placeholder="Sarah Lin" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Phone</GoLabel>
          <PhoneField
            id="details-phone"
            value={phone}
            error={problem?.field === "phone" ? problem.message : null}
            onChange={(v) => {
              if (problem?.field === "phone") setProblem(null)
              setPhone(v)
            }}
          />
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Email</GoLabel>
          <Input value={customer.email} readOnly aria-readonly="true" className="bg-cream" />
          <p className="mt-1.5 text-small text-muted">To change your email, call or text GO.</p>
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Home address</GoLabel>
          <AddressField
            placeholder="14 Maple Ln, Farmington, CT 06032"
            autoComplete="street-address"
            value={home}
            verified={homeVerified}
            accepted={customer.homeAddress}
            error={problem?.field === "homeAddress" ? problem.message : null}
            onChange={(text, v) => {
              if (problem?.field === "homeAddress") setProblem(null)
              setHome(text)
              setHomeVerified(v)
            }}
          />
          {homeVerified && <AddressPreview address={homeVerified} map={false} className="mt-2.5" />}
          {problem && problem.field !== "phone" && problem.field !== "homeAddress" && <ErrorNotice className="mt-3">{problem.message}</ErrorNotice>}
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="dark" size="sm" disabled={busy || phone.trim() === "" || !homeSettled}>
              {busy ? "Saving" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

export default function MyParty() {
  const navigate = useNavigate()
  const location = useLocation()
  // The event step's "Change" link sends the customer here and back.
  const returnTo = typeof (location.state as { returnTo?: unknown } | null)?.returnTo === "string" ? (location.state as { returnTo: string }).returnTo : null
  const fixPhone = (location.state as { fixPhone?: unknown } | null)?.fixPhone === true
  const settings = usePublicSettings()
  const { customer, ready, logout, setCustomer } = useCustomer()
  const [bookings, setBookings] = useState<CustomerBooking[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [requests, setRequests] = useState<CustomerRequests | null>(null)

  const load = useCallback(async () => {
    // Block S9a: the review requests, asked with the bookings. A failure here
    // only leaves the list out; the bookings are what the page is for.
    setRequests(null)
    clearWeddingCache()
    void customerApi.requests().then((r) => setRequests(r.ok ? r.data : null))
    const result = await customerApi.bookings()
    if (result.ok) {
      setBookings(result.data)
      setLoadError(null)
    } else {
      setBookings([])
      setLoadError(result.message)
    }
  }, [])

  useEffect(() => {
    if (customer) load()
    else setBookings(null)
  }, [customer, load])

  if (!ready) {
    return (
      <AppShell>
        <Body>
          <GoLabel>My party</GoLabel>
        </Body>
      </AppShell>
    )
  }

  if (!customer) {
    return (
      <AppShell>
        <Body className="flex flex-col justify-center text-center">
          <h1 className="text-hero text-charcoal">Your bookings live here.</h1>
          <p className="mt-2 text-body text-charcoal-soft">Sign in and they'll show up.</p>
          <div className="mt-[18px] grid gap-2">
            <Button onClick={() => navigate("/party/signin")}>Sign in</Button>
            <Button variant="ghost" onClick={() => navigate("/party/signup")}>Create account</Button>
          </div>
          <RecommendedStub className="mt-8" />
        </Body>
      </AppShell>
    )
  }

  const first = customer.name?.split(" ")[0]

  return (
    <AppShell>
      <Body>
        <GoLabel>My party</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">{first ? `Hey ${first}` : "Your bookings"}</h1>
        {returnTo && (
          <Button className="mt-3 w-full" onClick={() => navigate(returnTo)}>
            Back to checkout
          </Button>
        )}
        {bookings && (
          <NextSteps bookings={bookings} requests={requests?.requests ?? []} phone={settings?.companyPhone ?? settings?.rushContactPhone ?? null} days={requests?.responseDays ?? settings?.tokens.requestResponseDays ?? null} />
        )}
        <Details customer={customer} onSaved={setCustomer} fixPhone={fixPhone} />
        <RequestsList requests={requests?.requests ?? []} days={requests?.responseDays ?? null} phone={settings?.companyPhone ?? settings?.rushContactPhone ?? null} />
        {bookings === null && <p className="mt-2 text-body text-muted">Checking the calendar.</p>}
        {loadError && <ErrorNotice className="mt-3">{loadError}</ErrorNotice>}
        {bookings && bookings.length === 0 && !loadError && (requests?.requests.length ?? 0) === 0 && (
          <>
            <p className="mt-2 text-body text-charcoal-soft">Nothing here yet. Build a party and it'll live here.</p>
            <Button className="mt-[18px] w-full" onClick={() => navigate("/home")}>Build one</Button>
          </>
        )}
        {bookings && bookings.length > 0 && (
          <div className="mt-3.5 grid gap-2.5">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onChanged={(updated) =>
                  // Cancelling releases the booking's units on the admin, so the
                  // returned row has none; keep the item names from before for
                  // the card. A fresh load can't, until the admin returns them.
                  setBookings((prev) =>
                    (prev ?? []).map((x) => (x.id === updated.id ? { ...updated, units: updated.units.length ? updated.units : x.units } : x))
                  )
                }
              />
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-5"
          onClick={async () => {
            await logout()
            navigate("/party")
          }}
        >
          Sign out
        </Button>
        <RecommendedStub className="mt-8" />
      </Body>
    </AppShell>
  )
}

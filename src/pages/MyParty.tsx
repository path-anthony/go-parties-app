import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Reveal } from "@/components/go/DatePicker"
import { customerApi, whatOf, whenOf, type BookingStep, type CustomerBooking } from "@/lib/customerApi"
import { usePublicSettings } from "@/lib/settings"
import { stageView, type StageView } from "@/lib/stage"
import { useCustomer } from "@/state/customer"
import { cn } from "@/lib/utils"

/* Screen 12, My party. Signed in: the customer's real bookings from
   go-parties-admin, each with Reschedule, Change item and Cancel (Cancel asks
   first, inline, never a popup). Signed out: the doors to sign in or sign
   up. */

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

/* What is left to do on a booking, from the admin's steps list. "next" is a
   real button into the page that does it; "done" a check; "waiting" is on
   GO; "blocked" waits on an earlier step. Proposals and date confirmations
   are listed but not actionable here yet (Block T3). */
const STEP_LABEL: Record<BookingStep["key"], string> = {
  sign: "Sign your contract",
  retainer: "Pay your retainer",
  balance: "Pay your balance",
  proposal: "Review your proposal",
  "confirm-date": "Confirm the new date",
}

function Steps({ booking }: { booking: CustomerBooking }) {
  const navigate = useNavigate()
  const steps = booking.steps ?? []
  if (steps.length === 0) return null
  const target = (s: BookingStep) =>
    s.key === "sign" ? `/party/${booking.id}/contract` : s.key === "retainer" || s.key === "balance" ? `/party/${booking.id}/pay?kind=${s.key}` : null
  return (
    <ol className="mt-3 space-y-1.5">
      {steps.map((s) => {
        const to = target(s)
        return (
          <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
            <span className={cn("flex items-center gap-2", s.state === "done" ? "text-muted" : "text-charcoal")}>
              {s.state === "done" && <i className="inline-block size-1.5 rounded-full bg-good" />}
              {STEP_LABEL[s.key]}
            </span>
            {s.state === "next" && to ? (
              <Button variant="dark" size="sm" onClick={() => navigate(to)}>
                {s.key === "sign" ? "Sign" : s.key === "balance" ? "Pay balance" : s.key === "retainer" ? "Pay retainer" : "Open"}
              </Button>
            ) : (
              <span className="text-small text-muted">{s.state === "done" ? "Done" : s.state === "waiting" || (s.state === "next" && !to) ? "Waiting on GO" : "After the step above"}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function BookingCard({ booking, onChanged }: { booking: CustomerBooking; onChanged: (b: CustomerBooking) => void }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const settings = usePublicSettings()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const view = stageView(booking)
  const live = view.live
  // Tier 1 keeps self-serve changes. A booking with a contract (tier 2) or a
  // proposal (tier 3) changes only through GO: the contract's reschedule fee
  // and written-agreement terms apply, and that is a request, not a button.
  const selfServe = (booking.tier ?? 1) === 1 && booking.rescheduleMode !== "request"
  const phone = settings?.companyPhone ?? settings?.rushContactPhone ?? null

  const cancel = async () => {
    setBusy(true)
    setNotice(null)
    const result = await customerApi.cancel(booking.id)
    setBusy(false)
    if (result.ok) {
      setConfirming(false)
      onChanged(result.data)
      toast({ title: "Cancelled." })
    } else {
      setNotice(result.message)
    }
  }

  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-sm text-charcoal">{whatOf(booking)}</b>
          {(booking.addons ?? []).map((a) => (
            <span key={`${a.itemName}-${a.groupName}`} className="block text-small text-charcoal-soft">
              {a.itemName}, {a.groupName}: {a.addonName}
            </span>
          ))}
          <span className="block text-small text-charcoal-soft">{whenOf(booking)}</span>
          {booking.address && <span className="block text-small text-muted">{booking.address}</span>}
        </div>
        <Status view={view} />
      </div>
      <p className={`mt-2 text-small ${view.tone === "cancelled" ? "text-charcoal" : "text-charcoal-soft"}`}>{view.message}</p>
      {live && <Steps booking={booking} />}
      {live && booking.contract?.status === "signed" && booking.contract.pdfUrl?.startsWith("https://") && (
        <a href={booking.contract.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-small font-bold text-charcoal underline">
          Your signed contract (PDF)
        </a>
      )}
      {live && !selfServe && (
        <p className="mt-3 text-small text-charcoal-soft">To change or cancel, call or text GO{phone ? ` at ${phone}` : ""}.</p>
      )}
      {live && selfServe && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/party/${booking.id}/reschedule`)}>
            Reschedule
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/party/${booking.id}/change`)}>
            Change item
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming((v) => !v)}>
            Cancel
          </Button>
        </div>
      )}
      <Reveal open={confirming} className="mt-3">
        <div className="rounded-[12px] border border-line bg-cream px-3.5 py-3 text-sm text-charcoal">
          Cancel this booking? The date opens back up.
          <div className="mt-2.5 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </Button>
            <Button variant="dark" size="sm" onClick={cancel} disabled={busy}>
              Cancel it
            </Button>
          </div>
        </div>
      </Reveal>
      {notice && <p className="mt-2.5 text-small text-charcoal">{notice}</p>}
    </div>
  )
}

export default function MyParty() {
  const navigate = useNavigate()
  const { customer, ready, logout } = useCustomer()
  const [bookings, setBookings] = useState<CustomerBooking[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
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
        {bookings === null && <p className="mt-2 text-body text-muted">Checking the calendar.</p>}
        {loadError && <p className="mt-2 text-body text-charcoal">{loadError}</p>}
        {bookings && bookings.length === 0 && !loadError && (
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

import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { GoLabel } from "@/components/go/GoLabel"
import { useWeddingDetails } from "@/hooks/use-wedding"
import { labelForIso } from "@/lib/availability"
import { whatOf, whenOf, type CustomerBooking, type CustomerRequest } from "@/lib/customerApi"
import { nextStepFor, nextStepForRequest, type NextStep } from "@/lib/nextStep"
import { stageView } from "@/lib/stage"
import { cn } from "@/lib/utils"

/* Block S9b. The "Next step" box at the top of My party: one box for each
   booking, one button for the single thing the customer owes next (see
   lib/nextStep.ts for the order). Nothing owed says "You're all set" with the
   date. A request in review says nothing is due, with the contact promise.
   The buttons are charcoal so the screen keeps its one orange. */

function Box({ id, what, when, step }: { id: string; what: string; when: string; step: NextStep }) {
  const navigate = useNavigate()
  const quiet = step.button === null
  return (
    <div id={id} className={cn("rounded-[14px] border px-4 py-3.5", quiet ? "border-line bg-white" : "border-charcoal bg-white")}>
      <GoLabel>Next step</GoLabel>
      <b className="mt-1.5 block text-[17px] leading-snug text-charcoal">{step.title}</b>
      <p className="mt-0.5 text-body text-charcoal-soft">{step.line}</p>
      <span className="mt-1.5 block text-small text-muted">
        {what}
        {when ? `, ${when}` : ""}
      </span>
      {step.button && (
        <Button variant="dark" className="mt-3 w-full" onClick={() => navigate(step.button!.to)}>
          {step.button.label}
        </Button>
      )}
    </div>
  )
}

function BookingBox({ booking, phone, days }: { booking: CustomerBooking; phone: string | null; days: number | null }) {
  const live = stageView(booking).live
  const wedding = useWeddingDetails(booking.id, live)
  const step = nextStepFor(booking, wedding, { phone, days })
  if (!step) return null
  return <Box id={`next-${booking.id}`} what={whatOf(booking)} when={whenOf(booking)} step={step} />
}

export function NextSteps({ bookings, requests, phone, days }: { bookings: CustomerBooking[]; requests: CustomerRequest[]; phone: string | null; days: number | null }) {
  const reviewing = requests.flatMap((r) => {
    const step = nextStepForRequest(r, days)
    return step ? [{ r, step }] : []
  })
  if (bookings.length === 0 && reviewing.length === 0) return null
  return (
    <section aria-label="Next step" className="mt-5 grid gap-2.5">
      {bookings.map((b) => (
        <BookingBox key={b.id} booking={b} phone={phone} days={days} />
      ))}
      {reviewing.map(({ r, step }) => (
        <Box
          key={r.id}
          id={`next-request-${r.id}`}
          what={r.package ?? (r.items.map((i) => i.name).join(", ") || "Your request")}
          when={r.eventDate ? labelForIso(r.eventDate) : ""}
          step={step}
        />
      ))}
    </section>
  )
}

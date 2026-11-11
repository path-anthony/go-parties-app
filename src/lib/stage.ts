import type { CustomerBooking } from "@/lib/customerApi"

/* What a booking's real stage means to the customer. The admin sends `stage`
   (Held, Contract Sent, Signed, Retainer Paid, Confirmed, Completed,
   Cancelled) computed from the stage it is set to and whether the retainer is
   paid; Confirmed is only ever Signed plus retainer paid. `status` is the old
   field and reads "Confirmed" for any live booking, so it is never the source
   of truth for this. The words here are the customer's, never the internal
   labels, and never claim more than is true: only Confirmed says confirmed.
   Block S9b: a small rental (tier 1) is Confirmed the moment its retainer is
   paid, so a tier 1 "Retainer Paid" (a booking paid before 2026-11-13) is
   read as Confirmed. A held booking with a retainer still owed reads
   "Awaiting retainer". A cancellation request waiting on staff overrides all
   of it: "Cancellation requested", and the booking is otherwise unchanged. */

export type StageTone = "good" | "pending" | "done" | "cancelled"

export interface StageView {
  label: string
  message: string
  tone: StageTone
  /* Still on the calendar: can be moved, changed or cancelled. */
  live: boolean
}

const VIEWS: Record<string, StageView> = {
  Held: {
    label: "Held",
    message: "Your date is held.",
    tone: "pending",
    live: true,
  },
  Requested: {
    label: "Requested",
    message: "Your date is requested. Sign the contract and pay the retainer to confirm it.",
    tone: "pending",
    live: true,
  },
  "Contract Sent": {
    label: "Contract ready",
    message: "Your contract is ready to sign.",
    tone: "pending",
    live: true,
  },
  Signed: {
    label: "Signed",
    message: "Contract signed, thank you. The retainer confirms the date.",
    tone: "pending",
    live: true,
  },
  "Retainer Paid": {
    label: "Retainer paid",
    message: "Retainer received, thank you. Signing your contract confirms the date.",
    tone: "pending",
    live: true,
  },
  "In review": {
    label: "In review",
    message: "Our team is reviewing this one. Nothing is due yet.",
    tone: "pending",
    live: true,
  },
  "Proposal ready": {
    label: "Proposal ready",
    message: "Your proposal is ready. GO will walk you through it.",
    tone: "pending",
    live: true,
  },
  Confirmed: {
    label: "Confirmed",
    message: "Your date is confirmed.",
    tone: "good",
    live: true,
  },
  Completed: {
    label: "Completed",
    message: "This one already happened. Thanks for having us.",
    tone: "done",
    live: false,
  },
  Cancelled: {
    label: "Cancelled",
    message: "This booking was cancelled. The date is open again.",
    tone: "cancelled",
    live: false,
  },
  Released: {
    label: "Released",
    message: "This hold wasn't confirmed in time, so the date was released. Book again, or call or text us.",
    tone: "cancelled",
    live: false,
  },
}

/* An admin that doesn't send `stage` yet, or a stage this doesn't know, is
   read as Held (nothing claimed) unless the old field says the booking is
   over. Never as Confirmed. */
const AWAITING: StageView = { label: "Awaiting retainer", message: "Your date is held until the retainer is paid.", tone: "pending", live: true }
const ASKED: StageView = { label: "Cancellation requested", message: "Cancellation requested. We will contact you.", tone: "pending", live: true }
const APPROVED: StageView = { ...VIEWS.Cancelled, message: "Cancellation approved. This booking is cancelled and the date is open again." }

export function stageView(booking: Pick<CustomerBooking, "stage" | "status"> & Partial<Pick<CustomerBooking, "tier" | "retainer" | "pendingRequest">>, opts: { cancelApproved?: boolean } = {}): StageView {
  if (booking.pendingRequest) return ASKED
  if (booking.stage === "Cancelled" && opts.cancelApproved) return APPROVED
  if (booking.stage === "Held" && booking.retainer && !booking.retainer.paid) return AWAITING
  if (booking.stage === "Retainer Paid" && booking.tier === 1) return VIEWS.Confirmed
  const known = booking.stage ? VIEWS[booking.stage] : undefined
  if (known) return known
  if (booking.stage === "Released" || booking.status === "Released") return VIEWS.Released
  if (booking.status === "Cancelled") return VIEWS.Cancelled
  if (booking.status === "Completed") return VIEWS.Completed
  return VIEWS.Held
}

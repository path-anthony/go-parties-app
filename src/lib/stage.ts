import type { CustomerBooking } from "@/lib/customerApi"

/* What a booking's real stage means to the customer. The admin sends `stage`
   (Held, Contract Sent, Signed, Retainer Paid, Confirmed, Completed,
   Cancelled) computed from the stage it is set to and whether the retainer is
   paid; Confirmed is only ever Signed plus retainer paid. `status` is the old
   field and reads "Confirmed" for any live booking, so it is never the source
   of truth for this. The words here are the customer's, never the internal
   labels, and never claim more than is true: only Confirmed says confirmed. */

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
    message: "Your date is held. We'll reach out to confirm and finish your booking.",
    tone: "pending",
    live: true,
  },
  "Contract Sent": {
    label: "Contract sent",
    message: "Booked, contract on its way. Sign it and pay the retainer to lock the date in.",
    tone: "pending",
    live: true,
  },
  Signed: {
    label: "Signed",
    message: "Contract signed, thank you. The retainer is the last step to lock the date in.",
    tone: "pending",
    live: true,
  },
  "Retainer Paid": {
    label: "Retainer paid",
    message: "Retainer received, thank you. Signing your contract is the last step.",
    tone: "pending",
    live: true,
  },
  Confirmed: {
    label: "Confirmed",
    message: "Signed and paid. You're all set.",
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
}

/* An admin that doesn't send `stage` yet, or a stage this doesn't know, is
   read as Held (nothing claimed) unless the old field says the booking is
   over. Never as Confirmed. */
export function stageView(booking: Pick<CustomerBooking, "stage" | "status">): StageView {
  const known = booking.stage ? VIEWS[booking.stage] : undefined
  if (known) return known
  if (booking.status === "Cancelled") return VIEWS.Cancelled
  if (booking.status === "Completed") return VIEWS.Completed
  return VIEWS.Held
}

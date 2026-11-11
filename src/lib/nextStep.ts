import type { CustomerBooking, CustomerRequest } from "@/lib/customerApi"
import { stageView } from "@/lib/stage"
import { promiseLine } from "@/lib/review"
import { weddingDueText, weddingStatusText, type WeddingDetails } from "@/lib/weddingApi"

/* Block S9b. The one thing a customer owes next on each booking, in this
   order: sign the contract; pay the retainer; fill in the wedding details;
   pay the balance. The box has one button, for that one thing. When nothing
   is owed it says so with the event date, and a request in review says
   nothing is due with the contact promise. The admin's own step list
   (`steps`) is the authority for sign, retainer and balance; the wedding
   form is asked of the wedding route. Money is shown as the admin sent it
   and never computed here.

   The rental policy is not a step of its own here: the admin sends no
   "policy accepted" flag on a booking, so the policy is read and accepted
   on the pay screen (/pay/:token) and at checkout. */

export type NextKey = "sign" | "retainer" | "wedding" | "balance" | "proposal" | "review" | "cancel" | "allset" | "quiet"

export interface NextStep {
  key: NextKey
  title: string
  line: string
  /* One button, or none when the next move is GO's. */
  button: { label: string; to: string } | null
}

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })

/* "2026-12-26" as "Saturday, December 26". */
export function longDay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
}

/* "Dec 12". */
const shortDay = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const stepState = (b: CustomerBooking, key: "sign" | "retainer" | "balance") => (b.steps ?? []).find((s) => s.key === key)?.state ?? null

/* null for a booking that is over (completed, cancelled, released): nothing
   is owed and nothing is shown. */
export function nextStepFor(b: CustomerBooking, wedding: WeddingDetails | null, opts: { phone: string | null; days: number | null }): NextStep | null {
  const view = stageView(b)
  if (!view.live) return null
  if (b.pendingRequest) {
    return { key: "cancel", title: "Cancellation requested", line: "We will contact you.", button: null }
  }
  const call = `Call or text GO${opts.phone ? ` at ${opts.phone}` : ""}.`

  if (stepState(b, "sign") === "next") {
    return { key: "sign", title: "Sign your contract", line: "Read it and sign to hold your date.", button: { label: "Sign contract", to: `/party/${b.id}/contract` } }
  }

  if (stepState(b, "retainer") === "next") {
    const amount = b.retainer?.amount ?? null
    const what = amount !== null ? `Pay your ${usd(amount)} retainer` : "Pay your retainer"
    if (b.retainer?.payable) {
      return { key: "retainer", title: what, line: "The retainer holds your date.", button: { label: amount !== null ? `Pay ${usd(amount)}` : "Pay retainer", to: `/party/${b.id}/pay?kind=retainer` } }
    }
    return { key: "retainer", title: what, line: "Online payment is not open yet. GO will follow up to collect it.", button: null }
  }

  if (wedding && wedding.status !== "submitted") {
    const due = weddingDueText(wedding)
    return {
      key: "wedding",
      title: "Fill in your wedding details",
      line: `${weddingStatusText(wedding)}${due ? `. ${due.text}.` : "."}`,
      button: { label: "Fill in details", to: `/party/${b.id}/wedding-details` },
    }
  }

  if (stepState(b, "balance") === "next") {
    const amount = b.balance?.amount ?? null
    const due = b.balance?.dueDate ? `, due ${shortDay(b.balance.dueDate)}` : ""
    const what = amount !== null ? `Pay your ${usd(amount)} balance` : "Pay your balance"
    if (b.balance?.payable) {
      return { key: "balance", title: what, line: `${amount !== null ? usd(amount) : "The rest of your total"}${due}.`, button: { label: amount !== null ? `Pay ${usd(amount)}` : "Pay balance", to: `/party/${b.id}/pay?kind=balance` } }
    }
    return { key: "balance", title: what, line: `Online payment is not open yet. GO will follow up to collect it${due}.`, button: null }
  }

  if (b.stage === "In review") {
    return { key: "review", title: "Nothing is due yet", line: promiseLine(opts.days), button: null }
  }
  if (stepState(b, "retainer") === "waiting" || b.stage === "Proposal ready") {
    return { key: "proposal", title: "Your proposal is ready", line: `GO will walk you through it. ${call}`, button: null }
  }
  if (b.stage === "Confirmed") {
    return { key: "allset", title: "You're all set", line: `Your event is ${longDay(b.eventDate)}.`, button: null }
  }
  return { key: "quiet", title: "Nothing is due right now", line: `Your event is ${longDay(b.eventDate)}.`, button: null }
}

/* A review request still waiting: nothing is due, and the admin's promise. */
export function nextStepForRequest(r: CustomerRequest, days: number | null): NextStep | null {
  if (r.status !== "received" && r.status !== "being-reviewed") return null
  return { key: "review", title: "Nothing is due yet", line: r.promise ?? promiseLine(days), button: null }
}

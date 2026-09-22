import { ADMIN_API } from "@/lib/adminApi"
import { labelForIso } from "@/lib/availability"

/* White-glove concierge: the customer would rather talk to a person than
   check out. Two doors (the offer screen in checkout, a nudge under an Ask
   GO recommendation), one destination: GO's Calendly. Two things happen on
   the tap, and neither may block the other or the navigation: a lead is
   logged on the admin so the CRM has the context before Calendly's own
   notification arrives (fire and forget, keepalive so it survives the tab
   change, failures swallowed: it is a log, not a requirement), and the
   Calendly link opens in a new tab with a short summary in a1, Calendly's
   first custom-question slot, so the cart here is never lost. */

export const CALENDLY_URL = "https://calendly.com/goevent/30min"

export type ConciergeSource = "checkout" | "ask_go"

export interface ConciergeContext {
  source: ConciergeSource
  /* "Kids party, Birthday" */
  occasion: string | null
  /* "Dream Wedding Package" or "Snow Cone Station, Quick Add Test Tent" */
  itemOrPackage: string | null
  /* YYYY-MM-DD */
  eventDate: string | null
}

const MAX_TEXT = 200

const clip = (text: string) => (text.length <= MAX_TEXT ? text : `${text.slice(0, MAX_TEXT - 1).trimEnd()}…`)

/* "Interested in: Dream Wedding Package for 2026-10-12". Short, plain, and
   readable on Calendly's side if the event type has a matching question. */
export function conciergeSummary(ctx: ConciergeContext): string {
  const what = ctx.itemOrPackage ?? ctx.occasion ?? "a party"
  const when = ctx.eventDate ? ` for ${ctx.eventDate}` : ""
  return clip(`Interested in: ${what}${when}`)
}

export function calendlyUrl(ctx: ConciergeContext): string {
  const url = new URL(CALENDLY_URL)
  url.searchParams.set("a1", conciergeSummary(ctx))
  return url.toString()
}

/* POST /api/leads/concierge. Never awaited by a screen. */
export function logConcierge(ctx: ConciergeContext): void {
  const body: Record<string, string> = { source: ctx.source }
  if (ctx.occasion) body.occasion = clip(ctx.occasion)
  if (ctx.itemOrPackage) body.itemOrPackage = clip(ctx.itemOrPackage)
  if (ctx.eventDate) body.eventDate = ctx.eventDate
  try {
    fetch(`${ADMIN_API}/api/leads/concierge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* a log, not a requirement */
  }
}

/* "Sat Oct 10" for the screen; the summary itself keeps the ISO date. */
export const conciergeWhen = (iso: string | null) => (iso ? labelForIso(iso) : null)

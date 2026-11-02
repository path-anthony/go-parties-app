import { Button } from "@/components/ui/button"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import type { BidGig } from "@/lib/bidApi"
import { shortDate } from "@/components/go/bid/format"

/* The ends of the road, each in its own words: not selected, bids closed,
   declined, a link that isn't valid, and a page that would not open. The gig,
   when there is one, is named in a single line so the crew member knows which
   gig this was. The page that would not open is the one error here, in red
   (S2); the others are states, not errors. */

export type NoticeKind = "not_selected" | "expired" | "declined" | "invalid" | "error"

const WORDS: Record<NoticeKind, { title: string; body: string }> = {
  not_selected: {
    title: "Not this one.",
    body: "We went another way on this gig. Thanks for bidding, and watch your texts for the next one.",
  },
  expired: {
    title: "Bids are closed.",
    body: "This gig stopped taking bids. Text us if you still want in.",
  },
  declined: {
    title: "You passed on this one.",
    body: "Changed your mind? Text us and we'll take a look.",
  },
  invalid: {
    title: "This link isn't valid.",
    body: "Check the link in your text message, or text us and we'll send you a fresh one.",
  },
  error: {
    title: "We couldn't open it.",
    body: "That didn't go through. Try again, or text us.",
  },
}

export function BidNotice({ kind, gig, onRetry }: { kind: NoticeKind; gig?: BidGig | null; onRetry?: () => void }) {
  const words = WORDS[kind]
  const which = gig ? [gig.role, shortDate(gig.eventDate)].filter(Boolean).join(", ") : ""
  return (
    <>
      <h1 className="text-hero text-charcoal">{words.title}</h1>
      {kind === "error" ? (
        <ErrorNotice className="mt-3">
          {words.body}
          {onRetry && (
            <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={onRetry}>
              Try again
            </Button>
          )}
        </ErrorNotice>
      ) : (
        <p className="mt-2 text-body text-charcoal-soft">{words.body}</p>
      )}
      {which && <p className="mt-3 text-small text-muted">The gig: {which}</p>}
    </>
  )
}

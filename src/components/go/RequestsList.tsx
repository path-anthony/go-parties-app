import { Button } from "@/components/ui/button"
import { OpenInMapsLink } from "@/components/go/MiniMap"
import { GoLabel } from "@/components/go/GoLabel"
import { labelForIso } from "@/lib/availability"
import type { CustomerRequest, RequestStatus } from "@/lib/customerApi"
import { safeMapsUrl } from "@/lib/maps"
import { promiseLine } from "@/lib/review"

/* Block S9a. "Requests" on My party: what the customer sent that went to
   staff review (GET /api/customer/requests, Block F2), newest first. Each
   shows what they sent (items, date, address, setup notes, guest count) and
   where it stands in plain words, one of four. There is no dollar anywhere
   on a request: where review starts nothing is due. A request that became a
   booking links to that booking's card further down the page. Staff notes
   and the reason a request was closed never reach the storefront. */

const STATUS: Record<RequestStatus, { label: string; line: (promise: string | null, days: number | null, phone: string | null) => string }> = {
  received: {
    label: "Received",
    line: (promise, days) => `Nothing is due yet. ${promise ?? promiseLine(days)}`,
  },
  "being-reviewed": {
    label: "Being reviewed",
    line: () => "Our team is working on it. Nothing is due yet.",
  },
  booked: {
    label: "Turned into a booking",
    line: () => "It is a booking now.",
  },
  closed: {
    label: "Closed",
    line: (_p, _d, phone) => `We closed this request. Call or text GO${phone ? ` at ${phone}` : ""} with any questions.`,
  },
}

function RequestCard({ request, days, phone }: { request: CustomerRequest; days: number | null; phone: string | null }) {
  const view = STATUS[request.status]
  const day = request.eventDate ? labelForIso(request.eventDate) : ""
  const when = request.eventTime ? `${day}, ${request.eventTime}` : day
  const mapsHref = safeMapsUrl(request.mapsUrl)
  return (
    <div id={`request-${request.id}`} className="rounded-[14px] border border-line bg-white px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {request.package && <b className="block text-sm text-charcoal">{request.package}</b>}
          {request.items.map((i) => (
            <span key={i.name} className={request.package ? "block text-small text-charcoal-soft" : "block text-sm font-bold text-charcoal"}>
              {i.quantity > 1 ? `${i.name} x ${i.quantity}` : i.name}
            </span>
          ))}
          {request.addons.map((a) => (
            <span key={`${a.itemName}-${a.groupName}`} className="block text-small text-charcoal-soft">
              {a.itemName}, {a.groupName}: {a.addonName}
            </span>
          ))}
          {when && <span className="block text-small text-charcoal-soft">{when}</span>}
          {request.occasion && <span className="block text-small text-charcoal-soft">{request.occasion}</span>}
          {request.guestCount !== null && <span className="block text-small text-charcoal-soft">{request.guestCount} guests</span>}
          {request.address && <span className="block text-small text-muted">{request.address}</span>}
          {request.setupNotes && <span className="block text-small text-muted">Setup: {request.setupNotes}</span>}
        </div>
        <span className="flex-none text-[11.5px] font-bold text-muted">{request.statusLabel || view.label}</span>
      </div>
      <p className="mt-2 text-small text-charcoal-soft">{view.line(request.promise, days, phone)}</p>
      {mapsHref && <OpenInMapsLink href={mapsHref} />}
      {request.status === "booked" && request.bookingId && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2.5"
          onClick={() => document.getElementById(`booking-${request.bookingId}`)?.scrollIntoView({ block: "start", behavior: "smooth" })}
        >
          See the booking
        </Button>
      )}
    </div>
  )
}

export function RequestsList({ requests, days, phone }: { requests: CustomerRequest[]; days: number | null; phone: string | null }) {
  if (requests.length === 0) return null
  return (
    <section aria-label="Requests" className="mt-6">
      <GoLabel>Requests</GoLabel>
      <div className="mt-1.5 grid gap-2.5">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} days={days} phone={phone} />
        ))}
      </div>
    </section>
  )
}

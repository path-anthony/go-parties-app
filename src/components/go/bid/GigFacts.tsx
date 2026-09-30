import { GoLabel } from "@/components/go/GoLabel"
import type { BidGig } from "@/lib/bidApi"
import { eventLine, shortDate, timeRange } from "@/components/go/bid/format"

/* The gig at a glance: the role as the headline, then a card of rows. A row
   with nothing to show is left out, never printed empty. Before acceptance
   this is all the crew member sees of the event (a town, never an address);
   the gig page adds the rest below it. */
export function GigFacts({ gig }: { gig: BidGig }) {
  const rows: [string, string | null][] = [
    ["Event", eventLine(gig.eventType, gig.guestCount)],
    ["Date", shortDate(gig.eventDate)],
    ["Time", timeRange(gig.startTime, gig.endTime)],
    ["Town", gig.town],
  ]
  const shown = rows.filter((r): r is [string, string] => r[1] !== null)
  return (
    <>
      <GoLabel>Gig</GoLabel>
      <h1 className="mt-1.5 text-hero text-charcoal">{gig.role ?? "Crew gig"}</h1>
      {shown.length > 0 && (
        <dl className="mt-3.5 rounded-[14px] border border-line bg-white px-4">
          {shown.map(([label, value]) => (
            <div key={label} className="border-b border-line py-3 last:border-b-0">
              <dt className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">{label}</dt>
              <dd className="mt-[3px] text-sm font-bold text-charcoal">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
}

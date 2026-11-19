import { useState } from "react"
import { Input } from "@/components/ui/input"
import { GoLabel } from "@/components/go/GoLabel"
import { FieldError } from "@/components/go/ErrorNotice"
import { fmt } from "@/data/catalog"
import { bundleTotal, guestProblem, guestRange, parseGuests } from "@/lib/guests"
import { useBooking } from "@/state/booking"
import { guestCountSentence, isPerGuest } from "@/lib/pricing"

/* The guest count (Block S9a), kept in the booking store. Optional on every
   order ("A rough number helps us plan."), required for a per-guest
   package, where the line under it shows the package's range and the price
   as it works out: "60 x $12 + $150 = $870". The count is saved as it is
   typed; a number that cannot be a count (or is outside the package's
   range) saves as none, so nothing stale is ever sent. A range problem
   shows once the typed number is long enough to be wrong, or on leaving
   the field.
   Block FIX1: a per-guest item makes the count required too. While it is
   missing the admin's own guest-count-required sentence shows under the
   field ("Tell us how many guests, so we can price Mediterranean Spread.
   It is priced per guest."), and checkout waits for it. */
export function GuestCountField({ label = "Guest count", className }: { label?: string; className?: string }) {
  const b = useBooking()
  const bundle = b.bundle
  const per = bundle?.perGuest ?? null
  const [text, setText] = useState(b.guestCount === null ? "" : String(b.guestCount))
  const [left, setLeft] = useState(false)

  const onChange = (raw: string) => {
    const t = raw.replace(/\D/g, "").slice(0, 4)
    setText(t)
    const n = parseGuests(t)
    b.setGuests(n, t !== "" && n === null)
  }

  const n = parseGuests(text)
  const ripe = left || (per !== null && text.length >= String(per.min).length) || (n !== null && per?.max != null && n > per.max)
  const problem = ripe || (text !== "" && n === null) ? guestProblem(bundle, text, left) : null
  const total = bundle && per ? bundleTotal(bundle, n) : null
  const perGuestNames = bundle ? [] : b.items.filter(isPerGuest).map((i) => i.name)
  const required = perGuestNames.length > 0 && text.trim() === "" ? guestCountSentence(perGuestNames) : null

  return (
    <div className={className}>
      <GoLabel className="mb-1.5 tracking-[.1em]">{label}</GoLabel>
      <Input
        inputMode="numeric"
        autoComplete="off"
        placeholder={per ? String(per.min) : "40"}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setLeft(true)}
        aria-invalid={problem || required ? true : undefined}
        aria-describedby="guest-note"
        className="max-w-[10rem]"
      />
      {(problem ?? required) && <FieldError>{problem ?? required}</FieldError>}
      <small id="guest-note" className="mt-1 block text-[11.5px] text-muted">
        {per && bundle
          ? total !== null && n !== null
            ? `${n} x ${fmt(bundle.price)}${per.base > 0 ? ` + ${fmt(per.base)}` : ""} = ${fmt(total)}`
            : `${guestRange(bundle)}. ${fmt(bundle.price)} per guest${per.base > 0 ? `, plus ${fmt(per.base)}` : ""}.`
          : perGuestNames.length > 0
            ? "Required. Per-guest items are priced by it."
            : "Optional. A rough number helps us plan."}
      </small>
    </div>
  )
}

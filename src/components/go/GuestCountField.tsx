import { useState } from "react"
import { Input } from "@/components/ui/input"
import { GoLabel } from "@/components/go/GoLabel"
import { FieldError } from "@/components/go/ErrorNotice"
import { fmt } from "@/data/catalog"
import { bundleTotal, guestProblem, guestRange, parseGuests } from "@/lib/guests"
import { useBooking } from "@/state/booking"

/* The guest count (Block S9a), kept in the booking store. Optional on every
   order ("A rough number helps us plan."), required for a per-guest
   package, where the line under it shows the package's range and the price
   as it works out: "60 x $12 + $150 = $870". The count is saved as it is
   typed; a number that cannot be a count (or is outside the package's
   range) saves as none, so nothing stale is ever sent. A range problem
   shows once the typed number is long enough to be wrong, or on leaving
   the field. */
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
        aria-invalid={problem ? true : undefined}
        aria-describedby="guest-note"
        className="max-w-[10rem]"
      />
      {problem && <FieldError>{problem}</FieldError>}
      <small id="guest-note" className="mt-1 block text-[11.5px] text-muted">
        {per && bundle
          ? total !== null && n !== null
            ? `${n} x ${fmt(bundle.price)}${per.base > 0 ? ` + ${fmt(per.base)}` : ""} = ${fmt(total)}`
            : `${guestRange(bundle)}. ${fmt(bundle.price)} per guest${per.base > 0 ? `, plus ${fmt(per.base)}` : ""}.`
          : "Optional. A rough number helps us plan."}
      </small>
    </div>
  )
}

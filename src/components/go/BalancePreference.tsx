import { Chip } from "@/components/go/Chip"
import { GoLabel } from "@/components/go/GoLabel"
import type { BalancePreference as Pref } from "@/lib/adminApi"
import { useBooking } from "@/state/booking"

/* How the customer would like the remaining balance handled after the
   retainer. A preference we record, nothing more: no charge and no reminder
   is set up from it yet, and the words say so plainly. The values are the
   admin's spelling; the labels are ours. */
const OPTIONS: [Pref, string, string][] = [
  ["Manual", "I'll pay it myself", "Manual"],
  ["Auto-charge", "Auto-charge", "Just noting it"],
  ["Reminder link", "Send me a link", "Reminder link"],
]

export function BalancePreference({ className }: { className?: string }) {
  const b = useBooking()
  return (
    <div className={className}>
      <GoLabel className="mb-1.5">Remaining balance</GoLabel>
      <p className="text-body text-charcoal-soft">How would you like to handle the remaining balance after the retainer?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {OPTIONS.map(([value, label, sub]) => (
          <Chip key={value} selected={b.balancePref === value} sub={sub} onClick={() => b.set("balancePref", value)}>
            {label}
          </Chip>
        ))}
      </div>
      <p className="mt-1.5 text-small text-muted">This is a preference. We'll confirm how it works with you when the retainer is due.</p>
    </div>
  )
}

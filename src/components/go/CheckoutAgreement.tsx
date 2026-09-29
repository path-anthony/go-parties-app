import { useState } from "react"
import { usePublicSettings } from "@/lib/settings"
import { useBooking } from "@/state/booking"

/* The cancellation and deposit policy, quiet, on the last screen next to
   Hold my date (never a screen of its own). The admin's current text, clamped
   with a "Read the full policy" toggle, and a real checkbox that starts
   unchecked. It never blocks the button: whatever its actual state is goes
   with the booking, and the admin refuses an unchecked one only when its own
   requirement is on (the screen then shows the admin's line). No policy
   written yet means nothing to agree to, so nothing is shown. */
export function CheckoutAgreement({ className }: { className?: string }) {
  const settings = usePublicSettings()
  const b = useBooking()
  const [open, setOpen] = useState(false)
  const policy = settings?.policy
  if (!policy) return null
  return (
    <div className={className}>
      <div className="rounded-[14px] border border-line bg-white px-4 py-3.5">
        <p className={`whitespace-pre-line text-small text-charcoal-soft ${open ? "max-h-64 overflow-y-auto" : "line-clamp-3"}`}>{policy.text}</p>
        <button type="button" className="mt-1.5 text-small font-bold text-charcoal" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Show less" : "Read the full policy"}
        </button>
      </div>
      <label className="mt-2.5 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
        <input
          type="checkbox"
          className="mt-0.5 size-5 flex-none cursor-pointer accent-charcoal"
          checked={b.agreed}
          onChange={(e) => b.set("agreed", e.target.checked)}
        />
        <span>I have read and agree to the cancellation and deposit policy</span>
      </label>
    </div>
  )
}

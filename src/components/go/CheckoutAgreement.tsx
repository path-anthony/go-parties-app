import { useEffect, useRef, useState } from "react"
import { renderPolicy, usePublicSettings } from "@/lib/settings"
import { useBooking } from "@/state/booking"

/* The cancellation and deposit policy, quiet, on the last screen next to
   Hold my date (never a screen of its own). The admin's current text with its
   {{tokens}} filled from settings, clamped with a "Read the full policy"
   toggle, and a real checkbox that starts unchecked and stays disabled until
   the customer has opened the text (expanded it, which also lets them scroll
   it). Text short enough to show whole is already read. It never blocks the
   button: whatever the checkbox's actual state is goes with the booking, and
   the admin refuses an unchecked one only when its own requirement is on.
   No policy written yet means nothing to agree to, so nothing is shown. */
export function CheckoutAgreement({ className }: { className?: string }) {
  const settings = usePublicSettings()
  const b = useBooking()
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(b.agreed)
  const [fits, setFits] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const policy = settings?.policy
  const text = policy && settings ? renderPolicy(policy.text, settings) : ""

  // Three lines was enough to show all of it: nothing is hidden, so there is
  // nothing to open first.
  useEffect(() => {
    const el = textRef.current
    if (el && !open) setFits(el.scrollHeight <= el.clientHeight + 1)
  }, [text, open])

  if (!policy) return null
  const read = opened || fits
  return (
    <div className={className}>
      <div className="rounded-[14px] border border-line bg-white px-4 py-3.5">
        <p ref={textRef} className={`whitespace-pre-line text-small text-charcoal-soft ${open ? "max-h-64 overflow-y-auto" : "line-clamp-3"}`}>{text}</p>
        {!fits && (
          <button
            type="button"
            className="mt-1.5 text-small font-bold text-charcoal"
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v)
              setOpened(true)
            }}
          >
            {open ? "Show less" : "Read the full policy"}
          </button>
        )}
      </div>
      <label className={`mt-2.5 flex items-start gap-3 text-sm ${read ? "cursor-pointer text-charcoal" : "cursor-not-allowed text-muted"}`}>
        <input
          type="checkbox"
          className="mt-0.5 size-5 flex-none cursor-pointer accent-charcoal disabled:cursor-not-allowed disabled:opacity-40"
          checked={b.agreed}
          disabled={!read}
          onChange={(e) => b.set("agreed", e.target.checked)}
        />
        <span>I have read and agree to the cancellation and deposit policy</span>
      </label>
      {!read && <p className="mt-1 pl-8 text-small text-muted">Read the policy to continue.</p>}
    </div>
  )
}

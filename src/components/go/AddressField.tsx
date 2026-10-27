import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { PICK_MESSAGE, resolveAddress, suggestAddresses, type Suggestion, type VerifiedAddress } from "@/lib/places"

/* The address input with Google's suggestions under it. Typing asks Places
   (New) after a short pause; tapping a row resolves it. Only a full street
   address becomes `verified`; anything else (a town, a business with no
   number, free typing) leaves the field unverified and shows the bank's
   line, so the screen keeps Next off. The text shown is the customer's
   until a pick lands, then the formatted address. Changing the text after
   a pick drops the verified address: the parent clears the pin with it. */

export function AddressField({
  value,
  verified,
  disabled,
  onText,
  onVerified,
}: {
  value: string
  verified: VerifiedAddress | null
  disabled?: boolean
  onText: (text: string) => void
  onVerified: (v: VerifiedAddress | null) => void
}) {
  const [rows, setRows] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rejected, setRejected] = useState(false)
  /* The text the last finished lookup was for, so "nothing matched" can be
     told apart from "still looking". */
  const [searched, setSearched] = useState("")
  const seq = useRef(0)

  // The list is only shown while typing an unverified address; rows from an
  // older lookup are hidden rather than cleared, so no effect sets state.
  const listening = !verified && value.trim().length >= 3 && open
  useEffect(() => {
    if (!listening) return
    const mine = ++seq.current
    const t = setTimeout(() => {
      suggestAddresses(value)
        .then((r) => {
          if (mine !== seq.current) return
          setRows(r)
          setSearched(value)
        })
        .catch(() => {
          if (mine !== seq.current) return
          setRows([])
          setSearched(value)
        })
    }, 250)
    return () => clearTimeout(t)
  }, [value, listening])

  const pick = async (s: Suggestion) => {
    setBusy(true)
    setOpen(false)
    setRows([])
    try {
      const v = await resolveAddress(s.placeId)
      if (v) {
        setRejected(false)
        onText(v.formattedAddress)
        onVerified(v)
      } else {
        setRejected(true)
        onText(`${s.mainText}, ${s.secondaryText}`)
        onVerified(null)
      }
    } catch {
      setRejected(true)
      onVerified(null)
    } finally {
      setBusy(false)
    }
  }

  // Unverified text shows the line once there is nothing to pick from: the
  // list is closed, the pick was not a street address, or the lookup for
  // this text came back empty.
  const unverifiedText = !verified && value.trim() !== ""
  const nothingFound = searched === value && rows.length === 0
  const showMessage = unverifiedText && (rejected || !open || nothingFound)

  return (
    <div className="relative">
      <Input
        placeholder="14 Maple Ln, Farmington"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && rows.length > 0}
        aria-controls="address-suggestions"
        value={value}
        disabled={disabled || busy}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        onChange={(e) => {
          setRejected(false)
          setOpen(true)
          onText(e.target.value)
          if (verified) onVerified(null)
        }}
      />
      {listening && rows.length > 0 && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute right-0 left-0 z-20 mt-1.5 overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_10px_30px_rgba(33,29,28,.12)]"
        >
          {rows.map((s) => (
            <li key={s.placeId} role="option" aria-selected={false}>
              <button
                type="button"
                className="block w-full border-b border-line px-3.5 py-3 text-left last:border-b-0 active:bg-orange-tint"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="block text-sm font-semibold text-charcoal">{s.mainText}</span>
                {s.secondaryText && <span className="block text-small text-muted">{s.secondaryText}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {showMessage && <p className="mt-1.5 text-small text-charcoal">{PICK_MESSAGE}</p>}
    </div>
  )
}

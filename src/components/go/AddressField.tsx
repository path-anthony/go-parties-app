import { useEffect, useId, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/go/ErrorNotice"
import { useAddressMode } from "@/hooks/use-address-mode"
import { loadMaps, mapsMocked, markMapsBroken } from "@/lib/maps"
import { PICK_MESSAGE, resolveAddress, suggestAddresses, type Suggestion, type VerifiedAddress } from "@/lib/places"

/* The one address input (Block S6): the event address, and the home address
   at checkout, on sign-up and in My party. Google's suggestions sit under
   it. Typing asks Places (New) after a short pause; tapping a row resolves
   it. Only a full street address becomes `verified`; anything else (a town,
   a business with no number, free typing) leaves the field unverified and
   shows the bank's line in red under a red border (S2), so the screen keeps
   its button off. The text shown is the customer's until a pick lands, then
   Google's formatted address. One callback reports both together, so a
   parent holding the fields in one object never overwrites one with the
   other: typing sends (text, null), a pick sends (formatted, verified).
   Changing the text after a pick drops the verified address; the parent
   clears whatever hangs off it (the pin).

   `error` is the admin's own sentence when it refused the address (400
   address-not-exact); it replaces the bank's line until the customer edits
   or picks again, and the parent clears it then. `accepted` is text the
   admin already holds as verified (the home address on file), so an
   untouched field is never asked for a pick.

   When Google cannot be reached (no key, the script blocked or offline, the
   key refused, Places answering with an error) the field becomes a plain
   input, `verified` stays null, and the parent stops requiring a pick: the
   admin checks the typed text and flags it for staff. */

export function AddressField({
  value,
  verified,
  disabled,
  error,
  accepted,
  placeholder = "14 Maple Ln, Farmington",
  autoComplete = "off",
  plainNote,
  onChange,
}: {
  value: string
  verified: VerifiedAddress | null
  disabled?: boolean
  error?: string | null
  accepted?: string | null
  placeholder?: string
  autoComplete?: string
  /* A quiet line under the field in plain mode ("We'll confirm your exact
     address by text."). */
  plainNote?: string
  onChange: (text: string, verified: VerifiedAddress | null) => void
}) {
  const mode = useAddressMode()
  const uid = useId()
  const listId = `${uid}-list`
  const errorId = `${uid}-error`
  const [rows, setRows] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rejected, setRejected] = useState(false)
  /* The text the last finished lookup was for, so "nothing matched" can be
     told apart from "still looking". */
  const [searched, setSearched] = useState("")
  const seq = useRef(0)
  const picking = mode === "pick"

  // Start loading Google as soon as a field is on screen, so a script that
  // is blocked or a key that is refused flips the screen to plain fields
  // before the customer has typed a word.
  useEffect(() => {
    if (!picking || mapsMocked()) return
    loadMaps().catch(() => markMapsBroken())
  }, [picking])

  // The list is only shown while typing an unverified address; rows from an
  // older lookup are hidden rather than cleared, so no effect sets state.
  const listening = picking && !verified && value.trim().length >= 3 && open
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
          // A lookup that errors (not one that finds nothing) means Google
          // is not usable: every address field turns plain.
          markMapsBroken()
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
        onChange(v.formattedAddress, v)
      } else {
        setRejected(true)
        onChange(`${s.mainText}, ${s.secondaryText}`, null)
      }
    } catch {
      markMapsBroken()
      onChange(value, null)
    } finally {
      setBusy(false)
    }
  }

  const change = (text: string) => {
    setRejected(false)
    setOpen(true)
    onChange(text, null)
  }

  if (!picking) {
    return (
      <div>
        <Input
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          value={value}
          disabled={disabled}
          onChange={(e) => change(e.target.value)}
        />
        {error ? <FieldError id={errorId}>{error}</FieldError> : plainNote && <p className="mt-1.5 text-small text-muted">{plainNote}</p>}
      </div>
    )
  }

  // Unverified text shows the line once there is nothing to pick from: the
  // list is closed, the pick was not a street address, or the lookup for
  // this text came back empty. The admin's refusal shows at once.
  const text = value.trim()
  const unverifiedText = !verified && text !== "" && text !== (accepted ?? "").trim()
  const nothingFound = searched === value && rows.length === 0
  const showMessage = !!error || (unverifiedText && (rejected || !open || nothingFound))

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && rows.length > 0}
        aria-controls={listId}
        aria-invalid={showMessage || undefined}
        aria-describedby={showMessage ? errorId : undefined}
        value={value}
        disabled={disabled || busy}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        onChange={(e) => change(e.target.value)}
      />
      {listening && rows.length > 0 && (
        <ul
          id={listId}
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
      {showMessage && <FieldError id={errorId}>{error ?? PICK_MESSAGE}</FieldError>}
    </div>
  )
}

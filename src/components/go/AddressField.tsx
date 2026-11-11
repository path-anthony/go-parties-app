import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
   admin checks the typed text and flags it for staff.

   The suggestion list (Block S8) is drawn in a portal on the page body with
   fixed positioning, not inside the field's wrapper. Inside the wrapper it
   was cut off by any parent that clips (the sign-up form lives in a
   collapsing panel with overflow hidden, so only a few pixels showed) and
   sat under the bottom bar (the list's layer was below the bar's inside the
   screen's own stacking context). It shows at most five rows of 44px or
   more, opens below the field (above it when there is no room below), follows
   the field on scroll and resize, and on a phone the field is scrolled up
   when it gets focus so the field and the whole list fit above the
   keyboard. Arrow keys move, Enter picks, Escape closes; a tap outside
   closes it. */

const MAX_ROWS = 5
const ROW_MIN_PX = 44
/* Above the header and bottom bar (40) and the drawers (50), under toasts (70). */
const LIST_Z = "z-[60]"
const PHONE_MAX = 640

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
  const [active, setActive] = useState(-1)
  /* The text the last finished lookup was for, so "nothing matched" can be
     told apart from "still looking". */
  const [searched, setSearched] = useState("")
  const seq = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
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
          setActive(-1)
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

  const shown = listening ? rows.slice(0, MAX_ROWS) : []
  const showing = shown.length > 0

  // Keep the fixed list under the field (or above it when the bottom is too
  // close to the edge), at the field's width, on every scroll and resize.
  // Written straight to the element, so no state changes on a scroll.
  useLayoutEffect(() => {
    const ul = listRef.current
    const input = inputRef.current
    if (!showing || !ul || !input) return
    const place = () => {
      const r = input.getBoundingClientRect()
      const vv = window.visualViewport
      const bottomEdge = (vv ? vv.offsetTop + vv.height : window.innerHeight) - 8
      const need = Math.min(shown.length, MAX_ROWS) * ROW_MIN_PX + 2
      const roomBelow = bottomEdge - r.bottom - 6
      const above = roomBelow < need && r.top - 6 > roomBelow
      ul.style.left = `${r.left}px`
      ul.style.width = `${r.width}px`
      if (above) {
        ul.style.top = "auto"
        ul.style.bottom = `${window.innerHeight - r.top + 6}px`
      } else {
        ul.style.bottom = "auto"
        ul.style.top = `${r.bottom + 6}px`
      }
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    window.visualViewport?.addEventListener("resize", place)
    window.visualViewport?.addEventListener("scroll", place)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
      window.visualViewport?.removeEventListener("resize", place)
      window.visualViewport?.removeEventListener("scroll", place)
    }
  }, [showing, shown.length])

  // On a phone, bring the field up under the header when it gets focus, so
  // the field and the five rows fit above the keyboard. Once after the
  // keyboard has started to rise, and again when the visible area changes.
  // A field near the end of a short page cannot scroll that far, so a spacer
  // after the page gives it the room while the field is in use.
  useEffect(() => {
    if (!picking || !open || window.innerWidth > PHONE_MAX) return
    const spacer = document.createElement("div")
    spacer.setAttribute("aria-hidden", "true")
    document.body.appendChild(spacer)
    const bring = () => {
      const input = inputRef.current
      if (!input) return
      const hdr = document.querySelector("header")?.getBoundingClientRect().height ?? 0
      const delta = input.getBoundingClientRect().top - (hdr + 12)
      if (Math.abs(delta) <= 4) return
      if (delta > 0) {
        const room = document.documentElement.scrollHeight - window.innerHeight - window.scrollY
        if (delta > room) spacer.style.height = `${spacer.offsetHeight + (delta - room)}px`
      }
      window.scrollBy({ top: delta, behavior: "instant" })
    }
    const t = setTimeout(bring, 250)
    window.visualViewport?.addEventListener("resize", bring)
    return () => {
      clearTimeout(t)
      window.visualViewport?.removeEventListener("resize", bring)
      setTimeout(() => spacer.remove(), 400)
    }
  }, [picking, open])

  // A tap or click outside the field and the list closes it.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      const t = e.target as Node
      if (inputRef.current?.contains(t) || listRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])

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

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (showing) e.stopPropagation()
      setOpen(false)
    } else if (e.key === "ArrowDown" && showing) {
      e.preventDefault()
      setActive((a) => (a + 1) % shown.length)
    } else if (e.key === "ArrowUp" && showing) {
      e.preventDefault()
      setActive((a) => (a <= 0 ? shown.length - 1 : a - 1))
    } else if (e.key === "Enter" && showing && active >= 0) {
      // Picks the highlighted row; never submits the form behind it.
      e.preventDefault()
      void pick(shown[active])
    } else if (e.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={listId}
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={showMessage || undefined}
        aria-describedby={showMessage ? errorId : undefined}
        value={value}
        disabled={disabled || busy}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        onChange={(e) => change(e.target.value)}
      />
      {showing &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className={`fixed ${LIST_Z} overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_10px_30px_rgba(33,29,28,.12)]`}
          >
            {shown.map((s, i) => (
              <li key={s.placeId} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  tabIndex={-1}
                  className={`flex min-h-[44px] w-full flex-col justify-center border-b border-line px-3.5 py-2 text-left last:border-b-0 active:bg-orange-tint ${i === active ? "bg-orange-tint" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(s)}
                >
                  <span className="block text-sm font-semibold text-charcoal">{s.mainText}</span>
                  {s.secondaryText && <span className="block text-small text-muted">{s.secondaryText}</span>}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
      {showMessage && <FieldError id={errorId}>{error ?? PICK_MESSAGE}</FieldError>}
    </div>
  )
}

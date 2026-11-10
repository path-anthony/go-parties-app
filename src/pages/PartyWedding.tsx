import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body } from "@/components/go/AppShell"
import { ErrorNotice, FieldError } from "@/components/go/ErrorNotice"
import { GoLabel } from "@/components/go/GoLabel"
import { labelForIso } from "@/lib/availability"
import { sectionDone, weddingApi, weddingDueText, type WeddingDetails, type WeddingField, type WeddingGroup, type WeddingNote, type WeddingSection, type WeddingValue } from "@/lib/weddingApi"
import { useCustomer } from "@/state/customer"
import { cn } from "@/lib/utils"

/* Wedding details (Blocks S7 and S7.1): the videography details and shot
   list in docs/wedding-details-form.pdf, as a questionnaire on the
   customer's own wedding booking. The template is the admin's (Block A11),
   so this page renders whatever it is sent: fields (text, time, textarea,
   handle, checkbox, choice, multi, rank), groups of checkboxes under a
   sub-heading, notes (the PDF's NOTE, TIP and AUDIO boxes as charcoal
   callouts; a note with no tag as a plain line) and headings, in the
   order the template lists them. The cover (event date, venues) sits
   above the sections. Desktop (901px and up): the section list on the
   left with a mark on done sections, the current section on the right
   with Back and Next. Phone: an accordion, one section open at a time.
   Every change is saved on its own about 600 ms after the last keystroke
   ("Saving" / "Saved" at the top; a refused save is the red notice with
   "Try again", a refused field is marked red, and nothing typed is lost).
   Locked keys (the prefill from the booking) are read-only. Progress is
   the admin's: only stored answers count, never the prefill. "Send to GO"
   is the one orange action and stays off until every required section
   has an answer; after that the page is read-only with the submitted
   stamp and "Request a change". */

const SAVE_DELAY_MS = 600

function useDesktop() {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 901px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)")
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return wide
}

const longDay = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })
  } catch {
    return iso
  }
}

/* The PDF's NOTE, TIP and AUDIO boxes: a charcoal box, the tag in orange,
   white text. A note with no tag is a plain line. */
function Note({ note }: { note: WeddingNote }) {
  if (!note.tag) return <p className="text-[14px] leading-[1.5] text-charcoal-soft">{note.text}</p>
  return (
    <div className="flex gap-3 rounded-[12px] bg-charcoal px-3.5 py-3 text-white">
      <b className="flex-none pt-0.5 text-[11px] font-bold tracking-[.12em] text-orange uppercase">{note.tag}</b>
      <p className="text-[13px] leading-[1.5]">{note.text}</p>
    </div>
  )
}

/* The admin's titles arrive in capitals ("FAMILY & BRIDAL PARTY"); the
   screen reads them in sentence case. */
const sentence = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t)

const DoneMark = () => <i aria-hidden="true" className="inline-block size-2 flex-none rounded-full bg-good" />

const FROM_BOOKING = "From your booking. To change it, call or text GO."
const field16 = "w-full min-w-0 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[14px] text-[16px] text-charcoal outline-none placeholder:text-muted focus:border-charcoal aria-invalid:border-error disabled:opacity-60 read-only:bg-cream"
const labelCls = "mb-1.5 block text-[11px] font-bold tracking-[.12em] text-taupe uppercase"

interface FieldProps {
  field: WeddingField
  value: WeddingValue | undefined
  onChange: (v: WeddingValue) => void
  readOnly: boolean
  locked: boolean
  error: string | null
}

function Field({ field, value, onChange, readOnly, locked, error }: FieldProps) {
  const id = `wd-${field.key.replace(/\./g, "-")}`
  const off = readOnly || locked
  const note = locked && <p className="mt-1.5 text-small text-muted">{FROM_BOOKING}</p>
  const errorId = error ? `${id}-error` : undefined
  const err = error && <FieldError id={errorId}>{error}</FieldError>
  const label = (
    <label htmlFor={id} className={labelCls}>
      {field.label}
    </label>
  )
  const help = field.help && <p className="mb-1.5 text-small text-muted">{field.help}</p>
  const str = typeof value === "string" ? value : ""

  if (field.type === "text" || field.type === "time") {
    return (
      <div>
        {label}
        {help}
        <Input id={id} value={str} maxLength={field.max} placeholder={field.type === "time" ? "2 PM" : undefined} readOnly={off} aria-readonly={off || undefined} aria-invalid={!!error || undefined} aria-describedby={errorId} className={off ? "bg-cream" : undefined} onChange={(e) => onChange(e.target.value)} />
        {note}
        {err}
      </div>
    )
  }
  if (field.type === "handle") {
    return (
      <div>
        {label}
        {help}
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="w-4 flex-none text-center text-[16px] font-bold text-charcoal">{field.prefix ?? "@"}</span>
          <Input id={id} value={str} maxLength={field.max} readOnly={off} aria-readonly={off || undefined} aria-invalid={!!error || undefined} aria-describedby={errorId} autoCapitalize="none" autoCorrect="off" className={off ? "bg-cream" : undefined} onChange={(e) => onChange(e.target.value.replace(/^[@#]/, ""))} />
        </div>
        {note}
        {err}
      </div>
    )
  }
  if (field.type === "textarea") {
    return (
      <div>
        {label}
        {help}
        <textarea id={id} rows={field.max && field.max > 3000 ? 8 : 3} value={str} maxLength={field.max} readOnly={off} aria-readonly={off || undefined} aria-invalid={!!error || undefined} aria-describedby={errorId} className={cn(field16, "resize-y leading-[1.45]")} onChange={(e) => onChange(e.target.value)} />
        {note}
        {err}
      </div>
    )
  }
  if (field.type === "checkbox") {
    return (
      <div>
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-2 text-[14.5px] leading-[1.4] text-charcoal">
          <input id={id} type="checkbox" className="mt-0.5 size-5 flex-none accent-charcoal" checked={value === true} disabled={off} aria-invalid={!!error || undefined} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
        {help}
        {err}
      </div>
    )
  }
  if (field.type === "multi") {
    const picked = Array.isArray(value) ? value : []
    return (
      <fieldset aria-invalid={!!error || undefined}>
        <legend className="block text-[15px] font-bold text-charcoal">{field.label}</legend>
        {help}
        <div className="mt-1 grid gap-x-5 min-[641px]:grid-cols-2">
          {(field.options ?? []).map((o) => (
            <label key={o.value} className="flex min-h-[44px] cursor-pointer items-start gap-3 py-2 text-[14.5px] leading-[1.4] text-charcoal">
              <input type="checkbox" className="mt-0.5 size-5 flex-none accent-charcoal" checked={picked.includes(o.value)} disabled={off} onChange={(e) => onChange(e.target.checked ? [...picked, o.value] : picked.filter((k) => k !== o.value))} />
              {o.label}
            </label>
          ))}
        </div>
        {note}
        {err}
      </fieldset>
    )
  }
  if (field.type === "choice") {
    return (
      <div role="radiogroup" aria-labelledby={`${id}-q`}>
        <b id={`${id}-q`} className="block text-[15px] text-charcoal">{field.label}</b>
        {help}
        <div className="mt-2 flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => {
            const on = value === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={off}
                className={cn("min-h-[44px] rounded-[12px] border-[1.5px] px-4 text-[14px] font-bold transition-colors disabled:opacity-60", on ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-charcoal hover:border-charcoal")}
                onClick={() => onChange(o.value)}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        {note}
        {err}
      </div>
    )
  }
  // rank: one select per option; a place taken by one is off in the others.
  const places = value && typeof value === "object" && !Array.isArray(value) ? value : {}
  const options = field.options ?? []
  const n = options.length
  return (
    <div>
      <b className="block text-[15px] text-charcoal">{field.label}</b>
      {help}
      <div className="mt-2 grid gap-2 min-[641px]:grid-cols-3">
        {options.map((o) => {
          const mine = places[o.value]
          return (
            <label key={o.value} className="flex items-center justify-between gap-3 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-2 text-[14.5px] text-charcoal">
              <span>{o.label}</span>
              <select
                aria-label={`${o.label}, rank`}
                value={mine ?? ""}
                disabled={off}
                className="min-h-[36px] rounded-[8px] border border-line bg-cream px-2 text-[16px] font-bold text-charcoal"
                onChange={(e) => {
                  const next = { ...places }
                  if (e.target.value === "") delete next[o.value]
                  else {
                    const place = Number(e.target.value)
                    // A place can be held by one option only.
                    for (const k of Object.keys(next)) if (k !== o.value && next[k] === place) delete next[k]
                    next[o.value] = place
                  }
                  onChange(next)
                }}
              >
                <option value="">-</option>
                {Array.from({ length: n }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p} disabled={p !== mine && Object.values(places).includes(p)}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
      </div>
      {note}
      {err}
    </div>
  )
}

interface BodyProps {
  answers: Record<string, WeddingValue>
  prefill: Record<string, string>
  locked: Set<string>
  errors: Record<string, string>
  readOnly: boolean
  onChange: (key: string, v: WeddingValue) => void
}

function FieldFor({ f, p, wide }: { f: WeddingField; p: BodyProps; wide?: boolean }) {
  const isLocked = p.locked.has(f.key)
  return (
    <div className={cn(wide && "min-[641px]:col-span-2")}>
      <Field field={f} value={isLocked ? p.prefill[f.key] : p.answers[f.key]} onChange={(v) => p.onChange(f.key, v)} readOnly={p.readOnly} locked={isLocked} error={p.errors[f.key] ?? null} />
    </div>
  )
}

/* A group: a cream box under its sub-heading with the item count, the
   boxes in two columns from 641px. */
function Group({ g, p }: { g: WeddingGroup; p: BodyProps }) {
  return (
    <div className="rounded-[12px] border border-line border-l-4 border-l-charcoal bg-cream px-3.5 py-3">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <b className="text-[13px] font-bold tracking-[.06em] text-charcoal uppercase">{g.title}</b>
        <small className="flex-none text-small text-muted">{g.fields.length} items</small>
      </div>
      {g.note && <p className="mb-1 text-small text-muted">{g.note}</p>}
      <div className="grid gap-x-5 min-[641px]:grid-cols-2">
        {g.fields.map((f) => (
          <FieldFor key={f.key} f={f} p={p} />
        ))}
      </div>
    </div>
  )
}

/* The section's items in order. Plain fields that follow one another sit
   two to a row from 641px; a textarea, a choice, a multi or a rank takes
   the whole row. */
function SectionBody({ section, p }: { section: WeddingSection; p: BodyProps }) {
  const wideField = (f: WeddingField) => f.type === "textarea" || f.type === "choice" || f.type === "multi" || f.type === "rank"
  const rows: React.ReactNode[] = []
  let run: WeddingField[] = []
  const flush = () => {
    if (run.length === 0) return
    rows.push(
      <div key={run[0].key} className="grid gap-4 min-[641px]:grid-cols-2">
        {run.map((f) => (
          <FieldFor key={f.key} f={f} p={p} wide={wideField(f)} />
        ))}
      </div>
    )
    run = []
  }
  section.items.forEach((it, i) => {
    if (it.kind === "field") {
      run.push(it)
      return
    }
    flush()
    if (it.kind === "group") rows.push(<Group key={it.key} g={it} p={p} />)
    else if (it.kind === "note") rows.push(<Note key={`n${i}`} note={it} />)
    else
      rows.push(
        <div key={`h${i}`} className="border-b border-line pb-1">
          <b className="block text-[13px] font-bold tracking-[.06em] text-charcoal uppercase">{it.text}</b>
          {it.help && <span className="block text-small text-muted">{it.help}</span>}
        </div>
      )
  })
  flush()
  return <div className="grid gap-4">{rows}</div>
}

function SectionHeading({ section, done }: { section: WeddingSection; done: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b-2 border-charcoal pb-2.5">
      <span className="text-[30px] leading-none font-black text-charcoal tabular-nums">{String(section.number).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[18px] leading-tight font-extrabold text-charcoal">{sentence(section.title)}</h2>
        <span className="block text-small text-muted">{section.subtitle}</span>
      </div>
      <span className="flex flex-none items-center gap-1.5 pt-1 text-small font-semibold text-muted">
        {done && <DoneMark />}
        {done ? "Done" : section.required ? "" : "Optional"}
      </span>
    </div>
  )
}

/* Keyed by booking, so one booking's answers never show on another's. */
export default function PartyWedding() {
  const { id = "" } = useParams()
  return <PartyWeddingFor key={id} id={id} />
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "failed"; message: string }

function PartyWeddingFor({ id }: { id: string }) {
  const navigate = useNavigate()
  const desktop = useDesktop()
  const { customer, ready } = useCustomer()
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ok"; details: WeddingDetails } | { kind: "error"; message: string }>({ kind: "loading" })
  const [answers, setAnswers] = useState<Record<string, WeddingValue>>({})
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState<number | null>(0)
  const [save, setSave] = useState<SaveState>({ kind: "idle" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [changeOpen, setChangeOpen] = useState(false)
  const [changeNote, setChangeNote] = useState("")
  const [changeBusy, setChangeBusy] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)

  // What is typed and not yet saved, and the save in flight. Values live
  // in `answers` for the screen; `pending` is only what the admin has not
  // got yet, so a failed save keeps the text and tries again from here.
  const pending = useRef<Record<string, WeddingValue>>({})
  const timer = useRef<number | undefined>(undefined)
  const inFlight = useRef<Promise<void> | null>(null)
  const flushRef = useRef<(keepalive?: boolean) => Promise<void>>(() => Promise.resolve())

  const fetchIt = useCallback(
    () =>
      weddingApi.get(id).then((r) => {
        if (r.ok) {
          setAnswers({ ...r.data.answers })
          setState({ kind: "ok", details: r.data })
        } else {
          setState({ kind: "error", message: r.status === 404 ? "There are no wedding details on this booking." : r.message })
        }
      }),
    [id]
  )
  const load = useCallback(() => {
    setState({ kind: "loading" })
    void fetchIt()
  }, [fetchIt])

  useEffect(() => {
    if (customer) void fetchIt()
  }, [customer, fetchIt])

  const flush = useCallback(
    (keepalive = false): Promise<void> => {
      if (inFlight.current) return inFlight.current
      const batch = pending.current
      if (Object.keys(batch).length === 0) return Promise.resolve()
      pending.current = {}
      setSave({ kind: "saving" })
      const p = (async () => {
        const r = await weddingApi.patch(id, batch, keepalive)
        inFlight.current = null
        if (r.ok) {
          setState({ kind: "ok", details: r.data })
          setErrors((prev) => {
            const next = { ...prev }
            for (const k of Object.keys(batch)) delete next[k]
            return next
          })
          setSave({ kind: "saved" })
          if (Object.keys(pending.current).length > 0) void flushRef.current()
          return
        }
        if (r.status === 400 && r.field) {
          // The admin refuses the whole save for one bad field: mark it, drop
          // it from the queue, and send the rest on their own.
          const bad = r.field
          setErrors((prev) => ({ ...prev, [bad]: r.reason === "too-long" ? "That's too long. Shorten it and it will save." : "That didn't save. Check it and try again." }))
          for (const [k, v] of Object.entries(batch)) if (k !== bad && !(k in pending.current)) pending.current[k] = v
          const more = Object.keys(pending.current).length > 0
          setSave(more ? { kind: "saving" } : { kind: "idle" })
          if (more) void flushRef.current()
          return
        }
        if (r.status === 409) {
          // Submitted or opened meanwhile: read it again.
          pending.current = {}
          setSave({ kind: "idle" })
          void fetchIt()
          return
        }
        // Anything else: put the batch back under anything typed since.
        pending.current = { ...batch, ...pending.current }
        setSave({ kind: "failed", message: r.message })
      })()
      inFlight.current = p
      return p
    },
    [id, fetchIt]
  )
  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  const change = useCallback(
    (key: string, value: WeddingValue) => {
      setAnswers((prev) => ({ ...prev, [key]: value }))
      pending.current[key] = value
      setSave((s) => (s.kind === "failed" ? s : { kind: "saving" }))
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS)
    },
    [flush]
  )

  // Leaving with a save still queued: send it now and let the browser ask.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length === 0 && !inFlight.current) return
      window.clearTimeout(timer.current)
      void flush(true)
      e.preventDefault()
    }
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [flush])

  const leave = useCallback(async () => {
    window.clearTimeout(timer.current)
    await flush()
    navigate("/party")
  }, [flush, navigate])

  const details = state.kind === "ok" ? state.details : null
  const sections = useMemo(() => details?.template.sections ?? [], [details])
  const submitted = details?.status === "submitted"
  const locked = useMemo(() => new Set(details?.lockedKeys ?? []), [details])
  // The admin's progress, plus what is typed and not saved yet.
  const doneKeys = useMemo(() => {
    const out = new Set((details?.sections ?? []).filter((s) => s.done).map((s) => s.key))
    for (const s of sections) if (sectionDone(s, answers)) out.add(s.key)
    return out
  }, [details, sections, answers])
  const missing = sections.filter((s) => s.required && !doneKeys.has(s.key))

  const nameOf = (key: string): string | null => {
    const v = details?.prefill[key] ?? answers[key]
    return typeof v === "string" && v.trim() ? v.trim() : null
  }
  const bride = nameOf("couple.bride_name")
  const groom = nameOf("couple.groom_name")
  const couple = bride && groom ? `${bride} and ${groom}` : bride ?? groom ?? customer?.name ?? "Your wedding"
  const when = details ? labelForIso(details.eventDate) : null
  const due = details ? weddingDueText(details) : null

  const submit = async () => {
    if (!details || submitting || missing.length > 0) return
    setSubmitting(true)
    setSubmitError(null)
    window.clearTimeout(timer.current)
    await flush()
    const r = await weddingApi.submit(id)
    setSubmitting(false)
    if (r.ok) setState({ kind: "ok", details: r.data })
    else setSubmitError(r.message)
  }

  const sendChange = async () => {
    if (!changeNote.trim() || changeBusy) return
    setChangeBusy(true)
    setChangeError(null)
    const r = await weddingApi.requestChange(id, changeNote.trim())
    setChangeBusy(false)
    if (r.ok) {
      setState({ kind: "ok", details: r.data })
      setChangeOpen(false)
    } else setChangeError(r.message)
  }

  const saveLine = save.kind === "saving" ? "Saving" : save.kind === "saved" ? "Saved" : null
  const bodyProps: BodyProps = { answers, prefill: details?.prefill ?? {}, locked, errors, readOnly: !!submitted, onChange: change }
  if (ready && !customer) return <Navigate to="/party/signin" replace />

  const nav = (
    <nav aria-label="Sections" className="grid gap-1">
      {sections.map((s, i) => {
        const done = doneKeys.has(s.key)
        return (
          <button
            key={s.key}
            type="button"
            aria-current={i === current ? "step" : undefined}
            className={cn("flex min-h-[44px] items-center gap-2.5 rounded-[10px] border px-2.5 py-2 text-left text-[13px] text-charcoal", i === current ? "border-charcoal bg-white font-bold" : "border-transparent hover:bg-white")}
            onClick={() => setCurrent(i)}
          >
            <span className="w-5 flex-none text-[11px] font-bold text-muted tabular-nums">{String(s.number).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1 truncate">{sentence(s.title)}</span>
            {done ? <DoneMark /> : s.required ? null : <small className="flex-none text-[10.5px] font-semibold text-muted">Optional</small>}
          </button>
        )
      })}
    </nav>
  )

  const bottom = details && (
    <div className="mt-6 border-t border-line pt-5">
      {submitted ? (
        <>
          <p className="text-body text-charcoal">
            <b>Submitted{details.submittedAt ? ` on ${longDay(details.submittedAt)}` : ""}.</b> GO has your wedding details.
          </p>
          {details.changeRequestedAt ? (
            <p className="mt-2 text-body text-charcoal">Change requested {longDay(details.changeRequestedAt)}. GO will be in touch.</p>
          ) : !changeOpen ? (
            <button className="mt-2 min-h-[44px] text-[13px] font-bold text-charcoal underline underline-offset-2" onClick={() => setChangeOpen(true)}>
              Request a change
            </button>
          ) : (
            <div className="mt-3">
              <label htmlFor="wd-change" className={labelCls}>
                What should change?
              </label>
              <textarea id="wd-change" rows={3} maxLength={1000} placeholder="Tell GO what to change" value={changeNote} className={cn(field16, "resize-y")} onChange={(e) => setChangeNote(e.target.value)} />
              {changeError && <ErrorNotice className="mt-3">{changeError}</ErrorNotice>}
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="ghost" size="sm" disabled={changeBusy} onClick={() => setChangeOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="dark" size="sm" disabled={changeBusy || !changeNote.trim()} onClick={sendChange}>
                  {changeBusy ? "Sending" : "Send"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className={cn("text-small", missing.length ? "text-charcoal-soft" : "text-good")}>
            {missing.length ? `Still to fill in: ${missing.map((s) => sentence(s.title)).join(", ")}.` : "Everything required is filled in."}
          </p>
          {submitError && <ErrorNotice className="mt-3">{submitError}</ErrorNotice>}
          <Button className="mt-3 w-full" disabled={missing.length > 0 || submitting} onClick={submit}>
            {submitting ? "Sending" : "Send to GO"}
          </Button>
        </>
      )}
      <p className="mt-5 text-center text-small text-muted">{details.template.thanks}</p>
    </div>
  )

  return (
    <AppShell wide>
      <Body>
        <GoLabel>Wedding details</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">{state.kind === "ok" ? couple : "Wedding details"}</h1>
        <p className="mt-2 text-body text-charcoal-soft">
          {when ? `${when}. ` : ""}Works on computer or phone.
          {due && !submitted ? <span className={cn("block", due.urgent ? "font-semibold text-error" : "text-muted")}>{due.text}</span> : null}
        </p>

        {state.kind === "loading" && <p className="mt-4 text-body text-muted">Opening your wedding details.</p>}
        {state.kind === "error" && (
          <ErrorNotice className="mt-4">
            {state.message}
            <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={load}>
              Try again
            </Button>
          </ErrorNotice>
        )}

        {details && (
          <>
            <div className="mt-4 grid gap-3">
              <Note note={details.template.note} />
              <div className="grid gap-2 min-[641px]:grid-cols-3">
                {details.template.howTo.map((h) => (
                  <div key={h.title} className="rounded-[12px] border border-line bg-white px-3.5 py-3">
                    <b className="block text-[13px] text-charcoal">{h.title}</b>
                    <span className="block text-small text-charcoal-soft">{h.text}</span>
                  </div>
                ))}
              </div>
              {details.template.cover.length > 0 && (
                <div className="rounded-[14px] border border-line bg-white p-4">
                  <div className="grid gap-4 min-[641px]:grid-cols-3">
                    {details.template.cover.map((f) => (
                      <FieldFor key={f.key} f={f} p={bodyProps} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 min-h-[20px] text-small" aria-live="polite">
              {saveLine && <span className={cn("font-semibold", save.kind === "saved" ? "text-good" : "text-muted")}>{saveLine}</span>}
            </div>
            {save.kind === "failed" && (
              <ErrorNotice className="mt-1">
                {save.message}
                <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={() => void flush()}>
                  Try again
                </Button>
              </ErrorNotice>
            )}

            {desktop ? (
              <div className="mt-4 grid grid-cols-[220px_minmax(0,1fr)] gap-6">
                <aside className="sticky top-[calc(var(--hdr,0px)+16px)] self-start">{nav}</aside>
                <div className="min-w-0">
                  {sections[current] && (
                    <section aria-labelledby={`wd-s-${sections[current].key}`} className="rounded-[14px] border border-line bg-white p-5">
                      <SectionHeading section={sections[current]} done={doneKeys.has(sections[current].key)} />
                      <div className="mt-4">
                        <SectionBody section={sections[current]} p={bodyProps} />
                      </div>
                      <div className="mt-5 flex justify-between gap-2.5">
                        <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
                          Back
                        </Button>
                        <Button variant="dark" size="sm" disabled={current >= sections.length - 1} onClick={() => setCurrent((c) => Math.min(sections.length - 1, c + 1))}>
                          Next
                        </Button>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {sections.map((s, i) => {
                  const isOpen = open === i
                  const done = doneKeys.has(s.key)
                  return (
                    <section key={s.key} className="overflow-hidden rounded-[14px] border border-line bg-white">
                      <button type="button" aria-expanded={isOpen} aria-controls={`wd-panel-${s.key}`} className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : i)}>
                        <span className="w-7 flex-none text-[18px] font-black text-charcoal tabular-nums">{String(s.number).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1">
                          <b className="block text-[15px] text-charcoal">{sentence(s.title)}</b>
                          <small className="block text-small text-muted">{done ? "Done" : s.required ? s.subtitle : "Optional"}</small>
                        </span>
                        {done && <DoneMark />}
                        <span aria-hidden="true" className="flex-none text-[13px] font-bold text-muted">{isOpen ? "Close" : "Open"}</span>
                      </button>
                      {isOpen && (
                        <div id={`wd-panel-${s.key}`} className="border-t border-line px-4 pt-4 pb-5">
                          <SectionBody section={s} p={bodyProps} />
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}

            {bottom}
          </>
        )}

        <Button variant="ghost" size="sm" className="mt-5" onClick={() => void leave()}>
          Back to My party
        </Button>
      </Body>
    </AppShell>
  )
}

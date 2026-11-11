import { ADMIN_API } from "@/lib/adminApi"
import { mockMode } from "@/lib/mock"

/* Wedding details (Blocks S7 and S7.1): the videography details and shot
   list (docs/wedding-details-form.pdf) as a questionnaire on the
   customer's own wedding booking, read and written through the admin's
   Block A11 routes. The shapes here are the admin's
   (server/weddingDetails/template.ts and store.ts), locked with it.

   GET    /api/customer/bookings/:id/wedding-details   the template, the
          answers, the prefill (read-only, locked), the progress (404 on
          a booking that is not this customer's wedding)
   PATCH  the same path, { answers } partial and merged; a null clears a
          field; 400 { error, reason, field } on a bad value (one bad
          field refuses the whole save); 409 reason "submitted"
   POST   .../submit; 400 reason "sections-missing" with missing
   POST   .../request-change with { note }; 409 "not-submitted" */

export type WeddingFieldType = "text" | "time" | "textarea" | "handle" | "checkbox" | "choice" | "multi" | "rank"

export interface WeddingOption {
  value: string
  label: string
}

export interface WeddingField {
  kind: "field"
  /* "section.field" or "section.group.item"; stable, never renamed. */
  key: string
  type: WeddingFieldType
  label: string
  help?: string
  /* Longest text accepted (text, time, textarea, handle). */
  max?: number
  /* choice and multi: the answers. rank: the things being ranked. */
  options?: WeddingOption[]
  /* The "@" or "#" printed in front of a handle. */
  prefix?: "@" | "#"
  keepLinks?: boolean
}

/* A box of checkboxes under a sub-heading (the PDF's DETAILS, CANDID
   MOMENTS and the like). */
export interface WeddingGroup {
  kind: "group"
  key: string
  title: string
  note?: string
  fields: WeddingField[]
}

/* The PDF's NOTE, TIP and AUDIO boxes; a null tag is a plain line of text. */
export interface WeddingNote {
  kind: "note"
  tag: string | null
  text: string
}

export interface WeddingHeading {
  kind: "heading"
  text: string
  help?: string
}

export type WeddingItem = WeddingField | WeddingGroup | WeddingNote | WeddingHeading

export interface WeddingSection {
  key: string
  number: number
  title: string
  subtitle: string
  required: boolean
  items: WeddingItem[]
}

export interface WeddingTemplate {
  version: number
  title: string
  subtitle: string
  tagline: string
  preparedFor: string
  /* The cover's fields (event date, venues): not a numbered section, so
     they never count toward what is done. */
  cover: WeddingField[]
  howTo: { title: string; text: string }[]
  note: WeddingNote
  sections: WeddingSection[]
  thanks: string
}

/* text, time, textarea and handle hold a string; checkbox true (a cleared
   box is sent as null); multi the chosen option values; choice one value;
   rank the option value to its place, 1 to the number of options. */
export type WeddingValue = string | boolean | string[] | Record<string, number> | null

export type WeddingStatus = "not_started" | "in_progress" | "submitted"

export interface WeddingProgress {
  key: string
  number: number
  title: string
  required: boolean
  done: boolean
}

export interface WeddingDetails {
  bookingId: string
  templateVersion: number
  template: WeddingTemplate
  answers: Record<string, WeddingValue>
  /* What the booking and the account already know, by field key. Each key
     here is also in lockedKeys: shown read-only and refused on a save. */
  prefill: Record<string, string>
  lockedKeys: string[]
  status: WeddingStatus
  /* "YYYY-MM-DD" */
  eventDate: string
  dueDate: string
  submittedAt: string | null
  changeRequestedAt: string | null
  /* The admin's progress: only stored answers count, never the prefill. */
  sections: WeddingProgress[]
  requiredDone: number
  requiredTotal: number
  missing: { key: string; title: string }[]
}

export type WeddingFailure = { ok: false; status: number; message: string; reason?: string; field?: string | null; missing?: { key: string; title: string }[] }
export type WeddingResult<T> = { ok: true; data: T } | WeddingFailure

const FALLBACK = "That didn't go through. Try again, or text us."

async function request<T>(path: string, init: RequestInit = {}): Promise<WeddingResult<T>> {
  try {
    const res = await fetch(`${ADMIN_API}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.ok) return { ok: true, data: data as T }
    return {
      ok: false,
      status: res.status,
      message: typeof data.error === "string" ? data.error : FALLBACK,
      reason: typeof data.reason === "string" ? data.reason : undefined,
      field: typeof data.field === "string" ? data.field : null,
      missing: Array.isArray(data.missing) ? (data.missing as { key: string; title: string }[]) : undefined,
    }
  } catch {
    return { ok: false, status: 0, message: FALLBACK }
  }
}

const base = (id: string) => `/api/customer/bookings/${encodeURIComponent(id)}/wedding-details`

/* Every mock branch is `import.meta.env.DEV && ...` with the import inside
   it, so a production build drops the branch and the fixture chunk. The
   portal mock alone answers 404 (no wedding on those bookings). */
const mocked = () => import.meta.env.DEV && (mockMode("wedding") !== null || mockMode("portal") !== null || mockMode("checkout") !== null)

export const weddingApi = {
  get: async (id: string): Promise<WeddingResult<WeddingDetails>> => {
    if (import.meta.env.DEV && mocked()) return (await import("./weddingMock")).mockGet(id)
    return request<WeddingDetails>(base(id))
  },
  /* keepalive lets a save started as the page is left finish anyway. */
  patch: async (id: string, answers: Record<string, WeddingValue>, keepalive = false): Promise<WeddingResult<WeddingDetails>> => {
    if (import.meta.env.DEV && mocked()) return (await import("./weddingMock")).mockPatch(id, answers)
    return request<WeddingDetails>(base(id), { method: "PATCH", body: JSON.stringify({ answers }), keepalive })
  },
  submit: async (id: string): Promise<WeddingResult<WeddingDetails>> => {
    if (import.meta.env.DEV && mocked()) return (await import("./weddingMock")).mockSubmit(id)
    return request<WeddingDetails>(`${base(id)}/submit`, { method: "POST" })
  },
  requestChange: async (id: string, note: string): Promise<WeddingResult<WeddingDetails>> => {
    if (import.meta.env.DEV && mocked()) return (await import("./weddingMock")).mockRequestChange(id, note)
    return request<WeddingDetails>(`${base(id)}/request-change`, { method: "POST", body: JSON.stringify({ note }) })
  },
}

/* The fields of a section, groups opened up. */
export const sectionFields = (s: WeddingSection): WeddingField[] => s.items.flatMap((it) => (it.kind === "field" ? [it] : it.kind === "group" ? it.fields : []))

/* The admin's rule, mirrored so the page can show progress before a save
   lands: a section is done when one of its fields has a stored answer.
   The prefill never counts. */
export const sectionDone = (s: WeddingSection, answers: Record<string, WeddingValue>) => sectionFields(s).some((f) => answers[f.key] !== undefined && answers[f.key] !== null)

/* "Not started", "6 of 10 done", "Submitted Oct 2". */
export function weddingStatusText(d: WeddingDetails): string {
  if (d.status === "submitted") return d.submittedAt ? `Submitted ${monthDay(d.submittedAt)}` : "Submitted"
  if (d.status === "not_started") return "Not started"
  return `${d.requiredDone} of ${d.requiredTotal} done`
}

/* "Due Oct 14", or, inside two weeks and not yet sent, "Due in 9 days"
   in the error style. */
const URGENT_DAYS = 14
export function weddingDueText(d: WeddingDetails): { text: string; urgent: boolean } | null {
  if (!d.dueDate) return null
  const n = daysUntil(d.dueDate)
  const urgent = d.status !== "submitted" && n <= URGENT_DAYS
  if (!urgent) return { text: `Due ${monthDay(d.dueDate)}`, urgent: false }
  return { text: n <= 0 ? "Due today" : n === 1 ? "Due in 1 day" : `Due in ${n} days`, urgent: true }
}

/* "Oct 14" from "2026-10-14" (or a timestamp), read as a calendar day. */
export function monthDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/* Whole days from today to a calendar day; negative once it has passed. */
export function daysUntil(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return Number.POSITIVE_INFINITY
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

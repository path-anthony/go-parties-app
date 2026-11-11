import { ADMIN_API } from "@/lib/adminApi"
import { labelForIso } from "@/lib/availability"
import type { GoDocument } from "@/components/go/contract/types"
import { parseGoDocument } from "@/components/go/contract/types"
import { mockMode } from "@/lib/mock"
import { parseOffer, type PaymentOffer } from "@/lib/paymentApi"

/* The customer portal's calls to go-parties-admin. Every request sends
   credentials: "include": the customer_session cookie is SameSite=None in
   production and never travels without it, which would look like "not
   signed in" with no error at all. */

export interface Customer {
  id: string
  name: string | null
  phone: string
  email: string
  /* Block A5: one line of text, or null until the customer gives one. */
  homeAddress?: string | null
  createdAt: string
}

/* PATCH /api/customer/me (Block A5): name, phone and home address. Email
   is not offered (the admin refuses it with 400). */
export interface CustomerPatch {
  name?: string | null
  phone?: string
  homeAddress?: string | null
}

export interface BookingUnit {
  unitId: string
  unitLabel: string
  itemId: string
  itemName: string
}

export interface CustomerBooking {
  id: string
  eventDate: string
  eventTime: string | null
  address: string | null
  customerName: string
  phone: string | null
  email: string | null
  /* Old field: "Confirmed" for any live booking. Not the source of truth. */
  status: string
  /* The real one: Held, Contract Sent, Signed, Retainer Paid, Confirmed,
     Completed or Cancelled. See lib/stage.ts. */
  stage?: string
  depositPaid: boolean
  createdAt: string
  /* Block T2: which agreement the booking took, the steps left to do, and
     the contract and money as the admin sees them. Absent from an older
     admin; every screen treats absent as "nothing to do here". */
  tier?: 1 | 2 | 3
  steps?: BookingStep[]
  contract?: { agreementId: string; status: "none" | "ready" | "sent" | "signed"; signedAt?: string | null; pdfUrl?: string | null } | null
  retainer?: { amount: number | null; paid: boolean; paidAt?: string | null; payable: boolean } | null
  balance?: { amount: number | null; dueDate: string | null; paid: boolean; payable: boolean } | null
  /* Block M: the verified address and the setup pin as the admin holds
     them; null or absent when the booking was made without one. */
  delivery?: { formattedAddress: string; setupLat: number | null; setupLng: number | null; setupNotes: string | null; verified: boolean } | null
  /* Block A9: a Google Maps link to the exact event address, null when the
     booking has no place yet. */
  mapsUrl?: string | null
  rescheduleMode?: "self" | "request"
  /* Block F1: set while a cancellation request waits on staff. The booking
     is unchanged until they decide; approved it becomes Cancelled, declined
     this goes back to null. */
  pendingRequest?: { type: "cancellation"; id: string; status: "open"; requestedAt: string; reason: string | null } | null
  /* The booking's own total (null until priced) and its occasion. */
  total?: number | null
  occasion?: string | null
  /* Not sent by the admin today (S9b contract gap); shown when it is. */
  guestCount?: number | null
  units: BookingUnit[]
  /* What was picked for which item, as booked. */
  addons?: Array<{ itemId: string | null; itemName: string; groupName: string; addonName: string; priceDelta: number; quantity: number }>
}

/* Block F2: a review request the customer sent (GET /api/customer/requests,
   newest first). Built field by field on the admin: staff notes and the
   reason for closing never arrive. There is deliberately no total here, so
   nothing can show a dollar where review starts. */
export type RequestStatus = "received" | "being-reviewed" | "booked" | "closed"

export interface CustomerRequest {
  id: string
  status: RequestStatus
  statusLabel: string
  /* Set when the request became a booking; the booking is in the list too. */
  bookingId: string | null
  createdAt: string
  /* "2026-12-26" */
  eventDate: string
  eventTime: string | null
  occasion: string | null
  address: string | null
  mapsUrl: string | null
  setupNotes: string | null
  guestCount: number | null
  /* The package's name, or null (the admin sends the name alone). */
  package: string | null
  items: Array<{ name: string; quantity: number }>
  addons: Array<{ itemName: string; groupName: string; addonName: string }>
  /* The admin's sentence while the request is waiting, else null. */
  promise: string | null
}

export interface CustomerRequests {
  responseDays: number | null
  promise: string | null
  requests: CustomerRequest[]
}

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null)

/* Reads the admin's answer field by field; a row that is not usable is
   dropped rather than shown half empty. */
export function parseRequests(data: unknown): CustomerRequests {
  const d = (data ?? {}) as Record<string, unknown>
  const rows = Array.isArray(d.requests) ? d.requests : []
  const requests = rows.flatMap((raw): CustomerRequest[] => {
    const r = raw as Record<string, unknown>
    const status = r.status
    if (typeof r.id !== "string" || (status !== "received" && status !== "being-reviewed" && status !== "booked" && status !== "closed")) return []
    const items = (Array.isArray(r.items) ? r.items : []).flatMap((i) => {
      const o = i as Record<string, unknown>
      return typeof o.name === "string" ? [{ name: o.name, quantity: typeof o.quantity === "number" && o.quantity > 0 ? o.quantity : 1 }] : []
    })
    const addons = (Array.isArray(r.addons) ? r.addons : []).flatMap((a) => {
      const o = a as Record<string, unknown>
      return typeof o.itemName === "string" && typeof o.groupName === "string" && typeof o.addonName === "string" ? [{ itemName: o.itemName, groupName: o.groupName, addonName: o.addonName }] : []
    })
    return [
      {
        id: r.id,
        status,
        statusLabel: text(r.statusLabel) ?? "",
        bookingId: text(r.bookingId),
        createdAt: text(r.createdAt) ?? "",
        eventDate: text(r.eventDate)?.slice(0, 10) ?? "",
        eventTime: text(r.eventTime),
        occasion: text(r.occasion),
        address: text(r.address),
        mapsUrl: text(r.mapsUrl),
        setupNotes: text(r.setupNotes),
        guestCount: typeof r.guestCount === "number" ? r.guestCount : null,
        package: text(r.package),
        items,
        addons,
        promise: text(r.promise),
      },
    ]
  })
  return { responseDays: typeof d.responseDays === "number" ? d.responseDays : null, promise: text(d.promise), requests }
}

/* Block F1: what a customer sees before asking to cancel. The terms are
   finished wording (the numbers are filled in) and shown in full. */
export interface CancelTerms {
  source: "contract" | "policy"
  title: string
  text: string
}

export interface CancelInfo {
  /* Dollars paid so far. */
  paid: number
  retainerPaid: boolean
  /* True when anything has been paid: the terms must be accepted to ask. */
  termsRequired: boolean
  terms: CancelTerms | null
  pendingRequest: { id: string; status: "open"; requestedAt: string; reason: string | null } | null
}

/* The customer booking as the list returns it, plus the request that was
   made (POST .../cancel, 202 or 200). */
export type CancelAsked = CustomerBooking & { message?: string; paid?: number; terms?: CancelTerms | null }

export type StepKey = "sign" | "retainer" | "balance" | "proposal" | "confirm-date"
export type StepState = "done" | "next" | "waiting" | "blocked"
export interface BookingStep {
  key: StepKey
  state: StepState
  at?: string | null
}

/* The customer's own contract, same shape as the public signing link's. */
export interface CustomerContract {
  signed: boolean
  title: string
  format?: "go-v2"
  document?: GoDocument
  contentHash?: string
  signedName?: string
  signedAt?: string
  pdfUrl?: string
  consentText?: string
  termsText?: string
  sections?: { heading: string; body: string }[]
  text?: string
}

export interface SignBody {
  fullName: string
  additionalSignerName?: string
  esignConsent?: boolean
  consentToElectronicSignature: boolean
  agreeToTerms: boolean
  contentHash?: string
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; reason?: string; field?: string }

const FALLBACK = "That didn't go through. Try again, or text us."

async function call<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const { headers, ...rest } = init
  try {
    const res = await fetch(`${ADMIN_API}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      ...rest,
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.ok) return { ok: true, data: data as T }
    return {
      ok: false,
      status: res.status,
      message: typeof data.error === "string" ? data.error : FALLBACK,
      reason: typeof data.reason === "string" ? data.reason : undefined,
      field: typeof data.field === "string" ? data.field : undefined,
    }
  } catch {
    return { ok: false, status: 0, message: FALLBACK }
  }
}

const post = <T,>(path: string, body?: unknown) =>
  call<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) })

/* Every mock branch is written out in full, `import.meta.env.DEV && ...`
   with the dynamic import inside it, so a production build drops the branch
   and the fixture chunk with it. */

function withDocument(data: CustomerContract): CustomerContract {
  const raw = data as unknown as Record<string, unknown>
  if (raw.format !== "go-v2") return data
  const document = parseGoDocument(raw.document)
  return document ? { ...data, format: "go-v2", document } : { ...data, format: undefined, document: undefined }
}

/* Account calls under a mock (checkout scenarios and the portal, S3):
   a session kept in memory, so the sign-in step and "Your details" work
   with no admin. */
const authMocked = () => import.meta.env.DEV && (mockMode("checkout") !== null || mockMode("portal") !== null)

export const customerApi = {
  me: async () => {
    if (import.meta.env.DEV && authMocked()) {
      const m = await import("./authMock")
      const s = m.mockSession()
      if (s) return { ok: true, data: { customer: s } } as ApiResult<{ customer: Customer }>
    }
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockMe()
    return call<{ customer: Customer }>("/api/customer/me")
  },
  signup: async (input: { name: string | null; phone: string; email: string; password: string; homeAddress?: string | null }) => {
    if (import.meta.env.DEV && authMocked()) return (await import("./authMock")).mockSignup(input)
    return post<{ customer: Customer }>("/api/customer/signup", input)
  },
  login: async (input: { identifier: string; password: string }) => {
    if (import.meta.env.DEV && authMocked()) return (await import("./authMock")).mockLogin(input)
    return post<{ customer: Customer }>("/api/customer/login", input)
  },
  logout: async () => {
    if (import.meta.env.DEV && authMocked()) return (await import("./authMock")).mockLogout()
    return post<{ ok: boolean }>("/api/customer/logout")
  },
  updateMe: async (patch: CustomerPatch, current: Customer | null = null) => {
    if (import.meta.env.DEV && authMocked()) return (await import("./authMock")).mockUpdateMe(current, patch)
    return call<{ customer: Customer }>("/api/customer/me", { method: "PATCH", body: JSON.stringify(patch) })
  },
  bookings: async () => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockBookings()
    return call<CustomerBooking[]>("/api/customer/bookings")
  },
  /* Block F2. Signed in only; 401 without the session. */
  requests: async (): Promise<ApiResult<CustomerRequests>> => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockRequests()
    const r = await call<unknown>("/api/customer/requests")
    return r.ok ? { ok: true, data: parseRequests(r.data) } : r
  },
  contract: async (id: string): Promise<ApiResult<CustomerContract>> => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockContract(id)
    const r = await call<CustomerContract>(`/api/customer/bookings/${encodeURIComponent(id)}/contract`)
    return r.ok ? { ok: true, data: withDocument(r.data) } : r
  },
  sign: async (id: string, body: SignBody) => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockSign(id, body)
    return post<{ signed: true; signedAt: string; signedName: string; pdfUrl: string }>(`/api/customer/bookings/${encodeURIComponent(id)}/sign`, body)
  },
  paymentSession: async (id: string, kind: "retainer" | "balance"): Promise<ApiResult<PaymentOffer>> => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockPaymentSession(id, kind)
    const r = await post<Record<string, unknown>>(`/api/customer/bookings/${encodeURIComponent(id)}/payments/session`, { kind })
    if (!r.ok) return r
    const offer = parseOffer({ ...r.data, kind })
    return offer ? { ok: true, data: offer } : { ok: false, status: 0, message: FALLBACK }
  },
  /* Block F1: the customer can no longer cancel a booking; this asks GO to.
     cancelInfo is read when "Request to cancel" opens, to know whether terms
     must be accepted first. */
  cancelInfo: async (id: string): Promise<ApiResult<CancelInfo>> => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockCancelInfo(id)
    return call<CancelInfo>(`/api/customer/bookings/${encodeURIComponent(id)}/cancel`)
  },
  requestCancel: async (id: string, body: { reason: string; acceptTerms: boolean }): Promise<ApiResult<CancelAsked>> => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockRequestCancel(id, body)
    return post<CancelAsked>(`/api/customer/bookings/${encodeURIComponent(id)}/cancel`, body)
  },
  reschedule: (id: string, change: { eventDate?: string; eventTime?: string | null }) =>
    post<CustomerBooking>(`/api/customer/bookings/${encodeURIComponent(id)}/reschedule`, change),
  changeItem: (id: string, itemId: string) =>
    post<CustomerBooking & { unit: { id: string; label: string } }>(
      `/api/customer/bookings/${encodeURIComponent(id)}/change-item`,
      { itemId }
    ),
}

/* "2026-11-14T00:00:00.000Z" (a DATE column serialized) to "2026-11-14". */
export const isoDay = (eventDate: string) => eventDate.slice(0, 10)

/* "Sat Nov 14, 2 PM" and "Snow Cone Station" for a booking card. Units of
   the same item read as one line with a count: "Tent x 2, Bounce House". */
export const whenOf = (b: CustomerBooking) => {
  const day = labelForIso(isoDay(b.eventDate))
  return b.eventTime ? `${day}, ${b.eventTime}` : day
}
export const whatOf = (b: CustomerBooking) => {
  const counts = new Map<string, number>()
  for (const u of b.units) counts.set(u.itemName, (counts.get(u.itemName) ?? 0) + 1)
  return [...counts].map(([name, n]) => (n > 1 ? `${name} x ${n}` : name)).join(", ") || "Booking"
}

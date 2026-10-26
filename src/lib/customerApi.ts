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
  createdAt: string
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
  rescheduleMode?: "self" | "request"
  pendingRequest?: { kind: "reschedule" | "cancel"; eventDate?: string; reason?: string; requestedAt: string } | null
  units: BookingUnit[]
  /* What was picked for which item, as booked. */
  addons?: Array<{ itemId: string | null; itemName: string; groupName: string; addonName: string; priceDelta: number; quantity: number }>
}

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

export const customerApi = {
  me: async () => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockMe()
    return call<{ customer: Customer }>("/api/customer/me")
  },
  signup: (input: { name: string | null; phone: string; email: string; password: string }) =>
    post<{ customer: Customer }>("/api/customer/signup", input),
  login: (input: { identifier: string; password: string }) => post<{ customer: Customer }>("/api/customer/login", input),
  logout: () => post<{ ok: boolean }>("/api/customer/logout"),
  bookings: async () => {
    if (import.meta.env.DEV && mockMode("portal")) return (await import("./portalMock")).mockBookings()
    return call<CustomerBooking[]>("/api/customer/bookings")
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
  cancel: (id: string) => post<CustomerBooking>(`/api/customer/bookings/${encodeURIComponent(id)}/cancel`),
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

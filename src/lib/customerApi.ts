import { ADMIN_API } from "@/lib/adminApi"
import { labelForIso } from "@/lib/availability"

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
  status: string
  depositPaid: boolean
  createdAt: string
  units: BookingUnit[]
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

export const customerApi = {
  me: () => call<{ customer: Customer }>("/api/customer/me"),
  signup: (input: { name: string | null; phone: string; email: string; password: string }) =>
    post<{ customer: Customer }>("/api/customer/signup", input),
  login: (input: { identifier: string; password: string }) => post<{ customer: Customer }>("/api/customer/login", input),
  logout: () => post<{ ok: boolean }>("/api/customer/logout"),
  bookings: () => call<CustomerBooking[]>("/api/customer/bookings"),
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

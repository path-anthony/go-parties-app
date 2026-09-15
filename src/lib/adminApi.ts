/* Live calls to go-parties-admin, same base URL Ask GO uses. Both endpoints
   here are public on the admin side (no session) and rate limited there. */

export const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3001"

export interface Availability {
  itemId: string
  date: string
  directBooking: boolean
  available: boolean
  freeUnits?: number
  totalUnits?: number
  message?: string
}

export async function checkAvailability(itemId: string, iso: string): Promise<Availability> {
  const res = await fetch(`${ADMIN_API}/api/items/${encodeURIComponent(itemId)}/availability?date=${iso}`)
  if (!res.ok) throw new Error(`availability ${res.status}`)
  return res.json()
}

export interface DirectBooking {
  bookingId: string
  leadId: string
  eventDate: string
  status: string
  depositPaid: boolean
  item: { id: string; name: string }
  unit: { id: string; label: string }
}

export type DirectReason = "unavailable" | "not-tracked" | "error"

export type DirectResult = { ok: true; booking: DirectBooking } | { ok: false; reason: DirectReason; message: string }

const FALLBACK = "That didn't go through. Try again, or text us."

export async function bookDirect(input: {
  itemId: string
  eventDate: string
  customerName: string
  contact: string
}): Promise<DirectResult> {
  const res = await fetch(`${ADMIN_API}/api/bookings/direct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 201) return { ok: true, booking: data as DirectBooking }
  const reason: DirectReason = data.reason === "unavailable" || data.reason === "not-tracked" ? data.reason : "error"
  return { ok: false, reason, message: typeof data.error === "string" ? data.error : FALLBACK }
}

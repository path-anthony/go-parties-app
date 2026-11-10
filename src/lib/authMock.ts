import type { ApiResult, Customer } from "@/lib/customerApi"

/* Account fixtures, DEV only (loaded lazily behind import.meta.env.DEV),
   used while `?mock=<checkout scenario>` or `?mock=portal` is on so the
   sign-in step of checkout and the portal's "Your details" work with no
   admin. Sign up answers with what was typed (an email containing "taken"
   answers the admin's 409 with field "email"); sign in answers a returning
   customer with no home address for any email ("nohome" anywhere in it)
   or with one (anything else); the session lives in memory for the tab.
   Nothing here touches the admin. */

let session: Customer | null = null
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const mockSession = (): Customer | null => session
export const mockSetSession = (c: Customer | null) => {
  session = c
}

/* The admin's rule for a home address (Block A9): a street number, and the
   fixture "3 Refused Rd" is refused anyway. */
const NOT_EXACT = "We couldn't find that exact address. Pick it from the suggestions, or check the street number."
const vagueHome = (t: string | null | undefined) => !!t && t.trim() !== "" && (!/\d/.test(t) || /refused/i.test(t))
const refusedHome = (): ApiResult<{ customer: Customer }> => ({ ok: false, status: 400, message: NOT_EXACT, reason: "address-not-exact", field: "homeAddress" })

export async function mockSignup(input: { name: string | null; phone: string; email: string; password: string; homeAddress?: string | null }): Promise<ApiResult<{ customer: Customer }>> {
  await wait(300)
  console.debug("mock sign-up home address", JSON.stringify(input.homeAddress ?? null))
  if (vagueHome(input.homeAddress)) return refusedHome()
  if (/taken/i.test(input.email)) return { ok: false, status: 409, message: "That email already has an account. Sign in instead.", field: "email" }
  session = { id: "cus_mock_new", name: input.name, phone: input.phone.replace(/\D/g, ""), email: input.email, homeAddress: input.homeAddress?.trim() || null, createdAt: new Date().toISOString() }
  return { ok: true, data: { customer: session } }
}

export async function mockLogin(input: { identifier: string; password: string }): Promise<ApiResult<{ customer: Customer }>> {
  await wait(300)
  if (input.password === "wrong") return { ok: false, status: 401, message: "That phone or email and password did not match. Try again." }
  const noHome = /nohome/i.test(input.identifier)
  session = {
    id: noHome ? "cus_mock_nohome" : "cus_mock_returning",
    name: noHome ? "Claude Nohome Test" : "Claude Returning Test",
    phone: "8605550199",
    email: input.identifier.includes("@") ? input.identifier : "returning.test@example.com",
    homeAddress: noHome ? null : "228 Ridge Rd, Avon, CT 06001, USA",
    createdAt: "2026-09-01T12:00:00.000Z",
  }
  return { ok: true, data: { customer: session } }
}

export async function mockUpdateMe(current: Customer | null, patch: { name?: string | null; phone?: string; homeAddress?: string | null }): Promise<ApiResult<{ customer: Customer }>> {
  await wait(300)
  console.debug("mock patch me", JSON.stringify(patch))
  const base = session ?? current
  if (!base) return { ok: false, status: 401, message: "Please sign in." }
  if (patch.homeAddress !== undefined && vagueHome(patch.homeAddress)) return refusedHome()
  if (patch.phone && patch.phone.replace(/\D/g, "") === "8605550000") return { ok: false, status: 409, message: "That phone number already has an account.", field: "phone" }
  session = { ...base, ...(patch.name !== undefined ? { name: patch.name } : {}), ...(patch.phone !== undefined ? { phone: patch.phone.replace(/\D/g, "") } : {}), ...(patch.homeAddress !== undefined ? { homeAddress: patch.homeAddress } : {}) }
  return { ok: true, data: { customer: session } }
}

export async function mockLogout(): Promise<ApiResult<{ ok: boolean }>> {
  session = null
  return { ok: true, data: { ok: true } }
}

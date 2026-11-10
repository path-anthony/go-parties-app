import { useState } from "react"
import { customerApi, type Customer } from "@/lib/customerApi"
import type { VerifiedAddress } from "@/lib/places"
import { useCustomer } from "@/state/customer"

/* The one sign-up path, shared by the portal's sign-up screen and the
   account step inside a direct booking. Phone, email and a password are
   required by the admin; a name is optional. Server messages (weak
   password, a malformed phone) are kept as sent. A phone or email that is
   already on an account (the admin's 409, with `field` naming which, or
   the race answer with neither) becomes the bank's line with a Sign in
   door, under that field (Block S2). A home address the admin refuses
   (400 address-not-exact, field homeAddress, Block S6) shows the admin's
   sentence under the home field and drops the pick. */

export const PASSWORD_MIN = 8

export interface SignUpValues {
  name: string
  phone: string
  email: string
  password: string
  /* Block A5: one line, saved on the account. Required at checkout (S3),
     optional on the portal's sign-up. */
  homeAddress: string
  /* Block S6: the home address as Google verified it, when a suggestion was
     picked. The text above is its formatted address then. */
  homeVerified: VerifiedAddress | null
}

export type Taken = "email" | "phone" | "both"

export interface SignUpProblem {
  message: string
  /* The field the admin named, so the message sits under it in red. */
  field: "phone" | "email" | "homeAddress" | null
  /* Set when the phone or email already has an account. */
  taken: Taken | null
}

export const TAKEN_LINE: Record<Taken, string> = {
  email: "You already have an account with this email. Sign in to continue.",
  phone: "You already have an account with this phone number. Sign in to continue.",
  both: "You already have an account with this email or phone number. Sign in to continue.",
}

export const EMPTY_SIGNUP: SignUpValues = { name: "", phone: "", email: "", password: "", homeAddress: "", homeVerified: null }

/* Phone, email and a password always; at checkout (S3) the name and the
   home address too. A home address that is typed must be picked from the
   suggestions (`pick`, Block S6), required or optional; the field may stay
   empty where it is optional. When Google cannot be reached `pick` is false
   and the typed text goes as it is. */
export const canSignUp = (v: SignUpValues, full = false, pick = false) => {
  const home = v.homeAddress.trim()
  const homeOk = home === "" ? !full : !pick || v.homeVerified !== null
  return v.phone.trim() !== "" && v.email.trim() !== "" && v.password.length >= PASSWORD_MIN && (!full || v.name.trim() !== "") && homeOk
}

/* The admin tells a taken phone or email apart with status 409 and
   `field` ("phone" or "email"); two sign-ups racing answer 409 with no
   field and the same "already has an account" sentence. */
export function signUpProblem(r: { status: number; message: string; field?: string; reason?: string }): SignUpProblem {
  if (r.status === 400 && r.reason === "address-not-exact") return { message: r.message, field: "homeAddress", taken: null }
  const field = r.field === "phone" || r.field === "email" ? r.field : null
  const taken: Taken | null = r.status === 409 && (field || /already has an account/i.test(r.message)) ? (field ?? "both") : null
  return { message: taken ? TAKEN_LINE[taken] : r.message, field, taken }
}

export function useSignUp() {
  const { setCustomer } = useCustomer()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<SignUpProblem | null>(null)

  /* The new customer, or null with `problem` set; `refusedHome` is true
     when the admin refused the home address, so the caller can drop the
     pick. */
  const signUp = async (v: SignUpValues): Promise<{ customer: Customer | null; refusedHome: boolean }> => {
    if (!canSignUp(v) || busy) return { customer: null, refusedHome: false }
    setBusy(true)
    setProblem(null)
    const result = await customerApi.signup({ name: v.name.trim() || null, phone: v.phone.trim(), email: v.email.trim(), password: v.password, homeAddress: v.homeAddress.trim() || null })
    setBusy(false)
    if (result.ok) {
      setCustomer(result.data.customer)
      return { customer: result.data.customer, refusedHome: false }
    }
    const problem = signUpProblem(result)
    setProblem(problem)
    return { customer: null, refusedHome: problem.field === "homeAddress" }
  }

  return { signUp, busy, problem, setProblem }
}

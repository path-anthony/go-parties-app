import { useState } from "react"
import { customerApi, type Customer } from "@/lib/customerApi"
import { useCustomer } from "@/state/customer"

/* The one sign-up path, shared by the portal's sign-up screen and the
   account step inside a direct booking. Phone, email and a password are
   required by the admin; a name is optional. Server messages (weak
   password, a malformed phone) are kept as sent. A phone or email that is
   already on an account (the admin's 409, with `field` naming which, or
   the race answer with neither) becomes the bank's line with a Sign in
   door, under that field (Block S2). */

export const PASSWORD_MIN = 8

export interface SignUpValues {
  name: string
  phone: string
  email: string
  password: string
  /* Block A5: one line, saved on the account. Required at checkout (S3),
     optional on the portal's sign-up. */
  homeAddress: string
}

export type Taken = "email" | "phone" | "both"

export interface SignUpProblem {
  message: string
  /* The field the admin named, so the message sits under it in red. */
  field: "phone" | "email" | null
  /* Set when the phone or email already has an account. */
  taken: Taken | null
}

export const TAKEN_LINE: Record<Taken, string> = {
  email: "You already have an account with this email. Sign in to continue.",
  phone: "You already have an account with this phone number. Sign in to continue.",
  both: "You already have an account with this email or phone number. Sign in to continue.",
}

export const EMPTY_SIGNUP: SignUpValues = { name: "", phone: "", email: "", password: "", homeAddress: "" }

/* Phone, email and a password always; at checkout (S3) the name and the
   home address too. */
export const canSignUp = (v: SignUpValues, full = false) =>
  v.phone.trim() !== "" && v.email.trim() !== "" && v.password.length >= PASSWORD_MIN && (!full || (v.name.trim() !== "" && v.homeAddress.trim() !== ""))

/* The admin tells a taken phone or email apart with status 409 and
   `field` ("phone" or "email"); two sign-ups racing answer 409 with no
   field and the same "already has an account" sentence. */
export function signUpProblem(r: { status: number; message: string; field?: string }): SignUpProblem {
  const field = r.field === "phone" || r.field === "email" ? r.field : null
  const taken: Taken | null = r.status === 409 && (field || /already has an account/i.test(r.message)) ? (field ?? "both") : null
  return { message: taken ? TAKEN_LINE[taken] : r.message, field, taken }
}

export function useSignUp() {
  const { setCustomer } = useCustomer()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<SignUpProblem | null>(null)

  const signUp = async (v: SignUpValues): Promise<Customer | null> => {
    if (!canSignUp(v) || busy) return null
    setBusy(true)
    setProblem(null)
    const result = await customerApi.signup({ name: v.name.trim() || null, phone: v.phone.trim(), email: v.email.trim(), password: v.password, homeAddress: v.homeAddress.trim() || null })
    setBusy(false)
    if (result.ok) {
      setCustomer(result.data.customer)
      return result.data.customer
    }
    setProblem(signUpProblem(result))
    return null
  }

  return { signUp, busy, problem, setProblem }
}

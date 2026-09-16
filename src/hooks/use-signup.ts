import { useState } from "react"
import { customerApi, type Customer } from "@/lib/customerApi"
import { useCustomer } from "@/state/customer"

/* The one sign-up path, shared by the portal's sign-up screen and the
   account step inside a direct booking. Phone, email and a password are
   required by the admin; a name is optional. Server messages (taken phone
   or email, weak password) are kept as sent. */

export const PASSWORD_MIN = 8

export interface SignUpValues {
  name: string
  phone: string
  email: string
  password: string
}

export const EMPTY_SIGNUP: SignUpValues = { name: "", phone: "", email: "", password: "" }

export const canSignUp = (v: SignUpValues) => v.phone.trim() !== "" && v.email.trim() !== "" && v.password.length >= PASSWORD_MIN

export function useSignUp() {
  const { setCustomer } = useCustomer()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const signUp = async (v: SignUpValues): Promise<Customer | null> => {
    if (!canSignUp(v) || busy) return null
    setBusy(true)
    setNotice(null)
    const result = await customerApi.signup({ name: v.name.trim() || null, phone: v.phone.trim(), email: v.email.trim(), password: v.password })
    setBusy(false)
    if (result.ok) {
      setCustomer(result.data.customer)
      return result.data.customer
    }
    setNotice(result.message)
    return null
  }

  return { signUp, busy, notice, setNotice }
}

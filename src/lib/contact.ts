import type { Customer } from "@/lib/customerApi"
import { phoneDigits, phoneProblem } from "@/lib/phone"

/* Block S9b. Who a chat lead is, for "Talk to us instead" and Ask GO
   (S9-CONTRACT section 5). Both calls take optional name, email and phone,
   and read the customer session cookie when the request is sent with
   credentials: "include". A lead is made on the admin only when there is at
   least one of the three, so nothing is invented here: the signed-in
   customer's own details, else what the customer typed on this device (the
   checkout form, or an email address or phone number written in the chat).
   The admin ignores a value it cannot use rather than refusing the call. */

export interface LeadContact {
  name?: string
  email?: string
  phone?: string
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/
const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/

const clean = (v: string | null | undefined, max: number) => {
  const t = (v ?? "").trim().slice(0, max)
  return t === "" ? undefined : t
}

/* The signed-in customer wins; typed values fill what the account does not
   have (a guest has none). */
export function contactFrom(customer: Customer | null, typed: { name?: string; email?: string; phone?: string } = {}): LeadContact {
  const out: LeadContact = {}
  const name = clean(customer?.name ?? typed.name, 100)
  const email = clean(customer?.email ?? typed.email, 200)
  const phone = clean(customer?.phone ?? typed.phone, 40)
  if (name) out.name = name
  if (email && EMAIL.test(email)) out.email = email
  if (phone && !phoneProblem(phone)) out.phone = phoneDigits(phone) ?? phone
  return out
}

/* An email address or phone number the customer wrote to Ask GO themselves.
   Only the customer's own messages are read, newest first. */
export function contactInChat(messages: Array<{ role: string; content: string }>): LeadContact {
  const out: LeadContact = {}
  for (const m of [...messages].reverse()) {
    if (m.role !== "user") continue
    if (!out.email) {
      const e = m.content.match(EMAIL)?.[0]
      if (e) out.email = e.slice(0, 200)
    }
    if (!out.phone) {
      const p = m.content.match(PHONE)?.[0]
      if (p && !phoneProblem(p)) out.phone = phoneDigits(p) ?? p
    }
  }
  return out
}

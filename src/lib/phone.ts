/* Block S9a. US phone numbers, the admin's rule (S9-CONTRACT section 3):
   ten digits (a leading 1 or +1 is accepted and dropped), the area code and
   the exchange not starting with 0 or 1, and not one digit ten times.
   Punctuation and spaces are fine. The storefront checks the same rule
   before it sends, so the admin's 400 phone-invalid is rarely the first the
   customer hears of it; the admin stays the judge. */

export const PHONE_HINT = "Enter a 10 digit US phone number, like (860) 555-0142."

/* The ten digits with a leading 1 dropped, or null when there are not ten. */
export function phoneDigits(raw: string): string | null {
  let d = raw.replace(/\D/g, "")
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1)
  return d.length === 10 ? d : null
}

/* The sentence to show under the field, or null when the number is fine. */
export function phoneProblem(raw: string): string | null {
  const d = phoneDigits(raw)
  if (!d) return PHONE_HINT
  if (d[0] === "0" || d[0] === "1" || d[3] === "0" || d[3] === "1") return PHONE_HINT
  if (/^(\d)\1{9}$/.test(d)) return PHONE_HINT
  return null
}

/* As the customer types: "8605550142" becomes "(860) 555-0142" one digit at
   a time. A pasted 11 digit number with a leading 1 drops the 1. */
export function formatPhoneInput(raw: string): string {
  let d = raw.replace(/\D/g, "")
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1)
  d = d.slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/* A saved number for display: formatted when it is ten digits, else exactly
   as the account holds it (an older account can hold any spelling). */
export function showPhone(raw: string | null | undefined): string {
  if (!raw) return ""
  const d = phoneDigits(raw)
  return d ? formatPhoneInput(d) : raw
}

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/go/ErrorNotice"
import { formatPhoneInput, phoneProblem } from "@/lib/phone"

/* The phone input (Block S9a), one for sign-up, Your details and anywhere
   else a phone is typed. It formats as the customer types, "(860) 555-0142",
   and checks the admin's rule (lib/phone.ts) when they leave the field, with
   the admin's sentence in red directly under it. A problem the screen knows
   about (a refusal from the admin, or a submit attempt) comes in as `error`
   and wins over the local check. */
export function PhoneField({
  id,
  value,
  onChange,
  error,
  placeholder = "(860) 555-0142",
  autoFocus,
}: {
  id: string
  value: string
  onChange: (formatted: string) => void
  error?: React.ReactNode
  placeholder?: string
  autoFocus?: boolean
}) {
  const [left, setLeft] = useState(false)
  const local = left && value.trim() !== "" ? phoneProblem(value) : null
  const message = error ?? local
  const errorId = `${id}-error`
  return (
    <>
      <Input
        id={id}
        placeholder={placeholder}
        autoComplete="tel"
        inputMode="tel"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(formatPhoneInput(e.target.value))}
        onBlur={() => setLeft(true)}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? errorId : undefined}
      />
      {message && <FieldError id={errorId}>{message}</FieldError>}
    </>
  )
}


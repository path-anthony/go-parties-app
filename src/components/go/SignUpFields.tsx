import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GoLabel } from "@/components/go/GoLabel"
import { AddressField } from "@/components/go/AddressField"
import { AddressPreview } from "@/components/go/AddressPreview"
import { ErrorNotice, FieldError } from "@/components/go/ErrorNotice"
import type { SignUpProblem, SignUpValues } from "@/hooks/use-signup"

/* The sign-up inputs: name, email, phone, password and the home address
   (S3). One source for the portal's sign-up screen (home address optional)
   and the sign-in step inside a direct booking (everything required).
   A problem the admin tied to a field (a taken phone or email) shows in
   red directly under that field, with a Sign in door when the account
   already exists; a problem with no field (the race, a weak password)
   shows as the red notice directly above the screen's button, which the
   screen renders itself. The home address is picked from Google's
   suggestions (Block S6): the map and the formatted address show under it
   once picked, and the admin's refusal shows in red under it. */
export function SignUpFields({
  values,
  problem,
  full = false,
  onChange,
  onSubmit,
  onSignIn,
  onClearProblem,
}: {
  values: SignUpValues
  problem?: SignUpProblem | null
  /* Checkout: the name and the home address are required too. */
  full?: boolean
  onChange: (v: SignUpValues) => void
  onSubmit?: () => void
  /* Opens sign in with the typed email (or phone) filled in. */
  onSignIn?: () => void
  /* Called when the customer edits the home address, so a red line about
     the old one goes away. */
  onClearProblem?: () => void
}) {
  const set = (key: "name" | "email" | "phone" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [key]: e.target.value })
  const under = (field: "phone" | "email") =>
    problem?.field === field ? (
      <FieldError id={`signup-${field}-error`}>
        {problem.message}
        {problem.taken && onSignIn && (
          <Button type="button" variant="ghost" size="sm" className="mt-2 block" onClick={onSignIn}>
            Sign in
          </Button>
        )}
      </FieldError>
    ) : null
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
      <Input placeholder="Sarah Lin" autoComplete="name" value={values.name} onChange={set("name")} />
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Email</GoLabel>
      <Input placeholder="you@email.com" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} aria-invalid={problem?.field === "email" || undefined} aria-describedby={problem?.field === "email" ? "signup-email-error" : undefined} />
      {under("email")}
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Phone</GoLabel>
      <Input placeholder="860 555 0134" autoComplete="tel" inputMode="tel" value={values.phone} onChange={set("phone")} aria-invalid={problem?.field === "phone" || undefined} aria-describedby={problem?.field === "phone" ? "signup-phone-error" : undefined} />
      {under("phone")}
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Password</GoLabel>
      <Input type="password" autoComplete="new-password" value={values.password} onChange={set("password")} />
      <p className="mt-1.5 text-small text-muted">8 characters or more.</p>
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Home address</GoLabel>
      <AddressField
        placeholder="14 Maple Ln, Farmington, CT 06032"
        autoComplete="street-address"
        value={values.homeAddress}
        verified={values.homeVerified}
        error={problem?.field === "homeAddress" ? problem.message : null}
        onChange={(text, v) => {
          onClearProblem?.()
          onChange({ ...values, homeAddress: text, homeVerified: v })
        }}
      />
      {values.homeVerified && <AddressPreview address={values.homeVerified} className="mt-2.5" />}
      <p className="mt-1.5 text-small text-muted">{full ? "Where you live. Checkout can use it as the event address." : "Optional. Checkout can use it as the event address."}</p>
      <button type="submit" className="hidden" aria-hidden />
    </form>
  )
}

/* The notice for a problem with no field, directly above the button. */
export function SignUpNotice({ problem, onSignIn, className }: { problem: SignUpProblem | null; onSignIn?: () => void; className?: string }) {
  if (!problem || problem.field) return null
  return (
    <ErrorNotice className={className}>
      {problem.message}
      {problem.taken && onSignIn && (
        <Button type="button" variant="ghost" size="sm" className="mt-2.5 block" onClick={onSignIn}>
          Sign in
        </Button>
      )}
    </ErrorNotice>
  )
}

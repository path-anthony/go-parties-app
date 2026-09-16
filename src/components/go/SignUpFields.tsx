import { Input } from "@/components/ui/input"
import { GoLabel } from "@/components/go/GoLabel"
import type { SignUpValues } from "@/hooks/use-signup"

/* The sign-up inputs: name, phone, email, password. One source for the
   portal's sign-up screen and the account step inside a direct booking. */
export function SignUpFields({
  values,
  onChange,
  onSubmit,
}: {
  values: SignUpValues
  onChange: (v: SignUpValues) => void
  onSubmit?: () => void
}) {
  const set = (key: keyof SignUpValues) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [key]: e.target.value })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
      <Input placeholder="Sarah Lin" autoComplete="name" value={values.name} onChange={set("name")} />
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Phone</GoLabel>
      <Input placeholder="860 555 0134" autoComplete="tel" inputMode="tel" value={values.phone} onChange={set("phone")} />
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Email</GoLabel>
      <Input placeholder="you@email.com" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} />
      <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Password</GoLabel>
      <Input type="password" autoComplete="new-password" value={values.password} onChange={set("password")} />
      <p className="mt-1.5 text-small text-muted">8 characters or more.</p>
      <button type="submit" className="hidden" aria-hidden />
    </form>
  )
}

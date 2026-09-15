import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { customerApi } from "@/lib/customerApi"
import { useCustomer } from "@/state/customer"

/* Customer sign up. Phone, email and a password are required by the admin;
   a name is optional here and gets saved from the first booking otherwise.
   Server messages (taken phone or email, weak password) are shown as sent. */

export default function PartySignUp() {
  const navigate = useNavigate()
  const { setCustomer } = useCustomer()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canSubmit = phone.trim() !== "" && email.trim() !== "" && password.length >= 8 && !busy

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setNotice(null)
    const result = await customerApi.signup({ name: name.trim() || null, phone: phone.trim(), email: email.trim(), password })
    setBusy(false)
    if (result.ok) {
      setCustomer(result.data.customer)
      navigate("/party")
      return
    }
    setNotice(result.message)
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>My party</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">New here.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Phone, email, a password. That's it.</p>
        <form onSubmit={submit} className="mt-3.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
          <Input placeholder="Sarah Lin" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Phone</GoLabel>
          <Input placeholder="860 555 0134" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Email</GoLabel>
          <Input placeholder="you@email.com" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Password</GoLabel>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1.5 text-small text-muted">8 characters or more.</p>
          <button type="submit" className="hidden" aria-hidden />
        </form>
        {notice && (
          <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">{notice}</div>
        )}
        <p className="mt-3.5 text-small text-muted">
          Have an account?{" "}
          <Link to="/party/signin" className="font-bold text-charcoal">
            Sign in
          </Link>
        </p>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/party")}>Back</Button>
        <Button disabled={!canSubmit} onClick={() => submit()}>Create account</Button>
      </Foot>
    </AppShell>
  )
}

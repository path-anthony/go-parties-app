import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import { GoLabel } from "@/components/go/GoLabel"
import { customerApi } from "@/lib/customerApi"
import { useCustomer } from "@/state/customer"

/* Customer sign in. Phone or email, password. The admin answers wrong
   identifier and wrong password with the same sentence on purpose; it shows
   in red directly above the Sign in button (Block S2). A sign-up that hit an
   existing account sends the typed email or phone along in location state
   so it is filled in here, and returnTo brings the customer back to the
   checkout step they left, cart and date intact. */

type Handed = { returnTo?: unknown; identifier?: unknown } | null

export default function PartySignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const handed = location.state as Handed
  const returnTo = typeof handed?.returnTo === "string" ? handed.returnTo : "/party"
  const { setCustomer } = useCustomer()
  const [identifier, setIdentifier] = useState(typeof handed?.identifier === "string" ? handed.identifier : "")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canSubmit = identifier.trim() !== "" && password !== "" && !busy

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setNotice(null)
    const result = await customerApi.login({ identifier: identifier.trim(), password })
    setBusy(false)
    if (result.ok) {
      setCustomer(result.data.customer)
      navigate(returnTo)
      return
    }
    setNotice(result.message)
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>My party</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Welcome in.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Phone or email, then your password.</p>
        <form onSubmit={submit} className="mt-3.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Phone or email</GoLabel>
          <Input
            placeholder="860 555 0134 or you@email.com"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Password</GoLabel>
          <Input
            type="password"
            autoComplete="current-password"
            autoFocus={identifier !== ""}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="hidden" aria-hidden />
        </form>
        <p className="mt-3.5 text-small text-muted">
          New here?{" "}
          <Link to="/party/signup" className="inline-flex min-h-[44px] items-center font-bold text-charcoal">
            Create an account
          </Link>
        </p>
      </Body>
      {notice && <ErrorNotice className="mx-5 mb-2">{notice}</ErrorNotice>}
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/party")}>Back</Button>
        <Button disabled={!canSubmit} onClick={() => submit()}>Sign in</Button>
      </Foot>
    </AppShell>
  )
}

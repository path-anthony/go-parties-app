import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { SignUpFields } from "@/components/go/SignUpFields"
import { EMPTY_SIGNUP, canSignUp, useSignUp } from "@/hooks/use-signup"

/* Customer sign up from the portal. The fields and the call live in
   SignUpFields and useSignUp, shared with the direct booking's account step. */

export default function PartySignUp() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_SIGNUP)
  const { signUp, busy, notice } = useSignUp()

  const submit = async () => {
    const customer = await signUp(values)
    if (customer) navigate("/party")
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>My party</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">New here.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Phone, email, a password. That's it.</p>
        <div className="mt-3.5">
          <SignUpFields values={values} onChange={setValues} onSubmit={submit} />
        </div>
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
        <Button disabled={!canSignUp(values) || busy} onClick={submit}>Create account</Button>
      </Foot>
    </AppShell>
  )
}

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { SignUpFields, SignUpNotice } from "@/components/go/SignUpFields"
import { EMPTY_SIGNUP, canSignUp, useSignUp } from "@/hooks/use-signup"

/* Customer sign up from the portal. The fields and the call live in
   SignUpFields and useSignUp, shared with the direct booking's sign-in
   step (where the name and the home address are required; here the home
   address is optional, S3).
   A taken phone or email shows under its field with a Sign in door that
   opens sign in with it filled in (Block S2). */

export default function PartySignUp() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_SIGNUP)
  const { signUp, busy, problem } = useSignUp()

  const submit = async () => {
    const customer = await signUp(values)
    if (customer) navigate("/party")
  }
  const signIn = () => navigate("/party/signin", { state: { returnTo: "/party", identifier: problem?.taken === "phone" ? values.phone.trim() : values.email.trim() } })

  return (
    <AppShell>
      <Body>
        <GoLabel>My party</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">New here.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Phone, email, a password. That's it.</p>
        <div className="mt-3.5">
          <SignUpFields values={values} problem={problem} onChange={setValues} onSubmit={submit} onSignIn={signIn} />
        </div>
        <p className="mt-3.5 text-small text-muted">
          Have an account?{" "}
          <Link to="/party/signin" className="inline-flex min-h-[44px] items-center font-bold text-charcoal">
            Sign in
          </Link>
        </p>
      </Body>
      <SignUpNotice problem={problem} onSignIn={signIn} className="mx-5 mb-2" />
      <Foot>
        <Button variant="ghost" onClick={() => navigate("/party")}>Back</Button>
        <Button disabled={!canSignUp(values) || busy} onClick={submit}>Create account</Button>
      </Foot>
    </AppShell>
  )
}

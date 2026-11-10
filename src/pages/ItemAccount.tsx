import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MetaCard } from "@/components/go/MetaCard"
import { CartItems } from "@/components/go/CartItems"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import { Reveal } from "@/components/go/DatePicker"
import { SignUpFields, SignUpNotice } from "@/components/go/SignUpFields"
import { labelForIso } from "@/lib/availability"
import { customerApi } from "@/lib/customerApi"
import { clockLabel } from "@/data/catalog"
import { missingRequired } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { EMPTY_SIGNUP, canSignUp, useSignUp, type SignUpValues } from "@/hooks/use-signup"
import { useAddressMode } from "@/hooks/use-address-mode"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct booking, "Sign in or create an account" (Block S3): the step after
   the date, for anyone not signed in. An account is always required to
   book (the admin can refuse a guest hold with 401 account-required, and
   the storefront is ready before that switch is on), so there is no guest
   path. Two choices: Sign in (email and password) or Create account (name,
   email, phone, password, home address). Either one signs the customer in
   and goes on to the event details with the cart, date and picks kept in
   the booking store. A customer already signed in never sees this screen.
   A sign-up that hits an existing account shows the red line under the
   field with "Sign in", which switches to the sign-in choice with the
   email filled in. A hold that answered account-required leaves its line
   in the booking store (accountNotice) and it shows here in red. */

type Choice = "signin" | "signup" | null

export default function ItemAccount() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer, ready, setCustomer } = useCustomer()
  const { signUp, busy: signingUp, problem, setProblem } = useSignUp()
  const pick = useAddressMode() === "pick"
  const [choice, setChoice] = useState<Choice>(null)
  const [values, setValues] = useState<SignUpValues>(EMPTY_SIGNUP)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  // Set the moment a sign in or sign up lands, so the signed-in guard below
  // does not race the navigation to the event step.
  const [leaving, setLeaving] = useState(false)

  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/account`} replace />
  const firstId = b.items[0].id
  if (!b.itemDate) return <Navigate to={`/item/${firstId}`} replace />
  if (b.items.some((i) => missingRequired(i).length > 0)) return <Navigate to={`/item/${firstId}/options`} replace />
  if (ready && customer && !leaving) return <Navigate to={`/item/${firstId}/who`} replace />

  const steps = checkoutSteps(b.optionsStep, false, b.tier?.tier ?? null)
  const iso = b.itemDate
  const clock = clockLabel(b.itemTime)
  const when = clock ? `${labelForIso(iso)}, ${clock}` : labelForIso(iso)
  const busy = signingUp || signingIn
  const next = `/item/${firstId}/who`

  const canContinue = !busy && (choice === "signin" ? identifier.trim() !== "" && password !== "" : choice === "signup" ? canSignUp(values, true, pick) : false)

  const removeItem = (rid: string) => b.setItems(b.items.filter((i) => i.id !== rid))

  // The sign-up hit an account: switch to sign in with what was typed.
  const toSignIn = () => {
    setIdentifier(problem?.taken === "phone" ? values.phone.trim() : values.email.trim())
    setProblem(null)
    setSignInError(null)
    setChoice("signin")
  }

  const notice = b.accountNotice

  const go = async () => {
    if (!canContinue) return
    b.set("accountNotice", null)
    if (choice === "signup") {
      const { customer: who, refusedHome } = await signUp(values)
      if (!who) {
        // The admin refused the home address: its line shows under the
        // field and the pick is dropped, so a new one must be made.
        if (refusedHome) setValues((v) => ({ ...v, homeVerified: null }))
        return
      }
      b.set("contactName", values.name.trim())
      setLeaving(true)
      navigate(next)
      return
    }
    setSigningIn(true)
    setSignInError(null)
    const result = await customerApi.login({ identifier: identifier.trim(), password })
    setSigningIn(false)
    if (!result.ok) {
      setSignInError(result.message)
      return
    }
    setCustomer(result.data.customer)
    setLeaving(true)
    navigate(next)
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>{b.items.length === 1 ? "Just this" : "Just these"} · Step {steps.account} of {steps.total}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Sign in or create an account</h1>
        <p className="mt-2 text-body text-charcoal-soft">Your booking lives in My party. Your cart and date stay right here.</p>
        <div className="mt-3.5">
          <MetaCard label="When" value={when} />
        </div>
        <div className="mt-2">
          <CartItems items={b.items} bundle={b.bundle} onRemove={removeItem} onConfigure={() => navigate(`/item/${firstId}/options`, { state: { from: `/item/${firstId}/account` } })} showTotal />
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Chip selected={choice === "signin"} sub="Email and password" onClick={() => setChoice("signin")}>
            Sign in
          </Chip>
          <Chip selected={choice === "signup"} sub="Name, email, phone, address" onClick={() => setChoice("signup")}>
            Create account
          </Chip>
        </div>
        {/* "Continue with Google" goes here (S3 follow-up): a third door
            under the two chips, signing in through the admin and landing
            on the event step like the others. Not built yet. */}
        <Reveal open={choice === "signin"} max="max-h-[20rem]" className="mt-3.5 pb-1">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void go()
            }}
          >
            <GoLabel className="mb-1.5 tracking-[.1em]">Email</GoLabel>
            <Input placeholder="you@email.com" autoComplete="username" inputMode="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <GoLabel className="mt-2.5 mb-1.5 tracking-[.1em]">Password</GoLabel>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="hidden" aria-hidden />
          </form>
        </Reveal>
        <Reveal open={choice === "signup"} max="max-h-[60rem]" className="mt-3.5 pb-1">
          <SignUpFields values={values} problem={problem} full onChange={setValues} onSubmit={go} onSignIn={toSignIn} onClearProblem={() => setProblem(null)} />
        </Reveal>
      </Body>
      {/* Refusals sit directly above the button. */}
      {notice && <ErrorNotice className="mx-5 mb-2">{notice}</ErrorNotice>}
      {choice === "signin" && signInError && <ErrorNotice className="mx-5 mb-2">{signInError}</ErrorNotice>}
      {choice === "signup" && <SignUpNotice problem={problem} onSignIn={toSignIn} className="mx-5 mb-2" />}
      <Foot>
        <Button variant="ghost" disabled={busy} onClick={() => navigate(`/item/${firstId}`)}>
          Back
        </Button>
        <Button disabled={!canContinue} onClick={() => void go()}>
          {busy ? (choice === "signin" ? "Signing in" : "Creating") : choice === "signin" ? "Sign in" : choice === "signup" ? "Create account" : "Continue"}
        </Button>
      </Foot>
    </AppShell>
  )
}

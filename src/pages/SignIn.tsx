import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"

/* Screen 2, Sign in. SCREENS.md: email input, Continue, OR divider, Google,
   Apple. All buttons continue; click-through build. */

export default function SignIn() {
  const navigate = useNavigate()
  const go = () => navigate("/home")

  return (
    <AppShell>
      <Body className="flex flex-col justify-center">
        <h1 className="text-hero text-charcoal">Welcome in.</h1>
        <p className="mt-2 text-body text-charcoal-soft">Save the build, watch the countdown, add stuff later.</p>
        <div className="mt-[22px]">
          <GoLabel className="mb-1.5 tracking-[.1em]">Email</GoLabel>
          <Input placeholder="you@email.com" />
        </div>
        <div className="mt-2.5">
          <Button className="w-full" onClick={go}>Continue</Button>
        </div>
        <div className="my-4 flex items-center gap-2.5 text-[11px] font-bold text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
          OR
        </div>
        <Button variant="ghost" className="mb-2 w-full" onClick={go}>Continue with Google</Button>
        <Button variant="ghost" className="w-full" onClick={go}>Continue with Apple</Button>
        <p className="mt-4 text-center text-small text-muted">
          No password. We text you a link.
          <br />
          Click-through build: any button works.
        </p>
      </Body>
    </AppShell>
  )
}

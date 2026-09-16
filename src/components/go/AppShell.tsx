import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Menu } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Wordmark } from "@/components/go/Wordmark"
import { Progress } from "@/components/go/Progress"
import { MenuSheet } from "@/components/go/MenuSheet"
import { BottomNav, type NavTab } from "@/components/go/BottomNav"
import { useBooking } from "@/state/booking"
import { useAsk } from "@/state/ask"

/* App frame: header with wordmark, progress and the menu button, fixed
   bottom nav, toast host. Mobile first at 390. Desktop centers at 560 with
   more air; no desktop layout. */

function activeTab(path: string): NavTab | null {
  if (path === "/" || path === "/home") return "home"
  if (path.startsWith("/party")) return "party"
  if (path === "/browse") return null
  return "book"
}

export function AppShell({ step, children }: { step?: number; children: React.ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { occ, pkg } = useBooking()
  const { openAsk } = useAsk()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  const onPick = (tab: NavTab) => {
    if (tab === "home") navigate("/home")
    if (tab === "party") navigate("/party")
    if (tab === "ask") openAsk("home")
    if (tab === "book") {
      if (!occ) {
        navigate("/home")
        toast({ title: "Pick an occasion first." })
        return
      }
      navigate(pkg ? "/book/package" : "/book/date")
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col pb-[calc(76px+env(safe-area-inset-bottom))] min-[900px]:max-w-[560px]">
      <div className="flex items-center justify-between px-5 pt-[18px]">
        <Wordmark onClick={() => navigate("/home")} />
        <div className="flex items-center gap-3">
          {step !== undefined && <Progress step={step} />}
          <button aria-label="Menu" className="-mr-1.5 flex size-11 items-center justify-center" onClick={() => setMenuOpen(true)}>
            <Menu className="size-[22px] stroke-charcoal" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {children}
      <BottomNav active={activeTab(pathname)} onPick={onPick} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toaster />
    </div>
  )
}

/* Screen body and footer, shared paddings from the reference */
export function Body({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rise flex-1 px-5 pt-[18px] pb-6 ${className}`}>{children}</div>
}

export function Foot({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2.5 px-5 pt-2 pb-3 [&>button]:flex-1">{children}</div>
}

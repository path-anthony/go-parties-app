import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/go/Header"
import { Progress } from "@/components/go/Progress"
import { MenuPanel } from "@/components/go/MenuPanel"
import { DateSheet } from "@/components/go/DateSheet"
import { PartyDrawer } from "@/components/go/PartyDrawer"
import { BottomNav, type NavTab } from "@/components/go/BottomNav"

/* App frame (Block S1): the store header on top (sticky, full width), the
   screen, and on a phone the text-only bottom bar. The store screens
   (Home, the shop, Ask GO) use the wide layout, up to 1280px; checkout and
   the portal keep their centered column. The header's height is published
   as --hdr so anything pinned under it can sit right below. */

function activeTab(path: string): NavTab | null {
  if (path === "/" || path === "/home") return "home"
  if (path.startsWith("/party")) return "party"
  if (path === "/ask") return "ask"
  if (path === "/browse" || path.startsWith("/item")) return "book"
  return null
}

/* bare: a page reached from a text or email link (the contract to sign,
   the crew gig): no header, menu or tab bar; the page brings its own
   letterhead. wide: the GO contract's document width on a desktop.
   layout="store": the wide store layout. */
export function AppShell({ step, bare, wide, layout, children }: { step?: number; bare?: boolean; wide?: boolean; layout?: "store"; children: React.ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bare) return
    const el = root.current
    const hdr = el?.querySelector("header")
    if (!el || !hdr) return
    const set = () => el.style.setProperty("--hdr", `${hdr.getBoundingClientRect().height}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(hdr)
    return () => ro.disconnect()
  }, [bare])

  const onPick = (tab: NavTab) => {
    if (tab === "home") navigate("/")
    if (tab === "party") navigate("/party")
    if (tab === "ask") navigate("/ask")
    if (tab === "book") navigate("/browse")
  }

  const column = layout === "store" ? "max-w-[1280px] px-4 min-[641px]:px-6" : wide ? "max-w-[860px]" : "max-w-[480px] min-[900px]:max-w-[560px]"

  return (
    <div ref={root} className={`flex min-h-svh flex-col ${bare ? "pb-[env(safe-area-inset-bottom)]" : "pb-[calc(60px+env(safe-area-inset-bottom))] min-[641px]:pb-0"}`}>
      {!bare && <Header />}
      <div className={`mx-auto flex w-full flex-1 flex-col ${column}`}>
        {step !== undefined && (
          <div className="flex justify-end px-5 pt-3">
            <Progress step={step} />
          </div>
        )}
        {children}
      </div>
      {!bare && <BottomNav active={activeTab(pathname)} onPick={onPick} />}
      {!bare && (
        <>
          <MenuPanel />
          <DateSheet />
          <PartyDrawer />
        </>
      )}
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

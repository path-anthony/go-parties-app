import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Logo } from "@/components/go/Logo"
import { SearchBox } from "@/components/go/SearchBox"
import { labelForIso } from "@/lib/availability"
import { useBooking } from "@/state/booking"
import { useStoreUi } from "@/state/store"
import { cn } from "@/lib/utils"

/* The store header (Block S1, names from S2). From 641px: the badge and
   wordmark, one search bar, a "Party date" button and the dark "Cart (n)"
   button, then one text row: Home, Shop all, Ask GO, and My party on the
   right (categories live on the Home tiles, the store sidebar and the
   menu). On a phone, row 1: badge, a "My party" text link, "Cart (n)" and
   the hamburger (the storefront's one icon, three lines, aria-label
   "Menu"); row 2 is the search bar full width; the bottom bar carries the
   tabs. Nothing scrolls sideways. */

const navLink = "min-h-[44px] border-b-2 py-2.5 text-[14px] font-semibold"

export function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const b = useBooking()
  const { setPartyOpen, setDateOpen, setMenuOpen } = useStoreUi()
  const count = b.items.reduce((n, i) => n + (i.quantity ?? 1), 0)
  const inStore = pathname === "/browse"
  const shopAll = inStore && !params.get("cat")

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2.5 px-4 py-2.5 min-[641px]:flex-nowrap min-[641px]:gap-4 min-[641px]:px-6">
        <div className="flex-1 min-w-0 min-[641px]:flex-none">
          <Logo />
        </div>
        <SearchBox className="order-3 basis-full min-[641px]:order-none min-[641px]:flex-1 min-[641px]:basis-auto" />
        <button
          className="hidden min-h-[44px] rounded-[10px] border border-line bg-white px-3 py-2 text-left text-[13px] font-semibold whitespace-nowrap text-charcoal min-[641px]:block"
          onClick={() => setDateOpen(true)}
        >
          <small className="block text-[10px] font-semibold tracking-[.08em] text-muted uppercase">Party date</small>
          {b.itemDate ? labelForIso(b.itemDate) : "Pick a date"}
        </button>
        <NavLink to="/party" className={({ isActive }) => cn("flex min-h-[44px] items-center px-1 text-[13px] font-semibold min-[641px]:hidden", isActive ? "text-charcoal underline underline-offset-4" : "text-charcoal-soft")}>
          My party
        </NavLink>
        <button className="min-h-[44px] rounded-[10px] bg-charcoal px-3.5 text-[13px] font-semibold whitespace-nowrap text-white" onClick={() => setPartyOpen(true)}>
          Cart <b className="font-extrabold text-orange">({count})</b>
        </button>
        <button aria-label="Menu" className="flex size-11 items-center justify-center rounded-[10px] text-charcoal min-[641px]:hidden" onClick={() => setMenuOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </div>
      <nav aria-label="Store" className="mx-auto hidden max-w-[1280px] flex-wrap gap-x-5 px-6 min-[641px]:flex">
        <NavLink to="/" end className={({ isActive }) => cn(navLink, isActive ? "border-orange text-charcoal" : "border-transparent text-charcoal-soft")}>
          Home
        </NavLink>
        <button className={cn(navLink, shopAll ? "border-orange text-charcoal" : "border-transparent text-charcoal-soft")} onClick={() => navigate("/browse")}>
          Shop all
        </button>
        <NavLink to="/ask" className={({ isActive }) => cn(navLink, isActive ? "border-orange text-charcoal" : "border-transparent text-charcoal-soft")}>
          Ask GO
        </NavLink>
        <NavLink to="/party" className={({ isActive }) => cn(navLink, "ml-auto", isActive ? "border-orange text-charcoal" : "border-transparent text-charcoal-soft")}>
          My party
        </NavLink>
      </nav>
    </header>
  )
}

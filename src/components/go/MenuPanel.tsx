import { useNavigate } from "react-router-dom"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { labelForIso } from "@/lib/availability"
import { useCatalog } from "@/lib/storeCatalog"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"
import { useStoreUi } from "@/state/store"

/* The phone menu (Block S1), opened by the header's "Menu" text button: a
   bottom panel listing Home, Ask GO, My party, the shop (All items and
   each category from the catalog), the party date, and the account doors. */

const row = "block w-full min-h-[48px] border-b border-line px-1 py-3 text-left text-[15px] font-semibold text-charcoal last:border-b-0"

export function MenuPanel() {
  const navigate = useNavigate()
  const { menuOpen, setMenuOpen, setDateOpen } = useStoreUi()
  const { customer, ready, logout } = useCustomer()
  const b = useBooking()
  const catalog = useCatalog()

  const go = (to: string) => {
    setMenuOpen(false)
    navigate(to)
  }

  return (
    <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-[480px] overflow-y-auto px-5 pb-6">
          <DrawerTitle className="flex items-center justify-between text-base font-extrabold text-charcoal">
            Menu
            <DrawerClose asChild>
              <button className="min-h-[44px] px-2 text-sm font-bold text-charcoal">Close</button>
            </DrawerClose>
          </DrawerTitle>
          <div className="mt-2">
            <button className={row} onClick={() => go("/")}>Home</button>
            <button className={row} onClick={() => go("/ask")}>Ask GO</button>
            <button className={row} onClick={() => go("/party")}>My party</button>
          </div>
          <small className="mt-4 block text-[10.5px] font-bold tracking-[.14em] text-taupe uppercase">Shop</small>
          <div className="mt-1">
            <button className={row} onClick={() => go("/browse")}>All items</button>
            {catalog.status === "ready" &&
              catalog.categories.map((c) => (
                <button key={c} className={row} onClick={() => go(`/browse?cat=${encodeURIComponent(c)}`)}>
                  {c}
                </button>
              ))}
          </div>
          <small className="mt-4 block text-[10.5px] font-bold tracking-[.14em] text-taupe uppercase">Party date</small>
          <button
            className={`${row} mt-1`}
            onClick={() => {
              setMenuOpen(false)
              setDateOpen(true)
            }}
          >
            {b.itemDate ? labelForIso(b.itemDate) : "Pick a date"}
          </button>
          <small className="mt-4 block text-[10.5px] font-bold tracking-[.14em] text-taupe uppercase">Account</small>
          <div className="mt-1">
            {ready && customer ? (
              <>
                <span className="block px-1 py-2 text-small text-charcoal-soft">Signed in as {customer.name ?? customer.email}</span>
                <button
                  className={row}
                  onClick={async () => {
                    await logout()
                    go("/party")
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button className={row} onClick={() => go("/party/signin")}>Sign in</button>
                <button className={row} onClick={() => go("/party/signup")}>Create account</button>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

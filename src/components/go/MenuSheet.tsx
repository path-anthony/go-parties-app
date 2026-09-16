import { useNavigate } from "react-router-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { useCustomer } from "@/state/customer"

/* The header menu. A bottom sheet (BRAND.md section 8, never a popup) with
   the account doors from any screen: sign in, create account, My party, and
   sign out when signed in. */
export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { customer, ready, logout } = useCustomer()

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-[480px] px-5 pb-6">
          <DrawerTitle className="flex items-center justify-between text-base font-extrabold text-charcoal">
            Menu
            <DrawerClose asChild>
              <button aria-label="Close" className="p-1">
                <X className="size-5 stroke-muted" strokeWidth={1.75} />
              </button>
            </DrawerClose>
          </DrawerTitle>
          {ready && customer && (
            <div className="mt-2.5 rounded-[12px] border border-line bg-cream px-3.5 py-3">
              <small className="block text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">Signed in as</small>
              <b className="mt-[3px] block text-sm text-charcoal">{customer.name ?? customer.email}</b>
              {customer.name && <span className="block text-small text-charcoal-soft">{customer.email}</span>}
            </div>
          )}
          <div className="mt-3 grid gap-2">
            <Button variant="ghost" onClick={() => go("/party")}>My party</Button>
            {ready && customer ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout()
                  go("/party")
                }}
              >
                Sign out
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => go("/party/signin")}>Sign in</Button>
                <Button variant="ghost" onClick={() => go("/party/signup")}>Create account</Button>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

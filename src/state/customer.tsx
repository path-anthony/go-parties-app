import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { customerApi, type Customer } from "@/lib/customerApi"

/* Who is signed in, if anyone. Checked once on load against the admin's
   customer_session cookie; ready flips true after that first answer so
   screens can tell "signed out" from "not checked yet". */

interface CustomerCtx {
  customer: Customer | null
  ready: boolean
  setCustomer: (customer: Customer | null) => void
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<CustomerCtx | null>(null)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const result = await customerApi.me()
    setCustomer(result.ok ? result.data.customer : null)
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<CustomerCtx>(
    () => ({
      customer,
      ready,
      setCustomer,
      refresh,
      logout: async () => {
        await customerApi.logout()
        setCustomer(null)
      },
    }),
    [customer, ready, refresh]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCustomer() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useCustomer outside CustomerProvider")
  return v
}

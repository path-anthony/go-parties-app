import { createContext, useContext, useState } from "react"

/* The store's overlays (Block S1), opened from the header, the menu, the
   grid and Ask GO: the Your party drawer, the party date sheet and the
   phone menu. One place so every screen opens the same one. */

interface StoreUi {
  partyOpen: boolean
  dateOpen: boolean
  menuOpen: boolean
  setPartyOpen: (v: boolean) => void
  setDateOpen: (v: boolean) => void
  setMenuOpen: (v: boolean) => void
}

const Ctx = createContext<StoreUi | null>(null)

export function StoreUiProvider({ children }: { children: React.ReactNode }) {
  const [partyOpen, setPartyOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  return <Ctx.Provider value={{ partyOpen, dateOpen, menuOpen, setPartyOpen, setDateOpen, setMenuOpen }}>{children}</Ctx.Provider>
}

export function useStoreUi() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useStoreUi outside StoreUiProvider")
  return v
}

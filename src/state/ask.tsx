import { createContext, useContext, useState } from "react"
import { AskSheet } from "@/components/go/AskSheet"
import type { AskContext } from "@/data/ask"

/* Owns the Ask GO sheet. Three doors only call openAsk; it never opens itself. */

const Ctx = createContext<{ openAsk: (ctx: AskContext) => void } | null>(null)

export function AskProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [ctx, setCtx] = useState<AskContext>("home")

  return (
    <Ctx.Provider value={{ openAsk: (c) => { setCtx(c); setOpen(true) } }}>
      {children}
      <AskSheet open={open} ctx={ctx} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  )
}

export function useAsk() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAsk outside AskProvider")
  return v
}

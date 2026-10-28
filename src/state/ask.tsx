import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ADMIN_API } from "@/lib/adminApi"
import { mockMode } from "@/lib/mock"
import type { AddonGroup } from "@/lib/addons"
import { useBooking, type DirectItem } from "@/state/booking"

/* Ask GO's conversation and the party it builds (Block S1). Lives above
   the routes so the chat survives a trip to the store and back. The
   backend call is unchanged: POST /api/recommend with the full history,
   the sub-occasion and the bot checks, answered with a message and, once
   ready, real items and a total. The items become the party (a list the
   customer can swap and remove); "Book this party" hands them to the
   booking store and the existing checkout. */

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  /* Set on the assistant turn that changed the party: the chat shows the
     short summary card after it. */
  changed?: boolean
}

/* An admin catalog row as /api/recommend returns it. price is a Prisma
   Decimal, which arrives as a string. */
export interface RecommendItem {
  id: string
  name: string
  category: string
  price: number | string | null
  priceUnit: string | null
  photoUrl?: string | null
  addonGroups?: AddonGroup[]
}

const priceOf = (item: RecommendItem): number | null => (item.price === null || item.price === undefined ? null : Number(item.price))

export const toDirectItem = (item: RecommendItem): DirectItem => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: priceOf(item),
  priceUnit: item.priceUnit ?? null,
  photoUrl: item.photoUrl ?? null,
  addonGroups: item.addonGroups,
})

interface AskApiResponse {
  ready: boolean
  message: string
  items?: RecommendItem[]
  total?: number
  suggestConcierge?: boolean
}

export const OPENER = "Tell me the party. I'll build it."
const FAILED = "That didn't go through. Try again, or text us."

interface AskState {
  messages: ChatMessage[]
  party: DirectItem[]
  loading: boolean
  error: string | null
  /* True once a recommendation has come back at least once. */
  ready: boolean
  suggestConcierge: boolean
  /* "GO just updated this" until the customer looks at the party. */
  updated: boolean
  startedAt: number
  hp: string
}

interface AskApi extends AskState {
  /* Open Ask GO on its page; with text, send it as the first message. */
  start: (text?: string) => void
  send: (text: string) => Promise<void>
  setHp: (v: string) => void
  swap: (index: number, item: DirectItem) => void
  remove: (index: number) => void
  seen: () => void
  reset: () => void
}

const INITIAL: AskState = { messages: [], party: [], loading: false, error: null, ready: false, suggestConcierge: false, updated: false, startedAt: 0, hp: "" }

const Ctx = createContext<AskApi | null>(null)

export function AskProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { subOcc } = useBooking()
  const [s, setS] = useState<AskState>(INITIAL)
  const ref = useRef(s)
  ref.current = s

  const send = useCallback(
    async (text: string) => {
      const t = text.trim()
      const cur = ref.current
      if (!t || cur.loading) return
      const started = cur.messages.length === 0 ? Date.now() : cur.startedAt
      const next: ChatMessage[] = [...cur.messages, { role: "user", content: t }]
      setS((p) => ({ ...p, messages: next, startedAt: started, loading: true, error: null }))
      try {
        const body = { subOcc, messages: next.map(({ role, content }) => ({ role, content })), hpField: cur.hp, formStartedAt: started }
        let data: AskApiResponse
        if (import.meta.env.DEV && mockMode("ask")) {
          data = await (await import("@/lib/askMock")).mockRecommend(body.messages)
        } else {
          const response = await fetch(`${ADMIN_API}/api/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
          if (!response.ok) throw new Error("Server error")
          data = await response.json()
        }
        setS((p) => ({
          ...p,
          loading: false,
          messages: [...p.messages, { role: "assistant", content: data.message, changed: data.ready }],
          ...(data.ready
            ? { party: (data.items ?? []).map(toDirectItem), ready: true, updated: true, suggestConcierge: data.suggestConcierge === true }
            : {}),
        }))
      } catch {
        setS((p) => ({ ...p, loading: false, error: FAILED }))
      }
    },
    [subOcc]
  )

  const api = useMemo<AskApi>(
    () => ({
      ...s,
      send,
      start: (text) => {
        setS({ ...INITIAL })
        navigate("/ask")
        if (text?.trim()) {
          // After the reset has landed, so the first message is the first.
          setTimeout(() => {
            ref.current = { ...INITIAL }
            send(text)
          }, 0)
        }
      },
      setHp: (hp) => setS((p) => ({ ...p, hp })),
      swap: (index, item) =>
        setS((p) => ({ ...p, party: p.party.map((x, i) => (i === index ? item : x)) })),
      remove: (index) => setS((p) => ({ ...p, party: p.party.filter((_, i) => i !== index) })),
      seen: () => setS((p) => (p.updated ? { ...p, updated: false } : p)),
      reset: () => setS({ ...INITIAL }),
    }),
    [s, send, navigate]
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useAsk() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAsk outside AskProvider")
  return v
}

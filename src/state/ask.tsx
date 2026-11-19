import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ADMIN_API } from "@/lib/adminApi"
import { contactFrom, contactInChat } from "@/lib/contact"
import { useCustomer } from "@/state/customer"
import { mockMode } from "@/lib/mock"
import { cleanSuggestions } from "@/lib/askSuggestions"
import type { AddonGroup } from "@/lib/addons"
import { useBooking, type DirectItem } from "@/state/booking"
import { cartCount, cartPrice, isPerGuest, qtyOf } from "@/lib/pricing"
import { useCatalog } from "@/lib/storeCatalog"

/* Ask GO's conversation (Block S1). Lives above the routes so the chat
   survives a trip to the store and back. Since Block FIX1 there is one cart:
   Ask GO reads and changes the booking store's items, the same the shop and
   the drawer use. Every message sends that cart and the guest count
   (S9-CONTRACT section 21); the reply's `cartAction` says whether it changed
   the cart (add, remove, replace: `items` is the whole cart after it) or not
   (none: a question about rain, power or space leaves the cart exactly as it
   is). Each reply that changed the cart keeps its own count and total, so an
   old card never redraws with later prices. */

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
  description?: string | null
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
  description: item.description ?? null,
  photoUrl: item.photoUrl ?? null,
  addonGroups: item.addonGroups,
})

type CartAction = "none" | "add" | "remove" | "replace"

/* An item in a reply: the full catalog row for one Ask GO picked, or just
   the id and quantity for one already in the cart (S9-CONTRACT section 21). */
type ReplyItem = Partial<RecommendItem> & { id: string; quantity?: number }

interface AskApiResponse {
  ready: boolean
  message: string
  /* Block FIX1: what the reply did to the cart. Missing on an older admin. */
  cartAction?: CartAction
  /* On add, remove or replace: the whole cart after the change. */
  items?: ReplyItem[]
  total?: number | null
  guestCount?: number | null
  guestCountNeeded?: boolean
  /* What the customer's own messages describe (section 21). */
  occasion?: string | null
  suggestConcierge?: boolean
  /* Block G1: tappable replies for the customer's next message. */
  suggestions?: string[]
}

export const OPENER = "Tell me the party. I'll build it."
const FAILED = "That didn't go through. Try again, or text us."

/* The cart as one reply left it: drawn under that reply and never redrawn
   with later prices (BUGS-AUDIT item 3). */
export interface CartSnapshot {
  count: number
  total: number
  /* A per-guest item waits on a guest count: the total leaves it out. */
  guestCountNeeded: boolean
}

interface AskState {
  messages: (ChatMessage & { cart?: CartSnapshot })[]
  loading: boolean
  error: string | null
  /* True once a reply has changed the cart at least once. */
  ready: boolean
  suggestConcierge: boolean
  /* Block G1: the latest reply's suggested replies, shown as buttons. They
     belong to that reply: sending clears them and the next reply replaces
     them. Empty means no buttons. */
  suggestions: string[]
  /* Block FIX1: the occasion this conversation is about, from the latest
     reply that named one. Sent with the next message and with "Talk to us
     instead"; never carried over from an earlier screen or conversation. */
  occasion: string | null
  /* "GO just updated this" until the customer looks at the cart. */
  updated: boolean
  startedAt: number
  hp: string
}

interface AskApi extends AskState {
  /* The one cart (Block FIX1): the booking store's items. */
  party: DirectItem[]
  /* Open Ask GO on its page; with text, send it as the first message. */
  start: (text?: string) => void
  send: (text: string) => Promise<void>
  setHp: (v: string) => void
  swap: (index: number, item: DirectItem) => void
  remove: (index: number) => void
  seen: () => void
  reset: () => void
}

const INITIAL: AskState = { messages: [], loading: false, error: null, ready: false, suggestConcierge: false, suggestions: [], occasion: null, updated: false, startedAt: 0, hp: "" }

const Ctx = createContext<AskApi | null>(null)

/* The cart as Ask GO is sent it: ids, a quantity above one, never for a
   per-guest item (the guest count prices it). */
const cartForAsk = (items: DirectItem[]) => items.map((i) => (!isPerGuest(i) && qtyOf(i) > 1 ? { itemId: i.id, quantity: qtyOf(i) } : { itemId: i.id }))

/* The reply's whole cart as cart items: an item already in the cart keeps
   its picks and details with the reply's quantity; a new one is the reply's
   catalog row, or the store's own catalog row when the reply sent only an id.
   Anything that cannot be named is left out. */
function mergeCart(reply: ReplyItem[], cart: DirectItem[], catalog: Map<string, DirectItem>): DirectItem[] {
  const have = new Map(cart.map((i) => [i.id, i]))
  return reply.flatMap((r) => {
    const base = have.get(r.id) ?? (r.name ? toDirectItem(r as RecommendItem) : catalog.get(r.id))
    if (!base) return []
    const quantity = typeof r.quantity === "number" && r.quantity >= 1 ? Math.floor(r.quantity) : (base.quantity ?? 1)
    return [{ ...base, quantity }]
  })
}

export function AskProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const b = useBooking()
  const { contactName, email, phone } = b
  const { customer } = useCustomer()
  const catalog = useCatalog()
  const [s, setS] = useState<AskState>(INITIAL)
  const ref = useRef(s)
  ref.current = s
  // The booking store as of this render, for the send below (it reads the
  // cart at the moment of sending and writes the reply's cart back).
  const bRef = useRef(b)
  const catRef = useRef(catalog)
  useEffect(() => {
    bRef.current = b
    catRef.current = catalog
  })

  const send = useCallback(
    async (text: string) => {
      const t = text.trim()
      const cur = ref.current
      if (!t || cur.loading) return
      const book = bRef.current
      // Block FIX1: a new conversation forgets the occasion remembered from
      // an earlier screen, so a stale one is never sent (BUGS-AUDIT item 5).
      if (cur.messages.length === 0) book.forgetOccasion()
      const started = cur.messages.length === 0 ? Date.now() : cur.startedAt
      const next: AskState["messages"] = [...cur.messages, { role: "user", content: t }]
      setS((p) => ({ ...p, messages: next, startedAt: started, loading: true, error: null, suggestions: [] }))
      try {
        // Block S9b: who is asking, when the customer is signed in or gave it.
        const who = { ...contactFrom(customer, { name: contactName, email, phone }), ...contactInChat(next) }
        const cart = book.placed ? [] : book.items
        const body = {
          // Only the occasion this conversation named; never a remembered one.
          subOcc: cur.messages.length === 0 ? null : cur.occasion,
          messages: next.map(({ role, content }) => ({ role, content })),
          // Block FIX1: the cart the customer has now, and the guest count.
          cart: cartForAsk(cart),
          ...(book.guestCount ? { guestCount: book.guestCount } : {}),
          hpField: cur.hp,
          formStartedAt: started,
          ...who,
        }
        let data: AskApiResponse
        if (import.meta.env.DEV && mockMode("ask")) {
          data = await (await import("@/lib/askMock")).mockRecommend(body)
        } else {
          const response = await fetch(`${ADMIN_API}/api/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
          })
          if (!response.ok) throw new Error("Server error")
          data = await response.json()
        }
        // The cart changes only when the reply says so. An older admin with
        // no cartAction replaced the cart on every ready reply.
        const action: CartAction = data.cartAction ?? (data.ready ? "replace" : "none")
        const changes = action !== "none" && Array.isArray(data.items)
        let snapshot: CartSnapshot | undefined
        if (changes) {
          const known = new Map<string, DirectItem>()
          const c = catRef.current
          if (c.status === "ready") for (const i of c.items) known.set(i.id, toDirectItem(i))
          const items = mergeCart(data.items ?? [], bRef.current.placed ? [] : bRef.current.items, known)
          bRef.current.setItems(items)
          // The guest count the customer gave in the chat fills an empty field.
          const g = typeof data.guestCount === "number" && data.guestCount >= 1 ? data.guestCount : null
          const guests = bRef.current.guestCount ?? g
          if (g !== null && bRef.current.guestCount === null) bRef.current.setGuests(g, false)
          const local = cartPrice(items, null, guests)
          snapshot = {
            count: cartCount(items),
            total: typeof data.total === "number" ? data.total : local.total,
            guestCountNeeded: data.guestCountNeeded === true || local.partial,
          }
        }
        setS((p) => ({
          ...p,
          loading: false,
          suggestions: cleanSuggestions(data.suggestions),
          occasion: typeof data.occasion === "string" && data.occasion.trim() ? data.occasion.trim() : p.occasion,
          messages: [...p.messages, { role: "assistant", content: data.message, changed: changes, ...(snapshot ? { cart: snapshot } : {}) }],
          ...(changes ? { ready: true, updated: true } : {}),
          suggestConcierge: data.suggestConcierge === true ? true : p.suggestConcierge,
        }))
      } catch {
        setS((p) => ({ ...p, loading: false, error: FAILED }))
      }
    },
    [customer, contactName, email, phone]
  )

  const api = useMemo<AskApi>(
    () => ({
      ...s,
      party: b.placed ? [] : b.items,
      send,
      start: (text) => {
        setS({ ...INITIAL })
        // A new conversation: the remembered occasion goes (the cart stays).
        b.forgetOccasion()
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
      swap: (index, item) => b.setItems(b.items.map((x, i) => (i === index ? { ...item, quantity: x.quantity } : x))),
      remove: (index) => b.setItems(b.items.filter((_, i) => i !== index)),
      seen: () => setS((p) => (p.updated ? { ...p, updated: false } : p)),
      reset: () => {
        setS({ ...INITIAL })
        b.forgetOccasion()
      },
    }),
    [s, send, navigate, b]
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useAsk() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAsk outside AskProvider")
  return v
}

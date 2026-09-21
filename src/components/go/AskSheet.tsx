import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Sparkle, X, Send } from "lucide-react"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { ASK, type AskContext } from "@/data/ask"
import { ADMIN_API } from "@/lib/adminApi"
import { customerApi } from "@/lib/customerApi"
import { needsConfig, type AddonGroup } from "@/lib/addons"
import { useToast } from "@/hooks/use-toast"
import { useBooking, type DirectItem } from "@/state/booking"

/* Ask GO. BRAND.md section 11: a knowledgeable crew member. It never opens
   itself: the dashed line on Home, "Ask about this package", the Ask tab.
   Home context: a real conversation with the admin API, full history sent
   each turn, until a final recommendation comes back. Package context:
   scripted, unchanged. */

interface AskSheetProps {
  open: boolean
  ctx: AskContext
  onClose: () => void
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

/* An admin catalog row as /api/recommend returns it. price is a Prisma
   Decimal, which arrives as a string. */
interface RecommendItem {
  id: string
  name: string
  category: string
  price: number | string | null
  priceUnit: string | null
  addonGroups?: AddonGroup[]
}

const priceOf = (item: RecommendItem): number | null => (item.price === null || item.price === undefined ? null : Number(item.price))

const toDirectItem = (item: RecommendItem): DirectItem => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: priceOf(item),
  priceUnit: item.priceUnit ?? null,
  addonGroups: item.addonGroups,
})

interface AskApiResponse {
  ready: boolean
  message: string
  items?: RecommendItem[]
  total?: number
}

interface FinalRecommendation {
  message: string
  items: RecommendItem[]
  total: number
}

const TEXTAREA_MAX_PX = 120

export function AskSheet({ open, ctx, onClose }: AskSheetProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { subOcc, pickItems, changeFor, set } = useBooking()
  const [asked, setAsked] = useState<number | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)
  const [switchNotice, setSwitchNotice] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalRec, setFinalRec] = useState<FinalRecommendation | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const script = ASK[ctx]

  useEffect(() => {
    if (open) {
      setAsked(null)
      setMessages([])
      setInput("")
      setError(null)
      setFinalRec(null)
      setPicked([])
      if (ctx === "home") {
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    }
  }, [open, ctx])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`
  }, [input])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, finalRec, error])

  const chip = asked !== null ? script.chips[asked] : null

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${ADMIN_API}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subOcc, messages: nextMessages }),
      })
      if (!response.ok) throw new Error("Server error")
      const data: AskApiResponse = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
      if (data.ready) {
        setFinalRec({ message: data.message, items: data.items ?? [], total: data.total ?? 0 })
        setPicked([])
      }
    } catch {
      setError("That didn't go through. Try again, or text us.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  /* The second door into booking: the checked items from a recommendation,
     booked together on one date, no package. The route carries the first id.
     The batch arrives all at once, so anything with add-on groups is
     configured in one options step, item by item, before the date. */
  const togglePick = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const justThese = () => {
    if (!finalRec) return
    const chosen = finalRec.items.filter((i) => picked.includes(i.id)).map(toDirectItem)
    if (chosen.length === 0) return
    pickItems(chosen)
    onClose()
    navigate(chosen.some(needsConfig) ? `/item/${chosen[0].id}/options` : `/item/${chosen[0].id}`)
  }

  /* Armed by the portal's Change item screen: swap an existing booking onto
     this item for the same date. A taken date is shown as the admin says it. */
  const switchTo = async (item: RecommendItem) => {
    if (!changeFor || switching) return
    setSwitching(true)
    setSwitchNotice(null)
    const result = await customerApi.changeItem(changeFor.bookingId, item.id)
    setSwitching(false)
    if (result.ok) {
      toast({ title: "Switched." })
      set("changeFor", null)
      onClose()
      navigate("/party")
      return
    }
    setSwitchNotice(result.message)
  }

  const tryAnother = () => {
    setMessages([])
    setInput("")
    setError(null)
    setFinalRec(null)
    setPicked([])
    textareaRef.current?.focus()
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto flex max-h-[70vh] w-full max-w-[480px] flex-col overflow-hidden px-5 pb-6">
          <DrawerTitle className="flex shrink-0 items-center justify-between text-base font-extrabold text-charcoal">
            <span className="flex items-center gap-2">
              <Sparkle className="size-[18px] stroke-orange" strokeWidth={1.75} />
              {script.title}
            </span>
            <DrawerClose asChild>
              <button aria-label="Close" className="p-1">
                <X className="size-5 stroke-muted" strokeWidth={1.75} />
              </button>
            </DrawerClose>
          </DrawerTitle>

          {ctx === "home" && (
            <>
              <div ref={scrollRef} className="mt-2.5 flex-1 space-y-2.5 overflow-y-auto">
                <div className="rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                  {script.open}
                </div>
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="ml-[30px] rounded-[12px] border border-orange bg-orange-tint px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                      {m.content}
                    </div>
                  ) : (
                    <div key={i} className="rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                      {m.content}
                    </div>
                  )
                )}
                {finalRec && finalRec.items.length > 0 && (
                  <div className="rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                    <div className="space-y-1.5">
                      {finalRec.items.map((item) => {
                        const price = priceOf(item)
                        const on = picked.includes(item.id)
                        return (
                          <div key={item.id} className="flex items-center gap-2.5 text-[12.5px]">
                            {!changeFor && (
                              <button
                                role="checkbox"
                                aria-checked={on}
                                aria-label={`Pick ${item.name}`}
                                className={`flex size-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] ${on ? "border-orange bg-orange-tint" : "border-line bg-white hover:border-charcoal"}`}
                                onClick={() => togglePick(item.id)}
                              >
                                {on && <Check className="size-3.5 stroke-orange" strokeWidth={2.5} />}
                              </button>
                            )}
                            <span className="min-w-0 flex-1">{item.name}</span>
                            {price !== null && <span className="flex-none">${price.toLocaleString()}</span>}
                            {changeFor && (
                              <button
                                className="flex-none rounded-[18px] border-[1.5px] border-line bg-white px-2.5 py-1 text-[11.5px] font-semibold text-charcoal hover:border-charcoal disabled:opacity-50"
                                disabled={switching}
                                onClick={() => switchTo(item)}
                              >
                                Switch to this
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {switchNotice && <p className="mt-2 border-t border-line pt-2 text-[12.5px]">{switchNotice}</p>}
                    <div className="mt-2 border-t border-line pt-2 font-bold">
                      Total: ${finalRec.total.toLocaleString()}
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-3 shrink-0">
                {finalRec ? (
                  <div className="flex gap-2">
                    <button
                      className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                      onClick={tryAnother}
                    >
                      Try another
                    </button>
                    {!changeFor && (
                      <button
                        className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal disabled:opacity-50"
                        disabled={picked.length === 0}
                        onClick={justThese}
                      >
                        {picked.length === 1 ? "Just this" : `Just these${picked.length > 1 ? ` (${picked.length})` : ""}`}
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe your party..."
                      disabled={loading}
                      className="max-h-[120px] flex-1 resize-none overflow-y-auto rounded-[12px] border border-line bg-white px-3.5 py-3 text-[13.5px] leading-normal placeholder-muted focus:border-charcoal focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="rounded-[12px] border border-line bg-white p-2.5 hover:border-charcoal disabled:opacity-50"
                      aria-label="Send"
                    >
                      <Send className="size-5 stroke-charcoal" strokeWidth={1.75} />
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {ctx === "pkg" && (
            <div className="flex-1 overflow-y-auto">
              <div className="mt-2.5 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                {script.open}
              </div>
              {chip && (
                <>
                  <div className="mt-2.5 ml-[30px] rounded-[12px] border border-orange bg-orange-tint px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                    {chip.q}
                  </div>
                  <div className="mt-2.5 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                    {chip.a}
                  </div>
                </>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {!chip &&
                  script.chips.map((c, i) => (
                    <button
                      key={c.q}
                      className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                      onClick={() => setAsked(i)}
                    >
                      {c.q}
                    </button>
                  ))}
                {chip && !chip.occ && (
                  <button
                    className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                    onClick={onClose}
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

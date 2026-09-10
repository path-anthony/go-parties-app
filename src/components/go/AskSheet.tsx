import { useEffect, useRef, useState } from "react"
import { Sparkle, X, Send } from "lucide-react"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { ASK, type AskContext } from "@/data/ask"
import { useBooking } from "@/state/booking"

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

interface RecommendItem {
  name: string
  price?: number
}

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
  const { subOcc } = useBooking()
  const [asked, setAsked] = useState<number | null>(null)
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
      const apiUrl = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3001"
      const response = await fetch(`${apiUrl}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subOcc, messages: nextMessages }),
      })
      if (!response.ok) throw new Error("Server error")
      const data: AskApiResponse = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
      if (data.ready) {
        setFinalRec({ message: data.message, items: data.items ?? [], total: data.total ?? 0 })
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

  const tryAnother = () => {
    setMessages([])
    setInput("")
    setError(null)
    setFinalRec(null)
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
                    <div className="space-y-1">
                      {finalRec.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12.5px]">
                          <span>{item.name}</span>
                          {item.price && <span>${item.price.toLocaleString()}</span>}
                        </div>
                      ))}
                    </div>
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
                    <button
                      className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                      onClick={onClose}
                    >
                      Build that
                    </button>
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

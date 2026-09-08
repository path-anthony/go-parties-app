import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkle, X, Send } from "lucide-react"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { ASK, type AskContext } from "@/data/ask"
import { useBooking } from "@/state/booking"

/* Ask GO. BRAND.md section 11: a knowledgeable crew member. It never opens
   itself: the dashed line on Home, "Ask about this package", the Ask tab.
   Home context: text input sends to admin API. Package context: scripted. */

interface AskSheetProps {
  open: boolean
  ctx: AskContext
  onClose: () => void
}

interface RecommendationResponse {
  description: string
  items: Array<{ name: string; price?: number }>
  total: number
}

export function AskSheet({ open, ctx, onClose }: AskSheetProps) {
  const navigate = useNavigate()
  const { jump } = useBooking()
  const [asked, setAsked] = useState<number | null>(null)
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const script = ASK[ctx]

  useEffect(() => {
    if (open) {
      setAsked(null)
      setUserInput("")
      setError(null)
      setRecommendation(null)
      if (ctx === "home") {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }, [open, ctx])

  const chip = asked !== null ? script.chips[asked] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    setLoading(true)
    setError(null)
    try {
      const apiUrl = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3001"
      const response = await fetch(`${apiUrl}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: userInput }),
      })
      if (!response.ok) throw new Error("Server error")
      const data: RecommendationResponse = await response.json()
      setRecommendation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to admin server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto max-h-[70vh] w-full max-w-[480px] overflow-auto px-5 pb-6">
          <DrawerTitle className="flex items-center justify-between text-base font-extrabold text-charcoal">
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

          {ctx === "home" && !recommendation ? (
            <>
              <div className="mt-2.5 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                {script.open}
              </div>
              <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Describe your party..."
                  disabled={loading}
                  className="flex-1 rounded-[12px] border border-line bg-white px-3.5 py-3 text-[13.5px] placeholder-muted focus:border-charcoal focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || loading}
                  className="rounded-[12px] border border-line bg-white p-2.5 hover:border-charcoal disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="size-5 stroke-charcoal" strokeWidth={1.75} />
                </button>
              </form>
              {error && (
                <div className="mt-3 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                  {error}
                </div>
              )}
            </>
          ) : null}

          {recommendation && (
            <>
              <div className="mt-2.5 ml-[30px] rounded-[12px] border border-orange bg-orange-tint px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                {userInput}
              </div>
              <div className="mt-2.5 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                <div>{recommendation.description}</div>
                {recommendation.items.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-line pt-2">
                    {recommendation.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12.5px]">
                        <span>{item.name}</span>
                        {item.price && <span>${item.price.toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 border-t border-line pt-2 font-bold">
                  Total: ${recommendation.total.toLocaleString()}
                </div>
              </div>
              <button
                className="mt-3 rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                onClick={() => {
                  setRecommendation(null)
                  setUserInput("")
                  inputRef.current?.focus()
                }}
              >
                Try another
              </button>
            </>
          )}

          {ctx === "pkg" && (
            <>
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
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

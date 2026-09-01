import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkle, X } from "lucide-react"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { ASK, type AskContext } from "@/data/ask"
import { useBooking } from "@/state/booking"

/* Ask GO. BRAND.md section 11: a knowledgeable crew member. It never opens
   itself: the dashed line on Home, "Ask about this package", the Ask tab.
   Answers are scripted in v1 and end with an action. */

interface AskSheetProps {
  open: boolean
  ctx: AskContext
  onClose: () => void
}

export function AskSheet({ open, ctx, onClose }: AskSheetProps) {
  const navigate = useNavigate()
  const { jump } = useBooking()
  const [asked, setAsked] = useState<number | null>(null)
  const script = ASK[ctx]

  useEffect(() => {
    if (open) setAsked(null)
  }, [open, ctx])

  const chip = asked !== null ? script.chips[asked] : null

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
            {chip && chip.occ && chip.id && (
              <button
                className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                onClick={() => {
                  onClose()
                  jump(chip.occ!, chip.id!)
                  navigate("/book/package")
                }}
              >
                Build that
              </button>
            )}
            {chip && !chip.occ && (
              <button
                className="rounded-[18px] border-[1.5px] border-line bg-white px-3 py-[9px] text-[12.5px] font-semibold text-charcoal hover:border-charcoal"
                onClick={onClose}
              >
                Got it
              </button>
            )}
          </div>
          <p className="mt-3 text-small text-muted">Scripted in this build. Live version runs on Claude.</p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

import { Calendar, Home, Sparkle, User } from "lucide-react"
import { cn } from "@/lib/utils"

/* Bottom nav. BRAND.md section 8: Home, Book, Ask, My party. Fixed, white,
   safe-area padded. Four tabs, never five. */

export type NavTab = "home" | "book" | "ask" | "party"

const TABS: { id: NavTab; label: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "book", label: "Book", Icon: Calendar },
  { id: "ask", label: "Ask", Icon: Sparkle },
  { id: "party", label: "My party", Icon: User },
]

export function BottomNav({ active, onPick }: { active: NavTab | null; onPick: (t: NavTab) => void }) {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-line bg-white pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-[480px] justify-around min-[900px]:max-w-[560px]">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={cn(
              "flex min-h-[44px] flex-col items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold",
              active === id ? "text-charcoal" : "text-muted"
            )}
            onClick={() => onPick(id)}
          >
            <Icon className="size-[22px]" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}

import { cn } from "@/lib/utils"

/* Bottom bar, phone only (Block S1): four text items, Home, Shop, Ask GO,
   My party. The active one carries an orange top rule. No icons. Hidden
   from 641px up, where the header's nav row takes over. */

export type NavTab = "home" | "book" | "ask" | "party"

const TABS: { id: NavTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "book", label: "Shop" },
  { id: "ask", label: "Ask GO" },
  { id: "party", label: "My party" },
]

export function BottomNav({ active, onPick }: { active: NavTab | null; onPick: (t: NavTab) => void }) {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] min-[641px]:hidden">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "-mt-px min-h-[52px] border-t-2 px-1 py-3.5 text-[13px] font-semibold",
            active === id ? "border-orange text-charcoal" : "border-transparent text-muted"
          )}
          onClick={() => onPick(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

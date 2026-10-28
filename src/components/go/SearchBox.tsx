import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCatalog, priceText } from "@/lib/storeCatalog"
import { useAsk } from "@/state/ask"

/* The header search (Block S1). From two characters: matching categories,
   then up to 5 matching items with their price; when nothing matches, one
   row that opens Ask GO with the text as its first message. Enter goes to
   the store filtered by the text. Font 16px so iOS Safari does not zoom. */

const MAX_ITEMS = 5

export function SearchBox({ className = "" }: { className?: string }) {
  const navigate = useNavigate()
  const { start } = useAsk()
  const catalog = useCatalog()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [])

  const needle = q.trim().toLowerCase()
  const live = open && needle.length >= 2
  const cats = live && catalog.status === "ready" ? catalog.categories.filter((c) => c.toLowerCase().includes(needle)) : []
  const items = live && catalog.status === "ready" ? catalog.items.filter((i) => i.name.toLowerCase().includes(needle)).slice(0, MAX_ITEMS) : []
  const nothing = live && catalog.status === "ready" && cats.length === 0 && items.length === 0

  const go = (to: string) => {
    setOpen(false)
    setQ("")
    navigate(to)
  }

  return (
    <div ref={box} className={`relative min-w-0 ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (needle) go(`/browse?q=${encodeURIComponent(q.trim())}`)
        }}
      >
        <input
          type="search"
          value={q}
          placeholder="Search bounce houses, DJs, photo booths"
          aria-label="Search the store"
          autoComplete="off"
          className="w-full min-h-[44px] rounded-[10px] border border-line bg-cream px-3.5 py-2.5 text-[16px] text-charcoal placeholder:text-muted focus:border-charcoal focus:outline-none"
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </form>
      {live && (cats.length > 0 || items.length > 0 || nothing) && (
        <div className="absolute right-0 left-0 z-30 mt-1.5 grid gap-0.5 rounded-[10px] border border-line bg-white p-1.5 shadow-float">
          {cats.map((c) => (
            <button key={c} className="flex min-h-[44px] items-center justify-between gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm text-charcoal hover:bg-cream" onClick={() => go(`/browse?cat=${encodeURIComponent(c)}`)}>
              {c}
              <small className="text-muted">Category</small>
            </button>
          ))}
          {items.map((i) => (
            <button key={i.id} className="flex min-h-[44px] items-center justify-between gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm text-charcoal hover:bg-cream" onClick={() => go(`/browse?q=${encodeURIComponent(i.name)}`)}>
              <span className="min-w-0 truncate">{i.name}</span>
              <small className="flex-none text-muted">{priceText(i.price, i.priceUnit)}</small>
            </button>
          ))}
          {nothing && (
            <button
              className="flex min-h-[44px] items-center justify-between gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm text-charcoal hover:bg-cream"
              onClick={() => {
                setOpen(false)
                setQ("")
                start(q.trim())
              }}
            >
              <span className="min-w-0 truncate">Ask GO about "{q.trim()}"</span>
              <small className="flex-none text-muted">Ask GO</small>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

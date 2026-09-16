import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { CategoryChips } from "@/components/go/CategoryChips"
import { publicItems, type PublicItem } from "@/lib/adminApi"
import { fmt } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Browse. The direct "just find one item" door, separate from the occasion
   flow and from Ask GO. Live search and category filter on the admin's
   public catalog, same shape as the admin's own Inventory filter. Tapping a
   bookable item starts the same direct booking every other door uses. */

const ALL = "All"

export default function Browse() {
  const navigate = useNavigate()
  const { pickItems } = useBooking()
  const [q, setQ] = useState("")
  const [category, setCategory] = useState(ALL)
  const [categories, setCategories] = useState<string[]>([])
  const [items, setItems] = useState<PublicItem[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      publicItems(q, category === ALL ? "" : category, controller.signal)
        .then((data) => {
          setItems(data.items)
          setCategories(data.categories)
          setFailed(false)
        })
        .catch((err) => {
          if ((err as { name?: string }).name !== "AbortError") setFailed(true)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q, category])

  const book = (item: PublicItem) => {
    pickItems([{ id: item.id, name: item.name, category: item.category, price: item.price, priceUnit: item.priceUnit }])
    navigate(`/item/${item.id}`)
  }

  const priceLine = (item: PublicItem) => {
    if (item.price !== null) return `${fmt(item.price)}${item.priceUnit ? ` ${item.priceUnit}` : ""}`
    return item.priceUnit || "Text us for a price"
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>Search</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Find one thing.</h1>
        <div className="mt-3.5">
          <Input
            type="search"
            placeholder="Bounce house, DJ, snow cones"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search the warehouse"
          />
        </div>
        <CategoryChips categories={[ALL, ...categories]} active={category} onPick={setCategory} />
        {failed && <p className="mt-2 text-body text-charcoal">That didn't go through. Try again, or text us.</p>}
        {!failed && items === null && <p className="mt-2 text-body text-muted">Checking the warehouse.</p>}
        {!failed && items && items.length === 0 && (
          <p className="mt-2 text-body text-charcoal-soft">Nothing by that name. Try another word, or Ask GO.</p>
        )}
        {!failed && items && items.length > 0 && (
          <>
            <p className="text-small text-muted">{items.length} items</p>
            <div className="mt-2 grid gap-2">
              {items.map((item) =>
                item.hasUnits ? (
                  <button
                    key={item.id}
                    className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3.5 text-left hover:border-charcoal"
                    onClick={() => book(item)}
                  >
                    <div className="min-w-0">
                      <b className="block text-sm text-charcoal">{item.name}</b>
                      <small className="block text-small text-muted">
                        {item.category} · {priceLine(item)}
                      </small>
                    </div>
                    <span className="flex-none text-[12.5px] font-bold text-charcoal">Book</span>
                  </button>
                ) : (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3.5 opacity-70">
                    <div className="min-w-0">
                      <b className="block text-sm text-charcoal">{item.name}</b>
                      <small className="block text-small text-muted">
                        {item.category} · {priceLine(item)}
                      </small>
                    </div>
                    <small className="flex-none text-right text-[11.5px] text-muted">Not online yet. Text us.</small>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </Body>
    </AppShell>
  )
}

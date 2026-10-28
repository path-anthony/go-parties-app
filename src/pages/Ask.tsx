import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/go/AppShell"
import { Thumb } from "@/components/go/Thumb"
import { Honeypot } from "@/components/go/Honeypot"
import { ConciergeOffer } from "@/components/go/ConciergeOffer"
import { cartTotal } from "@/components/go/CartItems"
import { labelForIso } from "@/lib/availability"
import { fmt } from "@/data/catalog"
import { customerApi } from "@/lib/customerApi"
import { needsConfig } from "@/lib/addons"
import { priceText, useCatalog, useOpenOn } from "@/lib/storeCatalog"
import { TIER_LINE, useRetainer } from "@/hooks/use-cart-tier"
import { fetchTier, type TierInfo } from "@/lib/tierApi"
import { tierInput } from "@/lib/directInput"
import type { ConciergeContext } from "@/lib/concierge"
import { useToast } from "@/hooks/use-toast"
import { useBooking, type DirectItem } from "@/state/booking"
import { OPENER, useAsk } from "@/state/ask"
import { cn } from "@/lib/utils"

/* Ask GO, the page (Block S1). Desktop: the chat on the left, Your party
   on the right. Phone and tablet (900px and under): a Chat / Your party
   switch pinned under the header, one pane at a time, and a dark bar
   pinned at the bottom with the total and the way across. The chat never
   renders the party; it shows a short summary card after each change.
   The party panel lists each item with Swap (up to 3 others in the same
   category, free on the date, not already in the party) and Remove, then
   the count, total, the retainer due today, a one-line tier note and
   "Book this party", which loads the items into Your party and opens
   checkout. The backend call and its caps are unchanged. */

const QUICK = ["Add something for the parents", "Keep it under $800", "It might rain"]

export default function Ask() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const ask = useAsk()
  const b = useBooking()
  const catalog = useCatalog()
  const open = useOpenOn(b.itemDate)
  const [pane, setPane] = useState<"chat" | "party">("chat")
  const [input, setInput] = useState("")
  const [swapOpen, setSwapOpen] = useState<number | null>(null)
  const [switching, setSwitching] = useState(false)
  const [switchNotice, setSwitchNotice] = useState<string | null>(null)
  const [tier, setTier] = useState<TierInfo | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const party = ask.party
  const total = cartTotal(party, null)
  const retainer = useRetainer(total, tier)
  const dayLabel = b.itemDate ? labelForIso(b.itemDate) : null
  const changeFor = b.changeFor

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [ask.messages.length, ask.loading, ask.error])

  // The tier note for the party as it stands: asked with the party date
  // once there is one; the admin alone decides it.
  const partyKey = party.map((i) => i.id).join(",")
  useEffect(() => {
    setTier(null)
    if (!b.itemDate || party.length === 0) return
    let live = true
    fetchTier(tierInput({ ...b, items: party, bundle: null })).then((r) => {
      if (live && r.ok) setTier(r.tier)
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyKey, b.itemDate, b.itemTime])

  const showParty = () => {
    setPane("party")
    ask.seen()
    window.scrollTo({ top: 0 })
  }

  const submit = (text: string) => {
    const t = text.trim()
    if (!t) return
    setInput("")
    ask.send(t)
  }

  const book = () => {
    if (party.length === 0) return
    // pickItems starts a fresh cart (and drops the date); the party date
    // picked in the header is put back so checkout opens on it.
    const iso = b.itemDate
    b.pickItems(party)
    if (iso) b.set("itemDate", iso)
    if (party.some(needsConfig)) {
      navigate(`/item/${party[0].id}/options`)
      return
    }
    navigate(`/item/${party[0].id}`)
  }

  /* Armed by the portal's Change item screen: swap an existing booking onto
     this item for the same date. A taken date is shown as the admin says it. */
  const switchTo = async (item: DirectItem) => {
    if (!changeFor || switching) return
    setSwitching(true)
    setSwitchNotice(null)
    const result = await customerApi.changeItem(changeFor.bookingId, item.id)
    setSwitching(false)
    if (result.ok) {
      toast({ title: "Switched." })
      b.set("changeFor", null)
      navigate("/party")
      return
    }
    setSwitchNotice(result.message)
  }

  const conciergeCtx: ConciergeContext = {
    source: "ask_go",
    occasion: b.subOcc,
    itemOrPackage: party.map((i) => i.name).join(", ") || null,
    eventDate: b.itemDate,
  }

  const swapsFor = (item: DirectItem): DirectItem[] => {
    if (catalog.status !== "ready") return []
    const free = (id: string) => (open.status === "ready" ? (open.open.get(id) ?? 0) > 0 : true)
    return catalog.items
      .filter((x) => x.category === item.category && x.id !== item.id && !party.some((p) => p.id === x.id) && free(x.id))
      .slice(0, 3)
      .map((x) => ({ id: x.id, name: x.name, category: x.category, price: x.price, priceUnit: x.priceUnit, photoUrl: x.photoUrl, addonGroups: x.addonGroups }))
  }

  const bubble = "max-w-[88%] rounded-[12px] px-3.5 py-3 text-[14.5px] leading-normal"
  const summary = (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-white px-3.5 py-3">
      <div>
        <b className="block text-sm text-charcoal">
          Your party: {party.length} {party.length === 1 ? "item" : "items"}, {fmt(total)}
        </b>
        <small className="text-small text-muted">Updated just now</small>
      </div>
      <Button variant="dark" size="sm" className="min-h-[40px] min-[901px]:hidden" onClick={showParty}>
        See it
      </Button>
    </div>
  )

  return (
    <AppShell layout="store">
      <div className="rise grid items-start gap-5 py-4 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] min-[901px]:py-6">
        <div role="group" aria-label="Ask GO" className="sticky top-[calc(var(--hdr,0px)+8px)] z-20 grid grid-cols-2 gap-1 rounded-[12px] border border-line bg-white p-1 min-[901px]:hidden">
          <button aria-pressed={pane === "chat"} className={cn("min-h-[44px] rounded-[9px] text-[14px] font-bold", pane === "chat" ? "bg-charcoal text-white" : "text-charcoal")} onClick={() => setPane("chat")}>
            Chat
          </button>
          <button aria-pressed={pane === "party"} className={cn("min-h-[44px] rounded-[9px] text-[14px] font-bold", pane === "party" ? "bg-charcoal text-white" : "text-charcoal")} onClick={showParty}>
            Your party ({party.length})
          </button>
        </div>

        <section aria-label="Conversation" className={cn("grid content-start gap-2.5 min-[901px]:pb-0", pane === "chat" ? "pb-24" : "hidden min-[901px]:grid")}>
          <div className={cn(bubble, "border border-line bg-white text-charcoal")}>{OPENER}</div>
          {ask.messages.map((m, i) => (
            <div key={i} className="grid gap-2.5">
              <div className={cn(bubble, m.role === "user" ? "justify-self-end border border-orange bg-orange-tint text-charcoal" : "border border-line bg-white text-charcoal")}>{m.content}</div>
              {m.changed && summary}
            </div>
          ))}
          {ask.loading && <div className={cn(bubble, "border border-line bg-white text-muted")}>Thinking.</div>}
          {ask.error && <div className={cn(bubble, "border border-line bg-white text-charcoal")}>{ask.error}</div>}
          {ask.suggestConcierge && !changeFor && (
            <div className="rounded-[12px] border border-line bg-white px-3.5 py-3 text-[14px] text-charcoal">
              <b className="block font-bold">Want to talk it through instead?</b>
              <span className="block text-[12.5px] text-charcoal-soft">Some parties are easier to plan with a real person. Grab 30 minutes with our team, on us.</span>
              <ConciergeOffer ctx={conciergeCtx} className="mt-2.5" startedAt={ask.startedAt} />
            </div>
          )}
          <div ref={endRef} />
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} className="min-h-[44px] rounded-full border-[1.5px] border-line min-[641px]:min-h-[36px] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-charcoal disabled:opacity-50" disabled={ask.loading} onClick={() => submit(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
          >
            <Honeypot value={ask.hp} onChange={ask.setHp} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ask.ready ? "Tell GO what to change" : "Describe your party"}
              aria-label="Message Ask GO"
              autoComplete="off"
              disabled={ask.loading}
              className="min-h-[48px] min-w-0 flex-1 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-3 text-[16px] text-charcoal placeholder:text-muted focus:border-charcoal focus:outline-none disabled:opacity-50"
            />
            <Button type="submit" variant="dark" className="min-h-[48px]" disabled={!input.trim() || ask.loading}>
              Send
            </Button>
          </form>
        </section>

        <section aria-label="Your party" className={cn("overflow-hidden rounded-[14px] border border-line bg-white", pane === "party" ? "pb-0" : "hidden min-[901px]:block")}>
          <div className="bg-charcoal px-4 py-3.5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-extrabold">Your party</h2>
                <small className="block text-[12.5px] text-[#CFC8C2]">
                  {dayLabel ?? "No date yet"}
                  {b.subOcc ? ` · ${b.subOcc}` : ""}
                </small>
              </div>
              {ask.updated && <span className="rounded-full bg-orange px-2.5 py-1 text-[11px] font-bold text-charcoal">GO just updated this</span>}
            </div>
          </div>
          <div className="px-4">
            {party.length === 0 && <p className="py-5 text-body text-charcoal-soft">Your party is empty. Ask GO or add items from the shop.</p>}
            {party.map((item, k) => (
              <div key={`${item.id}-${k}`} className="border-b border-line py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Thumb src={item.photoUrl} className="size-12 rounded-[8px]" />
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm text-charcoal">{item.name}</b>
                    <small className="block text-small text-muted">{item.category}</small>
                    <div className="mt-1 flex gap-3">
                      {changeFor ? (
                        <button className="min-h-[44px] text-[13px] font-bold text-charcoal underline underline-offset-2 disabled:opacity-50 min-[641px]:min-h-[36px]" disabled={switching} onClick={() => switchTo(item)}>
                          Switch to this
                        </button>
                      ) : (
                        <>
                          <button className="min-h-[44px] text-[13px] font-bold text-charcoal underline underline-offset-2 min-[641px]:min-h-[36px]" onClick={() => setSwapOpen(swapOpen === k ? null : k)}>
                            {swapOpen === k ? "Close" : "Swap"}
                          </button>
                          <button
                            className="min-h-[44px] text-[13px] font-bold text-charcoal underline underline-offset-2 min-[641px]:min-h-[36px]"
                            onClick={() => {
                              ask.remove(k)
                              setSwapOpen(null)
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="flex-none text-sm font-extrabold text-charcoal">{item.price !== null ? fmt(item.price) : ""}</span>
                </div>
                {swapOpen === k && (
                  <div className="mt-2 grid gap-1 rounded-[10px] bg-cream p-2">
                    <small className="px-1.5 text-[11px] font-bold tracking-[.1em] text-muted uppercase">{dayLabel ? `Also free ${dayLabel}` : "Also in this category"}</small>
                    {swapsFor(item).map((alt) => (
                      <button
                        key={alt.id}
                        className="flex min-h-[44px] items-center justify-between gap-2 rounded-[8px] bg-white px-2.5 py-2 text-left text-[13px] text-charcoal hover:bg-orange-tint"
                        onClick={() => {
                          ask.swap(k, alt)
                          setSwapOpen(null)
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">{alt.name}</span>
                        <span className="max-w-[45%] flex-none truncate text-right font-bold">{priceText(alt.price, alt.priceUnit)}</span>
                      </button>
                    ))}
                    {swapsFor(item).length === 0 && <small className="px-1.5 py-1 text-small text-muted">Nothing else in {item.category} is free that day.</small>}
                  </div>
                )}
              </div>
            ))}
            {switchNotice && <p className="py-2 text-small text-charcoal">{switchNotice}</p>}
          </div>
          {!changeFor && (
            <>
              <div className="px-4 pt-2">
                <button className="min-h-[44px] text-[13px] font-bold text-[#8A4E00]" onClick={() => navigate("/browse")}>
                  Add an item from the shop
                </button>
              </div>
              <div className="grid gap-1.5 border-t border-line px-4 py-3 text-sm text-charcoal">
                <div className="flex justify-between">
                  <span>
                    {party.length} {party.length === 1 ? "item" : "items"}
                  </span>
                  <span>{fmt(total)}</span>
                </div>
                {retainer.amount !== null && tier?.tier !== 3 && (
                  <div className="flex justify-between text-charcoal-soft">
                    <span>Due today to hold the date{retainer.percent !== null ? ` (${retainer.percent}%)` : ""}</span>
                    <span>{fmt(retainer.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
              <div className="px-4 pb-4">
                <p className="mb-3 text-small text-charcoal-soft">{tier ? TIER_LINE[tier.tier] : b.itemDate ? "Checking what checkout will ask for." : "Pick a party date to see what checkout asks for."}</p>
                <Button className="w-full" disabled={party.length === 0} onClick={book}>
                  Book this party
                </Button>
              </div>
            </>
          )}
        </section>
      </div>

      {party.length > 0 && !changeFor && (
        <div className="fixed right-0 bottom-[calc(52px+env(safe-area-inset-bottom))] left-0 z-30 flex items-center justify-between gap-3 bg-charcoal px-4 py-3 text-white min-[641px]:bottom-0 min-[901px]:hidden">
          {pane === "chat" ? (
            <>
              <div className="min-w-0">
                <b className="block truncate text-sm">
                  Your party: {party.length} {party.length === 1 ? "item" : "items"} · {fmt(total)}
                </b>
                <small className="block text-[12px] text-[#CFC8C2]">{ask.updated ? "GO just updated it" : dayLabel ? `Built for ${dayLabel}` : "Built from the catalog"}</small>
              </div>
              <Button size="sm" className="min-h-[44px] flex-none" onClick={showParty}>
                See your party
              </Button>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <b className="block text-sm">{fmt(total)} total</b>
                {retainer.amount !== null && tier?.tier !== 3 && <small className="block text-[12px] text-[#CFC8C2]">{fmt(retainer.amount)} today holds the date</small>}
              </div>
              <Button size="sm" className="min-h-[44px] flex-none" onClick={book}>
                Book this party
              </Button>
            </>
          )}
        </div>
      )}
    </AppShell>
  )
}

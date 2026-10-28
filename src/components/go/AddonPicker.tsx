import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/go/Chip"
import { cn } from "@/lib/utils"
import { LARGE_GROUP, deltaText, groupsOf, limitOf, modeOf, pickedIn, type AddonGroup, type Picks } from "@/lib/addons"

/* The add-on groups of one item: a label per group (its name, "Choose one"
   or "Choose any", "Choose up to N" when the admin set a limit, and whether
   it has to be answered), then its options. A "one" group works like radio
   buttons (tap another to switch; tapping the pick of an optional group
   clears it). A "many" group ticks several, and past the limit the rest
   are disabled. Always rendered under the item it belongs to.

   Up to LARGE_GROUP options are chips, same Chip pattern as times and
   guests. Above that a wall of chips stops being readable, so the group
   becomes a search input (the same Input as Browse) over a scrolling list,
   one row per option with its price change on the right, and the current
   pick named above the list so it's never lost to scrolling or a filter. */
export function AddonPicker({
  item,
  picks,
  onPick,
}: {
  item: { id: string; addonGroups?: AddonGroup[]; quantity?: number }
  picks: Picks
  onPick: (group: AddonGroup, addonId: string) => void
}) {
  const each = (item.quantity ?? 1) > 1
  const priceOf = (delta: number) => `${deltaText(delta)}${each && delta !== 0 ? " each" : ""}`

  return (
    <div className="space-y-3.5">
      {groupsOf(item).map((group) => {
        const picked = pickedIn(picks, group.id)
        const many = modeOf(group) === "many"
        const limit = limitOf(group)
        const full = limit !== null && picked.length >= limit
        const isOn = (id: string) => picked.includes(id)
        const locked = (id: string) => many && full && !isOn(id)
        const toggle = (addonId: string) => onPick(group, addonId)
        const how = many ? (limit !== null ? `Choose up to ${limit}` : "Choose any") : "Choose one"
        return (
          <div key={group.id} role="group" aria-label={group.name}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <small className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">{group.name}</small>
              <small className="text-[11px] font-medium text-muted">
                {how} · {group.required ? "Required" : "Optional"}
              </small>
            </div>
            {group.addons.length > LARGE_GROUP ? (
              <LargeGroup group={group} picked={picked} locked={locked} priceOf={priceOf} onToggle={toggle} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {group.addons.map((addon) => (
                  <Chip key={addon.id} selected={isOn(addon.id)} aria-pressed={isOn(addon.id)} disabled={locked(addon.id)} className="disabled:opacity-40" sub={priceOf(addon.priceDelta)} onClick={() => toggle(addon.id)}>
                    {addon.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LargeGroup({
  group,
  picked,
  locked,
  priceOf,
  onToggle,
}: {
  group: AddonGroup
  picked: string[]
  locked: (addonId: string) => boolean
  priceOf: (delta: number) => string
  onToggle: (addonId: string) => void
}) {
  const [q, setQ] = useState("")
  const needle = q.trim().toLowerCase()
  const shown = needle ? group.addons.filter((a) => a.name.toLowerCase().includes(needle)) : group.addons
  const current = group.addons.filter((a) => picked.includes(a.id))

  return (
    <div>
      <Input
        type="search"
        placeholder={`Search ${group.addons.length} options`}
        aria-label={`Search ${group.name}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <p className="mt-1.5 text-small text-charcoal-soft" aria-live="polite">
        {current.length > 0 ? (
          <>
            Picked: {current.map((c, i) => (
              <span key={c.id}>
                {i > 0 ? ", " : ""}
                <b className="font-bold text-charcoal">{c.name}</b> ({priceOf(c.priceDelta)})
              </span>
            ))}
          </>
        ) : (
          <span className="text-muted">Nothing picked yet.</span>
        )}
      </p>
      <div
        role="listbox"
        aria-label={`${group.name} options`}
        className="mt-1.5 max-h-[232px] overflow-y-auto overscroll-contain rounded-[12px] border-[1.5px] border-line bg-white"
      >
        {shown.map((addon) => {
          const on = picked.includes(addon.id)
          return (
            <button
              key={addon.id}
              role="option"
              aria-selected={on}
              disabled={locked(addon.id)}
              className={cn(
                "flex min-h-[44px] w-full items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 text-left text-[13px] last:border-b-0 disabled:opacity-40",
                on ? "bg-orange-tint" : "bg-white hover:bg-cream"
              )}
              onClick={() => onToggle(addon.id)}
            >
              <span className="flex min-w-0 items-center gap-2 font-bold text-charcoal">
                <input type="checkbox" checked={on} readOnly tabIndex={-1} aria-hidden="true" className="pointer-events-none size-4 flex-none accent-charcoal" />
                <span className="truncate">{addon.name}</span>
              </span>
              <span className="flex-none text-[11.5px] font-medium text-muted">{priceOf(addon.priceDelta)}</span>
            </button>
          )
        })}
        {shown.length === 0 && <p className="px-3.5 py-3 text-small text-charcoal-soft">Nothing by that name. Try another word.</p>}
      </div>
    </div>
  )
}

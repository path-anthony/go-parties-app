import { useState } from "react"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/go/Chip"
import { cn } from "@/lib/utils"
import { LARGE_GROUP, deltaText, groupsOf, type AddonGroup, type Picks } from "@/lib/addons"

/* The add-on groups of one item: a label per group (its name, and whether
   it has to be answered), then its options. One pick per group. Tapping the
   pick of an optional group clears it; a required group can only be
   switched. Always rendered under the item it belongs to, never on its own.

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
  onPick: (groupId: string, addonId: string | null) => void
}) {
  const each = (item.quantity ?? 1) > 1
  const priceOf = (delta: number) => `${deltaText(delta)}${each && delta !== 0 ? " each" : ""}`

  return (
    <div className="space-y-3.5">
      {groupsOf(item).map((group) => {
        const picked = picks[group.id]
        const toggle = (addonId: string) => onPick(group.id, picked === addonId && !group.required ? null : addonId)
        return (
          <div key={group.id} role="group" aria-label={group.name}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <small className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">{group.name}</small>
              <small className="text-[11px] font-medium text-muted">{group.required ? "Pick one" : "Optional"}</small>
            </div>
            {group.addons.length > LARGE_GROUP ? (
              <LargeGroup group={group} picked={picked} priceOf={priceOf} onToggle={toggle} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {group.addons.map((addon) => (
                  <Chip key={addon.id} selected={picked === addon.id} aria-pressed={picked === addon.id} sub={priceOf(addon.priceDelta)} onClick={() => toggle(addon.id)}>
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
  priceOf,
  onToggle,
}: {
  group: AddonGroup
  picked: string | undefined
  priceOf: (delta: number) => string
  onToggle: (addonId: string) => void
}) {
  const [q, setQ] = useState("")
  const needle = q.trim().toLowerCase()
  const shown = needle ? group.addons.filter((a) => a.name.toLowerCase().includes(needle)) : group.addons
  const current = group.addons.find((a) => a.id === picked)

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
        {current ? (
          <>
            Picked: <b className="font-bold text-charcoal">{current.name}</b>, {priceOf(current.priceDelta)}
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
          const on = picked === addon.id
          return (
            <button
              key={addon.id}
              role="option"
              aria-selected={on}
              className={cn(
                "flex min-h-[44px] w-full items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 text-left text-[13px] last:border-b-0",
                on ? "bg-orange-tint" : "bg-white hover:bg-cream"
              )}
              onClick={() => onToggle(addon.id)}
            >
              <span className="flex min-w-0 items-center gap-2 font-bold text-charcoal">
                <Check className={cn("size-4 flex-none stroke-charcoal", on ? "opacity-100" : "opacity-0")} strokeWidth={2.25} />
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

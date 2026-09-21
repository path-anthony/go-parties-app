import { Chip } from "@/components/go/Chip"
import { deltaText, groupsOf, type AddonGroup, type Picks } from "@/lib/addons"

/* The add-on groups of one item: a label per group (its name, and whether
   it has to be answered), then its options as chips, same Chip pattern as
   times and guests. One pick per group. Tapping the picked chip of an
   optional group clears it; a required group can only be switched. Always
   rendered under the item it belongs to, never on its own. */
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
  return (
    <div className="space-y-3.5">
      {groupsOf(item).map((group) => (
        <div key={group.id} role="group" aria-label={group.name}>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <small className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">{group.name}</small>
            <small className="text-[11px] font-medium text-muted">{group.required ? "Pick one" : "Optional"}</small>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {group.addons.map((addon) => {
              const on = picks[group.id] === addon.id
              return (
                <Chip
                  key={addon.id}
                  selected={on}
                  aria-pressed={on}
                  sub={`${deltaText(addon.priceDelta)}${each && addon.priceDelta !== 0 ? " each" : ""}`}
                  onClick={() => onPick(group.id, on && !group.required ? null : addon.id)}
                >
                  {addon.name}
                </Chip>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

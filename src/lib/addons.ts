/* Item add-ons, in the admin's own shape (GET /api/items/public,
   /api/recommend and /api/packages/public all send it on every item): a
   group is one question about one item ("Flavor", "Sidewalls") and its
   addons are the answers. One answer per group. A required group has to be
   answered before the item can be booked; an optional one can be skipped.
   priceDelta is per unit of the item: zero is a free choice, a negative
   number is a downgrade. Picks always live on the item they belong to, so
   nothing downstream can lose which item a choice was for. */

export interface AddonOption {
  id: string
  name: string
  priceDelta: number
}

export interface AddonGroup {
  id: string
  name: string
  required: boolean
  addons: AddonOption[]
}

/* A group with more options than this renders as a searchable, scrolling
   list instead of chips. Six is three rows of the two-column chips, which
   still reads at a glance; a seventh starts a wall. */
export const LARGE_GROUP = 6

/* group id to addon id */
export type Picks = Record<string, string>

interface Configurable {
  id: string
  addonGroups?: AddonGroup[]
  picks?: Picks
  quantity?: number
}

/* A group with no options can't be answered. The admin skips it rather than
   making the item unbookable, and so does the storefront. */
export const groupsOf = (item: Configurable): AddonGroup[] => (item.addonGroups ?? []).filter((g) => g.addons.length > 0)

export const needsConfig = (item: Configurable): boolean => groupsOf(item).length > 0

export const missingRequired = (item: Configurable, picks: Picks = item.picks ?? {}): AddonGroup[] =>
  groupsOf(item).filter((g) => g.required && !g.addons.some((a) => a.id === picks[g.id]))

/* What was picked, in the order the admin arranged the groups. */
export const pickedOf = (item: Configurable): { group: AddonGroup; addon: AddonOption }[] =>
  groupsOf(item).flatMap((group) => {
    const addon = group.addons.find((a) => a.id === item.picks?.[group.id])
    return addon ? [{ group, addon }] : []
  })

/* Per unit of the item. The admin charges it once per unit held. */
export const deltaOf = (item: Configurable): number => pickedOf(item).reduce((sum, p) => sum + p.addon.priceDelta, 0)

export const addonsTotal = (items: Configurable[]): number => items.reduce((sum, i) => sum + deltaOf(i) * (i.quantity ?? 1), 0)

/* The booking request's shape: { [itemId]: [addonId, ...] }. Null when
   nothing was picked, so the key is left out entirely. */
export function addonsPayload(items: Configurable[]): Record<string, string[]> | null {
  const out: Record<string, string[]> = {}
  for (const item of items) {
    const ids = pickedOf(item).map((p) => p.addon.id)
    if (ids.length > 0) out[item.id] = ids
  }
  return Object.keys(out).length > 0 ? out : null
}

/* "+$75", "-$25", "Included". */
export function deltaText(amount: number): string {
  if (amount === 0) return "Included"
  const cents = Number.isInteger(amount) ? 0 : 2
  const money = `$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: cents, maximumFractionDigits: cents })}`
  return amount > 0 ? `+${money}` : `-${money}`
}

/* Picks with one group changed; null clears the group. */
export function withPick(picks: Picks, groupId: string, addonId: string | null): Picks {
  const next = { ...picks }
  if (addonId === null) delete next[groupId]
  else next[groupId] = addonId
  return next
}

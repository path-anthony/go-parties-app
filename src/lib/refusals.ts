/* Block FIX1 (S9-CONTRACT section 19). A 409 "unavailable" names the items
   the date cannot hold, and `short` says how many were asked and how many are
   free. Each named item gets a sentence of its own, by item name: the
   admin's whole sentence when it names one item, else one written from
   `short` the same way ("Only 7 of Gold Chair are free that day (you asked
   for 8).") or "Mediterranean Spread is fully booked that day." The screens
   map names to the cart's items. Null when the refusal names none. */
export function refusedItems(data: unknown): Record<string, string> | null {
  const d = (data ?? {}) as { reason?: unknown; error?: unknown; unavailable?: unknown; short?: unknown }
  if (d.reason !== "unavailable" || !Array.isArray(d.unavailable)) return null
  const names = d.unavailable.filter((n): n is string => typeof n === "string" && n.trim() !== "")
  if (names.length === 0) return null
  const short = new Map(
    (Array.isArray(d.short) ? d.short : []).flatMap((x: unknown) => {
      const s = x as { name?: unknown; asked?: unknown; free?: unknown }
      return typeof s?.name === "string" && typeof s.asked === "number" && typeof s.free === "number" ? [[s.name, { asked: s.asked, free: s.free }] as const] : []
    })
  )
  const said = typeof d.error === "string" ? d.error.trim() : ""
  const out: Record<string, string> = {}
  for (const name of names) {
    const s = short.get(name)
    if (names.length === 1 && said) out[name] = said
    else if (s) out[name] = s.free === 0 ? `${name} is booked solid that day.` : `Only ${s.free} of ${name} ${s.free === 1 ? "is" : "are"} free that day (you asked for ${s.asked}).`
    else out[name] = `${name} is fully booked that day.`
  }
  return out
}

/* The cart's items keyed by id, from a refusal keyed by name. */
export function noticesById(byName: Record<string, string> | null | undefined, items: { id: string; name: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  if (!byName) return out
  for (const i of items) if (byName[i.name]) out[i.id] = byName[i.name]
  return out
}

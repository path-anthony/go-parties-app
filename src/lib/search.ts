/* Block FIX1 (BUGS-AUDIT item 9). The store's search: every word typed must
   appear, compared with spaces and hyphens taken out on both sides and a
   simple plural dropped, so "water slide" finds "Big Wave Single Lane
   Waterslide", "bounce-house" finds "Bounce House" and "chairs" finds
   "Gold Chair". The name, the category and the description are searched. */

const squash = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "")

/* "slides" to "slide", "glasses" to "glass", "parties" to "party". Short
   words are left alone ("gas", "bus"). */
function singular(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`
  if (w.length > 4 && /(ses|xes|zes|ches|shes)$/.test(w)) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1)
  return w
}

/* The words of a search, each squashed and made singular. */
export function searchWords(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,]+/)
    .map((w) => singular(w.replace(/[^a-z0-9]/g, "")))
    .filter((w) => w.length > 0)
}

export function matchesSearch(q: string, ...fields: (string | null | undefined)[]): boolean {
  const words = searchWords(q)
  if (words.length === 0) return true
  const hay = squash(fields.filter(Boolean).join(" "))
  // The whole phrase squashed ("waterslide") or every word on its own.
  const whole = singular(squash(q).replace(/[^a-z0-9]/g, ""))
  return (whole.length > 0 && hay.includes(whole)) || words.every((w) => hay.includes(w))
}

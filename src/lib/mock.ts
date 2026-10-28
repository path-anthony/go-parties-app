/* Dev-only mock switches. `?mock=<name>` on any page turns a mock on for the
   rest of the tab (sessionStorage); `?mock=off` turns every mock off. Three
   areas: the checkout (tier, hold and payment answers), the portal (a
   signed-in customer with bookings in every stage) and Ask GO (`?mock=ask`:
   a recommendation built from the real catalog, no AI call). Every caller checks
   `import.meta.env.DEV && mockMode(...)` inline, so a production build folds
   the branch away and never carries the fixtures. The names are listed in
   docs/SCREENS.md. */

const KEYS = { checkout: "go-mock-checkout", portal: "go-mock-portal", ask: "go-mock-ask" } as const
export type MockArea = keyof typeof KEYS

function readQuery() {
  try {
    const q = new URLSearchParams(window.location.search).get("mock")
    if (q === null) return
    if (q === "off") {
      sessionStorage.removeItem(KEYS.checkout)
      sessionStorage.removeItem(KEYS.portal)
      sessionStorage.removeItem(KEYS.ask)
      return
    }
    sessionStorage.setItem(q === "portal" ? KEYS.portal : q === "ask" ? KEYS.ask : KEYS.checkout, q)
  } catch {
    /* no storage, no mock */
  }
}

if (import.meta.env.DEV) readQuery()

export function mockMode(area: MockArea): string | null {
  if (!import.meta.env.DEV) return null
  try {
    return sessionStorage.getItem(KEYS[area])
  } catch {
    return null
  }
}

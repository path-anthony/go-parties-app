/* Dev-only mock switches. `?mock=<name>` on any page turns a mock on for the
   rest of the tab (sessionStorage); `?mock=off` turns every mock off. Three
   areas: the checkout (tier, hold and payment answers), the portal (a
   signed-in customer with bookings in every stage), Ask GO (`?mock=ask`:
   a recommendation built from the real catalog, no AI call) and the
   wedding details (`?mock=wedding`, Block S7: the portal mock plus three
   wedding bookings with the questionnaire in three states). Every caller checks
   `import.meta.env.DEV && mockMode(...)` inline, so a production build folds
   the branch away and never carries the fixtures. The names are listed in
   docs/SCREENS.md. */

const KEYS = { checkout: "go-mock-checkout", portal: "go-mock-portal", ask: "go-mock-ask", wedding: "go-mock-wedding" } as const
export type MockArea = keyof typeof KEYS

function readQuery() {
  try {
    const q = new URLSearchParams(window.location.search).get("mock")
    if (q === null) return
    if (q === "off") {
      sessionStorage.removeItem(KEYS.checkout)
      sessionStorage.removeItem(KEYS.portal)
      sessionStorage.removeItem(KEYS.ask)
      sessionStorage.removeItem(KEYS.wedding)
      return
    }
    if (q === "wedding") {
      // The questionnaire needs a signed-in customer with bookings.
      sessionStorage.setItem(KEYS.portal, "portal")
      sessionStorage.setItem(KEYS.wedding, q)
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

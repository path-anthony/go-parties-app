import type { Tier } from "@/lib/tierApi"

/* Step numbers for the direct checkout (Block S3 order). A batch that
   arrives with things to configure (Ask GO's checked items, a package)
   gets an options step first; Browse configures each item as it is added,
   so it has none. Then the date, then "Sign in or create an account" (a
   customer already signed in skips it, so it counts only when this
   checkout showed it: signedIn here means "skipped it"),
   then the event details, the contract for tier 2, and the retainer for
   tiers 1 and 2. Until the tier is known the count reads as tier 1. The
   concierge is not a step: it is a quiet option on the event screen. */
export function checkoutSteps(optionsStep: boolean, signedIn: boolean, tier: Tier | null = null) {
  const offset = optionsStep ? 1 : 0
  const accountStep = signedIn ? 0 : 1
  const contractStep = tier === 2 ? 1 : 0
  const payStep = tier === 3 ? 0 : 1
  return {
    options: 1,
    date: 1 + offset,
    account: 2 + offset,
    who: 2 + offset + accountStep,
    contract: 3 + offset + accountStep,
    pay: 3 + offset + accountStep + contractStep,
    total: 2 + offset + accountStep + contractStep + payStep,
  }
}

import type { Tier } from "@/lib/tierApi"

/* Step numbers for the direct checkout. A batch that arrives with things to
   configure (Ask GO's checked items, a package) gets an options step first;
   Browse configures each item as it is added, so it has none. Signed-in
   customers skip the account step. Tier 2 adds the contract after who (or
   after account, for a guest); tiers 1 and 2 end on the retainer. Until the
   tier is known the count reads as tier 1. The concierge is not a step: it
   is a quiet option on the last screen before the hold. */
export function checkoutSteps(optionsStep: boolean, signedIn: boolean, tier: Tier | null = null) {
  const offset = optionsStep ? 1 : 0
  const accountStep = signedIn ? 0 : 1
  const contractStep = tier === 2 ? 1 : 0
  const payStep = tier === 3 ? 0 : 1
  return {
    options: 1,
    date: 1 + offset,
    who: 2 + offset,
    account: 3 + offset,
    contract: 2 + offset + accountStep + 1,
    pay: 2 + offset + accountStep + contractStep + 1,
    total: 2 + offset + accountStep + contractStep + payStep,
  }
}

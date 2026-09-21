/* Step numbers for the direct checkout. A batch that arrives with things to
   configure (Ask GO's checked items, a package) gets an options step first;
   Browse configures each item as it is added, so it has none. Signed-in
   customers skip the account step. */
export function checkoutSteps(optionsStep: boolean, signedIn: boolean) {
  const offset = optionsStep ? 1 : 0
  return { options: 1, date: 1 + offset, who: 2 + offset, account: 3 + offset, total: (signedIn ? 2 : 3) + offset }
}

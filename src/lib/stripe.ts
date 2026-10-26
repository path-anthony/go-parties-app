import type { Stripe } from "@stripe/stripe-js"

/* Stripe on the storefront: only the publishable key (public by nature,
   VITE_STRIPE_PUBLISHABLE_KEY) and Stripe.js, loaded from js.stripe.com the
   first time a payment form is shown and never before ("pure" entry: nothing
   loads on pages that don't pay). A missing key means online payment is not
   available here and every payment screen says so instead of showing a form. */

export const STRIPE_KEY = ((import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? "").trim() || null

let promise: Promise<Stripe | null> | null = null

export function stripePromise(): Promise<Stripe | null> | null {
  if (!STRIPE_KEY) return null
  if (!promise) promise = import("@stripe/stripe-js/pure").then((m) => m.loadStripe(STRIPE_KEY))
  return promise
}

export const isMockSecret = (clientSecret: string) => clientSecret.startsWith("cs_test_mock")

/* Whether a payment offer can actually be taken on this page. */
export function paymentAvailable(offer: { clientSecret: string } | null | undefined): boolean {
  if (!offer || !offer.clientSecret) return false
  if (import.meta.env.DEV && isMockSecret(offer.clientSecret)) return true
  return STRIPE_KEY !== null
}

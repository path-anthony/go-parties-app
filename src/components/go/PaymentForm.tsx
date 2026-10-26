import { Suspense, lazy, useMemo } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { isMockSecret, stripePromise } from "@/lib/stripe"

/* The payment form: Stripe's Embedded Checkout mounted with the client
   secret the admin minted, so card details go to Stripe and the page stays
   GO's. onComplete fires when Stripe has taken the payment; the page then
   asks the admin whether it is paid (paymentApi), never assumes it. With no
   publishable key there is no form, and the page says so. In local dev a
   mock secret shows a stand-in with a Simulate button. */

const MockForm = import.meta.env.DEV ? lazy(() => import("@/lib/paymentMock").then((m) => ({ default: m.MockPaymentForm }))) : null

export function PaymentForm({ clientSecret, onComplete }: { clientSecret: string; onComplete: () => void }) {
  const options = useMemo(() => ({ clientSecret, onComplete }), [clientSecret, onComplete])
  if (import.meta.env.DEV && MockForm && isMockSecret(clientSecret)) {
    return (
      <Suspense fallback={null}>
        <MockForm clientSecret={clientSecret} onComplete={onComplete} />
      </Suspense>
    )
  }
  const stripe = stripePromise()
  if (!stripe) return null
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white">
      <EmbeddedCheckoutProvider stripe={stripe} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

export const PAYMENT_SOON = "Online payment is coming soon. GO will follow up to collect your retainer."
export const PAYMENT_SOON_BALANCE = "Online payment is coming soon. GO will follow up to collect your balance."

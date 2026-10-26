import { Button } from "@/components/ui/button"
import { markMockPaid } from "@/lib/paymentMockState"

/* The payment form's stand-in, DEV only (loaded lazily behind
   import.meta.env.DEV). A box where Stripe's form would be and one button,
   "Simulate payment", that marks the mock session paid and calls the same
   onComplete the real form would. The status poll then answers paid. */
export function MockPaymentForm({ clientSecret, onComplete }: { clientSecret: string; onComplete: () => void }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line bg-white px-4 py-5 text-center">
      <p className="text-sm text-charcoal-soft">Stripe's form would be here. This is the local mock.</p>
      <Button
        className="mt-3"
        onClick={() => {
          markMockPaid(clientSecret)
          onComplete()
        }}
      >
        Simulate payment
      </Button>
    </div>
  )
}

import type { CustomerBooking } from "@/lib/customerApi"
import { monthDay } from "@/lib/weddingApi"
import { cn } from "@/lib/utils"

/* Block S9b. What has been paid on a booking and what is still owed, as the
   admin sends it (`retainer`, `balance`, `total`): never computed here. A
   paid line reads "Paid Nov 2"; an unpaid one "Owed", the balance with its
   due date. Nothing is shown for a booking with no amounts yet (a request
   in review has none). */

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })

function Row({ label, amount, status, owed }: { label: string; amount: number; status: string; owed: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-small">
      <span className="text-charcoal-soft">
        {label} {usd(amount)}
      </span>
      <span className={cn("font-bold", owed ? "text-charcoal" : "text-good")}>{status}</span>
    </div>
  )
}

export function BookingMoney({ booking }: { booking: CustomerBooking }) {
  const { retainer, balance, total } = booking
  const rows = [
    retainer && retainer.amount !== null && retainer.amount > 0 ? (
      <Row key="r" label="Retainer" amount={retainer.amount} owed={!retainer.paid} status={retainer.paid ? (retainer.paidAt ? `Paid ${monthDay(retainer.paidAt)}` : "Paid") : "Owed"} />
    ) : null,
    balance && balance.amount !== null && (balance.amount > 0 || balance.paid) ? (
      <Row key="b" label="Balance" amount={balance.amount} owed={!balance.paid} status={balance.paid ? "Paid" : balance.dueDate ? `Owed, due ${monthDay(balance.dueDate)}` : "Owed"} />
    ) : null,
  ].filter(Boolean)
  if (rows.length === 0) return null
  return (
    <div className="mt-3 grid gap-1 rounded-[12px] border border-line bg-cream px-3.5 py-2.5">
      {typeof total === "number" && total > 0 && (
        <div className="flex items-baseline justify-between gap-3 text-small">
          <span className="text-charcoal-soft">Total</span>
          <b className="text-charcoal">{usd(total)}</b>
        </div>
      )}
      {rows}
    </div>
  )
}

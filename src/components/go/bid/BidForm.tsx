import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoLabel } from "@/components/go/GoLabel"
import { GigFacts } from "@/components/go/bid/GigFacts"
import { easternWhen, money, payLine } from "@/components/go/bid/format"
import { declineBid, loadBid, submitBid, type BidGig } from "@/lib/bidApi"

/* Before the gig is filled: the facts, the pay range, and the bid. One dollar
   amount for the whole gig (whole dollars, digits only), an optional short
   note, Submit bid (Update bid once one is in) and Decline, which asks first,
   inline, never a popup. The admin is the authority on every rule (the
   deadline, whether the gig is still open); a refusal is shown in our words,
   and one that means the gig moved on (bids closed, filled, not open) sends
   the page to the gig's real state instead of leaving a dead form. */

const NOTE_MAX = 200

export function BidForm({ token, gig, onGig }: { token: string; gig: BidGig; onGig: (g: BidGig) => void }) {
  const [amount, setAmount] = useState(gig.myBid ? String(gig.myBid.amount) : "")
  const [note, setNote] = useState(gig.myBid?.note ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const valid = /^\d{1,7}$/.test(amount) && Number(amount) >= 1
  const pay = payLine(gig.payRange)
  const closes = easternWhen(gig.deadlineAt)

  // The gig moved on under them: show what it is now.
  const refresh = async () => {
    const next = await loadBid(token)
    if (next.kind === "ok") onGig(next.gig)
  }

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const result = await submitBid(token, { amount: Number(amount), note: note.trim() || null })
    setBusy(false)
    if (result.ok) {
      onGig(result.data)
      return
    }
    setError(result.message)
    if (result.reason === "deadline-passed" || result.reason === "already-filled" || result.reason === "not-open") await refresh()
  }

  const decline = async () => {
    setBusy(true)
    setError(null)
    const result = await declineBid(token)
    setBusy(false)
    if (result.ok) {
      onGig(result.data)
      return
    }
    setConfirming(false)
    setError(result.message)
    if (result.reason === "deadline-passed" || result.reason === "already-filled" || result.reason === "not-open") await refresh()
  }

  return (
    <>
      <GigFacts gig={gig} />

      {pay && <p className="mt-3.5 text-body text-charcoal">{pay}</p>}
      {closes && <p className="mt-1 text-small text-muted">Bids close {closes}.</p>}

      {gig.myBid && (
        <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
          <b>Bid in: {money(gig.myBid.amount)}.</b> You can change it until bids close.
        </div>
      )}

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <GoLabel className="mb-1.5 tracking-[.1em]">{gig.myBid ? "Change your bid" : "Your bid"}</GoLabel>
        <label htmlFor="bid-amount" className="block text-sm font-bold text-charcoal">
          Dollars for the whole gig
        </label>
        <div className="relative mt-1.5">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-muted">
            $
          </span>
          <Input
            id="bid-amount"
            className="pl-7"
            inputMode="numeric"
            autoComplete="off"
            placeholder="250"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
          />
        </div>

        <label htmlFor="bid-note" className="mt-3.5 block text-sm font-bold text-charcoal">
          Note <span className="font-medium text-muted">(optional)</span>
        </label>
        <textarea
          id="bid-note"
          rows={3}
          maxLength={NOTE_MAX}
          className="mt-1.5 w-full resize-none rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-3 text-[15px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-charcoal"
          placeholder="Anything we should know"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
        />
        <p className="mt-1 text-right text-small text-muted">
          {note.length} of {NOTE_MAX}
        </p>

        {error && (
          <div role="alert" className="mt-3 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-2.5 [&>button]:flex-1">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirming((v) => !v)}>
            Decline
          </Button>
          <Button type="submit" disabled={!valid || busy}>
            {busy ? "Sending" : gig.myBid ? "Update bid" : "Submit bid"}
          </Button>
        </div>

        {confirming && (
          <div className="mt-3 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-sm text-charcoal">
            Decline this gig? You won't be able to bid on it after.
            <div className="mt-2.5 flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                Keep it
              </Button>
              <Button type="button" variant="dark" size="sm" onClick={decline} disabled={busy}>
                Decline it
              </Button>
            </div>
          </div>
        )}
      </form>
    </>
  )
}

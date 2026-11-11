import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import { GoLabel } from "@/components/go/GoLabel"
import { customerApi, type CancelAsked, type CancelInfo } from "@/lib/customerApi"

/* "Request to cancel" (Block S9b, S9-CONTRACT section 7). The admin no longer
   cancels a booking when the customer asks: it makes a request, and the
   booking, its date and its items stay as they are until staff approve or
   decline. This opens inline under the card (never a popup), reads what to
   show from GET .../cancel, and sends POST .../cancel.

   Nothing paid: a reason (asked for, not required) and "Send request".
   A retainer paid: "Are you sure?", the retainer terms the admin returns in
   full (its wording, never merged or trimmed), and a box to accept them,
   which the button waits for. No refund is promised anywhere here; the admin
   never refunds on its own. A request already waiting shows as that, with
   no form. A refusal is the red notice directly above the buttons (S2). */

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })

type Load = { kind: "loading" } | { kind: "ready"; info: CancelInfo } | { kind: "refused"; message: string }

export function CancelRequest({ bookingId, onClose, onAsked }: { bookingId: string; onClose: () => void; onAsked: (b: CancelAsked) => void }) {
  const [load, setLoad] = useState<Load>({ kind: "loading" })
  const [reason, setReason] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    customerApi.cancelInfo(bookingId).then((r) => {
      if (!live) return
      setLoad(r.ok ? { kind: "ready", info: r.data } : { kind: "refused", message: r.message })
    })
    return () => {
      live = false
    }
  }, [bookingId])

  const send = async (info: CancelInfo) => {
    if (busy || (info.termsRequired && !accepted)) return
    setBusy(true)
    setNotice(null)
    const result = await customerApi.requestCancel(bookingId, { reason: reason.trim(), acceptTerms: info.termsRequired && accepted })
    setBusy(false)
    if (result.ok) onAsked(result.data)
    else if (result.reason === "terms-required") {
      // The admin says terms are needed after all (a payment landed while
      // this was open): reload what to show and ask again.
      setAccepted(false)
      const again = await customerApi.cancelInfo(bookingId)
      if (again.ok) setLoad({ kind: "ready", info: again.data })
      setNotice(result.message)
    } else setNotice(result.message)
  }

  return (
    <div className="rounded-[12px] border border-line bg-cream px-3.5 py-3 text-sm text-charcoal">
      {load.kind === "loading" && <p className="text-muted">Checking your booking.</p>}
      {load.kind === "refused" && (
        <>
          <p>{load.message}</p>
          <Button variant="ghost" size="sm" className="mt-2.5" onClick={onClose}>
            Close
          </Button>
        </>
      )}
      {load.kind === "ready" && load.info.pendingRequest && (
        <>
          <p>
            <b>Cancellation requested.</b> We will contact you.
          </p>
          <Button variant="ghost" size="sm" className="mt-2.5" onClick={onClose}>
            Close
          </Button>
        </>
      )}
      {load.kind === "ready" && !load.info.pendingRequest && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send(load.info)
          }}
        >
          {load.info.termsRequired ? (
            <>
              <b className="block">Are you sure?</b>
              <p className="mt-1 text-charcoal-soft">
                You have paid {usd(load.info.paid)} on this booking. Read the terms below. Your booking stays in place until our team reviews your request.
              </p>
              {load.info.terms ? (
                <div className="mt-2.5 rounded-[10px] border border-line bg-white px-3 py-2.5">
                  <GoLabel>{load.info.terms.title}</GoLabel>
                  <p className="mt-1.5 max-h-56 overflow-y-auto text-small whitespace-pre-line text-charcoal-soft">{load.info.terms.text}</p>
                </div>
              ) : (
                <p className="mt-2.5 text-small text-charcoal-soft">The retainer terms are in your agreement with GO.</p>
              )}
              <label className="mt-2.5 flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-0.5 size-5 flex-none cursor-pointer accent-charcoal" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>I have read and accept these terms</span>
              </label>
            </>
          ) : (
            <>
              <b className="block">Request to cancel this booking?</b>
              <p className="mt-1 text-charcoal-soft">Your booking stays in place until our team reviews your request. We will email you the outcome.</p>
            </>
          )}
          <label htmlFor={`cancel-reason-${bookingId}`} className="mt-3 block text-small font-bold text-charcoal">
            Why are you cancelling? (optional)
          </label>
          <textarea
            id={`cancel-reason-${bookingId}`}
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 w-full resize-none rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-3 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-charcoal"
          />
          {notice && <ErrorNotice className="mt-2.5">{notice}</ErrorNotice>}
          <div className="mt-2.5 flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Keep it
            </Button>
            <Button type="submit" variant="dark" size="sm" disabled={busy || (load.info.termsRequired && !accepted)}>
              {busy ? "Sending" : "Send request"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

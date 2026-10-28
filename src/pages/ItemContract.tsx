import { useCallback, useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { GoContractSigner } from "@/components/go/contract/GoContractSigner"
import { EMPTY_SIGNATURE } from "@/components/go/contract/signature"
import { QUOTE_REASONS, bookDirect, type DirectReason } from "@/lib/adminApi"
import { directInput, tierInput } from "@/lib/directInput"
import { missingRequired } from "@/lib/addons"
import { checkoutSteps } from "@/lib/steps"
import { fetchTier } from "@/lib/tierApi"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct booking, the contract (tier 2 only). The GO contract built from
   this cart, read and signed on the form itself, then "Sign and hold my
   date" posts the hold with the signature. The quote is what was read: the
   admin refuses a hold whose quote expired or whose cart or contract changed
   (409 quote-expired, contract-changed, tier-changed), and then this screen
   fetches the tier again, drops the signature, says so, and shows the fresh
   contract; a cart that is no longer tier 2 goes back to who. Same guards as
   every checkout screen, plus the contact must be settled (the who screen
   for a signed-in customer, the account screen for a guest). */

type Notice = { reason: DirectReason | "error"; message: string }

export default function ItemContract() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer } = useCustomer()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  useEffect(() => {
    if (notice) document.querySelector("[role=alert]")?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [notice])

  const refreshTier = useCallback(async () => {
    setLoadError(null)
    const r = await fetchTier(tierInput(b))
    if (r.ok) b.set("tier", r.tier)
    else setLoadError(r.message)
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.items, b.bundle, b.itemDate, b.itemTime, b.occ, b.subOcc])

  useEffect(() => {
    if (!b.tier && b.itemDate && b.items.length > 0) void refreshTier()
  }, [b.tier, b.itemDate, b.items.length, refreshTier])

  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/contract`} replace />
  const firstId = b.items[0].id
  if (!b.itemDate) return <Navigate to={`/item/${firstId}`} replace />
  if (b.items.some((i) => missingRequired(i).length > 0)) return <Navigate to={`/item/${firstId}/options`} replace />
  const onFile = customer !== null
  if (!onFile && (b.contactName.trim() === "" || b.phone.trim() === "" || b.email.trim() === "")) return <Navigate to={`/item/${firstId}/who`} replace />
  if (b.tier && b.tier.tier !== 2) return <Navigate to={`/item/${firstId}/who`} replace />

  const steps = checkoutSteps(b.optionsStep, onFile, 2)
  const quote = b.tier?.contract ?? null

  const changed = async (message: string) => {
    b.set("signature", EMPTY_SIGNATURE)
    setNotice({ reason: "contract-changed", message })
    const r = await refreshTier()
    if (r.ok && r.tier.tier !== 2) navigate(`/item/${firstId}/who`)
  }

  const signAndHold = async () => {
    if (!ready || !quote) return
    setBusy(true)
    setNotice(null)
    try {
      // The hold carries the quote that was read and signed. The admin
      // rebuilds the contract from the cart at the hold and refuses a
      // changed or expired quote (409, handled below), so no second tier
      // call is made here: every tier call mints a new quote and counts
      // against the five booking calls an hour the admin allows per
      // connection, which is what left the live button doing nothing (S1.2).
      const result = await bookDirect(directInput(b, customer))
      if (result.ok) {
        if (result.kind === "review") {
          b.set("review", result.review)
          navigate("/item/review")
          return
        }
        b.set("direct", result.booking)
        b.set("payment", result.booking.payment ?? null)
        navigate("/item/pay")
        return
      }
      if (QUOTE_REASONS.includes(result.reason)) {
        await changed(result.message)
        return
      }
      setNotice({ reason: result.reason, message: result.message })
    } catch {
      setNotice({ reason: "error", message: "That didn't go through. Try again, or text us." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell wide>
      <Body>
        <GoLabel>
          {b.items.length === 1 ? "Just this" : "Just these"} · Step {steps.contract} of {steps.total}
        </GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Your contract</h1>
        <p className="mt-2 text-body text-charcoal-soft">Read it all the way through, then sign on the form. Signing holds the date.</p>
        {quote ? (
          <GoContractSigner doc={quote.document} value={b.signature} onChange={(v) => b.set("signature", v)} busy={busy} onReadyChange={setReady} className="mt-4" />
        ) : loadError ? (
          <div className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {loadError}
            <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={() => void refreshTier()}>
              Try again
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-body text-muted">Preparing your contract.</p>
        )}
      </Body>
      {/* The notice sits by the button, where the customer is after signing. */}
        {notice && (
        <div role="alert" className="mx-5 mb-2 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
          {notice.message}
          {notice.reason === "unavailable" && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2.5 block"
              onClick={() => {
                b.set("itemDate", null)
                navigate(`/item/${firstId}`)
              }}
            >
              Pick another date
            </Button>
          )}
        </div>
      )}
      <Foot>
        <Button variant="ghost" disabled={busy} onClick={() => navigate(onFile ? `/item/${firstId}/who` : `/item/${firstId}/account`)}>
          Back
        </Button>
        <Button disabled={!ready || !quote || busy} onClick={signAndHold}>
          {busy ? "Signing" : "Sign and hold my date"}
        </Button>
      </Foot>
    </AppShell>
  )
}

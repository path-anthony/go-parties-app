import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { labelForIso } from "@/lib/availability"
import { bookDirect, type DirectReason } from "@/lib/adminApi"
import { useBooking } from "@/state/booking"

/* Direct item booking, step 2 of 2. Name and contact, then one POST that
   locks a unit on the admin side. No payment in this pass: depositPaid stays
   false and the contract and deposit link follow by text. A 409 from the race
   (someone took the last unit between the check and this tap) is shown as the
   server says it, with a way back to the calendar, never a generic error. */

type Notice = { reason: DirectReason; message: string }

export default function ItemWho() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  if (!b.item || b.item.id !== id) return <Navigate to="/home" replace />
  if (!b.itemDate) return <Navigate to={`/item/${b.item.id}`} replace />
  const item = b.item
  const iso = b.itemDate

  const canSubmit = b.contactName.trim() !== "" && b.contact.trim() !== "" && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setNotice(null)
    try {
      const result = await bookDirect({
        itemId: item.id,
        eventDate: iso,
        customerName: b.contactName.trim(),
        contact: b.contact.trim(),
      })
      if (result.ok) {
        b.set("direct", result.booking)
        navigate("/item/held")
        return
      }
      setNotice({ reason: result.reason, message: result.message })
    } catch {
      setNotice({ reason: "error", message: "That didn't go through. Try again, or text us." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <Body>
        <GoLabel>Just this · Step 2 of 2</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Who's booking?</h1>
        <p className="mt-2 text-body text-charcoal-soft">Name and a number or email. That's it.</p>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <MetaCard label="What" value={item.name} />
          <MetaCard label="When" value={labelForIso(iso)} />
        </div>
        <div className="mt-3.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
          <Input
            placeholder="Sarah Lin"
            autoComplete="name"
            value={b.contactName}
            onChange={(e) => b.set("contactName", e.target.value)}
          />
        </div>
        <div className="mt-2.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Phone or email</GoLabel>
          <Input
            placeholder="860 555 0134 or you@email.com"
            autoComplete="on"
            inputMode="email"
            value={b.contact}
            onChange={(e) => b.set("contact", e.target.value)}
          />
        </div>
        {notice && (
          <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {notice.message}
            {notice.reason === "unavailable" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2.5 block"
                onClick={() => {
                  b.set("itemDate", null)
                  navigate(`/item/${item.id}`)
                }}
              >
                Pick another date
              </Button>
            )}
          </div>
        )}
        <p className="mt-2.5 text-small text-muted">Nothing to pay right now. Contract and deposit link come by text.</p>
      </Body>
      <Foot>
        <Button variant="ghost" onClick={() => navigate(`/item/${item.id}`)}>Back</Button>
        <Button disabled={!canSubmit} onClick={submit}>Hold my date</Button>
      </Foot>
    </AppShell>
  )
}

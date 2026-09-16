import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { CartItems } from "@/components/go/CartItems"
import { labelForIso } from "@/lib/availability"
import { bookDirect, type DirectReason } from "@/lib/adminApi"
import { directInput } from "@/lib/directInput"
import { itemClock as clockFor } from "@/data/catalog"
import { useBooking } from "@/state/booking"
import { useCustomer } from "@/state/customer"

/* Direct item booking, step 2. Name, phone and email are the hard line,
   always required, never skippable. Signed in, they come from the account
   and aren't asked again (only a name, if the account has none yet), and
   this is the last step: "Hold my date" posts here. A guest goes on to the
   account step (make one, or continue as a guest) before the date is held.
   Address is plain text, no validation service, skippable with the "Add the
   address later" switch. A 409 from the race (someone took the last unit
   between the check and this tap) is shown as the server says it, with a
   way back to the calendar, never a generic error. */

type Notice = { reason: DirectReason; message: string }

export default function ItemWho() {
  const navigate = useNavigate()
  const { id } = useParams()
  const b = useBooking()
  const { customer } = useCustomer()
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  if (b.items.length === 0) return <Navigate to="/browse" replace />
  if (b.items[0].id !== id) return <Navigate to={`/item/${b.items[0].id}/who`} replace />
  if (!b.itemDate) return <Navigate to={`/item/${b.items[0].id}`} replace />
  const items = b.items
  const firstId = items[0].id
  const iso = b.itemDate

  const onFile = customer !== null
  const needsName = !customer?.name
  const addressSettled = b.address.trim() !== "" || b.addressLater
  const contactSettled = onFile ? true : b.phone.trim() !== "" && b.email.trim() !== ""
  const nameSettled = needsName ? b.contactName.trim() !== "" : true
  const canSubmit = nameSettled && contactSettled && addressSettled && !submitting

  const steps = onFile ? 2 : 3

  const removeItem = (rid: string) => b.setItems(items.filter((i) => i.id !== rid))

  const submit = async () => {
    if (!canSubmit) return
    if (!onFile) {
      navigate(`/item/${firstId}/account`)
      return
    }
    setSubmitting(true)
    setNotice(null)
    try {
      const result = await bookDirect(directInput(b, customer))
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

  const clock = clockFor(b.itemTime)
  const when = clock ? `${labelForIso(iso)}, ${clock}` : labelForIso(iso)

  return (
    <AppShell>
      <Body>
        <GoLabel>{items.length === 1 ? "Just this" : "Just these"} · Step 2 of {steps}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Who's booking?</h1>
        <p className="mt-2 text-body text-charcoal-soft">
          {onFile ? "We've got your details. Just the address." : "Name, phone, and email. That's it."}
        </p>
        <div className="mt-3.5">
          <MetaCard label="When" value={when} />
        </div>
        <div className="mt-2">
          <CartItems items={items} bundle={b.bundle} onRemove={removeItem} showTotal={items.length > 1 || b.bundle !== null} />
        </div>
        {onFile && customer && (
          <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5">
            <small className="block text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">Booking as</small>
            {customer.name && <b className="mt-[3px] block text-sm text-charcoal">{customer.name}</b>}
            <span className="block text-small text-charcoal-soft">{customer.phone}</span>
            <span className="block text-small text-charcoal-soft">{customer.email}</span>
          </div>
        )}
        {needsName && (
          <div className="mt-3.5">
            <GoLabel className="mb-1.5 tracking-[.1em]">Name</GoLabel>
            <Input
              placeholder="Sarah Lin"
              autoComplete="name"
              value={b.contactName}
              onChange={(e) => b.set("contactName", e.target.value)}
            />
          </div>
        )}
        {!onFile && (
          <>
            <div className="mt-2.5">
              <GoLabel className="mb-1.5 tracking-[.1em]">Phone</GoLabel>
              <Input
                placeholder="860 555 0134"
                autoComplete="tel"
                inputMode="tel"
                value={b.phone}
                onChange={(e) => b.set("phone", e.target.value)}
              />
            </div>
            <div className="mt-2.5">
              <GoLabel className="mb-1.5 tracking-[.1em]">Email</GoLabel>
              <Input
                placeholder="you@email.com"
                autoComplete="email"
                inputMode="email"
                value={b.email}
                onChange={(e) => b.set("email", e.target.value)}
              />
            </div>
          </>
        )}
        <div className="mt-2.5">
          <GoLabel className="mb-1.5 tracking-[.1em]">Address</GoLabel>
          <Input
            placeholder="14 Maple Ln, Farmington"
            autoComplete="street-address"
            value={b.address}
            disabled={b.addressLater}
            onChange={(e) => b.set("address", e.target.value)}
          />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-[14px] border border-line bg-white px-3.5 py-[13px] text-sm font-semibold text-charcoal">
          <div>
            Add the address later
            <small className="block text-[11.5px] font-medium text-muted">We'll text you for it.</small>
          </div>
          <Switch
            checked={b.addressLater}
            onCheckedChange={(v) => {
              b.set("addressLater", v)
              if (v) b.set("address", "")
            }}
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
                  navigate(`/item/${firstId}`)
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
        <Button variant="ghost" onClick={() => navigate(`/item/${firstId}`)}>Back</Button>
        <Button disabled={!canSubmit} onClick={submit}>{onFile ? "Hold my date" : "Next"}</Button>
      </Foot>
    </AppShell>
  )
}

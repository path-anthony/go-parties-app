import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import type { CustomerBooking } from "@/lib/customerApi"
import { weddingApi, weddingDueText, weddingStatusText, type WeddingDetails } from "@/lib/weddingApi"
import { cn } from "@/lib/utils"

/* The "Wedding details" row on a My party booking card (Block S7). Asks
   the booking's wedding details once; a 404 (not a wedding) shows nothing.
   Status ("Not started", "6 of 10 done", "Submitted Oct 2"), the due date
   ("Due Oct 14"), and the door to the questionnaire. Block S9a: until it is
   sent the heading says so, "Your wedding details form is waiting.", the
   same words as the confirmation screen after payment. Due within 14 days
   and not yet sent: the red error style with "Due in N days". */

export function WeddingRow({ booking }: { booking: CustomerBooking }) {
  const navigate = useNavigate()
  const [details, setDetails] = useState<WeddingDetails | null>(null)

  useEffect(() => {
    let live = true
    weddingApi.get(booking.id).then((r) => {
      if (live && r.ok) setDetails(r.data)
    })
    return () => {
      live = false
    }
  }, [booking.id])

  if (!details) return null
  const due = weddingDueText(details)
  const submitted = details.status === "submitted"
  const urgent = due?.urgent ?? false

  return (
    <div className={cn("mt-3 rounded-[12px] px-3.5 py-3", urgent ? "border-l-4 border-error bg-error-tint" : "border border-line bg-cream")}>
      <b className={cn("block text-sm", urgent ? "text-error" : "text-charcoal")}>{submitted ? "Wedding details" : "Your wedding details form is waiting."}</b>
      <span className={urgent ? "block text-small font-semibold text-error" : "block text-small text-charcoal-soft"}>
        {weddingStatusText(details)}
        {due ? ` · ${due.text}` : ""}
      </span>
      <Button variant="dark" size="sm" className="mt-2.5" onClick={() => navigate(`/party/${booking.id}/wedding-details`)}>
        {submitted ? "View your wedding details" : "Fill in your wedding details"}
      </Button>
    </div>
  )
}

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { weddingApi, weddingDueText, type WeddingDetails } from "@/lib/weddingApi"

/* Block S9a. A wedding order under the review amount checks out and pays
   online, and the wedding details form exists from that moment. On the
   confirmation screens this says so, with the button to it. Asks the admin
   once (a 404 means this is not a wedding, and nothing shows); nothing shows
   either once the form has been sent. `onOpen` runs just before the
   navigation, so a confirmation screen can clear its cart first. */
export function WeddingWaiting({ bookingId, onOpen, className }: { bookingId: string; onOpen?: () => void; className?: string }) {
  const navigate = useNavigate()
  const [details, setDetails] = useState<WeddingDetails | null>(null)

  useEffect(() => {
    let live = true
    weddingApi.get(bookingId).then((r) => {
      if (live && r.ok) setDetails(r.data)
    })
    return () => {
      live = false
    }
  }, [bookingId])

  if (!details || details.status === "submitted") return null
  const due = weddingDueText(details)
  return (
    <div className={`rounded-[14px] border border-line bg-cream px-4 py-3.5 text-left ${className ?? ""}`}>
      <b className="block text-sm text-charcoal">Your wedding details form is waiting.</b>
      <span className="mt-0.5 block text-small text-charcoal-soft">
        Tell us about your day, the people and the shots you want.{due ? ` ${due.text}.` : ""}
      </span>
      <Button
        variant="dark"
        size="sm"
        className="mt-2.5"
        onClick={() => {
          onOpen?.()
          navigate(`/party/${bookingId}/wedding-details`)
        }}
      >
        Fill in your wedding details
      </Button>
    </div>
  )
}

import { useEffect, useState } from "react"
import { weddingApi, type WeddingDetails } from "@/lib/weddingApi"

/* One wedding-details question per booking per visit to My party. The Next
   step box and the booking's own wedding row both want the answer, so it is
   asked once and shared. A 404 (not a wedding) is null. My party clears this
   each time it loads, so a form sent on the way back shows as sent. */
const cache = new Map<string, Promise<WeddingDetails | null>>()

export const clearWeddingCache = () => cache.clear()

export function useWeddingDetails(bookingId: string, enabled = true): WeddingDetails | null {
  const [details, setDetails] = useState<WeddingDetails | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    let asked = cache.get(bookingId)
    if (!asked) {
      asked = weddingApi.get(bookingId).then((r) => (r.ok ? r.data : null))
      cache.set(bookingId, asked)
    }
    asked.then((d) => {
      if (live) setDetails(d)
    })
    return () => {
      live = false
    }
  }, [bookingId, enabled])
  return enabled ? details : null
}

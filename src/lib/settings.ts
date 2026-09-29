import { useEffect, useState } from "react"
import { ADMIN_API } from "@/lib/adminApi"

/* GET /api/settings/public: the rush rule the admin owns. The notice hours
   drive the short-notice warning; the phone is null until the admin sets a
   real one, and every line that would show it is left out then. Read once
   per page load and shared. A failed read is not cached and yields null, so
   the warning simply doesn't appear (the admin's own rush flag on the
   booking is what counts, this is only a heads-up). */
export interface PublicSettings {
  minBookingNoticeHours: number
  rushContactPhone: string | null
}

let cached: Promise<PublicSettings | null> | null = null

function load(): Promise<PublicSettings | null> {
  if (!cached) {
    cached = fetch(`${ADMIN_API}/api/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data): PublicSettings | null => {
        if (!data || typeof data.minBookingNoticeHours !== "number") return null
        const phone = typeof data.rushContactPhone === "string" ? data.rushContactPhone.trim() : ""
        return { minBookingNoticeHours: data.minBookingNoticeHours, rushContactPhone: phone || null }
      })
      .catch(() => null)
      .then((result) => {
        if (!result) cached = null
        return result
      })
  }
  return cached
}

export function usePublicSettings(): PublicSettings | null {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  useEffect(() => {
    let live = true
    load().then((s) => {
      if (live) setSettings(s)
    })
    return () => {
      live = false
    }
  }, [])
  return settings
}

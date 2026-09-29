import { useEffect, useState } from "react"
import { ADMIN_API } from "@/lib/adminApi"

/* GET /api/settings/public: the rush rule the admin owns. The notice hours
   drive the short-notice warning; the phone is null until the admin sets a
   real one, and every line that would show it is left out then. The policy
   is null until the admin writes one. Read once
   per page load and shared. A failed read is not cached and yields null, so
   the warning simply doesn't appear (the admin's own rush flag on the
   booking is what counts, this is only a heads-up). */
export interface PublicSettings {
  minBookingNoticeHours: number
  rushContactPhone: string | null
  /* The current cancellation and deposit policy, or null until the admin has
     written one. Null hides the agreement checkbox entirely. */
  policy: { version: number; text: string } | null
  /* Numbers the policy text can name with {{tokens}}; null when the admin
     doesn't send one, and then its token is left as written. */
  depositPercentage: number | null
  cancellationWindowDays: number | null
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)

/* The policy as the customer reads it: {{depositPercentage}} and
   {{cancellationWindowDays}} become the admin's current numbers. A token it
   doesn't know, or a number the admin didn't send, is left exactly as
   written, so a new token or an older admin never breaks the text. */
export function renderPolicy(text: string, s: Pick<PublicSettings, "depositPercentage" | "cancellationWindowDays">): string {
  const values: Record<string, number | null> = { depositPercentage: s.depositPercentage, cancellationWindowDays: s.cancellationWindowDays }
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (token, key: string) => {
    const v = values[key]
    return v === null || v === undefined ? token : String(v)
  })
}

let cached: Promise<PublicSettings | null> | null = null

function load(): Promise<PublicSettings | null> {
  if (!cached) {
    cached = fetch(`${ADMIN_API}/api/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data): PublicSettings | null => {
        if (!data || typeof data.minBookingNoticeHours !== "number") return null
        const phone = typeof data.rushContactPhone === "string" ? data.rushContactPhone.trim() : ""
        const text = typeof data.policy?.text === "string" ? data.policy.text.trim() : ""
        const policy = text ? { version: Number(data.policy.version) || 0, text } : null
        return {
          minBookingNoticeHours: data.minBookingNoticeHours,
          rushContactPhone: phone || null,
          policy,
          depositPercentage: num(data.depositPercentage),
          cancellationWindowDays: num(data.cancellationWindowDays),
        }
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

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
  /* Every number the admin sent, by field name, for the policy's {{tokens}}
     (depositPercentage, cancellationWindowDays, and whatever it adds next).
     Built from the response itself, not from a list here, so a new token
     needs no change on the storefront. */
  tokens: Record<string, number>
}

/* A number, or a numeric string (a numeric column can arrive as one). */
const asNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v)
  return null
}

/* The policy as the customer reads it: each {{name}} becomes the admin's
   current number for that name (matched ignoring case and inner spaces). A
   token the admin did not send a number for is left exactly as written, so a
   new token or an older admin never breaks the text. */
export function renderPolicy(text: string, s: Pick<PublicSettings, "tokens">): string {
  const byName = new Map(Object.entries(s.tokens).map(([k, v]) => [k.toLowerCase(), v]))
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (token, key: string) => {
    const v = byName.get(key.toLowerCase())
    return v === undefined ? token : String(v)
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
          tokens: Object.fromEntries(
            Object.entries(data as Record<string, unknown>).flatMap(([k, v]) => {
              const n = asNumber(v)
              return n === null ? [] : [[k, n]]
            })
          ),
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

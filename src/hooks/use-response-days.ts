import type { TierInfo } from "@/lib/tierApi"
import { usePublicSettings } from "@/lib/settings"

/* N business days for the review promise: the tier answer's `responseDays`
   when it has one, else the admin's public `requestResponseDays` (so the
   promise can show before the tier is known), else null. */
export function useResponseDays(tier?: TierInfo | null): number | null {
  const settings = usePublicSettings()
  return tier?.responseDays ?? settings?.tokens.requestResponseDays ?? null
}

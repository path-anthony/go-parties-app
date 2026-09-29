import { usePublicSettings } from "@/lib/settings"
import { useBooking } from "@/state/booking"

/* True while the final confirm button has to wait: the admin has written a
   policy (so the checkbox is showing) and it is not checked yet. No policy,
   or settings that could not be read, means nothing to agree to and the
   button behaves as it always has. This is the storefront's own rule; the
   admin's "require the agreement" setting is enforced separately on its side. */
export function useAgreementBlocked(): boolean {
  const settings = usePublicSettings()
  const { agreed } = useBooking()
  return !!settings?.policy && !agreed
}

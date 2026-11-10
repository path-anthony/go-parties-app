import { lazy, Suspense } from "react"
import { GoogleMap } from "@/components/go/SetupMap"
import { GoLabel } from "@/components/go/GoLabel"
import { mapsMocked } from "@/lib/maps"
import type { VerifiedAddress } from "@/lib/places"

/* What the customer sees once an address is picked (Block S6): Google's
   formatted address, and under it a small map with the pin on the address.
   Read-only. The event address uses `map={false}` because the draggable
   setup map (SetupMap) already shows the pin there; the caption alone then
   sits above it. Home addresses (sign-up, My party, checkout) show both. */

const MockMap = import.meta.env.DEV ? lazy(() => import("./SetupMapMock").then((m) => ({ default: m.SetupMapMock }))) : null

export function AddressPreview({ address, map = true, className = "" }: { address: VerifiedAddress; map?: boolean; className?: string }) {
  const point = { lat: address.addressLat, lng: address.addressLng }
  return (
    <div className={className}>
      <GoLabel className="tracking-[.1em]">Verified address</GoLabel>
      <p className="mt-1 text-sm font-semibold text-charcoal">{address.formattedAddress}</p>
      {map && (
        <div className="relative mt-2 aspect-[16/9] overflow-hidden rounded-[12px] border border-line bg-[#F3EFE8]">
          {import.meta.env.DEV && MockMap && mapsMocked() ? (
            <Suspense fallback={null}>
              <MockMap address={point} setup={point} readOnly />
            </Suspense>
          ) : (
            <GoogleMap address={point} setup={point} zoom={17} />
          )}
        </div>
      )}
    </div>
  )
}

import { lazy, Suspense } from "react"
import { mapsAvailable, mapsMocked, mapsUrlFor, type LatLng } from "@/lib/maps"
import { GoogleMap } from "@/components/go/SetupMap"

/* A small read-only map with the setup pin and an "Open in Maps" link, for
   the portal's booking card. Without a key (and outside the dev mock) only
   the link shows: the pin is still real, the map is Google's own then. */

const MockMap = import.meta.env.DEV ? lazy(() => import("./SetupMapMock").then((m) => ({ default: m.SetupMapMock }))) : null

export function MiniMap({ setup, className = "" }: { setup: LatLng; className?: string }) {
  return (
    <div className={className}>
      {mapsAvailable() && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] border border-line bg-[#F3EFE8]">
          {import.meta.env.DEV && MockMap && mapsMocked() ? (
            <Suspense fallback={null}>
              <MockMap address={setup} setup={setup} readOnly />
            </Suspense>
          ) : (
            <GoogleMap address={setup} setup={setup} zoom={17} />
          )}
        </div>
      )}
      <a href={mapsUrlFor(setup)} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block py-1 text-small font-bold text-charcoal underline">
        Open in Maps
      </a>
    </div>
  )
}

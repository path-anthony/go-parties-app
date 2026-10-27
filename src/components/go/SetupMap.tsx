import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { loadMaps, MAP_ID, latLngOf, mapsMocked, metersBetween, type LatLng } from "@/lib/maps"

/* The setup map: centered on the verified address with one draggable pin,
   "Drag the pin to where we should set up". The pin starts on the address
   point and every drag end reports the new spot. More than about 300 m
   from the address shows the bank's question but still allows it: a big
   venue's loading dock can be that far. The real map is Google's (Maps
   JavaScript API, an advanced marker with gmpDraggable); the dev mock
   draws a plate the pin can be dragged across so the flow is testable
   with no key. */

export const FAR_METERS = 300
export const PIN_HINT = "Drag the pin to where we should set up"
export const FAR_MESSAGE = "That's far from the address. Is the spot right?"

// Only a dev build carries the mock map; production folds this to null.
const MockMap = import.meta.env.DEV ? lazy(() => import("./SetupMapMock").then((m) => ({ default: m.SetupMapMock }))) : null

export function SetupMap({ address, setup, onSetup }: { address: LatLng; setup: LatLng; onSetup: (p: LatLng) => void }) {
  const far = metersBetween(address, setup) > FAR_METERS
  return (
    <div>
      <p className="mb-1.5 text-small text-charcoal-soft">{PIN_HINT}</p>
      <div className="relative aspect-[16/11] overflow-hidden rounded-[14px] border border-line bg-[#F3EFE8]">
        {import.meta.env.DEV && MockMap && mapsMocked() ? (
          <Suspense fallback={null}>
            <MockMap address={address} setup={setup} onSetup={onSetup} />
          </Suspense>
        ) : (
          <GoogleMap address={address} setup={setup} onSetup={onSetup} draggable />
        )}
      </div>
      {far && (
        <p role="status" className="mt-1.5 text-small text-charcoal">
          {FAR_MESSAGE}
        </p>
      )}
    </div>
  )
}

/* One Google map with one advanced marker. Draggable in checkout; read-only
   (no gestures, no controls) on the portal card. The map is built once and
   the marker is moved when `setup` changes from outside. */
export function GoogleMap({ address, setup, onSetup, draggable, zoom = 18 }: { address: LatLng; setup: LatLng; onSetup?: (p: LatLng) => void; draggable?: boolean; zoom?: number }) {
  const el = useRef<HTMLDivElement>(null)
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const latest = useRef(onSetup)
  latest.current = onSetup
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    let map: google.maps.Map | null = null
    const build = async () => {
      await loadMaps()
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
      ])
      if (!live || !el.current) return
      map = new Map(el.current, {
        center: setup,
        zoom,
        mapId: MAP_ID,
        disableDefaultUI: true,
        zoomControl: !!draggable,
        gestureHandling: draggable ? "greedy" : "none",
        clickableIcons: false,
        keyboardShortcuts: !!draggable,
      })
      const m = new AdvancedMarkerElement({ map, position: setup, gmpDraggable: !!draggable, title: draggable ? PIN_HINT : "Setup spot" })
      marker.current = m
      if (draggable) {
        m.addEventListener("gmp-dragend", () => {
          const p = latLngOf(m.position)
          if (p) latest.current?.(p)
        })
      }
    }
    build().catch(() => {
      if (live) setFailed(true)
    })
    return () => {
      live = false
      marker.current = null
      map = null
    }
    // Built once per address; the pin moves below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.lat, address.lng, draggable])

  useEffect(() => {
    if (marker.current) marker.current.position = setup
  }, [setup])

  if (failed) return <Fallback />
  return <div ref={el} className="absolute inset-0" />
}

/* When the map script cannot load (offline, a blocked script): the address
   is still verified, the pin stays on the address point. */
function Fallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <MapPin className="size-[34px] fill-orange stroke-white" strokeWidth={1.5} />
    </div>
  )
}

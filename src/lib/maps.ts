import { mockMode } from "@/lib/mock"

/* Google Maps JavaScript API, loaded on demand and only where a map or an
   address lookup is on screen. The key is a browser key, public by nature
   and restricted to this site's address in Google Cloud; no server key ever
   lives here. Without a key nothing is loaded and the who screen falls back
   to the plain address field (SCREENS.md).

   Loading follows the current docs: one script tag for
   maps.googleapis.com/maps/api/js with `loading=async` and a callback,
   then `google.maps.importLibrary(...)` per library. The weekly channel.
   Advanced markers need a map ID; Google's DEMO_MAP_ID works with any key
   and VITE_GOOGLE_MAPS_MAP_ID replaces it with a styled one later. */

export const MAPS_KEY: string = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? ""
export const MAP_ID: string = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)?.trim() || "DEMO_MAP_ID"

/* Farmington, CT: where the lookup is biased and where an empty map opens. */
export const HOME = { lat: 41.7198, lng: -72.8321 }
export const BIAS_RADIUS_M = 25_000

/* Dev only: `?mock=<checkout scenario>` answers the lookup from fixtures and
   draws the map as a plate, so the flow is clickable with no key. Written
   inline where it is checked so a production build folds it away. */
export const mapsMocked = (): boolean => import.meta.env.DEV && (mockMode("checkout") !== null || mockMode("portal") !== null)

/* Whether the verified-address flow is on at all: a key, or the dev mock. */
export const mapsAvailable = (): boolean => MAPS_KEY !== "" || mapsMocked()

const CALLBACK = "__goMapsReady"
let loading: Promise<void> | null = null

export function loadMaps(): Promise<void> {
  if (loading) return loading
  if (MAPS_KEY === "") return Promise.reject(new Error("No Google Maps key"))
  loading = new Promise<void>((resolve, reject) => {
    if (typeof google !== "undefined" && typeof google.maps?.importLibrary === "function") {
      resolve()
      return
    }
    const w = window as unknown as Record<string, unknown>
    w[CALLBACK] = () => {
      delete w[CALLBACK]
      resolve()
    }
    const params = new URLSearchParams({ key: MAPS_KEY, v: "weekly", loading: "async", callback: CALLBACK, region: "US", language: "en" })
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.onerror = () => {
      loading = null
      reject(new Error("Google Maps failed to load"))
    }
    document.head.appendChild(script)
  })
  return loading
}

export type LatLng = { lat: number; lng: number }

/* Google hands positions back as a LatLng (methods) or a literal (numbers),
   depending on the surface. Either becomes a plain pair here. */
export function latLngOf(p: google.maps.LatLng | google.maps.LatLngLiteral | google.maps.LatLngAltitude | null | undefined): LatLng | null {
  if (!p) return null
  const lat = typeof p.lat === "function" ? p.lat() : p.lat
  const lng = typeof p.lng === "function" ? p.lng() : p.lng
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

/* Great-circle distance in meters, for the "far from the address" line. */
export function metersBetween(a: LatLng, b: LatLng): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/* A Google Maps link to a pin, the documented Maps URLs form. */
export const mapsUrlFor = (p: LatLng): string => `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(6)}%2C${p.lng.toFixed(6)}`

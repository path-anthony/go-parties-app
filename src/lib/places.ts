import { mockMode } from "@/lib/mock"
import { loadMaps, HOME, BIAS_RADIUS_M, latLngOf, type LatLng } from "@/lib/maps"

/* Address lookup with Places API (New) through the Maps JavaScript API's
   places library: AutocompleteSuggestion.fetchAutocompleteSuggestions for
   the list, then placePrediction.toPlace() and fetchFields for the one the
   customer picks. One session token covers the typing and the pick, and a
   fresh one starts after each pick, as the docs say. Restricted to the US
   and biased toward Farmington, CT.

   The pick must be a full street address: a street number and a route in
   its components. A city, a business with no number, or free typing never
   becomes a verified address. */

/* The delivery object exactly as the hold carries it (locked API). */
export interface DeliveryComponents {
  streetNumber: string
  route: string
  city: string
  state: string
  zip: string
}
export interface Delivery {
  placeId: string
  formattedAddress: string
  components: DeliveryComponents
  addressLat: number
  addressLng: number
  setupLat: number
  setupLng: number
  setupNotes: string
}

/* A verified address before the pin and the notes are added. */
export type VerifiedAddress = Omit<Delivery, "setupLat" | "setupLng" | "setupNotes">

export interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

export const PICK_MESSAGE = "Please choose your full street address from the list."

let token: google.maps.places.AutocompleteSessionToken | null = null

async function placesLib() {
  await loadMaps()
  return google.maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>
}

export async function suggestAddresses(input: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const q = input.trim()
  if (q.length < 3) return []
  if (import.meta.env.DEV && mockMode("checkout")) return (await import("./placesMock")).mockSuggest(q)
  const { AutocompleteSuggestion, AutocompleteSessionToken } = await placesLib()
  if (!token) token = new AutocompleteSessionToken()
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: q,
    sessionToken: token,
    includedRegionCodes: ["us"],
    locationBias: { center: HOME, radius: BIAS_RADIUS_M },
    origin: HOME,
    language: "en-US",
    region: "us",
  })
  if (signal?.aborted) return []
  return suggestions.flatMap((s) => {
    const p = s.placePrediction
    if (!p) return []
    return [{ placeId: p.placeId, mainText: p.mainText?.toString() ?? p.text.toString(), secondaryText: p.secondaryText?.toString() ?? "" }]
  })
}

/* Resolves a pick to a verified address, or null when it is not a full
   street address. Ends the autocomplete session either way. */
export async function resolveAddress(placeId: string): Promise<VerifiedAddress | null> {
  if (import.meta.env.DEV && mockMode("checkout")) return (await import("./placesMock")).mockResolve(placeId)
  const { Place } = await placesLib()
  token = null
  const place = new Place({ id: placeId })
  await place.fetchFields({ fields: ["id", "formattedAddress", "location", "addressComponents"] })
  return verifiedFrom(place.id, place.formattedAddress, latLngOf(place.location), place.addressComponents ?? [])
}

type Component = { types: string[]; longText: string | null; shortText: string | null }

export function verifiedFrom(placeId: string, formattedAddress: string | null | undefined, at: LatLng | null, comps: Component[]): VerifiedAddress | null {
  const find = (type: string, short = false) => {
    const c = comps.find((x) => x.types.includes(type))
    return (short ? c?.shortText : c?.longText)?.trim() ?? ""
  }
  const streetNumber = find("street_number")
  const route = find("route")
  const city = find("locality") || find("sublocality") || find("neighborhood") || find("administrative_area_level_3")
  const state = find("administrative_area_level_1", true)
  const zip = find("postal_code")
  if (!streetNumber || !route || !at || !formattedAddress) return null
  return { placeId, formattedAddress, components: { streetNumber, route, city, state, zip }, addressLat: at.lat, addressLng: at.lng }
}

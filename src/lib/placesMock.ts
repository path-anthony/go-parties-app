import type { Suggestion, VerifiedAddress } from "@/lib/places"

/* Address fixtures, DEV only and loaded lazily behind import.meta.env.DEV:
   two full street addresses, one town with no street number, one business
   with no street number, so every branch of the who screen is clickable
   with no Google key. Text that matches nothing gets an empty list, as
   Google would. The street addresses are made up; the towns are real. */

const ROWS: Array<Suggestion & { verified: VerifiedAddress | null }> = [
  {
    placeId: "mock-place-maple",
    mainText: "14 Maple Lane",
    secondaryText: "Farmington, CT, USA",
    verified: {
      placeId: "mock-place-maple",
      formattedAddress: "14 Maple Ln, Farmington, CT 06032, USA",
      components: { streetNumber: "14", route: "Maple Lane", city: "Farmington", state: "CT", zip: "06032" },
      addressLat: 41.7217,
      addressLng: -72.8396,
    },
  },
  {
    placeId: "mock-place-ridge",
    mainText: "228 Ridge Road",
    secondaryText: "Avon, CT, USA",
    verified: {
      placeId: "mock-place-ridge",
      formattedAddress: "228 Ridge Rd, Avon, CT 06001, USA",
      components: { streetNumber: "228", route: "Ridge Road", city: "Avon", state: "CT", zip: "06001" },
      addressLat: 41.8098,
      addressLng: -72.8307,
    },
  },
  /* A full street address that the mock admin refuses (answers 400
     address-not-exact), to walk the red line and the cleared pick. */
  {
    placeId: "mock-place-refused",
    mainText: "3 Refused Road",
    secondaryText: "Avon, CT, USA",
    verified: {
      placeId: "mock-place-refused",
      formattedAddress: "3 Refused Rd, Avon, CT 06001, USA",
      components: { streetNumber: "3", route: "Refused Road", city: "Avon", state: "CT", zip: "06001" },
      addressLat: 41.8051,
      addressLng: -72.8402,
    },
  },
  /* Six more with the same street number, so the list has more rows than
     the five it shows (type "3077"). Made up. */
  {
    placeId: "mock-place-3077-1",
    mainText: "3077 Farmington Avenue",
    secondaryText: "Farmington, CT, USA",
    verified: {
      placeId: "mock-place-3077-1",
      formattedAddress: "3077 Farmington Ave, Farmington, CT 06032, USA",
      components: { streetNumber: "3077", route: "Farmington Avenue", city: "Farmington", state: "CT", zip: "06032" },
      addressLat: 41.7231,
      addressLng: -72.8412,
    },
  },
  {
    placeId: "mock-place-3077-2",
    mainText: "3077 Main Street",
    secondaryText: "Avon, CT, USA",
    verified: {
      placeId: "mock-place-3077-2",
      formattedAddress: "3077 Main St, Avon, CT 06001, USA",
      components: { streetNumber: "3077", route: "Main Street", city: "Avon", state: "CT", zip: "06001" },
      addressLat: 41.8109,
      addressLng: -72.8301,
    },
  },
  {
    placeId: "mock-place-3077-3",
    mainText: "3077 Albany Turnpike",
    secondaryText: "Canton, CT, USA",
    verified: {
      placeId: "mock-place-3077-3",
      formattedAddress: "3077 Albany Tpke, Canton, CT 06019, USA",
      components: { streetNumber: "3077", route: "Albany Turnpike", city: "Canton", state: "CT", zip: "06019" },
      addressLat: 41.8312,
      addressLng: -72.9004,
    },
  },
  {
    placeId: "mock-place-3077-4",
    mainText: "3077 Burnt Hill Road",
    secondaryText: "Simsbury, CT, USA",
    verified: {
      placeId: "mock-place-3077-4",
      formattedAddress: "3077 Burnt Hill Rd, Simsbury, CT 06070, USA",
      components: { streetNumber: "3077", route: "Burnt Hill Road", city: "Simsbury", state: "CT", zip: "06070" },
      addressLat: 41.8769,
      addressLng: -72.8105,
    },
  },
  {
    placeId: "mock-place-3077-5",
    mainText: "3077 Hopmeadow Street",
    secondaryText: "Simsbury, CT, USA",
    verified: {
      placeId: "mock-place-3077-5",
      formattedAddress: "3077 Hopmeadow St, Simsbury, CT 06089, USA",
      components: { streetNumber: "3077", route: "Hopmeadow Street", city: "Simsbury", state: "CT", zip: "06089" },
      addressLat: 41.8734,
      addressLng: -72.8052,
    },
  },
  {
    placeId: "mock-place-3077-6",
    mainText: "3077 Park Road",
    secondaryText: "West Hartford, CT, USA",
    verified: {
      placeId: "mock-place-3077-6",
      formattedAddress: "3077 Park Rd, West Hartford, CT 06107, USA",
      components: { streetNumber: "3077", route: "Park Road", city: "West Hartford", state: "CT", zip: "06107" },
      addressLat: 41.7618,
      addressLng: -72.7459,
    },
  },
  { placeId: "mock-place-town", mainText: "Farmington", secondaryText: "CT, USA", verified: null },
  { placeId: "mock-place-park", mainText: "Winding Trails", secondaryText: "Farmington, CT, USA", verified: null },
]

export async function mockSuggest(q: string): Promise<Suggestion[]> {
  await new Promise((r) => setTimeout(r, 150))
  const needle = q.toLowerCase()
  const hits = ROWS.filter((r) => `${r.mainText} ${r.secondaryText}`.toLowerCase().includes(needle))
  return hits.map(({ placeId, mainText, secondaryText }) => ({ placeId, mainText, secondaryText }))
}

export async function mockResolve(placeId: string): Promise<VerifiedAddress | null> {
  await new Promise((r) => setTimeout(r, 150))
  return ROWS.find((r) => r.placeId === placeId)?.verified ?? null
}

/* A stored home address as text, matched to a fixture by its street number
   and name ("228 Ridge Rd" finds the Ridge Road row). */
export async function mockResolveText(text: string): Promise<VerifiedAddress | null> {
  await new Promise((r) => setTimeout(r, 150))
  const t = text.toLowerCase()
  return ROWS.find((r) => r.verified && t.startsWith(r.verified.formattedAddress.toLowerCase().split(",")[0]))?.verified ?? null
}

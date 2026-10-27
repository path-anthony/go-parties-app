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

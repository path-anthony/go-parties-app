import type { BookingState } from "@/state/booking"
import type { Customer } from "@/lib/customerApi"
import { OCC, clockLabel } from "@/data/catalog"
import { addonsPayload } from "@/lib/addons"
import type { BalancePreference, HoldSignature } from "@/lib/adminApi"
import type { TierInput } from "@/lib/tierApi"
import type { Delivery } from "@/lib/places"

/* The request for POST /api/bookings/direct, built the same way from the
   who screen (signed in) and the account step (guest, or just signed up).
   Name, phone and email always travel in the request. Signed in, they come
   from the account the storefront knows (a name typed on the who screen
   fills in when the account has none); the session cookie still goes along
   so the booking attaches to the account, but nothing required depends on
   the cookie arriving. A cookie that doesn't travel (a different site in
   production, a browser that blocks it) used to turn into "customerName is
   required" from the admin and a lost booking. */
/* The cart's occasion in the admin's spelling: the sub-occasion when it has
   one the admin knows, else the group ("Kids party", "Wedding"). "Other" is
   the storefront's own catch-all and would be refused as unknown, so it falls
   back to the group. Null when no occasion was ever picked (Browse). */
export function occasionOf(b: BookingState): string | null {
  if (b.subOcc && b.subOcc !== "Other") return b.subOcc
  return b.occ ? OCC[b.occ].label : null
}

/* What the tier decision is made from: the cart and the date, nothing about
   the person. */
export function tierInput(b: BookingState): TierInput {
  return {
    itemIds: b.items.map((i) => i.id),
    packageId: b.bundle?.id ?? null,
    addons: addonsPayload(b.items),
    eventDate: b.itemDate ?? "",
    eventTime: clockLabel(b.itemTime),
    occasion: occasionOf(b),
    // Block S6: the picked address goes with the quote so the admin can
    // refuse a vague one early. Typed text without a pick is left for the
    // hold, which checks it too.
    ...(b.verified ? { placeId: b.verified.placeId, address: b.verified.formattedAddress } : {}),
    // Block S9a: the guest count goes with the tier call, which prices a
    // per-guest package from it and prints it on a tier 2 quote.
    ...(b.guestCount ? { guestCount: b.guestCount } : {}),
  }
}

/* The tier 2 signature as the hold carries it, or null when there is no
   quote or nothing was signed. */
export function holdSignature(b: BookingState): HoldSignature | null {
  const quote = b.tier?.tier === 2 ? b.tier.contract : null
  if (!quote || !b.signature.consent || b.signature.name.trim() === "") return null
  const additional = b.signature.additional.trim()
  return {
    fullName: b.signature.name.trim(),
    ...(additional ? { additionalSignerName: additional } : {}),
    esignConsent: true,
    contentHash: quote.contentHash,
    quoteId: quote.quoteId,
  }
}

/* The delivery object as locked: the verified address, its point, the setup
   pin and the notes. Null when the address was typed without a pick (no
   key) or never verified. */
export function deliveryOf(b: BookingState): Delivery | null {
  if (!b.verified) return null
  const setup = b.setup ?? { lat: b.verified.addressLat, lng: b.verified.addressLng }
  return { ...b.verified, setupLat: setup.lat, setupLng: setup.lng, setupNotes: b.setupNotes.trim() }
}

export function directInput(b: BookingState, customer: Customer | null) {
  const delivery = deliveryOf(b)
  const typedName = b.contactName.trim() || null
  const signature = holdSignature(b)
  return {
    itemIds: b.items.map((i) => i.id),
    packageId: b.bundle?.id ?? null,
    addons: addonsPayload(b.items),
    eventDate: b.itemDate ?? "",
    customerName: customer ? customer.name?.trim() || typedName : typedName,
    phone: customer ? customer.phone : b.phone.trim(),
    email: customer ? customer.email : b.email.trim(),
    address: delivery ? delivery.formattedAddress : b.address.trim() || null,
    delivery,
    eventTime: clockLabel(b.itemTime),
    occasion: occasionOf(b),
    // A signed contract covers the policy: tier 2 sends agreed as true.
    agreedToPolicy: signature ? true : b.agreed,
    // S3: the home address goes only when the account has none yet; the
    // admin never overwrites one on file. The checkbox state always goes.
    homeAddress: customer && !customer.homeAddress ? b.homeAddress.trim() || null : null,
    eventAddressSameAsHome: customer ? b.sameAsHome : null,
    guestCount: b.guestCount,
    tier: b.tier?.tier ?? null,
    signature,
    // The preference chips are gone (S2); the line on the screen says a
    // payment link is emailed, so the admin's "Reminder link" is sent for
    // every booking (the field is optional there, "Manual" when absent).
    balancePaymentPreference: "Reminder link" as BalancePreference,
    hpField: b.hp,
    formStartedAt: b.formStartedAt > 0 ? b.formStartedAt : null,
  }
}

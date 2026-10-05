import type { BookingState } from "@/state/booking"
import type { Customer } from "@/lib/customerApi"
import { OCC, clockLabel } from "@/data/catalog"
import { addonsPayload } from "@/lib/addons"

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

export function directInput(b: BookingState, customer: Customer | null) {
  const typedName = b.contactName.trim() || null
  return {
    itemIds: b.items.map((i) => i.id),
    packageId: b.bundle?.id ?? null,
    addons: addonsPayload(b.items),
    eventDate: b.itemDate ?? "",
    customerName: customer ? customer.name?.trim() || typedName : typedName,
    phone: customer ? customer.phone : b.phone.trim(),
    email: customer ? customer.email : b.email.trim(),
    address: b.addressLater ? null : b.address.trim() || null,
    eventTime: clockLabel(b.itemTime),
    occasion: occasionOf(b),
    agreedToPolicy: b.agreed,
    balancePaymentPreference: b.balancePref,
    hpField: b.hp,
    formStartedAt: b.formStartedAt > 0 ? b.formStartedAt : null,
  }
}

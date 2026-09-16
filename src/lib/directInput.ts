import type { BookingState } from "@/state/booking"
import type { Customer } from "@/lib/customerApi"
import { itemClock } from "@/data/catalog"

/* The request for POST /api/bookings/direct, built the same way from the
   who screen (signed in) and the account step (guest, or just signed up).
   Signed in: name, phone and email are left out and the account fills them,
   except a name when the account has none yet. */
export function directInput(b: BookingState, customer: Customer | null) {
  const onFile = customer !== null
  const needsName = !customer?.name
  return {
    itemIds: b.items.map((i) => i.id),
    eventDate: b.itemDate ?? "",
    customerName: needsName ? b.contactName.trim() || null : null,
    phone: onFile ? null : b.phone.trim(),
    email: onFile ? null : b.email.trim(),
    address: b.addressLater ? null : b.address.trim() || null,
    eventTime: itemClock(b.itemTime),
  }
}

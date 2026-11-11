/* Block S9b. The admin tells the store about a cancellation request while it
   waits (pendingRequest) and when staff approve it (the stage becomes
   Cancelled). It says nothing when staff decline: the request just goes
   away and the booking is as it was (S9-CONTRACT section 7). So this device
   remembers the bookings it has seen a request on. A live booking with no
   request waiting that was remembered means it was declined; a Cancelled one
   means it was approved. Per device and best effort: the emails are the
   record, and a cleared browser only loses the in-page notice. */

const KEY = "go-cancel-asked"

function read(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown
    return raw && typeof raw === "object" ? (raw as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function write(all: Record<string, string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* no storage, no memory */
  }
}

export const askedBefore = (bookingId: string): boolean => bookingId in read()

export function rememberAsked(bookingId: string) {
  const all = read()
  if (!(bookingId in all)) write({ ...all, [bookingId]: new Date().toISOString() })
}

export function forgetAsked(bookingId: string) {
  const all = read()
  if (bookingId in all) {
    delete all[bookingId]
    write(all)
  }
}

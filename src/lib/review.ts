/* Block S9a. The promise made when an order goes to staff review: how many
   business days until a person makes contact. The number is the admin's
   (`responseDays` on the tier answer and the 202, `requestResponseDays` in
   the public settings, `promise` on a request); nothing here invents one. */

export const businessDays = (n: number) => `${n} business ${n === 1 ? "day" : "days"}`

export const promiseLine = (days: number | null): string => (days ? `We will contact you within ${businessDays(days)}.` : "We will contact you soon.")

/* The one line on every screen before the order is sent. Never a dollar. */
export const reviewLine = (days: number | null): string => `Nothing is due yet. ${promiseLine(days)}`

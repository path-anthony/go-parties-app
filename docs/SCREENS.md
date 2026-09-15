# Customer journey · screen spec v1

Reference build: `reference/GO-Customer-Journey-v1.html`. Match its structure and copy; use the component library for implementation.

Routes are React Router (or equivalent). State lives in a single `useBooking()` store: occ, month, date, time, guests, budget, pkg, swaps, addons, cat, addr, venue, power, water, held.

| # | Route | Screen | Must have | Next |
|---|---|---|---|---|
| 1 | `/` | Welcome | Photo plate hero 4:5 with "Party on. We'll handle it.", headline, body, three feature rows with Lucide icons, one primary button | `/signin` |
| 2 | `/signin` | Sign in | Email input, Continue, OR divider, Google, Apple. All buttons continue (click-through). | `/home` |
| 3 | `/home` | Home | Label "Hey Sarah", "What are we celebrating?", four 1:1 occasion plates, Ask GO dashed line, Recommended rail (4 cards with next open date), small availability note | occasion → `/book/date`; rail → `/book/package` |
| 4 | `/book/date` | Date, time, guests | Month chips, day carousel (Fri Sat Sun, snap, open dot, booked grayed), time chips reveal on tap, guest chips 3 per row, Back and Next | `/book/budget` |
| 5 | `/book/budget` | Budget | Four chips 2 per row, Back and Show me | `/book/package` |
| 6 | `/book/package` | Your package | Package hero 4:3 with date/time/guests overlay, name + price + "before add-ons", inclusions with checks, native select to switch packages, "Ask about this package" | What's in it → `/book/detail`; Make it mine → `/book/addons` |
| 7 | `/book/detail` | What's in it | Item rows with thumbnails and Swap unfold with price deltas | `/book/addons` |
| 8 | `/book/addons` | Add-ons | Category chips, add-on rows with plus, sticky total bar above nav | `/book/where` |
| 9 | `/book/where` | Where's the party | Address input, map plate with pin, venue chips, power and water toggles, note | `/book/review` |
| 10 | `/book/review` | Review | Four meta cards (when, who, where, setup), line items, total, deposit note, "Hold my date, $200" | `/held` |
| 11 | `/held` | Held | Check mark, "Held. You're good.", summary, See my party | `/party` |
| 12 | `/party` | My party | If held: hero, countdown, deposit and balance, Add to my party. Else empty state. | |

Ask GO sheet: scripted responses from `data/ask.js` in v1. Two contexts: home (three vibe chips → package) and package (three questions → answers). Opens as a bottom sheet (Vaul / shadcn Drawer).

Bottom nav: Home, Book, Ask, My party. Book routes to `/book/date` if an occasion is chosen, otherwise Home with a toast.

Data: `data/catalog.js` holds occasions, packages (with inclusions and swappable items), add-ons, guest bands, time slots, budget bands. Copy the objects from the reference HTML exactly. Prices come from the offerings workbook; packages flagged `demo:true` show a "demo pricing" label.

Availability: simulated in v1 (a deterministic function of date) for the package flow above. Only the direct item path below checks the admin live.

## Direct item booking (added 2026-09-15)

A second door, for a customer who wants one specific thing and not a package. It is not a fifth tab (BRAND.md section 8). It is entered from any item inside an Ask GO recommendation, via a "Just this" button on the row: that response already carries real admin item ids, names, and prices, and the admin has no public item list endpoint yet, so this is the one place the storefront can pick a real item today. Calls go to go-parties-admin at the same base URL Ask GO uses.

| Route | Screen | Must have | Next |
|---|---|---|---|
| `/item/:id` | When do you need it? | Item card (name, category, price), month chips, day carousel (Fri Sat Sun, past days grayed), one live check per tapped day via `GET /api/items/:id/availability?date=`, result under the carousel. Once a day is open, time chips (same pattern as the package flow, from ITEM_TIMES) plus a "Decide later" chip. Back and Next (Next only when available and a time or Decide later is picked) | `/item/:id/who` |
| `/item/:id/who` | Who's booking? | What and when meta cards, name and contact inputs (always required, the hard line), plain-text address input with an "Add the address later" switch, "Hold my date" posting to `POST /api/bookings/direct` with `address` and `eventTime` (null when skipped). A 409 `unavailable` (someone took the last unit first) shows the server's message plainly plus "Pick another date". A 409 `not-tracked` shows the server's message. | `/item/held` |
| `/item/held` | Held | Same pattern as `/held`: check mark, "Held. You're good.", what, when and where, the line item, Done | `/home` |

Store adds: item, itemMonth, itemDate, itemTime, itemTimeLater, contactName, phone, email, address, addressLater, direct, changeFor. Phone and email are two required inputs (the admin stores them separately); signed in, name, phone and email come from the account and are not asked again. No payment is collected in this pass; depositPaid stays false on the admin side and the contract and deposit link follow by text.

## Customer portal (added 2026-09-15)

My party (the existing tab) is the door. Every call goes to go-parties-admin's `/api/customer/*` with `credentials: "include"`; the customer_session cookie is SameSite=None in production and is silently not sent otherwise. A `CustomerProvider` checks `/api/customer/me` once on load.

| Route | Screen | Must have | Next |
|---|---|---|---|
| `/party` | My party | Signed out: "Your bookings live here.", Sign in, Create account. Signed in: "Hey {first name}", one card per booking (items, date and time, address, status), Reschedule, Change item, Cancel (asks inline first, never a popup), Sign out. Empty: the bank's empty line and Build one. | |
| `/party/signin` | Welcome in. | Phone or email, password, the admin's message on failure, link to sign up, Back and Sign in | `/party` |
| `/party/signup` | New here. | Name (optional), phone, email, password, the admin's message on failure, link to sign in, Back and Create account | `/party` |
| `/party/:id/reschedule` | When instead? | What and Now cards, the same ItemWhen picker as `/item/:id` checked against the booking's item, Move it. A 409 shows the admin's sentence plainly and the booking is unchanged. | `/party` |
| `/party/:id/change` | Something else instead? | Now and When cards, an Ask GO door. While this screen is open the item button in a recommendation reads "Switch to this" and calls change-item for the same date; a 409 is shown inside the sheet. There is no public item list on the admin yet, so Ask GO is the only item browser. | `/party` |

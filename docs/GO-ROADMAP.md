# GO-ROADMAP.md

Epics, phases, and the backlog for The GO Event Group booking platform. Read alongside `GO-PRODUCT.md` (architecture) and `GO-LOG.md` (running decision log). Rewritten 2026-09-15 against what the two repos actually contain; anything not visible in code is marked as an open question rather than assumed.

---

## The three epics

Sequenced this way because each epic makes the next one's data exist.

### Epic 1: Storefront + CRM spine
Status: the storefront's twelve screens are built, and the parts that touch real data are live against the admin: Ask GO, direct booking of recommended items (one or several, one date, live availability), and a customer portal with a real bookings list and self-service cancel, reschedule and change of item. The package and theme flow (occasion, date, budget, package, add-ons, where, review, held) still runs on the static catalog with simulated availability, because Package and Theme do not exist in the database yet. The leads pipeline exists (Lead, columns, tags, activity, n8n ingestion endpoint). Gap tracking (unbooked dates against inventory) is not built.

### Epic 2: Admin command center
Status: further along than planned. Overview (live KPIs), Inventory (inline edit, quick add, photos, search and filter, CSV import and export), Leads (board, drag and drop, detail panel, manual entry, configurable columns), Scheduling (units and bookings, minimal), Settings (lead columns), Ask GO panel, shared-password gate. Not built: Packages & Themes and Crew & Gigs (nav stubs), a review queue, pricing rules and a custom-quote lane (price unit is free text today), the photo-to-listing copilot.

### Epic 3: Crew and gigs marketplace
Status: not started. No Gig table, no contractor model.

---

## Now

- **Unit-level inventory counts from Andy.** Still the single hardest blocker. The Unit table and the whole booking guarantee exist, but only one real item (Snow Cone Station, 2 units) has units. Everything else reports "not available for direct booking yet" and cannot be booked or scheduled. Every Now item below is smaller than this one.
- **A browse door in the storefront.** `GET /api/items/public` (search, category filter, `hasUnits`) landed on 2026-09-15. The storefront still enters direct booking only through an Ask GO recommendation. A simple browse or search entry can now reuse the existing date, who and held screens unchanged.
- **Cancelled bookings lose their item names.** Cancelling releases BookingUnit rows (that is what frees the date), so `GET /api/customer/bookings` returns a cancelled booking with no items. The portal keeps the names locally after a cancel; a fresh load shows "Booking". The customer serializer should return the lead's occasion or a stored item name.
- **Production verification.** Confirm the deployed URLs, that the admin runs with `NODE_ENV=production` (customer cookie `SameSite=None; Secure`), that `ALLOWED_ORIGINS` includes the storefront's origin, and that the storefront build sets `VITE_ADMIN_API_URL`. None of this is visible from the repos. The admin README still says "no auth, no deployment, local only" and should be brought current.
- **Clean the test data out of the real database.** Verification this week left a test unit, a test customer, and roughly a dozen bookings and leads named Claude Test, Probe, Other Customer and similar. Customers and units have no delete route; bookings can be cancelled from Scheduling.
- **Resolve the inventory flags with Andy.** As far as the repos show, still open: pricing and specs on the 7 power and amenity items, the Balloon Backdrops vs. Balloon Drops and Walls duplicate, Karaoke with or without a host. Open question: whether any of these were answered outside the repos.

## Next

- **Package and Theme tables**, then move the storefront's package flow off the static catalog onto them, with the same live availability the direct path already has. This is what turns Epic 1 from "live for single items" into "live for parties".
- **Deposits.** SwipeSimple payment links after a booking; `deposit_paid` set by the payment, not by hand. Percentage rule still needs Andy.
- **Contracts.** Choose SignWell or Documenso and send the contract the Held screen already promises.
- **CSV export for every table** (leads, bookings, units, customers), Andy's SMPL exit door. Only Items has it today.
- **Phone verification for customer accounts.** The `phone_verified_at` column exists; nothing sets it.
- **Scheduling beyond minimal.** A real calendar view, unit status by date, gap tracking against inventory.
- **Leads reading n8n engagement** (opens, clicks, replies). Ingestion exists; reading engagement back does not. Open question: whether n8n is posting to `/api/leads/external` yet.
- **Theme-to-package AI** (draft by AI, approved by Mel), once Theme and Package exist.

## Later

- Crew and gigs marketplace (Epic 3 in full).
- Admin copilot: draft a unit listing from a photo; "how do I" assistance.
- Customer drip nurturing and the 12-year win-back campaign (needs the customer history list, not yet received).
- Self-serve configurator at GO's `/parties` lane. Largely superseded by the direct booking path plus the coming browse door; keep only if the marketing site needs its own entry.
- Multi-tenant product on top of the `Account` model, if that decision is ever taken.

## Andy's inbox (blocked on him, not on us)

Carried forward unchanged because nothing in the repos shows them answered. Open question: which of these were resolved in conversation.

- Unit-level inventory counts (see Now). The real bottleneck.
- Pricing and specs for: Large Generator, Quiet Generator, Off-Grid Power Solution, Battery-Powered Quiet Music Power Supply, Projectors, Cell Phone Charging Stations, Cubbies/Lockers.
- Confirm whether Balloon Backdrops is a distinct SKU from Balloon Drops and Walls.
- Confirm whether "Karaoke" is equipment-only or comes with a host.
- Break down which items are sourced from innovativeinflatables.com as owned inventory vs. subcontracted overflow vs. just a naming reference.
- Deposit percentage rule: flat, or does it vary by occasion.
- Contractor default rates: does Andy type a number per gig, or do contractors have default rates he adjusts?
- Whether he's aware the plan is now "GO builds its own CRM" rather than "no CRM", framed with the CSV exit door.

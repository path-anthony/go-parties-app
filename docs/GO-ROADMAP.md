# GO-ROADMAP.md

Epics, phases, and the backlog for The GO Event Group booking platform. Read alongside `GO-PRODUCT.md` (architecture) and `GO-LOG.md` (running decision log). Rewritten 2026-09-22 against what the two repos and the live database actually contain; anything not visible in code is marked as an open question rather than assumed.

---

## The three epics

Sequenced this way because each epic makes the next one's data exist.

### Epic 1: Storefront + CRM spine
Status: built and live against the admin for everything except the original package flow. Three doors on Home (Ask GO, Browse by date, published packages by sub-occasion), one checkout with live availability per item, item options (add-on groups) answered per item or in one consolidated step, package pricing and quantities, a customer portal with cancel, reschedule and change of item, item photos everywhere an item is listed. The `/book/*` package flow (occasion, date, budget, package, add-ons, where, review) still runs on the static catalog with simulated availability and is reachable from Home's Continue button. The leads pipeline exists (Lead, columns, tags, activity, n8n ingestion endpoint). Gap tracking (unbooked dates against inventory) is not built.

### Epic 2: Admin command center
Status: further along than planned. Overview (live KPIs), Inventory (compact rows and an item popup with photo drop and the add-on groups editor, quick add, bulk unit creation, search and filter, CSV import and export), Packages & Themes (modal builder, Draft and Published, public feed), Leads (board, drag and drop, detail panel, manual entry, configurable columns), Scheduling (compact booking rows and a booking popup with the full detail, reschedule and unit changes under the same locks as the storefront), Settings, Ask GO panel, shared-password gate. Not built: Crew & Gigs (nav stub), a review queue, pricing rules and a custom-quote lane (price unit is free text today), the photo-to-listing copilot, a calendar view.

### Epic 3: Crew and gigs marketplace
Status: not started. No Gig table, no contractor model.

---

## Now

- **Unit-level inventory counts from Andy.** Still the single hardest blocker. Every guarantee and screen exists, but only Snow Cone Station (2 units) and two test items have units, so the other 166 items report "not available for direct booking yet" and cannot be booked or scheduled. Every other Now item is smaller than this one.
- **Real add-on groups and photos on real items.** The tooling exists (item popup: photo drop, groups and options). Three real items have groups today (Snow Cone Station, Gem and Gold Mining Experience, Go Kart Experience) and four have photos. The rest is data entry, Andy's or ours.
- **Production verification.** Confirm the live URLs, that the admin runs with `NODE_ENV=production` (customer cookie `SameSite=None; Secure`), that `ALLOWED_ORIGINS` includes the storefront's origin, and that the Vercel build sets `VITE_ADMIN_API_URL`. Open `/home` directly on the live site to confirm the deep-link 404 is gone after the `vercel.json` fix (2026-09-16); nothing in either repo can prove a deploy happened. None of this is visible from the repos.
- **Repo and deploy ownership.** The storefront repo is public under `path-anthony`; commits are attributed to a different GitHub identity; the Vercel team behind the storefront project and the Railway project behind the admin are not named anywhere in the repos. Decide who owns what before handover, and whether the storefront should be private. Open question, not a code task.
- **Clean the test data out of the real database.** 39 bookings and 66 leads today, most of them named Claude Test, Probe, Claude Package Test and similar, plus test units, test add-on groups on the two test items, a test package and several test customer accounts. Customers and units have no delete route; bookings can be cancelled from Scheduling; items, packages and add-on groups can be deleted.
- **Package rows without photos.** The admin now sends `photoUrl` on package items (2026-09-21) but the storefront's Home does not yet copy it onto the cart item, so rows that came from a package show the placeholder plate. One-line fix.
- **Cancelled bookings lose their item names in the portal.** Cancelling releases BookingUnit rows (that is what frees the date), so `GET /api/customer/bookings` returns a cancelled booking with no items. The portal keeps the names locally after a cancel; a fresh load shows "Booking". BookingAddon rows are dropped on cancel too. The customer serializer should return a stored item name.
- **Admin README.** Still describes the first pass ("no auth, no deployment, local only") and a `.env.example` that does not exist. Bring it current with the real environment variables.
- **Resolve the inventory flags with Andy.** As far as the repos show, still open: pricing and specs on the 7 power and amenity items, the Balloon Backdrops vs. Balloon Drops and Walls duplicate, Karaoke with or without a host. Open question: whether any of these were answered outside the repos.

## Next

These are the outstanding requirements, in the order they unblock each other.

- **Payment and retainer collection.** After a hold, a payment link for the retainer (SwipeSimple was the plan; the percentage rule still needs Andy: flat, or by occasion), and `deposit_paid` set by the payment, not by hand in the popup. The Held screen already promises this by text. A Payment record on the booking, so the SMPL exit door covers money too.
- **Cancellation fee policy.** Today cancel frees the date and that is all, from the portal and the admin alike. Needs Andy's rule (a window, a percentage of the retainer, or both), then: the policy shown before a customer cancels, the fee recorded on the booking, and the admin able to waive it.
- **Contract e-sign.** Choose SignWell or Documenso, embed it, send the contract the Held screen already promises, and record the signed state on the booking. A Contract record.
- **Real wedding packages entered as test cases.** Packages exist as a table and a builder; the only published one is a test bundle. Enter GO's real wedding packages (ceremony + reception, reception only, and so on) with their real items, quantities and bundle prices, so the wedding door on Home shows real packages and every package rule (pricing, quantities, options, refusals) is exercised on real data before other occasions follow. Open question: whether the wedding packages exist as a written price list yet.
- **Video links on inventory.** Items carry one photo today. Add a video URL per item (YouTube or Vimeo link, not an upload), shown on the item where the storefront lists it. Small schema change, one admin field, one storefront affordance.
- **White-glove concierge routing.** A door for the customer who wants a person, not a checkout: from Ask GO ("I'd rather talk to someone") and from the package cards, into a Lead tagged for concierge with the conversation so far attached, and a way for the admin to see those first. Open question: who takes the concierge lead and through which channel (text via n8n, a call, email).
- **Crew and Gigs.** Epic 3's first real version: a Contractor model (name, contact, skills, default rate), a Gig model tied to a booking (role, date, rate, status), assignment from the booking popup, and the invoice-received view. Payouts stay off-platform. Open question from before: does Andy type a rate per gig, or do contractors carry defaults he adjusts.
- **Move the `/book/*` package flow onto real data**, or retire it in favor of the package door that already exists on Home. The static flow is the last simulated availability in the product.
- **CSV export for every table** (leads, bookings, units, customers, packages), Andy's SMPL exit door. Only Items has it today.
- **Change item keeps add-ons.** Changing a booking's item in the portal drops its add-ons on the admin, and the storefront doesn't ask for the new item's options there yet.
- **Phone verification for customer accounts.** The `phone_verified_at` column exists; nothing sets it.

## Later

- A calendar view in Scheduling, unit status by date, gap tracking against inventory.
- Leads reading n8n engagement (opens, clicks, replies). Ingestion exists; reading engagement back does not. Open question: whether n8n is posting to `/api/leads/external` yet.
- Theme as a real object with AI-drafted, Mel-approved packages per theme, once real packages exist.
- Admin copilot: draft a listing from a photo; "how do I" assistance.
- Customer drip nurturing and the 12-year win-back campaign (needs the customer history list, not yet received).
- A pricing rules and custom-quote lane in the admin; price unit is free text today.
- Multi-tenant product on top of the `Account` model, if that decision is ever taken.

## Andy's inbox (blocked on him, not on us)

Carried forward because nothing in the repos shows them answered. Open question: which of these were resolved in conversation.

- Unit-level inventory counts (see Now). The real bottleneck.
- Real add-on groups and options per item, or the list for us to enter.
- The wedding packages as a price list, for the test cases above.
- Retainer percentage rule: flat, or does it vary by occasion.
- Cancellation policy: the window and the fee.
- Pricing and specs for: Large Generator, Quiet Generator, Off-Grid Power Solution, Battery-Powered Quiet Music Power Supply, Projectors, Cell Phone Charging Stations, Cubbies/Lockers.
- Confirm whether Balloon Backdrops is a distinct SKU from Balloon Drops and Walls.
- Confirm whether "Karaoke" is equipment-only or comes with a host.
- Break down which items are sourced from innovativeinflatables.com as owned inventory vs. subcontracted overflow vs. just a naming reference.
- Contractor default rates: per gig, or per contractor with adjustments.
- Who takes a concierge lead, and how.
- Whether he's aware the plan is now "GO builds its own CRM" rather than "no CRM", framed with the CSV exit door.

# GO-ROADMAP.md

Epics, phases, and the backlog for The GO Event Group booking platform. Read alongside `GO-PRODUCT.md` (architecture) and `GO-LOG.md` (running decision log). Rewritten 2026-09-22 against what the two repos and the live database actually contain; anything not visible in code is marked as an open question rather than assumed.

---

## The three epics

Sequenced this way because each epic makes the next one's data exist.

### Epic 1: Storefront + CRM spine
Status: built and live against the admin. Three doors on Home (Ask GO, Browse by date, published packages by sub-occasion), one checkout with live availability per item, item options (add-on groups) answered per item or in one consolidated step, package pricing and quantities, a customer portal with cancel, reschedule and change of item, item photos everywhere an item is listed. The old static package flow at `/book/*` is gone (2026-09-22); nothing a customer can reach simulates a booking. The leads pipeline exists (Lead, columns, tags, activity, n8n ingestion endpoint). Gap tracking (unbooked dates against inventory) is not built.

### Epic 2: Admin command center
Status: further along than planned. Overview (live KPIs), Inventory (compact rows and an item popup with photo drop and the add-on groups editor, quick add, bulk unit creation, search and filter, CSV import and export), Packages & Themes (modal builder, Draft and Published, public feed), Leads (board, drag and drop, detail panel, manual entry, configurable columns), Scheduling (compact booking rows and a booking popup with the full detail, reschedule and unit changes under the same locks as the storefront), Settings, Ask GO panel, shared-password gate. Not built: Crew & Gigs (nav stub), a review queue, pricing rules and a custom-quote lane (price unit is free text today), the photo-to-listing copilot, a calendar view.

### Epic 3: Crew and gigs marketplace
Status: foundation built (2026-09-23). CrewMember, Gig and GigOffer exist; service items (DJ/MC, photography, videography, photo booth, day-of planner) carry a required skill and are booked against the crew instead of units, one gig per booked item, cancelled and moved with the booking. The admin has a Crew & Gigs screen (gigs by status, crew management, offers recorded by hand, accept and decline) and a live "Bookings needing crew" card. Not built: SMS offers and accept-by-reply, rates and the invoice-received view, a crew login.

---

## Now

- **Unit-level inventory counts from Andy.** Still the single hardest blocker for physical inventory. Only Snow Cone Station (2 units) and two test items have units, so the other physical items report "not available for direct booking yet". The 17 service items no longer need units; they need crew (see the next item).
- **Real crew members from Andy.** Since 2026-09-23 the DJ, photography, videography, photo booth and day-of planner items are bookable the moment someone with the skill exists under Crew & Gigs. Today nobody does, so those 17 items report no availability. Names, phones and skills for the real crew unblock them.
- **Decide the untagged service items.** Tagged automatically: the four MC and DJ tiers, four Photography tiers, four Videography tiers, Photo Booth Packages 1 to 4, and Day of Planner. Left for a decision, since the name didn't settle it: DJ Additional Hours, DJs / Bands and Live Music, Additional Photographer, Additional Videographer, Additional Photo/Video Coverage, Open Air Photo Booth, Coney Island Photo Booth, Photo Booth Package 5 (enclosed, no attendant), Photo Booth Scrapbook Add-on, Rush Photo Edit, Rush Video Edit, Same Day Photo Edit. Each is one field in the item popup once decided.
- **Real add-on groups and photos on real items.** The tooling exists (item popup: photo drop, groups and options). Three real items have groups today (Snow Cone Station, Gem and Gold Mining Experience, Go Kart Experience) and four have photos. The rest is data entry, Andy's or ours.
- **Production verification.** Confirm the live URLs, that the admin runs with `NODE_ENV=production` (customer cookie `SameSite=None; Secure`), that `ALLOWED_ORIGINS` includes the storefront's origin, and that the Vercel build sets `VITE_ADMIN_API_URL`. Open `/home` directly on the live site to confirm the deep-link 404 is gone after the `vercel.json` fix (2026-09-16); nothing in either repo can prove a deploy happened. None of this is visible from the repos.
- **Repo and deploy ownership.** The storefront repo is public under `path-anthony`; commits are attributed to a different GitHub identity; the Vercel team behind the storefront project and the Railway project behind the admin are not named anywhere in the repos. Decide who owns what before handover, and whether the storefront should be private. Open question, not a code task.
- **Clean the test data out of the real database.** 39 bookings and 66 leads today, most of them named Claude Test, Probe, Claude Package Test and similar, plus test units, test add-on groups on the two test items, a test package and several test customer accounts. Customers and units have no delete route; bookings can be cancelled from Scheduling; items, packages and add-on groups can be deleted.
- **Retire the static catalog for good.** With the `/book/*` flow gone, `PKGS`, `ADDONS`, `GUESTS`, `BUDGETS`, `TIMES` and `NEXT_OPEN` in `src/data/catalog.ts`, plus `PackageSelect`, `ItemRow`, `PackageHero` and `RailCard`, exist only to render the `/kit` design page, which ships in the production build. Either move the kit to sample data that says so, or drop those sections and the data.
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
- **White-glove concierge, the rest of it.** The doors are built (2026-09-22): the offer screen after the date, the Ask GO nudge, a concierge Lead per tap, Calendly in a new tab with the context in `a1`. Still open: confirm on Calendly that the 30-minute event type has a custom question so `a1` fills it (nobody has verified this), and decide whether the Leads board should surface concierge leads first.
- **Crew and Gigs, next slice.** The foundation is in (see Epic 3). Next: offers sent by SMS through n8n with accept or decline by reply, a rate on a gig (per gig, or a default per crew member he adjusts: still Andy's call), the invoice-received view, and gigs visible from the booking popup with a jump to the gig. Payouts stay off-platform.
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

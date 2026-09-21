# GO! Event Group · project log

## 2026-09-21

**Where we are:** Item add-ons are live on the storefront against the admin's real shape, read from the code and the endpoints before anything was built: every item from `GET /api/items/public`, `/api/recommend` and `/api/packages/public` carries `addonGroups` (a group is one question about one item, required or optional, one answer per group, each option with a per-unit price change), and `POST /api/bookings/direct` takes `addons: { [itemId]: [addonId] }`, charges each change times the units held, and records the choices with their names against the item. Two doors, one cart: Browse opens a sheet for the one item being added (required groups lock Add to cart, optional ones can be skipped); a batch (Ask GO's checked items, a package) gets one options step before the date, organized by item with the item's name as the heading. Picks live on the cart item, so the cart rows, the totals, the request, the held screen and My party all show which item a choice belongs to. As of today no real item has add-on groups configured; only the two test items do.

Later the same day: the picker handles large groups. More than 6 options (three rows of the two-column chips is the most that still reads at a glance) turns the group into a search input over a scrolling list, with the current pick named above it; 6 or fewer stays chips, unchanged. Checked against a real 15-option required group on the test tent, in the Browse sheet and in the options step.

**What we decided:** A choice is never shown apart from its item, anywhere. Choosing an option doesn't change what the cart is, so a package stays the package and its price is the base with the picks on top. The held screen shows the admin's record of what was sold, not the cart's guess. No checkout screen will take a date while a required group is unanswered, whichever door the cart came through.

**What's next:** Andy configures real add-on groups in the admin's item popup. Change item in the portal drops a booking's add-ons on the admin today; the storefront doesn't ask for new ones there yet.

## 2026-09-17

**Where we are:** A signed-in direct booking could fail with the admin's "customerName is required" and lose the booking. The storefront knew the customer (the sign-in response sets it client-side) but left name, phone and email out of the booking request and trusted the session cookie to carry them; wherever the cookie doesn't travel (a different site in production, a browser that blocks it), the admin saw a request with nothing required in it. The request now always carries name, phone and email from the account the storefront knows, with the cookie still along so the booking attaches to the account. The failure display is fixed with it: the admin's raw wording is never shown except for a date that is taken or an item that isn't bookable; everything else is the bank's calm line with a Try again, and nothing typed is lost (every who-screen field lives in the booking store; the account step keeps its own). A sign-up that succeeded with a booking that failed after it hands the notice to the who screen.

Later the same day, a duplicate-booking race on the account step: a guest who made an account and tapped Hold my date once got a real booking and then a fresh form instead of the confirmation, and a second tap made a second real booking. The sign-up sets the customer, the booking succeeds, navigate() to held is deferred, and the hold's cleanup dropped `booking` back to false synchronously, so the render-time guard ("signed in, nothing in flight: go to the who screen") re-fired and its Navigate beat the pending one. `booking` now stays true on every path that leaves the screen (success, and the signed-up-then-failed hand-off, which had the same race and would have dropped its notice) and is reset only when the screen stays to show a notice. The guard stays render-time on purpose: a signed-in customer landing on that URL must be redirected before a guest form ever paints, and an effect would paint it first and still need the same in-flight check.

**What we decided:** Nothing required in a booking request may depend on a cookie arriving. Server validation text is for the console, not the screen. A screen that is leaving never re-arms its own guards.

**What's next:** Everything from 2026-09-16 still stands. The production cookie question (SameSite=None needs NODE_ENV=production on the admin, and Safari blocks third-party cookies regardless) still decides whether signed-in bookings attach to the account in production; the booking itself now succeeds either way.

## 2026-09-16

**Where we are:** Welcome and Home are one screen at `/` and `/home`: the photo carousel on top with the value props as per-slide captions, then the greeting and the three doors. The old click-through sign-in gate is gone; `/signin` redirects to the portal's sign in, which is reachable from the header Menu and My party at any time. The greeting is real: the customer's first name when signed in, "Hey there" otherwise. Production deep links were a real 404. The storefront deploys to Vercel (the 2026-09-10 note saying Railway was wrong, and the 2026-09-15 entry repeated it), and Vercel serves `dist/` as static files with no history fallback unless `vercel.json` says so. The rewrite that fixed this was deleted on 2026-09-10 on that wrong belief. `vercel.json` is back: every unmatched path rewrites to `index.html`. It takes effect on the next Vercel deploy (`npx vercel --prod`), which has to be run from the founder's terminal; it cannot be verified from inside the sandbox. `npm start` (Vite preview over `dist/`, single page fallback built in) stays as the local way to check a production build.

Later the same day: the static sub-occasion recommendations on Home are gone. Picking a sub-occasion asks the admin for its published packages (`GET /api/packages/public?occasion=`) and shows only those; a package is a pre-filled cart of its real items and books through the same direct checkout. No packages says so plainly.

And the pricing gap that opened is closed the same day: Booking carries `package_id` and `total`; `POST /api/bookings/direct` takes an optional `packageId`, checks it is a published package whose items are exactly the ones being booked, holds the package's quantity of units for each item (each lock skipping the units already held in the transaction), and records the bundle price as the total. Without a package the total is the item prices times quantity. The storefront shows the package price as the cart total, sends `packageId`, drops it the moment the cart is edited, and asks the calendar for enough units, not just one.

**What we decided:** A package books as itself or not at all: the admin refuses a package id whose items don't match the cart, and the storefront clears the package when anything is added or removed. The total the customer sees is the admin's number, not a sum the storefront made up. No gate in front of the product; sign in is a door, never a step. Value props that the screen already makes (a real package in seconds, the Ask GO card) are cut rather than repeated; the ones about dates and delivery ride the captions. The deploy fix lives in the repo (`vercel.json`), not in a dashboard setting, so it survives a rebuild.

**What's next:** Deploy to Vercel (`npx vercel --prod`) and open `/home` directly on the live site to confirm the 404 is gone; confirm `VITE_ADMIN_API_URL` is set in the Vercel project's build env. Everything from 2026-09-15 still stands.

## 2026-09-15

**Where we are:** go-parties-admin went from nothing to a running command center and API in nine days (36 commits, 10 migrations): Railway Postgres, 167 items imported, Inventory, Leads board with n8n ingestion, Scheduling, Settings, shared-password gate, and a public API the storefront now uses for everything real. The storefront's Ask GO is a real multi-turn conversation that recommends by item id and logs a lead only when it commits. Direct booking is live end to end: checkboxes on a recommendation, live availability per item, address and time (both skippable), phone and email as two fields, one or several items booked in one request. Customer accounts and a portal are live: sign up, sign in, a real bookings list, cancel, reschedule, change of item. The Welcome hero runs Mel's real photos. The package and theme flow is still the static catalog, because Package and Theme are not in the database. Only one real item has units.

**What we decided:** No double booking is a database constraint (unique unit and date on booking_units) backed by a SKIP LOCKED transaction, not a code path; several items book atomically or not at all, and a refusal names every item that failed. A lead is written only when Ask GO commits to a recommendation, never on a clarifying turn. Contact is phone plus email, both required, never skippable; signed-in customers are not asked again. Customer sessions are a separate signed cookie from the admin's. Ask GO is the storefront's item browser until a browse door exists. The storefront deploys to Vercel (corrected 2026-09-16; this entry originally said Railway). Every table carries account_id from day one. The docs now describe what is built, with anything unverifiable from code marked as an open question.

**What's next:** Unit counts from Andy, still the blocker. A browse door on the storefront using the new public catalog endpoint. Return item names on cancelled bookings. Verify production: URLs, NODE_ENV, allowed origins, the storefront's API URL. Clean the week's test data out of the real database. Then Package and Theme tables and the package flow onto real data, deposits, contracts, CSV export for every table.

## 2026-09-05

**Where we are:** All 12 customer screens complete on mock data. Moving into real backend work.

**What we decided:** This is not staying a demo. Each epic gets built to real production depth as its first version, not a stub. Admin gets a real Postgres connection and real auth, not another click-through.

**What's next:** Scaffold go-parties-admin. Real Item table. Real import from GEG-Master-Inventory-v2.xlsx.

## 2026-09-04

**Where we are:** GEG-Master-Inventory-v1.xlsx was missing, reuploaded as ANDY_GEG_Spreadsheet_Revisions.numbers, verified 23 inflatables (16 sourced, 7 with no citation), built and shipped GEG-Master-Inventory-v2.xlsx with 8 new items across All Items, Category Map, and Flags for Andy tabs.

**What we decided:** Guest Amenities category approved, generators fold into it. innovativeinflatables.com confirmed as a real three-way supplier relationship (buy, subcontract, reference). Their "Games" and "Games & Activities" categories collapse into one: Games.

GO-PRODUCT.md, GO-ROADMAP.md, GO-LOG.md scoped but not yet drafted.

**What's next:** Resolve Flags for Andy, reconnect local build to GitHub, continue screens 7-12.

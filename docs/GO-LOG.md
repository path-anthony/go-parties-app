# GO! Event Group · project log

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

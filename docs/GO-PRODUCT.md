# GO-PRODUCT.md

The architecture spine for The GO Event Group booking platform. This file changes only when the architecture changes. It does not change for UI tweaks, copy edits, or styling. Last architecture change: 2026-09-23 (Crew and Gigs; then item skills became a list, independent of units, with one gig per skill). Rewritten 2026-09-22 from the two repos and the live database, not from earlier drafts.

Client: The GO Event Group, Farmington CT. Owners: Andy Caron (primary decision-maker) and Melissa "Mel" Caron (photography, client communication, operations).

Built by: Anarco Labs LLC / Path Intelligence (Anthony Regalado). This branding never appears in client-facing work. GO's platform is GO's platform.

---

## What exists today

Two repos, one database.

- `go-parties-app` (github.com/path-anthony/go-parties-app, public): the customer storefront. Vite + React + TypeScript, mobile first at 390px, centered at 560px on desktop. Deploys to Vercel; `vercel.json` rewrites every path to `index.html`.
- `go-parties-admin` (github.com/path-anthony/go-parties-admin): the admin command center and the API in one Express + Prisma process that serves its own built front end. 46 commits from 2026-09-07 to 2026-09-21, 13 migrations. Every storefront call that touches real data goes here.
- Postgres on Railway, reached by the admin server only. The storefront never talks to the database directly.

Live counts on 2026-09-22: 169 items (77 priced, 15 categories), 5 units on 3 items, 1 published package, 39 bookings and 66 leads (most of both are test data from verification, see GO-ROADMAP), 3 real items with add-on groups, 4 items with photos.

Open questions, not visible from either repo: the live URLs of both apps; whether the admin runs with `NODE_ENV=production` on Railway (that flag is what makes the customer cookie `SameSite=None; Secure`, which the cross-origin storefront needs); whether `ALLOWED_ORIGINS` there includes the storefront's origin; whether the Vercel project builds with `VITE_ADMIN_API_URL` pointed at the deployed admin. See "Deploy and ownership" below.

## The spine as built

Seventeen tables in `go-parties-admin/prisma/schema.prisma`. Every row below Account carries an `account_id` (see the multi-tenancy note). What each one is, in the product's own words:

- **Account**: the company that owns everything below. One row today (GO).
- **Item**: anything sellable. The menu. Name, category, nullable price (TBD and custom-quote items exist and are excluded from Ask GO's math), price unit as free text (labelled "Billed per" in the admin), internal notes, photo, and `skills`: the crew skills it needs to run, any number, from the fixed list. Uploaded photos are stored inline as data URLs in `photo_url`. Skills and units are independent: an item can be a physical piece with units, a service with skills (the DJ tiers, no units), or both (a cigar bar that is a real setup and needs waitstaff, a bartender and a photographer).
- **Unit**: one physical instance of an item. The warehouse. A label, a manual status (Available, Booked, Maintenance), and a booking calendar through BookingUnit. Since 2026-09-23 every item that has no skills carries at least one unit (144 got a default "Unit #1" then), so the whole physical catalog is bookable once per date until real counts replace the defaults; the 22 skill-only items were left without units on purpose.
- **CrewMember**: a person who works events. Name, phone, email, a list of skills from the fixed set (DJ/MC, Photographer, Videographer, Photo Booth Attendant, Day-of Coordinator, Waitstaff, Bartender), an active flag, notes. Admin managed, no login. Skills are plain strings validated in code like every other fixed set here; adding one is a code change, not a migration. Deactivating keeps the row and everything it filled.
- **Gig**: one person needed for one skill of one item on one booking. Created automatically, one per skill per unit wanted, the moment a booking takes an item with skills (a three-skill item makes three gigs, each offered and filled on its own); all of them cancelled with the booking; moved with the booking's date. Carries the skill, the event date, the item name (copied, so a renamed or deleted item doesn't rewrite it), a status (Needs Crew, Offered, Filled, Cancelled) and who filled it.
- **GigOffer**: a gig put to one crew member, Sent, Accepted or Declined. Several people can be offered the same gig; one accepted offer fills it, and a second accept on a filled gig is refused by name. Nothing is sent anywhere yet; the admin records what was asked and answered.
- **Booking**: a confirmed event on a date. Event time and address as free text, customer name, phone and email as separate columns, status (Confirmed, Completed, Cancelled), a `deposit_paid` flag nothing sets automatically, the quoted `total`, and optional links to the Lead it came from, the Customer who made it, and the Package it was booked as.
- **BookingUnit**: which units a booking holds, one row per unit, each carrying the event date. `(unit_id, event_date)` is unique. See the guarantee below.
- **BookingAddon**: what a booking chose for an item. The item name, group name, option name and price change are copied at booking time on purpose: a booking is a record of what was sold, so renaming, repricing or deleting an option later never rewrites it. Quantity is how many units of the item the choice applies to.
- **Customer**: a storefront account. Phone and email (both unique per account), bcrypt password hash, optional name, `phone_verified_at` (column exists, nothing sets it).
- **Package**: a curated bundle of real items with one manual price (not a sum; the gap is Andy's discount). Name, description, price, Draft or Published, an optional theme tag, an occasion that matches one of the storefront's sub-occasion strings, a photo. Only Published packages are public, and publishing requires an occasion and at least one item.
- **PackageItem**: the items in a package with a quantity each.
- **AddonGroup**: one question about one item ("Flavor", "Sidewalls"), required or optional, in the order Andy arranged them.
- **Addon**: one answer in a group, with a price change per unit of the item. Zero is a free choice, a negative number is a downgrade.
- **Lead**: the top of the CRM pipeline. Source is one of ask-go (logged when an Ask GO conversation commits to a recommendation), manual (typed in the admin), website (posted by n8n), storefront (created alongside every direct booking). Status is the name of a LeadStatus column; tags, notes, occasion, date of interest, theme, and what Ask GO returned.
- **LeadStatus**: the Leads board's columns, editable in the admin, with a real foreign key so renaming a column cascades to its leads and a column with leads can't be deleted.
- **LeadActivity**: append-only log per lead. Bookings, cancellations, reschedules, item and unit changes and add-on edits write here.

Not in the schema: **Theme** as its own table (it is a text tag on Package), **Client**, **Contract**, **Payment**, and a rate on a gig or a crew member (payouts stay off-platform for now). The storefront's original static package flow (`/book/*`, `/held`) was removed on 2026-09-22; every booking a customer can make now goes through the real checkout. The static catalog in `src/data/catalog.ts` survives only as sample data for the `/kit` design page.

## The no-double-booking guarantee

This is load-bearing, not aspirational. Two customers can never hold the same unit on the same date, whichever door the booking came through and whoever edits it afterwards.

- **Database level:** `booking_units (unit_id, event_date)` is unique. Whatever code path tries, Postgres refuses the second row. This is the backstop; everything below exists so customers never hit it.
- **Transaction level:** inside the one transaction that writes the Booking, its BookingUnits, its BookingAddons and the Lead, each unit is selected with `FOR UPDATE SKIP LOCKED`. Two requests racing for the last unit cannot both pick it: the loser sees no row and is told the date is taken. Skipping, not waiting, is deliberate. Under READ COMMITTED a waiter's `NOT EXISTS` check keeps its original snapshot and could still see the unit as free after the winner committed.
- **Several items, and several units of one item:** every unit is locked before anything is written; each lock passes the units the transaction already holds, so a package that wants two of an item gets two different ones. If any item is short by even one unit, the whole transaction rolls back and the 409 names every item that failed and says nothing was booked.
- **Every change reuses the same lock.** A reschedule, from the customer portal or from the admin's booking popup, locks one free unit of each held item on the new date before releasing the old ones, so the booking lands on whichever units are free that day; if any item has none, the booking is left exactly as it was. A change of item locks the new item's unit first. Adding an item to a booking in the admin claims a unit under the same lock. Cancelling deletes the booking's BookingUnit rows, which is what frees the date. The admin's older behaviour (move the same unit ids, refuse if that specific unit was taken) is gone as of 2026-09-21; admin and storefront now have parity.
- **A unit-less physical item can't be promised:** availability reports `directBooking: false` and the booking route refuses it as not-tracked. This is why unit counts from Andy gate real availability for physical inventory.
- **Skills are promised against people.** An item with skills is free on a date only when, for every one of its skills, the active crew members with that skill outnumber the gigs already needing it that day; an item with units and skills also needs a free unit, so its free count is the tighter of the two. Inside the booking transaction, units are locked first (`SKIP LOCKED`, never waiting) and then the crew rows for each skill (`FOR UPDATE`, waiting) in alphabetical skill order across the whole booking, so two transactions that need the same skills always take them in the same order and cannot deadlock, and two bookings racing for the last free person of a skill take turns with exactly one winning. A reschedule re-checks every gig's skill on the new date under the same lock and refuses the whole move if the crew can't cover it; adding an item from the admin's booking popup goes through the same locks. The public catalog and availability report one free count per item whichever bound it.

Verified on the live database, with the race between an admin reschedule and a storefront booking for the last unit of a date: exactly one won, the date ended full, the loser's booking was left whole.

## Pricing as recorded

`Booking.total` is what the customer was quoted, set by the admin, never by the storefront:

- Without a package: each item's price times the units held, plus every add-on choice's price change times the units of that item.
- With a package: the package's bundle price, plus the add-ons. The request must carry `packageId` and exactly the package's items, or it is refused; the package's quantities decide how many units are held.
- Admin edits to a booking (add or remove a unit, change an add-on) move the total by the amount of the edit.
- Null when nothing had a price. Admin-entered bookings carry no total today.

## Public API (no session, rate limited per IP)

- `GET /api/items/public[?q&category&date]`: the catalog as the storefront may show it. With a date, only items with a free unit that day, each with `freeUnits`. Search is on the name only; notes never leave the server.
- `GET /api/items/:id/availability?date=`.
- `GET /api/packages/public?occasion=`: published packages for one sub-occasion, with their items.
- `POST /api/bookings/direct`: `itemId` or `itemIds`, `eventDate`, `customerName`, `phone` and `email` (both required, the account fills them for a signed-in customer), optional `eventTime`, `address`, `packageId`, `addons: { [itemId]: [addonId] }`.
- `POST /api/recommend`: Ask GO.
- `/api/customer/*`: signup, login, logout, me, bookings, cancel, reschedule, change-item.
- `POST /api/leads/external`: the n8n webhook, shared secret header.

Every public item, from the catalog, from Ask GO and from a package, is built by one function (`server/publicItem.ts`, `toPublicItem`) that constructs the object field by field: id, name, category, price, priceUnit, photoUrl, hasUnits, addonGroups. It constructs rather than spreads, so a column added to Item later can't leak by default. This closed a real leak on 2026-09-21: Ask GO had been returning whole item rows, internal notes, account id and timestamps included.

## The three faces

One data model, three doors into it:

1. **Customer storefront** (built, live against the admin). Home is one scrolling screen with no sign-in gate: the photo carousel, then three doors. Ask GO (a conversation that ends in a recommendation with checkboxes), Build your own (Browse: pick a day first, then only what is open that day, a cart, item options answered as each item is added), and the occasion plates (sub-occasion chips, then the published packages for that sub-occasion, each a pre-filled cart). All three land in one checkout: an options step when a batch has anything to configure, date and time with live availability per item, who (name, phone, email, address), an account-or-guest step for guests, held. A customer portal (My party) with sign up, sign in, a real bookings list, cancel, reschedule and change of item. Item photos as thumbnails everywhere an item is listed, the photo plate where there is none. Every screen is mobile first at 390px.
2. **Admin command center** (built). Overview (live KPIs), Inventory, Packages & Themes, Leads, Scheduling, Settings, and an Ask GO panel, behind one shared password, desktop first. Inventory and Scheduling use one pattern throughout: a compact row per record (an item, a booking) that opens a popup holding the full editable detail. The item popup owns the photo drop zone and the add-on groups editor; the booking popup owns date, time, contact, address, status, deposit flag, the quoted total, the booking's items with their units and add-on choices, and add or remove of items. Packages has a modal builder with Draft and Published. Inventory also has quick add, bulk unit creation across selected items, search and category filter, CSV import and export. Leads is a board with drag and drop, configurable columns, tags, an activity log, a detail panel, manual entry and n8n ingestion. Crew & Gigs is a real screen with two tabs: Gigs (every person needed, filterable by status, opening a popup with the eligible crew as a checklist, send offers, mark accepted or declined) and Crew (the people, add, edit, deactivate). Overview's "Bookings needing crew" card is live.
3. **Contractor marketplace** (not started).

## Where AI sits

- **Customer-side (built):** Ask GO is a multi-turn conversation. The storefront sends the whole transcript plus the chosen sub-occasion each turn; the admin calls Claude with the real priced catalog (notes included, for the model only) as the only thing it may recommend, forces a tool call that returns either a clarifying question or a ready recommendation by item id, and logs a Lead only on the ready turn. Ids not in the catalog are dropped server-side. It asks about budget once if it never came up and goes big when the customer declines to give one.
- **Admin copilot (partly):** the admin has an Ask GO panel against the same endpoint. The photo-to-listing draft and the "how do I" assistant are not built.
- **Gig matching (foundation built, no AI yet):** gigs exist and the admin chooses who to offer them to from a checklist of everyone with the skill. Automatic matching, SMS offers and accept-by-reply are not built.

Freedom stays low on pricing and package creation by design. AI drafts, a human approves.

## Sessions and access

- **Admin:** one shared password (`ADMIN_PASSWORD`), a signed `admin_session` cookie, every `/api/*` route gated except the public ones listed above, `/api/auth`, `/api/health`, and the n8n webhook.
- **Customers:** their own signed `customer_session` cookie, a different name from the admin's, so neither cookie can stand in for the other. Signup and login are rate limited; wrong identifier and wrong password get the same sentence.
- **Storefront calls** to `/api/customer/*` and `/api/bookings/direct` send `credentials: "include"`. Nothing required in a booking request depends on the cookie arriving: name, phone and email always travel in the request, and the cookie only decides whether the booking attaches to the account. In production the customer cookie must be `SameSite=None; Secure` to travel cross-origin, and Safari blocks third-party cookies regardless; so whether signed-in bookings attach to the account in production is an open question, while the booking itself succeeds either way.

## Deploy and ownership

What the repos show, and only that:

- The storefront repo is public under the GitHub account `path-anthony`. Commits on both repos are attributed to a different GitHub identity (`Anthony-Grey`, a noreply address), with a few on the storefront from `anthony@joinpath.ai`.
- The storefront directory is linked (`.vercel/`, gitignored) to a Vercel project named `go-parties-app` under a Vercel team whose name is not visible. Deploys happen from a terminal with `npx vercel --prod`; whether the Vercel project is also connected to the GitHub repo for automatic deploys is not visible.
- The admin has no deploy config in the repo (no Dockerfile, Procfile or railway.json). Its README still describes the first pass ("no auth, no deployment, local only") and points at a `.env.example` that does not exist. Environment variables it reads: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `ADMIN_PASSWORD`, `ALLOWED_ORIGINS`, `NODE_ENV`, `PORT`.

Open questions: which GitHub account or organisation should own the repos (and whether the storefront should stay public), who owns the Vercel team and the Railway project, and the live URLs. None of this blocks development; all of it blocks a clean handover.

## Stack

- **Database:** Postgres on Railway. Single source of truth.
- **Admin + API:** one Express process serving its own built front end. Prisma 7 with the pg adapter.
- **Storefront:** Vite + React 19 + TypeScript, Tailwind v4 with the tokens from `docs/BRAND.md`, shadcn/ui, Lucide, React Router. Vercel.
- **DNS:** Cloudflare was the plan. Not verifiable from the repos.
- **Design system:** cream ground, white cards, charcoal type, taupe labels, orange as the single accent, once per screen. Inter. Light mode locked. Photo plates where there is no photo; the Home hero runs Mel's real photos.
- **Copy voice:** matter-of-fact, short sentences, no exclamation points, no em dashes, no emoji. The bank lives in `docs/BRAND.md` section 10.

## Payments and contracts

Not built. `deposit_paid` on Booking is a hand-set flag in the booking popup. The storefront tells the customer a contract and deposit link follow by text; nothing sends them yet. There is no cancellation fee logic; cancel frees the date and that is all.

- **Deposits / retainers:** SwipeSimple payment links, 10 to 20 percent of package price was the plan. Exact rule not yet locked with Andy.
- **Contracts:** e-sign, embedded rather than built in-house. Vendor not yet chosen (SignWell vs. Documenso).
- **Contractor payouts:** stay off-platform. The platform tracks what's owed and shows an invoice-received view; it does not move money to contractors.

## Marketing and lead tools (adjacent)

n8n stays as it is for lead drip and SMS. The admin exposes `POST /api/leads/external` (shared secret) for n8n to post website leads into the pipeline as source "website". Open question: whether n8n is actually posting to it. Reading n8n's engagement data (opens, clicks, replies) back into the CRM is not built.

## SMPL

SMPL CRM is out. Andy approved building the CRM in-house. The exit door is CSV export of every record. Today only Items has it (`GET /api/items/export.csv`, matching the import template). Leads, bookings, units, customers and packages do not yet.

## Multi-tenancy note

Implemented at the schema level: an `Account` table and `account_id` on every other table, one account today, and `getDefaultAccount()` everywhere a route needs one. Whether this becomes a broader Path Intelligence product is still the open product decision it was; the schema no longer stands in the way of either answer.

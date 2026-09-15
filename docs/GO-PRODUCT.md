# GO-PRODUCT.md

The architecture spine for The GO Event Group booking platform. This file changes only when the architecture changes. It does not change for UI tweaks, copy edits, or styling. Last architecture change: 2026-09-15.

Client: The GO Event Group, Farmington CT. Owners: Andy Caron (primary decision-maker) and Melissa "Mel" Caron (photography, client communication, operations).

Built by: Anarco Labs LLC / Path Intelligence (Anthony Regalado). This branding never appears in client-facing work. GO's platform is GO's platform.

---

## What exists today

Two repos, one database.

- `go-parties-app` (path-anthony/go-parties-app): the customer storefront. Vite + React + TypeScript, mobile first at 390px. Twelve screens plus the direct booking path and the customer portal.
- `go-parties-admin` (path-anthony/go-parties-admin): the admin command center and the API. Vite + React front end served by an Express + Prisma server as one process. Every storefront call that touches real data goes here.
- Postgres on Railway, reached by the admin server only. The storefront never talks to the database directly.

The admin is a real, running component of the architecture, not a plan: 36 commits from 2026-09-07 to 2026-09-15, 10 migrations, a shared-password gate on the admin surface, a CORS allowlist, rate limits on every public route. It is deployed (Railway, per the owner). Open question: the deployed URLs of both apps, and whether the admin runs with `NODE_ENV=production` there (that flag is what makes the customer cookie `SameSite=None; Secure`, which the cross-origin storefront needs). Neither is visible from the code.

## The spine as built

Eight tables in `go-parties-admin/prisma/schema.prisma`. Every row carries an `account_id` (see the multi-tenancy note). What each one is, in the product's own words:

- **Account**: the company that owns everything below. One row today (GO).
- **Item**: anything sellable. The menu. 167 rows, imported from GEG-Master-Inventory-v2 (name, category, price, price unit, notes, photo). Price is nullable: TBD and custom-quote items exist and are excluded from Ask GO's math.
- **Unit**: one physical instance of an item. The warehouse. Optional per item, and this is the current gap: only one real item has units (see GO-ROADMAP). A unit has a manual status (Available, Booked, Maintenance) and a booking calendar through BookingUnit.
- **Booking**: a confirmed event on a date. Event time and address as free text, customer name, phone and email as separate columns, status (Confirmed, Completed, Cancelled), a `deposit_paid` flag nothing sets automatically, an optional link to the Lead it came from and to the Customer who made it.
- **BookingUnit**: which units a booking holds. One row per unit, carrying the event date. The unique index on `(unit_id, event_date)` is what makes a double booking impossible at the database level.
- **Customer**: a storefront account. Phone and email (both unique per account), bcrypt password hash, optional name, `phone_verified_at` (column exists, nothing sets it yet).
- **Lead**: the top of the CRM pipeline. Source is one of ask-go (logged when an Ask GO conversation commits to a recommendation), manual (typed in the admin), website (posted by n8n), storefront (created alongside every direct booking). Status is the name of a LeadStatus column, tags, notes, occasion, date of interest, and what Ask GO returned.
- **LeadStatus**: the Leads board's columns, editable in Settings, with a real foreign key so renaming a column cascades to its leads.
- **LeadActivity**: append-only log per lead. Bookings, cancellations, reschedules and item changes write here.

Not built, and not in the schema: **Package**, **Theme**, **Gig**, **Client**, **Contract**, **Payment**. The storefront's package flow (occasion, date, budget, package, add-ons, where, review) still runs on the static catalog in `src/data/catalog.ts` with simulated availability. Those objects are still the intended design; see GO-ROADMAP for order.

## The direct booking guarantee

This is load-bearing, not aspirational. A customer books one or more specific items for one date from the storefront, and two customers can never hold the same unit on the same date.

- **Database level:** `booking_units (unit_id, event_date)` is unique. Whatever code path tries, Postgres refuses the second row.
- **Transaction level:** inside the one transaction that writes the Booking, its BookingUnits and the Lead, a free unit is selected with `FOR UPDATE SKIP LOCKED`. Two requests racing for the last unit cannot both pick it: the loser sees no row and is told the date is taken. Skipping, not waiting, is deliberate. Under READ COMMITTED a waiter's `NOT EXISTS` check keeps its original snapshot and could still see the unit as free after the winner committed.
- **Several items at once:** one unit per item is locked before anything is written. If any item has nothing free, the whole transaction rolls back, the 409 names every item that failed and says nothing was booked. Verified: counts of bookings, booking_units, leads and lead_activities identical before and after a refused attempt.
- **Changes reuse the same lock:** a reschedule locks a unit on the new date before releasing the old one; a change of item locks the new item's unit first. A failed change leaves the booking exactly as it was. Cancelling deletes the booking's BookingUnit rows, which is what frees the date.
- **A unit-less item can't be promised:** availability reports `directBooking: false` and the booking route refuses it as not-tracked. This is why unit counts from Andy gate real availability.

Public routes involved: `GET /api/items/:id/availability?date=`, `POST /api/bookings/direct` (accepts `itemId` or `itemIds`), `GET /api/items/public`. All rate limited per IP; the booking route is capped like Ask GO because it writes real rows.

## The three faces

One data model, three doors into it:

1. **Customer storefront** (built, live against the admin): Ask GO conversation, direct booking of the recommended items, a customer account with a real list of bookings and self-service cancel, reschedule and change of item. The package and theme flow is still a mock until Package and Theme exist.
2. **Admin command center** (built, deployed): Overview with live KPIs, Inventory (inline edit, quick add, photo drop, search and category filter, CSV import and export), Leads (a board with drag and drop, columns, tags, activity log, detail panel, manual entry, n8n ingestion), Scheduling (units and bookings, minimal), Settings (lead columns), and an Ask GO panel. Packages & Themes and Crew & Gigs are empty stubs in the nav. Desktop-first.
3. **Contractor marketplace** (not started).

## Where AI sits

- **Customer-side (built):** Ask GO is a multi-turn conversation. The storefront sends the whole transcript plus the chosen sub-occasion each turn; the admin calls Claude with the real priced catalog as the only thing it may recommend, forces a tool call that returns either a clarifying question or a ready recommendation by item id, and logs a Lead only on the ready turn. Ids not in the catalog are dropped server-side. Ask GO is also, today, the storefront's only item browser: the direct booking path starts from a recommendation's checkboxes.
- **Admin copilot (partly):** the admin has an Ask GO panel against the same endpoint. The photo-to-listing draft and the "how do I" assistant are not built.
- **Gig matching (not built):** no Gig table yet.

Freedom stays low on pricing and package creation by design. AI drafts, a human approves.

## Sessions and access

- **Admin:** one shared password (`ADMIN_PASSWORD`), a signed `admin_session` cookie, every `/api/*` route gated except the public ones listed above, `/api/auth`, `/api/health`, and the n8n webhook (shared secret header).
- **Customers:** their own signed `customer_session` cookie, a different name from the admin's, so neither cookie can stand in for the other. Signup and login are rate limited; wrong identifier and wrong password get the same sentence.
- **Storefront calls** to `/api/customer/*` and `/api/bookings/direct` send `credentials: "include"`. In production the customer cookie must be `SameSite=None; Secure` to travel cross-origin (see the open question above).

## Stack

- **Database:** Postgres on Railway. Single source of truth. Confirmed.
- **Admin + API:** one Express process on Railway serving its own built front end.
- **Storefront:** the repo's history says it deploys to Railway, not Vercel (a `vercel.json` was added and removed on 2026-09-10 for that reason). No deploy config lives in the repo. Open question: the live URL and whether its build sets `VITE_ADMIN_API_URL` to the deployed admin.
- **DNS:** Cloudflare was the plan. Not verifiable from the repos.
- **Design system:** cream (`#F9F7F3`) ground, white cards, charcoal (`#211D1C`) type, taupe (`#8B7355`) labels, orange (`#F49B1F`) single accent. Inter. Light mode locked. shadcn/ui + Tailwind v4 + Lucide. Photo plates until real photos land (the Welcome hero already runs Mel's real photos).
- **Copy voice:** matter-of-fact, short sentences, no exclamation points, no em dashes, no emoji. The bank lives in `docs/BRAND.md`.

## Payments and contracts

Not built. `deposit_paid` on Booking is a hand-set flag. The storefront tells the customer a contract and deposit link follow by text; nothing sends them yet.

- **Deposits:** SwipeSimple payment links, 10 to 20 percent of package price. Exact percentage rule not yet locked with Andy.
- **Contracts:** e-sign, embedded rather than built in-house. Vendor not yet chosen (SignWell vs. Documenso).
- **Contractor payouts:** stay off-platform. The platform tracks what's owed and shows an invoice-received view; it does not move money to contractors.

## Marketing and lead tools (adjacent)

n8n stays as it is for lead drip and SMS. The admin exposes `POST /api/leads/external` (shared secret) for n8n to post website leads into the pipeline as source "website". Open question: whether n8n is actually posting to it yet, and reading n8n's engagement data (opens, clicks, replies) back into the CRM is not built.

## SMPL

SMPL CRM is out. Andy approved building the CRM in-house. The exit door is CSV export of every record. Today only Items has it (`GET /api/items/export.csv`, matching the import template). Leads, bookings, units and customers do not yet.

## Multi-tenancy note

Implemented at the schema level: an `Account` table and `account_id` on every other table, one account today. Whether this becomes a broader Path Intelligence product is still the open product decision it was; the schema no longer stands in the way of either answer.

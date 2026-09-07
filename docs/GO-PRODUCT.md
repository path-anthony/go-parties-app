# GO-PRODUCT.md

The architecture spine for The GO Event Group booking platform. This file changes only when the architecture changes. It does not change for UI tweaks, copy edits, or styling.

Client: The GO Event Group, Farmington CT. Owners: Andy Caron (primary decision-maker) and Melissa "Mel" Caron (photography, client communication, operations).

Built by: Anarco Labs LLC / Path Intelligence (Anthony Regalado). This branding never appears in client-facing work. GO's platform is GO's platform.

---

## The spine

Five objects. Every part of the app reads or writes one of these.

- **Item** — anything sellable: a product, a service, or a human. The menu.
- **Unit** — a physical instance of an item, with its own calendar, turnaround time, and transit rules. Items are the menu, units are the warehouse. Example: "Large Generator" is an Item; the five actual generators GO owns, each with its own booking calendar, are five Units.
- **Package** — a curated bundle of items with quantities, like a bill of materials. A package must be sellable and coherent on its own. No meaningless packages just to fill a slot.
- **Theme** — a curated layer on top of packages: a quinceañera, a Bluey birthday, a cigar night. A theme maps to packages, items, decor, and copy. This is where AI recommendations live. AI drafts theme-to-package mappings; a human (Mel) approves before anything goes live.
- **Gig** — a dated need for a human skill, sent to matching contractors. Favorites-first routing (Andy's most reliable contractors see it first). Contractors accept or counter an offer. Acceptance triggers a contract automatically.

Supporting CRM records that sit on top of the spine: Booking, Client, Contract, Payment.

## The three faces

One data model, three doors into it:

1. **Customer storefront** — reads the spine. Browses items and packages, gets theme-based recommendations, books, pays a deposit.
2. **Admin command center** — writes the spine. Andy and Mel manage inventory, units, pricing, packages, themes, and gigs. Desktop-first, dense, keyboard-friendly.
3. **Contractor marketplace** — bids into the spine. Contractors see gigs matched to their skills, accept or counter, get paid off-platform.

Not three systems. One model, three doors.

## Where AI sits

AI lives in three seats, always constrained to recommend from what's real, never to invent:

- **Customer-side (storefront):** an ideation engine — occasion, theme, budget in, ranked real packages out. A second door into the same checkout the browse-by-category flow uses.
- **Admin copilot:** drafts a new unit listing from a photo (specs, suggested price band), and answers "how do I add a themed unit" instead of a help manual.
- **Gig matching:** once a booking exists, auto-drafts the gigs needed and suggests which contractors to send them to first.

Freedom stays low on pricing and package creation by design. AI drafts, a human approves. This is not a fully autonomous system.

## Stack

- **Database:** Postgres on Railway. Single source of truth from day one.
- **Frontend:** Vercel.
- **DNS:** Cloudflare.
- **Design system:** cream (`#F9F7F3`) ground, white cards, charcoal (`#211D1C`) type, taupe (`#8B7355`) labels, orange (`#F49B1F`) single accent. Inter font. Light mode locked (no dark mode). shadcn/ui + Tailwind + Lucide icons. Photo-plate placeholders with warm gradient overlays.
- **Copy voice:** matter-of-fact, short sentences, no exclamation points, no em dashes, no emoji.

## Payments and contracts

- **Deposits:** SwipeSimple payment links, 10 to 20 percent of package price. Exact percentage rule not yet locked with Andy.
- **Contracts:** e-sign, embedded rather than built in-house. Vendor not yet chosen (SignWell vs. Documenso).
- **Contractor payouts:** stay off-platform. The platform tracks what's owed and shows an invoice-received view; it does not move money to contractors. This keeps W-9 collection and 1099-NEC filing off the platform's scope.

## Marketing and lead tools (unchanged, adjacent)

n8n stays exactly as it is for lead drip and SMS. The CRM reads n8n's engagement data (opens, clicks, replies) but does not replace or rebuild n8n.

## SMPL

SMPL CRM is out. Andy approved building the CRM in-house rather than adopting SMPL. To protect him if this relationship or plan ever changes, every record in the platform must be exportable as CSV from day one. That CSV export is Andy's insurance policy, made real in the architecture, not just a promise.

## Multi-tenancy note

This is being built GO-only for now, but every table should be designed knowing which company owns each row (a `company_id` or equivalent on core tables), because this may become the seed of a broader Path Intelligence product later. This costs a little extra design discipline today and avoids a rebuild later. Confirm with Anthony before treating this as settled — it was raised as an open question, not yet a final decision.

# GO-ROADMAP.md

Epics, phases, and the backlog for The GO Event Group booking platform. Read alongside `GO-PRODUCT.md` (architecture) and `GO-LOG.md` (running decision log).

---

## The three epics

Sequenced this way because each epic makes the next one's data exist. Building them out of order means building on top of nothing.

### Epic 1: Storefront + CRM spine
Customer-facing booking flow, backed by the real Item/Unit/Package/Theme data model instead of a click-through demo. Includes the leads inbox reading n8n engagement data, and gap tracking (unbooked dates against inventory).

### Epic 2: Admin command center
Desktop-first tool for Andy and Mel: inventory upload and editing, units and calendars, packages and themes with a review queue, pricing with a custom-quote lane for large corporate jobs, and the AI copilot.

### Epic 3: Crew and gigs marketplace
Invite-only contractor onboarding, skill tags and private tiers, per-person gig offers, accept/counter, acceptance triggers a contract automatically. Payouts stay off-platform. Built last: it is the heaviest epic and depends on the other two existing first.

---

## Now

- Reconnect the local Claude Code build (screens 1 through 6 of 12, built in the wrong local folder) to the real `go-parties-app` GitHub repo. Push. Import to Vercel so Anthony and Andy have a live link.
- Resolve the inventory flags with Andy: 8 open questions in `GEG-Master-Inventory-v2.xlsx` (Flags for Andy tab), covering pricing and specs on the newly added items (generators, projectors, charging stations, cubbies/lockers), plus a possible duplicate (Balloon Backdrops vs. Balloon Drops and Walls).
- Reconcile the old 14-flag list from `GEG-Master-Inventory-v1.xlsx` if that file resurfaces. It covered licensing on themed bounce houses (Bluey, Spider-Man), duplicate or ambiguous items, and unpriced power equipment. The v2 flags list does not yet include these.
- Get Andy to send the unit-level inventory list: how many of each item GO actually owns. This is the single hardest blocker. Without it, availability cannot be real anywhere in the app.
- Continue front-end screens 7 through 12: What's In It, Add-ons (with sticky total), Where's the Party (map plate), Review, Held, My Party.

## Next

- Design the real Postgres schema for Item, Unit, Package, Theme, Gig, Booking, Client, Contract, Payment.
- Replace the fake JSON unit calendar with real availability logic, once unit counts exist.
- Wire SwipeSimple deposit links into the real booking flow.
- Choose an e-sign vendor (SignWell vs. Documenso) and integrate contract generation.
- Build the theme-to-package AI recommendation layer (draft by AI, approved by Mel).

## Later

- Admin command center build-out (Epic 2 in full): inventory management, pricing rules, copilot.
- Crew and gigs marketplace (Epic 3 in full).
- Customer portal, drip nurturing, and the 12-year win-back campaign (needs the customer history list, not yet received).
- Self-serve configurator at GO's `/parties` lane, with AI-based inventory matching. Gated on the unit-level inventory list above.
- CSV export tooling for every table, as Andy's SMPL exit door (see `GO-PRODUCT.md`).

## Andy's inbox (blocked on him, not on us)

- Unit-level inventory counts (see Now, above — this is the real bottleneck).
- Pricing and specs for: Large Generator, Quiet Generator, Off-Grid Power Solution, Battery-Powered Quiet Music Power Supply, Projectors, Cell Phone Charging Stations, Cubbies/Lockers.
- Confirm whether Balloon Backdrops is a distinct SKU from Balloon Drops and Walls.
- Confirm whether "Karaoke" is equipment-only or comes with a host.
- Break down which items are sourced from innovativeinflatables.com as owned inventory vs. subcontracted overflow vs. just a naming reference.
- Deposit percentage rule: flat, or does it vary by occasion (weddings likely need more than a bounce house rental).
- Contractor default rates: does Andy type a number per gig, or do contractors have default rates he adjusts?
- Whether he's aware the plan is now "GO builds its own CRM" rather than "no CRM" — worth confirming out loud, framed with the CSV exit door.

# GO! Event Group · Brand and Product Rules

Read fully before writing any UI or copy. These rules are not suggestions.

## 1. Essence
- Line: **Party on. We'll handle it.**
- Attitude: matter-of-fact with a grin. Chill. Confident. Never salesy, never cute.
- Job of the product: make throwing a party feel like two minutes of easy decisions. Kids, adult, wedding, corporate. Same ease every route.

## 2. Naming
- Wordmark in app: **GO! EVENT GROUP** (orange "GO!", charcoal "EVENT GROUP"), after the round badge logo (`public/brand/go-logo.png`, the orange monogram on black, 40px, links to Home; the badge alone on a phone).
- Listings and legal: **The Go Event Group**.
- The product has no sub-brand. It is GO's app. Never invent a product name.
- Never use the phrase "party in a box". Never.
- The in-app assistant is **Ask GO**. Not a character, not a mascot.

## 3. Color tokens
| Token | Hex | Use |
|---|---|---|
| cream | #F9F7F3 | page ground |
| white | #FFFFFF | cards, sheets, nav |
| line | #E8E2D9 | borders, dividers |
| charcoal | #211D1C | headlines, primary text, dark buttons |
| charcoal-soft | #4A4340 | body copy |
| muted | #8C847C | secondary text, placeholders |
| taupe | #8B7355 | small-caps labels only |
| orange | #F49B1F | the one accent: primary button, selected state, progress |
| orange-deep | #D9820A | primary button hover |
| orange-tint | #FDF1E0 | selected chip and row background |
| good | #3E8E4A | availability dot, paid, confirmed |
| error | #B23A2E | error text, the red left rule, the red border on a field in error (Block S2) |
| error-tint | #FBEAE8 | the ground behind an error message |

Rules
- Orange appears **once per screen** as the action. If two things are orange, one is wrong. The one exception is the Home hero (Block S4), where the title's second line, the two slashes and the chosen half of the switch are orange by design, after `docs/hero-prototype.html`; the panel under it keeps one orange button.
- No dark screens. Dark only lives inside photo gradients and the dark button.
- Lock the app to light: `color-scheme: light only` on root, cream on html and body. OS dark mode must not flip the app.

## 4. Type
- Family: **Inter**. Only Inter.
- Weights: 900 headlines, 800 buttons and prices, 700 card titles and labels, 600 row titles, 400 body.
- Scale (mobile): hero 32/1.08, screen title 26/1.1, section 20, card 14, body 14.5/1.55, small 12, label 11 tracked 0.14em uppercase.
- No italics anywhere. No all-caps except the label style.
- Letter-spacing negative on headlines (-0.015em), positive only on labels.

## 5. Spacing, shape, elevation
- 4pt grid. Screen padding 20. Card padding 12 to 16. Gap between cards 8 to 10.
- Radius: cards and inputs 12 to 14, chips 12, buttons 12, sheets 20 top corners, plates 14.
- Borders 1px line on cards, 1.5px on interactive controls.
- Shadow only on floating things (sticky total, sheet): 0 10px 30px rgba(33,29,28,.12).

## 6. Imagery
- Real photos by Mel. Candid, warm, daylight, real Connecticut backyards and venues, real crew. No stock, no renders.
- Photo treatment: bottom gradient to charcoal at 72% so white type can sit on any photo.
- No image yet: the one placeholder (`ImagePlaceholder`): a light warm grey box with a grey mountain and sun drawn inline, no text, no gradient, never a silhouette. Items, categories, packages and heroes all use it. Lazy-load below the fold, always with width and height or an aspect ratio.
- Until photos exist use **photo plates**: warm gradient (taupe, slate, amber, stone variants), faint 135° texture, corner marks, spec line at top `MEL · 01 · BACKYARD WIDE · 4:5`. The spec line is Mel's shot list. Swapping a plate for a photo changes one file.
- Ratios: hero 4:5, package hero 4:3, rail card 5:4, occasion card 1:1, thumbnails 1:1.

## 7. Icons
- No icons anywhere in the storefront (Block S1), with one exception since Block S2: the phone header's hamburger (an inline SVG of three horizontal lines, 24px, charcoal, aria-label "Menu", in a 44px tap target) that opens the menu panel. Every other control is a word ("Close", "Remove", "Back", "Earlier", "Later"). The only other marks allowed are native checkbox and radio marks, the "×" on a removable filter pill, and whatever Stripe draws inside its own frame.
- No emoji in UI, copy, or data. Ever.

## 8. Components (what exists, and the rule for each)
- **Button**: primary orange, dark charcoal, ghost white with line border. 15px/800, padding 15x22, full width on mobile forms. One primary per screen.
- **Chip**: guests, times, budgets. 3 per row (2 for budgets). Selected = orange border + orange-tint fill. Sub-label allowed.
- **Contract document** (`/sign/:token` only): the one place a serif face is used (`font-serif`, from the device: Georgia, then Iowan Old Style, Palatino, Times), for the contract sheet; the letterhead is the sans wordmark set large and letter-spaced over a double rule; clauses are numbered; the signing form, buttons and messages stay sans.
- **Month calendar + time input**: a standard month grid with prev and next arrows and a bold "October 2026" between them, weekday initials, dates in weeks. Every day not in the past is white with a green dot and tappable; past days are quiet and untappable; the chosen day is orange. Tapping a day reveals, in order, the live availability card, the short-notice card when it applies, and a time input (quarter-hour steps, 7 AM to 11 PM, optional) with a muted setup hint.
- **Photo plate / photo card**: see imagery. Occasion cards are 1:1 plates with the name bottom-left.
- **Item thumbnail**: the admin's item photo, square, object-cover, 10px radius: 56px on Browse rows, 44px on cart rows and held lines, 36px in the Ask GO list. No photo (or one that fails to load) is the photo plate at the same size, no corner marks or spec line at that scale. Never a blank space.
- **Item description** (Block S5, the admin's `description` from Block A7): one or two lines in 12px charcoal-soft directly under the item name on the store card, the Ask GO cart row and the cart drawer row, clipped to two lines (`line-clamp-2`). Nothing is rendered when it is null; the card does not keep the space.
- **Price on request** (Block S5): an item with a null price shows "Price on request" where the price goes, in the price's weight and size, with no unit after it. Its button reads "Ask about this" (dark, the same shape as Add) and opens Ask GO with "Tell me about {name}" as the first message. It never goes in the cart: not from the store, not as an Ask GO swap, and "Book this party" leaves it behind with a line under the total saying so. The price filters skip it; "Priced items only" hides it.
- **Recommended rail**: horizontal, snap, 168px cards, photo 5:4, name, price, one line, next open date in green.
- **Package hero**: 4:3 plate, then name left and price right with "before add-ons" under it, then the inclusions list with green check icons.
- **Package select**: native `<select>` for switching packages. Native on purpose: identical on every browser and phone.
- **Item row with Swap**: thumbnail, name, category, Swap button that unfolds alternatives with price deltas.
- **Add-on row**: thumbnail, name, category, price, plus button. Selected = orange-tint. Live total in a **sticky bar** above the nav.
- **Sheet**: bottom sheet for Ask GO and any secondary flow. Never a modal popup.
- **Bottom bar** (phone only): Home, Shop, Ask GO, My party as text, the active one with an orange top rule. Fixed, white, safe-area padded. Four, never five. From 641px the header's text row takes over.
- **Header**: badge, search, "Party date", dark "Cart (n)"; one wrapping nav row (Home, Shop all, Ask GO, My party). On a phone, row 1 is the badge, a "My party" text link, "Cart (n)" and the hamburger; row 2 is the search. Never a sideways scroll, in the header or anywhere.
- **Cart drawer**: from the right on a desktop, a bottom sheet on a phone. The customer's assembled selection is "Cart" everywhere since Block S2 (the header button, the drawer title "Cart · {date}", the Ask GO panel and bar); "My party" is the portal and nothing else. Never "party board".
- **Error notice** (`ErrorNotice`, Block S2): the one error style. Red (#B23A2E) text on a light red (#FBEAE8) ground with a 4px red left rule, radius 12, `role="alert"`, placed directly above the button whose action failed and scrolled into view when it appears. A field in error gets a red border (`aria-invalid` on the Input) with the message in red directly under it (`FieldError`). Never an error in white, grey or the normal text style. Success and information keep their quiet styles.
- **Home hero** (Block S4, `src/components/go/Hero.tsx`, after `docs/hero-prototype.html`): one photo across the top from `GET /api/hero` (the shipped photos in `public/photos/welcome` when the feed fails or is empty), crossfading every 6 seconds with a slow zoom (no zoom, a quick fade under prefers-reduced-motion), dots to jump (bottom right on a desktop, top left on a phone, 44px tap targets). Desktop: full container width, radius 20, `clamp(460px, 46vw, 600px)` tall; phone (640px and under): edge to edge, no rounding, 600px. Layers in order: a soft-light orange tint (#F49B1F at 35%), a charcoal gradient (desktop: strong on the left clearing by about 70% across plus a fade from the bottom; phone: strong from the bottom up), two orange slashes skewed -18° on the right edge (the catalog motif). Copy bottom left: the eyebrow in #F7C77A, the title with "done door to door." in orange, one line in #E8E1DA, the label "How do you want to plan?" in #CFC8C2.
- **Hero switch** (on the photo, every width): a frosted track (white 14%, blur 10px, white 22% border, radius 16, 5px padding, up to 560px wide) with two halves, "Build my party / Tell GO what you're planning" and "Shop by category / Pick items yourself"; the chosen half is an orange pill with charcoal text. `role="tablist"` / `role="tab"` with `aria-selected`. It picks the one panel directly under the hero: the white Ask GO box ("Tell GO about your party") or the category tiles.
- **Callout** (Block S7, the questionnaire's NOTE, TIP, AUDIO and FIRST LOOK boxes, the admin's `note` items with a tag): a charcoal box, radius 12, the tag in orange small caps on the left, white 13px text. The one place orange text sits inside a dark box; it is a label, not an action. A note with no tag is a plain line of text under the section title.
- **Questionnaire fields** (Block S7, `src/pages/PartyWedding.tsx`): every field type the admin's template can send. text, time and handle are the Input (a handle prints "@" or "#" as plain text before it); textarea is the same style, resizable; checkbox is a native box with a 44px row, and the admin's `group` item is a cream box under its sub-heading with the item count and its boxes in two columns from 641px, one on a phone, like the PDF; `multi` is a labelled list of boxes whose value is the chosen option values; choice is a row of large tap targets, the chosen one charcoal with white text (role radio); rank is one native select per option, 1 to 3, a place taken by one option disabled in the others. A prefilled field is read-only on cream with "From your booking. To change it, call or text GO." under it. Field labels are the 11px small caps. A field the admin refused gets the red border and a plain line under it ("That didn't save. Check it and try again.", or "That's too long. Shorten it and it will save."), never the admin's own message, which names the field key. The admin's section titles arrive in capitals and are shown in sentence case.
- **Tap targets** on a phone: 44px tall at least. Text inputs 16px so iOS Safari does not zoom. No position:fixed inputs on a phone.
- **Progress marker**: 4px bars skewed -24°. The only diagonal in the system.

## 9. Motion
- Screens: elements rise 10px and fade in over 380ms ease.
- Reveals (times under a day): max-height 300ms ease.
- No page wipes, no parallax, no bouncing. Motion confirms, never decorates.

## 10. Copy voice
Principles
- Say the thing. Short sentences. Verbs first.
- Matter-of-fact, then a little warmth. "Held. You're good."
- Prices are always visible and always real. "from $1,600" when it varies. An item the admin has not priced yet reads "Price on request" in the price's own weight, never "$0" (Block S5).
- Prices print whole ("$1,899") unless the admin's number has cents ("$97.60"). The unit follows the price in small text (per day, per event, per hour, per guest, each, per section, per 10 guests); "per guest" and "per hour" are printed even on a compact row, since they change what the number means.
- Talk about the party, not the company. Never "we are proud to".
- Assume competence. No hand-holding paragraphs.

Punctuation and format
- No exclamation points. The grin is in the rhythm, not the punctuation.
- No em dashes. Use a period, a comma, or "and".
- Sentence case everywhere except labels.
- Numerals always: 2 hours, 25 people, $1,899. Commas in prices.
- Times as 10 AM, 2 PM. Dates as Sat Sep 13.

Bank (use these, extend in this register)
- Greeting (label): Hey Sarah (signed in, first name) / Hey there (signed out, or no name on the account)
- Sign in: see Portal sign in. There is no gate; it lives in the Menu and on My party.
- Home: What are we celebrating? / Ask GO (label) / The AI event builder. / Tell it the party. It builds one from what's actually in the warehouse, real items, real prices. / Build it with Ask GO / Build your own. Pick a day, add what's open. (row, right label Build) / Or pick the occasion (label) / What kind (label) / Packages for Birthday (label, the sub-occasion) / See what's open (button into Browse) / Finding packages. / No packages for Birthday yet. Ask GO can build one, or build your own. / 3 items, all real (card line) / Continue
- My party, recommended stub: Recommended for you / Book a few things and picks for you show up here.
- Cart rows (every checkout step): trash can per item, aria "Remove {item}" / Snow Cone Station x 2 (quantity on the row) / Total / Package price, Backyard Bash. (under the total when the cart is a package)
- Home (Block S1, hero S4): Farmington, CT · 5.0 on Google / Parties and events, done door to door. / Bounce houses, games, DJs, photo booths and lighting. The GO crew delivers it, sets it up and takes it down. / How do you want to plan? (label over the switch) / Build my party / Tell GO what you're planning / Shop by category / Pick items yourself / Photo 1, Photo 2 (dot labels) / Tell GO about your party (the Ask box label, S4; was "Not sure what you need? Ask GO.") / Kid's birthday, 25 guests, backyard, about $800 (placeholder) / Graduation party, Company picnic, Sweet 16 (pills) / See all 367 items / Not listed? Ask GO / Something else / Party packages / Add package / No packages yet. Ask GO can build one, or shop by category.
- Header and menu: Search bounce houses, DJs, photo booths (placeholder) / Party date / Pick a date / Cart (3) / My party (phone header link) / Menu (the hamburger's label) / Close / Shop / All items / Account / Ask GO about "{text}" / Category (suggestion sub-label)
- Date sheet: Party date / Tap a day. We show what's free on it. / {Day}. Tap another day to change it. / Clear date / Done / Earlier, Later (month buttons)
- Catalog load: Loading the catalog. / See the store / That didn't go through. Try again (link)
- Store: Filters (2) / Sort: Featured / Price low to high / Price high to low / Name A to Z / Category / Availability / Free on {date} / Pick a date to see what's free / Price / Under $200 / $200 to $500 / $500 to $1,000 / Over $1,000 / Priced items only (S5, off by default) / Clear all / Show 9 items / 9 of 424 items / Loading the catalog. / Free on Nov 14 / Booked Nov 14 / Add / Added 1 / - and + (drawer quantity; aria Fewer and More) / Nothing matches that yet. / Ask GO to find it
- Price on request (S5, an item with no price yet): Price on request (where the price goes, in the price's weight) / Ask about this (its button, in place of Add) / Tell me about {item name} (the first message it sends to Ask GO) / 1 item is priced on request. It stays out of checkout; ask GO about it. / 2 items are priced on request. They stay out of checkout; ask GO about them. (under the Ask GO cart total)
- Category order (S5, everywhere a category list is shown): Bounce Houses, Inflatables, Rides and Attractions, Games, Fun Foods, Catering, Bar and Cigar, DJ and AV, Entertainment, Photo and Video, Lighting and Decor, Dance Floors, Special Effects, Venue Essentials, Planning and Staff. Never alphabetical, never the admin's order. A category with no visible item is not shown.
- Cart drawer: Cart · {date} / Nothing yet. Add items or a package. / 1 × $250 / 1 × $45 per hour (the unit only when it is per guest or per hour) / Remove / Total / Checkout asks you to agree to the rental policy. / Checkout includes GO's contract to sign. / GO reviews this one and sends you a proposal. / $75 today holds the date. / Pick a date to see what checkout asks for. / Keep shopping / Checkout
- Ask GO page: Tell me the party. I'll build it. / Thinking. / Describe your party / Tell GO what to change (placeholders) / Send / Add something for the parents, Keep it under $800, It might rain (quick replies) / Your cart: 5 items, $813 (chat summary card) / Updated just now / See it / Chat / Cart (5) / GO just updated this / GO just updated it / Built for {date} / Built from the catalog / No date yet / Swap / Close / Remove / Also free {date} / Also in this category / Nothing else in {category} is free that day. / Your cart is empty. Ask GO or add items from the shop. / Add an item from the shop / Due today to hold the date (30%) / Checking what checkout will ask for. / Pick a party date to see what checkout asks for. / Cart: 5 items · $813 (pinned bar) / See your cart / Book this party / Switch to this / Ask GO what else is open (portal change item)
- Result tags (in place of the old icons): Held / Pending / Requested / Paid / Signed / In review / Booked (crew page) / The map didn't load. Your pin stays on the address.
- Browse: Pick a day. See what's open. / Tap a day. We show only what's open. / Open Sat Dec 5 (label) / 12 items / Bounce house, DJ, snow cones (placeholder) / All (category chip) / Checking the calendar. / Nothing open by that name Sat Dec 5. Try another word, or another day. / 2 open / Add / Added / Text us for a price
- Cart: 3 items · Sat Dec 5 (sticky line) / 1 not open / Check out / In the cart / Nothing in it yet. / Remove / Total / Snow Cone Station isn't open Sat Dec 5. / Not open Sat Dec 5. Remove it or pick another day.
- Menu: Menu / Signed in as / My party / Sign in / Create account / Sign out
- Date: When's the party? / When's the night? / When's the big day? / When's the event?
- Availability hint: Grayed days are booked solid, crew and gear included.
- Add-ons: Make it yours.
- Item options (add-on groups from the admin, always shown under the item they belong to): Make it yours. / A few picks before the day. Each one sits under the thing it's for. / Choose one, Choose any, Choose up to 2 (group mode, S1.2) / Required / Optional / Included / +$75 / -$25 / +$75 each (quantity above one) / Still needs: Sidewalls. / Large group (more than 6 options, a search input over a scrolling list): Search 15 options (placeholder) / Picked: Navy, +$10 / Nothing picked yet. / Nothing by that name. Try another word. / Everything else is ready as is. / Sidewalls: Full walls (choice line, under its item) / Change / Pick options / Options: Surface, Banner (Browse row) / A couple of picks and it's in. (Browse sheet) / Add to cart · $425 / Save · $350 / Package price, Backyard Bash, plus what you picked.
- CTA: Hold my date / Next / Back / Done
- Crew gig page (`/bid/:token`): Gig / Pay range: $250 to $350 for the whole gig / Bids close Thu, Oct 2 at 9:00 AM. / Your bid, Change your bid / Dollars for the whole gig / Note (optional) / Anything we should know / Submit bid, Update bid, Decline / Bid in: $300. You can change it until bids close. / Decline this gig? You won't be able to bid on it after. / Keep it, Decline it / Refusals: Bids closed before that went through. / Someone else already has this gig. / Enter a whole dollar amount, like 250. / This gig isn't taking bids right now. / Too many tries. Give it a minute and try again. / Notices: Not this one. We went another way on this gig. Thanks for bidding, and watch your texts for the next one. / Bids are closed. This gig stopped taking bids. Text us if you still want in. / You passed on this one. Changed your mind? Text us and we'll take a look. / The gig: {role}, {date} / Gig page: {Name}, you're on this one. / Address, Arrival, Day-of contact / I'm set / You're set. Confirmed Wed, Sep 30 at 9:16 AM. / Questions, Something to ask us?, Parking, power, timing, Send question, Sent. GO will call or text you back. / Opening your gig. (the invalid link and load failure notices reuse the contract page's words)
- GO contract form (`/sign/:token`, format go-v2): the form's own words are the admin's and the paper's, not the app's (black bars, orange headings, "THIS IS YOUR OFFICIAL CONTRACT"); the orange-once rule and the no-exclamation rule yield to the document on this page. Page copy around it: Please read this contract all the way through. The signature lines are at the bottom of the form. / Type your full name (printed name box) / Optional (additional signer box) / Typing your name on the form is your legal signature. Tick the box above the signature lines to sign electronically. / Sign contract / Signed. Thank you. / Your contract is signed and on file. Nothing more to do here. / Already signed. / This contract is signed. There is nothing more to do here.
- Contract signing: Event Services Agreement / Please read this agreement all the way through, then sign at the bottom. / Your full name / Typing your name here is your legal signature. / Sign contract / Signed. Thank you. / Already signed. / Open your signed contract (PDF) / This link isn't valid. / Check the link in your text message, or text us and we'll send you a fresh one. / This contract was already signed. Nothing more is needed from you. / This contract was updated since you opened it. Please refresh the page and read it again before signing. / Refresh this page
- Sent to the team (202): Our team takes it from here. / {the admin's message} / Nothing is held and nothing is charged. We'll reach out by phone or email.
- Balance line (who and account, S2, in place of the preference chips): Your balance of $X is due N days before your event. We'll email you a secure payment link. / Your balance is due before your event. We'll email you a secure payment link. (until the admin publishes the day count)
- What happens next (who and account, S2, per tier): Your retainer is next. Paying it holds the date. (tier 1) / This booking comes with a contract. You'll read and sign it on the next screen, then pay the retainer. (tier 2) / Nothing to pay yet. GO reviews this one first and sends you a proposal. (tier 3)
- Browse occasion row: Planning something? Optional. / Kids party / Adult party / Wedding / Corporate / Just browsing
- Checkout contract: Your contract / Read it all the way through, then sign on the form. Signing holds the date. / Jump to signature / Read through to the signature lines at the bottom of the form. / Sign and hold my date / Signing / Your cart or the contract changed. Please read it again. / Preparing your contract.
- Retainer (checkout and portal): Your retainer / Your 30% retainer holds the date. It is non-refundable. / Retainer (label) / Pay later / Continue / Checking with our booking system. / We haven't heard back from the payment yet. Your hold stands either way; My party will show it as paid once it lands. / Paid. Your date is held. / Signed and paid. Your date is confirmed. / {Day} is yours. The rest lives in My party. / Online payment is coming soon. GO will follow up to collect your retainer. / Online payment is coming soon. GO will follow up to collect your balance. / Stripe's form would be here. This is the local mock. (dev only) / Simulate payment (dev only)
- Held, tier 2: Signed. Your date is requested. / {Day} is yours once the retainer is paid. Pay it any time from My party. / Held, retainer due: {Day} is held. Your retainer is still due; pay it any time from My party.
- Portal steps: Sign your contract / Pay your retainer / Pay your balance / Review your proposal / Confirm the new date / Sign / Pay retainer / Pay balance / Done / Waiting on GO / After the step above / Your signed contract (PDF) / To change or cancel, call or text GO at {phone}.
- Portal contract: Your contract / Read it all the way through, then sign on the form. / Sign contract / Signed. / Signed. Thank you. / Your contract is signed and on file. The retainer is the next step. / This contract is signed and on file. / Back to My party / There is no contract on this booking.
- Portal pay: Your balance / The rest of your total, due before the event. / Getting the amount. / Nothing is due right now. / Paid. Thank you. / Your retainer is in. Your booking shows it in My party. / Your balance is settled.
- Policy: Read the policy to continue. / Read the full policy / Show less / I have read and agree to the rental policy
- Held: Held. You're good. / Pending (short notice): Pending. We'll be in touch. / {Day} is on our list. It's short notice, so a person confirms it first and texts you soon. / Need it faster? Call or text {phone}. (phone only when set)
- Short-notice warning: This date needs at least {hours} hours notice to book automatically. We'll still hold this as a pending booking. / If you need it faster, call or text us at {phone}. (second sentence only when a phone is set)
- Time: What time / Leave it blank and we'll settle the time by text. / Consider booking about an hour before you need it, for setup. / We book between 7 AM and 11 PM. Pick a time in that window.
- Empty: Nothing here yet. Build a party and it'll live here.
- Error (always the red notice, S2): That didn't go through. Try again, or text us. / Try again (button under it; the admin's own wording is never shown except for a date that is taken or an item that isn't bookable)
- Address (Block M): Please choose your full street address from the list. / Drag the pin to where we should set up / That's far from the address. Is the spot right? / Setup notes (label) / Backyard, gate on the left (placeholder) / Optional. Where the crew should set up, in a line. / We'll confirm your exact address by text. (no key) / Open in Maps (portal card and crew page) / Setup: {notes} (held screen and portal card)
- Item (direct booking): When do you need it? / Tap a day. We check the calendar live. / Checking the calendar. / Open. 2 of 2 ready. / Booked solid that day. Try another date. / Only 1 open that day, this needs 2. Try another date. / Only 1 open, this needs 2. (per-item line) / Who's booking? / Name, phone, and email. That's it. / Signed in: We've got your details. Just the address. (both replaced by Event details in S3) / Booking as
- Portal, signed out: Your bookings live here. / Sign in and they'll show up. / Sign in / Create account
- Portal sign in: Welcome in. / Phone or email, then your password. / New here? Create an account
- Portal sign up: New here. / Phone, email, a password. That's it. / 8 characters or more. / Have an account? Sign in / Already on an account (S2, under the field, with a "Sign in" button that opens sign in with it filled in): You already have an account with this email. Sign in to continue. / You already have an account with this phone number. Sign in to continue. / You already have an account with this email or phone number. Sign in to continue.
- Portal booking stages (real stage, never the old status): Held: Your date is held. / Requested: Your date is requested. Sign the contract and pay the retainer to confirm it. / Contract ready: Your contract is ready to sign. / Signed: Contract signed, thank you. The retainer confirms the date. / Retainer paid: Retainer received, thank you. Signing your contract confirms the date. / In review: Big events get a personal look. We'll reach out within one business day. / Proposal ready: Your proposal is ready. GO will walk you through it. / Released: This hold wasn't confirmed in time, so the date was released. Book again, or call or text us. / Contract sent: Booked, contract on its way. Sign it and pay the retainer to lock the date in. / Signed: Contract signed, thank you. The retainer is the last step to lock the date in. / Retainer paid: Retainer received, thank you. Signing your contract is the last step. / Confirmed (signed and paid, the only green): Signed and paid. You're all set. / Completed: This one already happened. Thanks for having us. / Cancelled (outlined tag): This booking was cancelled. The date is open again.
- Portal bookings: Hey Sarah / Your bookings / Reschedule / Change item / Cancel / Cancel this booking? The date opens back up. / Keep it / Cancel it / Cancelled. / Sign out
- Portal reschedule: When instead? / Now (label) / Move it / Moved.
- Portal change item: Something else instead? / Tell Ask GO what you'd rather have, then tap Switch to this on the item. Same date. / What would you rather have? / Switch to this / Switched.
- Concierge (a quiet option on the checkout's last screen, and the nudge under an Ask GO recommendation): Talk to us instead (small ghost link under Hold my date, a link to Calendly in a new tab) / Some parties are easier to plan with a real person. Grab 30 minutes with our team, on us. / Talk to GO Event Group (the Ask GO nudge button) / Booking opened in a new tab. Your cart stays right here. / Want to talk it through instead? (Ask GO nudge heading)
- Item held: Sat Oct 10 is held. We'll reach out to confirm and finish your booking. / Reply STOP anytime to opt out of texts.
- Review (202): Big events get a personal look. We'll reach out within one business day.
- Checkout sign-in step (S3, everyone not signed in; there is no guest path): Sign in or create an account / Your booking lives in My party. Your cart and date stay right here. / Sign in (chip, sub "Email and password") / Create account (chip, sub "Name, email, phone, address") / Email / Password / Continue (the button before a choice) / Sign in, Signing in / Create account, Creating / Please sign in or create an account to book. (the admin's 401, shown in red above the button)
- Home address (S3): Home address (label) / 14 Maple Ln, Farmington, CT 06032 (placeholder) / Where you live. Checkout can use it as the event address. (checkout sign-up) / Optional. Checkout can use it as the event address. (portal sign-up)
- Event details (S3, the step after sign in): Event details / Where the party is. The rest is on your account. / Booking as (card: name, phone, email) / Change (link to My party) / Your home address (label, only when the account has none) / Saved to your account for next time. / Same as my home address (checkbox) / Event address (label)
- My party, Your details (S3): Your details / Edit / No home address yet. / Name / Phone / Email / To change your email, call or text GO. / Home address / Cancel / Save, Saving / Saved. (toast) / Back to checkout (button, when the event step sent the customer here)
- Item CTA: Just this / Just these (2) / Next / Hold my date / Pick another date / Done
- Wedding details, My party row (S7): Wedding details / Not started / 6 of 10 done / Submitted Oct 2 / Due Oct 14 / Due in 9 days, Due in 1 day, Due today (red, within 14 days and not sent) / Fill in your wedding details / View your wedding details
- Occasion at checkout (S7.1, event details step): What are you celebrating? (label and select) / Pick one / the four groups as option groups (Kids party, Adult party, Wedding, Corporate) with their sub-occasions and "Other kids party", "Other adult party", "Other wedding", "Other corporate"
- Wedding details, the page (S7, `/party/:id/wedding-details`): Wedding details (label) / {Bride} and {Groom} (title; the booking's name until the names are typed) / {Sat Jun 12}. Works on computer or phone. / Opening your wedding details. / There are no wedding details on this booking. / Saving / Saved / Try again / Optional / Done / Open, Close (accordion) / Back, Next (desktop) / From your booking. To change it, call or text GO. / That didn't save. Check it and try again. / Still to fill in: Your film, Ceremony. / Everything required is filled in. / Send to GO, Sending / Submitted by {name} on {November 10, 2026}. GO has your wedding details. / Request a change / What should change? (label) / Tell GO what to change (placeholder) / Cancel / Send, Sending / Sent. GO will be in touch. / Back to My party. The section titles, subtitles, labels, options and callouts are the admin's template (the PDF's words, with "and" for "&", no exclamation points).
- Items together: When do you need them? / Snow Cone Station: Open, 2 of 2. / Test Gladiator Bounce House: Booked solid that day. / Try another date.

Don't
- "Unforgettable", "elevate", "seamless", "one of a kind", "dream", "magical", "premier".
- Questions the product should have answered itself.

## 11. Ask GO (the AI voice)
- Ask GO is a knowledgeable crew member, not a chatbot. It sounds like the copy: short, sure, chill.
- It never opens itself. Two doors only: the Ask GO card on Home and the Ask tab.
- Every answer is 1 to 3 sentences, then an action button. It recommends, then hands control back.
- It only recommends real packages and real add-ons from the catalog, with real prices. It never invents inventory or promises availability it hasn't checked.
- Uncertainty is stated plainly: "I'd have Mel confirm that. Want me to send it to her?" Custom quotes, weddings over $15k, and corporate over 150 people hand off to a human.
- Price language: exact when exact, "from" when it varies, "about" only for add-on totals.
- It never upsells with pressure. It can offer one better option once.
- No emoji. No exclamation points. No "Great question". No apologies for being an AI.
- Example: "Big Splash at $1,899. Water slide, two food stations, yard games, a speaker. Add snow cones. Done." then a button: Build that.

## 12. Accessibility and platform
- Text contrast 4.5:1 minimum on cream and white. Muted (#8C847C) is for 12px+ only.
- Touch targets 44px minimum. Chips and day cards already comply.
- Fixed bottom nav uses `env(safe-area-inset-bottom)`.
- Test on Safari iOS, Chrome Android, Chrome, Safari, Firefox, Edge. Internet Explorer is not supported (retired 2022).
- Mobile first at 390px, then 768, then 1024 where the app centers at 560px max. Desktop is the phone layout, centered, with more air. Do not invent a desktop layout.

## 13. Never
- Dark screens. Emoji. Italics. Exclamation points. Em dashes. Two orange elements. A fifth nav tab. A popup. "Party in a box". Stock photos. A product name.

# GO! Event Group · Brand and Product Rules

Read fully before writing any UI or copy. These rules are not suggestions.

## 1. Essence
- Line: **Party on. We'll handle it.**
- Attitude: matter-of-fact with a grin. Chill. Confident. Never salesy, never cute.
- Job of the product: make throwing a party feel like two minutes of easy decisions. Kids, adult, wedding, corporate. Same ease every route.

## 2. Naming
- Wordmark in app: **GO! EVENT GROUP** (orange "GO!", charcoal "EVENT GROUP").
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

Rules
- Orange appears **once per screen** as the action. If two things are orange, one is wrong.
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
- Until photos exist use **photo plates**: warm gradient (taupe, slate, amber, stone variants), faint 135° texture, corner marks, spec line at top `MEL · 01 · BACKYARD WIDE · 4:5`. The spec line is Mel's shot list. Swapping a plate for a photo changes one file.
- Ratios: hero 4:5, package hero 4:3, rail card 5:4, occasion card 1:1, thumbnails 1:1.

## 7. Icons
- **Lucide** only. Stroke 1.75, round caps. Charcoal at rest, orange when active, muted in the nav.
- No emoji in UI, copy, or data. Ever.

## 8. Components (what exists, and the rule for each)
- **Button**: primary orange, dark charcoal, ghost white with line border. 15px/800, padding 15x22, full width on mobile forms. One primary per screen.
- **Chip**: guests, times, budgets. 3 per row (2 for budgets). Selected = orange border + orange-tint fill. Sub-label allowed.
- **Month chips + day carousel**: months as a chip row (tap, no scroll). Days scroll horizontally, snap, 56px wide, green dot open, grayed booked. Tapping a day reveals time chips beneath it.
- **Photo plate / photo card**: see imagery. Occasion cards are 1:1 plates with the name bottom-left.
- **Recommended rail**: horizontal, snap, 168px cards, photo 5:4, name, price, one line, next open date in green.
- **Package hero**: 4:3 plate, then name left and price right with "before add-ons" under it, then the inclusions list with green check icons.
- **Package select**: native `<select>` for switching packages. Native on purpose: identical on every browser and phone.
- **Item row with Swap**: thumbnail, name, category, Swap button that unfolds alternatives with price deltas.
- **Add-on row**: thumbnail, name, category, price, plus button. Selected = orange-tint. Live total in a **sticky bar** above the nav.
- **Sheet**: bottom sheet for Ask GO and any secondary flow. Never a modal popup.
- **Bottom nav**: Home, Book, Ask, My party. Fixed, white, safe-area padded. Four tabs, never five.
- **Progress marker**: 4px bars skewed -24°. The only diagonal in the system.

## 9. Motion
- Screens: elements rise 10px and fade in over 380ms ease.
- Reveals (times under a day): max-height 300ms ease.
- No page wipes, no parallax, no bouncing. Motion confirms, never decorates.

## 10. Copy voice
Principles
- Say the thing. Short sentences. Verbs first.
- Matter-of-fact, then a little warmth. "Held. You're good."
- Prices are always visible and always real. "from $1,600" when it varies.
- Talk about the party, not the company. Never "we are proud to".
- Assume competence. No hand-holding paragraphs.

Punctuation and format
- No exclamation points. The grin is in the rhythm, not the punctuation.
- No em dashes. Use a period, a comma, or "and".
- Sentence case everywhere except labels.
- Numerals always: 2 hours, 25 people, $1,899. Commas in prices.
- Times as 10 AM, 2 PM. Dates as Sat Sep 13.

Bank (use these, extend in this register)
- Hero captions (Home carousel): FARMINGTON, CT / Party on. We'll handle it. / REAL DATES / If you can pick it, we can make it. / DOOR TO DOOR / Delivery, setup, the fun, teardown.
- Greeting (label): Hey Sarah (signed in, first name) / Hey there (signed out, or no name on the account)
- Sign in: see Portal sign in. There is no gate; it lives in the Menu and on My party.
- Home: What are we celebrating? / Ask GO (label) / The AI event builder. / Tell it the party. It builds one from what's actually in the warehouse, real items, real prices. / Build it with Ask GO / Build your own. Pick a day, add what's open. (row, right label Build) / Or pick the occasion (label) / What kind (label) / Packages for Birthday (label, the sub-occasion) / Finding packages. / No packages for Birthday yet. Ask GO can build one, or build your own. / 3 items, all real (card line) / Continue
- My party, recommended stub: Recommended for you / Book a few things and picks for you show up here.
- Cart rows (every checkout step): trash can per item, aria "Remove {item}" / Total
- Browse: Pick a day. See what's open. / Tap a day. We show only what's open. / Open Sat Dec 5 (label) / 12 items / Bounce house, DJ, snow cones (placeholder) / All (category chip) / Checking the calendar. / Nothing open by that name Sat Dec 5. Try another word, or another day. / 2 open / Add / Added / Text us for a price
- Cart: 3 items · Sat Dec 5 (sticky line) / 1 not open / Check out / In the cart / Nothing in it yet. / Remove / Total / Snow Cone Station isn't open Sat Dec 5. / Not open Sat Dec 5. Remove it or pick another day.
- Menu: Menu / Signed in as / My party / Sign in / Create account / Sign out
- Date: When's the party? / When's the night? / When's the big day? / When's the event?
- Availability hint: Grayed days are booked solid, crew and gear included.
- Guests: How many people. Rough is fine.
- Budget: Ballpark? No wrong answer. We build to the number and show what's possible.
- Package: Here's your party. / before add-ons
- Detail: What's in it. Swap anything. Price updates as you go.
- Add-ons: Make it yours.
- Where: Where's the party? / Gate width, stairs, dogs: tell the crew. We've seen it all.
- Review: Look good? / $200 holds the date for 48 hours.
- CTA: Let's go / Show me / Make it mine / Hold my date, $200
- Held: Held. You're good.
- Empty: Nothing here yet. Build a party and it'll live here.
- Error: That didn't go through. Try again, or text us.
- Item (direct booking): When do you need it? / Tap a day. We check the calendar live. / Checking the calendar. / Open. 2 of 2 ready. / Booked solid that day. Try another date. / Who's booking? / Name, phone, and email. That's it. / Signed in: We've got your details. Just the address. / Booking as / Nothing to pay right now. Contract and deposit link come by text.
- Portal, signed out: Your bookings live here. / Sign in and they'll show up. / Sign in / Create account
- Portal sign in: Welcome in. / Phone or email, then your password. / New here? Create an account
- Portal sign up: New here. / Phone, email, a password. That's it. / 8 characters or more. / Have an account? Sign in
- Portal bookings: Hey Sarah / Your bookings / Confirmed / Cancelled / Completed / Reschedule / Change item / Cancel / Cancel this booking? The date opens back up. / Keep it / Cancel it / Cancelled. / Sign out
- Portal reschedule: When instead? / Now (label) / Move it / Moved.
- Portal change item: Something else instead? / Tell Ask GO what you'd rather have, then tap Switch to this on the item. Same date. / What would you rather have? / Switch to this / Switched.
- Item held: Sat Oct 10 is yours. Contract and deposit link are on their way to your phone.
- Item, fill in later: Decide later (time chip, sub "No rush") / Add the address later. We'll text you for it. / Where: We'll text you for it
- Item account step (guests only): Make an account? / Sign in later to move it or cancel it. No account needed either way. / Create account (chip, sub "Phone, email, a password") / Continue as guest (chip, sub "No account needed")
- Item CTA: Just this / Just these (2) / Next / Hold my date / Pick another date / Done
- Items together: When do you need them? / Snow Cone Station: Open, 2 of 2. / Test Gladiator Bounce House: Booked solid that day. / Try another date.

Don't
- "Unforgettable", "elevate", "seamless", "one of a kind", "dream", "magical", "premier".
- Questions the product should have answered itself.

## 11. Ask GO (the AI voice)
- Ask GO is a knowledgeable crew member, not a chatbot. It sounds like the copy: short, sure, chill.
- It never opens itself. Three doors only: the dashed line on Home, "Ask about this package", the Ask tab.
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

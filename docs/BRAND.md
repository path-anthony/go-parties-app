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
- Welcome headline: Your party, built in two minutes.
- Welcome body: Pick the occasion. We build it from what's actually in the warehouse. You tweak it. We show up.
- Sign in: Welcome in. / No password. We text you a link.
- Home: What are we celebrating? / Not sure? Describe the party.
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

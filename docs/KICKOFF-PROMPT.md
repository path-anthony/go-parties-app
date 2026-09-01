# Paste this into Claude Code as the first message

You are building the customer-facing front end of a party booking app for GO! Event Group, a family event company in Farmington, CT. This repository already contains the rules. Start by reading CLAUDE.md, then docs/BRAND.md, docs/SCREENS.md, and both files in reference/. Do not write code until you have read all four.

Then:

1. Scaffold Vite + React + TypeScript + Tailwind v4, install shadcn/ui and initialize it with a neutral base, add Lucide, React Router, and the shadcn Button, Input, Select, Drawer, Carousel, Toast, and Switch components. Declare the color and type tokens from BRAND.md section 3 and 4 in src/index.css under @theme. Lock the app to light mode per BRAND.md section 3. Confirm `npm run dev` runs. Commit: `chore: scaffold`.

2. Build `/kit`: a page rendering the palette, type scale, photo plates, icons, and every component from BRAND.md section 8, all from the real components. Commit: `feat: design kit`.

3. Build the screens in docs/SCREENS.md order, one per commit, using the data objects copied from reference/GO-Customer-Journey-v1.html into src/data/catalog.ts and src/data/ask.ts. Match the reference copy exactly. Ask GO opens as a Drawer with the scripted responses.

4. After screen 6 (Your package), stop and report: what's built, what deviated from the reference and why, and a screenshot list I should check at 390px.

Rules that override anything you'd normally do: no emoji, no italics, no exclamation points, no em dashes anywhere, orange once per screen, no dark screens, mobile first, photo plates not images. If you are unsure about a copy string, use the bank in BRAND.md section 10 or write in that voice and add it to the bank.

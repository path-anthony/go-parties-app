# go-parties-app · working rules for Claude Code

Before writing any code, read in order:
1. `docs/BRAND.md` (design tokens, components, copy voice, Ask GO voice, the Never list)
2. `docs/SCREENS.md` (the twelve routes and what each must contain)
3. `reference/GO-Customer-Journey-v1.html` (the approved click-through; match structure and copy)
4. `reference/GO-Design-Schema-v1.html` (the approved schema page)

## Stack
- Vite + React + TypeScript
- Tailwind v4 with tokens from BRAND.md declared in `src/index.css` under `@theme`
- shadcn/ui components, restyled to the tokens (Button, Input, Select, Drawer, Carousel, Toast, Switch)
- Lucide icons only
- React Router
- No backend, no auth, no external images. Static data in `src/data/`.

## Non-negotiables
- Light only. `color-scheme: light only`; cream on html and body. Verify in iOS dark mode.
- Orange once per screen. No dark screens. No emoji. No italics. No exclamation points. No em dashes in code comments, copy, or docs.
- Mobile first at 390px; center at 560px max on desktop. Do not invent a desktop layout.
- Photo plates instead of images until `public/photos/` exists. Keep the spec line.
- Copy comes from BRAND.md section 10. If a string is not in the bank, write it in that register and add it to the bank.

## Process
- Build screens in SCREENS.md order. One screen per commit. Commit messages: `feat(screen): welcome`, `feat(screen): date`.
- After each screen: `npm run dev`, confirm it renders at 390px, then commit.
- Never restyle a shadcn component inline; change it in `src/components/ui/` so every instance follows.
- Design kit route at `/kit` renders every component from the same source. Keep it current.
- Ask before adding a dependency not listed above.

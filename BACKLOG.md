# Atelier Platform — Prioritised Backlog

_Consolidated from CTO, Product, and Design reviews — 13 March 2026_

---

## P0 — Ship Blockers

| # | Item | Source | Description |
|---|------|--------|-------------|
| 1 | **Fix `.gitignore` — dev.db exposed** | CTO | `dev.db` at project root is not ignored; only `prisma/dev.db` is. One `git add .` from leaking hashed passwords and user emails. |
| 2 | **Responsive sidebar & layout** | Design | Sidebar renders at full 260px on mobile with no collapse/hamburger. At 375px, content is completely unusable. Add `@media` breakpoints and drawer behaviour below 768px. |
| 3 | **Fix broken nav routes** | CTO | `/projects` and `/innovation` return 404 despite being primary sidebar links. Either add top-level `page.tsx` files or redirect to valid sub-routes. |
| 4 | **Responsive content grids** | Design | Stats grid, catalog grid, backlog table, and chat layout all need mobile breakpoints. |
| 5 | **Fix colour contrast (WCAG AA)** | Design | `--slate-400` (#b1aaa8) on white is ~2.5:1. Darken to at least #8a8280 for 4.5:1. Affects dates, subtitles, order IDs across the app. |

---

## P1 — Security & Infrastructure

| # | Item | Source | Description |
|---|------|--------|-------------|
| 6 | **Rate limiting on auth endpoints** | CTO | No rate limiter, account lockout, or CAPTCHA on login or registration. Brute force and email enumeration are wide open. |
| 7 | **Security headers** | CTO | `next.config.ts` has no `headers()` config. Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy at minimum. |
| 8 | **Strengthen password policy** | CTO | Current minimum is 6 characters with no complexity requirements. Enforce length ≥ 12 or add complexity rules. |
| 9 | **Migrate from SQLite to Postgres** | CTO | SQLite with no WAL mode will hit SQLITE_BUSY on concurrent writes. No connection pooling, no replication. Move to Postgres before real data lands. |
| 10 | **Secure `.env` / secrets management** | CTO | AUTH_SECRET is plain text in `.env`. Evaluate a vault or encrypted env solution before production deployment. |
| 11 | **Fix silent Slack webhook failure** | CTO | Registration Slack notification uses `.catch(() => {})`. Add logging or alerting so failures are visible. |

---

## P2 — Product & UX

| # | Item | Source | Description |
|---|------|--------|-------------|
| 12 | **Make Atelier AI the default new-project entry point** | Product | Route "New Innovation Project" through AI-assisted brief creation instead of a blank form. AI is the strongest differentiator. |
| 13 | **Onboarding activation — templates & sample data** | Product | Provide starter templates (e.g. "Anti-Dandruff Shampoo", "Vitamin C Serum") and pre-populated sample data so users hit their first "aha" within 5 minutes. |
| 14 | **Empty states as onboarding moments** | Product | Replace blank pages with contextual prompts: "Your formulation catalog is empty — browse 12 base formulations or ask Atelier AI to create one." |
| 15 | **Sample review flow** | Product | Build out `/samples/[id]/review` with photo uploads, sensory scoring (texture, scent, colour), and comparison notes. Close the iteration feedback loop. |
| 16 | **Gate onboarding completion** | CTO | Onboarding can be skipped entirely — middleware only checks session, not onboarding status. Decide whether to enforce or remove. |
| 17 | **Landing page / marketing site** | Product | Root URL redirects to login. Build a single-page public site with screenshots of dashboard, AI chat, and formulation detail to drive signups. |
| 18 | **Team invite growth lever** | Product | Add social proof nudge on dashboard for solo users: "Teams that collaborate ship products 40% faster. Invite your first teammate." |
| 19 | **Activity feed on dashboard** | Product | Add a timeline of recent activity ("Beck moved GRO-171 to Brief Under Review") to create daily return habit. |

---

## P3 — Design System & Consistency

| # | Item | Source | Description |
|---|------|--------|-------------|
| 20 | **Establish a type scale** | Design | Current: 7 sizes (10–28px) with imperceptible 1px jumps. Adopt a modular scale: 12 / 14 / 18 / 24 / 30. |
| 21 | **Unified Button component** | Design | Button sizing and padding varies per page. Create a single `Button` with `size` (sm/md/lg) and `variant` (primary/secondary/ghost) props. |
| 22 | **Replace emoji icons with SVGs** | Design | Quick Actions use native emoji (magnifying glass, box, star, clipboard). Renders inconsistently across OS. Use SVG icons matching sidebar icon style. |
| 23 | **Differentiate status badge colours** | Design | "In Development" and "In Production" share blue; "Launched" and "Delivered" share green. Each status needs a unique colour. |
| 24 | **Remove hardcoded hex values** | Design | Login error/success states use raw Tailwind hex instead of `--red-*` / `--green-*` tokens. Route all colours through CSS custom properties. |
| 25 | **Unify stepper components** | Design | Onboarding (vertical) and sample order (horizontal) steppers share zero visual DNA. Build one configurable `Stepper` component. |
| 26 | **Unify progress bar components** | Design | Three variants exist across dashboard and sample pages. Consolidate into one `ProgressBar` with configurable segments. |
| 27 | **Standardise page-level padding** | Design | Inconsistent padding between dashboard, backlog, new project, and settings pages. Pick one value and apply globally. |
| 28 | **Warm the brand blue** | Design | `--brand-400: #0069f1` clashes with the warm neutral palette. Consider `#2563eb` or a deep indigo to harmonise. |
| 29 | **Fix heading reset in globals.css** | Design | All headings reset to `inherit` — destroys semantic hierarchy and creates accessibility disconnect. Define base heading styles. |

---

## P4 — Polish & Accessibility

| # | Item | Source | Description |
|---|------|--------|-------------|
| 30 | **Add `:focus-visible` styles** | Design | No keyboard focus indicators on interactive elements (card rows, quick actions, nav items). |
| 31 | **Increase minimum text size to 11px** | Design | Status badges use 10px text — effectively unreadable for many users. |
| 32 | **Add error boundaries** | CTO | No React error boundaries. An unhandled throw shows the default Next.js error page and risks losing form data. |
| 33 | **Convert client components to server components** | CTO | 19 of 20 pages are `'use client'`. Pages that only display data (catalogs, backlog, team) should be server-rendered. |
| 34 | **Add loading states / skeleton screens** | CTO, Design | No visual feedback during page transitions or data fetching. Add Suspense boundaries and skeleton loaders. |
| 35 | **Bring "In Development" page into PlatformLayout** | Design | Currently renders outside the layout shell with no sidebar or navigation context. |
| 36 | **Page entrance transitions** | Design | Add subtle transitions when navigating between pages for a more polished feel. |
| 37 | **Backlog — hide empty columns** | Design | Priority and Due columns show "--" for most rows. Hide or collapse when data is sparse. |
| 38 | **Consolidate duplicate CTAs** | Product | "New project" button in header and "NEW INNOVATION PROJECT" in sidebar compete. Pick one. |

---

## P5 — Future Opportunities

| # | Item | Source | Description |
|---|------|--------|-------------|
| 39 | **Formulation cost estimates** | Product | Connect ingredient percentages and supplier pricing to show estimated formulation cost. |
| 40 | **AI-powered packaging recommendations** | Product | "This serum (50ml) is compatible with: Airless Pump Bottle, Amber Glass Dropper." |
| 41 | **Pipeline value on backlog** | Product | Show aggregate projected revenue: "15 items, $2.4M projected." |
| 42 | **Stakeholder share links** | Product | Read-only branded project views for investors or retail partners. |
| 43 | **Sample reorder button** | Product | One-click reorder on delivered samples to drive repeat usage. |
| 44 | **AI reasoning transparency** | Product | Show why AI recommended a formulation: "Matches your anti-dandruff claims and meets UK regulatory requirements." |
| 45 | **Packaging mockup generator** | Product | Logo upload onto packaging renders for emotional brand connection. |
| 46 | **Add tests** | CTO | Zero test files in the codebase. Start with auth flows, sample ordering, and formulation CRUD. |

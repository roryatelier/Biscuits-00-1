# Atelier — Deferred TODOs

_Items considered during the security/deployment review (16 March 2026) and explicitly deferred._

---

## 1. Upstash Redis Rate Limiting

**What:** Replace in-memory `Map` rate limiter in `lib/actions/auth.ts` with persistent Upstash Redis.

**Why:** Current rate limiter resets on every Vercel cold start (~30s idle). An attacker can brute-force by spacing requests across cold starts.

**Where to start:** Install `@upstash/ratelimit` + `@upstash/redis`, create a free Upstash Redis instance, replace the `isRateLimited()` function in `lib/actions/auth.ts:8-22`.

**Trigger:** Scale beyond 5-user trial, or if abuse is detected.

---

## 2. Unbounded List Query Pagination

**What:** Add pagination to `listFormulations`, `listProjects`, and `listSampleOrders`.

**Why:** These queries return all records with no limit. Fine at <100 records, but page loads will degrade at ~500+ records.

**Where to start:** Add `take`/`skip` parameters matching the pattern already used in `listActivities` (`lib/actions/activity.ts:43-49`). Add "Load more" UI to list pages.

**Trigger:** Page load time exceeds 2 seconds, or data volume exceeds ~200 records per entity.

---

## 3. CSP Nonce-Based Hardening

**What:** Remove `unsafe-inline` and `unsafe-eval` from Content-Security-Policy in `next.config.ts`.

**Why:** Current CSP allows inline script injection, weakening XSS protection. Next.js requires nonce-based CSP to work without these directives.

**Where to start:** Generate a cryptographic nonce in middleware, pass it via headers, configure Next.js to use it. See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

**Depends on:** Middleware is now re-enabled (done), so the nonce can be generated there.

**Trigger:** Before opening to users outside the team, or if handling sensitive PII.

---

# Chat/Cobalt Rebuild — Remaining Work

_Generated 17 March 2026 from live platform inspection + CTO/Design review._

**Completed:** Phase 0a (Data model — Conversation, Message, ResearchTask, Brief added to Prisma schema). Tool selection panel (PLAT01-2502). Collapsible RHP (PLAT01-2524). Multi-select regulatory market. 117 tests passing.

---

## Phase 0b: Layout shell — 3-panel system with breakpoints and transitions

**What:** Define the sidebar / chat / RHP proportions, collapse behavior, responsive breakpoints (1024px, 768px), and animation curves. The critical transition is "landing state → active conversation with RHP" — what appears when, in what order, with what animation.

**Where to start:** Refactor `app/innovation/chat/page.tsx` and `Chat.module.css`. Define max-widths, flex proportions, breakpoint behavior (sidebar → hamburger at 768px, RHP → bottom sheet or hidden on mobile).

**Acceptance:** Three-panel layout works at 1440px, 1024px, and 375px. Sidebar collapses to icon rail. RHP collapses with smooth animation. Landing state (no project) is centered full-width.

---

## Phase 0c: Design tokens — colour, typography, elevation, icon system

**What:** Audit `app/globals.css` and extend with semantic tokens (`--color-action-primary`, `--color-status-success`, `--color-surface-elevated`). Finalize type scale (the 11px/13px gaps). Define z-index layers (sidebar, RHP, modals, dropdowns). Pick icon library (currently custom SVGs in `components/icons/Icons.tsx`).

**Where to start:** `app/globals.css` — add semantic aliases for existing tokens. Audit all `.module.css` files for hardcoded hex values.

**Acceptance:** No hardcoded hex values in component CSS. Semantic tokens cover all use cases. Type scale has no gaps.

---

## Phase 1: Chat core — message thread, input, streaming, project creation

**What:** Replace the mock chat in `components/LeftPanel/LeftPanel.tsx` with a real message thread backed by the `Conversation`/`Message` Prisma models. User bubbles (right-aligned), AI responses (Atelier badge, "Completed" label). Streaming/typing animation. Enter/Shift+Enter. Placeholder transitions ("Ask anything" → "Ask a follow up."). Define what happens on first message (implicit project creation).

**Blocked by:** Phase 0b, 0c.

**Where to start:** Create `lib/actions/conversations.ts` (createConversation, listMessages, createMessage). Refactor LeftPanel to load messages from DB. Extract chat state into a `useChat` hook.

**Acceptance:** Messages persist across page reloads. User can send messages, see AI responses. Conversation tied to a project.

---

## Phase 1 (cont): Chat states — loading, empty, error, scroll behavior

**What:** Skeleton loading for message history. Empty state for new conversation. Error state (AI fails / network drops). Auto-scroll to bottom on new messages with "new message" indicator when user has scrolled up.

**Blocked by:** Chat core.

**Where to start:** Add loading/error/empty variants to the LeftPanel. Use `Skeleton` component (already exists at `components/Skeleton/`).

---

## Phase 2: Sidebar navigation shell

**What:** Replace the current `Sidebar` component with the Cobalt-style sidebar: brand switcher (team dropdown with logo, confirmation on switch), "Innovate" collapsible section with "Start New Project" link + project list (active project highlighted, `...` overflow menu on hover), "In development" / "Re-order" nav links, user profile footer (avatar, name, email, `⋮` menu), collapse/expand toggle with animation + state persistence.

**Blocked by:** Phase 0b, 0c.

**Where to start:** `components/Sidebar/Sidebar.tsx`. Data: `listProjects` already exists. Brand list = teams from `TeamMember` relation.

**Acceptance:** Clicking a project navigates to its chat. Active project highlighted. Sidebar collapses to icon-only rail. Brand switching filters projects.

---

## Phase 3a: RHP brief editor shell + formulation card chrome

**What:** Replace the current static RightPanel with a proper "Product brief" panel. Header with "Preview brief" button (disabled until data exists). Expandable formulation card with product mockup image, [Product name], [Category]/[sub-category], [product description], Free from, Format, Volume. Sticky bottom bar with target cost + "Review brief" blue button.

**Blocked by:** Phase 0a (done), 0b.

**Where to start:** Rewrite `components/RightPanel/RightPanel.tsx`. Data: read from `Brief` model. Create `lib/actions/briefs.ts`.

---

## Phase 3b: RHP inline field editing + validation + auto-save

**What:** Click-to-edit interaction for all formulation attribute rows (hero ingredients, benefits, texture, colour, fragrance, claims). Define save trigger (auto-save with debounce vs explicit save button). Validation states for required fields.

**Blocked by:** Phase 3a.

---

## Phase 3c: RHP "Provide a reference" flow

**What:** Define what happens when user clicks "Provide a reference" — modal, inline expansion, or file/URL upload. How references display once added (thumbnail, link chip, remove button).

**Blocked by:** Phase 3b.

---

## Phase 3d: RHP packaging card with tab navigation

**What:** Expandable packaging card with tab bar (Specifications, Vessel, Closure, Artwork). Specifications tab: supplier location `[City], [Country]`, "Supplier also makes for", "Reference product" link. Artwork tab: file upload + preview. Each tab is a distinct content area.

**Blocked by:** Phase 3a.

---

## Phase 4: Research task — execution, progress, results, feedback

**What:** Progress state (bold topic heading, spinner, "Research takes up to 5 minutes"), completion state (green checkmark "Research Finished"), expandable "Show thinking" / "Show full research report" toggles, "Research summary" badge with rich markdown rendering (italic headings, bold-lead bullets). Thumbs up/down feedback buttons. Data backed by `ResearchTask` model.

**Blocked by:** Chat core.

**Where to start:** New component `components/ResearchCard/ResearchCard.tsx`. Markdown renderer needed (consider `react-markdown`).

---

## Phase 5a: Suggestions panel + chat polish

**What:** Dismissible "Suggestions" card (sparkle icon + "Suggestions" label + X) with 4 template prompts using `[bracket]` placeholders. Auto-dismiss when user starts typing. Clicking a suggestion fills the input. Dismissed state persisted per session.

**Blocked by:** Chat core working.

---

## Phase 5b: Brief preview page + PDF export

**What:** Full-page read-only brief view at `/projects/[id]/brief`. Left column: product name, category, description, Free from, format, volume, product image. Right column: attribute table. Footer: "Created on Platform01 by **Name** for **Brand** at **time** on **date**." "Save as PDF" button — spike needed on approach (client-side vs server-side generation).

**Blocked by:** Phase 3a (brief data model + editor).

---

## Phase 6a: Portfolio pages — "In development" + "Re-order"

**What:** List views at `/innovation/in-development` and `/innovation/re-order`. "Expand All" + "All projects (N)" filter dropdowns. Skeleton loading states. Project cards with status.

**Blocked by:** Sidebar nav (Phase 2).

---

## Phase 6b: Order sample flow (epic)

**What:** "Update brief" / "Order sample" tab toggle at top of brief view. Formulation card (read-only) + Packaging card (read-only) in order context. "Place sample order" blue CTA. Cancel button. Needs: supplier integration design, approval workflow, payment consideration. Likely needs sub-tickets.

**Blocked by:** Phase 3a, 3d (brief + packaging cards).

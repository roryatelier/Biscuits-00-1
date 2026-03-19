# Atelier Rebuild — Implementation Plan

*Generated 14 March 2026 — Updated with Collaboration Roadmap*

---

rory@atelier.co
password123

## Current State

**Phases 1-5 COMPLETE.** All pages read from DB, forms persist, core workflow works end-to-end. The app is ~85% functional for a leadership demo.

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| AI chat (Cobalt) | Skip for now | Nail CRUD first, wire AI later |
| Database | Keep SQLite | Fast, leadership won't notice. Migrate to Postgres before external share links. |
| File uploads | Local filesystem + DB reference | `/public/uploads/` + Upload model. Swap to S3/R2 before share links. |
| Backlog page | Hidden — redirects to /dashboard | External Linear links add confusion. |
| Innovation pages | Redirect to /projects | Empty shells without AI. Bring back when AI is wired. |
| In Development page | Filtered Projects view | Show projects with status="In Development". |
| Sample status | Manual advancement buttons | Pending → In Production → Shipped → Delivered. |
| Comments model | Single entityType + entityId | Avoids three-nullable-FK anti-pattern. Cleaner than polymorphic FKs. |
| Notifications | In-app only, no email | Keep v1 simple. Email digests in v2. |
| External sharing | Token-based, no email gate | Link is the auth. No viewer tracking in v1. |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                              │
│                                                                  │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐│
│  │ Auth     │  │  Page Components (all fetch from DB)         ││
│  │ Actions  │  │  + Activity Feed, Discussion, Assignees      ││
│  │ (real)   │  │  + Notification bell in sidebar              ││
│  └────┬─────┘  │  + /share/[token] public view                ││
│       │        └──────────┬───────────────────────────────────┘│
│       │                   │                                     │
│  ┌────┴───────────────────▼───────────────────────────────────┐│
│  │              SERVER ACTIONS                                 ││
│  │  auth.ts | team.ts | profile.ts                             ││
│  │  projects.ts | formulations.ts | samples.ts | packaging.ts  ││
│  │  ── new ──                                                  ││
│  │  activity.ts | comments.ts | sharing.ts | notifications.ts  ││
│  │  context.ts  (shared auth/team utility)                     ││
│  └────────────────────────┬───────────────────────────────────┘│
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────────┐│
│  │  Prisma SQLite                                              ││
│  │  Existing: User, Account, Session, Team, TeamMember,        ││
│  │    Invitation, Project, Formulation, Ingredient,            ││
│  │    FormulationIngredient, ProjectFormulation,                ││
│  │    PackagingOption, SampleOrder, SampleReview, Upload        ││
│  │  ── new ──                                                  ││
│  │  Activity, Comment, ProjectAssignment, ShareLink,           ││
│  │  Notification                                               ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  /public/uploads/  ← file storage                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Completed Phases (Foundation)

### ~~Phase 1: Data Layer~~ ✅
### ~~Phase 2: Seed Script~~ ✅
### ~~Phase 3: Server Actions~~ ✅
### ~~Phase 4: Wire Pages to DB~~ ✅
### ~~Phase 5: Navigation Cleanup~~ ✅

---

## Remaining Foundation Work

### Phase 6: Empty States
- [ ] `/projects` — "No projects yet — create your first one"
- [ ] `/samples` — "No sample orders yet"
- [ ] `/dashboard` — graceful zeros when no data
- [ ] `/projects/[id]` — 404 handling for invalid IDs

### Phase 7: Upload API Route
- [ ] `POST /api/uploads` — accept multipart form data
- [ ] Save to `/public/uploads/{timestamp}-{filename}`
- [ ] Create Upload record in DB
- [ ] Wire into sample review photo upload + packaging artwork upload

### Phase 8: Server Component Conversion
- [ ] Convert read-only pages to server components where possible
- [ ] Add Suspense boundaries with Skeleton loading states

---

## Collaboration Roadmap

### Phase 0: Foundation Fixes (prerequisite for all collaboration work)
- [x] Extract `getTeamId()` to shared `lib/actions/context.ts`
- [x] Update all action files to import from shared context
- [ ] Add `prisma.$transaction()` pattern to mutation actions
- [ ] Configure SQLite busy-timeout in Prisma adapter

**Files:** `lib/actions/context.ts`, `lib/actions/projects.ts`, `lib/actions/samples.ts`, `lib/actions/formulations.ts`, `lib/actions/packaging.ts`

### Phase C1: Activity System
- [ ] Add Activity model to Prisma schema + migrate
- [ ] Create `lib/actions/activity.ts` with `createActivity()` helper
- [ ] Instrument all existing mutation actions to emit Activity records
- [ ] Activity Feed UI section on `/projects/[id]`
- [ ] Filter dropdown (All, Status changes, Comments, Samples)
- [ ] Pagination (show 20, "Load more")

**Data model:**
```
Activity
  id
  projectId        → Project
  userId           → User (who did it)
  type             "status_change" | "formulation_linked" | "formulation_unlinked" |
                   "sample_ordered" | "sample_status_changed" | "review_submitted" |
                   "comment" | "shared" | "project_created" | "project_updated"
  description      human-readable summary
  metadata         JSON string (before/after values, linked IDs)
  createdAt
```

### Phase C2: Comments
- [ ] Add Comment model to Prisma schema + migrate
- [ ] Create `lib/actions/comments.ts` — create, edit, soft-delete, list
- [ ] Discussion UI section on `/projects/[id]`
- [ ] One level of threading (reply to comment, not reply to reply)
- [ ] Edit own comments (show "edited" indicator)
- [ ] Soft-delete own comments (show "This comment was deleted")
- [ ] Emit Activity record on comment creation

**Data model:**
```
Comment
  id
  body             plain text (v1)
  userId           → User
  entityType       "project" | "formulation" | "sample_review"
  entityId         the ID of the parent entity
  parentId?        → Comment (one level threading)
  deletedAt?       soft delete
  createdAt
  updatedAt
```

### Phase C3: Project Assignments
- [ ] Add ProjectAssignment model to Prisma schema + migrate
- [ ] Create assignment actions (assign, unassign, set lead)
- [ ] Auto-assign creator as Lead on project creation
- [ ] Avatar chips on project detail page header
- [ ] Avatar chips on project list cards
- [ ] "+ Assign" dropdown from team members

**Data model:**
```
ProjectAssignment
  id
  projectId        → Project
  userId           → User
  role             "lead" | "member"
  createdAt
```

### Phase C4: External Share Links
- [ ] Add ShareLink model to Prisma schema + migrate
- [ ] Create `lib/actions/sharing.ts` — generate, revoke, list, validate
- [ ] Share modal UI on project detail page
- [ ] Public route `/share/[token]` with dedicated query (NOT reusing getProject)
- [ ] Toggle controls: include ingredients, include review scores
- [ ] Link expiry (7 days default) and revocation
- [ ] Activity emission on share
- [ ] Permission: only admins and project leads can generate

**Data model:**
```
ShareLink
  id
  token              crypto.randomBytes(32) — NOT cuid
  projectId          → Project
  createdById        → User
  expiresAt
  revokedAt?
  includeIngredients Boolean @default(false)
  includeReviews     Boolean @default(false)
  createdAt
```

**Security requirements:**
- Dedicated Prisma query with explicit field selection
- No team data, no internal IDs, no creator emails in response
- Rate limiting on public route
- Expired/revoked links return branded error page

### Phase C5: Notifications
- [ ] Add Notification model to Prisma schema + migrate
- [ ] Create `lib/actions/notifications.ts` — list, markRead, markAllRead
- [ ] Fan-out logic: resolve recipients based on event type + assignments
- [ ] Bell icon with unread count in sidebar
- [ ] Dropdown panel with notification list
- [ ] Click notification → navigate to relevant page
- [ ] "Mark all as read" button

**Data model:**
```
Notification
  id
  userId             → User (recipient)
  activityId         → Activity
  read               Boolean @default(false)
  createdAt
```

**Routing rules:**
| Event | Notified |
| --- | --- |
| Comment on project | All project assignees except commenter |
| Reply to comment | Parent comment author |
| Sample status advanced | Sample order creator |
| Review submitted | Sample order creator + project lead |
| Project status changed | All project assignees except changer |
| Project shared | All project assignees |

---

## NOT in scope (v1)

| Item | Rationale |
| --- | --- |
| AI chat / Cobalt integration | Skip until CRUD is solid. |
| Postgres migration | Keep SQLite. Migrate before external share links ship. |
| OAuth providers | Credentials auth works for demo. |
| Real-time / WebSockets | Refresh on page load is fine for v1. |
| E2E tests | Manual testing for demo. |
| Comment reactions (👍 ❤️) | 5 users don't need emoji reactions. |
| @mentions in comments | Requires user autocomplete + rich text + notification routing change. v2. |
| Viewing presence (who's online) | Polling on SQLite = lock contention. Needs Postgres first. |
| Share link analytics | Ship the link first, add view tracking if people use it. |
| Email notification digests | In-app only for v1. |
| Markdown in comments | Plain text first. Revisit after usage data. |
| Comment file attachments | Upload system not wired yet. Add after Phase 7. |
| Formulation version history | Single version. Versioning is complex, not needed for demo. |

---

## What Already Exists (reuse, don't rebuild)

| Existing | Reuse for |
| --- | --- |
| `lib/actions/team.ts` pattern | Template for all new server actions |
| `lib/actions/context.ts` (new) | Shared auth/team context for all actions |
| CSS custom properties | All new UI uses existing design tokens |
| PlatformLayout + Sidebar | Notification bell drops into sidebar |
| Button, Skeleton, EmptyState components | All new UI sections |
| Client/server component split pattern | Comment forms (client) + lists (server) |
| Project detail page structure | Activity + Discussion sections slot in below milestones |

---

## Failure Modes

```
CODEPATH                FAILURE MODE            RESCUED?  USER SEES?       VERDICT
──────────────────────────────────────────────────────────────────────────────────
createProject           Missing required fields Y         Validation msg   OK
createSampleOrder       Invalid formulationId   Y         Error toast      OK
uploadFile              File too large          Y         Size error msg   OK
uploadFile              Disk full               N         Silent 500       ⚠️ ACCEPT
advanceStatus           Invalid transition      Y         Error msg        OK
getById                 Record not found        Y         404 page         OK
DB connection           SQLite locked           N         Silent 500       ⚠️ ACCEPT (add retry)
Activity emission       createActivity fails    N         Activity missing ⚠️ USE TRANSACTIONS
Comment CRUD            Orphaned comment        N         Stale data       ⚠️ APP VALIDATION
Share link              Data leakage            N         Internal data    🔴 DEDICATED QUERY
Notification fan-out    Missing recipient       N         No notification  ⚠️ ACCEPT (test routes)
Share public route      Token brute-force       N         Data exposure    ⚠️ RATE LIMIT
```

---

## Progress Tracker

- [x] Phase 1: Schema ✅
- [x] Phase 2: Seed ✅
- [x] Phase 3: Server Actions ✅
- [x] Phase 4: Wire Pages ✅
- [x] Phase 5: Nav Cleanup ✅
- [ ] Phase 6: Empty States
- [ ] Phase 7: Upload API
- [ ] Phase 8: Server Components
- [x] Phase 0: Foundation Fixes ✅ (getAuthContext extracted, $transaction on mutations)
- [x] Phase C1: Activity System ✅ (model, actions, feed UI with filters + pagination)
- [x] Phase C2: Comments ✅ (threading, edit, soft-delete, activity emission)
- [x] Phase C3: Project Assignments ✅ (auto-assign creator as Lead, avatar chips)
- [x] Phase C4: External Share Links ✅ (generate, revoke, public /share/[token] page)
- [x] Phase C5: Notifications ✅ (bell icon, unread count, mark-as-read, fan-out)

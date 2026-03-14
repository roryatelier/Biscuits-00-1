# Atelier Rebuild — Functional Implementation Plan

*Generated 14 March 2026 — CEO/Expansion mode review*

---

rory@atelier.co
password123

## Goal

Make Atelier functional for leadership demo. Every page reads real data, every form persists, core workflow works end-to-end.

**Target: 15% functional → 85% functional**

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| AI chat (Cobalt) | Skip for now | Nail CRUD first, wire AI later |
| Database | Keep SQLite | Fast, leadership won't notice. Migrate to Postgres for production. |
| File uploads | Local filesystem + DB reference | `/public/uploads/` + Upload model. Swap to S3/R2 later. |
| Backlog page | Hide from nav | External Linear links add confusion. Remove sidebar entry. |
| Innovation pages | Redirect to /projects | Empty shells without AI. Bring back when AI is wired. |
| In Development page | Filtered Projects view | Show projects with status="In Development" inside PlatformLayout. |
| Sample status | Manual advancement buttons | User clicks through: Pending → In Production → Shipped → Delivered. |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   NEXT.JS APP                     │
│                                                   │
│  ┌──────────┐  ┌───────────────────────────────┐ │
│  │ Auth     │  │  20 Page Components           │ │
│  │ Actions  │  │  (ALL fetch from DB)          │ │
│  │ (real)   │  │  (Forms submit via actions)   │ │
│  └────┬─────┘  └──────────┬────────────────────┘ │
│       │                   │                       │
│  ┌────┴───────────────────▼─────────────────────┐│
│  │           SERVER ACTIONS                      ││
│  │  auth.ts | team.ts | profile.ts               ││
│  │  projects.ts | formulations.ts                ││
│  │  samples.ts  | packaging.ts                   ││
│  └────────────────────┬─────────────────────────┘│
│                       │                           │
│  ┌────────────────────▼─────────────────────────┐│
│  │  Prisma SQLite                                ││
│  │  6 existing + 8 new models:                   ││
│  │  Project, Formulation, Ingredient,            ││
│  │  FormulationIngredient, PackagingOption,       ││
│  │  SampleOrder, SampleReview, Upload            ││
│  └───────────────────────────────────────────────┘│
│                                                   │
│  /public/uploads/  ← file storage                 │
└──────────────────────────────────────────────────┘
```

---

## Data Model (New Prisma Models)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Project    │────▶│ ProjectFormulation│◀────│  Formulation    │
│             │     │  (join table)     │     │                 │
│ id          │     │ projectId         │     │ id              │
│ name        │     │ formulationId     │     │ name            │
│ description │     └──────────────────┘     │ category        │
│ status      │                              │ status          │
│ category    │     ┌──────────────────┐     │ market          │
│ market      │     │ FormulationIngr  │◀────│ description     │
│ claims[]    │     │                  │     │ version         │
│ teamId      │     │ formulationId    │     │ teamId          │
│ createdById │     │ ingredientId     │     │ createdById     │
│ createdAt   │     │ percentage       │     └─────────────────┘
│ updatedAt   │     │ role (active/    │            │
└─────────────┘     │  preservative/..)│     ┌──────▼──────────┐
                    └──────────────────┘     │  Ingredient     │
┌─────────────┐                              │                 │
│ SampleOrder │     ┌──────────────────┐     │ id              │
│             │────▶│  SampleReview    │     │ name (INCI)     │
│ id          │     │                  │     │ casNumber       │
│ reference   │     │ id               │     │ function        │
│ formulaId   │     │ sampleOrderId    │     │ description     │
│ projectId   │     │ reviewerId       │     └─────────────────┘
│ quantity    │     │ texture (1-5)    │
│ format      │     │ scent (1-5)      │     ┌─────────────────┐
│ status      │     │ colour (1-5)     │     │ PackagingOption │
│ shippingAddr│     │ overall (1-5)    │     │                 │
│ notes       │     │ notes            │     │ id              │
│ teamId      │     │ createdAt        │     │ name            │
│ createdById │     └──────────────────┘     │ format          │
│ createdAt   │                              │ material        │
└─────────────┘     ┌──────────────────┐     │ moq             │
                    │     Upload       │     │ unitCost        │
                    │                  │     │ leadTime        │
                    │ id               │     │ status          │
                    │ filename         │     │ description     │
                    │ path             │     │ teamId          │
                    │ mimeType         │     └─────────────────┘
                    │ sizeBytes        │
                    │ uploadedById     │
                    │ reviewId?        │
                    │ packagingId?     │
                    │ createdAt        │
                    └──────────────────┘
```

---

## Core Demo Workflow

```
CREATE PROJECT          BROWSE CATALOG           ORDER SAMPLE         REVIEW SAMPLE
────────────────       ─────────────────        ───────────────      ───────────────
/projects/new    →     /formulations      →     /samples/new    →   /samples/[id]/review
                       /formulations/[id]
Fill out form          Filter & browse          Pick formulation     Rate texture/scent/
Pick claims            See ingredients           Set quantity          colour/overall
Set market/category    View versions             Choose format        Upload photos
     │                      │                    Add shipping         Write notes
     ▼                      ▼                         │                    │
  Project saved        Link formulation               ▼                    ▼
  to DB                to project              SampleOrder saved     Review saved
                                               Status: "Pending"    Photos persisted
```

---

## Implementation Phases

### Phase 1: Data Layer (Schema + Migration)
- [ ] Add 8 new Prisma models to `schema.prisma`
- [ ] Run `prisma migrate dev` to create tables
- [ ] Create `/public/uploads/` directory

**Files:** `prisma/schema.prisma`

### Phase 2: Seed Script
- [ ] Migrate hardcoded formulation data (12 items) from `formulations/page.tsx`
- [ ] Migrate hardcoded ingredient data (16 items) from `formulations/[id]/page.tsx`
- [ ] Migrate hardcoded packaging data (9 items) from `packaging/page.tsx`
- [ ] Add 3 demo projects with varying statuses
- [ ] Add 4 demo sample orders with varying statuses
- [ ] Add 1 demo sample review
- [ ] Use `upsert` to make seed script idempotent

**Files:** `prisma/seed.js`

### Phase 3: Server Actions
- [ ] `lib/actions/projects.ts` — create, update, list, getById, delete, linkFormulation
- [ ] `lib/actions/formulations.ts` — list, getById, getIngredients, getVersions
- [ ] `lib/actions/samples.ts` — create, list, getById, advanceStatus, addReview
- [ ] `lib/actions/packaging.ts` — list, getById
- [ ] `lib/actions/uploads.ts` — uploadFile, getUploads, deleteUpload

**Pattern:** Follow `lib/actions/team.ts` style — auth checks, validation, structured error handling.

### Phase 4: Wire Pages to DB
- [ ] `/dashboard` — query real stats (project count, sample count, recent activity)
- [ ] `/projects` — new page listing all projects from DB (replace redirect)
- [ ] `/projects/new` — wire form → `createProject` action
- [ ] `/projects/[id]` — fetch project from DB, show real data
- [ ] `/formulations` — query DB instead of hardcoded array
- [ ] `/formulations/[id]` — fetch formulation + ingredients from DB
- [ ] `/packaging` — query DB instead of hardcoded array
- [ ] `/packaging/[id]` — fetch from DB, wire artwork upload
- [ ] `/samples` — query DB, filter by real status
- [ ] `/samples/new` — wire form → `createSampleOrder` action
- [ ] `/samples/[id]/review` — wire form → `addReview` action, photo upload
- [ ] `/in-development` — filtered projects view (status = "In Development"), inside PlatformLayout

### Phase 5: Navigation Cleanup
- [ ] Remove from sidebar: Backlog, Innovation Chat, Cobalt links
- [ ] Add to sidebar: /projects link
- [ ] Redirect /innovation → /projects
- [ ] Redirect /innovation/chat → /projects
- [ ] Redirect /innovation/cobalt → /projects
- [ ] Update "New Innovation Project" button → /projects/new

### Phase 6: Empty States
- [ ] `/projects` — "No projects yet — create your first one"
- [ ] `/samples` — "No sample orders yet"
- [ ] `/dashboard` — graceful zeros when no data
- [ ] `/projects/[id]` — 404 handling for invalid IDs

### Phase 7: Upload API Route
- [ ] `POST /api/uploads` — accept multipart form data
- [ ] Save to `/public/uploads/{timestamp}-{filename}`
- [ ] Create Upload record in DB
- [ ] Return `{ id, path, filename }`
- [ ] Wire into sample review photo upload
- [ ] Wire into packaging artwork upload

### Phase 8: Server Component Conversion
- [ ] Convert read-only pages from `'use client'` to server components where possible
- [ ] Add Suspense boundaries with Skeleton loading states
- [ ] Pages to convert: formulations list, packaging list, samples list, dashboard

---

## NOT in scope

| Item | Rationale |
| --- | --- |
| AI chat / Cobalt integration | User chose to skip. Revisit after CRUD is solid. |
| Postgres migration | Keep SQLite for demo. Migrate for production. |
| OAuth providers (Google, etc.) | Credentials auth works for demo. |
| Real-time updates / WebSockets | Not needed for demo. |
| E2E tests (Playwright/Cypress) | No test infra yet. Manual testing for demo. |
| Security hardening (P1 items) | Rate limiting + headers exist. Good enough for internal demo. |
| Deployment to Vercel | Build locally. Deploy is separate effort. |
| Formulation version history | Keep single version. Versioning is complex, not needed for demo. |
| Regulatory compliance features | Future feature, not core demo flow. |

---

## What Already Exists (reuse, don't rebuild)

| Existing | Reuse for |
| --- | --- |
| `lib/actions/team.ts` pattern | Template for all new server actions |
| CSS custom properties | All new UI uses existing tokens |
| PlatformLayout + Sidebar | All pages stay within this shell |
| Button component | All new forms use existing Button |
| Skeleton component | Loading states for server components |
| EmptyState component | Zero-data pages |
| 12 hardcoded formulations | Seed data — move to DB verbatim |
| 9 hardcoded packaging items | Seed data — move to DB verbatim |
| 16 hardcoded ingredients | Seed data — move to DB verbatim |

---

## Failure Modes

```
CODEPATH              FAILURE MODE          RESCUED?  TEST?  USER SEES?      VERDICT
─────────────────────────────────────────────────────────────────────────────────────
createProject         Missing required      Y         N      Validation msg  OK
                      fields
createSampleOrder     Invalid formulationId Y         N      Error toast     OK
uploadFile            File too large        Y         N      Size error msg  OK
uploadFile            Disk full             N         N      Silent 500      ⚠️ ACCEPT
advanceStatus         Invalid transition    Y         N      Error msg       OK
getById               Record not found      Y         N      404 page        OK
DB connection         SQLite locked         N         N      Silent 500      ⚠️ ACCEPT
Seed script           Duplicate seed run    Y (upsert)N      Idempotent      OK
```

---

## Progress Tracker

- [ ] Phase 1: Schema
- [ ] Phase 2: Seed
- [ ] Phase 3: Server Actions
- [ ] Phase 4: Wire Pages
- [ ] Phase 5: Nav Cleanup
- [ ] Phase 6: Empty States
- [ ] Phase 7: Upload API
- [ ] Phase 8: Server Components

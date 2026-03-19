# Atelier Platform Review — Mei Zhang, Data Analyst (Cross-Functional)

**Reviewer:** Mei Zhang, Data Analyst
**Date:** 17 March 2026
**Scores:** Data Model 7/10, Queryability 2/10, Dashboard 3/10

---

## Data Model Quality

**Rating: 7/10 -- genuinely good bones, some structural concerns.**

The good:

- **Proper normalisation.** The many-to-many between `Project` and `Formulation` via `ProjectFormulation` is correct. The `FormulationIngredient` junction table with `percentage` (Float) and `role` (String) is exactly how I'd want ingredient data structured. The `@@unique([formulationId, ingredientId])` constraint prevents duplicates. This is clean.

- **Consistent ID strategy.** Everything uses `cuid()` primary keys. Consistent, sortable, non-sequential. Fine for a web app.

- **Timestamps everywhere.** Every model has `createdAt` with `@default(now())`. Most have `updatedAt` with `@updatedAt`. This gives me temporal grain for analysis. The `Activity` model even has `@@index([projectId, createdAt])`, which tells me someone thought about query performance.

- **Team scoping.** Everything is scoped to `teamId`, which means multi-tenant data isolation is built in.

The concerns:

- **Free-text status fields.** `Project.status`, `Formulation.status`, `SampleOrder.status`, `PackagingOption.status` -- all `String` types with no enum constraint. The comments say things like `// Brief, In Development, Sampling, Launched` but nothing enforces this at the database level. The `STATUS_ORDER` array in `samples.ts` hardcodes status values, but what happens when someone seeds a row with "pending" (lowercase) or "In-Production" (hyphenated)? These should be Prisma enums.

- **JSON-as-string anti-pattern.** `Project.claims` is `String?` with the comment `// JSON array stored as string (SQLite)`. The `Activity.metadata` is also `String?` storing JSON. The schema now declares `provider = "postgresql"`. Postgres has native `Json` / `JsonB` types. Storing JSON as a string means I cannot query claims or activity metadata without parsing. If I want to answer "which projects claim 'vegan' and 'cruelty-free'?", I need to deserialise every row. That is unacceptable at scale.

- **`category` and `market` are free-text.** `Project.category` is `String?` -- "Haircare, Skincare, etc." There is no reference table, no enum, no validation. These are critical analytical dimensions. If one PM types "Skin Care" and another types "Skincare", my category breakdown is wrong.

- **`PackagingOption` is not linked to `Project` or `Formulation`.** The model floats independently. I cannot answer "what packaging was selected for this product?" from the database.

- **`leadTime` is `String?`** -- "4-6 weeks". I cannot do math on this. This needs to be an integer (days) or a structured range.

---

## Queryability

**Rating: 2/10 -- borderline non-functional for analytics.**

- **No API routes for data retrieval.** The only API routes are `POST /api/uploads` (file upload) and the NextAuth route. Everything else is Next.js server actions callable from React components, not from Python scripts, Tableau, or anything outside this app.

- **No CSV/Excel export.** Zero export functionality anywhere. No "Download as CSV" button on any list view. No `/api/export/projects` endpoint.

- **No REST or GraphQL API.** There is no programmatic way to pull data from this system. The server actions require a Next.js session context.

- **No webhook or event stream.** The Activity system captures events, but there is no way to subscribe externally.

---

## Coverage: Brief-to-Market Lifecycle

**Rating: 5/10 -- covers the middle, misses both ends.**

| Phase | Coverage |
|---|---|
| Brief / Concept | Partial -- `Project` with name, description, category, market, claims |
| Formulation Development | Good -- Formulation -> FormulationIngredient -> Ingredient with INCI, CAS, percentages |
| Sampling | Good -- SampleOrder with status pipeline, linked to formulations and projects |
| Sample Evaluation | Good -- SampleReview with structured scores plus free-text notes |
| Packaging Selection | Partial -- PackagingOption exists but NOT linked to projects |
| Launch | Missing -- status can be "Launched" but no launch date, no SKU, no GTM data |
| Post-Launch Performance | Missing -- no sales data, no market performance, no consumer feedback |

**Fundamentally absent:**
- No supplier/manufacturer model
- No cost model beyond `PackagingOption.unitCost`
- No timeline/milestone model
- No regulatory/compliance tracking
- No target consumer/demographic data
- No SKU / product code (cannot join to sales data)

---

## Missing Data Points (Critical for My Work)

1. **Launch date** -- `Project` needs a `launchedAt DateTime?` field. Without it, I cannot calculate brief-to-launch cycle time.
2. **SKU / product code** -- once a project becomes a product, it needs a code I can join to sales data.
3. **Target retail price / COGS estimate** -- financial dimensions are completely absent.
4. **Supplier model** -- linked to `Formulation` and `SampleOrder`.
5. **Batch/lot tracking** -- no batch concept for production runs.
6. **Formulation version history** -- old data is overwritten, losing iteration comparison.
7. **Review aggregation** -- no computed average, no statistical summary on parent `SampleOrder`.
8. **Date fields on status transitions** -- no `shippedAt`, `deliveredAt` on `SampleOrder`.

---

## Dashboard & Reporting

**Rating: 3/10 -- operational overview, not analytically useful.**

The dashboard shows:
- Four stat cards: Active projects count, Formulations count, Sample orders count, Pending samples count
- Top 3 recent projects with status badges
- Top 3 recent sample orders with status
- A 5-item activity feed

There is:
- No trend data (no "projects created this month vs last month")
- No status distribution (no "60% of projects are in Brief, 30% in Development")
- No cycle time metrics
- No sample review score aggregation
- No formulation-to-project funnel
- No filtering by date range, category, or market
- No charts or visualisations of any kind

---

## Verdict

**Would this improve or worsen my data wrangling situation?**

It would improve it -- marginally -- but not enough to change my workflow.

**What it solves:** For the first time, formulation data lives in the same database as project data and sample evaluation data. The `ProjectFormulation` junction table means I can trace which formulations were evaluated for which projects. The `Activity` model gives me an event log. This is better than four disconnected spreadsheets.

**What it does not solve:** I still cannot get data out of this system programmatically. The data model stops at "Launched." Critical dimensions like supplier, cost, timeline milestones, and regulatory status are absent. Free-text fields mean data cleaning before analysis.

**What I would need to endorse this for production:**

1. A read-only REST API (`GET /api/projects`, `GET /api/formulations`, `GET /api/samples`) with token-based auth
2. CSV export on every list view
3. Enums for `status`, `category`, `market` across all models
4. A `launchedAt` date and `sku` field on `Project`
5. `Project` linked to `PackagingOption` via a junction table
6. A `Supplier` model linked to formulations and sample orders
7. `Json` type (not `String`) for `claims` and `metadata` fields (now that the database is Postgres)

If those seven items were addressed, this platform would go from "interesting but I still need my spreadsheets" to "genuine single source of truth for innovation pipeline data." The foundation is there. The data model is thoughtfully designed. It just needs an analytics layer on top and some structural tightening underneath.

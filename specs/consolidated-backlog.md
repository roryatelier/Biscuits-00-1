# Platform01 — Consolidated Backlog

**Date:** 18 March 2026
**Source:** Leadership debate — Head of Design (Jess Park), Head of Product (Marcus Webb), CTO (Priya Sharma)
**Input:** `user-research/10-research-synthesis.md` (9-persona synthetic review)
**Author:** Rory G, Product Manager — Platform01

---

## 1. Context

Three leadership perspectives independently reviewed the user research synthesis and debated priorities. This document captures the consolidated backlog — the items all three agreed on, the disagreements that were resolved, and the explicit decisions on what to build and what to defer.

The research found: 7/9 personas praised the architecture and domain understanding, but only 2/9 would adopt today. The gap is not vision — it is the absence of regulatory enforcement, dates, API access, and the analytical/strategic layers enterprise buyers require.

---

## 2. Key Agreements

| Point | Design | Product | CTO |
|---|---|---|---|
| **Regulatory false confidence is the #1 problem** | "The UI is lying to the user" | "Turns our worst liability into our best demo" | "A liability with a UI" |
| **Dates unlock daily usage** | "Gravitational center of the project view" | "Without dates, no reason to come back" | "Small schema change, large perception shift" |
| **Don't build configurable workflows yet** | "Progressive disclosure, not a workflow engine" | "Simplicity is the feature" | "Hardcoded happy path — generalize later" |
| **Enums before new features** | "Free-text is entropy" | "Unsexy but compounds" | "Clean the foundation before building on it" |
| **SSO/webhooks can wait** | — | "Checkbox, not a usage driver" | "Solved problem — build when a deal requires it" |

---

## 3. Key Disagreements + Resolutions

### 3.1 How deep should the regulatory engine go in v1?

- **Product:** "200-ingredient CSV lookup. Ship in a week. Red dot on a line item."
- **CTO:** "200 is arbitrary and dangerous. 'No data' must never look like 'compliant.' This is a 3-6 month project minimum."
- **Design:** "Remove the false confidence signals NOW. The engine can come later."

**Resolution:** Two-phase approach. **Phase A (Week 1-2):** Design's "disarmament" — relabel "Approved" to "Manually Verified," add honest empty states to the Regulatory tab, and implement CTO's three-state model (COMPLIANT / VIOLATION / NO DATA) in the UI. **Phase B (Weeks 3-8):** Ship Product's 200-ingredient lookup but with CTO's architecture — proper `Restriction` model, jurisdiction-aware, with explicit "NO DATA" for uncovered ingredients. Design the schema for the hard case now, populate it incrementally.

### 3.2 Build for easy adopters or hard architecture?

- **Product:** "Tier 1 first — fastest path to daily active usage and revenue signal."
- **CTO:** "Schema for the hardest persona, UI for the earliest adopter."
- **Design:** "Build for Tier 1 adoption but design for Tier 2 architecture. Progressive disclosure."

**Resolution:** CTO and Design align. **Schema depth for Kenji/David, UI layer for Natasha/Elena.** Every screen ships with a "Natasha layer" (visible) and a designed "Sophie/Kenji layer" (progressive disclosure, built out over time). Product's adoption metrics still drive the sprint cadence.

### 3.3 How much is the "Immediate" bucket really?

- **Product:** "Sprint 1-2, Weeks 1-4."
- **CTO:** "5-6 weeks calendar time with review + QA. Don't create false sense of progress."

**Resolution:** Call it **6 weeks** honestly. Frame items 1-7 as "foundation prep," not "shipped features."

### 3.4 REST API scope?

- **Product:** "JSON export + one webhook. Ship in a week."
- **CTO:** "Hidden scope — versioning, auth layer, rate limiting, docs. M-to-L."

**Resolution:** Product's v0 (JSON export + status-change webhook) ships first as a tactical unblock for sales conversations. CTO's proper v1 API follows in month 2-3 with versioning and auth done right.

---

## 4. Consolidated Backlog (Ranked)

### #1 — Regulatory Disarmament
- **What:** Relabel "Approved" → "Manually Verified." Honest empty states on Regulatory tab. Three-state compliance model in UI (COMPLIANT / VIOLATION / NO DATA).
- **Owner:** Design
- **Size:** S
- **Timeframe:** Week 1-2
- **Rationale:** Stop lying. Zero backend work. Biggest trust risk on the platform. All three leaders agree.

### #2 — Schema Hardening
- **What:** Enums for top 10 free-text fields, `claims`/`metadata` → JSON, `leadTime` → Int.
- **Owner:** Engineering
- **Size:** S
- **Timeframe:** Week 1-3
- **Rationale:** Clean the foundation before building on it. Unblocks analytics, filtering, data quality.

### #3 — Regulatory Data Model + Reference Architecture
- **What:** Design `Restriction`, `RegulatoryCheck`, `AuditEvent` schema. Whiteboard session before any code.
- **Owner:** Engineering + Product
- **Size:** M (design phase)
- **Timeframe:** Week 2-3
- **Rationale:** Wrong model = rewrite. Design for jurisdiction + product-category + time-bound restrictions. Get this right.

### #4 — Project Timeline Model
- **What:** `targetLaunchDate`, milestone dates, status transition timestamps. Replace progress bar with stage indicator.
- **Owner:** Engineering + Design
- **Size:** S
- **Timeframe:** Week 3-5
- **Rationale:** Unlocks daily usage for 5/9 personas. "Tracker → planning tool." Design the project card around temporal data.

### #5 — Packaging-Project Link + Claim Status Field
- **What:** Junction table linking packaging to projects. Claim approval status (Draft / Under Review / Approved). Evidence link on claims.
- **Owner:** Engineering
- **Size:** S
- **Timeframe:** Week 4-6
- **Rationale:** Quick relational hygiene. Unlocks BOM path, gives claims operational weight.

### #6 — Regulatory Validation Engine v1
- **What:** Ingredient checks against restrictions for target markets. EU Annex II (banned list) first. Audit log on every check. 50-200 ingredients, three-state response.
- **Owner:** Engineering
- **Size:** L
- **Timeframe:** Week 4-10
- **Rationale:** The moat. Uses data model from #3. Best demo moment. Ship with explicit coverage boundaries — never let "no data" look like "compliant."

### #7 — Hardcoded Approval Workflow
- **What:** Draft → Review → Approved. Role-based permissions. Override with audit trail. Not configurable.
- **Owner:** Engineering
- **Size:** M
- **Timeframe:** Week 6-10
- **Rationale:** Enterprise table stakes. "Nothing ships without my signature." Three stages, one gate per transition.

### #8 — API v0 → v1
- **What:** v0: JSON export of core entities + status-change webhook. v1: Versioned REST (`/v1/`), token auth, 5-6 endpoints, rate limiting, docs.
- **Owner:** Engineering
- **Size:** S (v0) → M (v1)
- **Timeframe:** Week 5-6 (v0), Week 8-14 (v1)
- **Rationale:** v0 unblocks sales conversations immediately. v1 is the real integration surface.

### #9 — Formulation Cost Layer v1
- **What:** Cost/kg on ingredients, auto-calculated batch COGS, margin indicator against target retail price.
- **Owner:** Engineering
- **Size:** M
- **Timeframe:** Week 10-14
- **Rationale:** Kills the most common "alt-tab to Excel" moment. Depends on clean ingredient + packaging data from earlier work.

### #10 — Portfolio Dashboard
- **What:** Card wall view of all projects, filterable by status/date/brand/category. Read-only.
- **Owner:** Design + Engineering
- **Size:** M
- **Timeframe:** Week 12-16
- **Rationale:** Increases switching cost. "I run my portfolio here." Largely frontend if data model is right from items 1-9.

---

## 5. Explicitly Deferred

| Item | Why Not Now | Revisit When |
|---|---|---|
| Deep formulation model (phases, specs, stability) | Tier 3 persona. Architecture designed for it, but UI/population deferred. | Tier 1+2 paying and retained |
| Configurable workflow engine | Hardcoded covers 80%. Generalize with real enterprise feedback. | 3 enterprise customers with different requirements |
| SSO/SAML | Solved problem (Auth0/WorkOS). No signed deal requires it. | Enterprise deal blocked on it |
| Cross-market compliance comparison | Requires mature regulatory engine | Regulatory v1 stable + 3 markets populated |
| AI features | Validate core workflow stickiness first. | Core loop sticky without AI |
| Portfolio analytics / scenario modeling | Tier 4 persona. Downstream of everything else. | Data foundation supports aggregation |
| Claims-to-formulation validation | Needs mature formulation + regulatory models | Regulatory engine + formulation deepening complete |

---

## 6. Architectural Decisions Needed This Week

### Decide NOW (before sprint planning)

| Decision | Why Now | Recommendation |
|---|---|---|
| **Regulatory data model schema** | Every feature touches this. Wrong model = rewrite. | Design for jurisdiction + product-category + time-bound restrictions. Over-engineer the schema, under-engineer the initial data population. |
| **Three-state compliance response** | Affects every UI that shows regulatory status. | COMPLIANT / VIOLATION / NO DATA. Never conflate absence of data with compliance. Bake into API contract and UI from day one. |
| **Audit trail architecture** | Approval workflows, regulatory overrides, formulation changes all need audit. Retrofitting is brutal. | Event-sourced audit log table. Every state change writes an immutable event. Design before building workflows or regulatory checks. |
| **API versioning strategy** | Once we ship v1, we are committed to a contract. | URL-based versioning (`/v1/`). Design resource schema as a public contract separate from internal Prisma models. |
| **Formulation versioning model** | Copy-on-write vs. branching vs. linear history. Affects data model fundamentally. | Copy-on-write with immutable snapshots. Regulatory checks run against specific versions, not mutable state. |

### Can Defer (3-6 months)

| Decision | Why It Can Wait |
|---|---|
| Workflow engine architecture | Hardcoded workflow buys 6+ months. |
| SSO provider selection | Auth0/WorkOS are drop-in. |
| Event streaming / webhook architecture | No consumers yet. |
| Multi-tenancy model | Cross that bridge when we have tenant 2. |
| Claims validation engine | Requires mature formulation + regulatory models. |

---

## 7. Parallel Workstreams

While engineering executes the backlog:

1. **5 real-user discovery calls in next 2 weeks** — validate top 3 bets + pricing with real humans matching Tier 1 and Tier 2 personas.
2. **Competitive analysis** — map competitor capabilities against top 10 gaps. Where can we leapfrog vs. where must we reach parity?
3. **Regulatory data sourcing** — evaluate CosIng, AICIS, ECHA, and FDA monograph data for ingestion feasibility and licensing costs.

---

## 8. Design Principles (from the debate)

1. **The interface must never imply verification the system hasn't performed.** No green states without validation. No empty tabs that look like "no issues found."
2. **Schema for the hardest persona, UI for the earliest adopter.** Progressive disclosure is an architecture decision, not a bolt-on.
3. **Three-state compliance: COMPLIANT / VIOLATION / NO DATA.** Never let absence of data look like compliance.
4. **Ship honest foundations, not impressive surfaces.** Frame foundation work as foundation work. Don't oversell schema changes as features.
5. **Be tool #1 for something, not tool #7 for everything.** System of record for beauty product development data — not a PM tool, not a PLM replacement.

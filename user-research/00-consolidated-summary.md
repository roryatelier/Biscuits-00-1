# Atelier Platform — Consolidated Persona Review Summary

**Date:** 17 March 2026
**Method:** Synthetic persona review — 9 persona agents independently reviewed the full Atelier codebase
**Source Personas:** Derived from [Figma persona board](https://www.figma.com/board/aopEbQmxg4MAjoKFgCBdQ7/Personas---workflows-for-Platform_2026)

---

## Scores at a Glance

### Large Enterprise Tier

| # | Persona | Role | Score | One-Line Verdict |
|---|---|---|---|---|
| 01 | Sophie Langford | Product Developer | Watch closely | "The foundation is solid, the taste level is right — but I need enterprise-grade." |
| 02 | Dr. Kenji Tanaka | Head of Formulation | Not yet | "This understands *products*, not *formulations*." |
| 03 | Ava Chen | Portfolio Strategist | Would not log in | "Good v1 for the people who *do the work*. Not for those who *decide what work to do*." |
| 04 | Liam Ortega | Project Manager | 4/10 enterprise, 7/10 small team | "It would be tool #7 in my stack, not a replacement for any of the existing 6." |

### Cross-Functional Roles

| # | Persona | Role | Score | One-Line Verdict |
|---|---|---|---|---|
| 05 | Natasha Reeves | Brand Manager | 6/10 (9/10 potential) | "The bones are right. Now finish the house." |
| 06 | David Loh | Compliance/QA | Not adoptable | "A formulation with a banned ingredient at 100x the legal limit can be marked 'Approved'. That is a liability." |
| 07 | Mei Zhang | Analytics Analyst | 7/10 model, 2/10 queryability | "Genuinely good bones, but I can't get data out." |
| 08 | Dr. Amara Osei | Regulatory Specialist | Not adoptable | "The flag filters are UI decoration. I will continue using my spreadsheets." |
| 09 | Elena Vasquez | Marketing Manager | 7/10 (9/10 potential) | "I'd use this. And I don't say that about many internal tools." |

---

## The Killer Finding

David (Compliance/QA) found that the seed data has **Methylisothiazolinone at 0.15% in formulation `form_07`** — the EU limit for rinse-off is **0.0015%**. That's 100x over the legal limit. The formulation is marked "Approved" for the UK market. The platform raises zero flags. This single finding validates why regulatory intelligence cannot be a "later" feature.

---

## Adoption Camps

**Would use it today (with caveats):**
- Natasha (Brand Manager) — values visibility, collaboration, sample tracking
- Elena (Marketing Manager) — values activity feed, share links, single-source-of-truth project page

**Would not adopt yet:**
- Sophie (Product Developer) — needs enterprise integration, approval workflows, timelines
- Dr. Kenji (Head of Formulation) — needs formulation science depth, versioning, specs
- Ava (Strategist) — needs portfolio views, financial data, strategic dashboards
- Liam (Collaborator/PM) — needs dates, dependencies, reporting, integrations
- David (Compliance/QA) — needs regulatory database, approval gates, audit trails
- Dr. Amara (Regulatory) — needs cross-market compliance engine, AICIS/TGA support
- Mei (Analytics) — needs API/export, enums, queryable data

---

## Top Gaps (Ranked by Cross-Persona Frequency)

| # | Gap | Flagged By | Priority |
|---|---|---|---|
| 1 | **No regulatory intelligence / compliance engine** | Sophie, Kenji, David, Amara, Natasha | P0 — liability risk |
| 2 | **No dates / timelines / launch windows** | Sophie, Ava, Liam, Natasha, Elena | P0 — everyone needs this |
| 3 | **No API / export / queryability** | Sophie, Liam, Mei | P1 — blocks analytics & integration |
| 4 | **Formulation data model too shallow** | Kenji, David, Amara | P1 — no phases, specs, stability, versioning |
| 5 | **No financial / costing layer** | Sophie, Ava, Liam, Mei | P1 — can't make portfolio decisions |
| 6 | **No approval workflows / stage gates** | Sophie, Liam, David | P1 — no governance |
| 7 | **No portfolio-level views** | Ava, Sophie | P2 — leadership has no reason to log in |
| 8 | **Packaging not linked to projects** | Sophie, Elena, Mei | P2 — quick win, data model gap |
| 9 | **Claims not validated against formulations** | Natasha, David, Elena | P2 — claims are decorative tags |
| 10 | **Free-text fields need enums** | Mei, David | P2 — data quality |

---

## What Everyone Liked

- **The domain understanding is real** — "built by people who've sat in NPD meetings, not enterprise software generalists" (Sophie)
- **Activity feed + notifications** — every persona acknowledged this reduces status chasing
- **Share links with IP controls** — ingredient/review toggles, expiry, revocation — genuinely differentiated
- **Sample tracking pipeline** — Pending > In Production > Shipped > Delivered with structured reviews
- **The brief-to-formulation-to-sample pipeline is modeled as first-class entities**, not documents in a file system
- **Clean architecture** — Prisma schema is well-normalised, collaboration layer is extensible

---

## Quick Wins (Low Effort / High Signal)

1. **Surface ingredient `description` field in the UI** — already in database, just hidden (Elena)
2. **Add `targetLaunchDate` to Project model** — one field, unlocks timeline views (5 personas)
3. **Link PackagingOption to Project** — junction table, connects content to products (Elena, Sophie, Mei)
4. **Add enums for status, category, market** — data quality fix (Mei)
5. **Claim approval status field** — Draft/Under Review/Approved per market (Natasha, Elena)
6. **Convert `claims` and `metadata` from String to Json type** — now that DB is Postgres (Mei)
7. **Convert `leadTime` from String to Int** — enables timeline math (Mei)

---

## Strategic Recommendations

1. **Regulatory intelligence first** — Even a basic ingredient-market restriction matrix would be transformative. Highest-value, most defensible capability. The MIT-at-100x-EU-limit finding proves the urgency.
2. **API layer + integrations** — REST/GraphQL, webhooks, SSO. Without this, enterprise procurement won't evaluate.
3. **Add dates and timelines** — Target launch dates, milestone due dates, time-in-stage analytics.
4. **Financial layer** — COGS, unit costs, margin estimates. Connect packaging costs (already modeled) to projects.
5. **Portfolio dashboard** — Aggregate projects by category/market/stage. Funnel view. Pipeline value.
6. **Don't try to replace MS Project** (Liam's advice) — Instead, integrate with tools PMs already use. Webhooks + Slack + CSV export > building a Gantt chart.

---

## Individual Reviews

| # | File | Persona |
|---|---|---|
| 01 | [01-sophie-product-developer-le.md](01-sophie-product-developer-le.md) | Sophie Langford, Product Developer (LE) |
| 02 | [02-dr-kenji-head-of-formulation-le.md](02-dr-kenji-head-of-formulation-le.md) | Dr. Kenji Tanaka, Head of Formulation (LE) |
| 03 | [03-ava-strategist-le.md](03-ava-strategist-le.md) | Ava Chen, Portfolio Strategist (LE) |
| 04 | [04-liam-collaborator-le.md](04-liam-collaborator-le.md) | Liam Ortega, Project Manager (LE) |
| 05 | [05-natasha-brand-manager.md](05-natasha-brand-manager.md) | Natasha Reeves, Brand Manager |
| 06 | [06-david-compliance-qa-manager.md](06-david-compliance-qa-manager.md) | David Loh, Compliance & QA Manager |
| 07 | [07-mei-analytics-analyst.md](07-mei-analytics-analyst.md) | Mei Zhang, Analytics Analyst |
| 08 | [08-dr-amara-regulatory-specialist.md](08-dr-amara-regulatory-specialist.md) | Dr. Amara Osei, Regulatory Specialist |
| 09 | [09-elena-marketing-manager.md](09-elena-marketing-manager.md) | Elena Vasquez, Marketing Manager |

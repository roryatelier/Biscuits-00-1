# Atelier Platform01 — User Research Synthesis

**Date:** 17 March 2026
**Author:** Rory G, Product Manager — Platform01
**Method:** Synthetic persona review — 9 persona agents independently reviewed the full Atelier codebase
**Personas reviewed:** 4 Large Enterprise (Product Developer, Head of Formulation, Portfolio Strategist, Project Manager) + 5 Cross-Functional (Brand Manager, Compliance/QA, Analytics, Regulatory Affairs, Marketing Manager)

---

## 1. Executive Summary

**Insight 1: Regulatory intelligence is not a roadmap item — it is an existential liability.** The platform allows a formulation with a banned ingredient at 100x the EU legal limit to be marked "Approved" and linked to a launched project with zero system objection, which means every brand using Platform01 is one click away from a compliance failure.

**Insight 2: The platform has earned domain credibility ("built by people who've sat in NPD meetings") but serves only the operational middle of the product development lifecycle** — the brief-to-sample workflow is well-modeled, while strategic planning (portfolio, financial, timeline) and scientific depth (formulation science, stability, specifications) are both absent.

**Insight 3: Only 2 of 9 personas would adopt today, but 7 of 9 praised the architecture and domain understanding** — the gap is not vision or data model quality, it is the absence of dates, regulatory enforcement, API access, and the analytical/strategic layers that enterprise buyers require.

---

## 2. Key Pain Points

Ranked by frequency across personas (number of personas who flagged it) and severity (impact on adoption).

### P0 — Adoption Blockers

**2.1 No regulatory intelligence or compliance engine**
- **Flagged by:** Sophie, Kenji, David, Amara, Natasha (5/9 personas)
- **Severity:** Critical — creates legal liability
- The platform has zero awareness of ingredient concentration limits, market-specific restrictions, or banned substance lists. The "Regulatory summary" tab displays "Not yet assessed" for every formulation, with restricted/advisory counts hardcoded to zero.
- David (Compliance): *"A formulation with a banned ingredient at 100x the legal concentration can be marked 'Approved' and linked to a 'Launched' project without any system objection."*
- Amara (Regulatory): *"The flag filters are UI decoration. I will continue using my spreadsheets."*
- Sophie (Product Developer): *"This is a table-stakes feature for any enterprise beauty PLM, and its absence means I cannot use this as my system of record."*
- **The killer finding:** Methylisothiazolinone is seeded at 0.15% in a rinse-off formulation. The EU limit is 0.0015%. That is 100x over the legal limit. The formulation is marked "Approved" for the UK market. Zero flags raised.

**2.2 No dates, timelines, or launch windows anywhere in the system**
- **Flagged by:** Sophie, Ava, Liam, Natasha, Elena (5/9 personas)
- **Severity:** Critical — every persona needs time-based planning
- There is no `targetLaunchDate` on the Project model, no milestone due dates, no dependency tracking. The progress bar derives "progress" from status position (25% = In Development), not actual timeline performance.
- Natasha (Brand Manager): *"Without dates, this is a tracker, not a planning tool."*
- Elena (Marketing): *"Without dates, I can't plan backwards from a launch to schedule media buys, influencer sends, or content creation windows."*
- Liam (Project Manager): *"A project in 'In Development' is always 25%. That is not progress tracking — that is a status badge with a visual flourish."*

### P1 — Must-Have for Enterprise

**2.3 No API, export, or integration surface**
- **Flagged by:** Sophie, Liam, Mei (3/9 personas, but blocks entire categories of users)
- **Severity:** High — blocks analytics, integration, and enterprise procurement
- There are no REST/GraphQL endpoints, no CSV export, no webhooks, no SSO. Everything runs through Next.js server actions requiring a session context.
- Sophie (Product Developer): *"Without at minimum a REST or GraphQL API, CSV import/export, or webhook notifications, this cannot coexist with my current stack."*
- Mei (Analytics): *"No programmatic way to pull data from this system."*
- Liam (Project Manager): *"Give me a webhook when a sample status changes so my Smartsheet timeline auto-updates."*

**2.4 Formulation data model is too shallow for R&D**
- **Flagged by:** Kenji, David, Amara (3/9 personas — all science/compliance roles)
- **Severity:** High — R&D will not adopt
- No phase assignment (oil/water/cool-down), no processing parameters, no pH/viscosity specifications, no stability data model, no supplier information on ingredients, no version history with diffs.
- Kenji (Head of Formulation): *"This is a product management tool with a thin layer of cosmetic vocabulary painted on top."*
- Kenji: *"Two serums with identical INCI lists and percentages can perform completely differently based on how they are made. This platform has no way to capture that."*

**2.5 No financial or costing layer**
- **Flagged by:** Sophie, Ava, Liam, Mei (4/9 personas)
- **Severity:** High — blocks portfolio decisions and business cases
- No COGS estimate, no target retail price, no margin analysis, no pipeline value. Packaging has `unitCost` but is not linked to projects.
- Ava (Strategist): *"Without economics, this is a project tracker, not a portfolio tool."*

**2.6 No approval workflows or stage gates**
- **Flagged by:** Sophie, Liam, David (3/9 personas)
- **Severity:** High — no governance
- Any team member can advance a project from Brief to Launched without sign-off. No role-based permissions on status transitions, no mandatory compliance review, no approval documentation.
- David (Compliance): *"Nothing ships without my signature. This platform has no signature, no sign-off, no review gate."*

### P2 — Important but Not Blocking

**2.7 No portfolio-level views**
- **Flagged by:** Ava, Sophie (2/9, but critical for leadership adoption)
- Ava: *"This operates entirely 'below my altitude.'"*

**2.8 Packaging not linked to projects**
- **Flagged by:** Sophie, Elena, Mei (3/9 — quick win)

**2.9 Claims are decorative tags, not validated against formulations**
- **Flagged by:** Natasha, David, Elena (3/9)
- David: *"'Anti-dandruff' — In Australia, this is a therapeutic claim regulated by the TGA, not a cosmetic claim."*

**2.10 Free-text fields need enums**
- **Flagged by:** Mei, David (2/9 — data quality)
- Mei: *"If one PM types 'Skin Care' and another types 'Skincare', my category breakdown is wrong."*

---

## 3. User Patterns & Behaviors

### 3.1 Every persona evaluated the platform against their existing toolset — not in isolation
No one asked "is this good?" They asked "does this replace something I already use?" The answer was consistently no. Liam was most explicit: *"It would be tool #7 in my stack, not a replacement for any of the existing 6."* Sophie listed SAP, Oracle PLM, and Smartsheet. Mei has Python scripts and Tableau. Amara has her spreadsheets. The behavioral insight: **enterprise users do not adopt tools that cover 20% of their workflow while requiring them to maintain the other 80% elsewhere.**

### 3.2 Collaboration features were universally valued — but not enough to drive adoption alone
Every persona acknowledged the activity feed, notifications, and threaded comments as improvements over email/Slack-based status chasing. Elena: *"If I'd had this for the last launch, I would have known that the formula was still being changed two weeks before our photoshoot."* Natasha estimated 3-4 hours per week saved in status chasing. But no persona said collaboration alone was sufficient reason to adopt.

### 3.3 Domain credibility buys goodwill — then raises expectations
Multiple personas noted that the platform was clearly designed by people who understand beauty product development. Sophie: *"Designed by people who have actually sat in NPD meetings, not enterprise software generalists."* But this credibility creates higher expectations. Kenji's frustration was sharpest because the platform uses the right vocabulary without the right depth: *"The UI uses words like 'INCI Name,' 'CAS Number,' and 'Surfactant,' but the underlying data model has no awareness of what those terms actually mean."*

### 3.4 The "would use today" personas are relationship-oriented roles, not technical specialists
Natasha (Brand Manager) and Elena (Marketing Manager) — the two personas who would adopt — are both cross-functional coordinators whose primary pain is visibility and communication. The four enterprise personas (Sophie, Kenji, Ava, Liam) and the three specialist personas (David, Amara, Mei) all require deeper domain-specific depth that does not yet exist.

### 3.5 Share links are the most underrated feature
Every persona who encountered the share link system (crypto-random tokens, 7-day expiry, IP-aware visibility toggles for ingredients and reviews, admin-only creation, revocation) called it out positively. Sophie called it "genuinely differentiated." Elena identified it as critical for agency collaboration. This feature solves a real, daily pain point (sharing formulation data externally without exposing IP) that no one has a good alternative for.

### 3.6 The "Regulatory summary" tab actively creates false confidence
David and Amara both flagged that showing a "Regulatory summary" tab — even one that says "Not yet assessed" — implies the platform has regulatory capability. Users may assume that if the tab does not flag anything, the formulation is compliant. David: *"The danger is that product teams will use the 'Approved' status and 'Regulatory summary' tab as signals that compliance has been addressed, when the system has zero capability to perform or enforce compliance checking."*

---

## 4. Personas & Segments — Who to Build For First

### Tier 1: Build for now — highest adoption probability, lowest capability gap

| Persona | Role | Current Score | Why first |
|---|---|---|---|
| **Natasha Reeves** | Brand Manager | 6/10 (9/10 potential) | Already sees value in visibility + sample tracking. Needs dates and claim validation. |
| **Elena Vasquez** | Marketing Manager | 7/10 (9/10 potential) | Wants to use it. Needs dates, packaging links, and ingredient descriptions surfaced. |

**Rationale:** These personas represent the cross-functional coordinators who sit between R&D and go-to-market. Their needs are achievable with targeted additions (dates, packaging links, claim status, surfacing existing data). They are also the personas most likely to drive organic adoption — if brand and marketing managers use the platform daily, they pull other functions in.

### Tier 2: Build for next — high strategic value, moderate capability gap

| Persona | Role | Current Score | Why next |
|---|---|---|---|
| **Sophie Langford** | Product Developer (LE) | Watch closely | The core daily user. Needs API, approval workflows, regulatory basics, timelines. |
| **Mei Zhang** | Analytics Analyst | 7/10 model, 2/10 queryability | Data model is sound. Needs API/export, enums, and date fields. |
| **Liam Ortega** | Project Manager (LE) | 4/10 enterprise, 7/10 small team | Do not try to replace MS Project. Integrate via webhooks + API. |

**Rationale:** Sophie is the target daily operator. Getting her to "would champion internally" requires the API layer, basic regulatory intelligence, and approval workflows — all on the P0-P1 list anyway. Mei and Liam unlock analytics and PM integration respectively, both of which are table-stakes for enterprise deals.

### Tier 3: Build for later — deepest capability gap, highest defensibility once built

| Persona | Role | Current Score | Why later |
|---|---|---|---|
| **Dr. Kenji Tanaka** | Head of Formulation (LE) | Not yet | Requires fundamental data model extension (phases, specs, stability, processing). |
| **David Loh** | Compliance/QA | Not adoptable | Requires regulatory database and enforcement engine. |
| **Dr. Amara Osei** | Regulatory Specialist | Not adoptable | Requires cross-market compliance engine with AICIS/TGA/EU support. |

**Rationale:** These are the highest-defensibility personas — once Atelier has a real regulatory intelligence engine and formulation science depth, it becomes extremely hard to replicate. But the capability gap is large. Build the foundation (Tier 1 + 2) while investing in regulatory data infrastructure in parallel.

### Tier 4: Not the near-term target

| Persona | Role | Current Score | Why not now |
|---|---|---|---|
| **Ava Chen** | Portfolio Strategist (LE) | Would not log in | Requires portfolio dashboards, financial data, and strategic analytics — all dependent on Tier 2 infrastructure. |

**Rationale:** Ava will log in when the data from Tier 1-3 users rolls up into portfolio-level views. She is a downstream beneficiary, not a primary adopter. Do not build for Ava directly — build the data foundation and the portfolio view will follow.

---

## 5. Jobs-to-Be-Done

### Cluster 1: Visibility & Status (addressed today — partially)

| JTBD | Persona(s) | Platform coverage |
|---|---|---|
| When a project changes status, I need to know immediately so I can adjust my plans | Natasha, Elena, Sophie | **Addressed** — activity feed + notifications |
| When I check on a sample, I need to see its exact stage without asking anyone | Natasha, Elena, Sophie | **Addressed** — sample tracking pipeline |
| When I share project details with an external partner, I need to control what they see | Sophie, Elena, Natasha | **Addressed** — share links with IP controls |

### Cluster 2: Planning & Timelines (not addressed)

| JTBD | Persona(s) | Platform coverage |
|---|---|---|
| When I start a project, I need to set a target launch date and work backwards to set milestones | Natasha, Elena, Sophie, Liam | **Not addressed** — no date fields |
| When a delay occurs, I need to see which launch dates are at risk across all my projects | Liam, Sophie, Ava | **Not addressed** — no dependencies or dates |
| When I plan a campaign, I need to know when products will be ready so I can book media and influencers | Elena | **Not addressed** — no timeline data |

### Cluster 3: Regulatory & Compliance (not addressed)

| JTBD | Persona(s) | Platform coverage |
|---|---|---|
| When I select a target market, I need the system to flag restricted ingredients in my formulation | David, Amara, Sophie, Natasha | **Not addressed** — hardcoded to zero |
| When I make a product claim, I need to know if my formulation can substantiate it | Natasha, David, Elena | **Not addressed** — claims are tags |
| When I approve a formulation, I need documented sign-off that it meets regulatory requirements | David, Sophie | **Not addressed** — no approval gates |

### Cluster 4: Formulation Science (not addressed)

| JTBD | Persona(s) | Platform coverage |
|---|---|---|
| When I develop a formulation, I need to record phases, processing parameters, and specifications | Kenji | **Not addressed** — ingredient-level only |
| When I iterate on a formulation, I need to see what changed between versions and why | Kenji, Sophie | **Not addressed** — single version, no history |
| When I evaluate a sample, I need to test it against specifications, not consumer sentiment scales | Kenji | **Not addressed** — review is sensory only |

### Cluster 5: Data & Integration (not addressed)

| JTBD | Persona(s) | Platform coverage |
|---|---|---|
| When I need to analyse pipeline performance, I need to query data programmatically | Mei | **Not addressed** — no API/export |
| When a status changes in Atelier, I need my other tools to update automatically | Liam, Sophie | **Not addressed** — no webhooks |
| When I prepare a steering committee deck, I need a cross-project summary I can export | Liam, Ava | **Not addressed** — no reporting |

### Cluster 6: Portfolio & Strategy (not addressed)

| JTBD | Persona(s) | Platform coverage |
|---|---|---|
| When I allocate resources, I need to see the entire innovation pipeline by category, market, and stage | Ava | **Not addressed** — flat project list |
| When I evaluate portfolio balance, I need financial data alongside development status | Ava, Sophie | **Not addressed** — no financial layer |

---

## 6. Product Implications — Roadmap Recommendations

### Immediate (next 2-4 weeks) — Quick Wins

These require minimal engineering effort and deliver disproportionate signal to users.

1. **Add `targetLaunchDate` to the Project model.** One DateTime field. Unlocks timeline views for 5 personas. This is the single highest-leverage schema change available.
2. **Surface the ingredient `description` field in the formulation detail UI.** The data already exists in the database. Elena needs it for marketing storytelling. Zero schema change required.
3. **Link PackagingOption to Project via a junction table.** Connects content to products. Unlocks BOM assembly path. Elena, Sophie, and Mei all need this.
4. **Convert free-text status, category, and market fields to enums.** Data quality fix that enables reliable analytics. Mei flagged this specifically.
5. **Add claim approval status field** (Draft / Under Review / Approved, per market). Natasha and Elena both requested this.
6. **Convert `claims` and `metadata` from String to Json type.** The database is already Postgres. This enables querying claims without string parsing.
7. **Convert `leadTime` from String to Int.** Enables timeline math.

### Short-term (1-3 months) — Foundation for Enterprise

8. **Build a basic regulatory intelligence layer.** Start with an `IngredientRestriction` model mapping ingredients to per-market concentration limits and restriction status. Even a curated database of the 200 most common cosmetic ingredients with EU Annex status, SUSMP scheduling, and FDA monograph limits would be transformative. This is the single most defensible capability Atelier can build.
9. **Ship a read-only REST API** with token-based auth. `GET /api/projects`, `GET /api/formulations`, `GET /api/samples`. Add CSV export on every list view. This unblocks analytics (Mei), PM integration (Liam), and enterprise procurement (Sophie).
10. **Add configurable approval workflows.** Start simple: require a user with a specific role to sign off before a formulation status can move to "Approved." Do not build a full workflow engine — build a gate.
11. **Add date fields to milestones and status transitions.** `shippedAt`, `deliveredAt` on SampleOrder. Milestone due dates with owners. Enable time-in-stage analytics.
12. **Build a portfolio dashboard.** Aggregate projects by category, market, and stage. Funnel visualisation. Pipeline view. This gives Ava a reason to log in.

### Medium-term (3-6 months) — Depth and Defensibility

13. **Deepen the formulation data model.** Phase-based ingredient tables, processing parameters, specification model (target/min/max for pH, viscosity, appearance). Formulation version history with diffs and rationale capture.
14. **Build cross-market compliance comparison.** When a formulation is tagged for multiple markets, show the most restrictive limit for each ingredient. Flag violations automatically.
15. **Implement claims-to-formulation validation.** When a project claims "Anti-dandruff," check that the linked formulation contains an appropriate active at a compliant concentration for the selected market.
16. **Add SSO (SAML/OIDC).** Enterprise procurement will not evaluate without it.
17. **Webhook system for external integrations.** Do not build Gantt charts — integrate with the tools PMs already use (Liam's advice: *"Meet me where I already live instead of asking me to move"*).

### Do Not Build (Liam's Rule)

- Do not try to replace MS Project, Smartsheet, or any dedicated PM tool. Atelier wins by being the system of record for product development data, not by replicating project scheduling.
- Do not build a full PLM competitor. Build the connective tissue (API + webhooks) that lets Atelier coexist with existing PLM systems.

---

## 7. Research Gaps — What Synthetic Personas Cannot Tell Us

### 7.1 Willingness to pay
Synthetic personas can evaluate feature gaps but cannot tell us what brands would actually pay for regulatory intelligence, API access, or portfolio dashboards. We do not know the price sensitivity or packaging of these capabilities.

### 7.2 Switching costs and change management burden
Sophie estimated her team covers "20% of their workflow" — but we do not know the real switching cost. How entrenched are existing tools? What is the migration path from SAP/Oracle PLM? What does onboarding actually look like?

### 7.3 Real user behavior vs. stated preference
Synthetic personas tell us what an idealised user *would* do. Real users skip steps, use workarounds, ignore features they asked for, and adopt tools for unexpected reasons. The two "would adopt" personas (Natasha, Elena) may use the platform differently than predicted.

### 7.4 Indie brand vs. enterprise prioritisation
These 9 personas skew heavily toward large enterprise and cross-functional roles. Atelier's current user base and revenue likely comes from indie brands (1-20 person teams). We have no research on whether the indie brand experience would be degraded by enterprise-oriented features.

### 7.5 Regulatory database feasibility
Multiple personas identified regulatory intelligence as the highest-value capability. But we do not know the cost, licensing, or maintenance burden of building and maintaining a multi-market regulatory database. Is this a build-vs-buy decision? Are there API providers (CosIng, ECHA) that can be integrated?

### 7.6 Competitive positioning validation
Ava noted zero competitive intelligence capability, but we also have no research on how competitors (existing PLM vendors, other beauty-tech platforms) are positioned relative to the gaps identified here. Are competitors already solving these problems?

### 7.7 AI feature appetite
Natasha flagged AI (feasibility checking, claim substantiation, regulatory intelligence) as the feature that turns Platform01 from "nice internal tool" into "competitive weapon." But we do not know the actual appetite for AI-driven features among real users, or whether they trust AI for compliance-adjacent decisions.

---

## 8. Recommended Next Steps

### 8.1 Validate with real users immediately
Run 5-7 interviews with current Platform01 users (indie brands) and 3-5 interviews with prospective enterprise buyers. Focus on:
- Which of the top 5 pain points they independently identify (do not lead)
- How they currently solve regulatory compliance — what tools, what manual processes
- Willingness to pay for regulatory intelligence as a standalone capability
- Reaction to the "Approved formulation with banned ingredient" scenario

### 8.2 Quantify the regulatory risk
Work with David's real-world equivalent (Compliance/QA) to audit the current seed data and any production data for regulatory violations. If real formulations in the platform have compliance issues and the system is silent, this is not a feature gap — it is a liability that needs a short-term mitigation (even a warning banner on the Regulatory tab).

### 8.3 Competitive analysis of PLM and beauty-tech landscape
Map competitor capabilities against the top 10 gaps identified here. Specifically: which competitors have regulatory intelligence, API access, and portfolio dashboards? Where can Atelier leapfrog vs. where must it reach parity?

### 8.4 Prototype the regulatory intelligence layer
Before building a full regulatory database, prototype a minimal version: 50 ingredients, 3 markets (AU, EU, US), concentration limits only. Test with David and Amara equivalents. Determine if a curated database or an API integration (CosIng, ECHA) is the right approach.

### 8.5 Ship the quick wins and measure adoption
The 7 quick wins in Section 6 (targetLaunchDate, ingredient descriptions, packaging links, enums, claim status, JSON types, leadTime conversion) require minimal engineering effort. Ship them, then measure: do Natasha and Elena equivalents increase their login frequency and session duration?

### 8.6 Define the enterprise evaluation criteria
Sophie listed specific blockers: API, SSO, regulatory intelligence, multi-brand architecture. Work with 2-3 enterprise procurement teams to validate whether these are hard requirements or negotiable for an early-stage platform with strong domain fit.

---

## Appendix: Source Persona Reviews

| # | File | Persona | Score |
|---|---|---|---|
| 01 | `01-sophie-product-developer-le.md` | Sophie Langford, Product Developer (LE) | Watch closely |
| 02 | `02-dr-kenji-head-of-formulation-le.md` | Dr. Kenji Tanaka, Head of Formulation (LE) | Not yet |
| 03 | `03-ava-strategist-le.md` | Ava Chen, Portfolio Strategist (LE) | Would not log in |
| 04 | `04-liam-collaborator-le.md` | Liam Ortega, Project Manager (LE) | 4/10 enterprise, 7/10 small team |
| 05 | `05-natasha-brand-manager.md` | Natasha Reeves, Brand Manager | 6/10 (9/10 potential) |
| 06 | `06-david-compliance-qa-manager.md` | David Loh, Compliance/QA Manager | Not adoptable |
| 07 | `07-mei-analytics-analyst.md` | Mei Zhang, Analytics Analyst | 7/10 model, 2/10 queryability |
| 08 | `08-dr-amara-regulatory-specialist.md` | Dr. Amara Osei, Regulatory Specialist | Not adoptable |
| 09 | `09-elena-marketing-manager.md` | Elena Vasquez, Marketing Manager | 7/10 (9/10 potential) |

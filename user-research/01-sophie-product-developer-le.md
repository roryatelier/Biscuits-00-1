# Atelier Platform Review — Sophie Langford, Senior Product Developer (Large Enterprise)

**Reviewer:** Sophie Langford, Senior Product Developer
**Date:** 17 March 2026
**Scope:** Full application review

---

## First Impressions

This platform is designed for small-to-mid-size beauty/cosmetics companies -- specifically contract manufacturing or indie brand teams who need to manage the lifecycle from product brief through formulation, sampling, and launch. The navigation (Dashboard, Projects, Catalogs with Formulations + Packaging, Sample Tracking, Documents, Team) maps loosely to how I think about product development.

The data model tells the real story: a Project moves through four statuses (Brief, In Development, Sampling, Launched), links to Formulations (which carry INCI ingredient lists with percentages and CAS numbers), generates Sample Orders that flow through Pending/In Production/Shipped/Delivered, and can be reviewed on texture, scent, colour, and overall scores. There is a PackagingOption catalog with format, material, MOQ, unit cost, and lead time. This is recognizably a product development workflow.

At first glance, it feels like it was built for a team of 5-15 people working on one brand in one or two markets. That is not my world -- but I can see the seed of something useful here.

---

## What Excites Me

### 1. The project-to-formulation-to-sample pipeline is actually modeled.
Most tools I use treat formulations as documents in SharePoint or rows in a spreadsheet. Here, a Formulation is a first-class entity with versioning (`version` field), status tracking (Draft, In Review, Approved, Archived), ingredient composition with INCI names and CAS numbers, and a direct link to the Projects that use it. The `ProjectFormulation` junction table means one formulation can serve multiple projects -- which is exactly how we work when a hero ingredient platform spawns multiple SKUs.

### 2. Sample review scoring is structured.
The `SampleReview` model (texture/scent/colour/overall on 1-5 scales plus notes) is something I currently do in email or, at best, a Google Form. Having this attached directly to the sample order, with the reviewer identified, means I could actually pull up historical review data when deciding which formulation variant to advance. That would save me at least one meeting per project cycle.

### 3. External share links with controlled visibility.
The `ShareLink` model with `includeIngredients` and `includeReviews` toggles, expiry dates, and revocation is genuinely well-thought-out. Today, when I need to share a formulation brief with a contract manufacturer or a retail buyer, I am either emailing a PDF with too much information or stripping it down manually. The fact that I can generate a link that shows the project status and formulation names but hides the ingredient percentages -- that is IP-aware sharing. This is the kind of feature that would get attention from our Legal and Regulatory teams.

### 4. Activity feed and notifications tied to project context.
The Activity model tracks status changes, formulation links/unlinks, sample orders, reviews, and comments -- all scoped to a project. The notification fan-out rules (e.g., "sample status advanced notifies the sample order creator," "review submitted notifies project lead") map to real handoff points. If this works as described, it could reduce the number of "just checking in" Slack messages I send daily.

### 5. Multi-market awareness in the data model.
Projects have a `market` field (AU, US, EU, JP, etc.) and the new project form allows multi-market selection. The `claims` field (stored as JSON) captures product claims like "Anti-dandruff" or "SPF protection." This is the beginning of regulatory awareness, which is where I spend a painful amount of time today.

---

## What Concerns Me

### 1. No regulatory workflow -- this is the biggest gap.
The market and claims fields exist, but there is no regulatory assessment, no ingredient restriction checking, no market-specific compliance flags. In my world, "regulation impact analysis takes weeks" is a real problem, and the data model has no `RegulatoryFlag`, `MarketRestriction`, or `ComplianceCheck` entity. The Ingredient model stores INCI name, CAS number, and function -- but no concentration limits, no restricted-market flags, no allergen declarations. If I select "EU" and "China" as target markets and add a formulation with a restricted ingredient, the platform will not tell me anything. This is a table-stakes feature for any enterprise beauty PLM, and its absence means I cannot use this as my system of record for formulation development.

### 2. No BOM (Bill of Materials) or costing.
The PackagingOption model has `unitCost` and `moq`, which is helpful. But there is no link between a Packaging Option and a Project or Formulation. I cannot assemble a full BOM -- primary packaging + secondary packaging + formulation cost per unit. There is no cost rollup, no landed cost calculation, no margin analysis. I manage 15-30 SKUs and I need to know the per-unit cost of each at any point in development.

### 3. Formulation versioning is not real.
The schema has a `version` string field on Formulation, defaulting to "1.0". But the PLAN.md explicitly states "Formulation version history -- Single version. Versioning is complex, not needed for demo." In practice, a formulation goes through 10-20 iterations before approval. Without version history (who changed what, when, and why), audit trail, and the ability to compare versions side-by-side, R&D will not adopt this. They will keep their Excel sheets.

### 4. No approval workflows or gates.
Projects move through Brief, In Development, Sampling, Launched -- but there is no stage-gate model. No approval required to advance. No sign-off from Regulatory, Quality, or Marketing before a project moves to the next phase. The `ProjectMilestones` component derives milestones purely from the status string; they are not configurable, cannot have owners, and cannot require sign-offs. In a multinational, every status transition involves multiple stakeholders and documented approval. This platform lets anyone click "advance" without governance.

### 5. Single-team, single-tenant architecture.
The Team model is flat: one team, three roles (Admin, Editor, Viewer). I work across three brands, each with their own R&D, marketing, and regulatory teams. There is no concept of brand, business unit, or organizational hierarchy. There is no multi-tenant data isolation. The `TeamMember` role model (admin/editor/viewer) is far too coarse -- I need role-based access at the project level (e.g., R&D can edit formulations but not marketing briefs; Regulatory can approve but not edit). The `ProjectAssignment` model (lead/member) is a start, but it does not enforce permissions.

### 6. No integration surface.
There is no API layer, no webhooks, no import/export. The entire application is Next.js server actions talking to a local SQLite database. I need this to connect to SAP for materials management, Oracle PLM for our existing formulation library, and Smartsheet for timeline tracking. Without at minimum a REST or GraphQL API, CSV import/export, or webhook notifications, this cannot coexist with my current stack. It would be yet another standalone tool.

### 7. SQLite in production.
The PLAN.md acknowledges this: "Keep SQLite. Migrate to Postgres before external share links." But external share links are already built. SQLite does not support concurrent writes, which means if two people submit a sample review at the same time, one will get a lock error. This is a non-starter for any team larger than 3-4 people.

### 8. No timeline or Gantt view.
Product development is fundamentally time-bound. I need to see: when is the brief due, when do samples need to ship, what is the launch date, where are we against the timeline. There is no date field on Project beyond `createdAt`/`updatedAt`. No target launch date, no milestone due dates, no dependency tracking. The dashboard shows counts and recent activity but not a portfolio-level timeline view.

---

## Integration & Scale

**Can this work alongside my existing SAP/Oracle stack?** Not in its current form. There is no API, no data export, no SSO (it uses credentials-based auth with bcrypt passwords -- OAuth providers are explicitly out of scope). Enterprise procurement would flag this immediately.

**Could it scale to my workload?** Managing 15-30 SKUs across 3 brands in 5+ markets, with teams of 20-40 people -- no. The flat team model, lack of brand hierarchy, absence of field-level permissions, and SQLite database would all break down. The data model is sound for a single-brand indie operation, but it needs substantial extension for enterprise use.

---

## Adoption Risk

**Would my cross-functional team actually use this?**

Honestly, I would struggle to get adoption. Here is how each function would react:

- **R&D:** "Where is version control on formulations? Where are my concentration limits? I'll keep using my spreadsheet."
- **Regulatory:** "There is no compliance checking, no restricted substance database, no market-specific rules engine. This does not replace any of my tools."
- **Marketing:** "I can see the project brief, but where is the campaign brief, the packaging artwork approval flow, the claims substantiation tracker?"
- **Packaging:** "The catalog is nice, but I cannot link a packaging option to a project or generate a BOM."
- **Quality:** "Where is the stability testing tracker? Where are the batch records? Where is the CAPA workflow?"
- **Supply Chain:** "No lead time tracking, no supplier management, no PO integration."

The change management burden would be high because I would be asking people to adopt a tool that covers maybe 20% of their workflow while they continue using their existing tools for the other 80%.

---

## Verdict

**Would I champion this internally?** Not yet. But I would watch it closely.

Here is what I see: the team behind this understands product development in beauty. The data model -- Project, Formulation with INCI ingredients, Sample Orders with structured reviews, Packaging catalog -- is the right conceptual foundation. The external sharing with IP controls is genuinely differentiated. The activity feed and notification system show that they are thinking about collaboration, not just data entry.

**What would need to change for me to bring this to my leadership:**

1. **Regulatory intelligence.** Even a basic ingredient-market restriction matrix (this ingredient is banned/restricted in EU, this claim requires substantiation in AU) would be transformative. This is the single highest-value capability gap.

2. **Real versioning and audit trail on formulations.** Non-negotiable for R&D adoption and regulatory compliance.

3. **Stage-gate approval workflows.** Configurable gates with required sign-offs before status transitions.

4. **API layer.** REST or GraphQL endpoints, webhook support, and SSO (SAML/OIDC) for enterprise auth. Without this, procurement will not even evaluate it.

5. **Multi-brand/multi-region data architecture.** The Team model needs to support organizational hierarchy, and permissions need to be granular at the project and entity level.

6. **Timeline and portfolio views.** Target dates on milestones, a portfolio-level Gantt or roadmap, and the ability to see all 30 of my SKUs on one screen with their current stage and health status.

7. **BOM assembly.** Link packaging options to projects, roll up formulation + packaging + filling costs, and give me a per-unit cost estimate.

The foundation is solid. The taste level is right -- this feels like it was designed by people who have actually sat in NPD meetings, not enterprise software generalists. But right now it is a seed-stage tool for a 5-person indie brand, and I need an enterprise-grade platform. I would recommend the Atelier team prioritize the API layer and regulatory intelligence above all else -- those are the two capabilities that would make this platform genuinely defensible and enterprise-adoptable.

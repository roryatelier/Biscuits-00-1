# Atelier Platform Review — Dr. Kenji Tanaka, Head of Formulation Science (Large Enterprise)

**Reviewer:** Dr. Kenji Tanaka, Head of Formulation Science
**Date:** 17 March 2026
**Scope:** Formulation data model, ingredient management, R&D workflow suitability

---

## 1. Scientific Rigour: This does not understand formulation science.

Let me be direct. This is a product management tool with a thin layer of cosmetic vocabulary painted on top. The UI uses words like "INCI Name," "CAS Number," and "Surfactant," but the underlying data model has no awareness of what those terms actually mean in a formulation context.

The `Ingredient` model (`prisma/schema.prisma`) captures exactly four fields: `name`, `casNumber`, `function`, and `description`. That is it. No molecular weight, no HLB value, no solubility parameters, no pH range, no grade, no supplier, no specification limits, no regulatory maximum concentrations, no physical form. This is not an ingredient record -- it is a glossary entry.

The `FormulationIngredient` join table captures `percentage` and `role`. Percentage of what? Weight percent? Volume percent? The system does not know, and does not validate that percentages sum to 100. There is no phase assignment (oil phase, water phase, cool-down phase), no addition order, no processing temperature, no mixing speed. Any formulator on my team would tell you that two serums with identical INCI lists and percentages can perform completely differently based on how they are made. This platform has no way to capture that.

The seed data reveals the issue clearly. The "Hydra-Plump Moisture Serum" lists Cetearyl Alcohol at 4% and Dimethicone at 3% alongside Hyaluronic Acid at 2% -- but there is no emulsifier listed, no indication of whether this is an O/W or W/O system, no processing method. A junior formulator looking at this would have no idea how to actually make this product.

## 2. Data Model Assessment: Insufficient for R&D, adequate for a marketing catalog.

**What exists:**
- Formulation: `name`, `category`, `status` (Draft/In Review/Approved/Archived), `market`, `version` (string, not tracked), `description`
- Ingredient: `name`, `casNumber`, `function`, `description`
- FormulationIngredient: `formulationId`, `ingredientId`, `percentage` (Float), `role`

**What is critically absent:**

- **No pH specification.** Every formulation I approve has a target pH and acceptable range. This is non-negotiable for stability and efficacy.
- **No viscosity specification.** My team measures viscosity at multiple timepoints during stability testing.
- **No physical/chemical specifications** (appearance, colour, odour, specific gravity, refractive index).
- **No stability data model.** The PLAN.md explicitly lists "Formulation version history" as NOT in scope. There is no stability protocol linkage, no accelerated aging data, no freeze-thaw tracking. A document called "Stability Test Protocol" exists in the seed data, but it is just a file upload -- not structured data.
- **No batch/lot tracking.** The `SampleOrder` model records quantity and format but not batch number, manufacturing date, or expiry.
- **No supplier information on ingredients.** We use the same INCI from three different suppliers with different grades and specs. The `Ingredient` model has no `supplier`, `tradeName`, `grade`, or `specification` fields.
- **No regulatory concentration limits.** The UI in `FormulationDetailClient.tsx` has placeholder flag logic for "Restricted" and "Advisory" ingredients, but the comment says: "We don't have flag data in DB, so flags are empty for now." The regulatory tab displays "Not yet assessed" for everything. This is cosmetic (no pun intended).
- **No incompatibility tracking.** No way to flag that Ascorbic Acid and Niacinamide at certain pH ranges can cause flushing, or that Zinc Pyrithione is incompatible with EDTA above certain concentrations.
- **No emulsion type, no phase assignment, no processing parameters.**

The `version` field on Formulation is a plain string (`"2.1"`) with no version history table, no diff capability, no audit trail of what changed between v2.0 and v2.1. The PLAN.md acknowledges this explicitly: "Formulation version history -- Single version. Versioning is complex, not needed for demo."

## 3. IP & Knowledge Management: This is where it fails my team most.

Formulation IP walks out the door every time someone leaves. A platform that claims to serve R&D should be capturing *why* decisions were made, not just *what* the current state is.

**What exists:** Comments on projects (not on formulations directly from the data I can see in the schema -- comments use a polymorphic `entityType`/`entityId` pattern, so they *could* be attached to formulations). The Activity model logs events like "linked formulation" and "changed status." These are adequate for project management audit trails but worthless for formulation science knowledge capture.

**What is missing:**
- No structured rationale for ingredient selection. Why did we choose Piroctone Olamine over Zinc Pyrithione? That decision and its technical reasoning should be queryable, not buried in a comment thread.
- No formulation comparison tool. When I am evaluating two candidate formulations for a project, I need a side-by-side comparison of ingredient lists, concentrations, cost, and regulatory status.
- No formulation lineage/genealogy. Real R&D builds iteratively -- v1.2 was derived from v1.1 by swapping Preservative A for Preservative B because of [stability failure / regulatory change / cost]. This platform treats each formulation as an island.
- The ShareLink model has `includeIngredients` as a toggle. Good -- someone thought about IP exposure. But the granularity is binary: share all ingredients or none. In practice, I might share the INCI list with marketing but withhold percentages, or share percentages with a contract manufacturer but withhold our proprietary process.

## 4. Team Workflow: It would burden my team more than help them.

The sample review system asks for 1-5 scores on Texture, Scent, Colour, and Overall. This is a consumer panel tool, not an R&D evaluation. My formulators evaluate samples against specifications: Does the viscosity meet spec? Is the pH within range? What is the colour on the Gardner scale? What does the microscopy show about emulsion droplet size? A 1-5 score on "Texture & Feel" tells me nothing actionable.

There is no formulation creation or editing flow in the server actions. The `formulations.ts` actions file contains only `listFormulations`, `getFormulation`, and `getFormulationCategories` -- all read operations. Formulations can only be created through the database seed. My team cannot use this to actually formulate.

The project workflow (Brief -> In Development -> Sampling -> Launched) is a reasonable high-level pipeline, but it is a product management view, not an R&D view. My team's workflow looks more like: Feasibility -> Lab Scale -> Pilot -> Stability -> Scale-Up -> Production. These are different worlds.

## 5. Missing Science: The critical gaps.

In order of severity:

1. **No processing method / manufacturing instructions.** A formulation is not just a bill of materials.
2. **No stability testing framework.** This is the backbone of cosmetic development. Without it, "Approved" status is meaningless.
3. **No specification model** (target values, upper/lower limits for pH, viscosity, appearance, micro limits).
4. **No regulatory concentration database.** The EU Cosmetics Regulation Annexes, AICIS (Australia), FDA OTC monographs -- these define hard limits. This platform has no awareness of them.
5. **No cost modelling.** The `Ingredient` model has no unit cost. The `PackagingOption` model does have `unitCost` and `moq` -- so packaging is actually better modelled than formulations.
6. **No LIMS integration points.** No API for importing analytical results, no structured fields for test data.
7. **No scale-up parameters.** Lab bench (500g) to pilot (50kg) to production (5 tonne) -- different equipment, different processing parameters, different outcomes.
8. **No preservative efficacy (PET) tracking, no micro testing model, no challenge test linkage.**

## 6. Verdict: A starting point -- but barely, and only with the right framing.

This is a product management platform with cosmetic vocabulary. It is not a formulation management system. If you showed me this and said "this is our PLM for tracking product development projects," I would say it is a reasonable early prototype. The project pipeline, collaboration features (comments, activity feed, notifications, assignments), and sample ordering workflow are competent for a v1 product management tool.

But if you told me this would replace or augment my team's formulation workflow, I would decline. My formulators would spend their time fighting the tool's limitations rather than being freed by it. They would still need their lab notebooks, their Excel spreadsheets with phase calculations, their separate stability tracking sheets, and their regulatory databases. This platform would become yet another system to update, not the system of record.

**What would change my mind:**
- A proper `FormulationVersion` model with diff tracking and rationale fields
- Phase-based ingredient tables with processing instructions
- A `Specification` model with target/min/max for pH, viscosity, appearance, micro limits
- Structured stability data (timepoint, condition, parameter, result, pass/fail)
- Ingredient records with supplier, grade, trade name, and regulatory limits per market
- Batch/lot tracking on samples tied back to specific formulation versions
- R&D-grade sample evaluation (against spec, not consumer sentiment)

The bones are here. The schema is clean, the architecture is sound, and the collaboration layer is thoughtfully designed. But right now, this understands *products* -- it does not understand *formulations*. Those are fundamentally different things, and until that distinction is respected in the data model, this remains a tool for product managers, not for my lab.

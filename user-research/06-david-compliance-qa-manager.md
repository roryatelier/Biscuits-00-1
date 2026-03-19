# Atelier Platform Review — David Loh, Compliance & QA Manager (Cross-Functional)

**Reviewer:** David Loh, Compliance & Quality Assurance Manager
**Date:** 17 March 2026
**Verdict:** Not adoptable for compliance use in current state.

---

## 1. Regulatory Data: The Ingredient Database Is a Skeleton

The `Ingredient` model carries four fields: `name`, `casNumber`, `function`, and `description`. That is it.

For compliance work, I need -- at minimum:

- **Regulatory concentration limits** per market (AU AICIS/SUSMP, EU Annex III-VI, US FDA OTC monograph limits). Salicylic Acid is in the seed data at 0.50% in a rinse-off product -- is that within limits? The platform cannot tell me. Under the EU Cosmetics Regulation (EC) No 1223/2009, Annex III, Entry 98, salicylic acid is restricted to 2.0% in rinse-off and 0.5% in certain leave-on products, but not permitted in products for children under 3. There is no field in this schema to capture any of that.
- **Restriction status** per jurisdiction (permitted, restricted, prohibited, requires notification)
- **Annex classification** for EU (Annex II banned, Annex III restricted, Annex IV colourants, Annex V preservatives, Annex VI UV filters)
- **AICIS categorisation** for Australia (listed, assessed, new chemical requiring notification)
- **IFRA limits** for fragrance components (the `Parfum` ingredient with null CAS is a compliance black hole -- what allergens are in that blend?)
- **Nano-form declarations** (Titanium Dioxide and Zinc Oxide are in the seed data -- are these nano? The EU requires [nano] labelling per Article 19(1)(g))
- **CMR classification** data
- **Preservative efficacy challenge test** requirements

The seed data contains 30 ingredients. A working regulatory database needs access to the 1,600+ entries in the EU Annex II alone. **Methylisothiazolinone (CAS 2682-20-4) is in the seed at 0.15% in a rinse-off formulation. Under current EU regulation, MIT is banned in leave-on products entirely (Commission Regulation (EU) 2016/1198) and limited to 0.0015% (15 ppm) in rinse-off. The seeded concentration of 0.15% is 100 times the EU limit. The platform displays this without a single flag. That is a serious problem.**

---

## 2. Compliance Workflow: There Is No Approval Gate

The `Formulation` model has a `status` field with values: Draft, In Review, Approved, Archived. The `Project` model has: Brief, In Development, Sampling, Launched.

I see the status flow. What I do not see is any enforcement. Any authenticated team member can change a project from "Brief" directly to "Launched" -- there is no validation that:

- All linked formulations have status "Approved"
- A compliance review has been completed
- Stability data exists
- Challenge test results have been uploaded
- Safety assessment has been documented

Similarly, a formulation can be marked "Approved" by anyone. There is no role-based permission. There is no "regulatory" or "compliance" role, and no concept of a compliance sign-off.

In my current workflow, nothing ships without my signature. This platform has no signature, no sign-off, no review gate. **A formulation with a banned ingredient at 100x the legal concentration can be marked "Approved" and linked to a "Launched" project without any system objection.**

---

## 3. Claims Substantiation: Claims Are Just Tags

The `claims` field on the `Project` model is a JSON string array. The new project page offers preset chips like "Anti-dandruff", "Moisturising", "Brightening", "SPF protection", "Anti-ageing".

There is no substantiation mechanism. Consider:

- **"Anti-dandruff"** -- In Australia, this is a therapeutic claim regulated by the TGA, not a cosmetic claim. In the EU, Zinc Pyrithione was banned from cosmetics entirely as of 2022. This platform has it in a formulation marked "Approved" for the UK market. The system does not flag this.
- **"SPF protection"** -- SPF claims make a product a therapeutic good in Australia (requires ARTG listing), an OTC drug in the US (FDA monograph), and subject to EC 1223/2009 Annex VI in the EU. This is not just a tag.
- **"Clinically tested"** -- requires actual clinical trial data. Where is the evidence linked?
- **"Reef-safe"** -- this is an unregulated marketing term. The claim is displayed as a chip with no guidance.

Claims need to be mapped to regulatory requirements per market, linked to supporting evidence documents, and validated against the actual formulation composition.

---

## 4. Multi-Market Coverage: Single Market Field, No Cross-Referencing

The `market` field on both `Project` and `Formulation` is a single string. Multi-select markets are stored as a comma-separated string.

There is no cross-market compliance checking. If I mark a product for "EU" and "AU" simultaneously, I need to know:

- EU bans Zinc Pyrithione in cosmetics; AU permits it under AICIS (but the product may be therapeutic under the TGA depending on claims)
- EU requires a Cosmetic Product Safety Report; AU requires assessment against AICIS and potentially TGA scheduling
- US FDA has different concentration limits for OTC active ingredients
- Preservative limits differ between markets

The platform cannot tell me any of this. Multi-market compliance is exponentially complex, and this platform treats it as a tag.

---

## 5. Audit Readiness: Document Storage Without Structure

The Document model is a simple file reference: `name`, `fileName`, `fileUrl`, `fileSize`, `mimeType`, and associations to project/team.

For a GMP audit or TGA inspection, I need:

- **Document categorisation** (SDS, CoA, stability report, challenge test, CPSR, MSDS, specification sheet, batch record). There is no `documentType` or `category` field.
- **Version control** -- documents can be renamed and deleted but there is no versioning. If someone deletes a stability report and uploads a new one, the old one is gone.
- **Retention policies** -- cosmetic product documentation must be retained for 10 years after the last batch in the EU (Article 11 of EC 1223/2009). There is no retention or archival mechanism.
- **Traceability** -- I cannot pull "all safety-related documents for formulation X across all projects that use it." Documents are linked to projects, not formulations.
- **Completeness checking** -- there is no way to define "this formulation requires these document types before it can be marked Approved."

---

## 6. Specific Regulatory Red Flags in Current Data

1. **Methylisothiazolinone at 0.15% in `form_07`** -- EU limit for rinse-off is 0.0015%. This is 100x over the legal limit. No flag raised.

2. **Zinc Pyrithione at 1.0% in `form_07`** -- Banned in EU cosmetics since March 2022. The comment thread mentions "1% is right at the regulatory limit for leave-on" -- but ZPT is banned in the EU entirely for cosmetics, and the formulation is marked "Approved" with market "UK" (which follows EU regulation).

3. **Titanium Dioxide and Zinc Oxide in `form_05`** -- listed as UV filters. In the EU, TiO2 is restricted (Annex VI, Entry 27) and requires [nano] labelling if in nanoform. No nano-form field exists.

4. **Formulation `form_05` marked as "Global" market** -- "Global" is not a regulatory market. It is a commercial aspiration. Every market has different requirements.

5. **"Reef-safe" claim on `proj_03` (SPF50)** -- the term "reef-safe" has no regulatory definition. Displaying it as a validated claim chip is misleading.

---

## 7. What the "Regulatory Summary" Tab Actually Shows

The formulation detail page has a "Regulatory summary" tab. It displays: **"Not yet assessed"** for every formulation. The `FLAG_CONFIG` defines `restricted` and `advisory` categories -- but the component explicitly states:

```
// We don't have flag data in DB, so flags are empty for now
const restricted = 0;
const advisory = 0;
```

The UI shell exists. The data layer does not. This is a placeholder, and I would not want it shown to anyone who might mistake it for an actual regulatory assessment.

---

## Verdict

This platform is a product development and project management tool. It is **not** a compliance tool. In its current state, it does not reduce my bottleneck -- it creates a new risk.

**The danger is that product teams will use the "Approved" status and "Regulatory summary" tab as signals that compliance has been addressed, when the system has zero capability to perform or enforce compliance checking.**

What I would need before I could adopt this platform as part of my workflow:

1. **A real regulatory ingredient database** with per-market concentration limits, restriction status, and annex classifications -- or an integration with one (ECHA, CosIng, AICIS/NICNAS database)
2. **Mandatory compliance review gate** before formulation status can move to "Approved" -- requires a user with a compliance role to sign off
3. **Claims-to-regulation mapping** -- when someone selects "Anti-dandruff" and "AU" market, the system should flag that this is a therapeutic claim under the TGA
4. **Document completeness requirements** -- define mandatory document types per formulation status transition
5. **Cross-market comparison view** -- show me the most restrictive limit for each ingredient across all selected markets
6. **Formulation-level document linkage** -- documents should attach to formulations, not just projects
7. **Audit trail immutability** -- once a document version is uploaded, it cannot be deleted, only superseded

The UI scaffolding is thoughtful. The ingredient table with INCI names, CAS numbers, percentages, and function/role columns shows that someone has considered the regulatory use case. But intentions do not pass an audit. Data and enforcement do.

I would be happy to work with the product team to define the regulatory data model properly. But I would not sign off on this platform for compliance use until those seven items are addressed.

-- David Loh, Compliance & QA

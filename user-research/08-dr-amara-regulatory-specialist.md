# Atelier Platform Review — Dr. Amara Osei, Regulatory Affairs Specialist (Cross-Functional)

**Reviewer:** Dr. Amara Osei, Regulatory Affairs Specialist
**Date:** 17 March 2026
**Verdict:** Not adoptable. "I will continue using my spreadsheets."

---

## 1. Ingredient Data Depth: Insufficient for Regulatory Assessment

The `Ingredient` model has precisely four fields beyond the ID:

- `name` (labelled "INCI name" in a comment, but not enforced)
- `casNumber` (optional)
- `function` (free text, e.g. "Surfactant", "Preservative")
- `description` (free text)

This is a product development inventory, not a regulatory data model. For any meaningful compliance assessment, I would need at minimum:

- **INCI name vs. trade name distinction.** Nothing prevents a formulator from entering "Vitamin C" instead of "Ascorbic Acid," or a supplier trade name like "Tego Betain F50" instead of "Cocamidopropyl Betaine." The seed data itself mixes conventions: "Aqua" is correct INCI, but "EDTA" is an abbreviation; the proper INCI is "Disodium EDTA" or "Tetrasodium EDTA" depending on the salt form, and the regulatory implications differ.

- **EC number.** Required for REACH/CLP compliance in the EU. Absent entirely.

- **EINECS/ELINCS number.** Needed for EU regulatory identification alongside CAS.

- **Molecular weight.** Relevant for penetration assessment and nano-material classification (think Titanium Dioxide -- without particle size data I cannot determine if it triggers the EU nano-cosmetics notification requirement under Article 16 of 1223/2009).

- **Maximum concentration limits per jurisdiction.** This is the critical gap. Salicylic Acid is in the formulation at 0.50%, and the description mentions "restricted in cosmetics" -- but restricted to *what* concentration, in *which* market, for *which* product type?

- **Restriction category per market** (prohibited, restricted with conditions, permitted, notified). Methylisothiazolinone is a perfect example: effectively banned in leave-on cosmetics in the EU since 2016, restricted to 0.0015% in rinse-off, but has different status in the US and Australia.

- **Natural/organic certification status.** No fields for COSMOS, NATRUE, or organic certification status.

## 2. Regulatory Database: Non-Existent

There is no regulatory database in this system. Zero. The word "regulatory" appears in the UI in two places:

1. The "Regulatory market" selector on the new project form -- a flat list of country labels stored as a comma-separated string. Selecting "Australia" does nothing beyond tagging the project.

2. The "Regulatory summary" tab on the formulation detail page -- which displays **"Regulatory assessment has not been performed for this formulation yet."** The restricted and advisory counters are hardcoded to `0`. The flag filter buttons exist in the UI but are cosmetic shells.

There is no `RegulatoryStatus` model, no `IngredientRestriction` model, no `MarketRequirement` model.

## 3. Cross-Market Compliance: Not Possible

There is no mechanism to:

- Compare an ingredient's status across multiple jurisdictions simultaneously
- Flag that Zinc Pyrithione was reclassified as CMR 1B by the EU SCCS in 2020, leading to its ban in EU cosmetics under Regulation 2022/1176, while it remains permitted in Australia (SUSMP Schedule 6, with conditions), the US (OTC monograph for anti-dandruff at up to 2%), and most ASEAN markets
- Identify that a formulation approved for the UK market may need reformulation before entering the EU or AU market

The seed data comment about zinc pyrithione concentration being "right at the regulatory limit for leave-on" is precisely the kind of critical knowledge that lives in people's heads instead of being systematically captured and surfaced.

## 4. AICIS/TGA Specifics: Completely Absent

I searched the entire codebase for references to AICIS, SUSMP, TGA, NICNAS, the Industrial Chemicals Act 2019, or the Therapeutic Goods Act 1989:

- **One** reference to "AICIS" -- a seed data document titled "Regulatory Notes (AICIS)", which is a PDF upload placeholder.
- **Zero** references to SUSMP, TGA, NICNAS, or the Industrial Chemicals Act.

For Australia-specific compliance, the platform would need:

- **AICIS categorisation.** Every chemical introduced into Australia must be categorised (listed, assessed, exempted, or new). No field for AICIS listing status or assessment certificate reference.

- **SUSMP scheduling.** The Standard for the Uniform Scheduling of Medicines and Poisons determines whether a cosmetic ingredient is classified as unscheduled, Schedule 2, Schedule 3, or Schedule 4. No scheduling data exists.

- **TGA vs. cosmetic distinction.** In Australia, an SPF product making "sunscreen" claims is a therapeutic good regulated by the TGA, not a cosmetic. The seed data includes "SPF50 Daily Defense Moisturiser" with market "Global" -- but if this product enters Australia, the entire regulatory pathway changes.

- **Nanomaterial notification.** Titanium Dioxide and Zinc Oxide are both in the seed data as "UV Filter" ingredients. In Australia, nano-forms have been assessed by NICNAS (now AICIS) with specific conditions. The ingredient model has no particle size or nano-status field.

## 5. Dossier Support: None

There is no dossier preparation capability. A regulatory dossier requires:

- Product Information File (PIF) generation
- Safety assessment report template (EU Article 10/Annex I)
- GMP certification references (ISO 22716)
- Stability data linkage
- Challenge test / preservative efficacy data
- Toxicological profiles and exposure calculations

The Document model is a basic file attachment system with no document type classification, no version control, no regulatory submission status tracking.

## 6. Verdict

**This platform does not automate any of my routine regulatory lookups. I still need my spreadsheets.**

The platform does a reasonable job at what it set out to do: tracking formulations, managing sample orders, enabling collaboration. The bones are good -- the ingredient table with INCI names, CAS numbers, percentages, and functional roles is a reasonable starting point.

But from a regulatory affairs perspective, this is a formulation notebook, not a compliance platform. The "Regulatory summary" tab is an empty promise. The flag filters are UI decoration. The market selector captures intent but triggers no intelligence.

**What would make this genuinely useful for regulatory affairs:**

1. An `IngredientRegulatory` junction table linking each ingredient to per-market regulatory status, maximum concentrations (by product category and leave-on/rinse-off distinction), applicable annexes or schedules, and effective dates
2. AICIS listing status and SUSMP schedule classification for every ingredient
3. Automatic flagging when a formulation ingredient exceeds concentration limits for the assigned market(s)
4. Product-category-to-regulatory-pathway mapping (cosmetic vs. therapeutic good vs. OTC drug, varying by market)
5. A proper regulatory database seed -- even a curated list of the 200 most common cosmetic ingredients with their EU Annex status, SUSMP scheduling, and FDA monograph status would transform this from a blank slate to a starting point

The seed data is well chosen -- it includes genuinely interesting regulatory edge cases (Zinc Pyrithione, Methylisothiazolinone, Salicylic Acid, Titanium Dioxide). The team clearly understands the regulatory landscape exists. The gap is that none of this knowledge has been encoded into the data model or application logic. It remains in the descriptions and comments, which is precisely where it was before the platform existed.

I will continue using my spreadsheets.

---

*Dr. Amara Osei, Regulatory Affairs Specialist*

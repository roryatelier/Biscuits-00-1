# Supplier Database — Schema Alignment Backlog

_Consolidated from CTO, Head of Product, and Head of Design reviews — 24 March 2026_
_Source: Production CSV export (570 suppliers, 67 columns) vs. Platform01 Prisma schema_

---

## Context

Platform01's Supplier capability must faithfully represent the production supplier database before it can replace it. This backlog identifies every gap between the production CSV export (`Supplier DB export 20260323.csv`) and the current Prisma schema, prioritised by import-blocking severity, user workflow impact, and design complexity.

**Source file:** `/Users/rorygass/Downloads/Supplier DB export 20260323.csv`

---

## P0 — Must Ship Before Production Import

These items block a faithful import of the 570-supplier production database. Without them, data is silently dropped or misclassified.

| # | Item | Complexity | Design Gate? | Owner Notes |
|---|------|-----------|-------------|-------------|
| S-01 | **CSV column mapping for production headers** | L | No | **Do first.** Current `COLUMN_MAP` in `lib/csv-parser.ts` doesn't recognise any of the 67 production column names. Map all headers: `Trade Name` → `companyName`, `Legal Name` → `companyLegalName`, `Factory Locations` → `factoryCountry`, etc. Update `parseRow` to consume new fields. This is the test harness for everything else. |
| S-02 | **Historical status mapping** | S | **Yes** — archive view vs Kanban column | CSV has `Historical` status with no platform equivalent. Add to qualification stage constants. **UX decision required:** Historical suppliers must NOT appear as a Kanban column (8 columns overflow on 1366px laptops). Use a separate archive toggle or filter. Update `STAGE_SORT_ORDER`, `STAGE_COLORS` in `lib/constants/suppliers.ts`. |
| S-03 | **Supplier type/subtype fields** | M | **Yes** — badge pattern, filter redesign, taxonomy | CSV tracks `Turnkey`, `PrimaryPackaging`, `Formulations` (multi-value) + subtypes `Blend&Fill`, `R&D`. Platform only has `capabilityType` (turnkey/blend_fill/both/unknown). Add `supplierTypes Json @default("[]")` and `supplierSubtypes Json @default("[]")` to `AosSupplier`. **Also update match scoring** — brief matching must account for type alignment. Touches 5+ components: table badges, filter bar, pipeline cards, profile overview, side panel. |
| S-04 | **Lead time as min/max range + notes** | S | **Yes** — range display component | CSV has `Production leadtime day min`, `max`, and `info`. Platform stores single `productionLeadTimeDays Int?`. Replace with `productionLeadTimeDayMin Int?`, `productionLeadTimeDayMax Int?`, `productionLeadTimeInfo String?`. Table column needs a range display pattern (e.g., "14–21 days"). |
| S-05 | **NDA rich data on Agreement model** | M | **Yes** — document link pattern | CSV has NDA expiry, start date, non-circumvent period (months), document links, status (`Signed`/`Progressing`/`Issues`). Add to `Agreement` model: `documentLink String?`, `startDate DateTime?`, `expiryDate DateTime?`, `nonCircumventMonths Int?`, `notes String?`. Decide: document links as URL strings or file uploads? NDA expiry is compliance-critical. |
| S-06 | **Active SKUs** | S | No | CSV has `SKUs Active` (comma-separated codes like `REVLO-116-P08`). Add `activeSkus Json @default("[]")` to `AosSupplier`. Simple JSON array — not a join table until product catalogue exists. |
| S-07 | **Factory audit data** | M | **Yes** — new profile section | CSV has `factory_audit_data` JSON: `{score, visit, action, auditor, location, follow_up, audited_on}`. Audit status is a qualification gate — the ops team uses this to validate "Fully Qualified" status. Create `FactoryAudit` model with `score Float?`, `auditedOn DateTime?`, `auditor String?`, `location String?`, `actionItems String?`, `followUp String?`. Needs its own profile section (proposed: within Compliance tab). |
| S-08 | **Date outreached / date qualified** | S | No | CSV has explicit timestamps. Platform relies on scanning Activity logs. Add `dateOutreached DateTime?` and `dateQualified DateTime?` to `AosSupplier`. Foundational for pipeline reporting ("who did we outreach in the last 30 days with no response?"). |
| S-09 | **Caution flag mapping in CSV import** | S | No | `cautionFlag` and `cautionNote` exist on `AosSupplier` but are not mapped in `COLUMN_MAP`. Production flags will be silently dropped on import. Map the CSV `Flags` column to populate caution state. |
| S-10 | **Profile tab restructure** | M | **Yes** — design before fields land | Current 5-tab profile (Overview, Certifications, Agreements, Briefs, Activity) cannot absorb 25+ new fields without becoming unusable. Restructure into 6 tabs: **Overview** (identity, type, region, acquisition), **Capabilities** (categories, fill, SKUs, MOQ, lead time), **Compliance** (certs, audits, CoC, NDA data), **Commercial** (agreements, brands, payment terms), **Briefs**, **Activity**. Ship before P1 fields land. |
| S-11 | **Filter bar UX upgrade** | M | **Yes** — collapsible panel design | Current filter bar has 4 selects + search. Supplier type filter (S-03) brings it to 5+. At 6+ filters the bar needs to become a collapsible panel or filter tray. Design and ship alongside S-03. |

---

## P1 — High Value, Next Sprint

These complete the supplier record and improve daily ops/procurement workflows.

| # | Item | Complexity | Design Gate? | Owner Notes |
|---|------|-----------|-------------|-------------|
| S-12 | **Supplier short code + legacy ID** | S | No | CSV has `Code` (e.g., "AMKFO") and numeric `ID`. Add `supplierCode String? @unique` and `legacyId Int?` to `AosSupplier`. Quick win — one text row on profile. |
| S-13 | **Fill capabilities** | S | **Yes** — taxonomy confirmation | CSV has `Fill Capabilities` (PlasticTube, Bottle, Jar, Sachets, Stick, AluminiumTube, Powders). Distinct from product categories. Add `fillCapabilities Json @default("[]")` and `fillPackagingNotes String?` to `AosSupplier`. Confirm taxonomy is fixed enum vs. open-ended before building. Add to filter bar. |
| S-14 | **Code of Conduct tracking** | S | No | CSV has `Coc acknowledged` (boolean), `Coc link`, `Coc date accepted`. Option A: Add `cocAcknowledged Boolean @default(false)`, `cocLink String?`, `cocDateAccepted DateTime?` to `AosSupplier`. Option B: Model as `Agreement` with type `CoC`. Recommend Option B for consistency. |
| S-15 | **Region + market experience** | S | **Yes** — region (single) vs market (multi) | CSV has `Region` ("North Asia", "Greater China", "Oceania", "North America", "Other") and `Market experience` ("USA, Australia, France"). Add `region String?` and `marketExperience Json @default("[]")` to `AosSupplier`. Add region to filter bar. |
| S-16 | **Structured addresses** | M | **Yes** — collapsed address component | CSV has `business_address` and `delivery_address` as full JSON (street, city, state, country, postalCode + delivery contact fields). Create `SupplierAddress` model with `addressType` ("business"/"delivery"). Never render as 12 key-value rows — use a formatted address block component. |
| S-17 | **Acquisition source** | S | No | CSV has `Acquisition Source` (Google, Alibaba, NetworkReferral). Add `acquisitionSource String?` to `AosSupplier`. Quick win. |
| S-18 | **Currency preference** | S | No | CSV has `Currency` (USD, AUD). Add `currency String? @default("USD")` to `AosSupplier`. Quick win. |
| S-19 | **MOQ notes** | S | No | CSV has `Moq info` alongside numeric `Moq`. Add `moqInfo String?` to `AosSupplier`. Quick win — textarea adjacent to MOQ field. |
| S-20 | **Atelier brands vs. key brands** | S | **Yes** — semantic clarification | CSV distinguishes `Brands Worked` (external) from `Atelier Brands` (internal). Currently conflated in `keyBrands`. Add `atelierBrands Json @default("[]")`. Clarify distinction with ops team before implementation. |
| S-21 | **Cert category (quality vs regulatory)** | S | No | CSV separates `Certs & Audits` from `Regulatory Compliance` (TGA, FDA). Add `certCategory String?` ("quality"/"regulatory"/"sustainability"/"ethics") to `Certification` model. Cheap now, painful migration later. |
| S-22 | **Supplier website / LinkedIn URL** | S | No | Not in CSV but raised by Product. First thing ops looks up when evaluating a new supplier. Add `websiteUrl String?` to `AosSupplier`. |
| S-23 | **Last contacted date** | S | No | Distinct from date outreached. Add `lastContactedAt DateTime?` to `AosSupplier` or derive from Activity log. Enables "who needs a follow-up" triage. |

---

## P2 — Nice to Have

| # | Item | Complexity | Notes |
|---|------|-----------|-------|
| S-24 | **Cert link + IP ownership** | S | Add `ipOwnership String?` to `AosSupplier`. Map `Certification link` to `Certification.documentRef` on import. |
| S-25 | **Flags as derived computation** | S | Do not store manual booleans. Build `computeSupplierFlags(supplier)` utility deriving from cert/NDA expiry dates (requires S-05 first). |
| S-26 | **Agreement notes** | S | Add `notes String?` to `Agreement` model. Quick win. |
| S-27 | **Xero ID** | S | Add `xeroId String? @unique` to `AosSupplier`. **Risk:** no sync plan = stale data. Only build if Xero integration is planned. |

---

## Cut

| Item | Reason |
|------|--------|
| Bank/payment data | Xero owns financial data. Security implications (field-level encryption needed). Only store `paymentTerms String?` if needed. |
| Sample dev fee notes | No commercial terms workflow exists in the platform. |
| SKU join table | No product catalogue schema yet. `activeSkus Json` (S-06) is sufficient. |

---

## Sprint Plan

### Sprint 1 — Make the import work
**Goal:** Upload the production CSV and import 570 suppliers without silent data loss.

| Item | Complexity |
|------|-----------|
| S-01 — CSV column mapping | L |
| S-02 — Historical status | S |
| S-04 — Lead time min/max | S |
| S-06 — Active SKUs | S |
| S-08 — Date outreached/qualified | S |
| S-09 — Caution flag mapping | S |

**Design input needed:** S-02 (Historical as archive toggle, not Kanban column).

### Sprint 2 — Design sprint + core qualification data
**Goal:** Supplier profile is restructured. Core qualification and compliance fields land.

| Item | Complexity |
|------|-----------|
| S-10 — Profile tab restructure | M |
| S-11 — Filter bar upgrade | M |
| S-03 — Supplier types/subtypes | M |
| S-05 — NDA rich data | M |
| S-07 — Factory audit data | M |

**Design input needed:** S-10, S-11, S-03, S-05, S-07. Run a 2-week design sprint before engineering starts.

### Sprint 3 — Enrichment
**Goal:** Complete supplier record parity with production database.

| Item | Complexity |
|------|-----------|
| S-12 — Short code + legacy ID | S |
| S-13 — Fill capabilities | S |
| S-14 — Code of Conduct | S |
| S-15 — Region + market experience | S |
| S-17 — Acquisition source | S |
| S-18 — Currency | S |
| S-19 — MOQ notes | S |
| S-21 — Cert category | S |

### Sprint 4 — Structured models + edge cases
**Goal:** Address types and remaining P1 items.

| Item | Complexity |
|------|-----------|
| S-16 — Structured addresses | M |
| S-20 — Atelier brands vs key brands | S |
| S-22 — Website URL | S |
| S-23 — Last contacted date | S |

---

## Key Files

| File | What changes |
|------|-------------|
| `prisma/schema.prisma` | All schema additions (new fields, new models) |
| `lib/csv-parser.ts` | `COLUMN_MAP` and `parseRow` — production header mapping |
| `lib/actions/csv-import.ts` | `commitCsvImport` — write all new fields |
| `lib/constants/suppliers.ts` | Stage constants, colours, labels |
| `lib/supplier-constants.ts` | `QUALIFICATION_STAGES`, `TRANSITION_MAP` |
| `lib/match-scoring.ts` | Update for supplier type alignment |
| `types/supplier-database.ts` | TypeScript interfaces |
| `app/suppliers/[id]/SupplierProfileClient.tsx` | Profile tab restructure |
| `app/suppliers/database/DatabaseFilters.tsx` | Filter bar upgrade |
| `app/suppliers/database/SupplierTable.tsx` | New columns, badge patterns |
| `app/suppliers/pipeline/PipelineClient.tsx` | Historical stage handling |

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| **Data quality on import** — inconsistent values, mixed encodings, multiline fields in CSV | Run production CSV through parser before Sprint 1 ships. Target <5% rejection rate. |
| **Historical + pipeline overflow** — 8 Kanban columns on 1366px laptops | Historical is NOT a Kanban column. Archive toggle/filter only. |
| **Supplier type + match scoring divergence** — types land without matching logic update | S-03 must include match scoring update. Do not split. |
| **Profile information overload** — 25+ fields dumped into existing 5-tab layout | S-10 (tab restructure) ships before Sprint 3 fields land. |
| **Sprint 2 overload** — five M-complexity items | Design sprint runs 2 weeks ahead of engineering. Scope to 3 items if velocity is uncertain. |
| **Cert dot-matrix in table** — 14+ cert types rendered as dots becomes unreadable | Consider count badge + tooltip if cert types grow beyond current set. |

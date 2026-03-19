# Atelier Platform Review — Ava Chen, Director of Portfolio Strategy (Large Enterprise)

**Reviewer:** Ava Chen, Director of Portfolio Strategy
**Date:** 17 March 2026

---

## Strategic Utility: Is there anything here for someone at my level?

Bluntly -- no. This is a product development operations tool. It tracks the *mechanics* of getting a product from brief to sample: link a formulation, order a sample, review the sample's texture and scent. That is the work of formulators, product developers, and project managers. There is nothing on this platform that speaks to *why* we should build a product, *where* to play in the market, or *how to win* against competitors.

The dashboard gives me four stat cards: total projects, total formulations, total sample orders, and pending samples. These are operational throughput metrics. They tell me the team is busy. They do not tell me whether the team is busy on the *right things*. There is no revenue projection, no category mix view, no pipeline-by-stage value, no time-in-stage analysis. The "recent activity" feed is a chronological list of who created what and who commented where -- it is a collaboration log, not a strategic signal.

The sidebar navigation confirms this altitude: Dashboard, Projects, Catalogs (Formulations, Packaging), Sample Tracking, Documents, Team, Settings. There is no "Portfolio" view. No "Pipeline." No "Analytics." No "Market." The vocabulary is entirely operational.

## Portfolio Visibility: Can I see the innovation pipeline at a portfolio level?

No. The `/projects` page is a flat list of project cards. Each card shows: status badge (Brief / In Development / Sampling / Launched), category tag, formula count, sample count, and team avatars. That is it.

There is no way to:
- **View the pipeline as a funnel** -- how many projects at each stage, what is the conversion rate from Brief to Launch?
- **Filter or segment by category** -- I cannot pull up "show me all Skincare projects" without scanning every card manually.
- **See time-in-stage** -- a project sitting at "Brief" for 90 days should be a red flag, but there is no duration indicator.
- **Assess portfolio balance** -- am I over-indexed on Haircare and under-invested in Suncare? The data exists (category and market fields on every project), but no view aggregates it.
- **Identify pipeline gaps** -- where are the white spaces in my portfolio by category, claim territory, or market?

The `/in-development` page is literally a redirect to `/projects?status=In+Development`. The `/innovation` page redirects to `/projects`. These are not views -- they are URL aliases.

## Data for Decisions: What is captured that could inform strategy? What is missing?

The data model is richer than the UI lets on. Underneath the surface, the Prisma schema captures:

**Useful strategic signals (captured but invisible):**
- **Project.category** (Haircare, Skincare, Suncare) -- portfolio category mix
- **Project.market** (UK, EU, US, Global) -- geographic diversification
- **Project.claims** (JSON array: "Anti-dandruff", "Brightening", "SPF50") -- claim territory mapping
- **Project.status** with timestamps -- could derive velocity and time-in-stage
- **Activity log** with type-tagged events and timestamps -- could power a development velocity dashboard
- **PackagingOption.unitCost and PackagingOption.moq** -- packaging economics exist but are not tied to projects
- **FormulationIngredient.percentage** -- ingredient cost modelling is theoretically possible
- **SampleReview scores** (texture, scent, colour, overall on 1-5 scale) -- product quality signal

**Critical strategic data that is completely missing:**
- **No financial data anywhere** -- no COGS estimate, no target retail price, no projected revenue, no margin. The backlog even lists "Pipeline value on backlog" and "Formulation cost estimates" as P5 future opportunities. Without economics, this is a project tracker, not a portfolio tool.
- **No launch dates or target timelines** -- projects have statuses but no target dates, no launch windows, no seasonal anchoring. I cannot answer "what ships for Holiday 2026?"
- **No competitive data** -- there is a seeded document called "Competitor Analysis Q1 2026" (a PDF upload), but the platform has zero structured competitive intelligence. No competitor tracking, no market positioning data, no share-of-shelf.
- **No trend or consumer data** -- no connection to external data sources (Nielsen, social listening, trend platforms). Every decision I make starts with "what does the consumer want?" -- this platform starts with "what formulation can we make?"
- **No brand or sub-brand architecture** -- the Team model is flat. There is no concept of brand, product line, or SKU hierarchy. In a company with 50+ SKUs across 4 brands, this is a non-starter.
- **No capacity or resource data** -- project assignments exist (lead and member roles), but there is no resource loading, no capacity planning, no "how many projects can this team actually run simultaneously?"

## Speed-to-Market Signal: Does this help me understand development velocity?

Partially, but you would have to work for it. The Activity model timestamps every status change, so in *theory* you could calculate: "Anti-Dandruff Shampoo went from Brief to In Development in 6 days." But that analysis is not surfaced anywhere. There is no velocity metric, no cycle time chart, no bottleneck identification.

The sample tracking flow (Pending -> In Production -> Shipped -> Delivered) has timestamps that could tell me sampling cycle times. But again, this data sits raw in the database.

The project progress bar is particularly misleading from a strategy perspective. It derives "progress" by counting how many of the four milestones are completed. A project in "Sampling" shows 50% progress. But progress through stages is not linear -- a project can sit in Sampling for months. The progress bar conflates stage completion with actual velocity, which is exactly the kind of false signal that leads to bad portfolio decisions.

## Competitive Intelligence: Any capability to track market positioning?

None. Zero. The Documents section allows uploading PDFs (and the seed data includes a "Competitor Analysis Q1 2026" file), but this is a file storage feature, not a competitive intelligence capability. There is no structured competitor data, no market mapping, no claim-space analysis, no pricing benchmarks.

The "claims" field on projects is the closest thing to a strategic positioning tool -- you can tag a project with claims like "Anti-dandruff" and "Clinically tested." But there is no view that maps the competitive landscape: "We have 2 projects claiming 'Brightening' -- our competitors have 7 products in this space." That kind of insight is what I need. This is not that.

## Verdict: Would I ever log into this?

No. And I want to be constructive about why, because the *data model* actually has more strategic potential than the team seems to realise.

This is a well-built operational tool for a 2-5 person product development team. The CRUD is solid. The activity feed and collaboration features (comments, notifications, assignments) are thoughtful. The formulation-to-project-to-sample workflow makes sense. For a product developer or R&D project manager, this could be genuinely useful.

But it operates entirely "below my altitude." When I open my laptop in the morning, I need to answer: *Where should we invest our next development dollar? What categories are growing? Are we going to miss the trend window on clean SPF? How loaded is the development team -- can they take on another project or are we already over-committed?*

This platform answers a different question: *What is the status of the anti-dandruff shampoo project?*

**What would make me log in:**

1. **A portfolio dashboard** -- projects aggregated by category, market, and stage. Funnel visualisation. Pipeline value (once financial data exists). Portfolio balance heat map.
2. **Time-based analytics** -- average time-in-stage, development velocity trends, predicted launch dates based on historical cycle times. Show me where projects are stalling.
3. **Financial layer** -- even rough COGS estimates, target pricing, and projected revenue at the project level would transform this from a tracker into a planning tool. The packaging cost data already exists -- extend it.
4. **Capacity view** -- how many projects per team member, who is overloaded, what is our theoretical throughput based on current resourcing.
5. **Strategic metadata on projects** -- target launch window, priority tier, strategic rationale, expected incremental revenue. The brief should capture *why this product exists in the portfolio*, not just *what claims it makes*.

The backlog file lists "Pipeline value on backlog" as a P5 item -- which is exactly the kind of prioritisation disconnect I am describing. Pipeline visibility is not a "future opportunity." For anyone making resource allocation decisions, it is the *entire point*.

**Bottom line:** This is a good v1 for the people who *do the work*. It is not yet a tool for the people who *decide what work to do*. The data scaffolding is promising -- category, market, claims, timestamps, packaging economics -- but none of it rolls up to the portfolio level. Until it does, this stays on my team's screens, not mine.

# Atelier Platform Review — Natasha Reeves, Brand Manager (Cross-Functional)

**Reviewer:** Natasha Reeves, Brand Manager
**Date:** 17 March 2026
**Score:** 6/10 today. 9/10 potential.

---

## Brief-to-Product Gap

This is the part of my life that costs us the most time -- and Atelier has clearly been designed by someone who understands the pain. The project creation flow (`/projects/new`) is structured like a proper product brief: project name, category, regulatory markets (nine options from UK to Korea to Global), and a selectable list of 15 key claims (Anti-dandruff, Moisturising, Brightening, SPF protection, etc.). That is a good start. The claims are stored as a JSON array on the Project model and displayed as chips on the project detail page. I can tag a project as "Skincare" for "EU" market with "Brightening" and "Anti-oxidant" claims, and that brief lives in the system as a first-class object, not buried in a PDF attachment on someone's email.

What excites me: the platform links formulations directly to projects via the `ProjectFormulation` join table. So when I write a brief for a Vitamin C Brightening Serum, R&D can link candidate formulations. I can see exactly which formulas are being considered against my brief without having to ask.

**What is missing and would change the game**: There is no feasibility feedback mechanism. I write the brief, I select my claims, I pick my markets -- and then what? The brief just sits there as a record. There is no way for R&D to respond to the brief with a feasibility assessment, flag conflicts (e.g., "you want SPF50 + Lightweight but the UV filters needed make this feel heavy"), or estimate timelines. I need a structured response to my brief -- something like a "Feasibility Assessment" section where R&D can mark each claim as Achievable / Challenging / Not Feasible, with notes. Right now the Discussion section (threaded comments) is the only feedback channel, which is fine for ad-hoc conversation but terrible for structured decision-making.

Also notably absent: the brief has no fields for **target consumer**, **price point**, **target launch date**, **channel strategy**, or **competitive reference**. These are the things I put in every brief.

**Verdict on Brief-to-Product Gap**: 6/10. The structure is there, the concept is right, but the brief needs more fields and the feasibility handoff does not exist yet.

---

## Visibility

This is where Atelier starts to genuinely reduce my blood pressure.

**Project statuses** are clean: Brief, In Development, Sampling, Launched. The project detail page derives milestones from status -- a progress bar shows "1 of 4 milestones completed" with visual checkmarks. The dashboard gives me stat cards: Active projects, Formulations, Sample orders, Pending samples.

**Sample tracking** is the standout. The Samples page has filter tabs (All, In Progress, Shipped, Delivered) with counts, and each sample order card shows a stage progress bar: Pending -> In Production -> Shipped -> Delivered. I can expand any order to see the full timeline, the linked formula, quantity, format, shipping address, and notes. When a sample hits "Delivered," I get a prompt to "Log your review" -- which takes me to a proper sensory evaluation form (texture, scent, colour, overall on a 1-5 scale with photo uploads).

**Activity feed** on each project tracks everything: project creation, status changes, formulation links/unlinks, sample orders, sample status changes, review submissions, comments, and share events. It is filterable and paginated.

**Notifications** via the bell icon in the sidebar tells me when someone comments on my project, replies to my comment, advances a sample, submits a review, or changes project status.

**What is missing**: No cross-project dashboard view. No Gantt-style or kanban-style view. No **target dates** anywhere in the schema. Without dates, "visibility" is just "what stage is it at" not "is it on track."

**Verdict on Visibility**: 7.5/10. Dramatically better than emailing five people. Sample tracking is excellent. But no timeline/date fields means I still cannot answer "will this launch on time?"

---

## Claims & Positioning

**What exists**: Claims are stored as a JSON string array on the Project model. I select from 15 predefined claims during project creation. They display as chips on the project detail page and on the shared project view.

**But here is the problem**: The regulatory flags are not implemented. The formulation detail page explicitly says `// We don't have flag data in DB, so flags are empty for now` -- the restricted and advisory counts are hardcoded to zero. The "Regulatory summary" tab shows "Not yet assessed" for every formulation. There is no connection between the claims I select on a project and the ingredients in the linked formulations. If I claim "Anti-dandruff," does the formulation actually contain an anti-dandruff active at the right concentration? The system does not tell me.

**What I need**: When I say "Anti-ageing" for the "EU" market, the system should tell me which actives in my formulation support that claim, flag any ingredients that are restricted in the EU, and warn me if the claim cannot be substantiated by the formula. Today, the claims are just labels -- decorative, not functional.

**Verdict on Claims & Positioning**: 4/10. The claims selection UI is polished, but without claim substantiation or regulatory intelligence, it is just a tagging system.

---

## Launch Readiness

There is nothing in this platform that helps me sync go-to-market with development timelines.

The Project model has no `targetLaunchDate`. There are no milestone due dates. There is no way to set a launch window and work backwards. The `PackagingOption` model has `leadTime`, `moq`, and `unitCost` -- useful catalog data -- but there is no way to link a packaging option to a project and calculate a timeline.

**The share links feature** is actually a bright spot. I can generate a token-based external link to share a project's status, formulations, and optionally ingredients and review scores with external stakeholders. The link has expiry, revocation, and granular controls. That is useful for buyer presentations and retail range reviews.

**Verdict on Launch Readiness**: 3/10. No dates, no timelines, no countdown-to-launch. Share links are a nice GTM collaboration feature but do not solve the planning gap.

---

## Competitive Advantage

**The speed argument**: The platform collapses the brief-to-formulation link. Instead of emailing a PDF brief and waiting for R&D to dig through a formulation library, the brand team and the development team are working in the same system. Sample orders are tracked from request to delivery to review. When someone reviews a sample with structured scores and notes, that feedback is visible to everyone, not buried in a WhatsApp message.

**The documents feature** means brand guidelines, competitor analysis, product briefs, regulatory notes, stability test protocols, and ingredient cost sheets all live alongside the project.

**The collaboration angle**: Project assignments, threaded discussions, activity feeds with notification fan-out -- this is a real multi-function collaboration tool, not just a database.

**But the AI is not there yet**. The PLAN.md explicitly says "AI chat (Cobalt) -- Skip for now." The AI-powered feasibility, ingredient suggestion, regulatory checking, and claim substantiation features that would truly differentiate this platform are not built. Without AI, this is a well-structured project management tool for beauty product development. With AI, it could be the reason I launch 6 weeks faster than my competitor.

**Verdict on Competitive Advantage**: 6/10. The structured collaboration is genuinely better than the status quo. But the real competitive moat -- AI-powered feasibility, regulatory intelligence, claim substantiation -- is explicitly deferred.

---

## Would I Champion This With My GM?

**Yes, conditionally.**

**What I would say to my GM**: "This platform solves the visibility problem. I can see every project, every formulation linked to it, every sample order status, and every piece of feedback -- in one place. That alone saves me 3-4 hours a week of status chasing. The sample tracking and review system is genuinely excellent. The share links for retail presentations are a nice touch."

**What I would flag as blockers before I commit my team's time**:

1. **Add target launch dates and milestone deadlines to the Project model.** Without dates, this is a tracker, not a planning tool.
2. **Build the feasibility response mechanism into the brief.** R&D needs a structured way to respond to my claims and market selections.
3. **Connect claims to formulation ingredients.** The data model already has everything needed -- someone just needs to wire the validation logic.
4. **Activate the regulatory flags.** The formulation detail page has the UI for Restricted/Advisory flags -- but it is all hardcoded to zero. Connect them.
5. **Ship the AI features.** The feasibility checking, claim substantiation, and regulatory intelligence powered by AI -- that is what turns this from "nice internal tool" into "competitive weapon."

**The platform's architecture is sound.** The data model can support everything I have asked for above -- it just needs the product layer to be built on top.

If I am being honest, the fact that someone has built this with my workflow in mind -- brief, formulation, sample, review, launch -- rather than trying to shoehorn beauty product development into a generic project management tool, that is the reason I would fight for it. The bones are right. Now finish the house.

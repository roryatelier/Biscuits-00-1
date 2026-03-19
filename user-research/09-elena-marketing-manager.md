# Atelier Platform Review — Elena Vasquez, Marketing Manager (Cross-Functional)

**Reviewer:** Elena Vasquez, Marketing Manager
**Date:** 17 March 2026
**Score:** 7/10 today. 9/10 with targeted additions.

---

## Product Storytelling: Can I find the hero ingredients, sensory attributes, and brand story here?

Partially -- and I want to be excited about this, but it's not quite there yet.

The **Formulations detail page** gives me an ingredients table with INCI names, percentages, functions, and roles. So if I click into the "Hydra-Plump Moisture Serum," I can see that Hyaluronic Acid is at 2%, Niacinamide at 3%, Tocopherol (Vitamin E) at 1%. That is genuinely useful -- I can start building my ingredient story from there. I can see which ingredients are tagged as "Active" vs "Base" vs "Fragrance," which helps me figure out the hero ingredients.

But here's my problem: **I have to reverse-translate everything.** The system speaks in INCI names -- "Ascorbic Acid" instead of "Vitamin C," "Panthenol" instead of "Pro-Vitamin B5." There's a `description` field on ingredients in the database (e.g., "Vitamin B3, improves barrier function and reduces inflammation" for Niacinamide), but **that description is not displayed anywhere in the UI.** It's only in the seed data. That description field is exactly what I need for storytelling -- and it's sitting there unused.

There are no sensory attribute fields on formulations. No texture description, no scent profile, no colour description. The **sample review system** captures texture, scent, and colour as 1-5 numeric scores -- great for benchmarking, but useless for writing copy. A score of "4" for texture tells me nothing about whether I should describe this product as "silky" or "whipped" or "bouncy." The review notes field is where the gold is -- but that's buried inside individual sample reviews, not surfaced as product-level sensory attributes.

**No brand story fields anywhere.** No positioning statement, no target consumer description, no "reason to believe."

---

## Claims Access: Can I pull approved marketing claims without going through 3 people?

This is actually one of the better parts. On the **New Project page**, there's a pre-built list of 15 key claims I can select. They're displayed as selectable chips. Clean, visual, fast.

On the **project detail page**, claims show up as styled chips. When I generate a **share link**, claims are prominently displayed on the shared view, which means I can send a link to a copywriter or agency partner and they'll see the approved claims right there.

**BUT** -- there's no concept of **claim approval status**. Every claim on a project is just... there. No "pending regulatory review," no "approved for AU market," no "cannot use in EU." The pre-built list helps standardise, but the system also accepts whatever you type into the seed data.

For me, the dream would be claims with approval status per market. Right now, it's a step up from Slack threads, but it's not a regulatory-grade claims management system.

---

## Launch Coordination: Does this help me sync campaigns with actual development timelines?

The **project milestone system** gives me a four-stage pipeline: Brief -> In Development -> Sampling -> Launched. Each project shows a progress bar.

The **Activity Feed** on each project detail page is genuinely valuable. I can see the actual history: when formulations were linked, when status changed, when samples were ordered, when reviews were submitted. If I'd had this for the last launch, I would have known that the formula was still being changed two weeks before our photoshoot.

The **sample order tracking** (Pending -> In Production -> Shipped -> Delivered) tells me where physical samples are. For a photoshoot or influencer seeding, knowing that a sample is "In Production" vs "Shipped" is critical.

**What's missing:** No launch dates. No target dates of any kind. I can see that a project has been "In Development" for 8 days, but I have no idea when it's expected to move to "Sampling." Without dates, I can't plan backwards from a launch to schedule media buys, influencer sends, or content creation windows.

**Notifications** mean I'd get pinged when status changes happen. That is a meaningful improvement over finding out three days later in a standup.

---

## Content Creation Support: Does it give me what I need for photography, copy, and social content?

Let's walk through what I'd need for a typical product shoot:

- **Product name and description** -- yes, available on the formulation detail page. Usable but thin.
- **Ingredients for "hero ingredient" shots** -- partially. I can see the ingredient list, percentages, and functional roles. But no consumer-friendly names are surfaced in the UI.
- **Packaging details** -- The packaging catalog is beautiful. Cards with format, material, MOQ, unit cost, lead time, and availability status. But **packaging is not linked to projects or formulations.** I can't go to a project and see "this product will be in the Frosted Glass Jar 50ml."
- **Product photography** -- The sample review system supports photo uploads (up to 5 per review). But there's no dedicated "product imagery" section, no hero shot gallery.
- **Approved claims for copy** -- yes, on the project detail page.
- **Documents** -- brand guidelines, competitor analysis, briefs all live alongside the project. Helpful for agencies.
- **Share links for external partners** -- genuinely smart. Clean page, no login required, toggle controls.

**What I wish it had:** A way to upload mood boards and product renders. A "Content Brief" template that pulls claims + hero ingredients + packaging + description into one exportable document.

---

## Early Involvement: Does this let me shape the product story during development, not after?

The **Discussion/Comments system** on each project is the most marketing-relevant collaboration feature. I can see conversations about scent profiles and ingredient choices. That's exactly the kind of conversation I should be part of but usually am not.

**Project Assignments** let me get assigned to projects as a member. If assigned, notifications alert me to status changes, comments, and sample reviews.

The **Activity Feed** is my catch-up mechanism.

**What's missing:**

1. **No brief template that includes marketing fields.** No target consumer, no price positioning, no competitive set, no visual direction.
2. **No marketing-specific milestones.** Where's "Creative Brief Approved"? Where's "Photography Complete"? Where's "Content Ready for Launch"?
3. **No way to tag items for marketing attention.** I can't mark a formulation as "needs marketing review."

---

## Verdict: Does this make my launches better, or is it another product database I'll never check?

Honestly? **I'd use this.** And I don't say that about many internal tools.

The core problem of my life -- finding out about product changes after I've already briefed the photographer, written the copy, and booked the influencers -- is addressable with what's here. The Activity Feed and Notification system mean I'd know when formulations change, when samples are ordered, when reviews come in. The Discussion system means I can weigh in on scent profiles and positioning early. The Share Links mean I can get a clean summary to agency partners without playing telephone through three Slack channels.

**What would make me a daily user vs. an occasional checker:**

1. **Target launch dates on projects** -- without dates, I can't plan campaigns
2. **Link packaging to projects** -- I need to know what the product will look like for content creation
3. **Surface ingredient descriptions in the formulation detail UI** -- the data exists, just show it
4. **A "Content Brief" export** that compiles claims + hero ingredients + packaging + description into one shareable document
5. **Marketing-specific milestone tracking** running parallel to the R&D stages
6. **Claim approval status** (Draft / Under Review / Approved per market)

The project detail page is legitimately the single-source-of-truth page I've been asking for -- description, claims, status, formulations with version info, sample orders with review scores, documents, discussion, and activity feed all in one place. That's powerful.

Right now, it's built for product development and formulation science. With a few targeted additions -- dates, packaging links, consumer-friendly ingredient descriptions, and a content brief export -- it becomes a tool that marketing would actually live in. I'm cautiously excited. Don't let me down on the dates.

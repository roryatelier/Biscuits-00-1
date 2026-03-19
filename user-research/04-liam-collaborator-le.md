# Atelier Platform Review — Liam Ortega, Sr. Project Manager (Large Enterprise)

**Reviewer:** Liam Ortega, PMP | Sr. Project Manager, Product Development
**Date:** 17 March 2026

---

## Project Management Depth: Is this real project management or just a task list?

Honestly? It is neither. It is a product development tracker -- and there is an important difference.

What Atelier gives me is a **project-as-container model**: a Project has a status (Brief, In Development, Sampling, Launched), linked Formulations, Sample Orders, Documents, Comments, and an Activity Feed. The "milestones" on the project detail page (the `deriveMilestones` function) are actually just the four project statuses rendered as a stepper. They are not real milestones with dates, owners, or deliverables. They are phase gates derived from the project status string. I cannot create my own milestones like "Regulatory sign-off by April 15" or "Artwork final by Week 22."

There are no tasks. No subtasks. No due dates anywhere in the schema -- not on Project, not on SampleOrder, not on any model. The `ProjectAssignment` model gives me "lead" and "member" but no concept of functional role (R&D, regulatory, packaging, marketing). The `Project` schema has `status`, `category`, `market`, and `claims` but no `targetLaunchDate`, no `priority`, no `phase owner`.

The progress bar on the project detail page calculates completion as `completedMilestones / 4 * 100`. A project in "In Development" is always 25%. That is not progress tracking -- that is a status badge with a visual flourish.

**Verdict on PM depth**: This is a status board. It tracks *what phase a project is in* but not *what needs to happen to get it to the next phase*. For someone managing 12 simultaneous launches with 6 functional teams each, this gives me about 10% of what I need from a project management tool.

---

## Cross-Functional Coordination: Can all my stakeholders work in this one system?

The team model (`TeamMember` with roles: admin, editor, viewer) is flat. Everyone on a team sees the same projects, same formulations, same packaging catalog. There is no concept of:

- **Functional groups** (R&D team, regulatory team, marketing team)
- **Cross-project views** ("Show me all projects where packaging artwork is pending")
- **Role-based views** ("As a regulatory reviewer, what needs my attention?")
- **Workload visibility** ("Who is overloaded? Who has capacity?")

The `ProjectAssignment` model lets me assign people to projects, but the role is just "lead" or "member." In my world, I need to know that Sarah is the regulatory lead, Marco is R&D, and Jess owns packaging for a project. Everyone being "member" tells me nothing about accountability.

The share link feature is actually thoughtful for sharing with external contract manufacturers or agencies. The dedicated query strips internal data properly. But this is a one-way broadcast -- the external party cannot comment back or upload revised artwork. It is a "look at this" link, not a collaboration surface.

**Verdict on cross-functional**: My R&D chemist, regulatory specialist, packaging engineer, and marketing brand manager would all log in and see the same undifferentiated list of projects. There is nothing that routes work to the right person or makes functional handoffs explicit. I would still be the human router.

---

## Status & Reporting: How quickly can I generate a steering committee update?

I cannot. There is no report generation feature at all.

The dashboard gives me four stat cards (active projects, formulations, sample orders, pending samples), a list of recent projects, recent sample orders, and a brief activity feed. This is a personal landing page, not a reporting surface.

To prepare for a steering committee, I would need:
- A cross-project summary table (all projects, current phase, RAG status, key risks, next milestone date)
- Export to PowerPoint or PDF
- Filtering by portfolio, category, or market
- Week-over-week comparison of status changes

None of these exist. The closest thing is the project list page which shows cards with status badges, category, market, formula count, and sample count. But it is not sortable, not filterable in the UI, and not exportable. The `ToolSelectionPanel` component references a "create-pdf" / "Export project data as a formatted PDF" tool, but it is in the AI tool palette that is explicitly out of scope for v1.

**Verdict on reporting**: I would spend *more* time manually assembling updates from this tool than I do today with Smartsheet, because at least Smartsheet exports to Excel. This system has zero reporting infrastructure.

---

## Dependencies & Critical Path: Does it handle the complexity of multi-project coordination?

No. This is the single biggest gap.

There is no dependency model anywhere in the schema. No task depends on another task (there are no tasks). No project depends on another project. No formulation approval gates the sample order (a sample can be ordered for any formulation regardless of its status). The sample status progression (Pending -> In Production -> Shipped -> Delivered) is manually advanced via buttons, with no connection to upstream or downstream work.

In my reality:
- Packaging artwork approval blocks sample ordering
- Regulatory clearance of the formula blocks scale-up
- Stability testing completion gates launch approval
- A change to one shared ingredient ripples across 4 projects

Atelier treats each project as an island. The `ProjectFormulation` junction table links formulations to projects (many-to-many), which is architecturally correct -- but there is no UI or logic that surfaces the implication: "This formulation is shared across 3 projects. A change here affects all of them."

There is no Gantt view, no critical path calculation, no resource conflict detection, no cascading date impact analysis. When a supplier delays packaging components by 3 weeks, I need to see in 30 seconds which launch dates are at risk. This tool cannot tell me that because there are no dates to cascade.

**Verdict on dependencies**: Completely absent. This is not a criticism of the tool's quality -- it is simply not trying to solve this problem. It is a product development workspace, not a project scheduling tool.

---

## Collaboration Features: Activity feeds, comments, notifications -- are they enterprise-grade?

The collaboration layer (C1-C5) is the most complete part of the build, and honestly, it is well-architected for what it is.

**Activity System (C1)**: Every mutation emits an `Activity` record inside a `$transaction`. The feed on the project detail page has filter dropdowns and cursor-based pagination. This is the right pattern. The activity types cover the domain well.

**Comments (C2)**: Threaded one level deep (enforced server-side). Edit and soft-delete are own-user only. Plain text only, no markdown, no @mentions, no file attachments. The polymorphic `entityType + entityId` pattern means comments can attach to projects, formulations, or sample reviews. For a v1, this works.

**Assignments (C3)**: Creator auto-assigned as "lead." Avatar chips on project cards and detail headers. Simple and functional. But no functional role distinction.

**Share Links (C4)**: Crypto-random tokens, 7-day expiry, toggle controls for ingredient/review visibility, admin/lead-only creation, proper data stripping in the public query. Security model is sensible.

**Notifications (C5)**: Bell icon with unread count in the sidebar. Fan-out rules are well-considered. Mark-as-read and mark-all-as-read. Clicking navigates to the relevant project.

**But**: No email notifications. No digest. No Slack integration. No Teams integration. The notification bell only works if people are actively in the app. In a cross-functional environment where the regulatory person logs in twice a week during brief phase and then intensely during submission, in-app-only notifications mean they miss things.

Also, notifications are hard-capped at 20 with no pagination. If I am on vacation for a week and come back to 50 notifications, I see the 20 most recent and the rest are invisible.

**Verdict on collaboration**: Solid foundation for a small team. Not enterprise-grade. No audit trail for compliance-sensitive decisions. No approval workflows. No sign-off gates. But the architecture is clean and extensible.

---

## Verdict: Does this reduce my meeting load and email volume, or does it add to it?

Let me be direct. If I adopted Atelier today, it would be **tool number 7** in my stack, not a replacement for any of the existing 6.

It does not replace Smartsheet/MS Project (no tasks, no dependencies, no Gantt, no dates, no resource management). It does not replace SharePoint (document management is a basic upload list with no versioning, no approval workflows, no metadata). It does not replace Teams/Slack for communication (no email notifications, no integrations, no channel-based discussion). It does not replace PowerPoint for reporting (no export, no cross-project summaries). It does not replace our PLM system (no bill of materials, no regulatory workflow, no change control).

What it *does* is put formulations, sample orders, packaging options, and project status in one place with a clean UI. For a brand founder managing 3 products with a team of 5, this is genuinely useful -- the sample order tracking with reviews, the formulation-to-project linking, the share-with-your-contract-manufacturer flow. That is a real workflow that other tools handle poorly.

But for a PM coordinating 12 launches across 6 functions with 30+ stakeholders? The absence of dates, dependencies, approval gates, reporting, and integrations means I am still the human API. I still manually compile the status update. I still chase people in Slack because the notification bell only works if they are logged in. I still re-plan cascading impacts in a spreadsheet because this tool does not know what a dependency is.

The honest assessment: Atelier is **a product data workspace**, not a project management tool. And that is fine -- but it should not be pitched to PMs as a replacement for project management software. It solves the "where is the latest formula spec and who reviewed the sample?" problem. It does not solve the "what is going to slip and who needs to know?" problem.

If I were advising the Atelier team, I would say: do not try to become MS Project. That is a losing game. Instead, **integrate with** the tools PMs already use. Give me a webhook when a sample status changes so my Smartsheet timeline auto-updates. Give me a Slack notification when someone comments. Give me a CSV export of project status so I can paste it into my steering committee deck. Meet me where I already live instead of asking me to move.

**Score: 4/10 for enterprise PM use. 7/10 for small-team product development tracking.**

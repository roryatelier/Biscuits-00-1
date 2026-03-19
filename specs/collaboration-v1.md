# Collaboration & Sharing — Design Spec v1

**Author:** Head of Design
**Date:** 14 March 2026
**Status:** Draft for review

---

## Problem

Atelier is currently single-player. Every user on a team sees the same data, but there's no way to:
- Know who's working on what
- Share a project with someone outside your team (a supplier, a retail partner, a contract chemist)
- Comment on a formulation or sample review
- Get notified when something changes
- Collaborate asynchronously on project decisions

This means teams default to Slack, email, and screenshots to discuss work that lives in Atelier. Context scatters. Decisions get lost. The platform becomes a system of record nobody checks.

**The goal:** Make Atelier the place where product decisions happen, not just where product data lives.

---

## Design Principles

1. **Collaboration is ambient, not bolted on.** Comments, presence, and activity should feel native to every page — not a separate "collaboration" section.
2. **Share without surrendering.** External sharing should be read-only by default. The team retains control.
3. **Low-friction first.** A comment should be one click + type. Sharing should be one link. Don't build a permissions matrix nobody will configure.
4. **Show the trail.** Every decision has a history. Who changed the status? Who approved the formulation? The system should answer without anyone asking.

---

## Feature 1: Project Activity Feed

### What
A chronological feed on every project detail page showing what happened, when, and who did it.

### Why
When Sara opens a project she hasn't looked at in a week, she should immediately understand what changed without asking anyone.

### Spec

```
┌─────────────────────────────────────────────────────────────┐
│  Activity                                              Filter ▾ │
├─────────────────────────────────────────────────────────────┤
│  ○ Rory G. changed status to "Sampling"         2 hours ago │
│  ○ Sara M. submitted a review for SMP-0012       Yesterday  │
│  ○ Rory G. linked formulation "Scalp Purify"    2 days ago  │
│  ○ Sara M. left a comment: "The scent profile   3 days ago  │
│    needs work — too medicinal for the target                 │
│    demographic."                                             │
│  ○ Rory G. created this project                 12 Mar 2026  │
└─────────────────────────────────────────────────────────────┘
```

**Events to track:**
- Project created / status changed / details edited
- Formulation linked / unlinked
- Sample order created / status advanced
- Sample review submitted
- Comment added (see Feature 2)
- Project shared externally (see Feature 4)

**Data model:**
```
Activity
  id
  projectId
  userId          — who did it
  type            — "status_change" | "formulation_linked" | "sample_ordered" | "review_submitted" | "comment" | "shared"
  description     — human-readable summary
  metadata        — JSON blob with before/after values, linked IDs, etc.
  createdAt
```

**Behaviour:**
- Auto-generated on every mutation (server-side, not client-emitted)
- Most recent first
- Filterable by type (dropdown: All, Status changes, Comments, Samples)
- Paginated (show 20, "Load more")
- No real-time — refresh on page load is fine for v1

---

## Feature 2: Comments

### What
Threaded comments on projects, formulations, and sample reviews.

### Why
"What do you think of this formulation?" currently happens in Slack. It should happen next to the formulation itself, where the context is permanent and discoverable.

### Spec

```
┌─────────────────────────────────────────────────────────────┐
│  Discussion (3)                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [R] Rory G.                              2 hours ago    ││
│  │ The zinc pyrithione concentration at 1% is right at     ││
│  │ the regulatory limit for leave-on. Since this is a      ││
│  │ rinse-off, we're fine — but flag it for the reg team.   ││
│  │                                                         ││
│  │   ┌─────────────────────────────────────────────────┐   ││
│  │   │ [S] Sara M.                       1 hour ago    │   ││
│  │   │ Good catch. I've added a note to the brief.     │   ││
│  │   │ Should we also look at piroctone olamine as     │   ││
│  │   │ a backup active?                                │   ││
│  │   └─────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Write a comment...                            [Post] │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Data model:**
```
Comment
  id
  body             — plain text (v1), markdown (v2)
  userId
  projectId?       — polymorphic: comment on a project
  formulationId?   — or on a formulation
  sampleReviewId?  — or on a sample review
  parentId?        — for threading (one level deep in v1)
  createdAt
  updatedAt
```

**Behaviour:**
- One level of threading (reply to a comment, but not reply to a reply)
- Edit your own comments (show "edited" indicator)
- Delete your own comments (soft delete — show "This comment was deleted")
- No @mentions in v1 — keep it simple
- Comment count shown in section header
- Comments appear in the Activity Feed (Feature 1)

**Where comments appear:**
| Surface | Placement |
|---------|-----------|
| Project detail (`/projects/[id]`) | New "Discussion" section below milestones |
| Formulation detail (`/formulations/[id]`) | New tab: "Discussion" alongside Ingredients/Versions |
| Sample review (`/samples/[id]/review`) | Below the review form, above existing reviews |

---

## Feature 3: Presence & Assignments

### What
Light-touch awareness of who's active and who's responsible.

### Why
Two people editing the same project brief without knowing is a recipe for lost work. And "who's handling the sample order?" shouldn't require a Slack message.

### Spec

**3A. Project Assignees**

```
┌─────────────────────────────────────────────────────────────┐
│  Anti-Dandruff Shampoo Innovation                           │
│  Status: In Development · Haircare · UK                     │
│                                                              │
│  Team:  [R] Rory G. (Lead)   [S] Sara M.     [+ Assign]    │
└─────────────────────────────────────────────────────────────┘
```

- Each project has optional assignees (team members)
- One assignee can be marked as "Lead"
- Assignees shown as avatar chips on project cards and detail pages
- Simple join table: `ProjectAssignment { projectId, userId, role: "lead" | "member" }`

**3B. Viewing Presence (v2 — not in initial build)**

- Small avatar dots on the project card when someone else has that page open
- "Sara M. is viewing this project" banner at top of detail page
- Implementation: polling endpoint, not WebSockets (simpler for v1)
- Defer this to v2 — the value is real but the implementation cost is higher than the other features

---

## Feature 4: External Share Links

### What
Generate a read-only link to share a project's status, formulations, and sample progress with someone outside the team — a supplier, a retail buyer, an investor.

### Why
"Can you send me an update on where the anti-dandruff line is?" should be answerable with a single link, not a deck of screenshots.

### Spec

```
┌─────────────────────────────────────────────────────────────┐
│  Share this project                                    [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Anyone with this link can view this project.               │
│  They cannot edit, comment, or see other projects.          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ https://app.atelier.co/share/proj_01?token=abc123...  │ │
│  │                                          [Copy link]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  What's included:                                           │
│  ☑ Project overview & status                                │
│  ☑ Linked formulations (names only, not full INCI)          │
│  ☑ Sample order status                                      │
│  ☐ Ingredient details                     [toggle off]      │
│  ☐ Sample review scores                   [toggle off]      │
│                                                              │
│  Link expires:  [7 days ▾]                                  │
│                                                              │
│  [Revoke all links]                      [Generate link]    │
└─────────────────────────────────────────────────────────────┘
```

**Data model:**
```
ShareLink
  id
  token            — unique, URL-safe random string
  projectId
  createdById
  expiresAt
  revokedAt?
  includeIngredients   Boolean  @default(false)
  includeReviews       Boolean  @default(false)
  createdAt
```

**Shared view route:** `/share/[token]`
- Public page (no auth required)
- Minimal chrome — Atelier logo, project name, clean read-only layout
- Shows: project name, status, category, market, claims, linked formulation names, sample order statuses
- Conditionally shows: ingredient tables, review scores (based on ShareLink toggles)
- Expired or revoked links show: "This link has expired" with Atelier branding
- Footer: "Powered by Atelier — composable manufacturing for beauty & wellness"

**Behaviour:**
- Only admins and project leads can generate share links
- Multiple active links per project allowed (different audiences, different scopes)
- Links logged in Activity Feed: "Rory G. shared this project externally"
- Active share links listed in project settings or a "Sharing" section on project detail
- Revoking a link is immediate — the shared page returns 404

---

## Feature 5: Notifications

### What
In-app notification bell showing relevant activity across the user's projects.

### Why
Without notifications, collaboration features are push-only. Someone leaves a comment — and nobody knows until they happen to visit that page.

### Spec

```
┌──────────────────────────────────────────┐
│  🔔 3                                    │  ← Bell icon in sidebar header
├──────────────────────────────────────────┤
│                                          │
│  Sara M. commented on                    │
│  Anti-Dandruff Shampoo Innovation        │
│  "Should we also look at piroctone..."   │
│                                     2h   │
│  ─────────────────────────────────────   │
│  Sample SMP-0012 status changed to       │
│  Shipped                                 │
│                                     5h   │
│  ─────────────────────────────────────   │
│  Sara M. submitted a review for          │
│  SMP-0010                                │
│                                  Yesterday│
│                                          │
│  [Mark all as read]                      │
└──────────────────────────────────────────┘
```

**Data model:**
```
Notification
  id
  userId           — recipient
  activityId       — links to the Activity that triggered this
  read             Boolean @default(false)
  createdAt
```

**What generates notifications:**
| Event | Who gets notified |
|-------|-------------------|
| Comment on a project | All project assignees except commenter |
| Reply to your comment | The parent comment author |
| Sample status advanced | The sample order creator |
| Sample review submitted | The sample order creator + project lead |
| Project status changed | All project assignees except the changer |
| Project shared externally | All project assignees |

**Behaviour:**
- Bell icon with unread count in sidebar (next to profile)
- Dropdown panel (not a separate page)
- Click a notification → navigate to the relevant page
- "Mark all as read" button
- No email notifications in v1 — in-app only
- Notifications auto-generated server-side when Activity records are created
- Keep 90 days, auto-prune older

---

## Implementation Priority

```
PHASE 1 — Foundation (build first, everything else depends on it)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature 1: Activity Feed        — data model + auto-emit on mutations
  Feature 2: Comments             — data model + UI on project detail

PHASE 2 — Sharing & Awareness
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature 3A: Project Assignees   — join table + avatar chips
  Feature 4: External Share Links — token generation + public read-only view

PHASE 3 — Closing the Loop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature 5: Notifications        — depends on Activity Feed existing
  Feature 2+: Comments on formulations & reviews (extend from projects)

PHASE 4 — Polish (v2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature 3B: Viewing Presence
  @mentions in comments
  Email notification digests
  Comment reactions (👍 ❤️ etc.)
  Share link analytics (view count, last accessed)
```

---

## Open Questions

1. **Should comments support rich text / markdown?** Plain text is simpler and faster. Markdown adds formatting but increases complexity. Recommendation: plain text in v1, revisit after usage data.

2. **Should external share links require the viewer to enter an email?** This adds a lightweight gate for analytics ("who actually viewed this?") but adds friction. Recommendation: no gate in v1 — the link is the auth.

3. **Should notifications live in the sidebar or a top bar?** Sidebar keeps the notification bell always visible. Top bar is more conventional. Recommendation: sidebar, next to the user profile section — it's always visible and doesn't compete with page content.

4. **Activity retention period?** 90 days covers most product development cycles. Older activity can be archived, not deleted. Recommendation: 90 days in the feed, archived indefinitely in the DB.

5. **Should project assignees be required?** If yes, force assignment on project creation. If no, projects can exist without assignees (current behaviour). Recommendation: optional — default to creator as Lead, allow adding more.

---

## What This Unlocks

When all five features ship, the user experience changes fundamentally:

**Before:** "Let me Slack Sara to ask if she's seen the sample review."
**After:** Sara already got a notification, left a comment on the review, and Rory can see it all in the activity feed.

**Before:** "Can you put together a status deck for the retail partner meeting?"
**After:** Generate a share link. Done.

**Before:** "Wait, who changed the formulation status to Approved? When?"
**After:** Activity feed: "Sara M. changed status to Approved — 3 days ago."

The platform becomes the source of truth for product decisions, not just product data.

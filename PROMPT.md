# Atelier Rebuild — Ralph Wiggum Loop Prompt

You are working on a Next.js 16 app with Prisma, NextAuth, and Tailwind CSS.

## Task

Work through the P0 ship blockers from BACKLOG.md, in order. On each iteration, pick the next incomplete item and implement it.

### Item 1: Fix .gitignore — dev.db exposed
- Add `dev.db` and `dev.db-journal` to `.gitignore` at project root level
- Verify `prisma/dev.db` is already ignored

### Item 2: Responsive sidebar & layout
- Add a hamburger menu / drawer behaviour for screens below 768px
- Sidebar should collapse to an overlay drawer on mobile
- Content area should use full width on mobile
- Test: `npm run build` must pass

### Item 3: Fix broken nav routes
- `/projects` and `/innovation` return 404
- Either create `app/(platform)/projects/page.tsx` and `app/(platform)/innovation/page.tsx` with appropriate content, or redirect to valid sub-routes
- Check the sidebar nav to see what these links point to and match accordingly

### Item 4: Responsive content grids
- Stats grid, catalog grid, backlog table, and chat layout need mobile breakpoints
- Use Tailwind responsive classes (sm:, md:, lg:)
- Single column on mobile, multi-column on desktop

### Item 5: Fix colour contrast (WCAG AA)
- Find `--slate-400` in CSS custom properties and darken to at least `#8a8280` for 4.5:1 contrast ratio
- Audit dates, subtitles, order IDs for contrast issues
- Only fix what's needed — don't redesign

## Definition of Done

After implementing a change:
1. Run `npm run build` — it must complete with zero errors
2. Run `npx tsc --noEmit` — no type errors
3. Verify the change matches the backlog description

## Rules

- Only implement ONE item per iteration
- If an item is already done (you can tell from the code), skip to the next one
- If ALL items are complete, output "ALL P0 ITEMS COMPLETE" and exit
- Keep changes minimal and focused — don't refactor surrounding code
- Don't add tests, comments, or documentation unless the item specifically requires it
- Commit each completed item with a descriptive message

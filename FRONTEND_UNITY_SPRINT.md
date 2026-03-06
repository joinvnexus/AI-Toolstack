# Frontend Unity Sprint (7 Days)

Last updated: 2026-03-06

## Goal
- Design unity (same visual language across pages)
- Better responsive behavior (mobile-first)
- More interactive and polished UX states

## Day-by-Day Plan

### Day 1 - Design Tokens + Base UI
- [x] Finalize color tokens, spacing scale, radius, shadows
- [x] Set typography scale for headings/body/captions
- [x] Standardize base styles for button/input/card/badge
- [x] Apply changes in:
  - `src/app/globals.css`
  - `src/app/layout.tsx`
  - `src/lib/constants/site.ts`

### Day 2 - Layout Unity
- [ ] Use one container width rule across public pages
- [ ] Unify section spacing and heading rhythm
- [ ] Normalize navbar + footer spacing/behavior
- [ ] Apply changes in:
  - `src/components/layout/navbar.tsx`
  - `src/components/layout/footer.tsx`
  - `src/app/page.tsx`
  - `src/app/tools/page.tsx`
  - `src/app/blog/page.tsx`

### Day 3 - Responsive Pass
- [ ] QA at 320, 375, 768, 1024, 1280 widths
- [ ] Fix card/grid breakpoints and overflow
- [ ] Ensure touch targets are at least 44px
- [ ] Apply changes in:
  - `src/components/tools/tool-card.tsx`
  - `src/components/blog/blog-card.tsx`
  - `src/app/search/page.tsx`
  - `src/app/dashboard/page.tsx`

### Day 4 - UX States
- [ ] Add loading skeletons where needed
- [ ] Add empty states (no data views)
- [ ] Add error states with retry action
- [ ] Add submit/loading/success feedback in forms
- [ ] Apply changes in:
  - `src/components/ui/skeleton.tsx`
  - `src/app/tools/page.tsx`
  - `src/app/blog/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/dashboard/page.tsx`

### Day 5 - Interaction Polish
- [ ] Improve hover/focus/active states
- [ ] Improve filters/search debounce UX
- [ ] Keep tab/filter state in URL or store
- [ ] Apply changes in:
  - `src/lib/hooks/use-debounced-value.ts`
  - `src/lib/store/ui-store.ts`
  - `src/app/tools/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/dashboard/page.tsx`

### Day 6 - Accessibility + Image UX
- [ ] Keyboard navigation pass
- [ ] Visible focus ring everywhere
- [ ] Heading hierarchy and contrast check
- [ ] Replace blog detail `<img>` with `next/image`
- [ ] Apply changes in:
  - `src/app/globals.css`
  - `src/app/blog/[slug]/page.tsx`
  - `src/app/tools/[slug]/page.tsx`
  - `src/components/layout/navbar.tsx`

### Day 7 - Admin/Auth Consistency + Final QA
- [ ] Unify admin pages styling
- [ ] Unify auth pages styling
- [ ] Final responsive and interaction QA
- [ ] Apply changes in:
  - `src/app/admin/page.tsx`
  - `src/app/admin/tools/page.tsx`
  - `src/app/admin/posts/page.tsx`
  - `src/app/admin/users/page.tsx`
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/signup/page.tsx`

## Extra Frontend Functionalities (After Sprint Core)
- [ ] Saved filters with URL sync (`/tools`, `/search`)
- [ ] Recent searches (with clear history)
- [ ] Optimistic bookmark/review action + undo toast
- [ ] Consistent pagination/infinite scroll behavior
- [ ] Reusable `EmptyState` and `ErrorState` components

## Start Order (Recommended)
1. Day 1 (foundation)
2. Day 2 (layout)
3. Day 3 (responsive)
4. Day 4 + Day 5 (state + interactions)
5. Day 6 (a11y)
6. Day 7 (final unification + QA)

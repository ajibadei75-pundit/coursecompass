# CourseCompass theme and responsive polish

## Goal
Make CourseCompass comfortable to use in bright environments, preserve a dark option, and keep its primary pages readable and usable on phones, tablets, and desktops.

## Changes
- Refresh semantic theme tokens with a light-first palette and coordinated dark palette; replace dark-only content treatments where necessary.
- Add an accessible light/dark control in the shared header, persist the choice, and avoid server/client theme flicker.
- Improve the shared navigation for small screens and refine layouts, text sizing, controls, and overflow on the home, browse, course profile, match test, chat, and about pages.
- Complete route-specific sharing metadata for content pages.
- Check the current app flows and preview at mobile and desktop sizes; fix issues found within this scope.

## Technical details
- Keep theme colors in `src/styles.css` semantic tokens and use the existing design-system Button.
- Initialize the theme safely after hydration and persist it in browser storage; SSR uses the light default.
- Keep the existing TanStack routes and AI behavior unchanged.

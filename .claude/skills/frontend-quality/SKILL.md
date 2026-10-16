---
name: frontend-quality
description: Verification pass before calling frontend work done - lint/build baseline, responsive checks at 320-1440 px, keyboard and screen-reader accessibility, data-integrity of payloads, request/render performance and regression checks of existing flows. Use after any UI change, before opening or updating a PR, or when asked to review quality, accessibility, responsiveness or performance.
---

# Frontend quality

This is the final gate for UI work in this repo. The repo has **no automated tests and no type-check**, so this pass
is the main protection against regressions. Report only checks you actually ran. Do not claim a Lighthouse score,
test pass or device check you didn't do. Spec references: responsive §11, accessibility §10, performance §12,
acceptance criteria §17 in `docs/CLAUDE_PRODUCT_REGISTRY_UI_UX.md`.

## Workflow

1. **Baseline first.** Before editing, run `npm run lint` and `npm run build` and note the result, so new
   problems can be told apart from old ones. On 2026-10-16 lint had 0 errors and 31 warnings: 8 `only-export-components` in `router.jsx` (one per `lazy()` route),
   `set-state-in-effect` in `product-form.jsx`, `commodity-combobox.jsx`, `use-products.js` and `use-product.js`, and the rest in legacy MUI files.
2. **Static checks after the change:**
   - `npm run lint` has no new errors **or warnings** in touched files (compare with the baseline). The one expected
     exception is a new `lazy()` route, which adds an `only-export-components` warning in `router.jsx`. Mention it in the report.
   - `npm run build` passes. Compare chunk sizes. The entry chunk (`index-*.js`) must not grow noticeably.
     A heavy module needed by one route belongs behind that route's `lazy()` in `src/router.jsx`.
   - `git diff --stat` touches only files the task needs. Check `package.json` for new dependencies, and justify each one.
3. **Regression sweep.** For every component whose props or behavior changed, find its callers with
   `rg -n "<Name>" src` and check each one. The core flows must still work:
   sign in → product list (search, filters, sort, page size, pagination) → details → edit (non-admin
   password prompt) → save, then back to the list with filters kept. Also create a product, delete it (admin), edit a price on `/pricing`,
   check that the legacy MUI pages (`/dashboard`, `/activity-logs`, `/categories`, `/naming`) still render, and test CSV import and export.
4. **Responsive check.** Run `npm run dev` and use the browser tools this session has. If none are available,
   say that the check was not run. Check widths **320, 375, 768, 1024 and 1440 px** for:
   - no horizontal page scroll (`document.documentElement.scrollWidth <= innerWidth`);
   - the table below `md` switches to `product-card-list`, and filters to the bottom `Sheet`;
   - dialogs, sheets, popovers and form errors fit the viewport and are not clipped;
   - long descriptions, ERP codes and UNSPSC titles wrap; touch targets are about 40 px or more on mobile.
   Do not add Playwright or another test dependency to the project for this without asking.
5. **Accessibility check:**
   - Keyboard only: every control is reachable in a logical order with a visible focus ring. Dialogs trap focus and
     return it on close. Comboboxes follow `searchable-selectors`.
   - Every input has a visible label tied to it (`FormLabel`/`Label htmlFor`). Errors use `FormMessage`
     (announced and linked through `aria-describedby`). Required fields are marked visibly and programmatically.
   - Icon-only buttons have `aria-label`. Decorative icons have `aria-hidden`. Status uses text, not color alone.
   - Async feedback uses `role="status"`/`aria-live` or a toast, and persistent errors stay on the page.
   - One `h1` per page via `PageHeader`, with no skipped heading levels inside a page. Motion respects `prefers-reduced-motion`.
6. **Data-integrity check:** in the Network panel, or by reading `toPayload`, confirm:
   - request payload field names match the server request classes, and no field was renamed, dropped or invented;
   - ids are sent as ids (`category_key`, `internal_category_id`), codes are never invented (`unspsc-classification`),
     and server-generated values (`erp_item_code`, `item_description`) are not overridden;
   - a failed save keeps the input, 422 errors land on the right fields, and double submission is impossible.
7. **Performance check:**
   - Lists use server pagination (`useProducts` → `per_page`). Nothing fetches the whole registry or the UNSPSC set.
   - Search is debounced, and stale requests are aborted. There are no duplicate requests on mount: StrictMode
     double effects are fine only if the first request is aborted.
   - Reference lists go through the shared caches in `use-lookups.js` instead of refetching per component.
   - No expensive work inside render loops. Add `useMemo`/`memo` only where a measured or obvious cost justifies it.
   - Icon imports are named (`lucide-react`), never whole-library imports.

## Report format

End with a short block listing: the commands run and their results (with warning counts), the widths and flows
checked and how, anything **not** checked and why, and any remaining issues or backend questions.

## Done when

All seven steps are done or explicitly marked not run with a reason. Lint and build are no worse than the
baseline. No core flow regressed. No unverified claim appears in the report or PR.

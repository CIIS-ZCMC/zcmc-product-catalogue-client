---
name: product-registry-ux
description: Audit and improve the product registry screens (product list, create/edit form, details, delete, pricing) for usability, validation, help text, empty/loading/error states and responsive layout. Use when changing anything under src/pages/products or src/components/products, or when asked to improve the registry UX.
---

# Product registry UX

Improve how staff find, register, edit and review products, working inside the existing shadcn/ui screens.
`CLAUDE.md` holds the stack, directory and styling rules. The full design brief is
`docs/CLAUDE_PRODUCT_REGISTRY_UI_UX.md`. This skill says what to look at and in what order.

Related skills: pickers go to `searchable-selectors`, anything about UNSPSC codes or classification
goes to `unspsc-classification`, and the final checks are in `frontend-quality`.

## Where the screens are

| Screen | Route | Files |
| --- | --- | --- |
| List, search, filters, export | `/products` | `pages/products/product-list-page.jsx`, `components/products/product-{table,card-list,filters,row-actions,list-skeleton}.jsx`, `list-state.jsx`, `list-pagination.jsx` |
| Create | `/products/new` | `pages/products/product-create-page.jsx` → `components/products/product-form.jsx` (`mode="create"`) |
| Edit | `/products/:id/edit` | `pages/products/product-edit-page.jsx` → `product-form.jsx` (`mode="edit"`, `requirePassword` for non-admins) |
| Details | `/products/:id` | `pages/products/product-details-page.jsx` |
| Delete | row menu, details | `components/products/delete-product-dialog.jsx` (admin only) |
| Pricing | `/pricing` | `pages/pricing-page.jsx`, `components/products/price-edit-dialog.jsx` |

Shared helpers: `lib/product.js`, `hooks/use-products.js`, `hooks/use-product.js`, `hooks/use-return-to.js`,
`components/products/unsaved-changes-guard.jsx`, `components/layout/page-header.jsx`.

## Workflow

1. **Scope.** Restate which screen(s) and which user task (register, find, correct, review) the change serves.
   Read the matching spec section: list §6, forms §7, details §8, destructive actions §9, interaction §16.
2. **Confirm the data.** Before adding or relabelling a field, find it in `product-form.jsx`'s Zod schema and
   `toPayload`, in `lib/product.js`, and in the server's `StoreProductRequest`/`UpdateProductRequest`.
   Do not add a field, filter, sort or status the API does not support. `SORT_OPTIONS` lists the supported sorts.
3. **Audit the current screen** against this checklist. Write down the gaps before editing:
   - *Form structure:* fields grouped in `SectionCard`s with the most important first. Labels sit above inputs.
     Required fields use `FormLabel required` and `FormControl required`. One column on mobile, two where fields pair up.
   - *Help text:* identifiers (BizBox, PhilGEPS, ERP preview, UNSPSC) say their format or source in
     `FormDescription`. Placeholders are examples, never the label.
   - *Validation:* the Zod message names the fix ("Enter the BizBox item code."). It shows on blur or submit,
     not on every keystroke. Server 422 `errors` map to fields via `SERVER_FIELD_MAP`. Entered values survive a failed save.
   - *Submission:* the button is disabled while `isSubmitting` and its label changes ("Saving…"). A success toast
     plus navigation gives the next step. `UnsavedChangesGuard` blocks leaving a dirty form.
   - *List states:* loading (skeleton with stable size), empty registry, no results (offer "Clear filters"),
     error (offer Retry), and missing values shown as "—". Use `ListState` for the message blocks.
   - *Context:* filters, sort and page live in the URL and survive the round trip to details or edit
     (`useReturnTo`, `location.state.from`).
   - *Destructive actions:* `AlertDialog` names the product and shows pending and error states. Delete and price
     edits stay gated by `isAdmin` in the UI, and the server enforces them.
   - *Responsive:* table at `md` and up, `product-card-list` below. Filters move into a `Sheet` on mobile. Long
     descriptions and codes wrap (`break-words`, `min-w-0`) instead of overflowing.
4. **Plan small steps.** Do one screen or one concern per change. Prefer editing the existing component
   over adding a new one. Add a new file only when it is reused or makes the code clearer.
5. **Implement** with existing primitives (`ui/*`, `ListState`, `PageHeader`, `SectionCard`, `display()`).
   Write copy in plain, action-first language and keep labels consistent across list, form and details
   (for example "BizBox item code", "UNSPSC commodity", "Internal category").
6. **Verify** with the `frontend-quality` skill. Then report what changed, the remaining gaps, and any backend questions.

## Constraints

- Do not convert legacy MUI screens unless the task asks. Do not import MUI into shadcn screens.
- Do not change `api.js` request shapes or payload field names as part of a UX change.
- Do not rely on toasts alone for errors that need a fix. Put them next to the field or in an `Alert`.
- Do not add decorative cards, gradients or animations. This is a data-entry tool for daily use.
- Keep edits out of `components/ui/*` unless the change is generic and benefits every caller.

## Done when

- Every state in the step 3 checklist is handled on the touched screen, or listed as a known gap.
- No field, status or endpoint was invented, and payloads are unchanged unless the task required it.
- `npm run lint` shows no new warnings or errors, and `npm run build` passes.
- The touched screen works at 320, 768 and 1280 px wide (see `frontend-quality`).

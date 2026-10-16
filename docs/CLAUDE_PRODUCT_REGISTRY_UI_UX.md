# Product Registry System — UI/UX Design Specification

> **Purpose:** This document is the UI/UX implementation brief for Claude. Use it as the source of truth when designing and building the Product Registry System interface.
>
> **Primary UI library:** shadcn/ui  
> **Principles:** Responsive, accessible, user-friendly, consistent, maintainable, and performance-conscious.

---

## 1. Role and Instructions for Claude

Act as a senior product designer and frontend engineer. First inspect the existing repository, framework, routing, styling, and component conventions. **Extend the existing project rather than replacing its architecture or reinitializing it.**

Before making changes:
1. Inspect `package.json`, the app entry points, routing, existing pages, global styles, and installed dependencies.
2. Identify the framework and whether shadcn/ui is already configured.
3. Reuse existing components and patterns when they are sound.
4. Present a short implementation plan and identify any assumptions.
5. Implement the interface in small, testable steps and run the available lint, type-check, and build commands.

Do not invent backend endpoints, business rules, user roles, or data fields as if they were confirmed. If the backend contract is not available, use a clearly separated mock-data/service layer and document assumptions so it can be replaced cleanly.

## 2. Product Goals

Create a product registry interface that helps authorized users:
- View and search registered products quickly.
- Filter and sort products to find the right record.
- Create a product record with clear validation and helpful guidance.
- View full product details and understand its status.
- Edit records safely and see when changes have been saved.
- Manage categories, identifiers, and other registry metadata where supported.
- Recover from errors without losing entered information.

Prioritize common workflows and clarity over decorative visuals. Keep the experience suitable for both occasional users and staff who process many records each day.

## 3. Information Architecture

Use the routes that fit the existing application. If routing is not yet established, use this suggested structure:

- `/products` — Product list and search
- `/products/new` — Create product
- `/products/:id` — Product details
- `/products/:id/edit` — Edit product
- `/categories` — Category management, if in scope
- `/settings` — Registry settings, only if required

Use a consistent application shell:
- **Desktop:** collapsible left navigation, compact top bar, main content area.
- **Tablet:** narrower or collapsible navigation with preserved content space.
- **Mobile:** navigation drawer/sheet, compact header, single-column content.

Navigation should make the current location obvious. Do not add pages that are outside the confirmed scope simply to fill out the menu.

## 4. Visual Design Direction

Use a clean, professional, data-oriented interface. The UI should feel calm and trustworthy, with strong hierarchy and minimal visual noise.

### Design tokens
- Use the configured shadcn/ui theme and CSS variables. Do not hard-code colors throughout components.
- Support light and dark themes if the project already supports them or it is inexpensive to add consistently.
- Use a consistent spacing scale, typography scale, border radius, and elevation.
- Use semantic colors for success, warning, destructive actions, and neutral information. Do not communicate status by color alone.
- Use icons sparingly and consistently, preferably from the icon library already installed (commonly `lucide-react`).
- Avoid excessive cards, gradients, shadows, badges, borders, and decorative animation.
- Prefer clear page titles, short descriptions, visible primary actions, and restrained supporting text.

### Layout
- Use a centered or fluid content container appropriate to the existing app.
- Keep list pages dense enough for efficient scanning without making text cramped.
- Use consistent alignment for page titles, actions, filters, and tables.
- Avoid fixed widths that cause horizontal overflow on small screens.
- Use skeletons or stable placeholders when loading to reduce layout shifts.

## 5. shadcn/ui Component Strategy

Use shadcn/ui components wherever appropriate. Confirm components and dependencies exist before importing them. Add only the components required by the actual screens.

Likely components:
- `Button`, `Input`, `Label`, `Textarea`
- `Select`, `Checkbox`, `RadioGroup`, `Switch`
- `Form` with the project's chosen validation integration
- `Table` for desktop product listings
- `Card`, `Separator`, `Skeleton`
- `Badge` for concise status labels
- `Dialog` or `AlertDialog` for confirmations and destructive actions
- `Sheet` for mobile navigation and mobile-friendly filters
- `DropdownMenu` for row actions
- `Popover` and `Calendar` only when date selection is required
- `Tabs` only when they improve navigation between meaningful sections
- `Tooltip` for non-essential supplemental hints
- `Sonner` or the project's existing toast system for save/error feedback

Do not create a parallel design system or duplicate existing shadcn/ui components. Keep shared UI primitives reusable, and keep business-specific components separate from generic primitives.

## 6. Product List Screen

The product list is the main workspace and should support quick scanning and efficient search.

### Header
- Page title: **Products**
- Brief supporting text if useful.
- Primary action: **Add product**
- Optional secondary actions only if supported (for example, export).

### Search and filters
- Provide a clearly labeled search field with a useful placeholder, such as “Search by product name, code, or identifier”.
- Debounce search input when it triggers remote requests; do not delay local filtering unnecessarily.
- Provide filters only for real fields in the data model, such as status, category, or date range.
- Display active filters clearly and provide a one-click way to clear them.
- Keep filters compact on desktop; use a `Sheet` on mobile when the filter set would otherwise crowd the page.
- Preserve search/filter state during pagination when practical.

### Table
Use shadcn/ui `Table` for desktop and wider tablet layouts. Potential columns, subject to the actual schema:
- Product name
- Product code / registry identifier
- Category
- Status
- Last updated
- Actions

Requirements:
- Use stable row keys.
- Make column headings understandable and sortable only when sorting is implemented.
- Avoid rendering unnecessary columns; move secondary details to the detail view.
- Use a clear row action menu for view/edit/delete where authorized.
- Do not rely on color alone for status.
- Make interactive elements keyboard accessible.
- Add pagination for large result sets; avoid loading the entire registry into the browser by default.
- Show total results only when the count is reliable and available.

### Responsive list behavior
- Desktop: full table with appropriate column widths.
- Tablet: hide or deprioritize secondary columns; preserve key identifiers and actions.
- Mobile: render a compact list/card per product, or use a carefully designed horizontally scrollable table only when it is genuinely usable. Do not force users to scroll sideways for every essential action.
- Keep tap targets comfortably sized and prevent action menus from being clipped.

### List states
Design all of these states:
1. Initial loading — skeleton rows/cards with stable dimensions.
2. Success — populated list.
3. Empty registry — explain what belongs here and show **Add product** if permitted.
4. No search results — explain that no matches were found and offer to clear filters.
5. Error — concise explanation and a retry action.
6. Partial data or missing optional fields — use a consistent fallback such as “—”.

## 7. Create and Edit Product Forms

Make forms predictable, easy to scan, and resilient to validation errors.

### Form structure
- Use clear labels and group related fields into logical sections.
- Mark required fields visibly and programmatically.
- Provide examples or helper text for identifiers and formats when needed.
- Keep the most important fields first.
- Avoid giant forms with no grouping. If the schema is large, use clear sections or a stepper only when it genuinely reduces cognitive load.
- Use a responsive grid: one column on mobile, two columns for compatible fields on larger screens.
- Keep labels above inputs for predictable responsive behavior.
- Use appropriate input types, autocomplete, and input modes.
- Do not use placeholders as substitutes for labels.

### Validation and submission
- Validate required fields and field formats using the project's existing validation library, or a consistent choice such as Zod if appropriate.
- Validate on blur or submit in a way that avoids noisy errors while the user is typing.
- Place clear error messages next to the relevant field and connect them accessibly.
- Preserve entered values when validation or server submission fails.
- Prevent duplicate submissions while saving and show a visible pending state.
- On success, show confirmation and navigate to the detail page or list with a clear next step.
- Warn before leaving a dirty form when supported by the app's routing model.
- Use server-side validation as the source of truth when a backend exists; client-side validation is not a security boundary.

### Actions
- Primary action: **Save product** or **Create product**, depending on context.
- Secondary action: **Cancel**.
- Keep destructive actions visually separate from save actions.
- Do not clear or discard a form silently.

Do not assume product fields. Inspect the existing schema, API types, requirements, or examples first. If no schema exists, create a clearly documented provisional field model and keep it easy to change. Potential fields such as name, code, description, category, manufacturer, status, and identifiers must be treated as examples until confirmed.

## 8. Product Details Screen

Present information in a readable hierarchy:
- Product name and unique registry identifier near the top.
- Status displayed with both text and appropriate semantic styling.
- Primary actions such as **Edit** and, if authorized, a secondary actions menu.
- Details grouped into meaningful sections based on the actual schema.
- Created/updated timestamps where available and useful.
- Related records or audit history only if supported by the product requirements and data model.

On mobile, stack sections vertically and avoid dense multi-column layouts. Provide a clear route back to the list without losing context where practical.

## 9. Destructive and High-Impact Actions

For deletion or other irreversible actions:
- Use `AlertDialog` with a specific explanation of what will happen.
- Identify the product by name or identifier when possible.
- Make the destructive action explicit and keep the cancel option easy to find.
- Show pending and error states.
- Do not assume deletion is allowed; respect the actual authorization and business rules.
- Prefer archive/deactivate over permanent deletion only if that matches the product's requirements.

## 10. Accessibility

Aim for WCAG 2.2 AA practices where feasible.

- Use semantic headings and landmarks.
- Associate each input with a visible label.
- Support full keyboard navigation and visible focus indicators.
- Ensure adequate text/background contrast.
- Do not convey meaning through color alone.
- Use accessible names for icon-only buttons.
- Provide accessible validation messages and announce important asynchronous feedback.
- Ensure dialogs trap focus appropriately and return focus when closed.
- Respect reduced-motion preferences.
- Avoid tiny text and small touch targets.
- Test zoom and narrow viewport behavior.

Use native HTML semantics and shadcn/ui accessibility patterns. Do not add ARIA attributes that conflict with native semantics.

## 11. Responsive Requirements

Design mobile-first and verify at least these viewport widths:
- **Small mobile:** 320–375 px
- **Large mobile:** 390–430 px
- **Tablet:** 768 px
- **Laptop:** 1024–1280 px
- **Large desktop:** 1440 px and above

Requirements:
- No unintended horizontal page overflow.
- No clipped dialogs, menus, form errors, or table actions.
- No overlapping navigation, buttons, or page headings.
- Responsive spacing and typography.
- Form fields and primary actions remain easy to use with touch.
- Filters and navigation collapse intentionally, not accidentally.
- Avoid fixed heights for content-heavy regions.
- Test long product names, long identifiers, empty values, and translated/expanded text.

Use Tailwind responsive utilities consistently with the project's current conventions.

## 12. Performance Requirements

Optimize for perceived and actual performance without premature complexity.

### Rendering and data
- Fetch only fields needed for the current screen.
- Use server-side pagination, filtering, and sorting for large registries when the backend supports it.
- Avoid fetching all records just to filter them in the browser.
- Debounce remote search requests and cancel or ignore stale requests.
- Avoid unnecessary component state and duplicate derived state.
- Keep row and form components appropriately scoped; use memoization only when profiling or expensive work justifies it.
- Use stable keys and avoid expensive work in render loops.
- Lazy-load non-critical routes and heavy optional modules where supported.
- Avoid unnecessary dependencies and oversized icon imports.

### Network and loading
- Show skeletons or progress indicators for meaningful loading periods.
- Prevent layout shifts with stable placeholders.
- Provide retry behavior for recoverable errors.
- Use request cancellation or stale-response protection for changing filters/search.
- Avoid duplicate requests from repeated effects or repeated button clicks.
- Cache data only according to the app's data freshness and security needs.

### Assets and styling
- Prefer SVG icons and optimized image assets when images are necessary.
- Do not add large decorative images to a data-entry system without a product reason.
- Avoid costly animation; respect `prefers-reduced-motion`.
- Reuse design tokens and existing CSS rather than adding competing styling systems.

### Performance verification
- Run the production build and review its warnings.
- Inspect for unnecessary re-renders and request waterfalls when tools are available.
- Test list performance with a realistically large dataset or representative mock data.
- Use Lighthouse or equivalent checks if available.
- Do not claim a performance score unless it was actually measured.

## 13. Data and API Integration

Keep UI code separate from transport and business logic:
- Use the project's existing API client and conventions.
- Put data access in a service/query layer rather than scattering raw fetch calls through components.
- Use existing typed API responses where available.
- Handle loading, empty, success, and error states consistently.
- Do not expose secrets in client code.
- Do not fake successful writes when the backend is unavailable; use a clearly identified mock implementation during development.
- Keep server response errors understandable and map field-level validation errors to the correct inputs.
- Follow the backend's authorization rules and never rely on hiding a button as the only access control.

If the project already uses a data-fetching library (for example, TanStack Query), follow its conventions rather than adding a competing solution.

## 14. Suggested Component Structure

Adapt this to the current framework and repository; do not force this exact structure if a better existing convention is in place.

```text
src/
  components/
    layout/
      app-shell.tsx
      app-sidebar.tsx
      app-header.tsx
      mobile-navigation.tsx
    products/
      product-list-page.tsx
      product-table.tsx
      product-card.tsx
      product-search.tsx
      product-filters.tsx
      product-form.tsx
      product-details.tsx
      product-status-badge.tsx
      delete-product-dialog.tsx
      product-list-skeleton.tsx
    ui/
      # shadcn/ui components managed by the project
  pages/ or routes/
    products/
      index
      new
      [id]
      [id]/edit
  services/
    products-service.ts
  types/
    product.ts
  lib/
    utils.ts
```

Keep product-specific logic out of generic `ui` primitives. Avoid splitting every tiny element into a separate file without a reuse or clarity benefit.

## 15. Suggested Product Type

This is a **provisional example only**. Replace it with the confirmed backend/domain model before treating it as authoritative.

```ts
type ProductStatus = "active" | "inactive" | "pending";

type Product = {
  id: string;
  name: string;
  code: string;
  categoryId?: string | null;
  description?: string | null;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
};
```

Do not assume these status values, fields, or transitions match the real registry. Confirm the domain model first.

## 16. Interaction Details

- Buttons must have clear action-oriented labels.
- Use disabled states only when the reason is understandable; provide helper text if needed.
- Use toast notifications for concise save results, but do not rely on toasts alone for persistent validation errors.
- Confirm unsaved changes where data loss is possible.
- Keep search, filter, sort, and pagination behavior consistent.
- Maintain useful list context when returning from a product detail page.
- Ensure keyboard users can access row actions and filter controls.
- Use optimistic updates only when safe and implement rollback/error handling.
- Avoid animations that delay actions or distract from data work.

## 17. Testing and Acceptance Criteria

Before marking the work complete, verify:

### Functional
- [ ] Product list renders with real or clearly labeled mock data.
- [ ] Search, filters, sorting, and pagination work if implemented.
- [ ] Create and edit forms validate and preserve input on errors.
- [ ] Detail pages display the correct product.
- [ ] Destructive actions require confirmation and handle failures.
- [ ] Loading, empty, no-results, and error states are covered.
- [ ] Navigation and browser back behavior work as expected.
- [ ] All visible controls have functional behavior.

### Responsive
- [ ] Layout works at 320 px, 375 px, 768 px, 1024 px, and 1440 px.
- [ ] No accidental horizontal overflow.
- [ ] Mobile product browsing and actions are usable without precision clicking.
- [ ] Dialogs, sheets, dropdowns, and validation messages fit the viewport.

### Accessibility
- [ ] Forms have labels and understandable errors.
- [ ] Keyboard navigation and focus indicators work.
- [ ] Icon-only controls have accessible names.
- [ ] Status is understandable without color.
- [ ] Contrast and reduced-motion behavior are reasonable.

### Quality and performance
- [ ] TypeScript has no new errors.
- [ ] Lint and production build pass, or existing failures are documented.
- [ ] No unnecessary dependencies were added.
- [ ] Large lists do not require rendering the entire dataset by default.
- [ ] No obvious console errors, stale-request bugs, or duplicate-submit issues.
- [ ] No unsupported backend behavior has been presented as real.

## 18. Implementation Plan

Work in phases and keep the application runnable after each phase.

1. **Audit:** inspect repository, dependencies, current UI, routing, schema, and API.
2. **Foundation:** confirm shadcn/ui setup, theme tokens, app shell, navigation, and responsive layout.
3. **Product list:** implement list, search, supported filters, pagination, and all list states.
4. **Product form:** implement create/edit form, validation, save/loading/error states.
5. **Product details:** implement detail layout and supported actions.
6. **Responsive and accessibility pass:** test viewport sizes, keyboard flows, focus, labels, and error handling.
7. **Performance and quality pass:** review requests, render behavior, bundle/build output, lint, and type checks.
8. **Handoff:** summarize files changed, features implemented, assumptions, commands run, test results, and any remaining backend dependencies.

Do not attempt a large, unreviewable rewrite. Keep changes focused and verify the app after each major phase.

## 19. Final Instructions

Build a polished, production-minded UI that follows the current repository's conventions and the requirements above. Favor clarity and speed over novelty. Use shadcn/ui and Tailwind in a consistent way, make every screen responsive, cover edge cases, and keep the UI easy to maintain.

At the end, report:
- What was implemented.
- Which routes and components were added or updated.
- Which shadcn/ui components were used.
- What assumptions or mock data remain.
- Which validation commands were run and their results.
- Any issues that need product or backend clarification.

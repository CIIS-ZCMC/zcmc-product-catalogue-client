# ZCMC Product Catalogue Client

React SPA for the ZCMC Procurement Management Unit's product registry: register products, classify them
under UNSPSC and ZCMC internal categories, and keep ERP, BizBox and PhilGEPS codes consistent.
The backend is the Laravel app `CIIS-ZCMC/zcmc-product-catalogue-server`. It is the source of truth for
fields, validation, authorization and generated codes.

UI/UX specification: `docs/CLAUDE_PRODUCT_REGISTRY_UI_UX.md`. Read the relevant section before UI work.
Do not copy it into other files. Where it disagrees with this file, this file describes the real repo.

## Stack (verify in `package.json` before relying on a version)

- React 19, Vite 8, React Router 8 (`createBrowserRouter` in `src/router.jsx`, lazy routes + `Suspense`).
- **JavaScript, not TypeScript.** Files are `.js`/`.jsx`, and `jsconfig.json` maps `@/*` to `src/*`. The
  spec's `.tsx` names and TS types are illustrative. Do not migrate to TypeScript or add `.ts` files unasked.
- shadcn/ui (`components.json`: style `new-york`, `tsx: false`, base color slate, lucide icons) on
  Tailwind CSS v4 via `@tailwindcss/vite`. There is no `tailwind.config`. Theme tokens are CSS variables in
  `src/index.css`, including the custom `success` and `warning` tokens. There is no dark mode yet.
- Forms: react-hook-form + Zod 4 + `@hookform/resolvers`, through `src/components/ui/form.jsx`
  (its `FormLabel`/`FormControl` take `required`).
- Selectors: `cmdk` via `ui/command.jsx` inside `ui/popover.jsx`. Toasts: `sonner` (`ui/sonner.jsx`).
- No data-fetching library (no TanStack Query). Data hooks in `src/hooks/` use `useEffect` + `AbortController`.
- Legacy: MUI + Emotion still render sign-in (`AuthView`), dashboard, activity logs, CSV import
  (`ImportExportModal`), the UNSPSC explorer (`CategoryExplorerView`) and the naming tool
  (`UniformNamingTool`). `App.jsx` keeps the MUI `ThemeProvider` for them.

## Directory conventions

- `src/components/ui/`: shadcn primitives only. No product or business logic here.
- `src/components/products/`: product-specific components (kebab-case files, named exports).
- `src/components/layout/`: app shell, sidebar, header, mobile navigation, `PageHeader`, `nav-items.js`.
- `src/pages/`: route components (default exports). Product screens live in `src/pages/products/`.
- `src/hooks/`: `use-products`, `use-product`, `use-lookups` (cached reference lists), `use-debounced-value`, `use-return-to`.
- `src/lib/`: `utils.js` (`cn`), `product.js` (domain helpers and formatters), `product-list-options.js`.
- `src/services/api.js`: **the only place that calls `fetch`.** Add endpoints here and nowhere else.
- PascalCase files in `src/components/` are legacy MUI. `Header`, `ProductModal`, `ProductsView`,
  `ProductDetailDrawer` and `CascadingCategorySelect` are no longer routed. Do not extend them. Replace a
  legacy screen with shadcn only when the task asks for it.

## Component and styling rules

- Reuse before creating: check `src/components/ui/` and `src/components/products/` first. Add a missing
  shadcn primitive with `npx shadcn@latest add <name>` (it reads `components.json`) instead of hand-writing
  one, and review the generated diff. Never create a parallel design system or a second Button/Input.
- Do not use MUI in new or migrated shadcn screens. Do not mix MUI and shadcn inside one component.
- Style with Tailwind utilities and theme tokens (`bg-card`, `text-muted-foreground`, `text-destructive`,
  `text-success`, `text-warning`). Do not hard-code colors. Merge classes with `cn()`.
- Icons come from `lucide-react` as named imports, with `aria-hidden="true"` when decorative. Icon-only buttons need `aria-label`.
- Show empty values with `display()` / `EMPTY_VALUE` ("—"). Format money with `formatPeso`, dates with `formatDate`.
- Keep the existing code style: 2-space indent, single quotes, no semicolons in the shadcn-era files.

## Data integrity and API rules

- Field names mirror the server's `Product` model and `Store/UpdateProductRequest`. Do not invent fields,
  statuses, roles or endpoints. Check the server repo, or say the assumption out loud.
- Client Zod limits mirror the server rules. The server stays authoritative. Map `err.errors` (Laravel 422)
  back onto form fields, as `product-form.jsx` does.
- Generated values are server-owned: `erp_item_code` (`[UNSPSC code]-[internal code]-[seq]`),
  `item_description` (built from noun, type, material_composition, key_attributes, size; see
  `buildStandardName`). The client may preview these but must not invent them.
- Authorization is enforced by the server. `useAuth().isAdmin` only hides controls. End users must send
  `confirm_password` to edit a product.
- Cancel or ignore stale requests (`AbortController`). Never fake a successful write.
- UNSPSC data and codes follow the `unspsc-classification` skill. Never make up a code.

## Commands

- `npm run dev` starts Vite on `0.0.0.0:5173` and proxies `/api` to `127.0.0.1:7000`. `api.js` falls back
  to `http://<host>:7000/api` when `VITE_API_BASE_URL` is unset.
- `npm run lint` runs oxlint (`.oxlintrc.json`). The baseline was 0 errors and 29-31 warnings.
- `npm run format:check` and `npm run format` run Prettier according to `.prettierrc`.
- `npm run test` runs unit tests via Vitest (`vitest run`).
- `npm run build` is the production build. It reads `VITE_API_BASE_URL` (defaulting in production to `https://product-registryapi.zcmc.online/api`). It must pass.

## Working rules

- Preserve existing behavior. Inspect a component's callers (`rg "ComponentName" src`) before changing its props.
- Inspect `package.json` and `node_modules` before adding a dependency. Prefer what is installed, and
  justify any new package in the PR. Never add a competing library (a second form, fetch or UI kit).
- Make small, reviewable changes, and keep the app runnable after each one. No large rewrites unless asked.
- Project skills in `.claude/skills/` cover the details: `product-registry-ux`, `searchable-selectors`,
  `unspsc-classification`, `frontend-quality`.

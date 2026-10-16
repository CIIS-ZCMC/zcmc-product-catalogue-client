---
name: searchable-selectors
description: Build, fix or reuse accessible searchable dropdowns (comboboxes) with shadcn Popover + Command (cmdk) - local or async server search, debouncing, stale-request cancellation, keyboard navigation, loading/empty/error states and correct value mapping into react-hook-form. Use for any picker of commodities, internal categories, units or other lookup lists.
---

# Searchable selectors

There is one combobox pattern for the whole app. Two working reference implementations already exist.
Copy their structure instead of inventing a new one:

- **Async server search:** `src/components/products/commodity-combobox.jsx` (UNSPSC commodities via `api.getCommodities`).
- **Local list search:** `src/components/products/internal-category-combobox.jsx` (internal categories from the cached `useInternalCategories`).

Both are used in `product-form.jsx` (inside `FormControl`) and in `product-filters.jsx` (with `Label htmlFor`).

## Choose the variant

| Data | Variant | Filtering |
| --- | --- | --- |
| Small, stable list (< ~500 rows), already loaded or cacheable | Local | `<Command>` default filtering. Set each `CommandItem value` to the searchable text (`${name} ${code}`) |
| Large or server-owned list (UNSPSC: ~150k commodities) | Async | `<Command shouldFilter={false}>`. The server filters. Never load the full list into the browser |
| ≤ ~7 fixed options, no search needed | Not a combobox | Use `ui/select.jsx` (as the unit and sort selects do) |

## Workflow

1. **Search for an existing picker** with `rg "Combobox|CommandInput" src`. Reuse it, or extend it with a prop,
   before creating another. A new picker goes in `src/components/<domain>/<thing>-combobox.jsx`. If two
   pickers need the same logic, extract a shared hook (for example `use-async-options.js` in `src/hooks/`) instead of copying it.
2. **Define the value contract first** and document it in a JSDoc line above the component:
   - What `value` is: an id (`internal_category_id`) or an object (`{ key, code, title }` for commodities).
   - What `onChange` receives: the full option object, or `null` to clear.
   - Map the value to the payload in the form's `toPayload`, not inside the picker. Commodity sends
     `category_key: value.key`. Internal category sends `internal_category_id`.
   - Compare ids as strings (`String(a) === String(b)`), because URL params and API ids differ in type.
   - When editing a record, the picker must show the saved value before any search runs. Seed it from the
     record (see `defaultsFrom` in `product-form.jsx`), or show "Loading…" while a lookup resolves.
3. **Async search mechanics** (copy them from `commodity-combobox.jsx`):
   - `useDebouncedValue(search.trim(), 300)` from `src/hooks/use-debounced-value.js`. Do not add lodash or a debounce package.
   - Fetch only while the popover is `open`. Use one `AbortController` per effect run and `abort()` in cleanup.
     Ignore `AbortError`. The service function must accept `options` and pass `signal` through to `fetch`.
   - Track `{ status: 'idle' | 'loading' | 'success' | 'error', items }`. Keep the previous items visible during a refresh if that helps.
     The reference file sets `loading` synchronously inside the effect, which raises oxlint's `set-state-in-effect`
     warning (part of the baseline). New code should avoid adding another one: store the query each result
     belongs to (`{ query, items }`), derive `loading` as `open && result.query !== debounced`, and only call
     `setState` in the promise callbacks.
   - Use `CommandItem value={String(option.key)}` (a unique id, never a label that may repeat) and stable React `key`s.
   - An empty query may show server-provided suggestions. Label that group honestly ("Common commodities"), not "Results".
4. **States:** loading uses `role="status"` with a spinner and text. Error uses `role="alert"` with an actionable
   message, and typing again retries. Empty uses `CommandEmpty` and echoes the query. Results show title plus code, with a muted hierarchy or secondary line.
5. **Accessibility and keyboard:**
   - The trigger is a `Button` with `role="combobox"`, `aria-expanded`, `type="button"` and `variant="outline"`.
     Spread extra props onto it so `FormControl` can inject `id`, `aria-describedby` and `aria-invalid`.
   - `CommandInput` gets an `aria-label`. The visible label belongs to the field (`FormLabel` / `Label htmlFor`).
   - cmdk provides arrow keys, Enter to select and Escape to close, and Radix returns focus to the trigger on
     close. Do not override `onKeyDown` in ways that break these.
   - Mark the selected option with a `Check` icon (`aria-hidden`), and make sure the text alone still identifies the option.
6. **Layout:** make the popover at least as wide as the trigger and never wider than the screen
   (`w-(--radix-popover-trigger-width) min-w-[min(20rem,calc(100vw-2rem))]`). The trigger and options wrap
   long text (`whitespace-normal break-words`) instead of truncating codes.

## Constraints

- Use only `ui/popover.jsx` + `ui/command.jsx`. Do not add react-select, downshift, MUI Autocomplete or another combobox library.
- Do not fetch inside render, fetch on every keystroke without the debounce, or let a slower old response overwrite a newer one.
- Do not show a code or title the server did not return. In particular, do not build UNSPSC labels from partial
  input (see `unspsc-classification`).
- Clearing must be possible where the field is optional (filters). Required form fields rely on validation, not on blocking the clear.

## Done when

- Keyboard only: Tab to the trigger, Enter or Space opens it, typing filters, arrows move, Enter selects, Escape closes,
  and focus returns to the trigger.
- With a fast typist, Network shows at most one request per pause, and stale requests are cancelled.
- Loading, error, empty and suggestion states can each be reached and read clearly.
- The edit form shows the saved selection immediately, and the submitted payload has the right id field.
- The picker fits at 320 px without horizontal scroll.

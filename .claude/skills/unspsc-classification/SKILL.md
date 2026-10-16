---
name: unspsc-classification
description: Rules for anything touching UNSPSC codes - commodity search, classification suggestions/recommendations, hierarchy display, ERP code previews, category filters or the UNSPSC explorer. Requires verifying the real server dataset and version first, forbids invented codes, and keeps search service, recommendation logic and UI separate. Use whenever a change reads, displays, suggests or saves a UNSPSC code or category_key.
---

# UNSPSC classification

UNSPSC codes drive the ERP item code and procurement reporting, so a wrong code is a data-integrity bug,
not a cosmetic one. The server's `categories` table is the **only** source of codes. Verified facts about
that dataset (size, levels, missing version, search behavior) are in
[`references/dataset-facts.md`](references/dataset-facts.md). Read it first.

Use `searchable-selectors` for picker mechanics and `product-registry-ux` for form layout and copy.

## Hard rules

1. **Never invent, guess, complete or "correct" a UNSPSC code or title.** Not in code, fixtures, examples,
   seed suggestions, UI copy, tests or PR text. Every code shown or saved must come from an API response
   (`/categories/commodities`, `/categories/search`, `/categories/{key}`, a product record) or be checked
   against the dataset (`references/dataset-facts.md` → *Re-verify*). Doc examples must be codes verified the same way.
2. **Do not claim a UNSPSC version** (for example "UNv260801"). The dataset has none recorded. If a feature needs one,
   stop and ask for it, and record the confirmed version in `dataset-facts.md` with its source.
3. **Save by `category_key`, display by `code`.** The payload sends `category_key`, and the server derives `unspsc_code`.
   Never parse a code out of a label string, and never send a code as a key.
4. **A product is classified at commodity level (level 3)** in the form. Higher-level keys are valid only as
   list *filters*. Rows with `key >= 9000000` are local additions: show them as such and do not present them as UNSPSC.
5. **Keep the three layers separate:**
   - *Search service* (`src/services/api.js`): transport only. It takes `q`/`options`, returns server data unchanged, and accepts `signal`.
   - *Recommendation logic* (pure functions in `src/lib/`, for example `src/lib/unspsc.js`): ranking, query
     building, "did you mean" or suggestion candidates. No React, no `fetch`. Input is user text plus
     server results, and output is a **subset or reordering of server results**. It never adds new codes.
   - *UI* (`src/components/products/commodity-combobox.jsx`, the details page hierarchy, the explorer): renders
     state and calls the other two. No ranking rules or code formatting inline beyond `commodityText`/`commodityLabel` in `lib/product.js`.
6. **Recommendations are suggestions.** The user must explicitly pick one. Label them as suggestions and show
   code, title and hierarchy so the choice can be checked. Never auto-select or auto-save a recommended code.

## Workflow

1. **Verify the dataset** for this change. Confirm the facts the feature relies on (level counts, field
   names, search semantics) still hold. Use the server repo, or a running API with
   `GET /api/categories/commodities?q=<code>`. If the server repo or API isn't available, say so and treat the
   facts file as possibly outdated.
2. **Map the touchpoints** with `rg -n "unspsc|commodit|category_key|getCommodities|searchCategories" src`.
   Today those are `commodity-combobox.jsx`, `product-form.jsx` (schema, `defaultsFrom`, `toPayload`, ERP preview),
   `product-filters.jsx`, `product-table.jsx`, `product-details-page.jsx`, `lib/product.js`, and the legacy
   `CategoryExplorerView.jsx` (`/categories`).
3. **Decide which layer the change belongs to** (rule 5), and keep it there.
4. **Work around search limits honestly.** Server search is one exact substring with no synonyms. Client-side options:
   help text with example terms, searching by code prefix, or the explorer's tree browse. Better matching
   (tokenized or multi-word search, keyword tables) is a **server** change. Propose it, and don't fake it in the
   client by fetching large result sets.
5. **Show the hierarchy** (segment › family › class › commodity) and the definition, where space allows, whenever a
   user confirms a classification. Use `relations`/`hierarchy` from the response and don't rebuild them from code digits.
6. **Verify** using the list below, then run `frontend-quality`.

## Done when

- Every code in the diff (source, tests, docs, PR body) traces to an API response or a re-verified dataset row.
- `rg -n "\b[1-9][0-9]{7}\b" <changed files>` only finds codes that were verified, each noted in the PR.
- Payloads still send `category_key`. The edit form shows the saved commodity before searching.
- Recommendation code is pure (no React or fetch imports) and returns only items from its input.
- No UI text claims a UNSPSC version, a match count or "best match" ranking the server doesn't provide.
- Open questions (version, keyword support, custom categories) are listed in the report.

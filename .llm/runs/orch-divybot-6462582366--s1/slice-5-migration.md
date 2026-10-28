# Slice 5: scaffold and design-route migration

Parent: adb1aa61792b7e174c78aa3cf03d54df6ea6ef13. Status: PASS. The same independent supervisor signs off after the single fix round; both substantive verdicts are recorded in slice-5-review.md.

## Shipped behavior

The generated app shell reads preset axes and font imports from token output. Root attributes are language (`data-theme`), light/dark (`data-scheme`), fixed geometry (`data-density`) and optional Studio `data-flavor`. The preference key remains ns-theme. The toggle changes scheme without replacing the language and still supports old light/dark hosts. The legacy token selectors remain intact, and NS One is still the default.

A static app-owned theme helper allowlists design-route preset queries against generated metadata. Normal app routes ignore the query. Each design render receives an immutable model built from that preset's output; no mutable server state or token build engine enters UI code. The token route consumes generated ramps rather than a six-name table. All gallery captions identify the active preset. Utility is shown through the documented development preview.

Button/input/card CSS binds typography, radius, border and motion to roles. New-language geometry uses component/control tokens; NS One retains its old dimensions. Shadows already consume generated roles. New-language badges use dedicated *-text roles, navigation captions retain the authored readable foreground without extra opacity, and specimen captions have neutral readable paint while the underlying swatch stays the authored color.

The design catalog's new theme metadata badges use muted presentation, avoiding18 copies of an inherited warning contrast defect. App-copy migration instructions explain fonts, attributes, semantic overrides and registry drift; the legacy selectors mean no ui:migrate step is needed.

## Gates and proof

- Freshly generated app: structured check of all routes/lib PASS, zero occurrences. Missing helper registration was caught and fixed before sign-off.
- CLI template/root tests:29 PASS. Existing catalog assertions now inspect runtime data rather than key quote style; the token layer assertion accepts formatting whitespace while requiring the same key/component.
- Fresh UI package suite:209 PASS in the migration pass; final complete rerun recorded separately.
- Structured source check/lint/format PASS. Browser Node project structured type-check PASS, seven files, using its own npm resolution (no-config/no-lock/manual modules) rather than inherited workspace settings. npm lock unchanged.
- Repository quality/architecture durable receipt PASS, exit0. Token-quality frozen receipt PASS, all72 inputs,903 names,4066 intended uses and406 exact exclusions. Neither gate was weakened.
- CLI and fresh-ui publish dry-runs PASS. Generated template registration includes the new helper.
- Pages parity: complete export inventory, snippets, accuracy, site build/render semantics,38777 links across236 HTML pages, and15 caveat markers/12 pages PASS.
- Full12-case browser capture PASS at390/1280 in light/dark for NS One tokens/components plus Utility tokens. Keyboard Enter/Space persists scheme without changing language. Generated font links and ramp counts match the output. Legacy selector colors match modern selectors. Sequential Utility/default/non-design/unknown requests prove preview scope and isolation.
- Utility's four cases have zero serious/critical findings and zero allowances. `axe-delta.md` lists every baseline change: only two removed light theme-kind warning badge findings. No other existing fingerprint changes, no new/increased serious/critical findings, and no rule/subtree exclusion.
- `tools/fresh-ui-browser/baselines/2026-10-28-s1/` contains12 full screenshots and provenance; original S0 baseline images remain unchanged. sourceDirty explicitly identifies the reviewed candidate on the recorded parent.
- `component-proof/` contains before/after button/input/card/badge specimens in light/dark: all8 pairs have identical dimensions and zero changed pixels. All144 sampled computed style values also match S0. Full gallery layout changes reflect the larger catalog, generated ramp order and metadata; this is not a whole-page pixel identity claim.

## Full runtime gate is unproven on this host

Ran exactly `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` once in one pass. Raw exit1; summary passed1/failed2/skipped0. Deno preflight passes, Aspire doctor exits1, and cleanup cannot inspect Docker because the daemon is unavailable. The suite stops before scaffold/runtime execution. No runtime success is claimed. This is the explicit host-prerequisite exception in the assignment, not a substitute gate or a product fix. The standard CI/runtime gate remains required and unchanged.

Read-only resource reporting found24 processes with unproven ownership; all are untouched. Docker containers/volumes/networks remain uninspectable. Harness-owned browser servers and the owned component comparison servers are stopped. Raw receipts/logs/resource identifiers stay private; this tracked evidence contains only sanitized outcomes.

## Independent review fix round

Round1 identified preset button specificity overriding size/icon variants. Fixed by lowering the root qualifier with :where, placing defaults before size classes, using the existing small height and keeping icon controls square with no padding/gap. The existing Utility mobile cases now measure28×28 and assert all four paddings/gap are0 in both schemes. The complete12-case capture, browser type-check and repository quality receipt pass again. Screenshots are regenerated, no axe allowances or NS One declarations changed. The same supervisor reviews this single fix round.

# Plan & Design — READY FOR REVIEW

## Scope and locked decisions

S7 phase 1 delivers static `/create/` in Design system and generated component documentation. Docs/frontend overlays; MCP retrieval is bounded tooling within its existing architecture (archetype 6). No new package public exports or dependencies. Existing doctrine layering remains; no new accepted architectural debt. JSR audit of planned boundary: no new exports, slow types, package dependency or API compatibility changes; generated carrier size and publish checks required.

1. Generate a compact catalog from registry metadata, S3 contracts and native deno doc JSON. Iterate every component/block item, deriving exports and typed example props. Provide focused fixture overrides for required rich values, with explicit unsupported host behavior. Reuse those fixtures as the preview and usage source; never show fabricated component anatomy. New registry entries are discovered without page-list changes; missing preview contracts fail visibly and freshness checks detect new inputs.
2. Build a static browser bundle under Fresh UI's Preact config using native Deno bundle. Import existing ns1_ codec. Generate preset CSS from shipped token artifacts, with isolated preview iframe, real registry components and native events. Only Utility style is enabled; the style table is the extension seam. Expose all 24 presets and Studio flavors; display locked effective accent/radius/font/density/menu values wherever resolver/registry do not support independent choices. Copy/share/import the valid code; validate untrusted query presets and show recoverable errors.
3. Generate HTML through Lume and let existing twin tooling emit agent Markdown. Add sidebar links and build-time freshness/coverage checks. Props come from deno doc, behavior/keyboard/tokens from S3; pages with no S3 record explicitly say so and use real implementation docs/CSS roles. Keep all twins within 12,288 bytes; split auxiliary reference details if needed, never silently truncate.
4. Feed generated pages through the full agent-docs → MCP corpus → assets barrel → publish chain. Add deterministic component routing using corpus-derived titles/paths, and regressions proving get_doc byte budget and find_guidance preference.
5. Fold #2410 regressions through real Vento rendering and Markdown serialization. Preserve author HTML; backtick spans become code in callout content; existing base-path canonicalization must remain idempotent.

## Commit slices

1. Static builder and registry-driven component pages: `tools/docs-site/fresh-ui/**`, `docs/site/design-system/**`, site build/navigation integration; prove catalog freshness, bundle, focused tests and build.
2. Agent retrieval and Markdown correctness: `docs/site/_plugins/**`, `packages/mcp/src/domain/docs/**` as needed, generated carriers; prove rendering regressions, retrieval tests, per-page budgets and carrier checks.
3. Final evidence and evaluator repairs: owned source fixes only, run artifacts; browser matrix and actual CLI init roundtrip, full required gates, independent implementation evaluation.

Every slice updates worklog/context-pack; separate evaluator performs substantive slice review before implementation sign-off. Draft PR starts with plan artifacts, no labels, Refs #2420 only, no session IDs. Stop at verified READY; Cockpit merges.

## Gates and risks

Required: docs/site build (includes rendered-output), site links, root docs:links/docs:accuracy/docs:snippets; check:agent-docs-prose/check:mcp-export-corpus/check:assets-barrel/check:publish-assets; release:preflight; scoped structured check/lint/fmt/tests; quality:gate and MCP JSR audit if framework source changes. `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; Docker unavailable means UNPROVEN, never PASS. Browser /create plus two component pages at mobile/desktop in both schemes. Copy code from built builder, invoke actual local init, compare installed preset CSS/resolved tokens and rendered UI.

Risks: fixed token axes (do not invent overrides); component fixture complexity (same fixture source for preview and example, meaningful interactions); browser global leakage (iframe isolation); new registry items (dynamic discovery and freshness negative control); corpus limits (assert actual UTF-8 bytes); baseline gate/environment failures (record exact unproven evidence); concurrent main changes (merge, never rebase/force-push).

Open-decision sweep: none requiring owner input. Exact fixture values and generator module boundaries are implementation choices. Deferred: other component styles, new token resolver axes, custom user code execution, server rendering, unsupported desktop capabilities, release publication. These exceed phase 1 or are not shipped.

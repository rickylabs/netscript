# Plan status: implementation blocked by required escalation

Two independent FAIL_PLAN verdicts are recorded in plan-eval-round1.md and plan-eval-round2.md. The narrow round-two grammar correction is applied below as proposed by the reviewer. **This is not an evaluator PASS.** Dispatcher leaf rules end the plan-evaluation loop after two FAIL_PLAN verdicts; no implementation began and no third review was requested. Owner/coordinator decision is required before code or another evaluation pass.

# Plan & Design — READY FOR REVIEW

Feature tier, dispatcher leaf profile. Tools-side generation/import/publication flow; Archetype 6 concerns, no published package.

## Locked decisions

1. Reuse public component/registry types and code-owned token identity validation. The tool takes a complete input snapshot and derives inventory; no component spec fork. The exact identity-only alias table is listed below. Unknown visual registry items fail, unmatched contracts are reported as deferred.
Token role lookup order is Scheme → Theme set → Density. `SF:` is a historical role namespace: strip it and bind **Theme set** explicitly, preserving cross-theme routing. Theme, Theme B, Studio flavor, Primitives and Base gray/accent are excluded as direct targets. Expand `/` segments with `|` alternatives and inclusive `N..M` ranges completely; every expansion must exist. When an alternative inside a segment is shorter than its first sibling and has no `-`, it replaces the final `-`-delimited suffix of that sibling. So `padding-x|y` becomes `padding-x` and `padding-y`, and `h2|h3|h4` and `size|line|tracking` stay whole-segment. Add `app-shell` as a positive control and keep `prose/h4/tracking` as the only expected strict failure on this baseline. The rule must be data-derived and must not fall back to a looser match. Current prose shorthand requires missing Theme set/prose/h4/tracking. **Strict full generation therefore fails before output on the current baseline.** Record that pre-existing S3/token defect; never add a fallback, omit the binding or edit its source. Explicit `--items` selection allows an independently validated current subset; it is never reported as full-library acceptance. The source-negative control and a full inventory audit expose this exact gap.

2. Generate deterministic structural component sets (anatomy, scoped data-attribute axes, full Cartesian variants over `attributes.values` only, token-role binding nodes), and HTML Code Connect source. Visual restyling stays S6. Preserve complete contract metadata without asserting planned values are implemented in Utility. Keep plannedValues/compatibilityValues as metadata; part-scoped dimensions remain set properties and templates place attributes on the declared part. No-attribute contracts produce a single native component, not a synthetic variant. Bounds: 1,024 variants/item and 8,192/library, above the current 720/item maximum and approximately 2.7k/all-contract total. Reject unsafe Figma variant delimiters before import.
3. Validate complete inputs and generated bundle before filesystem effects or native import. Import uses an isolated owned page, preflight native variable identities, rollback on runtime failure and inspect native structure/bindings on export. Never edit existing designed libraries.
4. Node URLs come from an import receipt tied to bundle content and exact set identities. Receipts carry figma-editor or fixture provenance. Publication output rejects fixture provenance; tests may request clearly marked dry-run output. Provenance is host-reported evidence, not cryptographic attestation: no claim that JSON alone proves editor execution. No generated mapping files are committed without real editor evidence. Use maintained `.figma.ts` templates with URL/source/component headers, the virtual `figma` module, `selectedInstance.getEnum` and `figma.code`; generated `figma.config.json` uses HTML/html. Generated virtual-module files are outside source wrapper scope; tests validate/execute them using a test adapter and never claim official CLI/editor proof. Publishing is the explicit owner-run `npx --yes --package @figma/code-connect figma connect publish`, never automatic; no repository dependency changes.
5. Independent read-only owner-selected Claude Opus 5.5/high performs PLAN-EVAL and IMPL-EVAL in separate sessions, with same-session resume across each pass's rounds. No inference from mock tests to live editor acceptance.

## Exact registry identity joins

These map registry item → contract, never anatomy or variant data:

- form-field → field (contract note: FormField compatible API; registry/components/ui/form-field.tsx).
- markdown → prose (copy-only prose provider; registry/components/ui/markdown.tsx).
- sidebar-shell → sidebar (contract render shell fixture; registry/components/ui/sidebar-shell.tsx).
- responsive-table → table (Utility table fixture; registry/components/ui/responsive-table.tsx).
- desktop-tray-menu → tray-menu (contract render fixture; registry/components/ui/desktop-tray-menu.tsx).
- desktop-window-chrome → window-chrome (contract render fixture; registry/components/ui/desktop-window-chrome.tsx).
- desktop-update-prompt → update-prompt (contract render fixture; registry/components/ui/desktop-update-prompt.tsx).

Reject stale overrides, unknown targets and duplicate logical/source mappings. List every unmatched contract in derived coverage, including the current 22 shipped runtime-only contracts; do not turn them into fake registry items.

## Slices

1. Contracts, inventory/token joins, deterministic generation and negative-control fixtures: `tools/figma-component-library/src/{contract,validate-contract,inventory,token-bindings,generate,validate-library}.ts`, tests and run evidence. Gate: structured scoped static/test wrappers; independent slice review.
2. Native import/export, separate plugin entry/build, Code Connect publication, CLI and docs, explicit CI workflow. Files: src/{figma-port,import-library,export-library,code-connect,publication,default-sources}.ts; plugin/{main,ui}.ts; plugin/ui.html; manifest.json; build.ts; cli.ts; ci.ts; lint.deno.json; README.md; tests/{native,connect,command,bundle}_test.ts and mock-figma.ts; .github/workflows/figma-component-library.yml (under 30 files including run updates by keeping evidence updates in existing files). figma.config.json is generated only, not an authoring input. Gate: complete unit CI wrappers/build, existing figma CI, release preflight, docs accuracy, applicable quality/architecture, full CLI E2E attempt; independent IMPL-EVAL.

## Risks and mitigation

- Naming drift: strict identity joins, stale aliases fail, current inventory coverage test.
- Unbounded variants: finite per-set/whole-library limits fail before effects.
- Figma partial writes: whole-bundle/native-variable preflight, isolated staging page and rollback.
- Stale/tampered bundle or receipt: semantic regeneration comparison and native structural audit.
- Active S3: no edits to S3 or token/plugin-owned source, coverage reconciliation explicitly remains due after merge.

## Open decisions

Round-one decisions above now resolve token gaps, alias joins, variant limits, receipt provenance and template API before code. Live host plan limits/fonts/publication permissions are safe to defer as explicit UNPROVEN native acceptance.

## Gates

Structured scoped check/test/lint/fmt; generation round trip and coverage/malformed negative controls; separate browser plugin bundle; code quality and architecture scan; existing figma CI; release preflight/docs accuracy; full CLI E2E attempt (environment failures recorded UNPROVEN); independent review. New dedicated CI checks the tool because root wrappers exclude tools.

## Deferred scope / debt

#2418/#2412 retain S3-dependent inventory reconciliation, native editor/MCP and publication acceptance. #2559 owns token/preset/plugin surface; #2574 guidance; #2573 S7; #2453 separate dispatch; S6 owns visual restyling. No new architectural debt planned. Dedicated standalone workflow is intentional to keep the existing plugin/quality entry untouched. It is an explicit additional readiness condition: READY waits for its `figma-component-library` check as well as required checks. CLI entrypoints use `deno run`; root deno.json is unchanged. S6 is #2419.

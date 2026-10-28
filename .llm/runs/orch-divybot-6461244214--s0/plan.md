# Plan & Design — READY FOR REVIEW

Deliver issue #2413 in one PR from main. PLAN-EVAL is explicitly selected by the owner and must PASS before implementation.

## Locked decisions

1. Pin Style Dictionary 5.7.1; update the existing private lock through Deno, without deleting locks/caches or reloading. Confirm frozen rebuild and inspect all generated diffs.
2. Make token checking compare generated output without silently repairing committed-artifact edits. Prove this with a restored negative control.
3. Use standard Playwright Test with Chromium and axe, isolated under `tools/fresh-ui-browser/` with a pinned npm lock. Generate a real local-source scaffold without database, service or Aspire for the browser job. Playwright owns the dev server lifecycle. No handwritten substitute pages. The existing `fresh-browser` lane uses @playwright/cli for runtime interaction probes; use Playwright Test here because its matrix projects, screenshot attachments, isolated contexts and axe integration directly serve reusable evidence capture. Keep this gate named `fresh-ui-browser`, distinct from `fresh-browser`, and drive it from the existing `freshUi` classifier flag.
4. Default routes are `/design/tokens` and `/design/components`; both themes and 390/1280 widths produce eight full-page screenshots. Deterministic rendering waits for fonts/hydration, disables animations and selects the actual document theme. S0 captures and uploads screenshots; pixel differences do not fail this PR. Commit dated before PNGs captured on Linux with the pinned Chromium version, and record their environment separately from CI-generated screenshots. There is no diff tolerance because S0 does not compare pixels. Future slices reuse the capture command for before/after review; any later pixel gate must establish baselines in the exact CI image. Baseline changes require an explicit capture/update command and a reviewed PNG diff; normal tests never rewrite the committed baseline. Expose app-directory, external base URL, routes and artifact-directory configuration for later slices.
5. Axe scans the entire page without disabling rules or excluding DOM. Existing serious/critical findings are recorded as an exact multiset of rule/impact/target fingerprints for each route/theme/width. CI requires exact equality: new/increased findings and stale/decreased allowances both fail until a reviewed baseline change. Custom routes have zero allowances. Strict mode enforces zero findings. Full reports retain all impacts. Record engine/browser provenance and existing accessibility debt: contrast belongs to tokens v2, desktop menu semantics to the component slice. Keyboard smoke proves Tab/Enter/Space and persistence. Prove new-rule, new-target-under-known-rule, duplicate-node and stale-allowance controls through the same validator; a real unnamed-button injection must fail the browser gate.
6. Preserve workflow quality gates, add structured-wrapper package tests and tokens:check, add a browser job and upload screenshots/reports on success or failure. Trigger/classify harness changes explicitly, plus `packages/cli/src/kernel/assets/app/**`, `packages/cli/src/kernel/assets/embedded.generated.ts`, `packages/cli/src/kernel/assets/publish-assets.generated.ts`, and `packages/fresh/**`, since scaffold routes, layout/chrome and Fresh runtime can change gallery rendering. Both workflow event path lists stay identical.

## Slices

1. Plan and evaluation bootstrap; draft PR.
2. Token pipeline: `packages/fresh-ui/{scripts/build-tokens.ts,deno.json,deno.lock,registry/theme/*}`, optional check script and focused regression. Gates: frozen tokens:build, tokens:check, negative control, package tests, scoped wrappers, quality/architecture, dependency explanation. Independent slice review before sign-off.
3. Browser harness and CI: `tools/fresh-ui-browser/**`, workflow, classifier/tests, gate catalog if required, README. Gates: real scaffold browser matrix, baseline, axe negative control, keyboard, workflow regression, scoped wrappers; conditionally `check:assets-barrel` and `check:publish-assets` after any scaffold template correction. Independent IMPL-EVAL and full scaffold.runtime merge-readiness pass.
4. Evidence and READY: record exact commands/exits, CI run/artifact links, final evaluation, lesson notes and final delivery handoff.

## Gates

Structured check/test/lint/fmt wrappers on changed TypeScript; fresh-ui package check/lint/tests; frozen token build/check; quality:gate (quality scan + architecture); existing frozen-lock/workflow regression and classifier tests; JSR audit/dry-run for package surface; eight Chromium screenshots with axe and keyboard; full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` before claiming merge readiness. Unavailable gates are recorded unproven, never green by assumption.

## Risks and mitigations

- Duration transform change: inspect CSS/JSON output and explain either exact diff or byte-identical result.
- Scaffold hidden service dependency: run a genuine no-service dashboard and verify route responses and browser console.
- Existing accessibility failures: record the exact reviewed S0 fingerprint baseline and debt inventory; later slices fix the underlying theme/component issues and lower allowances.
- Screenshot platform differences: capture before baselines on Linux Chromium, pin browser/tool versions and document controlled updates.
- CI capacity/environment: obtain actual run/artifact evidence while doing independent verification; do not claim queued work passed.

## Open decisions

No implementation-blocking decisions remain. Exact accessibility repairs, if required by real-browser evidence, are safe to defer to the browser slice and must be documented before editing.

## Deferred scope / debt

Tokens v2, redesign, docs theme changes, backend behavior, merges and publication are excluded. No new architecture debt is accepted. Existing accessibility debt is recorded in `axe-baseline.json` with owners by epic slice. Keep any pre-existing gate failure explicit.

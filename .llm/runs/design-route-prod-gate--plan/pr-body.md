## Summary

Makes the scaffolded `/design` reference developer-only through two independent controls: Fresh
omits the `(design)` route group from production builds, while route-group middleware refuses every
runtime mode except literal `development`. The hosted gate proves the production exclusion is
non-vacuous by planting the route back, observing the build detector fail, restoring the Vite rule,
and rebuilding successfully.

## Scope

- Archetype / area: Archetype 6 CLI/tooling + frontend overlay · `packages/cli` scaffold assets and CLI E2E
- Closes #1481
- Closes #1971

## Slices

- [x] Plan and separately evaluate the dual-exclusion design — plan `f8ed75b41`, `PASS_PLAN` at `5566a89f6`
- [x] Implement fail-safe middleware, manifest/load/write plumbing, and production Vite exclusion — `0fd04af6d`
- [x] Regenerate the embedded template barrel with the canonical generator — `0c1778026`
- [x] Register the post-`DATABASE_CODEGEN` mutation-proved hosted gate and preserve service-client order — `de4d31b69`
- [x] Integrate #1971/#1958 and current main without replacing shared probes — merge heads through `5243a19f9`
- [x] Complete scoped validation and independent IMPL-EVAL — evidence head `456abefbd`; `IMPL_EVAL_VERDICT: PASS`

## Acceptance

- [x] Production route discovery excludes `(design)`, and the independent middleware refuses all modes other than literal `development`.
- [x] `scaffold.design-production-exclusion` executes after `DATABASE_CODEGEN` and proves clean build, planted-route rejection, restoration, and restored build in both hosted database tiers.
- [x] Development `/design/composition` remains covered by the canonical app-reference runtime probe.
- [x] The #1971 Zod mapping correction remains buildable after database codegen, with no skip or xfail.
- [x] Current main's canonical resource/browser probes coexist with the design gate at the final product head.

## Validation

- Exact hosted-runtime product/evidence head: `456abefbdfa4a06de15c1a64b3e5f4a68751e769`
- Structured CLI check: exit `0`; 1,004 files, 9/9 batches, 0 diagnostics
- Focused structured tests: exit `0`; 115 passed / 0 failed across seven design/writer/order/resource/suite contracts
- Scoped structured lint and format: exit `0`; 14/14 authored TypeScript files across the original
  product delta and D-5 integration assertion, 0 findings
- `quality:gate` and explicit `arch:check`: exit `0`; no new finding or debt
- `check:assets-barrel`, `check:aspire-version-parity`, `check:publish-assets`, `check:mcp-export-corpus`, and `check:agent-docs-prose`: exit `0`; generated carriers fresh
- Hosted [`e2e-cli` run 33744551964](https://github.com/rickylabs/netscript/actions/runs/33744551964): success at exact head `456abefbd`
  - [PostgreSQL job 100614048124](https://github.com/rickylabs/netscript/actions/runs/33744551964/job/100614048124): 104 passed / 0 failed; design clean/mutation/restored `true/true/true`; canonical app-reference and island probes passed
  - [SQLite/Garnet job 100614048210](https://github.com/rickylabs/netscript/actions/runs/33744551964/job/100614048210): 99 passed / 0 failed; design clean/mutation/restored `true/true/true`; canonical app-reference and island probes passed
- Independent cycle-2 IMPL-EVAL: `PASS` for the owned delta at `91a1ee897`; the three #1958 shared intersections were then verified proportionally at the integrated head with the exact-head gates above
- Post-runtime integration assertion: core run `33744526413` exposed one stale #1958 codegen→client adjacency expectation (5,260 passed / 1 failed / 14 ignored); D-5's test-only correction now passes the focused set 115/115 and does not change runtime product source
- Lock hygiene: no `deno.lock` delta; no local `e2e:cli`, Aspire, Docker, or browser runtime

```acceptance-evidence
issue: 1481
entries:
  - box: "`/design` is absent from a production build of a scaffolded app, or is gated behind an explicit opt-in"
    evidence: "Hosted e2e-cli run 33744551964 at 456abefbd: PostgreSQL job 100614048124 and SQLite/Garnet job 100614048210 both pass scaffold.design-production-exclusion; each artifact reports cleanProductionBuild=true"
  - box: "gate: an e2e assertion that a production build contains no `(design)` route output"
    evidence: "Hosted jobs 100614048124 and 100614048210: scaffold.design-production-exclusion passes with cleanProductionBuild=true, plantedRouteRejected=true, restoredProductionBuild=true"
  - box: "the chosen mechanism matches RFC 0005 §5's dual-exclusion posture, or the divergence is recorded"
    evidence: "Independent IMPL-EVAL PASS in .llm/runs/design-route-prod-gate--plan/evaluate.md; Vite structural ignore plus fail-closed route middleware are independent and no RFC divergence remains"
```

```acceptance-evidence
issue: 1971
entries:
  - box: "A fresh local-source SQLite scaffold completes standalone `database.codegen` and then `deno task build` with exit 0."
    evidence: "PR #1974 exact clean init/build/codegen/build exits 0/0/0/0; exact-head SQLite/Garnet job 100614048210 passes database.codegen then scaffold.design-production-exclusion's production builds"
  - box: "The app-level `zod` mapping obeys the npm-only catalog law while remaining resolvable by Fresh/Vite production builds."
    evidence: "PR #1974 merged as 953b0849c with explicit npm:zod mapping; exact-head PostgreSQL job 100614048124 and SQLite/Garnet job 100614048210 both pass the post-codegen production-build gate"
  - box: "Regression coverage proves the post-codegen production build and fails on the current `\"zod\": \"catalog:\"` mapping."
    evidence: "PR #1974 RED commit 0fa3f6e56 and GREEN a6b5d03e1; final hosted run 33744551964 proves the corrected mapping in both database tiers"
  - box: "PR #1945's `scaffold.design-production-exclusion` remains after `DATABASE_CODEGEN` and passes without a skip or xfail."
    evidence: "Focused order tests pass 115/115; exact-head jobs 100614048124 and 100614048210 run database.codegen immediately before the passing scaffold.design-production-exclusion gate; no skip/xfail in the delta"
```

## Harness

- Run dir: `.llm/runs/design-route-prod-gate--plan/`
- PLAN-EVAL: `PASS_PLAN` for `f8ed75b41`
- IMPL-EVAL cycle 1: `FAIL_FIX` on premature gate order, closed by `de4d31b69`
- IMPL-EVAL cycle 2: `PASS` from isolated GLM 5.3 Flash max via the checked-in OpenRouter transport
- Final integration review: the three shared #1958 files retain both contracts; the only post-runtime source delta is D-5's proportional resource-order assertion correction, with no product/runtime change

## Drift / Debt

- Recorded bounded drift covers the required suite selector, order assertions preserving the #1481 insertion point, the superseded shared-probe diagnostic, and coordinator ownership handoff to #1958.
- #1971 was repaired by merged PR #1974 and is closed here only after this PR's exact-head hosted post-codegen build proof.
- No new or deepened architecture debt; existing `scaffold-runtime-a8-f16-1333` is not deepened.

## Definition of Done

- [x] A default production build contains no `(design)` route-module output, with a mutation proving the detector fails when the route is planted back.
- [x] The `(design)` route middleware refuses all runtime modes other than literal development.
- [x] Development `/design/composition` remains reachable in the hosted runtime probe.
- [x] Embedded template assets are regenerated through the canonical generator and pass freshness checking.
- [x] Required scoped check/test/lint/fmt, quality, doctrine, carrier, and both hosted runtime tiers pass.
- [x] Separate-session IMPL-EVAL returns `PASS`, the prior finding is closed, and proportional integration review finds no new source issue.
- [x] Close-gated acceptance for #1481 and #1971 is completely mapped to linked evidence.

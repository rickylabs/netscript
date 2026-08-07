# Context pack: Canary.15 W1-B

## Objective

One PR directly to `main` closes #1328's scaffold-owned quality implementation and #1024's five
already-completed agent-tool criteria. The publication-dependent installed-consumer observation is
owned by follow-up #1343 in milestone 0.0.6. W1-B is a generated-contract/lifecycle repair plus
proving tests, not a release or whole-scaffold inventory.

## State to preserve

- Base/current main: `7af6d1c02ab3f380dde7354ebac190e67d363db0`.
- Branch: `fix/scaffold-owned-quality-gates`, explicit push refspec only, no upstream.
- Sole writer: Codex thread `019fdb07-deb8-7971-80aa-d02fb6b56c37`.
- `deno.lock`, every foreign/quarantined worktree, and old `ns004-agenttools` are protected.
- #1092's exact eight installed agent tools and symptom-led docs are shipped behavior, not a design
  opening.

## Current defect

Generated root `check` uses three `.ts` shell globs and misses TSX, plugins, background runtimes,
and AppHost/helper `.mts`; bare lint/fmt are too broad. The runtime E2E generates registries but has
no negative selection proof. A fresh diagnostic found five product lint and four format defects.

## Locked approach

- Always generate a dependency-free `.netscript` quality runner.
- Generated tasks invoke modes for check, lint, format-check, and format-write—no shell globs and no
  optional `.llm/tools` dependency.
- Select apps, services, contracts, plugins, workers, sagas, triggers, streams, AppHost/helpers, and
  other scaffold-owned TypeScript source; exclude dependency caches, offline agent/docs bundles, and
  direct machine-output lint/fmt targets.
- Check reaches runtime-generated registries/clients through imports; it may not false-green because
  executable source is excluded by project config.
- E2E injects one deliberate bad fixture per owned surface, including app TSX and AppHost/helper
  MTS, then proves cleanup and a final green check/lint/format-check.
- Fix generator sources responsible for inherent output findings.
- Preserve #1092's completed five-criterion #1024 contract; #1343 separately owns the later
  exact-canary installed-consumer observation outside any checkout.

## Evaluation risks

1. The selection matrix could miss an AppHost-executed helper or incorrectly lint machine output.
2. Passing explicit paths while root `exclude` still suppresses them would recreate the issue's
   excluded-file exit-0 trap.
3. The negative matrix could be costly or destructive unless fixtures are serial and precisely
   owned.
4. Reusing optional agent tools would make normal scaffolds incomplete; expanding the eight-tool
   bundle would regress #1092's explicit boundary.
5. Clone-independent smoke evidence must use the installed released path, not a local CLI fallback.

## PLAN-EVAL result

Independent session `017613f0-c5be-4738-b59c-0bf540202686` returned PASS on exact head
`045ca6c3262c854f830b428e871ef9ed8730ba10` using the canonical Minimax M3 high route. The tracked
distillation is `plan-eval.md`; all seven advisories are incorporated into `worklog.md`'s mandatory
Design checkpoint. Do not rerun PLAN-EVAL.

The verdict/Design commit is `9ac85e921`; its explicit-refspec push and structured PR comment are
complete. The formal lifecycle later advanced through implementation evaluation without rerunning
PLAN-EVAL.

## Implementation state

- Slice 1: `80a5dc07b`, trail `10a9287ec`, comment `#issuecomment-5214270787`.
- Slice 2: `1ab303975`, trail `760d5f1ad`, comment `#issuecomment-5214946644`.
- Slice 3 implementation: `21dd6a6c0`; merge-readiness repairs: `f3a4d5d2e` and `3512e1dc4`.
- Current-source focused tests: 122 passed / 140 steps / 0 failed.
- Scoped repository wrappers: check 1,197 files / 10 batches / 0 diagnostics; lint 1,197 / 6 /
  0 findings; format 1,197 / 6 / 0 findings.
- Quality/doctrine gate, CLI doc-lint, asset freshness, and CLI publish dry-run: exit 0 (existing
  warnings only).
- Canonical current-head `scaffold.runtime`: 76 passed / 0 failed, including ten deliberate owned
  surface failures, restored green generated quality, Aspire/database/plugin/behavior/telemetry,
  and cleanup.
- Final leak-check: exit 0, no run-owned survivors; foreign/unproven resources untouched.
- Root `deno.lock` remains untouched and absent from the base-to-head diff.

## Independent IMPL-EVAL

Separate session `49e6c09a-705b-47e4-9598-9b45f932c210` returned **PASS** on immutable head
`a02467d8cd28be215855764d163fb60508afe895` through the mandated Claude Code/OpenRouter
`deepseek/deepseek-v4-flash-0731` max route. It found no current-head implementation defects,
independently verified `scaffold.runtime` at 76/0, and ran scoped check/lint/format over 1,195 files
with zero diagnostics/findings. The tracked verdict is `evaluate.md`.

## Owner rescope and lifecycle reconciliation — 2026-08-07

The owner superseded the deferred-release block: the publication-dependent installed-consumer
observation moved from #1024 to focused follow-up #1343 in milestone 0.0.6. #1024 now contains
exactly its five completed acceptance criteria plus a non-checkbox Follow-up link. PR #1342 now uses
`Closes #1024`, `Closes #1328`, and `Refs #1343`; its completed checklists cover only current W1-B
scope and its evidence maps #1024 box indices 1–5 plus all eight #1328 boxes. It states explicitly
that the external published smoke has not run and is not this PR's merge blocker.

The immutable implementation head `a02467d8cd28be215855764d163fb60508afe895` retains the valid
DeepSeek V4 Flash 0731 max IMPL-EVAL PASS from separate session
`49e6c09a-705b-47e4-9598-9b45f932c210`; no evaluator was rerun. The remaining workflow is
lifecycle-only: advance PR #1342 and issues #1024/#1328 to exactly `status:impl-eval`, run the live
acceptance-evidence mirror dry-run, and mark the PR ready only on a green verdict. Do not merge,
publish, trigger OpenHands, start Billing Run, or alter release order.

## Post-eval current-head CI repair — scaffold-static

Ready-head CI run [31173542921](https://github.com/rickylabs/netscript/actions/runs/31173542921),
job [92850482166](https://github.com/rickylabs/netscript/actions/runs/31173542921/job/92850482166),
exposed one genuine `scaffold-static (deno-only)` defect. The clean-clone README scaffold selected
85 files and reported TS2339 because `routes.examples.crud` is already a
`RouteReference<EmptySegment, SearchParamInput>` and therefore has no `$route` property. `deno doc`
confirmed `createRouteReference()` returns the complete reference consumed directly by
`definePage().withRoute(...)`.

The owning CRUD route template now passes `routes.examples.crud` directly, its semantic assertion
locks that shape, and the embedded asset is regenerated. Focused proof is green: route-template test
1/1 with 19/19 steps; exact formerly failing clean-clone gate exit 0; two-file scoped check/lint/fmt
each exit 0 with zero findings; `quality:gate` exit 0 with existing warnings only; asset freshness
exit 0. The full `scaffold.runtime`, PLAN-EVAL, and IMPL-EVAL were deliberately not repeated.

Per owner pace rule, immutable head `a02467d8cd28be215855764d163fb60508afe895` retains its valid
DeepSeek PASS. This focused product change is a current-head CI repair with new focused receipts,
not a claim that the formal evaluator assessed the new head. Keep PR #1342 ready and exactly
`status:impl-eval`; #1343 remains non-blocking follow-up scope.

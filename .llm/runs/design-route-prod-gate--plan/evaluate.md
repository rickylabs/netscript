# IMPL-EVAL Cycle 2 — `/design` production exclusion (delta evaluation)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Target | PR #1945 — issues #1481 and #1971 (owned `packages/cli` delta + run artifacts) |
| Archetype | 6 — CLI / Tooling (frontend overlay) |
| Scope overlays | Frontend |
| Evaluated product head | `91a1ee89746d48422e73e41e5b9b677b8e0a439e` (`fix/design-route-prod-gate`) |
| Evaluated evidence head | `91a1ee89746d48422e73e41e5b9b677b8e0a439e` |
| Baseline | `origin/main` `94fe507af47171cd4f295e8f532b281d7147b334` (fetched during this session) |
| Product-diff merge base | `e14322c51` (#1956) |
| Cycle | 2 of 2 (two-failure eval loop consumed; any further failure escalates) |

## Requested and observed evaluator identity

| Field | Requested | Observed |
| --- | --- | --- |
| Provider | OpenRouter (open-model relay, never Claude/GPT/Gemini) | OpenRouter — JSONL attested upstream provider GMICloud during the audit and Parasail on finalization |
| Model | `z-ai/glm-5.3-flash` (IMPL-EVAL lane per `lane-policy.md`, sanctioned escalation) | `z-ai/glm-5.3-flash` |
| Effort | max (highest effort per coordinator ruling) | max (real reasoning trace; genuine agentic turn per `evaluator/protocol.md` D-4) |
| Transport | Fresh isolated evaluator session via the checked-in `agentic:claude-openrouter` wrapper (credential read privately; key never in transcript) | Same |

Fresh-session statement: this is a brand-new, separate session from both the generator
(`01a06322-7bb5-7d80-badf-3068fb4942eb`) and the prior IMPL-EVAL session. It inherited no
implementation-session context and wrote only this file. Session separation invariant honored.

## Cycle 1 preservation (prior verdict)

The prior separate-session IMPL-EVAL at `d2a5e167f` returned **FAIL_FIX** (OpenHands
`z-ai/glm-5.3-flash`, run `33696765169`, verdict artifact at
`.llm/runs/impl-eval-1481--openhands-33696765169-1/evaluate.md`, PR comment `5518750686`). Its sole
HIGH finding — `scaffold.design-production-exclusion` ran before `DATABASE_CODEGEN`, so the
production Vite build failed on missing generated Zod barrels — is preserved here verbatim as
cycle 1. It is not erased, reinterpreted, or re-counted. It is **closed**: commit `de4d31b69`
moved the gate after `DATABASE_CODEGEN` (comment in `capability-suites.ts` names the Zod reason),
and the focused order assertions in `suite-registry_test.ts` +
`service-client-runtime-probe_test.ts` now explicitly require `DATABASE_CODEGEN` →
`SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` → `GENERATED_SERVICE_CLIENT_CONTRACT` in the runtime suite.
Hosted run `33731627085` proves the reordered gate reaches and passes (SQLite job
`100572750365`: gate `PASSED 83322ms`, immediately after `database.codegen` and before
`generated.service-client-contract`).

## Baseline and product-diff audit

- Checkout: isolated evaluator worktree `/home/agent/projects/netscript/worktrees/007-eval-1945`, HEAD `91a1ee897` (equals `origin/fix/design-route-prod-gate`).
- `git diff d813df7ca..91a1ee897 -- packages/cli` → **0 bytes** (the later shared-probe diagnostic was fully backed out; no shared-probe source delta remains).
- Owned delta (`git diff origin/main...HEAD`) is exactly **16 `packages/cli` files + 11 run-dir files**, all inside the authorized scope. Verified line-by-line: scaffold mechanism (vite template ignore rule, `_middleware.ts.template` + manifest/load/write plumbing), E2E gate registration/probe, suite selector, four test files, and the generator-regenerated `embedded.generated.ts`.
- `deno.lock` / `packages/cli/deno.lock` / `packages/cli/e2e/deno.lock`: **no delta** vs `origin/main`, and the working tree is clean after every command. No lock churn.
- No `Deno.lock`-relevant, cross-package, public-CLI-surface, or shared browser-probe change exists. `deno.json` exports, `mod.ts`, binaries, command names, and public types are untouched.
- Hosted-state cross-check: PR #1945 open, non-draft, `status:blocked`, head `91a1ee897`, milestone `0.0.7`; PR #1958 is **merged** to main at `2f43fa7f3` (this session's freshest fact — evaluated against main `94fe507af`; #1945's exact-head integration is not yet pushed).

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` = `PASS_PLAN` for plan head `f8ed75b41`, evaluator receipt `5566a89f6` |
| Design section in worklog | PASS | `worklog.md` `## Design` (surface, vocabulary, ports, constants, slices, deferred scope, contributor path) |
| Commit slices match design plan | PASS | PR commit trail: RED `2754616b4` → hosted-RED record `5277a4c17` → GREEN `0fd04af6d` → barrel `0c1778026` → order repair `de4d31b69` → #1971 handoff `1a777a0b3` → integration `d813df7ca` → backing-out `91a1ee897` |
| Each slice has a passing gate | PASS | Worklog gate table + hosted receipts below |
| No speculative seams | PASS | Delta adds one template + tests/probe wiring only; every file reachable from surface/tests; no dead files |
| Constants for finite vocabularies | PASS | `GATE.SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION`; probe constants (`DESIGN_IGNORE_RULE`, `DESIGN_ROUTE_SOURCE_PATH`, `DESIGN_ROUTE_MARKER`) co-located at use sites, not globbed |

## Independent local validation bar (this session, exact commands/exits)

All commands run in the isolated worktree with worktree-local executable `TMPDIR`
(`.llm/tmp/eval-1945/tmpdir`) and pinned `mise exec -- deno 2.9.5`. No Aspire, Docker, browser,
`e2e:cli`, or hosted runtime ran locally. No product file was modified.

| # | Command | Files / tests | Exit |
| --- | --- | --- | --- |
| 1 | `deno task check:assets-barrel` (generator + git diff) | 7 generated carriers | **0** |
| 2 | `run-deno-test.ts -- --allow-all` over the six owned test files (`route-templates_test.ts`, `generators-config_test.ts`, `public-command-tree_test.ts`, `scaffold-gates_test.ts`, `service-client-runtime-probe_test.ts`, `suite-registry_test.ts`) | **112 passed / 0 failed** | **0** |
| 3 | `run-deno-check.ts --root packages/cli --ext ts,tsx --exclude '^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)'` | 1001 files, 9/9 batches, 0 diagnostics | **0** |
| 4 | `run-deno-lint.ts` (standalone scoped config mirroring root rules, 13 authored TS delta files) | 13/13 processed, 0 findings | **0** |
| 5 | `run-deno-fmt.ts --check` (same 13 files) | 13/13 processed, 0 findings | **0** |
| 6 | `deno task quality:gate` (quality:scan + arch:check) | 0 ERROR, 91 WARN (all pre-existing repo-wide, zero naming any delta file) | **0** |
| 7 | Explicit `deno task arch:check` | 0 ERROR, existing warnings only | **0** |
| 8 | Lock/worktree hygiene re-check | `git diff origin/main -- deno.lock packages/cli/deno.lock packages/cli/e2e/deno.lock` = 0 bytes; `git status --short` clean | **0** |

Notes recorded for honesty: `rtk` is absent in this environment (used plain commands); a
`--root packages/cli`-combined `--file` invocation of the lint wrapper selects the whole package and
surfaces pre-existing findings (61) on files outside this delta — re-run scoped to exactly the 13
authored files, it is clean; the root workspace intentionally excludes `packages/cli/` from lint/fmt,
so a standalone config faithful to the root's rule/fmt settings was used for the scoped run.

## Adversarial review of the owned implementation

| # | Question | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `/design` is a developer-only scaffold surface | CONFIRMED | `plan.md` decision with five evidence rows (`research.md` F1–F5); issue #1481 explicitly deferred that question; PLAN-EVAL `PASS_PLAN` ratified the ruling |
| 2 | Structural exclusion is independent | CONFIRMED | `vite.config.ts.template` passes `ignore: mode === 'development' ? [] : [DESIGN_ROUTE_GROUP_PATTERN]` to `fresh(...)`; signal is Vite build `mode`, keyed on `mode !== 'development'` polarity, never on the runtime middleware |
| 3 | Runtime refusal is independent | CONFIRMED | `_middleware.ts.template` reads `Deno.env.get('MODE') ?? Deno.env.get('NODE_ENV')` and returns 404 without `ctx.next()` for anything other than literal `development` (unset/misspelled/staging/test/production all refuse — RFC H-4 fail-closed polarity, no `?? 'development'` default) |
| 4 | Manifest/load/write plumbing + canonical barrel | CONFIRMED | `TEMPLATE_KEYS.appRoutesDesignMiddleware` in `assets/manifest.ts`; `appDesignMiddlewareTemplate` in `scaffold-template-assets.ts` + `write-app-files.ts` (`_middleware.ts` emitted into `designRoutesDir`); `embedded.generated.ts` contains the middleware entry and was regenerated through `gen:assets-barrel`, never hand-edited (freshness check exit 0 this session) |
| 5 | Gate non-vacuous and ordered | CONFIRMED | Probe does clean build → walk `_fresh` for `(design)` path/route-marker evidence → plant `ignore: []` (with exact-one-match guard) → rebuild → require detector failure → restore in `finally` → final clean build + assertion; registered in `RUNTIME_GATES` after `DATABASE_CODEGEN` and before `GENERATED_SERVICE_CLIENT_CONTRACT`; registration/command/cwd assertions in `scaffold-gates_test.ts`; no skip/xfail anywhere in the delta |
| 6 | Cross-feature order repair | CONFIRMED | `service-client-runtime-probe_test.ts` now asserts service-suite codegen→client adjacency **plus** runtime codegen→design-exclusion→client-contract; service adjacency explicitly preserved |
| 7 | No public API / unrelated behavior change | CONFIRMED | Diff confined to 16 `packages/cli` files; no public exports, command surface, runtime behavior, or shared-probe patch remains; `public-command-tree_test.ts` asserts the middleware file materializes |
| 8 | Cycle-1 finding closed | CONFIRMED | `de4d31b69` + focused order assertions + hosted proof (below) |

Anti-patterns (scoped to touched surfaces): AP-1 CLEAR (probe file 296 LOC < 500 cap; gate file 69 LOC), AP-11/AP-25 CLEAR (middleware is an application edge in generated app, env read is the intended pattern), AP-18 CLEAR (semantic marker/path assertions, not snapshots), AP-21/AP-22 CLEAR (extended existing `generated-quality` gate family; no new barrel or directory child), AP-13 CLEAR (no console in commands; probe's `console.log` is command output in a gate probe, matching the existing file's shape). Others N/A (no base classes, helpers, barrels, folders, or public types introduced).

## Hosted receipt audit (read-only, `gh api`)

| Receipt | Head | Product equivalence | Result |
| --- | --- | --- | --- |
| Run `33715250068`, jobs `100523051743` (PG) + `100523052025` (SQLite) at `98699f4bd` | exact earlier head of this branch | Both `scaffold.design-production-exclusion` and `behavior.app-reference` PASSED (SQLite log: 96 PASSED / 0 FAILED) | **PASS both tiers** |
| Run `33731627085`, job `100572750365` (SQLite) at `d813df7ca` | product-equivalent head (branch minus the backed-out diagnostic) | `scaffold.design-production-exclusion` PASSED (83322ms) immediately after `database.codegen`; sole failure is retired `behavior.app-reference` `/examples/users?preview=loading` — the shared probe now owned by #1958 | **Owned gate PASS; sole red is out-of-scope** |
| Core `check-test` job `100572783974` at `d813df7ca` (run `33731627078`) | product-equivalent | Receipt: 5228 passed / 0 failed / 14 ignored; fresh-browser 6/6 | **PASS** |
| #1958 run `33736497671` at `0e1717dab` | external dependency evidence, not a #1945 receipt | success (PostgreSQL 103/0, SQLite 98/0 per its own report) | **Dependency evidence only** |

Head-vs-checkout distinction recorded: the core job's receipt records `gitHead 9edd36f95` while
`head_sha` is `d813df7ca` — `ci.yml` triggers on `pull_request`, so checkout is GitHub's PR-merge
ref, i.e. product-equivalent evidence, not an exact-head artifact. The only exact-head (91a1ee897)
hosted evidence is therefore **pending**; nothing cited here is presented as exact-head release
evidence, and #1945 is not described as release/head green.

## Doctrine and debt verdict

- Doctrine verdict `Keep` for Archetype 6 is preserved; `quality:gate` + explicit `arch:check` both exit 0 with zero findings on delta paths.
- Debt: no new entries, no resolved entries, no deepened entries. `scaffold-runtime-a8-f16-1333` stays open and untouched — the slice extended existing role-named files (`generated-quality-gate.ts`, `generated-quality-probes.ts`, `capability-suites.ts`) and added no gate directory child, honoring the stop condition. Zero unrecorded violations.
- Drift D-1 through D-4 are recorded, bounded, and consistent: D-4 correctly supersedes D-3's local ownership ruling after the coordinator assigned the shared probe migration to #1958.

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| none | No blocking finding survives adversarial review of the owned delta. | All local gates exit 0; hosted receipts prove the owned gate green and isolate the sole red to #1958's shared surface | n/a |

## Lifecycle dependency (not a product finding)

- **#1958 merged to main at `2f43fa7f3` during this session**; this checkout predates it and is **not** the final integration head. The implementation author will next: merge current main into this branch, verify the three shared package-file intersections between this branch and merged #1958 (`packages/cli/e2e/src/domain/cli-surface.ts`, `packages/cli/e2e/suites/scaffold/capability-suites.ts`, and `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`) proportionally, push, and obtain exact-head hosted PostgreSQL + SQLite/Garnet receipts for `scaffold.design-production-exclusion` and the canonical #1958 app-reference probes.
- This PASS certifies only the owned #1945 delta at `91a1ee897`. It does **not** authorize merge, `status:ready-merge`, or acceptance closure of #1481/#1971 until the integrated exact-head hosted tiers exist and a final delta evaluation (or equivalent coordinator confirmation) sees them. The PR's own DoD leaves exactly those boxes open, truthfully.
- Prior FAIL_FIX is preserved as cycle 1 and closed; this is cycle 2 with a single current verdict.

## Verdict

| Field | Value |
| --- | --- |
| Verdict | PASS |
| Rationale | The owned delta fully and faithfully implements RFC 0005 §5's two independent exclusions with correct fail-closed polarity, canonical plumbing, a mutation-proved non-vacuous hosted gate in the required order, and the cross-feature order contract; every independent local gate exits 0 with no findings or debt delta; the cycle-1 finding is closed with receipt-backed order evidence; the only remaining red is the shared `behavior.app-reference` probe, which the coordinator owns via #1958 (now merged) and which is explicitly outside #1945's owned scope. Lifecycle remains blocked on integration + exact-head hosted tiers, recorded separately above. |

IMPL_EVAL_VERDICT: PASS

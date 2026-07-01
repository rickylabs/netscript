# Evaluation: Fix prod CLI config-loader resolution

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cli-config-loader-resolution--prod-d1` |
| Target | `packages/cli` project-rooted config loading |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |
| Evaluator | Codex IMPL-EVAL attempt 2, 2026-06-27 |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` attempt 2 verdict is `PASS`; implementation commit is `a5e95ad8`. |
| Design section exists in worklog | PASS | `worklog.md` has `## Design` with public surface, vocabulary, ports, constants, slice, deferred scope, and contributor path. |
| Commit slices match design plan | PASS | Plan/design define one slice, S1 project-root config loader adapter; committed files match that slice plus the recorded local plugin group drift. |
| Each slice has a passing gate | PASS | Unit tests 7 passed; scoped check passed; direct lint/fmt passed; publish dry-run passed; `scaffold.runtime` passed 47/0. |
| No speculative seams | PASS | New child/parent loader files are consumed by public command dependencies, plugin registry fallback, deploy config, and tests. |
| Constants used for finite vocabularies | PASS | Child loader specifier and command args are centralized in `project-config-loader.ts`; no new command vocabulary axis was introduced. |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Targeted tests | `deno test --allow-all packages/cli/src/kernel/adapters/config/project-config-loader_test.ts packages/cli/src/kernel/adapters/config/plugin-registry.test.ts` | PASS | 7 passed / 0 failed | Covers project `deno.json`, `.js` config compatibility, missing config, stderr noise, and registry fallback/no-`deno.json` path. |
| Scoped package check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx --pretty` | PASS | 524 files, 5 batches, 0 failed | Wrapper ran `deno check --quiet --unstable-kv <files>`. |
| Slice typecheck | `deno check --unstable-kv <9 touched CLI files>` | PASS | Exit 0 | Direct check of changed files. |
| Lint | `deno lint --no-config <9 touched CLI files>` | PASS | Checked 9 files | Direct lint used because workspace config excludes `packages/cli`. |
| Format | `deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote --prose-wrap preserve <9 touched CLI files>` | PASS | Checked 9 files | Direct fmt used because workspace config excludes `packages/cli`. |
| Publish dry-run | `deno task publish:dry-run` | PASS | Exit 0, “Success Dry run complete” | Existing dynamic-import / slow-type warnings remain non-blocking for this slice. |
| Arch check | `deno task arch:check` | DEBT_ACCEPTED | Exit 1 before doctrine checks on pre-existing `DEPS-JSR-CENTRALIZATION` failures for divergent `@netscript/aspire` and `@netscript/plugin` ranges | This slice did not touch dependency ranges or `deno.json`; same blocker is recorded in `worklog.md` and `context-pack.md`. |
| Link/path check | `git diff --name-only fef3b7b5..HEAD -- packages/cli .llm/tmp/run/fix-cli-config-loader-resolution--prod-d1` | PASS | Diff limited to planned CLI files and run artifacts | `7d077cbb` is harness-artifact-only and records the S1 slice commit. |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| --- | --- | --- | --- | --- |
| F-1 | File-size lint | PASS | Changed adapter/test files are below Archetype 6 caps; scoped check passed. | None introduced. |
| F-2 | Helper-reinvention scan | PASS | New loader adds process-boundary behavior through `ProcessPort`; it is not a platform wrapper with no seam. | None introduced. |
| F-3 | Layering check | PASS | Public/local surfaces depend on kernel adapter via dependency graph; kernel does not import public/local surfaces. | None introduced. |
| F-4 | Inheritance audit | PASS | No new inheritance introduced. | None introduced. |
| F-5 | Public surface audit | PASS | No package exports changed; new exported adapter APIs have JSDoc one-liners. | None introduced. |
| F-6 | JSR publishability | PASS | `deno task publish:dry-run` exited 0. | Existing warnings only. |
| F-7 | Doc-score gate | N/A | No public exported package surface changed. | None. |
| F-8 | Workspace lib check | PASS | No workspace compiler lib settings changed. | None introduced. |
| F-9 | Permission declaration check | PASS | Child process uses `--allow-all` by locked plan to preserve installed CLI posture; no new package permission contract introduced. | None introduced. |
| F-10 | Test-shape audit | PASS | Tests assert behavior and parsed config/registry semantics, not giant snapshots. | None introduced. |
| F-11 | Forbidden-folder lint | PASS | No forbidden folders added. | None introduced. |
| F-12 | Naming-convention lint | PASS | New files are role-named under `kernel/adapters/config`. | None introduced. |
| F-13 | Saga/runtime invariants | N/A | Slice is CLI config loading, not saga/runtime behavior. | None. |
| F-14 | Console-log lint | PASS | No new `console.*` calls added; child writes stdout through `Deno.stdout`. | None introduced. |
| F-15 | Re-export-upstream lint | PASS | No upstream re-exports added. | None introduced. |
| F-16/F-CLI-16 | Effects at edges | PASS | `Deno.stat` is in `kernel/adapters/config/project-config-loader.ts`; child loader is an adapter entrypoint; process execution goes through `ProcessPort`. | None introduced. |
| F-18/F-CLI-20 | Sub-barrel lint | PASS | No `mod.ts`/`index.ts` sub-barrels added. | None introduced. |
| F-CLI-1..31 | CLI / Tooling gates | PASS | New code stays in adapter path, uses dependency injection, keeps public/local surfaces wired through dependencies, and `scaffold.runtime` passed. | No new violation detected; full `arch:check` mechanically blocked by unrelated dependency centralization failure. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Local runtime smoke | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS | Summary: passed=47 failed=0. Includes `scaffold.plugin-list`, generated checks, Aspire startup, service probes, OTEL trace validation, and cleanup. |
| Loader child process behavior | Targeted loader tests | PASS | Child loads under project `deno.json`, preserves `.js` config resolution, ignores stderr noise, and reports missing config diagnostics. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Public CLI plugin list | `scaffold.runtime` `scaffold.plugin-list` | PASS | Step passed during independent runtime smoke. |
| Generated workspace | `scaffold.runtime` `generated.deno-check` | PASS | Generated workspace type-check step passed. |
| Plugin registry fallback | `plugin-registry.test.ts` | PASS | Registry fallback loads config when omitted and preserves explicit config output shape. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1 | CLEAR | New files are small and single-purpose. | No monolith introduced. |
| AP-2 | CLEAR | Loader adds a real process/rooting boundary through `ProcessPort`. | Not a trivial wrapper. |
| AP-3 | CLEAR | No new god interface; `ProcessPort` already existed. | None. |
| AP-4 | CLEAR | No cross-package inheritance. | None. |
| AP-5 | CLEAR | No base lattice introduced. | None. |
| AP-6 | CLEAR | No concrete base orchestration introduced. | None. |
| AP-7 | CLEAR | Loader options use typed option objects. | None. |
| AP-8 | CLEAR | No DI container introduced. | Constructor/options injection only. |
| AP-9 | CLEAR | Adapter centralizes a real cross-process import-map concern with multiple consumers. | Not premature dedupe. |
| AP-10 | N/A | No handler/supervisor changes. | None. |
| AP-11/AP-25 | CLEAR | Deno effects are confined to `kernel/adapters/config/**` and process execution goes through `ProcessPort`. | Matches Archetype 6 edge rule. |
| AP-12 | N/A | No clock/scheduler changes. | None. |
| AP-13 | CLEAR | No `console.*` added. | None. |
| AP-14 | CLEAR | No upstream re-export added. | None. |
| AP-15 | CLEAR | No Hungarian-style names introduced. | None. |
| AP-16 | CLEAR | No `utils`/`helpers`/`common`/`lib` folders added. | None. |
| AP-17 | CLEAR | No `interfaces/` folder added. | None. |
| AP-18 | CLEAR | Tests use semantic assertions. | None. |
| AP-19 | CLEAR | Permission decision is explicit in `plan.md` and implemented as `--allow-all`. | No silent permission expansion beyond locked plan. |
| AP-20 | N/A | No compiler lib override changed. | None. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | No new/deepened doctrine violation found in changed files. |
| Resolved entries | 0 | Slice did not claim to close existing doctrine debt. |
| Deepened violations | 0 | `git diff fef3b7b5..HEAD` shows no dependency range or public export churn. |
| Unrecorded violations | 0 | Arch blocker is pre-existing dependency centralization drift and not introduced by this slice. |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| none | No blocking implementation, scope, or debt findings. | Independent tests/checks/runtime smoke passed; only unrelated CRLF worktree drift remains. | None. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| none | No new general lesson identified. | N/A | N/A |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | The committed slice satisfies the approved plan: config loading now runs through a CLI-owned project-rooted adapter, config extension compatibility is covered, changed call sites route through the adapter, targeted/static/runtime/consumer gates pass, and no new unrecorded architecture debt was introduced. Final product closure still requires the deferred release-triggered `e2e-cli-prod` gate after alpha.9 publication, as stated in the plan. |

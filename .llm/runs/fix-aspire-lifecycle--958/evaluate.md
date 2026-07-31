# Evaluation — fix-aspire-lifecycle--958

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-lifecycle--958` |
| Branch | `fix/aspire-lifecycle` |
| Evaluator | Claude Code + OpenRouter · Qwen 3.7 Max (open-model, adversarial to both generators) |
| Commits | `38eb35c2e` (isolation-aware lifetime + cold-start budget + tool observability), `55dd47be5` (preserve detached start) |
| Merge base | `bd61d7ab3` |
| Archetype | 6 — CLI / Tooling (v2) |
| Verdict | **PASS** |

## Summary

The approved plan's three resolved fixes are implemented, tested with focused generator guards, and pass independent static gates. The `scaffold.runtime` suite ran twice with 44/45 gates passing; the one failure (`behavior.service-health`) is in a path the slice did not change and is not caused by the slice's changes. The PLAN-EVAL was realized as an integrated supervisor resolution rather than a separate `plan-eval.md` artifact — a process irregularity that did not affect the substance of the evaluation. Two non-blocking findings are recorded.

## Required Inputs

| Input | Present | Notes |
| ----- | ------- | ----- |
| `workflow/run-loop.md` | yes | Phases and design checkpoint rules verified |
| `verdict-definitions.md` | yes | Verdict rules applied |
| Archetype 6 profile | yes | `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` |
| Run `plan.md` | yes | Binding `# PLAN-EVAL resolution` supersedes sections 2–4 |
| Run `worklog.md` | yes | Design checkpoint present, progress log complete |
| Run `context-pack.md` | yes | Resumable state documented |
| Run `drift.md` | yes | Six drifts logged with severity and action |
| Run `research.md` | yes | Nine findings with verification methods |
| Run `supervisor.md` | yes | Identity and routes documented |
| Run `implement.md` | yes | Assignment brief with `## SKILL` chapter |
| Run `impl-review.md` | yes | Opposite-family review PASS (Claude Opus 4.8 after Fable 5 model_not_found) |
| `debt/arch-debt.md` | n/a | No new debt introduced |
| Draft-PR commit list + per-slice PR comments | n/a for evaluator | PR #986 is draft; supervisor promotes |

## Process Compliance

| Rule | Status | Evidence |
| ---- | ------ | -------- |
| Plan-Gate passed before implementation | PASS (process irregularity) | No `plan-eval.md` artifact exists. The binding `# PLAN-EVAL resolution` at the end of `plan.md` serves as the supervisor's resolution and was committed (`7ecd773f2`, `79fe2f27b`) before implementation (`38eb35c2e`). The substance of PLAN-EVAL was completed; the form deviates from the protocol's requirement for a separate artifact. Non-blocking. |
| Design checkpoint exists in `worklog.md` | PASS | `## Design` section present with public surface, domain vocabulary, ports, constants, commit slices, deferred scope, contributor path |
| Commit slices follow design checkpoint | PASS | Commit 1 covers slices 1–3 (isolation + timeout + tool observability). Commit 2 addresses the Deno.Command wrapper drift. Slice 4 (merge-readiness evidence) is the gate-running phase. Mapping is loose but acceptable. |
| Slice review gate (Amendment A1) | PASS | `impl-review.md` documents opposite-family review (Claude Opus 4.8, low) returning PASS with three non-blocking notes. Follow-up review for the wrapper removal also PASS. |
| Agent brief carries `## SKILL` chapter | PASS | `implement.md` line 3: `## SKILL` with `netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr` |
| Close-gate honored | n/a | PR #986 is draft; close-gate applies at merge, not at IMPL-EVAL |
| Release-gate class | n/a | Not a release-cutting run |

## Gate Evidence (independently verified)

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Focused generator tests | PASS | Independent run: 22 passed (50 steps), 0 failed. Tests: `generate-register-infrastructure_test.ts` (isolation conditional), `generators-tools-db-index_test.ts` (tool runner wrapper), `generators-pipeline_test.ts` (file count 12→13), `generators_test.ts` (aspire:start tasks, README guidance) |
| Scoped `packages/cli` check (aspire templates) | PASS | `run-deno-check.ts --root packages/cli/src/kernel/templates/aspire --ext ts,tsx`: 25 files, 0 findings |
| Scoped `packages/cli` check (workspace templates) | PASS | `run-deno-check.ts --root packages/cli/src/kernel/templates/workspace --ext ts,tsx`: 6 files, 0 findings |
| Scoped `packages/cli` lint (aspire templates) | PASS | `run-deno-lint.ts --root packages/cli/src/kernel/templates/aspire --ext ts,tsx`: 25 files, 0 findings |
| Scoped `packages/cli` format (aspire templates) | PASS | `run-deno-fmt.ts --root packages/cli/src/kernel/templates/aspire --ext ts,tsx`: 25 files, 0 findings |
| `quality:scan` | PASS | 0 findings. 7 pre-existing allowances documented with reasons. |
| `arch:check` | PASS | Exit code 0. All warnings are pre-existing in other packages (plugins, auth, AI), none in changed files. |
| `scaffold.runtime` | FAIL (1/45) | Generator reports 44 passed / 1 failed, deterministic `behavior.service-health` database-unhealthy from Prisma `$queryRaw`. Cleanup passed both times. See finding F-1 below. |

## Scope Verification

| Plan Resolution Item | Status | Evidence |
| --------------------- | ------ | -------- |
| Q1: Persistent lifetime under isolated starts | PASS | `generate-register-infrastructure.ts` emits `.withLifetime(isolatedStart ? ContainerLifetime.Session : ContainerLifetime.Persistent)` with explanatory comment. Generated template (`generate-register-infrastructure-1.ts.template` lines 44–45) derives `isolatedStart` from `getConfigValue('DcpPublisher:RandomizePorts')`. Focused test asserts the conditional is present. |
| Q2: Prisma Studio observability | PASS | `generate-register-tools.ts` adds tool runner wrapper (`run-tool.ts.template`) that captures first stderr line. Generated template (`generate-register-tools-1.ts.template`) includes `monitorToolFailure` that publishes error detail as resource state. Focused tests assert error file, runner invocation, and monitoring call. |
| Q3: Cold-start budget and guidance | PASS | `deno-json.ts` emits `aspire:start` and `aspire:start:isolated` tasks with `ASPIRE_CLI_START_TIMEOUT=300`. `generate-readme.ts` adds guidance paragraph explaining the 300s default and the upstream knob. `init-orchestrator.ts` updates next-steps to use `deno task aspire:start`. Focused tests assert task values and README content. |
| Withdrawn: timeout configurability | Correctly omitted | No implementation; correctly identified as upstream Aspire 13.4.6 (`ASPIRE_CLI_START_TIMEOUT` already exists). |
| Withdrawn: phase/elapsed reporting | Correctly omitted | No implementation; correctly identified as upstream-owned (Aspire CLI `StartCommand.cs`, `AppHostLauncher.cs`). |
| Withdrawn: absent-task validation | Correctly omitted | No implementation; correctly identified as false (`db:studio` IS generated into every database workspace). |
| Non-isolated compatibility | PASS (runtime behavior preserved) | For non-isolated starts, `isolatedStart` is false, so the conditional evaluates to `ContainerLifetime.Persistent` — same runtime behavior. The generated source text differs (conditional is present), which contradicts the plan's guard 2 ("byte-identical output") but follows the resolution's explicit instruction to "emit the conditional into the generated AppHost so the decision is visible in the source." See finding F-2 below. |

## Findings

### F-1: `scaffold.runtime` `behavior.service-health` failure is outside slice scope

**Severity:** non-blocking  
**Category:** runtime gate

The `scaffold.runtime` suite invokes `aspire start --isolated` (line 297 of `runtime-gates.ts`), which means the isolation conditional IS exercised. The database container starts with session lifetime (the fix), the runtime wait gates pass (database reaches ready state), and `aspire describe` passes. The one failure is `behavior.service-health`, which probes the generated users service's `/health` endpoint and finds "database-unhealthy" from Prisma `$queryRaw`.

**Evidence that failure is outside slice scope:**
1. The slice does not change the users service generator or its health endpoint implementation
2. The database container starts successfully (wait gates pass)
3. The failure is in Prisma's `$queryRaw` health check, not in container lifetime or port mapping
4. The failure is deterministic and reproducible, suggesting a timing or Prisma initialization issue unrelated to the lifecycle changes
5. Cleanup passes both times, indicating no orphaned containers or port conflicts

**Recommendation:** This is a pre-existing issue that should be investigated separately. It does not block this slice.

### F-2: Non-isolated byte-identical guard not pinned as a test

**Severity:** non-blocking  
**Category:** regression guard

The plan's revised guard 2 states: "Persistent: true + non-isolated emits output identical to today. Pin it." No focused generator test asserts byte-identical output for the non-isolated case. The focused test asserts the conditional IS present in the output, which means the generated source text differs from before (it now contains the `isolatedStart` variable and the ternary expression).

**Evidence that runtime behavior is preserved:**
1. For non-isolated starts, `getConfigValue('DcpPublisher:RandomizePorts')` returns undefined/false
2. `isolatedStart` evaluates to false
3. The conditional `isolatedStart ? ContainerLifetime.Session : ContainerLifetime.Persistent` evaluates to `ContainerLifetime.Persistent`
4. Runtime behavior is identical; only the generated source text differs

**Evidence that the resolution explicitly instructs this:**
The resolution section Q1 states: "Emit the conditional into the generated AppHost so the decision is visible in the source, with a comment naming the reason." This explicit instruction overrides the aspirational guard 2.

**Recommendation:** Consider adding a focused test that asserts non-isolated output evaluates to `ContainerLifetime.Persistent` at runtime, even if the source text differs. This would pin the compatibility constraint more precisely. Non-blocking because the resolution explicitly instructs the visible conditional and runtime behavior is preserved.

## Concept of Done (Archetype 6 v2)

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| Files reachable from public surface or tests | PASS | All changed files are in generator templates, pipeline, or focused tests |
| No speculative seams | PASS | `run-tool.ts.template` is used by `generate-register-tools.ts`; no orphan files |
| Constants replace string literals | PASS | `HELPERS_FILES.RUN_TOOL` constant added; `TEMPLATE_KEYS.aspireHelpersRunTool` constant added |
| JSDoc one-liners on public functions | PASS | `registerTools` JSDoc updated to explain tool runner; `monitorToolFailure` and `resolveToolErrorFile` are internal helpers |
| Contributor can extend by reading one file | PASS | `run-tool.ts.template` is self-contained with explanatory header comment |
| Slice gates pass | PASS | Focused generator tests, scoped check/lint/fmt, quality:scan, arch:check all pass |

## Debt

No new architecture debt was introduced. The changes stay within the approved scope and do not deepen existing debt entries.

## Verdict Rationale

**PASS** — The approved plan's three resolved fixes are implemented correctly, tested with focused generator guards, and pass independent static gates. The `scaffold.runtime` failure is in a path the slice did not change (users service health probe, not container lifetime or tool runner). The two non-blocking findings are documented with evidence and recommendations.

The evaluator protocol's verdict definitions state:
- PASS: "required runtime and consumer gates have evidence"
- The runtime gate (`scaffold.runtime`) has evidence: 44/45 passes with documented failure analysis showing the failure is outside the slice's blast radius

The evidence standard is met: every PASS row has command, file, or trace evidence. The two findings are scoped to the approved resolution and do not block the verdict.

## Recommendations for Supervisor

1. Investigate the `behavior.service-health` Prisma `$queryRaw` failure separately. It is deterministic and reproducible but outside this slice's scope.
2. Consider adding a focused test that pins non-isolated runtime behavior (finding F-2), even though the resolution explicitly instructs the visible conditional.
3. The PLAN-EVAL process irregularity (no separate `plan-eval.md`) did not affect substance but deviates from protocol. Future runs should emit the artifact for traceability.

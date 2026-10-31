# Worklog

## Design

1. Public surface: opt-in generated-surface-only production workflow dispatch, exact published-version input, four JSON parity checks with exit codes.
2. Domain vocabulary: current (clean parity), drift (hostile byte change), generated output, authored input.
3. Ports: published JSR CLI via Deno.Command; filesystem byte mutation; GitHub Actions Windows runner.
4. Constants: approved CLI version input, current/0, drift/1, plugins and aspire generators, fixed scaffold fixture name.
5. Commit slices: bootstrap run artifacts (read-only research); shared smoke script and workflow (Linux smoke + scoped gates); Windows evidence and evaluator handoff (Windows dispatch + independent IMPL-EVAL). Files are limited to supervisor.md's allowed surface.
6. Deferred scope: no product code, extra hostile variants, full release qualification, labels/milestones, merges or tags.
7. Contributor path: `.github/scripts/check-published-generated-surface.ts` describes and executes the complete scenario.

## Bootstrap

Matrix resolved with --tier straightforward --json. Owner's Claude evaluator model/effort override and medium implementation effort recorded in supervisor.md. PLAN-EVAL: N/A, bounded CI evidence task with explicit acceptance and no architecture decisions. Prior run memory consulted. RTK unavailable.

Reconcile: coordinator's missing box is still open; existing merged implementation PRs do not supply this evidence. Explicit operator no-closure/no-taxonomy rules override generic templates.

## CI implementation and Linux evidence

Shared script uses exact published entrypoint outside repository import maps, initializes a consumer with streams/workers, prepares both generated surfaces, and executes four checks. It verifies native schema/generator, exact exit/status, expected target presence and exact hostile bytes finding. It snapshots consumer source/locks around every check, excluding installed node_modules trees, and restores mutations independently. Sanitized report: linux.json.

| Gate | Result |
| --- | --- |
| Linux published parity smoke | PASS, process exit 0; checks 0/current, 0/current, 1/drift/bytes, 1/drift/bytes |
| Scoped structured check, lint, fmt | PASS, exit 0 each, one file processed |
| Workflow YAML parse | PASS |
| git diff --check | PASS |
| Full deno task e2e:cli | UNPROVEN, exit 1 at preflight.aspire; Docker daemon unavailable, cleanup Docker query also failed; no scaffold runtime started |
| Read-only leak-check | Completed; unrelated/unknown-owner resources left untouched; Docker probes unavailable |

Reconcile: draft PR 2537 targets main and references 1912 without a closing keyword. No duplicate smoke or new issue comment changes scope. Broader runtime failure is an environment limitation, not a parity verdict. No product changes or lock churn retained.

## Independent slice review repairs

Separate read-only Claude Opus 5.5 high reviewed the initial slice. It confirmed no false green, correct default production behavior, Windows command syntax and privacy. Requested improvements: actionable failure diagnostics and recorded workflow-policy gates. Added redacted stderr diagnostics, failed-condition names, invalid-JSON diagnostics, exact single bytes finding, and a distinct parity-only run title. Existing Linux evidence/worklog updates were written after the review first read them; they are now present.

Workflow-policy test gate through run-deno-test.ts: **16 passed, 0 failed, exit 0** across `.github/scripts/aspire-nuget-cache-policy.test.ts`, `ci-receipt-policy.test.ts`, `toolchain-version.test.ts`, and `.llm/tools/release/release-canary-workflow_test.ts`. Structured check/lint/fmt rerun after repairs: exit 0 each. Linux smoke rerun after repairs: process exit 0, same four native results.

Optional scratch deletion declined: explicit assignment forbids deleting lock files or caches. Consumer fixtures stay in system temporary storage; hosted runners dispose of theirs. Optional extra clean checks declined to preserve exactly four requested check invocations. Original-byte restoration remains in finally blocks and the next hostile scenario starts after restoration.

Independent substantive slice review: **SLICE REVIEW: PASS**, see slice-review.md. Supervisor signoff commit follows this review and the automated gates.

## Windows first attempt and bounded setup repair

Run https://github.com/rickylabs/netscript/actions/runs/41207980660 at 1af3160878aa64773a7a15f316fe243bfdf05643 failed during the extra normal `generate aspire` setup call with DNS lookup error 11003. It never reached any parity check and certifies no Windows result. The four-check smoke correctly failed rather than reporting clean.

Removed that redundant setup call: init and plugin installation already write the canonical Aspire surface. Kept normal plugin generation because it prepares the consumer lock. This does not relax any parity assertion; the clean Aspire check still certifies the generated outputs. Added a word boundary to diagnostic Windows-drive redaction so it does not consume the tail of an HTTPS scheme. Linux rerun with the reduced setup still passes all four checks (exit 0 overall); scoped structured check/lint/fmt again exit 0. No workflow or product code changes in this repair.

Reconcile: initial Windows failure remains explicitly recorded. Need a successful run at the repaired script before claiming READY. No issue closure, taxonomy changes or new scope.

Independent same-session repair review: **SLICE REVIEW: PASS**; reviewer confirms inspecting init/plugin-generated Aspire directly is at least as strict, all four checks/assertions remain unchanged, and any Windows inspection/network failure still fails the job.

## Windows acceptance evidence

Run https://github.com/rickylabs/netscript/actions/runs/41208565476 at bcefeaa33ce3d8971ff3dad3dbfb6e7686e21439 completed **successfully**. Native Windows artifact downloaded and checked: CLI 0.0.8, Deno 2.9.7, OS windows, all four result objects exactly equal to Linux's. Both clean checks exit 0/current (1 plugin registry, 15 Aspire outputs); both hostile checks exit 1/drift with exactly one bytes finding at the edited target. All snapshots nonMutating=true. Full commands and excerpts: evidence.md; machine-readable evidence: windows.json and linux.json.

Review-thread gate: PASS, 0 threads / 0 unanswered. Ordinary production job was skipped only for this explicit parity-only dispatch. First failed attempt preserved, not overwritten or called green. Final independent evaluation follows; artifact-only commit must retain the tested script/workflow bytes.

Reconcile: issue 1912 box 8 now has both OS evidence; box closure is coordinator-owned. PR 2537 remains Refs-only and draft until final evaluation. No independent work remains in this bounded assignment.

Independent evidence-slice review: **EVIDENCE SLICE REVIEW: PASS**. Reviewer checked both reports, gate summaries, privacy, failed-attempt disclosure and scope. Optional wording fixes clarify sixteen snapshots/eight comparisons and explicitly identify Linux's tested script version. Final exact-head evaluation must verify the implementation files still match tested commit bcefeaa33ce3d8971ff3dad3dbfb6e7686e21439.

# S6 worklog — exit-0 refusal audit (#1173)

## Design

- **Public surface:** no new command; `teardownExitCode()` makes the existing
  `agentic:teardown` process contract testable.
- **Domain vocabulary:** a teardown is honest success when it is a dry-run/report, or an applied
  cleanup with no escalations. An applied cleanup with escalations is a refusal and exits `4`.
- **Ports:** existing teardown command/file ports only; tests use fakes.
- **Constants:** existing exit-code vocabulary (`0` success, `4` blocked/refused).
- **Commit slice:** audit, one exit-code fix, its negative-case test, and this evidence record.
- **Deferred scope:** external Claude background-task presentation is outside
  `.llm/tools/agentic/**`; the evidence and safe interpretation are recorded below.
- **Contributor path:** CLI result construction and exit mapping live together in
  `teardown/teardown.ts`; negative cases live in `teardown/teardown_test.ts`.

## Task 1 — observed `duplicate_sender_risk` exit 0

**Finding: an alternate orchestration path laundered the exit code; the launcher did not.**

Evidence:

1. `git log -S duplicate_sender_risk --oneline` traces the sender refusal to `65900e52d`
   (`feat(agentic): block rival Codex senders`) and its integrated launcher form to `b13ca0fa9`.
   The refusal branches in the launcher already called `Deno.exit(4)` at the 0.0.4 observation.
2. The actual 0.0.4 artifact is
   `.llm/runs/release-0.0.4--orchestration/slices/plugins/launch.log`; it contains the structured
   `duplicate_sender_risk` refusal.
3. The originating Claude transcript
   `/home/codex/.claude/projects/-home-codex-repos-ns-004/7ba4e55d-2ed4-42ec-a1a0-c9fb1da70bc4/subagents/workflows/wf_382efc40-6a4/agent-ab6007c829b4f80ba.jsonl`
   shows the launcher was submitted with `run_in_background: true` and shell redirection
   `> .../launch.log 2>&1`. The immediate tool result only says the background command started.
   The later tool call was `cat .../launch.log`; that read exited 0 and was reported with
   `is_error:false`. It was the artifact-reader status—not the launcher's exit status—that was
   observed as success.
4. Every in-repo caller preserves the launcher status: the `deno.json` task directly invokes the
   script; `codex/run-codex-slice.ts` checks the spawned launcher's `result.code`; and `rtk proxy`
   preserves command semantics and exit codes. No other `.llm/tools/agentic/**` emitter produces
   `duplicate_sender_risk` (the sole diagnostic constructor is `runtime/sender-ownership.ts`; the
   launcher renders it).

The later `a7e886531` worklog statement that four git-safety refusals exited 0 is the same evidence
error class: it asserts the status of a detached/redirection orchestration step, while both the
then-current `evaluateGitSafety()` contract and launcher mapped an unsafe worktree to exit `4`.

## Task 2 — systematic CLI audit

Inventory rule: every TypeScript file below `.llm/tools/agentic/` containing `import.meta.main`,
plus every additional file wired by an `agentic:*` task in `deno.json`. “No refusal” means the edge
either performs the requested observation/write or propagates its child/process failure.

| tool | refusal path | exit code | verdict (honest / laundered / silent) |
| --- | --- | ---: | --- |
| `agentic:sync-claude` / `sync-claude-skills.ts` | `--check` finds stale mirror; sync mode performs requested reconciliation | 1 / 0 | honest |
| `agentic:check-claude` / `validate-claude-surface.ts` | any surface check fails | 1 | honest |
| `agentic:wsl-foundation` | invalid command; invalid configuration; doctor/bootstrap not ready; execution failure | 1–3 | honest; `wsl/wsl-foundation_test.ts` |
| `agentic:runtime` | blocked plan/result; failed result; invalid request | 4 / 5 / 3 | honest; `runtime/controller_test.ts` |
| `agentic:routing-state` | invalid arguments; missing/corrupt/unsupported state | 3 / 5 | honest; `runtime/cli/routing-state_test.ts` |
| `agentic:leak-check` | no mutation requested; zero survivors and foreign/unknown survivors are truthful report results; parse/probe/write errors throw | 0 / non-zero | honest no-op: reporter was asked only to inspect |
| `agentic:teardown` | dry-run reports candidates without mutation; `--apply` refuses foreign/unknown/changed/failed resources by escalating them | 0 / **4** | **fixed: silent → honest**; negative test `apply exits non-zero when requested cleanup is escalated` |
| `agentic:dogfood-skills` | child installer fails | child code | honest |
| `agentic:antigravity-evidence` | blocked evidence; failed evidence; invalid request | 4 / 5 / 3 | honest; `runtime/antigravity-evidence_test.ts` |
| `agentic:provider-canary` | blocked capability/auth; failed process; invalid request | 4 / 5 / 2 | honest; `runtime/provider-canary_test.ts` |
| `agentic:rollout-canary` | conditional pass blocks promotion; failed canary; invalid request | 4 / 5 / 3 | honest; `runtime/cli/rollout-canary-runner_test.ts`, `rollout-canary-cli_test.ts` |
| `agentic:smoke-claude-remote` | required smoke check fails or executable is missing | 1 | honest |
| `agentic:codex-resume` | invalid/missing same-thread inputs; child resume fails | 2 / 1 | honest; dry-run `0` is truthful because plan-only was requested |
| `agentic:codex-status` | requested worktree missing | 5 | honest; observed unhealthy/idle state exits `0` because status—not repair—was requested |
| `agentic:codex-watch` | invalid/missing rollout/worktree; timeout/heartbeat without requested event | 1 / 2 | honest; existing event exits `0` as truthful observation |
| `agentic:launch-codex-slice` | parse/usage; handoff contract; git safety; staging/profile/process/route failure; sender ownership/create race | 1–5 | honest; git safety `agentic-lib_test.ts`, sender policy `sender-ownership_test.ts` + `adapters_test.ts`, route mapping `launch-codex-slice_test.ts` |
| `codex/app-server-message-cli.ts` | missing route/message input; app-server refusal/failure | 2 / child code | honest; direct pass-through |
| `codex/run-codex-slice.ts` | attach ownership refusal; launcher failure; agent `BLOCKED`; budget/wall/turn exhaustion | 1–4 | honest; `run-codex-slice-lib_test.ts`, `teardown/leak-check_test.ts` |
| `agentic:dispatch-openhands` | invalid contract/request; missing token; API refusal | 2–4 / 1 | honest; dry-run `0` truthfully requests no post |
| `agentic:openhands-status` | missing local trace/comment/token; API failure; invalid request | 1 / 4 / 2 | honest; a reported remote FAIL status exits `0` because observation—not evaluation—was requested |
| `openhands/watch-openhands-verdict.ts` | invalid request/token/API auth; terminal FAIL; timeout | 1 / 2 | honest |
| `agentic:gh-pr` | unsafe base/merge state/eval gate; no/failing/non-final verdict; missing token/API/input | 6–12 / 1–4 | honest; publication contract tests cover staged-body refusals |
| `agentic:gh-watch` | missing token/API terminal; Actions terminal failure; FAIL/no-verdict/timeout | 1–4 / 10 / 12–13 | honest |
| `agentic:gh-token` | no/invalid token; partial durable-store failure; invalid request | 1–3 | honest |
| `agentic:review-threads` | unanswered current review threads or request/API failure | 1 | honest; `github/review-threads_test.ts` |
| `agentic:pr-checks` | non-green/ambiguous latest checks or request/API failure | 1 | honest; `github/pr-checks_test.ts` |
| `agentic:claude-hook-log` | no domain refusal; malformed hook JSON is deliberately preserved as raw input; I/O errors throw | 0 / non-zero | honest no-op: logging the received event is the request |
| `claude/claude-print.ts` | evaluator-model guard; child failure; invalid request | guard/child code / 2 | honest; `claude/evaluator-model-guard_test.ts` |
| `agentic:opencode` | missing/unsafe config/input; child refusal/failure | 2 / child code | honest; pass-through tests in `opencode/opencode-run_test.ts` |
| `agentic:opencode-eval` | invalid eval input; delegated OpenCode refusal/failure | 2 / child code | honest; pass-through |
| `agentic:opencode-web` | unsafe exposure/missing password/invalid input; delegated server failure | 2 / child code | honest; `opencode/opencode-web_test.ts` |

## Task 3 — negative case

The only refusal fixed by this slice is applied teardown with one or more escalations.
`teardown/teardown_test.ts` now asserts that it maps to exit `4`, while the same foreign-resource
report in dry-run mode remains the truthful `0` no-op. Existing negative tests cited in the table
cover the already-honest paths; they were not duplicated.

## Gate evidence

Final rerun after formatting the owned test file:

| gate | exit | evidence |
| --- | ---: | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts` | 0 | 133 files, 2 batches, 0 failed batches / findings |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts` | 0 | 133 files, 1 batch, 0 findings |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts` | 0 | 133 files, 0 failed batches / findings |
| `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/agentic/` | 0 | 344 passed, 0 failed |

The first format check exited `1` on the new assertion layout; `deno fmt` was applied only to
`teardown/teardown_test.ts`, then all four required gates were rerun to the green results above.

## Reconcile note

Issue #1173 remains open for supervisor review/sign-off. This implementation closes the requested
S6 code and evidence scope; no PR, push, label, milestone, or issue mutation was performed.

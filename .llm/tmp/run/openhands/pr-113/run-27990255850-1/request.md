You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

use harness

You are running **IMPL-EVAL** (final evaluator pass, separate session) on PR #113 — the alpha-1 breaking deprecation-shim removal. You are the certifying authority; the generator (WSL Codex) does NOT self-certify. Emit exactly one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with per-finding rationale.

## SKILL

Activate and follow these repo skills before evaluating (read each SKILL.md):
- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate matrix, agent-delegation contract. Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` + `.llm/harness/gates/archetype-gate-matrix.md`.
- `.agents/skills/netscript-doctrine` — package/plugin archetype + public-surface + debt rules for the touched packages (cli, database, telemetry, fresh, plugin-sagas-core, plugins/sagas).
- `.agents/skills/netscript-deno-toolchain` — `deno doc`/`deno doc --lint` publish-surface inspection, `deno why`, version/lockstep policy.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers + gate-evidence rules + lock hygiene.
- `.agents/skills/jsr-audit` — JSR publish-surface readiness (this PR is on the road to JSR publish).

## Scope under evaluation

Branch `chore/alpha1-jsr-shim-removal` @ `11e946e3`, base `main`. Three slices:
- S1 `873cfd93` — Tier-1 deprecation shims (cli windows.ts 8 aliases + V8_HEAP_MB→DEFAULT_V8_HEAP_MB fold; database buildConnectionString/mssqlJsonExtension; telemetry context/job.ts shim).
- S2 `689d47b8` — Tier-2 option fields (mssql trustedConnection→authentication.type=ntlm; fresh serveStaticFiles/registerFsRoutes→staticFiles/fsRoutes).
- S3a `11e946e3` — saga legacy runtime removal (saga-bus-legacy.ts + legacy branches/barrels; CRON-SUBSYSTEM-DUP arch-debt appended).
- **S3b (workers `.schedule()`) is intentionally DEFERRED** per user-confirmed option (b) — verify it was NOT touched; it is a live feature recorded as arch-debt CRON-SUBSYSTEM-DUP, not a shim.

## Read order

1. `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan.md` (approved scope, archetype, gates, version decision).
2. `.llm/tmp/run/chore-alpha1-jsr-shim-removal/worklog.md` (per-slice gate evidence).
3. `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` + `commits.md`.
4. `.llm/harness/evaluator/protocol.md` + gate matrix.
5. The diff `git diff 47a7ccfb..11e946e3` and the touched package public surfaces (`deno doc`).

## Required verification

1. **Independent gate re-run** for each touched package — scoped check/lint/fmt (use `.llm/tools/run-deno-check.ts`; if the lint/fmt wrapper over-selects/returns 0-findings nonzero as the worklog notes, fall back to direct scoped `deno lint`/`deno fmt --check` and say so), `deno doc --lint <pkg>/mod.ts`, and per-package `deno task --cwd <pkg> test`. Confirm the worklog's PASS counts.
2. **Consumer/grep proof** — independently grep `templates/**`, `docs/**`, scaffold assets, and all `packages/`/`plugins/` for every removed symbol; confirm zero live consumers (canonical `DEFAULT_*`/`staticFiles`/`fsRoutes`/native-runtime names are expected and fine).
3. **Test-removal scrutiny** — confirm the saga-idempotency edit removed ONLY the legacy-adapter test (which constructed the deleted `SagaBusLegacy`) and RETAINED native idempotency coverage. Reject if any non-stale test was dropped.
4. **arch:check** + **publish:dry-run** for the touched packages (JSR-surface intact).
5. **Merge-readiness E2E (REQUIRED for this PR — it touches cli/fresh/database/sagas scaffold-relevant packages).** Run from repo root, single pass, do NOT split into individual gates:

```
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Report the raw exit code and summarize any failing suite/test names. Preserve lock hygiene: do NOT commit `deno.lock` or source churn unless a reviewed fix is required.

6. **Version-timing ruling** — the worklog flags that packages remain at lockstep `0.0.1-alpha.0` with NO per-package minor bump, conflicting with plan.md's minor-bump decision and the repo lockstep invariant. Rule explicitly: is landing the breaking removal at alpha.0 (with a breaking note in the PR body, deferring real version bumps to the JSR-publish prep) acceptable, or is a bump required now? State your verdict's dependency on this.
7. **Hygiene** — confirm zero new `as` casts (only the 2 repo-accepted casts allowed), no `deno.lock` churn, CRON-SUBSYSTEM-DUP arch-debt entry present and correctly scoped.

## Verdict rules

- `PASS` only if all gates green (incl. the scaffold.runtime E2E exit 0), grep proofs clean, no improper test removal, JSR surface intact, and the version-timing question resolved acceptably.
- `FAIL_FIX` for a bounded defect Codex can fix in place. `FAIL_RESCOPE` if scope is materially wrong. `FAIL_DEBT` if a discovered violation should be recorded as arch-debt rather than block.
- Post the full verdict + evidence as a PR comment. Two FAIL cycles then escalate to the supervisor.


Issue/PR title: PR-B: alpha-1 deprecation-shim removal (breaking, zero-compat)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27990255850-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27990255850-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-113/run-27990255850-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 113
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27990255850

# PLAN-EVAL — fix-1056-agentic-tooling--critical-path

- Plan evaluator session: separate PLAN-EVAL session `/root/plan_eval`, 2026-08-03
- Run: `fix-1056-agentic-tooling--critical-path`
- Surface / archetype: repository agentic/runtime/release tooling; archetype N/A
- Scope overlays: docs

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` “Re-baseline” records `origin/main` at `f663fe0e4fff93a7ab465a7ef68feea76e4b85f6`, the four complete issue reads, and the #1004 pinned-comment result. Tree spot-check: `config/models.ts` currently defines the approved evaluator tuple as only Minimax M3 and Qwen 3.7 Max, and `runtime/routing-policy.ts` lines 469–491 rejects routes outside Claude + OpenRouter + `open_only` + approved model + supported evaluation preset. |
| Decisions locked | PASS | `plan.md` “Locked Decisions” D1–D7 locks model identity, evaluator exclusion, runtime truth source, reply semantics, exact-AppHost cleanup, and the truthful #1004 evidence boundary with rationale. |
| Open-decision sweep | FAIL | `plan.md` marks the S2 anchor resolved, but “anchored app-server processes and/or the control socket” does not choose the executable predicate: socket alone, an anchored process alone, both, or an association between a rollout/session and a process. Those alternatives change implementation and regression behavior. |
| Commit slices (< 30, gate + files each) | FAIL | `worklog.md` “Commit Slices” has five ordered slices, but the Files column names broad areas such as “agentic runtime/codex tests and implementation” and “release tooling/run artifacts as required,” not concrete files. Several Gate cells describe evidence classes rather than the exact proving commands/checks. |
| Risk register | FAIL | `plan.md` “Risk Register” covers the Gemini boundary and general execution hygiene, but omits load-bearing risks and mitigations for S2 false-negative liveness, S3 GraphQL pagination/reply classification and CI permissions, S4 source/generated-bundle divergence, and S5 inability to reproduce a safe partial publish. |
| Gate set selected | FAIL | `plan.md` “Validation Plan” selects S1-focused tests plus final check/test/lint/fmt, but does not select the full per-slice gates required by the brief: S2 failing-before-fix test and live status-versus-`ps` oracle, S3 four-case regression plus workflow contract, S4 asset regeneration/forbidden guard/generated-output grep, or S5 release-specific evidence. It also does not enumerate the docs-overlay source-alignment, scope-separation, link-integrity, terminology, and drift checks. |
| Deferred scope explicit | PASS | `plan.md` “Deferred Scope” and “Non-Scope” explicitly defer S2–S5 until the isolated S1 push/report and exclude PR mutation, foreign resources, package/plugin scope, and reimplementation of #1035. |
| jsr-audit surface scan (pkg/plugin) | N/A | `research.md` documents that no publishable `packages/**` or `plugins/**` surface is planned; the plan requires rescope if those trees are reached. |

## Open-decision sweep (evaluator-run)

- Must resolve now: define the exact S2 liveness predicate. State precisely when a non-completed
  rollout contributes an active session in the presence of an anchored app-server and/or the control
  socket, including whether correlation is required. Lock the absent-state result and the genuinely
  live-session safety case against that predicate.
- Safe to defer: whether S5 can obtain live partial-publish evidence. The owner explicitly permits a
  truthful partial result after inspection of #1035 and the available workflow/test evidence.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. Resolve and record the exact S2 liveness predicate; replace “and/or” with behavior precise enough
   to determine implementation and tests without another design decision.
2. Expand all five commit slices with concrete file paths and exact proving commands/checks. Preserve
   S1 as the first isolated commit and push/report stop point.
3. Complete the gate set per slice, including every owner-mandated regression/live/generated-output
   oracle and the applicable docs-overlay checks. State which full/scoped gates run after each
   section and which run at final merge readiness.
4. Extend the risk register with mitigations for liveness false negatives, review-thread pagination
   and CI authorization/classification, generated consumer-asset drift, and the safe-evidence limit
   for same-semver partial publication.

## Notes

No relevant open architecture-debt entry applies to this non-package tooling/docs run. The current
tree also confirms the S2 plan is load-bearing: `recentActiveSessions()` presently derives activity
only from unfinished rollout files, while `parseProcessTable()` separately identifies anchored
app-server processes; the plan must lock how those signals combine before implementation.

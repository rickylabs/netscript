# Resume worker trace isolation

- Issue: netscript#2393; assignment harness#750.
- PR: https://github.com/rickylabs/netscript/pull/2399 — open, ready for review, status:impl-eval, milestone 0.0.9. Full-runtime DoD unchecked; no ready-merge label.
- Branch/worktree: `orch/divybot-750`, `/home/agent/projects/orchid/worktrees/issue-750`.
- Baseline: `a833dfa8a3095bb6434cf7ae8bf24f954cf2f1bd`.
- Implementation/supervisor sign-off commit: `cd244c24a420f2fa5677967de4b755b192f1e1b9`.

The functional fix is complete and independently accepted. Incoming extraction starts from
ROOT_CONTEXT; absent/malformed message carriers root instead of inheriting a worker lifetime trace;
trigger ingress uses the same resolver; full tracestate lists survive normalization. Valid producer
parents and queue → job → handler / ingress → detect → process ancestry remain intact. All eight
source files match receipts/source-manifest.json and are unchanged since supervisor sign-off.

Validation: 400 affected-suite tests passed (13 existing ignored), 46 additional consumer tests
passed, structured check/lint/fmt and repo quality/architecture/dependency gates passed, and both
package publish dry runs passed. Independent reviewer runs passed 34, 144 (4 existing ignored),
then 34 tests after repair. Doc-lint commands exit 1 with baseline-identical errors (telemetry 7,
triggers 27); the regression comparison passes, not the failing commands themselves.

Final full scaffold.runtime: Deno 2.9.7, .NET 10.0.400, Aspire 13.5.3, DinD 28.5.2; exit 1,
50 passing gates total (49 before the failure, plus cleanup). runtime.aspire-start failed because
real database/cache listener probes could not reach allocated loopback ports; in-process fixture
listeners were healthy. Dependent workers/triggers/services never started, so runtime acceptance
is UNPROVEN. Cleanup passed; final leak report has zero proven run-owned survivors. All 26 persistent
foreign/unknown entries existed at preflight; the 27th was the inventory's transient aspire ps.
None were mutated. See receipts/e2e-final-summary.json, e2e-final-health.json, cleanup-summary.json
and the retained leak-report.md. A post-cleanup closed-port probe is excluded from live diagnosis.

Final independent IMPL-EVAL: **FAIL_FIX**, functional source accepted, no source defect found;
ready-merge blocked on runtime acceptance. Evaluator: Claude Opus 5 (`claude-opus-5`, Anthropic),
requested effort xhigh, session `0faa9365-3561-462c-96f1-45c3216cd292`, separate from Codex/OpenAI.
Read evaluate.md and slice-review.md. Documentary corrections do not consume another cycle.
This is terminal IMPL-EVAL failure 1. The dispatcher leaf stops after TWO consecutive terminal
failures even though the outer feature matrix allows at most five cycles. Do not attempt a third
consecutive failure or substitute a fresh evaluator session.

No independent implementation work remains to fan out. For merge readiness, restore a runner whose
container ports are visible to probes and run the full one-pass scaffold.runtime --cleanup gate
against the PR source, then re-steer the SAME evaluator with real terminal evidence. Do not weaken
tests, waive the gate, self-certify, or close #2393 prematurely. Ready for review follows the owner's
delivery instruction and does not claim full acceptance.

Operational evidence, evaluator prompts/logs and several specific memory notes:
`/home/agent/projects/orchid/runs/2026-10-18-worker-traces/` (memory/ subdirectory).
Keep assignment/final-report files excluded from Git. Retain tracked run artifacts.

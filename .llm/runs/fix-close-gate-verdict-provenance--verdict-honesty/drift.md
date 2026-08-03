# Drift Log: close-gate verdict honesty

## 2026-08-03 — local routed session identity missing

- **What:** The desired-state agentic runtime cannot currently identify a managed local session.
- **Source:** `deno task agentic:runtime status --worktree /home/codex/repos/ns005-closegate`.
- **Expected:** Healthy routed implementation/evaluator session surfaces for the supplied native
  worktree.
- **Actual:** Status `blocked`, diagnostic `MISSING_IDENTITY`, sessions `0`.
- **Severity:** significant
- **Action:** fix — keep the implementation hard stop, attempt the canonical local Qwen evaluator
  after S0 is reviewable, and do not silently substitute cloud OpenHands.
- **Evidence:** bootstrap command output; `supervisor.md` routes.

## 2026-08-03 — canonical local evaluator credential absent

- **What:** The formal local PLAN-EVAL route cannot start because its isolated child environment
  has no OpenRouter credential.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter --model
  qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns005-closegate`.
- **Expected:** A bounded Qwen canary followed by a separate-session PLAN-EVAL.
- **Actual:** Status `blocked`; diagnostic `auth_required`; credential `absent`; process exit code
  `null`, proving no provider turn ran.
- **Severity:** significant
- **Action:** defer — implementation remains hard-stopped pending either a configured local
  `OPENROUTER_API_KEY` or explicit owner authorization to make this a cloud-driven OpenHands Qwen
  evaluation run.
- **Evidence:** provider-canary structured JSON output; PR #1181 remains `status:plan-eval`.

## 2026-08-03 — D6 milestone evaluator composition waiver

- **What:** The 0.0.5 milestone orchestrator approved the locked plan and waived this delegated
  PR slice's local formal PLAN-EVAL/IMPL-EVAL sessions under the milestone-run evaluator protocol.
- **Source:** Owner/orchestrator steer for `release-0.0.5--orchestration`, wave 1; orchestrator drift
  decision D6; `.llm/harness/workflow/milestone-run.md` § Evaluator protocol for a milestone run.
- **Expected:** Ordinary run-loop would require local Qwen PLAN-EVAL before implementation.
- **Actual:** Per-PR evaluation composes draft→ready augment review, the OpenHands label surface,
  and the milestone orchestrator's per-PR pre-merge gate. The orchestrator explicitly ratified D1
  (narrow ENFORCE), #1171 provenance including issue-only `headSha: null`, and self-application.
- **Severity:** significant
- **Action:** accept — proceed to implementation; retain opposite-family review for code and all
  automated/pre-merge gates.
- **Evidence:** this steer, milestone-run evaluator protocol, PR #1181 timeline.

## 2026-08-03 — PR parser landed with provenance code slice

- **What:** The authoritative PR-section parser and its failing fixture landed in the same code
  slice as report provenance rather than waiting for the convention/template slice.
- **Source:** Shared `Report.ok` assembly and `check-close-gate_test.ts` surface.
- **Expected:** Plan listed S1 provenance and S2 PR enforcement separately.
- **Actual:** Keeping report construction atomic required the additive `prFindings` path and its
  regression fixture together; S2 remains the template/skill convention alignment slice.
- **Severity:** minor
- **Action:** accept — preserves reviewable atomic behavior and does not expand scope.
- **Evidence:** S1 diff and targeted 7-test suite.

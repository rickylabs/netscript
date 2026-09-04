# Drift Log: agent model routing and subscription expense policy revamp

## 2026-09-04 — Owner matrix supersedes the legacy routing policy

- **What:** Replace, rather than incrementally tune, the current delegation and fallback matrix.
- **Source:** `/home/agent/tmp/Harness Agents models matrix.md` and the owner's 2026-09-04
  instruction.
- **Expected:** `workflow/lane-policy.md` and `CANONICAL_ROUTE_POLICY` currently encode the
  pre-Astra policy.
- **Actual:** The new source of truth assigns Astra, Luna, SOL, Fable, Muse, GLM, Qwen, MiniMax,
  Gemini, Kimi, Grok, and provider precedence by task role and complexity.
- **Severity:** architectural
- **Action:** fix
- **Evidence:** owner matrix and completed repository policy inventory.

### Reconciliation

Repository inventory confirmed the flat legacy table, old evaluator escalation rules, and repeated
human-policy prose all conflict with the replacement matrix. The locked plan replaces active
selection and retains old IDs/lanes only at explicit persisted-state compatibility boundaries.

## 2026-09-04 — Current coordinator cannot attest its surfaced model identity

- **What:** The bootstrap task transport does not expose a repository-verifiable exact model/effort
  identity.
- **Source:** current Codex desktop task environment.
- **Expected:** every route records requested and observed model and effort.
- **Actual:** only the Codex task transport is observable; no exact identity receipt is available.
- **Severity:** significant
- **Action:** accept for bootstrap only; require identity receipts for launched evaluator and test
  routes.
- **Evidence:** `supervisor.md`.

## 2026-09-04 — Subscription expense watcher does not exist

- **What:** The owner requires Go and Ollama limits in the harness expense watcher.
- **Expected:** A pre-dispatch, structured allowance decision for paid fallback routes.
- **Actual:** The runtime persists quota/failure transitions but has no monetary subscription-window
  evaluator; OpenCode dispatch unconditionally loads OpenRouter auth.
- **Severity:** critical
- **Action:** fix in S3; fail closed on unknown/stale usage and prevent implicit overflow spending.
- **Evidence:** focused scan of `.llm/tools/agentic/runtime`, OpenCode runner, CLI task map, and
  tests.

## 2026-09-04 — PLAN-EVAL transport and family-composition correction

- **What:** Muse Spark 1.3 max was rejected before a turn by the current OpenRouter paid-training
  privacy setting, so cycle 1 used the matrix-declared Grok 4.6 xhigh fallback. The owner stated
  paid-training participation is allowed and must not be a harness blocker.
- **Finding:** The initial plan incorrectly rejected every same-family cartesian fallback pair and
  omitted exact evaluation round policies.
- **Severity:** significant plan defect, caught before production implementation.
- **Action:** compose evaluator fallbacks at selection time using vendor-level family; prove at
  least one legal evaluator per generator; encode exact owner round/repair/notification values; keep
  legacy lanes fail-closed for new selection.
- **Evidence:** `plan-eval.md`, cycle 1 `FAIL_PLAN`; no production file changed.

## 2026-09-04 — IMPL-EVAL cycle 1 found live dispatch-id and proof gaps

- **What:** The typed matrix was structurally correct, but two native Claude ids and two Ollama
  DeepSeek ids were not the concrete strings accepted by their current CLIs/catalogs. The S3 test
  proved the expense decision in isolation but did not observe the process-spawn boundary.
- **Severity:** significant bounded implementation defect.
- **Action:** fixed the four provider spellings in the central model catalog, added an injectable
  OpenCode spawn seam with a zero-call assertion on allowance exhaustion, and replaced the deleted
  resolver name in active tooling documentation.
- **Continuity:** IMPL-EVAL cycle 2 must resume OpenCode session
  `ses_f93062116ffe1eRZWsVs5ukzqK`; generator/evaluator vendor and session separation remains intact.
- **Evidence:** `evaluate.md` cycle 1 plus the structured focused check/test/format results in
  `worklog.md`.

## 2026-09-04 — Toolchain inventory reconciled without widening routing scope

- **What:** The host operator reports opencode `1.18.27`, Codex `0.153.2`, Claude `2.1.260`, agy
  `1.1.26` (self-updating in-run), Claude Desktop `1.44121.2`, ChatGPT Desktop `26.901.31953`, and
  OpenCode Desktop `1.18.27` as current.
- **Action:** record as live substrate evidence for this run. The routing repair does not restart
  agents or turn the model-matrix PR into a general toolchain-upgrade change.
- **Evidence:** owner message and PR #1989 live-substrate review comment.

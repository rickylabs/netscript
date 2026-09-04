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
- **Continuity:** IMPL-EVAL cycle 2 must resume OpenCode session `ses_f93062116ffe1eRZWsVs5ukzqK`;
  generator/evaluator vendor and session separation remains intact.
- **Evidence:** `evaluate.md` cycle 1 plus the structured focused check/test/format results in
  `worklog.md`.

## 2026-09-04 — Toolchain inventory reconciled without widening routing scope

- **What:** The host operator reports opencode `1.18.27`, Codex `0.153.2`, Claude `2.1.260`, agy
  `1.1.26` (self-updating in-run), Claude Desktop `1.44121.2`, ChatGPT Desktop `26.901.31953`, and
  OpenCode Desktop `1.18.27` as current.
- **Action:** record as live substrate evidence for this run. The routing repair does not restart
  agents or turn the model-matrix PR into a general toolchain-upgrade change.
- **Evidence:** owner message and PR #1989 live-substrate review comment.

## 2026-09-04 — IMPL-EVAL provider fallback and account settings

- **What:** Two Grok 4.6 xhigh turns through OpenCode Go stalled before producing a response. The
  matrix-declared Muse fallback reached Go but reported that its contributor-training opt-in was
  disabled. The same evaluator session then completed Grok 4.6 xhigh through OpenRouter and returned
  `PASS` at `8740b16de`.
- **Action:** treat Go/Grok as a bounded transport failure for this cycle; preserve logical model,
  xAI family, xhigh effort, and evaluator session while moving to the next capable provider. No
  implementation file changed during evaluation.
- **Resolution:** the owner subsequently enabled both OpenCode provider settings, so
  training-enabled and China-hosted model routes are now eligible. This is operational state, not
  committed policy.
- **Evidence:** OpenCode session `ses_f93062116ffe1eRZWsVs5ukzqK`, `evaluate.md` cycle 2, and owner
  confirmation with settings screenshot.

## 2026-09-04 — Post-evaluation live usage disproved the expense and tier-selection gates

- **What:** The owner dashboard showed OpenCode Go at 104.5% rolling usage after Grok 4.6 consumed
  about $3.13. The authenticated usage endpoint independently returned `rate-limited` / 100%.
- **Root cause 1:** S3 treated the public 12/30/60 USD figures as flat limits. OpenCode applies
  model-weighted inclusion; Grok's published $15 monthly allocation scales those windows to
  $3/$7.50/$15.
- **Root cause 2:** coordinator-authored IMPL-EVAL session `ses_f93062116ffe1eRZWsVs5ukzqK` was
  explicitly classified as `architecture` and dispatched to Go/Grok xhigh. Its `Vs5ukzqK` session
  suffix matches the cost history. No owner or milestone coordinator authorization for a privileged
  row had been recorded; a bounded harness refactor should have remained at `feature`.
- **Severity:** critical. The cycle-2 evaluator `PASS` remains immutable history for its evaluated
  head/scope but is superseded for merge readiness by this contradictory live evidence.
- **Action:** fetch authenticated Go usage before every dispatch; fail closed on unavailable,
  malformed, non-`ok`, or 100%-plus state; apply model-effective limits; require explicit owner or
  milestone-coordinator authority plus rationale for `complex` and `architecture`; prove denial
  occurs before both usage fetch (missing tier authority) and process spawn.
- **Live receipt:** `agentic:expense-watch` returned exit 4 with `provider_rate_limited`, Grok
  effective limits $3/$7.50/$15, and no model process was launched.

## 2026-09-04 — Cycle-3 source-fidelity repair

- **What:** Independent feature-tier IMPL-EVAL found that four DeepSeek fallback cells whose source
  matrix did not state an effort were encoded as `high` or `max`, while the other unstated cells
  correctly used `provider_default`.
- **Why it matters:** This run exists to prevent inferred tier/effort escalation. A paid fallback
  must not receive an invented effort, even when its workload tier itself is unprivileged.
- **Action:** Changed all four cells to `provider_default`, added direct owner-matrix assertions for
  each cell, regenerated the human table, and documented that the guarded Claude/OpenRouter command
  is a compatibility surface rather than an active matrix transport.
- **Evidence:** IMPL-EVAL cycle 3 `FAIL_FIX`; structured focused tests 59/59; 187-file agentic check
  with zero diagnostics; changed TypeScript format clean.
- **Provenance correction:** Cycle 3 ran on native Claude Opus 5 xhigh (Anthropic family). Its
  launch prompt overrode an obsolete Muse/Meta sentence in the committed brief; evaluator metadata
  is being corrected in the same evaluator session before the next cycle.

## 2026-09-04 — Post-PASS deep-research matrix amendment

- **What:** The owner added the previously omitted deep-research role before merge.
- **Route:** Gemini 3.8 Flash low/medium/high by workload tier and surface coverage, then Luna max.
- **Boundary:** Only native `agy` and native Codex transports are legal. Claude, OpenCode Go,
  Ollama, and OpenRouter are rejected even if they expose a matching logical model.
- **Why:** Deep research can accumulate large context windows and output; paid and scarce fallback
  routes must not silently absorb that cost.
- **Authorization:** `complex` and `architecture` remain privileged and require the existing owner
  or milestone-coordinator record.
- **Action:** Reopened PR #1989 as draft, extended typed policy/docs/guards/tests, and require a new
  separate-session IMPL-EVAL plus exact-head CI before promotion.

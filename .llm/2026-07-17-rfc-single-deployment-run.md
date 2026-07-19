# Session record — RFC single deployment (issue #820) orchestrator run

Date 2026-07-17 · run `.llm/runs/rfc-single-deployment--orchestrator/` · generator Claude Fable 5
· high (session `7f1fada7-805f-46cb-8ac4-5eb201bdc105`) · evaluator Codex GPT-5.6 Sol · max
(9 separate daemon threads).

## What happened

Seed/RFC harness run on the #820 charter: eis-chat POC forensics (@ `aeaf2df`, via authenticated
GitHub API after the local clone was sandbox-blocked), gap analysis G1–G8 against the PM/deploy
board, and nine revisions of the RFC design under nine adversarial Sol·max PLAN-EVAL cycles. The
owner authorized loop continuation after the standard two-failure escalation, then bounded the
loop at cycle 9. Final: **FAIL_PLAN with 6/8 plan-gate boxes PASS** (incl. Decisions-locked);
run closed as a design record (`closure.md`). No #820 comment (PASS-gated), zero board mutations
(evaluator-audited each cycle).

## Lessons worth keeping

- **The adversarial loop converges but is expensive**: each Sol·max cycle re-audited prior fixes
  for *real closure* and expanded into genuinely deeper systems territory (junction atomicity →
  journal durability → privilege separation → boot-order composability). Design-heavy RFCs
  should budget 3+ cycles or pre-decompose into evaluable chunks.
- **Artifact currentness is a first-class gate**: three cycles flagged stale
  worklog/context-pack/supervisor metadata as blocking. Reconcile resumable artifacts in the same
  edit batch as the plan rev, every time.
- **Self-containment rule**: never write "unchanged from rev N" after overwriting rev N — the
  candidate must stand alone (cycle-3 regression).
- **Launcher fallback recipe**: `agentic:launch-codex-slice` is Windows-host/implementation-slice
  shaped; from WSL-native sessions, the wrapper's inner client
  (`.llm/tools/agentic/codex/app-server-message-cli.ts --model gpt-5.6-sol --effort max --cwd …
  --message "$(brief)"`) launches the same daemon-attached thread (drift entry 4 pattern;
  `.llm/tmp/rfc820/launch-eval.ts`).
- **Evidence-honesty pays**: the evaluator repeatedly accepted designs only when grounded in
  tree/corpus citations (e.g. rejecting Servy tree-kill and the runtime `AspireResource` as
  unsupported) — write plans from the code, not from plausibility.

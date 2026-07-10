# Drift Log: PR 0B desired-state agentic runtime controller

## 2026-07-10 - Owner-authorized evaluator waiver

- **Expected:** Separate OpenHands PLAN-EVAL and IMPL-EVAL sessions.
- **Actual:** The owner explicitly requested no evaluator use and directed personal review to be
  treated as passed.
- **Severity:** significant
- **Action:** keep the waiver explicit; retain Tier-A substantive review and all acceptance gates.

## 2026-07-10 - Requested Codex effort was not applied

- **Expected:** GPT-5.6 Sol with per-launch effort `high`.
- **Actual:** Thread `019f4b72-2ea4-7050-917e-6d6918371265` uses GPT-5.6 Sol with daemon-default
  effort `medium`.
- **Severity:** significant
- **Action:** keep the actual route explicit and continue with the sole attached worker; canonical
  route enforcement remains #581.

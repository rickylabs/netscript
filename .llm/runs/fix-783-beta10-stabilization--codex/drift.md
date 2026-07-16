# Drift Log: fresh-ui Markdown direct rendering

## 2026-07-16 — Direct unified dependency is explicit

- **What:** The issue lists three new registry dependencies but the implementation also imports
  `unified` directly.
- **Source:** Scratch generated-consumer `deno check`.
- **Expected:** The removed wrapper's dependency list would be replaced only by `remark-parse`,
  `remark-rehype`, and `rehype-react`.
- **Actual:** Without `npm:unified@^11`, Deno correctly rejects the direct import as undeclared.
- **Severity:** minor
- **Action:** fix — declare `unified` explicitly in the registry item.
- **Evidence:** `.llm/tmp/issue-783-repro/apps/dashboard` research fixture.

## 2026-07-16 — Baseline copied renderer does not type-check

- **What:** Reproduction found three type errors in addition to the issue's compatibility/bundle
  cost report.
- **Source:** Generated Fresh consumer check before any fix.
- **Expected:** Current renderer would compile but carry an unnecessary compatibility/bundle cost.
- **Actual:** It fails on sanitize schema nullability, plugin tuple inference, and the custom
  citation element mapping.
- **Severity:** significant
- **Action:** fix at the registry template and add a failing-layer regression.
- **Evidence:** Worklog baseline gate and research finding F3.

## 2026-07-16 — Tier-D thread is not daemon-attached

- **What:** Current Codex thread id exists and the resume helper validates its steering command,
  but the runtime controller reports no managed sessions.
- **Source:** `CODEX_THREAD_ID`; `deno task agentic:runtime status|doctor`; dry-run resume command.
- **Expected:** Tier-D mobile-visibility proof includes daemon-managed remote-control status.
- **Actual:** `sessions: 0`; no attachment claim can be made.
- **Severity:** significant
- **Action:** accept for this owner-launched lane and record truthfully; supervisor retains external
  orchestration responsibility.
- **Evidence:** `supervisor.md`.

## 2026-07-16 — Evaluator dispatch remains supervisor-owned

- **What:** This implementation lane will not launch PLAN-EVAL or IMPL-EVAL.
- **Source:** Explicit user constraint.
- **Expected:** Harness normally blocks implementation on a separate PLAN-EVAL pass.
- **Actual:** Owner directed this lane to provide normal plan/worklog artifacts only and reserved all
  evaluator triggers to the supervisor.
- **Severity:** significant
- **Action:** accept as the written owner override; do not self-certify.
- **Evidence:** User prompt and `supervisor.md`.

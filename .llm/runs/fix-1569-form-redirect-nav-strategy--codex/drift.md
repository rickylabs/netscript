# Drift Log: managed form redirect navigation strategy

## 2026-08-12 — boolean false differs between plain Preact and Fresh SSR

- **What:** The issue states that boolean `false` cannot express the document opt-out because
  Preact drops it. That is true for plain `preact-render-to-string`, but not for an actual Fresh
  2.3.3 server render.
- **Source:** Local `deno eval` probes plus pinned Fresh source.
- **Expected:** Boolean `false` is always omitted.
- **Actual:** Fresh's `preact_hooks.ts:185-197` rewrites/serializes it as
  `f-client-nav="false"`; the client reads that literal at `partials.ts:41-45`.
- **Severity:** significant
- **Action:** fix the abstraction leak with a typed strategy, retain honest mechanism evidence, and
  map `document` to the literal string for renderer-independent reliability.
- **Evidence:** `research.md`; command output will be preserved in `worklog.md` and the PR body.

## 2026-08-12 — evaluator route intentionally not launched

- **What:** Canonical Codex evaluation routes name Fable/local evaluator sessions.
- **Source:** `.llm/harness/workflow/lane-policy.md` and the slice prohibitions.
- **Expected:** Separate PLAN/IMPL evaluation under ordinary harness policy.
- **Actual:** Owner explicitly prohibits Fable, local evaluators, manual OpenHands, and ready-state
  transition; evaluation is automatic label-driven lifecycle responsibility only.
- **Severity:** significant
- **Action:** accept the owner override, keep the PR draft at `status:impl`, and report evaluation as
  pending/orchestrator-owned.
- **Evidence:** `supervisor.md`; slice brief.

# Drift Log: plan-openapi-mcp-plugin--seed

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-03 — Run operates under brief-mandated overrides

- **What:** No draft PR, no board mutations, no runtime validation (shared machine: release
  orchestrator active — no AppHost/docker/scaffold), generator-only stage.
- **Source:** `briefs/generator-brief.md`
- **Expected:** `seed-run.md` stage A opens a draft PR; run-loop expects runtime gates.
- **Actual:** Direct commits on `plan/openapi-mcp-plugin`; design claims cite source lines instead
  of live runs; adversarial pass is supervisor-dispatched (Codex GPT-5.6 Sol xhigh).
- **Severity:** minor
- **Action:** accept (owner-directed)
- **Evidence:** `supervisor.md` § Recorded lane/eval overrides

## 2026-08-03 — Adversarial dispatch moved into the generator-side session (owner-directed)

- **What:** The owner directed this session to write the adversarial brief and dispatch the
  Codex GPT-5.6 Sol xhigh pass itself, folding in three 0.0.4 release-orchestrator learnings
  (predicate-bug proof obligation; absence-of-red-is-not-green; RFC-instrument scope guard) plus
  the #1117-sizing contradiction as required attack surface.
- **Source:** owner message, 2026-08-03; brief at `briefs/adversarial-sol-brief.md`.
- **Expected:** `supervisor.md` recorded the adversarial pass as "supervisor-dispatched, not by
  this session".
- **Actual:** Dispatch via `deno task agentic:launch-codex-slice` (route: openai / gpt-5.6-sol /
  xhigh — matches lane-policy `review_claude`), same worktree, findings-only contract writing
  `adversarial-sol.md`. Session separation (generator ≠ reviewer) is preserved — the reviewer is
  a distinct Codex thread; this session only launches and later triages.
- **Severity:** minor
- **Action:** accept (owner-directed); supervisor.md routes table remains accurate on identities
- **Evidence:** launch record + thread id in `codex-thread-ids.md` (written by the launcher)

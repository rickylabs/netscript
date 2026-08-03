# Drift Log: sagas generated KV adapter registration

Drift is append-only.

## 2026-08-04 — Milestone orchestration artifacts absent from delegated checkout

- **What:** `.llm/runs/release-0.0.5--orchestration/` is not present at the branch baseline.
- **Source:** direct filesystem search after reading milestone-run workflow.
- **Expected:** Dispatch identifies this slice as part of that milestone run and cites ruling D6.
- **Actual:** The per-PR worktree contains the workflow policy but not the orchestrator's live run dir.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Owner dispatch text is treated as authoritative; local run records the exact waiver.

## 2026-08-04 — Service overlay legacy references absent

- **What:** `.llm/harness/archetypes/SCOPE-service.md` references `.claude/04-services.md` and
  `.claude/06-infrastructure.md`, neither of which exists in this checkout.
- **Source:** direct path check and repository filename search.
- **Expected:** Both additional-read files exist.
- **Actual:** No matching files exist; current service contracts, Aspire topology, plugin source,
  and runtime logs remain available.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Service gates are retained; no product scope is changed.

## 2026-08-04 — Milestone PLAN-EVAL composition

- **What:** No local formal PLAN-EVAL is launched for this per-PR slice.
- **Source:** Owner/orchestrator dispatch ruling D6 and `milestone-run.md` evaluator protocol.
- **Expected:** Normal run-loop requires a separate local formal PLAN-EVAL.
- **Actual:** Per-PR evaluation composes draft→ready review, OpenHands label surface, and the
  orchestrator pre-merge gate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`; `worklog.md` Plan Gate row.


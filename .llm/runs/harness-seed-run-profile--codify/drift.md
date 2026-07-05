# Drift — harness-seed-run-profile--codify (append-only)

| # | Date | Severity | Drift |
| --- | --- | --- | --- |
| 1 | 2026-07-05 | note | Owner-directed eval configuration for this docs-only run: Codex adversarial + single OpenHands separate-session verdict + owner ratification (in place of the two-pass PLAN-EVAL/IMPL-EVAL split, which presumes a plan→implementation phase boundary this artifact-only run does not have). Recorded in `supervisor.md`; both hard invariants preserved. |
| 2 | 2026-07-05 | significant | Exemplar run `plan-roadmap-expansion--seed` never wrote `supervisor.md`, violating lane-policy § Supervisor identity; identity recovered only by transcript search. Root-cause candidate: no template exists for the mandatory file. Fixed in this run (template + checklist enforcement in the profile). |
| 3 | 2026-07-05 | significant | Precise scope of drift #1 (adversarial finding #6): what this run skips is the **PLAN-EVAL pass** (owner-directed, docs-only artifact run with no plan→implementation boundary). The separate-session OpenHands verdict IS run (IMPL-EVAL analog → `evaluate.md`) and both lane-policy hard invariants hold. This is an exception to `run-loop.md`'s two-pass structure, not something the harness docs authorize on their own — it ships to the owner for ratification with PR #471. |

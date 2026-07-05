# Drift — harness-seed-run-profile--codify (append-only)

| # | Date | Severity | Drift |
| --- | --- | --- | --- |
| 1 | 2026-07-05 | note | Owner-directed eval configuration for this docs-only run: Codex adversarial + single OpenHands separate-session verdict + owner ratification (in place of the two-pass PLAN-EVAL/IMPL-EVAL split, which presumes a plan→implementation phase boundary this artifact-only run does not have). Recorded in `supervisor.md`; both hard invariants preserved. |
| 2 | 2026-07-05 | significant | Exemplar run `plan-roadmap-expansion--seed` never wrote `supervisor.md`, violating lane-policy § Supervisor identity; identity recovered only by transcript search. Root-cause candidate: no template exists for the mandatory file. Fixed in this run (template + checklist enforcement in the profile). |

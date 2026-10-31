# Plan & Design — READY FOR REVIEW

Archetype 6 CLI/tooling; documentation output only, no new exports or runtime behavior.
LOCKED: apply owner patch with git apply; verify named files, CLI spellings and MCP slugs; correct inaccurate advice minimally.
One implementation slice: four supplied files plus this run's worklog/context updates.
PLAN-EVAL: N/A — bounded text and semantic regression assertions, contract supplied by owner.
Gates: agent-conventions, web-scaffold, app-navigation, public-command-tree tests; scoped structured check/lint/fmt; quality:gate; release:preflight; docs:accuracy; full one-pass scaffold.runtime smoke.
Carrier generation only if changed source is consumed by a carrier generator.
Risks: docs recipe pending #2554, token init default differs from scaffold default. Verify sources and document dependency.
No new architectural debt. No unresolved design choices. Docs and skills implementation remain #2554's responsibility.
Do not merge before mandatory independent implementation evaluation and applicable gates complete.

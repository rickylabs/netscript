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

## Close-gate remediation

User requests fixing current CI close-gate failure. Required Closes line stays. LOCKED: normal-merge companion #2554 at b2fe065a75ee80675159dc8e1ff048a2baf8bf83, making this PR self-contained for all #2552 acceptance. Docs branch advanced since original combined audit, so rerun docs/corpus/carrier gates on current merged content; never reuse stale proof. Same independent evaluator reviews combined content and issue evidence before sign-off. Publish structured acceptance evidence and synchronize only verified boxes, then rerun close-gate. No override, rebase or force push.

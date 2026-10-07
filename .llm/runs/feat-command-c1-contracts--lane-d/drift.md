# Drift — append only

- 2026-10-07, operational: the task-local owner directive selects the evaluator route, generator request, sequential leaf topology and immediate stop on failed PLAN-EVAL. It also forbids operational host/path/credential/allowance detail in public artifacts; retain only repository-relative evidence.
- 2026-10-07, baseline finding: #1455 is closed but the task definition currently has no payloadSchema field. The planned saga task constructor must require a schema-bound worker definition; this gap cannot be papered over with an independently inferred saga payload generic.
- 2026-10-07, tooling: rg and rtk are unavailable. Focused find/grep and native git/gh are used. The first MCP find_guidance request was rejected for the wrong input field; the corrected intent request succeeded. search_docs succeeded; neither returned a command-kit implementation recipe.

use harness

Perform the independent formal IMPL-EVAL for PR #1192, issue #1191, run
`.llm/runs/fix-scaffold-sqlite-allow-ffi--1191/`. This is evaluation only: inspect and test the
implementation and evidence; do not implement fixes or change product source.

## SKILL

- `.agents/skills/netscript-harness` — apply the formal IMPL-EVAL protocol and verdict contract.
- `.agents/skills/netscript-pr` — use the structured IMPL-EVAL comment vocabulary and close gate.
- `.agents/skills/netscript-cli` — evaluate scaffold command emission and generated output.
- `.agents/skills/aspire` — assess the recorded real AppHost health and OTEL evidence.
- `.agents/skills/netscript-doctrine` — check the Archetype 6 CLI/tooling boundary.
- `.agents/skills/netscript-tools` — use trustworthy scoped validation and raw git evidence.
- `.agents/skills/rtk` — compress read-heavy git/gh output without replacing verdict sources.
- `.agents/skills/jsr-audit` — assess the recorded CLI doc/publish surface gates.

## Evaluation contract

Evaluate all five checked Definition-of-Done boxes in the PR body against the actual diff and
tracked evidence. In particular:

1. Verify the generator adds exactly one `--allow-ffi` to SQLite/libsql-backed service commands,
   including explicit service permissions, without broadening none/Postgres/MySQL/MSSQL.
2. Verify the semantic generated-output test would fail without the source fix and covers the
   emitted permission set.
3. Inspect `proofs/red-runtime.json` and `proofs/green-runtime.json` for genuine same-scaffold
   exit-1/Unhealthy RED and Running/Healthy GREEN with populated `healthReports`, real HTTP health,
   and OTEL evidence. Do not start another AppHost: #1184 owns the serialized full runtime slot.
4. Inspect the unchanged-script result `P2-db.json` and the epic #1126 impact link. Treat its
   hardcoded no-DB classifier fields as the recorded deferred finding; judge whether the numeric DB
   measurements still substantiate the S4/S6 impact assessment.
5. Confirm scoped wrappers, helper tests, `quality:gate`, doc-lint, publish dry-run, and leak hygiene
   are truthfully recorded. Foreign resources in the leak report are not owned by this run.

Run the smallest non-live checks needed to independently validate the diff. Verify there is no
`deno.lock` churn and do not modify or commit `deno.lock` or scratch output. Write the formal
verdict to `.llm/runs/fix-scaffold-sqlite-allow-ffi--1191/evaluate.md`, with each gate and any
findings explicit. Write the workflow summary to `OPENHANDS_SUMMARY_PATH`. The summary must contain
one exact line `OPENHANDS_VERDICT: PASS` only if every acceptance box is supported; otherwise use
the appropriate exact failure token and issue `[PHASE: IMPL-EVAL] [VERDICT: CHANGES_REQUESTED]`
with actionable findings. Do not promote or merge the PR.

use harness

# S2 implementation follow-up — P2 no-DB measurement and explicit DB failure

Resume the existing tracked Codex implementation thread in
`/home/codex/repos/ns005-proofs-impl`. Read the current run artifacts, the approved
`reviews/S1-fable-rereview.md`, plan D3/D7/D8/D10/D12, issue #1128, and RFC §4 before acting.

Execute S2 only, then stop for supervisor/Fable review. Do not start P3. Do not commit, push, edit
GitHub, update the seed RFC, or change any product/template file.

The supervisor accepts S1 and authorizes the independent no-database P2 half. The SQLite/DB P2
half remains failed/rescoped because the generated service lacks `--allow-ffi`. Do not rerun,
patch, wrap, or manually relaunch that DB scaffold, and do not reuse the unattributed P1 HTTP 200.
Carry the normalized P1 runtime failure forward as the DB-side P2 evidence. Because D7 requires
both scaffolds, the resulting P2 verdict must be explicit `FAIL`, never partial PASS or NOT_RUN.

For the no-database half:

1. Re-inventory shared AppHosts, containers, and relevant ports read-only; leave every foreign or
   unproven resource untouched.
2. Create a fresh local-source no-database scaffold under the approved `.llm/tmp/` root. Run at
   most one owned AppHost and capture exact ownership/PID/port before fetching the live
   `/api/openapi.json` document.
3. Commit-ready experiment/evidence must record the D7 schema for the valid no-DB live spec:
   compact UTF-8 spec bytes; every operationId and shape classification; discovery-row bytes;
   request, response, error, and all-schema views in source and local-dereferenced form; every
   non-2xx response/envelope observation; local/external/unresolved refs; and the recursively
   observed OpenAPI/JSON-Schema keyword subset.
4. Compare every measured array/string with `maxItems=50` and `maxStringLength=2000`, and state
   explicitly that the current MCP path has no whole-result byte ceiling. Never infer a common
   error envelope where the no-DB template lacks one.
5. Normalize paths/process noise and record commands, versions, timestamps, teardown, root-lock
   hash, and attribution evidence. Stop the exact owned tree and prove zero owned survivors before
   writing the verdict.
6. Run the scoped check/lint/fmt wrappers on owned TypeScript and scan for lint ignores. Update
   worklog/context/drift. Leave a stable uncommitted S2 diff and stop.

The verdict must distinguish measured no-DB results from the failed DB branch and explain that a
skipped/blocked branch maps to FAIL under D7/D12. Do not claim #1128 acceptance or issue an
IMPL-EVAL disposition.

use harness

Review PR 1204 as the OpenHands component of the milestone-run composed evaluator protocol. This is
review-only: do not modify source, run artifacts, `deno.lock`, or any file; do not commit or push.

## SKILL

- `netscript-harness` — read the run artifacts and honor the milestone evaluator waiver.
- `netscript-doctrine` — evaluate `packages/mcp` against Archetype 2.
- `jsr-audit` — verify the public export and publish evidence.
- `netscript-tools` — use authoritative gates and preserve lock hygiene.
- `netscript-pr` — report a structured REVIEW verdict without changing PR metadata.
- `openhands-handoff` — write the required OpenHands summary output.

## Review scope

Read issue 1132, RFC 1123, the full diff from `main`, and
`.llm/runs/feat-openapi-mcp-read-tools--s6/`. Verify:

1. `truncated: true` iff service or operation rows were actually dropped; no central silent cap.
2. `operationCount` is absent, not zero, whenever no parsed spec was fetched.
3. S5's `sources` block is surfaced verbatim.
4. All three tools compose S4 projection and S5 directory rather than re-deriving either.
5. Receipts use S8 post-output-validation settlement.
6. Registry moves from the live 14 baseline to 17, contracts/exports/docs agree, and no unrelated
   tool is invented.
7. No new lint ignores, unsafe casts, lock churn, speculative abstractions, or out-of-scope live
   scaffold/AppHost work.

Run the smallest checks needed to verify claims. Report PASS or actionable findings with severity
and file:line evidence. Include raw exit codes for any commands run. Write the required
`OPENHANDS_SUMMARY_PATH`; do not trust or reuse a stale persistent summary.

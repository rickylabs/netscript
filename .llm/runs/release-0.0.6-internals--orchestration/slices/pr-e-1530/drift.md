# PR-E #1530 Drift

## D-1 — standalone RED commit supersedes locked combined E1 row

The orchestrator rail Design table groups the RED test and its exemption into one landed-green E1
slice. The later implementation dispatch explicitly requires the failing test as its own commit.
The dispatch is followed; E2 immediately restores green.

## D-2 — desktop-consumer allowance path is SDK, not Fresh

The dispatch and live issue name
`packages/fresh/tests/type-fixtures/desktop-consumer_type.ts:42`, but the baseline scanner JSON and
repository search locate the stated allowance at
`packages/sdk/tests/type-fixtures/desktop-consumer_type.ts:42`. The Fresh file has no such allowance.
E4 will remove the actual SDK allowance so the required scan-owned count can fall 10 → 8.

## D-3 — scoped format initially exposed adjacent legacy formatting

The required scoped format wrapper initially exited 1 because the existing `escape.ts` fixture setup
in `scan-code-quality_test.ts` was not in current formatter shape. Since E1/E3 already own that file,
`deno fmt` was applied to that file only. The wrapper rerun exits 0; no other file was formatted.

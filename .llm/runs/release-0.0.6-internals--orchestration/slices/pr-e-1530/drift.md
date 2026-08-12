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

## D-4 — bundled tool edits require same-PR asset regeneration

CI found a real coupling omitted from the issue, implementation brief, rail plan, and original gate
set: `.llm/tools/quality/scan-code-quality.ts` is embedded as source in the generated CLI consumer
tool asset. Editing a bundled `.llm/tools/` file therefore requires `deno task gen:assets-barrel` in
the same PR, followed by an idempotence check. Without it, CI's `Generated asset freshness` step
fails even when the tool's direct tests and quality gates are green.

The canonical generator changed only `agent-tools.generated.ts`: the scanner source plus its bundle
hash. Contrary to the initial CI steer, `skills.generated.ts` contains command guidance rather than
an independent full-source copy, so it correctly remained unchanged. No unrelated generated drift
was absorbed.

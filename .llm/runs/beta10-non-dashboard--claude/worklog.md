# Worklog — beta.10 non-dashboard stream

## Slice 1 — P0(a): `run-deno-lint.ts` swallowed batch failures (PR #715 `quality` job)

**Status:** implemented, gates green locally. Awaiting IMPL-EVAL (separate session).

### Reproduction

`deno task lint` at PR #715 head (`5b1a9877`) reproduced CI run `29202385340` / job `86675839110`
byte-for-byte:

```json
{"source":{"mode":"command","exitCode":1},"selection":{"filesSelected":1685,"batches":9},
 "summary":{"totalOccurrences":0,...},"groups":[]}
```

Exit 1, nine batches, zero occurrences, **no diagnostics**.

### Bug 1 — the wrapper (tooling)

`runLint()` concatenated each batch's stdout+stderr into a single `text` blob that was only ever fed
to `parseOccurrences()`. A batch that exits non-zero *without* emitting a parseable lint occurrence
— i.e. a **crash**, not a finding — had its exit code propagated while its stderr was discarded by
the parser. Result: exit 1 with an empty `groups[]` and nothing in the log.

Fix (`.llm/tools/run-deno-lint.ts`):

- Modelled the crash class as `BatchFailure` (`batchIndex`, `exitCode`, `fileCount`, `files`,
  `stderr`, `stdout`).
- `runLint()` classifies each non-zero batch: parseable occurrence ⇒ ordinary lint finding; zero
  parseable occurrences ⇒ `BatchFailure`.
- `BatchFailure[]` is surfaced on the JSON report (`failures`) **and** rendered to stderr via
  `formatFailures()`.
- Added the never-silent invariant: non-zero exit + empty `groups[]` + no captured failure now
  prints an explicit "re-run with `--batch-size 1`" diagnostic rather than exiting silently.
- Made `runLint` injectable (`BatchRunner`) and guarded `main()` behind `import.meta.main` so the
  behaviour is testable without shelling out.

Cross-check: `run-deno-check.ts` (`failedBatches`) and `run-deno-fmt.ts`
(`failedWithoutParsedFindings`) already model failed batches. `run-deno-lint.ts` was the only
sibling missing it — this fix aligns it with them rather than inventing a new shape.

### Bug 2 — the real failure the wrapper was hiding

With the wrapper fixed, the underlying error surfaced immediately:

```text
--- batch 2 — exit 1 — 200 file(s)
stderr:
error: Failed to parse "workspace" configuration.
Caused by:
    invalid type: string "packages/*", expected struct WorkspaceConfig
```

Source: `packages/mcp/tests/fixtures/doctor/broken/deno.json` — `{ "workspace": "packages/*" }`, an
**intentionally malformed** fixture for the MCP doctor's broken-project test. The lint selection was
picking up `packages/mcp/tests/fixtures/doctor/broken/netscript.config.ts`; `deno lint` walks up
from each file to discover a config, finds the deliberately-broken `deno.json`, and aborts before it
ever lints anything.

Fix: the doctor fixtures are synthetic **projects** (each carries its own `deno.json`), not library
source, and were never meaningful lint targets. Excluded `packages/mcp/tests/fixtures/` from the
root `lint` task selection and from `lint.exclude` in `deno.json`.

Blast radius was checked before choosing the exclusion: a blanket `tests/fixtures` exclusion would
have silently dropped real lint coverage on `packages/ai`, `packages/cli`, and `packages/fresh`
fixture code, so the exclusion is scoped to the one fixture tree that is a nested Deno project.

### Regression test

`.llm/tools/run-deno-lint_test.ts` — 4 cases, all pinning the distinction the bug turned on:

1. a batch failing with **no** occurrences is captured, and `formatFailures()` renders exit code,
   file set, and stderr;
2. a batch failing **with** occurrences is a lint finding, not a `BatchFailure`;
3. the `No target files found.` empty-batch exit is still tolerated;
4. every failing batch is reported, not just the first.

### Gates

| Gate | Command | Verdict |
| --- | --- | --- |
| Regression test | `deno test --allow-all .llm/tools/run-deno-lint_test.ts` | **PASS** — 4 passed, 0 failed |
| Lint (the failing CI job) | `deno task lint` | **PASS** — exit 0, 1682 files, 9 batches |

File count moved 1685 → 1682: exactly the three `.ts` files under the excluded doctor fixture tree.

**Self-certification:** none. These are generator-session results only; the verdict is IMPL-EVAL's.

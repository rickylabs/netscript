# Evidence — #1867 F-3 generator clean-tree guard

All command verdicts record the child command's real exit with `out=$(command); rc=$?`; no verdict
is derived from a pipeline.

## Baseline

| Check | Result |
| --- | --- |
| Branch | `fix/mcp-corpus-generator-clean-tree-guard` |
| HEAD | `3066a0cc5f1573a326f8da54891d4be1434acaac` |
| `origin/main` after fetch | `3066a0cc5f1573a326f8da54891d4be1434acaac` |
| Merge base | `3066a0cc5f1573a326f8da54891d4be1434acaac` |
| Initial status | clean |
| Issue boundary | #1867 supervisor comment assigns F-2 to merged #1929 and leaves F-3 here |

## RED

### Initial committed RED — `8a35c571c`

- Detached worktree add: exit 0.
- Raw focused test: `RED_TEST_REAL_EXIT=1` — 8 passed, 4 failed.
- Detached worktree removal: exit 0.
- Expected product-contract failures: dirty package and dirty plugin generation both returned 0;
  `--allow-dirty` was rejected as unknown.
- Fixture correction required: setting PATH to a nonexistent directory also prevented Deno's
  `--allow-run=deno,git` allowlist from resolving the nested Deno executable, so the no-Git case
  failed before it could test the intended warning. The authoritative RED rerun uses a PATH that
  contains Deno but not Git.

### Authoritative committed RED — `33ec78509`

- Detached worktree add: exit 0.
- Raw focused test: `RED_TEST_REAL_EXIT=1` — 8 passed, 4 failed in 41 seconds.
- Detached worktree removal: exit 0.
- Dirty package generation and dirty plugin generation both wrongly returned 0.
- `--allow-dirty` returned 1 as an unknown argument.
- With Deno still resolvable and Git unavailable, generation returned 0 but emitted only Deno's
  permission-resolution information, not the required generator warning.
- Clean write, outside-read-set write, and dirty-tree `--check` all returned 0, establishing the
  unaffected direction before implementation.

## GREEN and required validation

All GREEN verdicts ran at implementation commit
`1668173e82c6d378d90dd59c1638a425c7fd490a`.

| Command / check | Real exit | Result |
| --- | ---: | --- |
| `deno test --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts` | 0 | PASS — 12 passed, 0 failed in 36 seconds |
| structured test wrapper over the same focused test | 0 | PASS — 12 passed, 0 failed, 0 ignored; `durationMs: 36152` |
| `deno task check:mcp-export-corpus` | 0 | PASS — schema 1, framework 0.0.6, 35 packages, 273 subpaths, 7,815 symbols |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | 0 | PASS — 346 files, 3 batches, 0 failed batches/occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools --ext ts` | 0 | PASS — 346/346 files processed, 2 batches, 0 findings/refusals |
| `git diff --check 3066a0cc5...HEAD` | 0 | PASS — no whitespace errors |

The focused integration suite creates a detached worktree from committed `HEAD` for every case:

| Behavior | Result | Load-bearing evidence |
| --- | --- | --- |
| Clean tree writes | PASS | Generated process exit 0; corpus bytes remain deterministic; deliberately old mtime is replaced. |
| Dirty package refuses | PASS | Non-zero exit; stderr names `packages/sdk/mod.ts`; output bytes equal the pre-run snapshot. |
| Dirty plugin refuses | PASS | Non-zero exit; stderr names `plugins/ai/mod.ts`; output bytes equal the pre-run snapshot. |
| Outside dirty path writes | PASS | Modified `AGENTS.md` does not enter the scoped probe; process exits 0 and replaces old artifact mtime. |
| Dirty `--check` remains freshness-only | PASS | Modified `packages/sdk/README.md`; check exits 0 and emits no dirty-path diagnostic. |
| Explicit override | PASS | Dirty write exits 0; stderr names `--allow-dirty` and `packages/sdk/README.md`; artifact is written. |
| Git unavailable | PASS | PATH retains Deno but not Git; generator warns loudly and writes successfully. |

## Official task refusal

A detached worktree at `1668173e8` exercised the actual task wiring with
`packages/sdk/README.md` dirty:

- Worktree add: exit 0.
- `deno task gen:mcp-export-corpus`: real exit 1.
- Diagnostic includes the exact porcelain line ` M packages/sdk/README.md`, the refusal, and the
  explicit `--allow-dirty` recovery path.
- Artifact SHA-256 before and after:
  `d63bf0a1e6bff7f2f588f804e8779b0fc1fa8dd5c185bb2434a9a5dc6cfd1b4f`.
- Worktree removal: exit 0.

## Scope and hygiene

- `git diff --exit-code 3066a0cc5 HEAD -- .github deno.lock packages plugins`: real exit 0.
  Therefore no workflow, lockfile, corpus, package, or plugin content changed.
- Changed-file enumeration: real exit 0; exactly the generator, its test, `deno.json`, and the
  three authorized run artifacts.
- The `deno.json` delta only expands `gen:mcp-export-corpus` from `--allow-run=deno` to
  `--allow-run=deno,git`; `check:mcp-export-corpus` is byte-unchanged.
- `git diff --check 3066a0cc5...HEAD`: real exit 0.
- `deno task e2e:cli` was not run, per explicit instruction.

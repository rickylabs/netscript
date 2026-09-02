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

Pending slices 2–3.

## Scope and hygiene

Pending final audit.

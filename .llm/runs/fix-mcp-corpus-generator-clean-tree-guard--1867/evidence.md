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

Pending slice 1.

## GREEN and required validation

Pending slices 2–3.

## Scope and hygiene

Pending final audit.

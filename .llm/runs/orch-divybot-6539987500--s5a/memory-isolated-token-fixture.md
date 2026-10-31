# 2026-10-31 — Copied module import scopes and frozen context

Fresh UI token-build's frozen stale/missing-artifact test copies token source
outside the workspace. --config pointing back to a workspace member does not
apply its import scope to copied modules, so new bare zod imports failed.
Keep the original workspace --config and actual private --lock --frozen. Supply
an explicit import map for copied modules' zod alias, using the actual root
catalog range (no new version pin). Temp files remain under Deno's TMPDIR and
finally removes them. Every artifact nonrepair/output byte assertion stays.

Dead end: a standalone temp config containing imports/catalog resolves zod but
changes the workspace root. The real frozen lock refuses a large graph prune.
Do not disable frozen mode, copy/update locks, or modify product imports. A
native probe confirms original config + explicit import map resolves the alias
while preserving the actual frozen private lock context. The targeted full
negative-control test must prove this, not just check/lint/fmt.

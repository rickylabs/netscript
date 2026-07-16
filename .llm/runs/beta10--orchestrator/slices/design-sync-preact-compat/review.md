# Orchestrator review — design-sync-preact-compat

## Finding R-1 — literal NUL bytes in `tools/design-sync/mod.ts` (line 95, `treeHash`)

The slice replaced the separator in the idempotence hash input:

```ts
// before
entries.map(([p, c]) => `${p} ${c} `)
// after (as written to disk — two raw 0x00 bytes)
entries.map(([p, c]) => `${p}<NUL>${c}<NUL>`)
```

**The intent is right.** A NUL delimiter removes the path/content boundary ambiguity that a space
separator leaves in the tree hash — a genuine improvement to the "Sync idempotence" fitness gate.

**The execution is wrong.** The bytes are *literal* `0x00` in the source, not the `\0` escape. Effects:

- `git` classifies `mod.ts` as **binary** (`Bin 6321 -> 6056 bytes`) — the diff is unreviewable, and
  the file would land as an opaque blob in a TypeScript source tree.
- `file(1)` reports `data`, not text.
- Nothing catches it: `deno check` passes (the TS parser tolerates NUL in a template literal), lint
  passes, and `design:sync check` passes — the hash is *self-consistent*, so idempotence is green.
  A gate suite that is entirely green while shipping a corrupt-looking source file is the point of
  interest here.

**Fix:** use the escape — `` `${p}\0${c}\0` `` — identical runtime semantics, plain-text source,
reviewable diff.

**Status:** steering the live thread (do not hand-fix; the orchestrator coordinates).

## Slice outcome (commit `3e297c77` — "fix(design-sync): complete Preact value compatibility")

**Accepted:** the D-1 fix itself. The `preact-compat` shim now covers the registry's real Preact
value surface (not a special-case for `h`), unmapped value imports now fail loudly inside
`convertUnits` naming unit/file/symbol *before* `deno bundle` is reached, and regression tests cover
both the positive and negative paths. `deno task design:sync` runs green twice with a reproduced
bundle hash (`f0714aeb10ab`); parity green; all six trap checks present. The two remaining warnings
(`theme-toggle` weak props, the new widget's required preview props) are pre-existing content-level
findings, not converter regressions.

**Rejected: R-1 shipped into the commit.** The literal NUL bytes were *not* fixed before commit —
`git show --stat` reports `tools/design-sync/mod.ts | Bin 6321 -> 6236 bytes`. A TypeScript source
file is now in history as an opaque binary blob.

This is the finding worth carrying forward: **every gate was green while the defect landed.**
`deno check`, `deno lint`, `deno fmt`, the unit tests, parity, all six trap checks, and the
idempotence gate all passed — because the hash is *self-consistent*, so idempotence cannot see it,
and the TS parser tolerates NUL inside a template literal. The only thing that caught it was reading
the actual diff and noticing `Bin` where a line-count belonged.

**Steered** (thread `019f5886…`, live and daemon-registered → `codex-resume` is the correct path):
keep the NUL-delimiter *intent* (it genuinely improves the tree hash), replace the raw bytes with the
`\0` escape, prove NUL count is 0, prove git sees the file as text again, and re-run the full gate.
The idempotence hash value will change — the separator bytes are hash input — which is expected; what
must hold is that the two builds agree.

# Acceptance evidence — feat-prisma-mysql-adapter-surface--1293

## Immutable content identity

- Content head: `3dee41263e5e34a9f59972edb43a345c8d4494c0`
- Branch: `feat/prisma-mysql-adapter-surface`
- Surface: `packages/prisma-adapter-mysql`
- The content tree was clean and the local head equaled
  `refs/heads/feat/prisma-mysql-adapter-surface` before the gates ran.

## Contracted receipt set

Each receipt records `gitHead == actualGitHead ==
3dee41263e5e34a9f59972edb43a345c8d4494c0` and has `outcome: PASS`:

| Gate | Invocation ID | Receipt |
| --- | --- | --- |
| `check` | `prisma-mysql-1293-check` | `receipts/prisma-mysql-1293-check.json` |
| `test` | `prisma-mysql-1293-test` | `receipts/prisma-mysql-1293-test.json` |
| `publish-dry-run` | `prisma-mysql-1293-publish-dry-run` | `receipts/prisma-mysql-1293-publish-dry-run.json` |
| `arch-check` | `prisma-mysql-1293-arch-check` | `receipts/prisma-mysql-1293-arch-check.json` |

Recomputation with `.llm/tools/gates/evidence-set.ts` used exactly those four paths, with expected
gate IDs `check`, `test`, `publish-dry-run`, and `arch-check`. Result:

```json
{
  "schemaVersion": 1,
  "immutableHead": "3dee41263e5e34a9f59972edb43a345c8d4494c0",
  "surface": "packages/prisma-adapter-mysql",
  "expectedGateIds": [
    "arch-check",
    "check",
    "publish-dry-run",
    "test"
  ],
  "receiptIds": [
    "prisma-mysql-1293-arch-check",
    "prisma-mysql-1293-check",
    "prisma-mysql-1293-publish-dry-run",
    "prisma-mysql-1293-test"
  ],
  "sufficiency": "SUFFICIENT",
  "reasons": []
}
```

This sufficiency verdict covers only the four explicitly named receipt files above; no receipt glob
or unrelated gate is part of the set.

## Raw D7 publish evidence at the content head

Command (repository root):

```text
deno doc --lint packages/prisma-adapter-mysql/mod.ts
```

Full raw output and exit code:

```text
Checked 1 file
EXIT_CODE=0
```

Command (cwd `packages/prisma-adapter-mysql`):

```text
deno publish --dry-run
```

Full raw output and exit code (terminal ANSI styling removed; no diagnostic or file-list content
omitted):

```text
Checking for slow types in the public API...
Simulating publish of @netscript/prisma-adapter-mysql@0.0.6 with files:
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/README.md (4.87KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/deno.json (677B)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/mod.ts (94B)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts (22.56KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/conversion.ts (8.1KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/errors.ts (5.96KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/mod.ts (1.49KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/types.ts (3.49KB)
Success Dry run complete
EXIT_CODE=0
```

The run-owned receipt directory was temporarily relocated outside the worktree for this raw command
and restored immediately afterward, making the tree clean without changing `HEAD`. The eight-file
publish set excludes `examples/**`, `tests/**`, runtime assets, and any `import.meta`-read asset.

## #1293 acceptance mapping for this leaf

1. **Not discharged as worded.** `PrismaMySqlAdapter` intentionally remains outside the root export
   map under PLAN-EVAL R2.1/R2.2. The public `PrismaMySqlConnectedAdapter`,
   `PrismaMySqlTransactionAdapter`, and `PrismaMySqlTransactionOptions` contract satisfies the
   stated naming need, and the surface test makes the concrete-class exclusion intentional.
2. **Discharged.** The published `onConnectionError` option is documented, classifier-backed, wired
   through one contained notifier, and covered by exact-count and rejection-identity tests.
3. **Discharged.** Publish-facing members have explicit annotations; raw `deno doc --lint` exits 0,
   and the package dry run is green with the exact eight-file set above.
4. **Blocked on #1112.** This product merge supplies #1112's implementation prerequisite. The
   docs-owned example still must be rewritten and verified before box 4 can be checked or #1293 can
   close.

# Context pack — feat-prisma-mysql-adapter-surface--1293

## Identity and scope

- Worktree: `/home/codex/repos/netscript-007-features-1293`
- Branch: `feat/prisma-mysql-adapter-surface`
- Base: `284dda90a17a13a7e5e8e9834e5411b58887131b`
- Package: `packages/prisma-adapter-mysql` (Archetype 2 — integration)
- Issue contract: product PR is `Part of #1293` with no closing keyword; #1293 stays open for the
  #1112 docs/example leaf.

## Shipped contract in this leaf

- The root exports package-owned `PrismaMySqlTransactionOptions` and uses package-owned public
  query/result/isolation types throughout the connected and transaction adapter contracts.
- `PrismaMySqlConnectedAdapter` remains the public result type. The concrete
  `PrismaMySqlAdapter`, classifier, code set, and capability helper are module-only test seams and
  are absent from the root export map.
- `PrismaMySqlOptions.onConnectionError` is preserved and wired through one contained notifier.
  Classification is `fatal === true`, errno 1040/1203, or a closed transport/pool code set, after
  the value passes the driver-error guard. Callback failures never replace the primary rejection.
- Capability probing preserves the conservative relation-join fallback and notifies before
  `connect()` resolves. All other ruled driver-rejection boundaries notify at most once while
  retaining their existing raw or mapped rejection behavior.
- The package example imports `../mod.ts` and demonstrates the now-live callback. It remains outside
  the eight-file publish set.

## Locked evidence contract

The immutable content head is established before running these exact four contracted gates:

| Gate | Invocation ID | Receipt |
| --- | --- | --- |
| `check` | `prisma-mysql-1293-check` | `receipts/prisma-mysql-1293-check.json` |
| `test` | `prisma-mysql-1293-test` | `receipts/prisma-mysql-1293-test.json` |
| `publish-dry-run` | `prisma-mysql-1293-publish-dry-run` | `receipts/prisma-mysql-1293-publish-dry-run.json` |
| `arch-check` | `prisma-mysql-1293-arch-check` | `receipts/prisma-mysql-1293-arch-check.json` |

The final evidence must also reproduce the raw `deno doc --lint
packages/prisma-adapter-mysql/mod.ts` output and the raw package `deno publish --dry-run` file list
at that same content head.

Final content head: `3dee41263e5e34a9f59972edb43a345c8d4494c0`. All four receipts are PASS
and attest that head. `acceptance-evidence.md` names the exact set, records the raw D7 outputs, and
contains the recomputed `SUFFICIENT` verdict with no reasons.

## Outstanding cross-lane work

- Acceptance box 1 is not discharged as worded: the evaluator ruled that the concrete class stays
  out of the root API. The intentionally exported connected/transaction contract satisfies the
  stated naming need; changing the issue wording remains an owner action.
- Acceptance box 4 is blocked on #1112. The docs lane must rewrite and execute its example before
  #1293 can close.
- `docs/site/reference/prisma-adapter-mysql/index.md:23` becomes stale on product merge and must be
  corrected by the docs lane; see `drift.md`.

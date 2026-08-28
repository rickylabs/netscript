# #1112 — coordinator rescope amendment: envelope 5 → **7** paths (still RESEARCH + PLAN ONLY)

Continue the same research/plan turn. **No product mutation.** This amends the frozen envelope you were
given; everything else in your brief stands.

## The envelope is now exactly seven paths

Added:

6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`

An **eighth** product path remains a rescope: stop and report.

## Why the example had to come in — verified at `cf648f1ff`, not assumed

Leaving `examples/basic-usage.ts` frozen would have preserved the very falsehood this issue exists to
remove, inside the same package:

| Line | Problem |
| --- | --- |
| `:4` | "This example demonstrates how to use the **Deno MySQL adapter** with Prisma" — the same false driver claim, in an **eighth** location beyond the seven the topic already gave you |
| `:53-62` | The entire Prisma path is **commented out** — the `PrismaClient` import, `new PrismaClient({ adapter })`, `findMany()`, and `$disconnect()` are all dead comment lines |
| `:68` | Falls back to `connectedAdapter.queryRaw({ sql: 'SELECT 1 + 1 …' })` — a raw-query demonstration standing in for the Prisma usage |

So the checked-in "example" neither uses Prisma nor is executable as an example of the documented path.
That is acceptance row 2 failing in the repository itself, not only in the docs.

Add this file to your Task 1 falsehood table with an explicit disposition. Your enumeration should now
cover **eight** Deno-native locations, not seven.

## The test seam — narrow, and its shape is prescribed

Verified: `toMysql2PoolOptions` exists at `src/adapter.ts:725` as a **module-local, unexported**
function, called at `:638`. That is the translation point.

**Authorized architecture:** a pure internal-source test seam — for example exporting
`toMysql2PoolOptions` for direct source-level tests only.

**Explicitly forbidden:**
- do **not** expose `PrismaMySqlAdapter` or any translator from the package root (`src/mod.ts`)
- do **not** add a runtime injection port

This answers the open question your brief left in Task 4: a seam does not exist today, and the
coordinator has now specified the minimum one rather than leaving it as a rescope. Plan it as an
internal-source export, and say in the plan why it is not package-root surface — a translator on the
public barrel would be new published API for a docs leaf.

## Extend, do not add

`tests/connection_errors_test.ts` already exists and already owns injected pool-client cleanup
behaviour. **Extend that file.** Do not create a second test file — a parallel test owning overlapping
cleanup behaviour is how two tests drift into disagreeing about the same contract.

## What the plan must now require

- **Compile-check the actual example file directly** — not a snippet transcribed from it into a doc.
  The file itself must type-check.
- Prove the example **uses `PrismaClient` for one real query**, with deterministic disconnect/dispose
  semantics. The commented-out block at `:53-62` becomes live code, not prose.
- Test the **exact structured → `mysql2` option mapping** through the seam, and prove **successful
  cleanup invocation**.
- Keep all **seven** paths coherent: site page, README, module docs, types, adapter, example, and test
  must tell one story. The reason this leaf exists is that they currently do not.

## Unchanged

Research and plan only — no product mutation this turn. No runtime, Aspire, Docker, browser, or
`e2e:cli`. No PLAN-EVAL. Do not alter `#1664`, `#1293` row-1 wording, or any other lane's artifacts.
Push by explicit refspec; draft PR permitted if planning requires it. Report your exact head, the draft
PR number, the full falsehood table, the option-surface findings, and any rescope.

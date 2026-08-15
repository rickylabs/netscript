# Tier-A review — #1293 S1 "lock and expose the public contract"

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`. Opposite-family to the Codex author thread
`01a0048f-8d95-7682-a3ce-1c1926aba75c`.

Subject: commit `ecb98cc88f9c86918ff535f7ada36b055df3e737`, pushed, local == remote, tree clean.

Verdict: **`CHANGES_REQUESTED`** — one significant finding (S1-F1), one note (S1-N1).

## What passes, verified by running it

| Check | Result |
| --- | --- |
| Diff scope | `adapter.ts`, `src/mod.ts`, `tests/surface_test.ts`, plus leaf journals. **No** `deno.lock`, **no** `docs/**`, **no** other package |
| R2.1 — Choice B honoured | `src/mod.ts:40` exports `inferCapabilities, PrismaMySql, PrismaMySqlAdapterFactory` — **no** `PrismaMySqlAdapter` |
| R2.3 — no root export of the class | confirmed above, and asserted in-code by the new test |
| R2.4 — module-scoped seam | `adapter.ts:325` is now `export class PrismaMySqlAdapter`, not re-exported from `src/mod.ts` |
| Doc-lint repaired | `deno doc --lint packages/prisma-adapter-mysql/mod.ts` → `Checked 1 file`, **exit 0**, down from the measured six `private-type-ref` errors |
| Publish still green | `deno publish --dry-run --allow-dirty` → `Success Dry run complete`, same **8** files, no `tests/`, no `examples/` |
| Annotations | `provider: 'mysql' = 'mysql'` and `adapterName: string = PACKAGE_NAME` replace the inferred forms |

The new `tests/surface_test.ts` is a good shape: it asserts `PrismaMySqlAdapter` is **not** in the
public API *and* is importable from `src/adapter.ts`, which encodes R2.3 and R2.4 as an executable
check rather than a comment. That test fails if either half of the ruling is later violated.

## S1-F1 — the new public query type is wider than the contract it fronts, and a cast hides it (significant)

To clear the six `private-type-ref` diagnostics, `queryRaw`/`executeRaw` gained overloads whose
public arm takes a newly declared `PrismaMySqlQuery`, while the implementation keeps the upstream
type and bridges with an assertion:

```ts
queryRaw(query: SqlQuery): Promise<SqlResultSet>;
queryRaw(query: PrismaMySqlQuery): Promise<PrismaMySqlResultSet>;
async queryRaw(query: SqlQuery | PrismaMySqlQuery): Promise<SqlResultSet> {
  const result = await this.performIO(query as SqlQuery);
```

`PrismaMySqlQuery` is **not** an alias of `SqlQuery` — it is an independent re-declaration, and its
`argTypes` element diverges from upstream `ArgType` in three ways
(`@prisma/driver-adapter-utils@7.8.0/dist/index.d.ts:12-20` versus `adapter.ts:450-464`):

| Field | Upstream `ArgType` | New public declaration | Direction |
| --- | --- | --- | --- |
| `scalarType` | `ArgScalarType` — a 12-member literal union (`'string' \| 'int' \| 'bigint' \| …`) | `string` | **widened** |
| `dbType` | `dbType?: string` — optional | `dbType: string` — required | narrowed |
| `arity` | `arity: Arity` — required | `arity?: 'scalar' \| 'list'` — optional | **widened** |

The two are mutually non-assignable, which is precisely why `as SqlQuery` was needed. The assertion
is not a nominal-vs-structural formality — it is silencing a real incompatibility.

**Failure scenario, concrete.** A consumer calls the public overload with
`{ sql: 'INSERT …', args: ['9007199254740993'], argTypes: [{ scalarType: 'BigInt', dbType: 'BIGINT' }] }`.
That type-checks: `scalarType` is `string`, and `arity` is optional. It is then cast to `SqlQuery`
and reaches `mapArg` (`conversion.ts:161-205`), which branches on exact lowercase literals —
`argType.scalarType === 'bigint'`, `=== 'datetime'`, `=== 'bytes'`. `'BigInt'` matches none, so the
function falls through to `return arg` and MySQL receives the **string** `'9007199254740993'`
instead of a `BigInt`. No error is raised at any layer. The same hole swallows a missing `arity`,
which upstream requires.

So S1 traded a *documentation* defect for a *correctness* one: the six doc-lint errors are gone, but
the types that replaced them do not match the contract they front, and the mismatch is asserted away
rather than reconciled. Widening a public input type is the more dangerous direction — it accepts
values the implementation cannot honour.

**Required remedy — either is acceptable:**

(a) Make the package-owned types **structurally exact**: declare a package-owned literal union
mirroring `ArgScalarType`, make `dbType?: string` optional and `arity` required, then **delete the
`as SqlQuery` cast** — it should become unnecessary, and if it does not, the types still diverge.

(b) If exactness is impractical, keep only the upstream-typed signature on the public arm and solve
the doc-lint diagnostic by re-exporting the upstream types as package-owned public aliases, so one
declaration remains the single source of truth.

Do **not** resolve this by loosening the implementation signature or widening further.

## S1-N1 — no compile-time guard against future upstream drift (note)

Whichever remedy is chosen, nothing currently fails the build if a later
`@prisma/driver-adapter-utils` changes `ArgType` or `SqlResultSet`. Add a compile-time bidirectional
assignability assertion in the test file, e.g.

```ts
const _toUpstream: SqlQuery = {} as PrismaMySqlQuery;
const _fromUpstream: PrismaMySqlQuery = {} as SqlQuery;
```

so divergence surfaces as a `check` failure rather than being absorbed by an assertion. This is what
turns S1-F1 from "fixed once" into "cannot silently regress".

Related, and deliberately **not** a finding: `PrismaMySqlResultSet.columnTypes` is `number[]` where
upstream is `Array<ColumnType>`. That widening is on the **return** path, so it loses enum precision
for consumers but cannot admit invalid input. Stated here so it is not "fixed" in the wrong
direction while addressing S1-F1.

## Rulings compliance

R2.1, R2.3, R2.4 are all honoured exactly. `MySqlTransaction` was deliberately **not** exported; that
is correct — the PLAN-EVAL's subject-4 analysis established every transaction boundary is reachable
through the fake `MysqlPoolClient` and the `MysqlQueryableClient` handed to `useConnection`, so no
second seam is needed. No S2 wiring leaked into S1: no classifier, no notifier, no `isConnectionError`,
no `fatal` field.

## Next

Fix S1-F1 and add the S1-N1 guard in a fix-up commit on the same thread, then re-report. S2 stays
withheld until this slice is accepted.

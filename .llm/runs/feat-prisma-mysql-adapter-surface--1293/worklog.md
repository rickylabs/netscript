# Worklog — feat-prisma-mysql-adapter-surface--1293

## S1 — lock and expose the public contract

- Starting head: `feb8b0355215e7282b87787117dc5c244653250d`
- Scope: public package aliases, explicit declaration annotations, module-only fake-client seam,
  focused root-surface guard, and run evidence only.
- S2 behavior is untouched: no classifier, notifier, `isConnectionError`, or `fatal` field.

### Raw doc-lint baseline (before S1)

Command:

```text
deno doc --lint packages/prisma-adapter-mysql/mod.ts
```

Raw diagnostic text (terminal ANSI styling removed; no diagnostic content omitted):

```text
error[private-type-ref]: public type 'PrismaMySqlTransactionAdapter["options"]' references private type 'TransactionOptions'
   --> /home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts:502:3
    |
502 |   readonly options: TransactionOptions;
    |   ^
    = hint: make the referenced type public or remove the reference
    |
399 | export declare type TransactionOptions = {
    | - this is the referenced type
    |

  info: to ensure documentation is complete all types that are exposed in the public API must be public


error[private-type-ref]: public type 'PrismaMySqlTransactionAdapter["queryRaw"]' references private type 'SqlQuery'
   --> /home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts:504:3
    |
504 |   queryRaw(query: SqlQuery): Promise<SqlResultSet>;
    |   ^
    = hint: make the referenced type public or remove the reference
    |
341 | export declare type SqlQuery = {
    | - this is the referenced type
    |

  info: to ensure documentation is complete all types that are exposed in the public API must be public


error[private-type-ref]: public type 'PrismaMySqlTransactionAdapter["queryRaw"]' references private type 'SqlResultSet'
   --> /home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts:504:3
    |
504 |   queryRaw(query: SqlQuery): Promise<SqlResultSet>;
    |   ^
    = hint: make the referenced type public or remove the reference
    |
350 | export declare interface SqlResultSet {
    | - this is the referenced type
    |

  info: to ensure documentation is complete all types that are exposed in the public API must be public


error[private-type-ref]: public type 'PrismaMySqlConnectedAdapter["queryRaw"]' references private type 'SqlQuery'
   --> /home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts:522:3
    |
522 |   queryRaw(query: SqlQuery): Promise<SqlResultSet>;
    |   ^
    = hint: make the referenced type public or remove the reference
    |
341 | export declare type SqlQuery = {
    | - this is the referenced type
    |

  info: to ensure documentation is complete all types that are exposed in the public API must be public


error[private-type-ref]: public type 'PrismaMySqlConnectedAdapter["queryRaw"]' references private type 'SqlResultSet'
   --> /home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts:522:3
    |
522 |   queryRaw(query: SqlQuery): Promise<SqlResultSet>;
    |   ^
    = hint: make the referenced type public or remove the reference
    |
350 | export declare interface SqlResultSet {
    | - this is the referenced type
    |

  info: to ensure documentation is complete all types that are exposed in the public API must be public


error[private-type-ref]: public type 'PrismaMySqlConnectedAdapter["startTransaction"]' references private type 'IsolationLevel'
   --> /home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts:530:3
    |
530 |   startTransaction(
    |   ^
    = hint: make the referenced type public or remove the reference
    |
136 | export declare type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SNAPSHOT' | 'SERIALIZABLE';
    | - this is the referenced type
    |

  info: to ensure documentation is complete all types that are exposed in the public API must be public


error: Found 6 documentation lint errors.
EXIT_CODE=1
```

### Raw doc lint (after S1)

Command:

```text
deno doc --lint packages/prisma-adapter-mysql/mod.ts
```

Raw output and exit code:

```text
Checked 1 file
EXIT_CODE=0
```

The structured wrapper independently reported `combinedTotal: 0`,
`combinedPrivateTypeRef: 0`, and `combinedExitCode: 0` for `./mod.ts`.

### Raw publish dry-run (after S1)

Command (cwd `packages/prisma-adapter-mysql`):

```text
deno publish --dry-run --allow-dirty
```

Raw output and exit code (terminal ANSI styling removed; no output omitted):

```text
Checking for slow types in the public API...
Check mod.ts
Simulating publish of @netscript/prisma-adapter-mysql@0.0.6 with files:
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/README.md (4.87KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/deno.json (677B)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/mod.ts (94B)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts (21.27KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/conversion.ts (8.1KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/errors.ts (4.99KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/mod.ts (1.49KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/types.ts (3.15KB)
Success Dry run complete
EXIT_CODE=0
```

The publish set remains eight files. `examples/` and `tests/` remain excluded. The raw command
reported no slow-type diagnostic; the JSR helper's sole F-JSR-7 finding is the already-measured
banner match on `Checking for slow types in the public API...`.

### Package-isolated surface diff

The package root contains these 16 symbols after S1:

```text
DenoMySqlClient
DenoMySqlConnection
ExecuteResult
inferCapabilities
MySqlCapabilities
MySqlConnectionConfig
PrismaMySql
PrismaMySqlAdapterFactory
PrismaMySqlConnectedAdapter
PrismaMySqlConnectionInfo
PrismaMySqlIsolationLevel
PrismaMySqlOptions
PrismaMySqlQuery
PrismaMySqlResultSet
PrismaMySqlTransactionAdapter
PrismaMySqlTransactionOptions
```

`PrismaMySqlAdapter` is absent from the root snapshot. The isolated rows against the checked-in
baseline are:

```json
[
  {
    "kind": "major",
    "package": "@netscript/prisma-adapter-mysql",
    "export": ".",
    "symbol": "PrismaMySqlAdapterFactory",
    "reason": "export signature changed"
  },
  {
    "kind": "major",
    "package": "@netscript/prisma-adapter-mysql",
    "export": ".",
    "symbol": "PrismaMySqlConnectedAdapter",
    "reason": "export signature changed"
  },
  {
    "kind": "major",
    "package": "@netscript/prisma-adapter-mysql",
    "export": ".",
    "symbol": "PrismaMySqlTransactionAdapter",
    "reason": "export signature changed"
  },
  {
    "kind": "minor",
    "package": "@netscript/prisma-adapter-mysql",
    "export": ".",
    "symbol": "PrismaMySqlTransactionOptions",
    "reason": "symbol added"
  }
]
```

The three signature rows are the transitive effect of replacing private upstream references with
the ruled package-owned types; the factory row changes because its `connect()` return contract is
the changed connected interface. The new transaction-options row is the intentional additive
symbol. The already-published `PrismaMySqlQuery` shape is unchanged.

### Supporting checks

- Package check: pass.
- Package tests: 9 passed, 0 failed, including the root-surface guard.
- Package lint: 0 findings.
- Package TypeScript format check: 0 findings.
- Structured doc lint: 0 findings, exit 0.
- Raw publish dry-run: exit 0, eight files.

## S1 Tier-A fix-up — S1-F1 and S1-N1

Tier-A review found that the initial `PrismaMySqlQuery` declaration was mutually non-assignable
with Prisma 7.8.0's `SqlQuery`, and that `query as SqlQuery` hid a real input-contract mismatch.
The fix-up takes review option (a):

- `scalarType` is the exact 12-member lowercase literal union from upstream `ArgScalarType`;
- `dbType?: string` is optional;
- `arity: 'scalar' | 'list'` is required;
- the overload pairs and `as SqlQuery` assertions are removed; and
- `surface_test.ts` assigns `PrismaMySqlQuery` to `SqlQuery` and back at compile time.

The deliberately noted return-path widening in `PrismaMySqlResultSet.columnTypes` remains unchanged.

### Raw doc lint after the Tier-A fix-up

Command:

```text
deno doc --lint packages/prisma-adapter-mysql/mod.ts
```

Raw output and exit code:

```text
Checked 1 file
EXIT_CODE=0
```

### Raw publish dry-run after the Tier-A fix-up

Command (cwd `packages/prisma-adapter-mysql`):

```text
deno publish --dry-run --allow-dirty
```

Raw output and exit code (terminal ANSI styling removed; no output omitted):

```text
Checking for slow types in the public API...
Simulating publish of @netscript/prisma-adapter-mysql@0.0.6 with files:
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/README.md (4.87KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/deno.json (677B)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/mod.ts (94B)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/adapter.ts (21.16KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/conversion.ts (8.1KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/errors.ts (4.99KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/mod.ts (1.49KB)
   file:///home/codex/repos/netscript-007-features-1293/packages/prisma-adapter-mysql/src/types.ts (3.15KB)
Success Dry run complete
EXIT_CODE=0
```

The final package-isolated surface rows are:

```text
MAJOR PrismaMySqlAdapterFactory: export signature changed
MAJOR PrismaMySqlConnectedAdapter: export signature changed
MAJOR PrismaMySqlQuery: export signature changed
MAJOR PrismaMySqlTransactionAdapter: export signature changed
MINOR PrismaMySqlTransactionOptions: symbol added
```

`PrismaMySqlAdapter` remains absent from the root snapshot.

## S2 — connection-error predicate and notification boundaries

- Starting head: `49fda0b77b4db4a91f1cb25e23b13e4bf1259699`.
- `src/errors.ts` now defines the module-only `MYSQL_CONNECTION_ERROR_CODES` set and
  `isConnectionError(error: unknown)` classifier. `MySqlError` includes `fatal?: boolean` without
  broadening the pre-existing `isDriverError` predicate or error normalization.
- `adapter.ts` has one module-level `notifyConnectionError(options, error)` function. The invocation
  of `options.onConnectionError` inside it is the only callback call site in `src/`.
- Callback throws are logged through `debug` and dropped. Raw rejections are rethrown by identity;
  pooled/transaction query operations retain `DriverAdapterError` conversion.
- The classifier/notifier covers capability fallback, pooled and transaction query/execute,
  `executeScript`, acquisition/isolation/`BEGIN`, post-ready lifecycle rejection,
  `COMMIT`/`ROLLBACK`, and disposal. Transaction start notifies only from the outer lifecycle catch.
- `getCapabilities` has a module-only export so the fake-client test can exercise the same probe
  function awaited by `PrismaMySqlAdapterFactory.connect`; it is not root re-exported.
- Root-surface tests assert that `isConnectionError`, `MYSQL_CONNECTION_ERROR_CODES`, and
  `getCapabilities` remain absent from the package API.

### S2 behavior evidence

- Package check: pass for the root and all five test files.
- Package tests: 46 passed, 0 failed; 33 exercise connection boundaries and 7 exercise classifier
  and mapping behavior.
- Package lint and TypeScript format: zero findings.
- Structured doc lint: zero findings, exit 0.
- JSR helper: raw dry-run passes; its sole F-JSR-7 warning remains the known banner match.

### Raw doc lint after S2

Command:

```text
deno doc --lint packages/prisma-adapter-mysql/mod.ts
```

Raw output and exit code:

```text
Checked 1 file
EXIT_CODE=0
```

### Raw publish dry-run after S2

Command (cwd `packages/prisma-adapter-mysql`):

```text
deno publish --dry-run --allow-dirty
```

Raw output and exit code (terminal ANSI styling removed; no output omitted):

```text
Check mod.ts
Checking for slow types in the public API...
Check mod.ts
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

The publish set remains the same eight files; tests and examples remain excluded.

## S3 — package example and cross-lane handoff

- Starting head: `47ad48c9dcfe408e5de150fdb3a65d0f2111ee1f`.
- `examples/basic-usage.ts` now imports `PrismaMySql` from the package root (`../mod.ts`), not the
  source barrel. Its connection-error callback describes only the classifier-backed behavior that
  S2 ships.
- The example remains intentionally outside the publish set through `publish.exclude` in the
  package `deno.json`; the final raw dry-run file list is recorded with the final evidence.
- The split-close contract remains binding: the product PR is only `Part of #1293`; #1293 remains
  open, and acceptance box 4 remains blocked until #1112 rewrites and verifies its docs-owned
  executable example.
- The docs-owned stale statement is recorded in `drift.md` for the #1112/docs lane. No file under
  `docs/**` is changed by this leaf.

The final gate receipts and raw D7 evidence are added only after this content is committed, so each
gate attests the immutable S3 content head rather than an uncommitted implementation tree.

### Final evidence pass

- Immutable content head: `3dee41263e5e34a9f59972edb43a345c8d4494c0`.
- `check`: PASS, invocation `prisma-mysql-1293-check`.
- `test`: PASS, invocation `prisma-mysql-1293-test` (4,181 passed, 0 failed, 19 ignored).
- `publish-dry-run`: PASS, invocation `prisma-mysql-1293-publish-dry-run`.
- `arch-check`: PASS, invocation `prisma-mysql-1293-arch-check`.
- Recomputing `.llm/tools/gates/evidence-set.ts` with exactly the four receipt paths named in
  `acceptance-evidence.md` returned `SUFFICIENT` with an empty reasons array.
- The evaluator-required raw `deno doc --lint` and package-only `deno publish --dry-run` output is
  pasted without omissions in `acceptance-evidence.md`. The publish set is eight files and excludes
  the example.

No `deno.lock`, `docs/**`, issue, or central-cluster state was changed. No evaluator or
`scaffold.runtime` run was launched.

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

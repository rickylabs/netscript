# Worklog — Wave 2b Data Adapters

Run ID: `feat-package-quality-wave2-adapters-2b--data`
Branch: `feat/package-quality-wave2-adapters-2b`
Role: GENERATOR for sub-wave 2b only.

## Design

### Public Surface

- `@netscript/kv` keeps its root export plus existing `./redis` and `./kvdex` subpaths; this run adds `./testing` for the in-memory adapter and contract helper.
- `@netscript/database` keeps the root, adapter, script, tracing, and extension surfaces; this run renames `./interfaces` to `./ports` with no compatibility alias.
- `@netscript/database/testing` is added for contract helpers and mock/in-memory database ports.
- `@netscript/prisma-adapter-mysql` remains a single-adapter root package; this run keeps its root export, adds a canonical package-root `mod.ts` only if needed by the current package shape, and excludes examples from publish.

### Domain Vocabulary

- KV vocabulary: `KvStore`, `WatchableKvStore`, `KvKey`, `KvProvider`, Redis/Deno KV/Kvdex adapter variants, and in-memory test adapter.
- Database vocabulary: database client port, transaction/client capability, query result, SQL JSON extension options, adapter technology variants (`postgres`, `mssql`, `mysql`), tracing controls, and schema generation scripts.
- Prisma MySQL vocabulary: Prisma driver adapter, MySQL connection options, capabilities, conversion helpers, and driver error mapping.

### Ports

- `kv` already owns store contracts under `types/`; this run does not widen the port surface, but exposes a `./testing` contract helper that exercises the public KV behavior.
- `database` renames the consumed contracts from `interfaces/` to `ports/`; adapters import the port contracts from the same package.
- `prisma-adapter-mysql` is a one-adapter package and does not invent a new port unless an existing source contract already requires it.

### Composition Roots

- `kv` composition roots remain the existing factories and provider auto-detection functions, moved from `core/` to `application/` when role naming changes.
- `database` composition roots remain the exported adapter factories and tracing helpers; defaults stay explicit in exported functions, with no module-load-time connection acquisition.
- `prisma-adapter-mysql` composition stays in its adapter factory and connection opening functions; removing `skipLibCheck` must not add hidden process/env reads.

### Permissions

- `kv` docs must declare `--unstable-kv`, network access for Redis, and environment access only where provider auto-detection reads configuration.
- `database` docs must declare network/database connectivity permissions, file/process permissions for scripts, and no implicit permissions for pure types.
- `prisma-adapter-mysql` docs must declare network access to MySQL and any npm/driver runtime requirements.

### Consumer-Import Impact

- `@netscript/database/interfaces` is removed and replaced by `@netscript/database/ports`; the approved plan recorded zero external consumers.
- `kv` subpaths do not change, so consumer impact is internal import updates only.
- `prisma-adapter-mysql` root import remains stable; examples are excluded from publish but not removed.
- Final consumer gate checks CLI and plugins per the locked 2b slice 23.

### Contributor Path

- Add a new KV backend by opening `packages/kv/adapters/`, implementing the existing KV contract, then adding a `./testing` contract invocation.
- Add a new database engine by adding a sibling under `packages/database/adapters/`, wiring the same `ports/` contracts, documenting required permissions, and extending the adapter contract test.
- Extend Prisma MySQL behavior by updating focused files under `packages/prisma-adapter-mysql/src/`, keeping driver-specific conversion separate from adapter lifecycle.

### Commit Slices

1. `kv`: consolidate `bridges/` into `adapters/`, rename `core/` to `application/`.
2. `kv`: update internal imports after rename.
3. `kv`: scaffold `/docs`.
4. `kv`: move root architecture content into `docs/architecture.md`.
5. `kv`: add `./testing` entrypoint with in-memory KV adapter/contract helper.
6. `kv`: add package lint/fmt/publish dry-run tasks.
7. `kv`: add docs example fixture test.
8. `kv`: verify publish dry-run and doc lint.
9. `database`: add metadata and publish hygiene.
10. `database`: rename `interfaces/` to `ports/` and update export.
11. `database`: fix the known slow type in `extensions/sql-json.extension.ts`.
12. `database`: fix doc-lint errors and public JSDoc.
13. `database`: write README with at least 150 lines.
14. `database`: scaffold `/docs`.
15. `database`: scaffold basic adapter contract tests.
16. `database`: add package lint/fmt/publish dry-run tasks.
17. `database`: verify publish dry-run and doc lint.
18. `prisma-adapter-mysql`: remove `skipLibCheck: true`.
19. `prisma-adapter-mysql`: fix type errors surfaced by removal.
20. `prisma-adapter-mysql`: fix doc-lint errors.
21. `prisma-adapter-mysql`: expand README and scaffold `/docs`.
22. `prisma-adapter-mysql`: add tasks and exclude `examples/` from publish.
23. `2b`: run consumer gate on CLI and plugins.

### Deferred Scope

- Real backend runtime tests remain deferred to S2 per the locked plan.
- `kv/tests/bridge_test.ts` AP-1 god-file debt remains open unless a slice must touch it for a failing gate.
- Queue and cron changes are out of scope for this run.

## Activity Log

| Date | Slice | Activity | Evidence |
|------|-------|----------|----------|
| 2026-06-07 | Design | Created nested run directory and Design checkpoint for Wave 2b. | This file, `commits.md`, `drift.md`. |
| 2026-06-07 | 1-8 | Completed KV folder role rename, docs, `./testing`, tasks, doctest fixture, and package gates. | `deno task --cwd packages/kv check` PASS; `deno doc --lint packages/kv/mod.ts packages/kv/redis.ts packages/kv/kvdex.ts packages/kv/src/testing/mod.ts` PASS; `deno publish --dry-run --allow-dirty` PASS with 0 slow types; scoped fmt/lint PASS; docs fixture PASS. |

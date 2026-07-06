## DDX-21 / S11: DB Migrations & Drift

### Summary
"Which migrations are pending vs applied, and has the schema drifted" — a panel over the existing `db status` use-case exposed via `/_netscript/db/status`.

### DX thesis
Aspire shows the DB *resource* is up; it never shows migration state or schema drift.

### Scope
- Migration `data-table` (applied/pending); drift `alert`; introspect diff as CodeBlock.
- "Run migrate" and **"Run seed" (v2)** actions with CLI-equivalent (`netscript db ...`), confirm-gated — the db cells of the P2 management loop.
- Data: Prisma migration status/introspect/drift (CLI `db status` today).

### Non-goals
- No DB resource lifecycle/health (Aspire DB resource, `WithUrl` out-link). No query console.

### Acceptance criteria
- Applied/pending migrations render; drift alert fires when schema drifts; introspect diff renders.
- Deep-link → Aspire DB resource.

### Dependencies
`/_netscript/db/status` read API (#423). **Wave:** beta.6 if the read API is trivial; else fast-follow. Note the db-init Prisma 7.x transient flake (re-run clears).

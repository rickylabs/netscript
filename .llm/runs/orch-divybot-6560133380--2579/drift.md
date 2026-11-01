# Drift

- Specific owner process overrides generic dispatcher boilerplate: draft remains draft; Refs #2579, no closing keyword or labels; Cockpit merges. No session identifiers or absolute paths in public run artifacts.
- RTK not installed; invoke underlying tools. No cache/lock deletion or reload.

- The generated contracts aggregate deliberately exposes schema names through type-only exports. The generated Prisma adapter imports its runtime entity validator from the concrete generated v1 contract module via a deterministic project-relative path. This is a generated application workspace dependency, with no framework package boundary change; the existing contract package alias continues to own the shared types. Live SQLite Prisma/Zod generation and 133 emitted-file checks validate that path.
- Independent slice review identified duplicate id ORDER BY (SQL Server), dropped table query parameters, client-writable unique references, and raw detail status display. All four are repaired before the implementation sign-off commit. References remain server-generated on create/update; seed writes are unaffected.

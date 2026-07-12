# Research

## Re-baseline

The issue candidate inventory was re-checked against branch baseline
`eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d`. The brief's base preflight passed. The working tree
was clean before the run artifacts were created.

Most Wave 1 paths are already absent on this baseline. Surviving candidates were searched
repo-wide by exact path, basename, import specifier, and exported symbol. A candidate with any
current importer or manifest/export-map consumer is excluded from deletion.

## Findings

- Zero-importer deletions: `packages/fresh-ui/src/presentation/data-grid.css`,
  `plugins/workers/services/src/routers/health.ts`, and
  `plugins/sagas/services/src/routers/health.ts`.
- `packages/cli/src/kernel/extension-points.ts` has no code importer, but current Archetype-6 rule
  R-A6-N10/F-CLI-31 explicitly requires this manifest because the CLI has multiple registry axes.
  It is retained.
- Workers `bin/{combined,scheduler,worker}.ts` are referenced by plugin manifest/Aspire
  contributions, tests, and docs. They are retained.
- SDK collections, OpenAPI helpers, composite query, KV persister, client-link port, and service
  discovery candidates are imported, exported, tested, or declared in the package export map.
  They are retained.
- `packages/fresh-ui/src/presentation/data-grid.tsx` is a documented root export with package tests
  and consumer-render coverage. It is retained.
- The Wave 1 workers contract compatibility barrel is imported by its versioned contract barrel.
  It is retained.
- The remaining named Wave 1 files and the orphan public barrels / streams error file from Wave 2
  are already absent on this baseline.

## JSR surface scan

The three planned deletions are not `deno.json` export targets and are not root/subpath exports.
Deleting them does not introduce a missing JSR entrypoint. The Fresh UI CSS file is not imported by
the runtime component or stylesheet entrypoints; the two plugin health routers are not assembled
into their service routers.

## Open questions

None that must be resolved for the three-file mechanical deletion. Whether the retained imported
Wave 2 APIs should be removed through coordinated consumer/API changes is safe to defer and is
outside this strict zero-importer slice.


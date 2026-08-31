# Research — S8 typed db-cli-mode resource commands

## Locked scope

- Issue #1720 owns typed `withCommand` resource commands and `excludeFromMcp()` for database CLI
  resources. The same PR closes #863 after the bounded-wait and lease-backed evidence are complete.
- Epic #1712 decision D-6 defines `excludeFromMcp()` as MCP exposure control only. S8 does not emit
  `withHidden()` and does not alter dashboard visibility to approximate MCP exclusion.
- The ratified research chain is S5 → S6 → S8. This worktree is stacked on S6 head `564d465c` so
  `healthy` means listener readiness.
- Phase A is static: no AppHost start and no containers. Phase B is a supervisor-issued runtime
  lease on this same draft PR.

## Upstream API evidence

The Aspire 13.5 research snapshot identifies the exact API pages used by emitted code:

- `withCommand`: `https://aspire.dev/reference/api/typescript/aspire.hosting/withcommand.md`
- `CommandOptions`: `https://aspire.dev/reference/api/typescript/aspire.hosting/commandoptions.md`
- `excludeFromMcp`: `https://aspire.dev/reference/api/typescript/aspire.hosting/excludefrommcp.md`
- `withIconName`: `https://aspire.dev/reference/api/typescript/aspire.hosting/withiconname.md`
- `ResourceCommandVisibility`:
  `https://aspire.dev/reference/api/typescript/aspire.hosting/resourcecommandvisibility.md`

The custom-resource-command guide demonstrates typed `arguments`, awaited `context.arguments()`,
and CLI invocation as `aspire resource <resource> <command> --<argument>`. Consumer verification in
slice 5 will cite the restored 13.5.3 module signatures and line numbers rather than relying on
prose.

## D-216 seed diagnosis

The exact `e2e-cli-scaffold-runtime-report` ZIPs for workflow runs `33415203923` (artifact
`9766882209`, SHA-256 `c67b01380db568fb22f0826835f81c015dcba27d28398bf1c2266d800c7fe962`)
and `33404324013` (artifact `9764891299`, SHA-256
`cb04b520bf56057fd904d6f2d21855438f593bc3399e0495bde943ad38e5b721`) were downloaded and
digest-verified. Each ZIP contains only `e2e-report-scaffold-runtime.json`. The corresponding job
logs were also downloaded. Neither report nor job log contains a Prisma `code` or `meta` field:
the retained stderr ends after `Invalid prisma.user.findFirst() invocation:`. This is an exact
absence, not an inferred Prisma classification. D-07's generated runtime edge persists only its
first three actionable stderr lines, so the later Prisma fields were never serialized into either
requested artifact.

The reports do prove that `database.init` applied the migration to the generated named database on
the allocated port immediately before `database.seed`. S8 then takes a different path for the
typed seed command. Before S8, the explicit-start `<db>-cli` executable received
`DATABASE_URL=target.resource`, which Aspire resolves from the live database resource. S8's typed
callback instead calls
`builder.getConfiguration().getConnectionString(target.resourceKey)` and passes that value into a
new Deno child process.

Aspire 13.5.3 source confirms `builder.getConfiguration()` is exactly `builder.Configuration` and
its `getConnectionString(name)` is the static Microsoft configuration lookup for
`ConnectionStrings:<name>`, returning null when absent. The generated AppHost configuration has no
such container connection-string entry. Aspire's 13.5.3 polyglot PostgreSQL fixture demonstrates
the supported late-bound path:
`db.connectionStringExpression()` followed by `getValueAsync()`. The equivalent concrete database
resource property exists for PostgreSQL, MySQL, and SQL Server. The repair therefore carries a
late-bound connection-string resolver from infrastructure registration to the typed callback; it
does not add a new runtime abstraction or change the public package surface.

## Existing architecture

`packages/cli` is Doctrine Archetype 6 with a Keep verdict. Pure scaffold generators select
checked-in templates; emitted helpers and CLI adapters own IO at runtime. The existing
`AspireCommandExecutor` port and database operation runner remain the integration spine. No public
`@netscript/*` export or plugin contribution changes are in scope.

The current S6 base registers explicit-start `netscript-db-<key>` resources and routes operations
through `aspire resource ... start`. It also retains an Aspire 13.4 process-command compatibility
seam in the tool-registration template. S8 replaces those internal runtime surfaces with typed
`<key>-cli` commands and removes the seam.

## Verification evidence inherited from research

- S2 verified a stable 14-tool MCP surface and the Aspire `commands[]` describe shape.
- S2 observed `aspire wait` timeout exit 17. Exit 18 remains a locked 13.5 contract that Phase A
  covers with unit tests and Phase B must demonstrate under a lease.
- S6's 13.5.3 consumer receipt records expected module hashes for `aspire.mts`, `base.mts`, and
  `transport.mts`; S8 performs a fresh restore-only verification and preserves only the two known
  `zod` TS2307 allowances.

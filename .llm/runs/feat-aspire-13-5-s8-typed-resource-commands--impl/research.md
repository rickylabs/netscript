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

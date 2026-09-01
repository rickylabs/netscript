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
such container connection-string entry. The D-216 review identified
`db.connectionStringExpression()` as the supported late-bound path but transcribed the C#
`GetValueAsync` member into the TypeScript emission. D-227 later corrected the language binding:
Aspire 13.5.3 TypeScript `ReferenceExpression` exposes
`getValue(): Promise<string | null>`. The equivalent concrete database resource property exists for
PostgreSQL, MySQL, and SQL Server. The repair therefore carries a late-bound connection-string
resolver from infrastructure registration to the typed callback; it does not add a new runtime
abstraction or change the public package surface.

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

## D-224 actionable-stderr retention

At `f29a0b265`, the emitted `run-tool.mts` retains only the first three non-empty, non-`Task `
stderr lines. The capture already strips VT controls before classification and derives `message`
from the first retained line, but it has no byte ceiling and discards every later structured field.
The D-216 evidence proves this is load-bearing: Prisma's identifying `code` and `meta` occur after
the retained three-line preamble, and run `33428877123` likewise begins its retained detail inside
a file-list prefix rather than at the decisive error.

The bounded generic policy for this delta is 32 lines with 8 head lines and 24 tail lines, plus a
16 KiB total serialized UTF-8 ceiling. Thirty-two lines accommodates a multi-line JSON-ish error
and ordinary source context without turning the state field into a log dump. Retaining more tail
than head preserves late identifiers while the first eight lines keep the original message and
nearby context. A derived per-line byte allowance guarantees the total ceiling, including newline
separators, and prevents one enormous line from consuming an unbounded field. Oversized individual
lines retain a smaller head and larger tail so trailing identifiers in compact JSON-ish output are
not reduced to another prefix-only failure. No Prisma-specific parser or field heuristic is
introduced.

The affected surface remains the existing generated runtime adapter only. There is no new export,
package metadata, dependency, permission, command vocabulary, or JSR surface; the planned JSR
audit is therefore N/A for this delta. Existing CLI debt is not deepened.

## D-227 generated-quality diagnosis

A fresh local-source PostgreSQL scaffold at `bbf866d59` reproduced the failure with complete,
separate stdout/stderr capture. Stdout was empty. The first line of the 23,763-byte stderr capture,
which the CI tail omitted, was exactly:

```text
error: Uncaught (in promise) Error: generated check did not recover after quality probes
```

The structured check report in that same complete capture isolated the emitted AppHost diagnostic:

```text
aspire/.helpers/register-infrastructure.mts(83,69): error TS2339: Property 'getValueAsync' does not exist on type 'ReferenceExpression'.
```

The stack names `runQualityProbes` at `generated-quality-probes.ts:144:11`, so line 144 fired. The
leading hypothesis was correct. Capture hashes are SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` for empty stdout and
`1b1f8578727376577bae9fe332205e32f6379437517dca499aaa899bf5a13ad4` for complete stderr.

Independent compilation against the restored Aspire 13.5.3 SDK proved that emitted
`run-tool.mts` compiles (exit 0), while `register-infrastructure.mts` fails (exit 2) with the same
single TS2339. The restored TypeScript API declares
`PostgresDatabaseResource.connectionStringExpression(): Promise<ReferenceExpression>` and
`ReferenceExpression.getValue(): Promise<string | null>`. `getValueAsync()` is the C# member name,
not the TypeScript member name. The D-216 string assertion therefore accepted non-compiling source.

The repaired resolver awaits `connectionStringExpression().getValue()` only when the typed command
executes, rejects an unresolved `null`, and returns the exact allocated connection string. This
preserves late binding and does not alter `run-tool.mts` or D-224's bounded stderr retention.

The new static regression renders both helper files, supplies the relevant restored 13.5.3 SDK
contract, and runs `deno check` on the emitted pair. Before the repair it failed 0/1 with the exact
TS2339 above; after the repair it passes. A fresh fixed scaffold with the official local plugins,
generated registries, restored SDK, and offline database client generation passed its pre-probe
check/lint and the unmodified negative-quality probe. The probe returned `ok: true`, all ten
expected quality probe paths, `cleanupCheckExitCode: 0`, and `cleanupLintExitCode: 0`. No AppHost,
Docker, container, or runtime E2E suite was started.

## D-231 runtime-capability diagnosis

Workflow run `33447847678` at `a2b227941` disproves the D-227 repair at runtime even though the
generated helper compiles: `database.seed` reports `Unknown capability:
Aspire.Hosting.ApplicationModel/getValue` and exits 16. The restored Aspire 13.5.3 implementation
explains the split. `ReferenceExpression.getValue()` is declared in `Resources/base.mts:149`, but
its body invokes the live RPC capability `Aspire.Hosting.ApplicationModel/getValue` at line 160.
The generated 13.5.3 `ExecuteCommandContext` surface contains only `services`, `resourceName`,
`cancellationToken`, `logger`, and `arguments`; it exposes no connection-string accessor. A
declaration-level compile result is therefore insufficient evidence for callback-time value
resolution.

The supported Container mechanism is the graph-injected executable already emitted by S8:
`withEnvironment('DATABASE_URL', target.resource)` plus the engine-specific variable,
`withReference(target.resource)`, and `waitFor(target.resource)`. This is not a new inferred API:
the same allocated-resource injection path is used by the generated init/migrate/generate flows,
and the cited workflow advanced through those operations before the typed seed callback failed.
For Container typed commands, the callback now stages the operation request and invokes Aspire's
built-in `resource <db>-cli start` command. Aspire starts the existing explicit-start executable
with the graph-resolved environment. The emitted runner atomically returns the already-bounded
D-224 result; the callback reads that result even when the resource start exits nonzero.

External mode continues to use the configuration-backed `getConnectionString(...)` resolver it
explicitly models. SQLite continues to use `file:./<database>` and the direct child path. No third
value-resolution method, cast, `any`, lint suppression, dependency, package export, or public
contract was introduced. The change has no JSR metadata or published-surface effect, so a JSR
audit is N/A for this delta. Runtime execution is prohibited locally; the existing successful
workflow operations are the runtime evidence for graph injection, and CI remains the authority for
the repaired typed seed path.

## D-233 masked migrate diagnosis

Workflow run `33450804252` at `927d24bed` passed `database.seed` and reached 58 passing gates before
`runtime.typed-db-phase-b` failed. The downloaded `e2e-cli-scaffold-runtime-report` artifact and the
exact failed-job log agree: Aspire rendered only `Loaded Prisma config from prisma.config.ts.` and
`Prisma schema loaded from schema.` as the typed-command message. Those lines are informational.
The report contains no generated result record or AppHost log, so the later retained lines cannot
be recovered from the uploaded artifact; they must be promoted by a new CI run rather than guessed.

The masking crosses two seams. `run-tool.mts` retains D-224's bounded 8-line head plus 24-line tail,
but still derives `RunToolResult.message` from index zero. Request mode serializes the bounded lines
into one multi-line `message`; Aspire then renders only its leading portion. Finally,
`requireAspireSuccess` chooses `stderr || stdout`, so one non-empty stream can hide the other.

The generic repair is to select the first retained line matching a tool-agnostic failure shape as
the short `message`, while preserving the entire unchanged bounded array as `actionableStderr` in
the typed result record. The Phase-B verifier reports both stderr and stdout with labels. This does
not parse Prisma fields, name Prisma phrases, change D-224's bounds, or discard retained context.

Source inspection establishes one likely underlying class but does not yet authorize a behavioral
repair: the typed `migrate` command invokes `db:migrate:<engine>`, whose generated task calls the
interactive migration-authoring runner (`prisma migrate dev`). Generated workspaces separately
publish `db:deploy:<engine>` backed by `prisma migrate deploy`. The cited CI's retained diagnostic,
once promoted, decides whether that mismatch is the actual failure. Until then the underlying cause
remains unreported rather than inferred.

### First diagnostic CI — run 33452657304

At `592a8e688`, PostgreSQL again reached 58 passing gates before
`runtime.typed-db-phase-b` failed. The Phase-B formatter proved the outer Aspire CLI emits its
command result on stderr and leaves stdout empty. Aspire displayed only the first line of the
multi-line command message, so newline-joined retained context was not observable at that boundary.

The promoted message remained `Loaded Prisma config from prisma.config.ts.`. Source tracing explains
why: `run-tool` retained stderr only, while `packages/database/scripts/migrate.ts` forwards Prisma
stdout and logs its own non-interactive guidance through `console.log`. The typed command invokes
`db:migrate:postgres`, which maps to that script and always constructs `prisma migrate dev`; CI is a
non-terminal session. Therefore the next diagnostic delta retains bounded stdout without changing
D-224's stderr policy and serializes the decisive message first on one Aspire-visible line. This is
generic stream transport, not a Prisma classifier special case.

# S6 runtime repair plan (pending independent PLAN-EVAL)

## Public surface

After successful database client generation against an already running project
AppHost, refresh only the affected running service consumers so requests use the
new client. Keep the AppHost resident and preserve stopped/disabled resources.
Overview and Records must render actual seeded database rows, and the canonical
service example must respond successfully. The static CRUD pattern page must not
claim a live route exists when no service was generated.

## Vocabulary and ports

A generated-client consumer is an enabled service whose declared deno.json @database import resolves to the
selected database facade (root database/mod.ts for the primary database, or the
selected database workspace mod.ts); a running consumer additionally has an exact
logical identity and Running state in that project's Aspire resource snapshot.
Use existing FileSystemPort/config schema and AspireCommandExecutor; no process
scraping or broad AppHost restart. The existing lifecycle lease scopes mutation.
Keep default watch policy unchanged. No lazy dynamic-import or placeholder proxy.

## Constants and contract

Use existing DbOperation, resource state/command contracts, and named helper
functions for identifying eligible resources. Refresh only after successful
generate, only for a resident AppHost, and before returning success. Failed
generation never restarts; restart failure fails the command with a concrete
resource remedy. Multi-database operations refresh only selected primary users.
Standalone ephemeral DB hosts and no-Aspire runners do not touch other processes.
Decide whether app refresh is necessary from live proof (Vite already watches
imported Zod schemas); avoid restarting apps without evidence.

## One commit slice, under 30 source files

1. Give the init-only Prisma placeholder a rejecting $queryRaw health method
   (and make $queryRawUnsafe reject too) with an actionable generate-client error.
   This makes initial /health fail honestly; do not add fake delegates.
2. Add bounded post-generate consumer refresh adapter and integrate resident
   DbOperationRunner path. Tests for exact project/resource identity, selected DB,
   Running-only behavior, no full restart, failure propagation and non-generate
   no-op. Preserve runner leases/cancellation and existing operation semantics.
3. Make static CRUD reference link conditional and typed via appRoutes, with
   no-service truthful copy and generated-service canonical link.
4. Extend existing scaffold.runtime app reference probe to require Seed User in
   Overview, Records and canonical resource page (not only shell headings). Add
   negative tests for healthy-shell/unavailable pages and missing seed rows.
5. Focused live start-before-generation SQLite proof: same generated Aspire
   argv and native discovery, real DB commands and server SSR. Red:200 health
   but unavailable records/500 example. Green: seeded rows from current service.
   Prefer real isolated Aspire with cache disabled via CLI when local Docker
   unavailable; retain full runtime suite requirement/UNPROVEN reporting.

## Deferred scope

No global watch-default change, new CLI flag, automatic whole-host restart,
production deployment logic, fake/demo rows or showcase plumbing. Do not touch
foreign resources. Keep existing unavailable/error projection safe.

## Contributor path and gates

Update app template README to link the DB-generation lifecycle contract and
explain runtime row proof. Structured source check/lint/fmt, focused lifecycle
and app probe tests, expanded scaffold tests, quality and carrier checks. Red/
green runtime receipts plus independent IMPL-EVAL before sign-off. Any visible
page composition changes get independent visual review as needed; static CRUD
reference copy/link does not alter the five accepted Utility archetype pages.

## Target selection refinement

Do not restart memory services: their generated deno.json has no @database import.
Use this existing declarative dependency to identify generated database consumers;
no new service schema field and no source-text inference. Resolve service Workdir
and import targets within the project. Select only exact logical identities from
Aspire describe, Running state (even if unhealthy), restart and wait healthy with
existing bounded timeout/cancellation. Ambiguous identities fail closed. Nonzero
restart/wait failure fails generate completion with an exact manual remedy.

Actual isolated cache-disabled Aspire is available locally even though dotnet shim
lookup and Docker doctor fail; start returned0 and orders/shop-web are Running.
Use that real host for final exact-order red/green proof. Skip only cache through
the public --cache false option; no manual fixture edits.

# Northwind orders foundation — revised plan

## Public surface

This PR now resolves child #2580, not the entire showcase #2571. The owner explicitly
requested the next tracker subtask or sibling fan-out. Independent MCP discovery is
filed as #2581 (plugins/ai); the coupled full-showcase remainder stays on #2571.

Use the existing `netscript init <name> --from northwind` and maintainer equivalent.
Do not introduce `--example showcase` before that complete recipe exists. `--from`
selects domain content; `--preset` selects visual tokens. The first built-in domain
preset is northwind. Reject combining it with --preset for this first supported
recipe, before preset fetches or writes. Unknown --from values report supported names.

Northwind defaults to SQLite, orders/Order, service enabled and cache disabled; allow
Postgres, custom project/app names and an explicit cache choice. Reject none/mysql/mssql,
--no-aspire, --service false and conflicting service/model names before I/O. Interactive
init does not offer Northwind implicitly; explicit --from fills database/service/model
before prompts, and only the remaining unrelated questions are asked. Normal init's
prompts, file set and contents stay unchanged.

## Vocabulary / contracts

Archetype 6 CLI/Tooling, existing init composition. Northwind is a closed domain preset,
not a plugin installer or runtime. Order fields: id Int autoincrement; name String unique
(stable order reference); customerName String; shipCountry String; status String default
pending; totalCents Int; createdAt/updatedAt dates. Fixed representative seed records are
explicit demo data persisted through Prisma, never presentation-only rows. Upsert by
unique name with update:{} preserves user edits and row count on repeat seeding.

The generated typed orders contract uses the real Prisma/Zod schema. Its current
unauthenticated CRUD is explicitly a local demo; no auth installation/security claim.
The parent integration must protect the contract via a supported template input and
service auth configuration when auth is added, never text-replace generated TS.

## Ports, placement and effects (B1–B3)

No post-init recipe runner or plugin effects in this leaf. Normalize scaffold choices
before public prompts and before maintainer orchestration, with the same pure resolver
also protecting direct shared-kernel init. Keep explicit false distinct from omission.
The validated preset flows into DatabaseScaffolder and app writer. DatabaseScaffolder
selects the Northwind schema, placeholder Zod and seed assets instead of the generic
ones in its existing write calls, under the existing overwrite/skip policy. There is
no overwrite-after-generation phase and no string rewriting of emitted TypeScript.
The typed records adapter uses the existing generated client and same-origin SSR loader.

Existing ScaffolderPort, FileSystemPort and TemplatePort perform all writes; ProcessPort
retains Fresh scaffold/format/git effects. No new port/dependency graph is required.
All Northwind content exists before runInitPipeline's formatter/git commit and before
executeInit's single JSON output. InitResult phase/file counts include it naturally;
JSON project adds `from` only when selected; plugins remains truthfully empty. Maintainer
package sync remains afterward and cannot omit SQLite packages: normalize dbEngine
before passing its request to syncPackages. No installer is called during dry-run.

Database preparation remains explicit existing `db init`, `db generate`, `db seed`
commands in next steps; init never claims a running/seeded project. Existing errors exit
nonzero without success JSON. No new multi-step mutation recipe is introduced. The
future parent recipe must separately solve completed/failed-step JSON and deferred
finalization across public/maintainer package-sync, plugin and preset effects.

## Constants and contributor path

One named NORTHWIND_PRESET identifier and defaults in domain/scaffold, plus the existing
PresetRegistry entry. No duplicated version/model catalogs. Contributor entry is
`packages/cli/src/kernel/domain/scaffold/northwind-preset.ts`, linked from CLI README.
Northwind assets use the embedded-template carrier and dedicated keys.

## Commit slices

S1 (under 30 source files plus generated carriers): shared preset contract/resolver;
public/maintainer selection; database schema/placeholder/idempotent seed; typed records
adapter and fixture-aware docs. Existing page markup/CSS is reused. Tests cover parser
parity, explicit false, option conflicts, interactive behavior, dry-run and JSON, full
ordinary scaffold file-set/content hash baseline, schema/seed contracts and writes.
Source paths: CLI domain/scaffold + db-engine; application registries/scaffold/writers
and JSON renderer; database adapter; init commands; new Northwind assets and carriers.

S2: real generated DB migration/codegen/seed twice and workspace typecheck; focused
runtime assertion through a running orders service and page rendering, failure control;
independent visual/review evidence and final docs. Reuse existing runtime regression
seams and native SQLite/Aspire support. No broad plugin/showcase suite is claimed here.
Every slice updates worklog/context and gets independent review before sign-off commit.

## Validation / visual reference

Capture the ordinary init golden file manifest with content hashes before source edits;
exclude only nondeterministic timing/output, not emitted files. Test both no-service and
SQLite service paths against it. Test public/maintainer with shared resolver and generated
phase assertions; confirm real maintainer init JSON emits once and dry-run writes nothing.
After real db generate, typecheck generated workspaces through the declared wrapper.
Seed twice, mutate a seeded row, seed again and assert row count/user edit preserved.
Render list and detail using real seeded Order rows through the running typed service;
assert name, customer, country, status and total; service-down control must show unavailable.
Native Aspire evidence is distinct from full Docker scaffold.runtime (attempt or UNPROVEN).
Public published-package runtime proof belongs to release E2E; this run proves local source.

Figma references: existing Utility dashboard and orders light/dark, at desktop/mobile.
Detail has no dedicated locked frame: judge existing Utility shell/table/card typography,
spacing, navigation and responsive behavior against orders/dashboard. No new chat/lifecycle
page is in this leaf. Independent Astra score >=8 fidelity and quality for changed views.
Scoped structured check/lint/fmt, CLI tests, docs:accuracy, release:preflight, all check:*
carriers and architecture as configured. CLI source explicitly included despite root excludes.
No CSS budget change. Independent Claude Opus5.5 high PLAN-EVAL/IMPL-EVAL reused session;
one FAIL_PLAN so far, two consecutive terminal failures stop and escalate.

## Deferred scope and B4–B7 decisions

Parent #2571 remains open. Runtime MCP choice is an app-owned server over the typed orders
client (option B4-b), with Aspire discovery client support independently owned by #2581.
This follows the owner's instruction to choose and proceed; no acceptance weakening to
plain AI tools. App server/authentication remains part of parent integration.

Parent composition must use installPlugin with its full dependencies in public mode and
installLocalPlugin after package sync in maintainer mode; db operations and generate
plugins/resource through existing use cases; plugin-owned ai add/mcp add and auth
backend/provider commands through the existing subprocess dispatcher. Dry-run cannot call
installPlugin even with dryRun, since it fetches/starts plugin processes.

Parent durable AI requires app-owned replacement files with explicit conflict policy,
auth-derived user/thread identities, authorize gate, connected thread store, same-origin
stream proxy and streams installed before AI. Activity also needs a same-origin stream
surface; do not mistake chat proxy for a generic activity proxy. OAuth and AI provider
fixtures are labeled separately from real external-provider proof. Background plugins
and auth require Garnet/KV Auto (Docker or dotnet); SQLite does not remove that dependency.
The full showcase runtime stays UNPROVEN until a Docker-capable suite actually passes.
That future suite belongs in cli-surface/expensive-runtime and preserves scaffold.runtime;
Aspire logical names and installer-declared references are mandatory. No parent acceptance
checkbox is marked by this foundation PR. Full Explore the showcase docs follow assembly.

# Layered database DX API audit

> Scope: owner finding `OWNER-DX-01`; current repository and pinned Prisma RC1 source.\
> Verdict: **the RFC has the right kernel, but presents its middle layer as the golden path and
> unnecessarily makes a generated TypeScript binding universal.** Adopt the repository's existing
> preset → factory → native-primitives pattern and make direct app-local inference the default.

Labels below distinguish **[FACT]** repository/upstream evidence, **[INFERENCE]** conclusions from
that evidence, and **[PROPOSAL]** new API.

## 1. The shipped NetScript pattern

**[FACT] Service/Hono.** `packages/service/src/presets/define-service.ts:216-275` (`defineService`)
is the golden-path preset and literally calls
`packages/service/src/builder/service-builder.ts:195-200` (`createService`), then applies the
standard chain. `ServiceBuilder` exposes one-method-deeper customization (`withCors`,
`withDatabase`, `withRPC`, `use`, `route`, `build`, `serve`) at lines 61-175. Its implementation
constructs a real Hono app and composes Hono plus NetScript primitives in
`service-builder-impl.ts:12-45,60-88`; direct adopters can instead use such public primitives as
`createRPCPlugins`/`createRPCHandler` in `primitives/handlers.ts:38-114`. The repository calls these
implementation layers 3/2/1; this audit calls them user-facing L1/L2/L3 (highest to lowest).

**[FACT] SDK/frontend data access.** There is no public symbol named “DAL”. The actual seam is
contract-derived clients and query resources. `packages/sdk/src/presets/define-services.ts:97-127`
(`defineServices<const TServices>`) fans one exact contract map into the same values returned by
`createServiceClient`, `createQueryFactory`, and `createServiceQueryUtils`. The first delegates to
native `createORPCClient` (`src/client/service-client.ts:41-65`); the second derives cache/query
operations without replacing the contract (`src/query/query-factory.ts:41-188`).
`packages/sdk/mod.ts:9-32` explicitly promises that dropping down a layer does not replace wiring.

**[FACT] Fresh.** `defineFreshApp` returns the real Fresh `App` and accepts an existing app plus
factory/configuration escape hatches
(`packages/fresh/src/runtime/server/define-fresh-app.ts:24-117`). `definePage` builds its public
type-state facade from `createBuilder(createDefaultConfig())`
(`src/application/builders/define-page/builder/mod.tsx:465-471`); `withResource(s)` carries resource
types forward (`builder/state.ts:45-64`) while `retagConfig` changes compile-time state without
inventing runtime concepts (`builder/factory.ts:8-49`).

**[FACT] Doctrine.** A3 requires the 80% case in one chain and advanced cases one method deeper; A6
permits helpers only for policy, a test seam, or stable non-trivial work; A10 prefers a plain
composition factory; A11 requires named extension axes. Public `define`/`create` semantics and the
ban on upstream re-exporting remain binding (`docs/architecture/doctrine/01-thesis-and-axioms.md`,
`02-public-surface.md`, `07-composition-and-extension.md`).

### Reusable laws

1. The preset uses the public factory; it is not a parallel implementation.
2. Every layer preserves the same inferred source value and returns the same lower-layer objects.
3. NetScript adds cross-cutting policy once; the native library remains visible at the escape hatch.
4. One registration fans out to every consumer; type-state is not promoted into runtime machinery.
5. Defaults are inspectable, immutable, and replaceable; diagnostics name the failed policy.

## 2. What the current RFC lacks

**[FACT]** The RFC jumps from native `defineContract` to a 40-line target/space composition and then
to a generated binding (`Step 2`, lines 227-290; `Step 3`, lines 292-363). This is a sound L2/L3
explanation, not an A3 adoption API. Plugin space registration is separate from the application
contract example. The cost section explicitly accepts surprise “re-emit” (`lines 1037-1045`).

**[INFERENCE]** Users must currently understand target identity, spaces, policy, artifacts, provider
registration, runtime, and binding generation before the first query. The architecture is flexible,
but the presentation does not resemble NetScript's Hono, SDK, or Fresh adoption surfaces.

## 3. Proposed three-layer analogue

All examples describe the same one-target app. L1 and L2 produce the same `DatabaseDefinition`; L3
uses the same manifest, provider, ports, and native query object. None defines models, fields,
relations, filters, or queries for Prisma.

### L1 — golden-path recipe

```ts
import { definePostgresDatabase, fromAspire } from '@netscript/database';
import { authDatabase } from '@netscript/plugin-auth-core/database';
import { appContract } from './app.contract.ts'; // native Prisma defineContract(...)

export default definePostgresDatabase({
  contract: appContract,
  connection: fromAspire('postgres'),
  extensions: [authDatabase()],
});
```

**[PROPOSAL]** This preset chooses inspectable defaults: target `primary`, app space `app`, managed
ownership, retain-on-removal, and the certified PostgreSQL provider. It calls only the L2 functions
below. An optional chained form is justified only if real successive type-state appears; do not add
a cosmetic builder.

### L2 — factories used by L1

```ts
const primary = defineDatabaseTarget({
  id: 'primary',
  provider: prismaPostgres({ minVersion: 15 }),
  connection: fromAspire('postgres'),
  policy: { destructive: 'deny', defaultOwnership: 'managed' },
});

export default defineDatabase({
  targets: { primary },
  spaces: {
    app: defineDatabaseSpace({
      id: 'app',
      owner: 'app',
      target: 'primary',
      contract: appContract,
    }),
  },
  extensions: [authDatabase()],
});
```

**[PROPOSAL]** `extensions` is the sole registration. Each bundle may contribute authoring,
manifest/control, runtime, and validation facets; the compiler expands it in the already-planned two
phases, rejects duplicate identities, and preserves deterministic order. L1 forwards the exact same
bundle and therefore cannot omit a facet.

### L3 — native authoring plus NetScript ports

```ts
// app.contract.ts: direct @prisma/orm-postgres/contract-builder defineContract(...)

// runtime.ts
import type definition from './database.ts'; // erased
import { manifest } from './.netscript/database/manifest.ts'; // emitted value

const binding = createPrismaPostgresBinding<
  ContractOf<typeof definition, 'app'>
>({ target: 'primary', space: 'app', manifestDigest: manifest.digest });

await using runtime = await createDatabaseRuntime({
  manifest,
  providers: [prismaPostgres()],
  connections,
});
export const primary = runtime.bind(binding); // primary.query is native Prisma
```

**[PROPOSAL]** `ContractOf` only extracts an opaque generic; adapter-owned
`createPrismaPostgresBinding` maps it to Prisma query/transaction types. The provider-neutral kernel
never names Prisma. Advanced consumers may construct ports and call compile/plan/apply separately,
but runtime still receives only the manifest, provider values, connections, and a digest-bearing
binding—not `DatabaseDefinition`.

## 4. Remove manual type generation

**[FACT]** Pinned Prisma already proves both halves. Its no-emit demo calls
`postgres<typeof contract>({ contract })`
(`.llm/tmp/prisma-v8-rc1/examples/prisma-8-demo/src/prisma-no-emit/context.ts:1-15`). More
importantly, the emitted overload accepts `contractJson` plus a compile-time `TContract`;
`_contract?: TContract` is phantom
(`packages/3-extensions/postgres/src/runtime/postgres.ts:96-129,150-166`). Runtime always
serializes/deserializes to a contract value. `PostgresClient<TContract>` exposes typed `sql`, `orm`,
enums, and transactions (`lines 45-78`). Therefore a type-only `typeof definition` can type a stable
adapter factory while runtime consumes the canonical artifact.

**[FACT]** Root `deno.json:174` enables `isolatedDeclarations`. A local minimal Deno check confirms
that an exported `const contract = defineContract(...)`-shaped inferred call requires an explicit
annotation under that option. Prisma's demo does not claim this constraint. The planned JSR audit
correctly forbids slow types for framework packages, but its claim that every app binding must be
generated was prospective, not executed evidence.

**[PROPOSAL] Decision.** App-owned authoring modules are build inputs, not JSR exports. Give that
narrow app-local project `isolatedDeclarations: false`; retain strict checking and keep every
published `@netscript/*` package at `true`. Then the default emits **no TypeScript binding**: exact
inference flows `typeof definition → ContractOf → adapter binding`, and the import erases.
Emit/watch only content-addressed manifest, contract JSON, lineage, and provenance values.

Artifact-only plugin spaces remain behind plugin-owned ports. If a consumer intentionally exports an
inferred database definition from a publishable package or requests direct queries over an
artifact-only space, exact types cannot be reconstructed from JSON by TypeScript. In that bounded
case, generate the provider declaration automatically and atomically during the same compile—not a
hand-run NetScript binding, not a framework slow type. W3 must prove both paths against the pinned
public declarations; fall back universally only if the direct fixture fails without private imports
or copied overloads.

## 5. Automation and projections

**[PROPOSAL]** `netscript dev/start/test/build` runs an initial content-hash compile before loading
the runtime; `dev` then watches the authoring graph, writes a temporary artifact set, verifies it,
and atomically swaps the directory before restarting affected consumers. Generated task dependencies
make direct project commands do the same. CI runs compile-and-diff; production startup never mutates
schema or auto-applies migrations. A digest mismatch remains a hard safety refusal, but its message
says which file changed and the normal launcher already repairs artifacts—“run re-emit” is only an
escape-hatch command, never the expected workflow.

Aspire projects target/resources and injects connections from the manifest; CLI projects the same
operation catalog; agents read manifest/plan/receipt schemas. None evaluates the TypeScript
contract. This makes the serializable artifact both the interoperability boundary and the low-token
agent surface; L1 is the low-token authoring path, L2 is explicit customization, and L3 is a stable
escape hatch rather than an undocumented deep import.

## 6. Ownership, RFC edits, and gates

**[PROPOSAL] Package impact.** Keep the six-package graph. Add the L1 preset and `ContractOf` to
`@netscript/database`; put only `createPrismaPostgresBinding` and provider type mapping in
`@netscript/database-prisma-postgres/binding`; keep lifecycle in `-runtime`. No new package, global
registry, Prisma re-export, or runtime dependency is required.

To keep the RFC at or below 10k words, replace rather than append:

- compress `Step 2` into L1 plus the L2 expansion; replace `Step 3`'s generated module with the
  type-only binding example above;
- revise “two tracks”/soundness (`lines 702-723`), costs (`1037-1045`), rationale (`1071-1073`),
  migration wave 4, introduction diagram, and conclusion wherever generation is stated as universal;
- fold the single-extension rule into the composition example and delete repetitive prose that
  separately re-explains target/space fields already specified in the formal contracts.

Acceptance requires fixtures for direct inference, type-only erasure, root/published
`isolatedDeclarations`, artifact-only fallback, stale atomic watch, plugin single registration,
packed JSR consumers, manifest mismatch refusal, and native query/transaction inference. Kill the
direct path if it needs Prisma private imports, copied overloads, a provider type in a neutral
package, or runtime evaluation of authoring code; then generation must remain automatic, atomic,
launcher-integrated, and invisible.

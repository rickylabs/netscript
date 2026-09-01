# Prisma 8 TypeScript-schema and oRPC transfer audit

> Provenance: independent delegated architecture/source audit for the NetScript DB RFC, completed
> 2026-08-13. Prisma RC source inspected at `/home/codex/.local/share/Trash/files/prisma-v8-rc1`,
> detached at `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5` (`v8.0.0-rc.1`, 2026-08-07), with
> current-main object `71e2e0d9ee1f306b5a11435cd1973023cb33866a` also inspected. Historical
> evolution was checked against commit `fd88abf4`, redesign PR
> [prisma-next#261](https://github.com/prisma/prisma-next/pull/261) / commit
> [`27ccefc3`](https://github.com/prisma/prisma-next/commit/27ccefc3), and legacy-removal commit
> [`e1e5ab2c`](https://github.com/prisma/prisma-next/commit/e1e5ab2c) / PR #317. NetScript oRPC
> evidence was inspected in `/home/codex/repos/netscript-db-rfc`.

Legend: **Fact** = directly source-backed; **Inference** = architectural consequence of those facts;
**Recommendation** = proposed NetScript design.

## 1. Executive conclusion

**Fact:** The fluent API shown in the early architecture
material—`defineContract().target(...).model(...).column(...).primaryKey(...)...`—was real, but it
is no longer Prisma Next's authoring direction. It was replaced in April 2026 by a model-first
callback API:

```ts
defineContract(
  { extensions: { pgvector } },
  ({ field, model, rel, type }) => {
    const User = model('User', {
      fields: {
        id: field.id.uuidv4String(),
        email: field.text().unique(),
      },
    });

    return { models: { User } };
  },
);
```

The redesign explicitly removed the separate table/column choreography, stringly typed cross-model
references, hard-coded helper vocabulary, and required storage-name repetition. The current API
instead uses typed model tokens, semantic fields and relations, pack-contributed helpers, and a
`.sql(...)` storage overlay.

**Recommendation:** NetScript should adopt the current native Prisma builder as its authoring
foundation. It should not recreate the old fluent chain or introduce a parallel NetScript model DSL.
NetScript's layer should own composition, policy, contract-space ownership, extension bundles,
artifact automation, migrations, runtime lifecycle, validation, and consumer adapters while
preserving native Prisma builder values and `typeof contract` end to end.

This is directly analogous to how NetScript already augments oRPC: it starts with the real upstream
builder, applies NetScript policy and conventions, derives types from upstream-native values, and
fans the result into other framework surfaces.

## 2. Evolution of the Prisma API

### Historical fluent builder

**Fact:** Historical source at commit `fd88abf4` contained:

- `SqlContractBuilder`
- `.target(...)`
- `.extensionPacks(...)`
- `.table(...)`
- `.model(...)`
- top-level `defineContract()`

The associated table builder exposed `.column(...)`, `.primaryKey(...)`, `.unique(...)`,
`.index(...)`, and `.foreignKey(...)`.

Primary historical source:

- [`contract-builder.ts` at `fd88abf4`](https://github.com/prisma/prisma-next/blob/fd88abf4/packages/2-sql/2-authoring/contract-ts/src/contract-builder.ts)
- [`table-builder.ts` at `fd88abf4`](https://github.com/prisma/prisma-next/blob/fd88abf4/packages/1-framework/2-authoring/contract/src/table-builder.ts)

**Fact:** [PR prisma-next#261](https://github.com/prisma/prisma-next/pull/261), merged on April 3,
2026, documents the redesign. Its “before” example shows the fluent table/model chains; its “after”
example introduces callback-scoped helpers, typed model tokens, inline semantic attributes, and
`.sql(...)`.

The implementation landed in [`27ccefc3`](https://github.com/prisma/prisma-next/commit/27ccefc3).
The legacy implementation was subsequently removed in
[`e1e5ab2c`](https://github.com/prisma/prisma-next/commit/e1e5ab2c), associated with PR #317.

### RC1/current authoring model

**Fact:** ADR 181 now says “No table or column layer.” The relevant source is:

- `docs/architecture docs/adrs/ADR 181 - Contract authoring DSL for SQL TS authoring.md:7-70`
- Same ADR at `:90-104`, `:108-151`, and `:153-183`

The ADR's core principles are:

- semantic model first, storage second;
- pack-driven vocabulary;
- typed local references;
- same canonical downstream contract;
- pure, deterministic canonical output.

The exact RC1 demo is at:

- `examples/prisma-8-demo/prisma/contract.ts:1-70`

It demonstrates:

- Postgres public `defineContract`;
- an extension pack, pgvector;
- `type.pgvector.Vector(1536)`;
- native enums;
- `field.id.uuidv4String()`;
- temporal presets;
- JSON and optional fields;
- literal defaults;
- typed `rel.hasMany`/`rel.belongsTo`;
- foreign-key authoring using typed column/model references;
- table mapping through `.sql(...)`.

The Postgres-bound public overloads are at:

- `packages/3-extensions/postgres/src/contract/define-contract.ts:46-121`

The callback receives exactly:

```ts
ComposedAuthoringHelpers<SqlFamily, PostgresPack, Extensions>;
```

and may return native `types`, `models`, and `enums`. The Postgres wrapper delegates to the generic
`buildBoundContract`.

### Volatility

**Fact:** The RC release notes explicitly warn that RC respins may break, remove, or rename APIs and
the contract format. See the
[Prisma 8.0.0 RC1 release](https://github.com/prisma/prisma/releases/tag/v8.0.0-rc.1).

**Fact:** Churn has continued after the callback redesign:

- `extensionPacks` became `extensions`;
- current main adds check-constraint/no-check functionality absent from RC1;
- current main adds generated JSON Schema for `contract.json`;
- authoring and contract-format commits continue to land between RC1 and current main.

**Recommendation:** The RFC should commit to the architectural direction, not freeze the exact RC1
overload syntax. Put all Prisma-version-sensitive integration behind a very small adapter package
and pin Prisma tightly during implementation.

## 3. Exact current builder anatomy

### Contract definition and lowering

**Fact:** `ContractDefinition` currently contains:

- family and target;
- extension packs;
- naming;
- storage hash;
- foreign-key defaults;
- control policy;
- namespaces;
- types;
- models;
- codec lookup;
- enums;
- entity handles.

Source:

- `packages/2-sql/2-authoring/contract-ts/src/contract-builder.ts:43-82`

`buildBoundContract` constructs the composed helper surface before invoking the callback and then
merges returned types, models, enums, and entities:

- `contract-builder.ts:416-505`

The callback overload preserves its returned literal types:

- `contract-builder.ts:437-462`

### Schema DSL

The implementation in:

- `packages/2-sql/2-authoring/contract-ts/src/contract-dsl.ts`

contains:

- naming strategies around `:30-35`;
- scalar field state around `:43-76`;
- scalar builder methods—optional, column mapping, list cardinality, literal defaults, SQL defaults,
  identity, unique, SQL overlay—around `:162-434`;
- relation state/builders around `:555-700`;
- typed references, including cross-contract-space references, around `:709-757`;
- indexes, foreign keys, and referential actions around `:771-895`;
- SQL constraints around `:965-1137`;
- model attributes and SQL stages around `:1141-1184`;
- typed model builders around `:1370-1563`;
- contract input around `:1659-1738`;
- model overloads and per-model namespaces around `:1741-1796`;
- branded `extensionModel` cross-space handles around `:1813-1850`;
- relation and lazy-token handling around `:1878-2028`.

**Fact:** The core helper surface only hard-codes `field.column`, `field.generated`, and
`field.namedType`; the richer vocabulary is composed from family, target, and extension packs:

- `packages/2-sql/2-authoring/contract-ts/src/composed-authoring-helpers.ts:43-102`
- `:132-154`

Packs may contribute type helpers, field helpers, entity helpers, and index types. Composition
includes collision checks:

- `composed-authoring-helpers.ts:214-233`
- `:272-306`

**Inference:** Prisma's own native builder is already an extensible semantic DSL. A competing
NetScript DSL would duplicate the part Prisma has specifically designed as an extension seam.

## 4. Plugin fragments without a proprietary schema DSL

### Feasibility

**Fact:** The callback may return maps of native builder values:

```ts
{
  types?: Record<string, StorageTypeInstance>;
  models?: Record<string, ModelLike>;
  enums?: Record<string, EnumTypeHandle>;
  entities?: readonly PackEntityHandle[];
}
```

**Inference:** A NetScript plugin can contribute native Prisma model/type/enum/entity values without
translating them into a NetScript-owned AST.

A fragment can therefore be a function receiving the exact native helper object and returning a
const-preserved native result:

```ts
export const workersFragment = definePrismaFragment({
  id: 'workers',
  ownership: 'app',
  build(h) {
    const Job = h.model('Job', {
      fields: {
        id: h.field.id.uuidv4String(),
        status: h.field.text(),
      },
    });

    return {
      models: { Job },
    } as const;
  },
});
```

`definePrismaFragment` must be a composition/metadata facility, not a schema language. Its returned
`Job` remains Prisma's model-builder value.

### Two-phase composition requirement

**Fact:** Extension packs are part of the scaffold and determine the helper object's static and
runtime shape before the callback runs.

**Inference:** Arbitrary “register an extension while executing a fragment” composition cannot be
sound. NetScript needs two phases:

1. Collect fragment manifests: required packs, control/runtime/validation facets, target
   requirements, ownership, dependencies and namespaces.
2. Build the final scaffold, obtain the fully composed native Prisma helper object, then invoke
   fragments.

### Literal-type preservation

**Inference:** A generic `Array.reduce()` into `Record<string, ModelLike>` would erase literal model
names, relation coordinates and field inference. This would repeat an existing problem visible in
NetScript CRUD contracts, where widening to oRPC's `AnySchema` required phantom markers to restore
exact types.

**Recommendation:** Generate an app-local composition root with explicit const-preserving calls and
object spreads. Do not expose a general runtime registry whose return type is merely
`Record<string, ModelLike>`.

### Two ownership modes

**Recommendation:** Make ownership explicit:

```ts
ownership: 'app' | 'space';
```

- `app`: the host app owns the model fragment and its migration history. The generated app contract
  composes it.
- `space`: the plugin owns a complete native Prisma contract space with its own canonical artifact,
  migration graph and head.

Plugin-owned tables should normally use `space`. App-owned fragments are appropriate only when the
application deliberately owns the resulting schema and migrations.

Prisma's contract-space ADR already defines one `contract.json`, migration graph and head per owner:

- `docs/architecture docs/adrs/ADR 212 - Contract spaces.md:46-88`
- package and emit layout at `:90-127`
- per-space planning at `:194-228`
- artifact self-consistency at `:251-268`

Cross-space model handles are already represented by Prisma-native branded values:

- `packages/3-extensions/supabase/src/contract/handles.ts:1-77`

## 5. NetScript's oRPC architecture as the direct precedent

| Existing NetScript/oRPC pattern                                                  | Prisma-builder transfer                                                               | DB-specific addition                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `baseContract = oc.errors(commonErrorMap)` uses the real oRPC builder            | Start with the real public Prisma `defineContract`; apply NetScript presets around it | Persist canonical contract identity and migration ownership              |
| Precise types flow from the upstream builder into `implement<typeof contract>()` | Preserve exact `typeof contract` into ORM/query/runtime/validation                    | Preserve family, target, namespace, contract-space and resource identity |
| CRUD factory returns real oRPC route-builder values                              | Fragment factories return real Prisma model/type/enum/entity values                   | Fragments must be deterministic and migration-owning                     |
| Generated const-generic service root creates clients, queries and query utils    | Generated DB root creates resources, operations, validators and framework adapters    | Must also construct pools, transactions, health and disposal             |
| Standard Schema is consumed structurally through `~standard`                     | Derived database validators implement Standard Schema V1                              | Must distinguish create/update/read/wire channels and codec semantics    |
| `$context<Ctx>()` supplies typed handler context                                 | `createDatabase(definition, binding)` supplies typed runtime resource context         | Runtime URLs, credentials, pools and transaction scopes                  |
| Soundness tests use compile failures and `@ts-expect-error`                      | Builder/fragment/namespace/operation compile-time conformance tests                   | Artifact, migration and provider-capability conformance                  |
| One source contract fans into SDK surfaces                                       | One database definition fans into ORM, queries, validation, SSR and agents            | Canonical artifact emission and migration ledger                         |

Exact NetScript evidence:

- Real upstream oRPC builder and NetScript error augmentation:\
  `packages/contracts/src/application/contract-primitives.ts:1-9`, `:55-89`, `:125-159`
- CRUD generation through real `.route().input().output()` calls:\
  `packages/contracts/crud/create-crud-contract.ts:107-145`, `:278-407`
- The type-erasure workaround that DB composition should avoid:\
  `create-crud-contract.ts:119-145`
- Structural Standard Schema contract:\
  `packages/contracts/src/domain/schema-types.ts:16-52`
- SDK inference from Standard Schema and public `~orpc` metadata:\
  `packages/sdk/src/ports/service-client.ts:7-46`, `:49-124`
- One const-generic service map fanning into three surfaces:\
  `packages/sdk/src/presets/define-services.ts:19-127`
- Generated app-local composition root:\
  `packages/cli/src/kernel/assets/workspace/contracts/v1-aggregate.ts.template:1-20`
- Real upstream builder plus typed worker context and implementation:\
  `packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts:70-96`, `:437-573`
- Types derived from native contract values:\
  `packages/plugin-workers-core/src/contracts/v1/workers.contract-types.ts:59-89`
- Typed `$context<WorkersRequestContext>()`:\
  `plugins/workers/services/src/routers/router-context.ts:27-61`
- Compile-time soundness tests:\
  `plugins/workers/services/src/routers/workers-contract-soundness_test.ts:11-75`
- Runtime definition/lifecycle precedent:\
  `packages/service/src/presets/define-service.ts:216-275`

**Recommendation:** The Prisma analogue of `baseContract` is not a new model language. It is a
policy-applied native builder entry point or a native contract wrapped in a frozen NetScript
database definition.

## 6. Candidate public APIs

These are RFC candidates, not descriptions of existing APIs.

### Candidate A — native contract plus NetScript database definition

This is the recommended baseline because it minimizes coupling to unstable Prisma type internals.

```ts
import pgvector from '@prisma/orm-extension-pgvector/pack';
import { defineContract, rel } from '@prisma/orm-postgres/contract-builder';
import { defineDatabase } from '@netscript/database/prisma';

export const contract = defineContract(
  {
    extensions: { pgvector },
    namespaces: ['app'],
  },
  ({ field, model, type }) => {
    const types = {
      Embedding: type.pgvector.Vector(1536),
    } as const;

    const User = model('User', {
      namespace: 'app',
      fields: {
        id: field.id.uuidv4String(),
        email: field.text().unique(),
      },
    });

    const Post = model('Post', {
      namespace: 'app',
      fields: {
        id: field.id.uuidv4String(),
        userId: field.uuidString(),
        embedding: field.namedType(types.Embedding).optional(),
      },
    });

    return {
      types,
      models: {
        User: User.relations({
          posts: rel.hasMany(Post, { by: 'userId' }),
        }),
        Post: Post.relations({
          user: rel.belongsTo(User, { from: 'userId', to: 'id' }),
        }),
      },
    };
  },
);

export const appDatabase = defineDatabase({
  id: 'app',
  contract,
  migrations: { space: 'app' },
  validation: { profile: 'boundaries' },
});
```

`defineDatabase` must retain `typeof contract` unchanged. It adds identity and policy; it does not
reinterpret models.

Runtime creation remains separate:

```ts
export const db = createDatabase(appDatabase, {
  url: env.DATABASE_URL,
});
```

This follows NetScript doctrine: `defineDatabase` is a frozen definition; `createDatabase` performs
environment-sensitive runtime construction.

### Candidate B — generated native fragment composition

```ts
export const workersSchema = definePrismaFragment({
  id: 'workers',
  ownership: 'app',
  extensions: [workersExtension],
  build(h) {
    const Job = h.model('Job', {
      fields: {
        id: h.field.id.uuidv4String(),
        state: h.field.text(),
      },
    });

    return { models: { Job } } as const;
  },
});
```

A generated app root performs explicit native composition:

```ts
export const contract = defineContract(scaffold, (h) => {
  const workers = workersSchema.build(h);
  const app = appSchema.build(h, { workers });

  return {
    types: {
      ...workers.types,
      ...app.types,
    },
    models: {
      ...workers.models,
      ...app.models,
    },
    enums: {
      ...workers.enums,
      ...app.enums,
    },
  } as const;
});
```

The generator resolves dependencies and collisions before emitting this root. It should not use a
type-erasing registry/reduce path.

Plugin-owned schema instead exports a full space:

```ts
export const workersSpace = defineDatabaseSpace({
  id: 'workers',
  target: 'postgres',
  contract: defineContract(/* native Prisma contract */),
  migrations: {
    owner: '@netscript/plugin-workers',
    directory: './migrations',
  },
});
```

### Candidate C — policy-applied native factory

This is the closest analogue to NetScript's `baseContract`:

```ts
export const postgresContract = createPrismaContractFactory({
  naming: {
    tables: 'snake_case',
    columns: 'snake_case',
  },
  defaultControlPolicy: 'managed',
  extensions: [pgvector],
});

export const contract = postgresContract.define((h) => {
  // `h` must be Prisma's exact composed helper surface.
});
```

**Kill condition for Candidate C:** Reject it if implementing it requires copying Prisma's
overloads, reaching into private package paths, or re-declaring its generic model/type machinery. In
that case Candidate A is safer and still gives excellent DX.

## 7. End-to-end type system

Recommended flow:

```text
native Prisma TS builder
        ↓
native typed contract value
        ↓
canonical contract + stable content hash
        ↓
NetScript database definition/resource identity
        ↓
typed ORM/query/operation definitions
        ↓
Standard Schema input / output / wire views
        ↓
oRPC · tRPC · Fresh · TanStack · forms · SSR · agents
```

### Operation surface

```ts
const createUser = db.operations.User.create({
  select: {
    id: true,
    email: true,
  },
});

createUser.input; // StandardSchemaV1<unknown, UserCreateInput>
createUser.output; // selection-aware StandardSchemaV1<unknown, { id; email }>
createUser.wire; // JSON/SSR representation
createUser.execute;
```

It can be plugged directly into oRPC:

```ts
const route = baseContract
  .route({ method: 'POST', path: '/users' })
  .input(createUser.input)
  .output(createUser.output);
```

A custom query uses the same operation abstraction:

```ts
export const recentPosts = defineDatabaseOperation(appDatabase, {
  input: schemas.recentPosts.input,
  output: schemas.recentPosts.output,
  query: ({ orm }, input) =>
    orm.post.findMany({
      where: { createdAt: { gte: input.since } },
      select: { id: true, title: true },
    }),
});
```

### Runtime validation model

**Fact:** Prisma's codec layer distinguishes input, wire and JSON representations and supplies
encode/decode functions:

- `packages/1-framework/1-core/framework-components/src/shared/codec.ts:16-51`
- `codec-descriptor.ts:27-55`

However, Standard Schema currently validates codec constructor parameters, not arbitrary model
values.

**Fact:** TypeScript authoring helper arguments are not fully runtime-validated:

- `packages/2-sql/2-authoring/contract-ts/src/authoring-type-utils.ts:32-38`
- confirmed by `packages/2-sql/9-family/test/authoring-field-presets.test.ts:68-87`

**Fact:** The ArkType JSON extension documents that its no-emit type may be `unknown` and that
encoding does not validate the value. An invalid write can reach the database before failing on
RETURNING decode:

- `packages/3-extensions/arktype-json/README.md:7-17`, `:40`, `:74-87`

**Recommendation:** NetScript's Standard Schema layer must be an interpreter over the canonical
contract plus a codec-validation registry. It cannot assume that SQL native types or codec
encode/decode alone provide sound validation.

Expose at least these separate schemas:

- `create`: accepted mutation input, accounting for defaults and generated values;
- `update`: partial mutation semantics;
- `read`: full domain output;
- `wire`: serialized JSON/SSR representation.

Do not collapse those into one “model schema.”

Selection-aware query output schemas are mandatory. A full-model validator cannot validate a
projection correctly.

Database-dependent invariants—unique constraints, foreign keys, and arbitrary SQL check
expressions—must not be advertised as synchronous local structural validation. They may be exposed
as optional asynchronous database refinements.

For SSR:

1. validate/encode the domain value;
2. validate the wire representation;
3. serialize;
4. validate/decode after hydration.

For agents, expose an allowlisted operation registry with input/output schemas and policy metadata.
Do not automatically hand agents unrestricted ORM access.

## 8. Multi-schema, multi-provider and runtime identity

### Multi-schema gap

**Fact:** Runtime lowering honors per-model namespaces, but RC1 type inference does not faithfully
preserve them:

- `packages/2-sql/2-authoring/contract-ts/src/contract-types.ts:644-648` notes the current namespace
  limitation;
- `:658-689` places storage models into the default namespace and leaves additional namespace maps
  empty;
- `:771-798` similarly constructs field type maps under the default target namespace.

Current main still retains this limitation.

**Inference:** NetScript cannot claim sound end-to-end multi-schema inference merely because the
runtime contract accepts namespaces.

**Recommendation:** Make namespace type/runtime parity an upstream-blocking conformance gate. Do not
mask the problem with NetScript casts or flatten namespaces.

### Multi-provider

**Fact:** Prisma configuration currently describes one family/target/adapter/extension set and one
contract/migration location:

- `packages/1-framework/1-core/config/src/config-types.ts:70-116`

**Recommendation:** NetScript multi-database support should mean multiple explicitly named database
resources:

```ts
defineDataPlatform({
  primary: postgresDatabase,
  analytics: clickhouseDatabase,
  cache: sqliteDatabase,
});
```

Each resource has exactly one provider/target and independent:

- canonical contract identity;
- runtime binding;
- pool/client lifecycle;
- migration ledger;
- provider capabilities.

A cross-resource reference is an application-level link, not a foreign key. NetScript must not imply
cross-provider atomic transactions.

## 9. Migration and artifact boundary

**Fact:** The migration system is artifact-driven, not source-driven. Migration planning consumes
canonical JSON and operations artifacts, with storage hashes and per-space markers:

- `docs/architecture docs/subsystems/7. Migration System.md:59-102`
- canonical offline diff at `:127-139`
- content-addressed snapshots and apply artifacts at `:287-318`

**Fact:** Native no-emit runtime use is supported, but even an in-memory native contract is
serialized/deserialized before runtime use:

- `packages/3-extensions/postgres/src/runtime/postgres.ts:96-130`
- no-emit versus emitted modes at `:150-166`

**Fact:** Emit canonicalizes and atomically publishes artifacts:

- `packages/1-framework/3-tooling/cli/src/control-api/operations/contract-emit.ts:134-149`
- source-provider invocation at `:198-211`
- serialization/canonicalization at `:230-271`
- atomic publication/hash at `:279-302`

**Recommendation:** NetScript should eliminate manual emit/generate/migrate choreography, but not
erase the artifact boundary. Tooling and production migration application should consume canonical
artifacts, never execute arbitrary app/plugin TypeScript.

The generated root/build pipeline should automatically:

1. evaluate native schema authoring in the controlled build phase;
2. canonicalize;
3. verify deterministic hash;
4. emit contract and type artifacts atomically;
5. compare migration head;
6. generate or validate a migration;
7. attach provenance and ownership;
8. make the runtime use the exact verified artifact in CI/production.

## 10. Extension-bundle design

**Fact:** Prisma's current pgvector example requires the same logical extension to appear
independently in:

- schema authoring as `/pack`;
- control/config as `/control`;
- runtime construction as `/runtime`.

Evidence:

- `examples/prisma-8-demo/prisma/contract.ts:1`, `:18`
- `examples/prisma-8-demo/prisma-next.config.ts:1-10`
- `examples/prisma-8-demo/src/prisma-no-emit/context.ts:1-11`

**Recommendation:** NetScript should define one database-extension contribution bundle:

```ts
defineDatabaseExtension({
  id: 'pgvector',
  version: '...',
  provider: 'postgres',
  authoring: pgvectorPack,
  control: pgvectorControl,
  runtime: pgvectorRuntime,
  validation: pgvectorValidation,
});
```

The generated root fans this single declaration into all Prisma phases. NetScript must verify that
every facet has the same stable extension ID/version and compatible provider capabilities.

This replaces today's primitive DB contribution:

- `packages/plugin/src/config/domain/db-schema-contribution.ts:1-7`
- `packages/plugin/src/config/builders/plugin-builder.ts:192-202`
- `packages/plugin/src/config/contribution-merger.ts:3-26`

It also removes the currently generated instructions to copy a schema and manually run
migration/generation:

- `packages/cli/src/kernel/assets/generated/plugins/generate-plugin-db-schema-1.ts.template:1-10`

## 11. Required invariants

1. The native Prisma contract is the sole schema truth. NetScript has no parallel model AST.
2. `typeof contract` is preserved through database definitions and fragment composition.
3. Authoring identity, canonical contract hash, NetScript resource ID, runtime binding, and
   migration space/head are distinct concepts.
4. Schema evaluation is deterministic and independent of environment, filesystem ordering,
   randomness, time and network.
5. Environment access is confined to `createDatabase` and application composition.
6. Extension authoring/control/runtime/validation facets must share verified identity and version.
7. Namespace inference must match runtime namespace lowering exactly.
8. Input, output and wire validation are distinct.
9. Every codec used by a public validated operation has a sound validation facet; unsupported codecs
   fail closed.
10. Query output schemas are selection-aware.
11. Plugin ownership is explicit, and model/constraint collisions report both owners.
12. Fragment order cannot alter the canonical contract hash.
13. One database definition has one provider/target.
14. Cross-database foreign keys and atomic transactions are not representable.
15. Migration apply executes immutable artifacts, not schema TypeScript.
16. Artifact publication is atomic and includes hash/provenance.
17. Unsupported provider capabilities are either statically unavailable or rejected during
    definition, never deferred to a production migration.

## 12. Anti-patterns to forbid

- Reimplementing the obsolete screenshot fluent chain.
- A proprietary NetScript schema DSL parallel to Prisma.
- Re-exporting Prisma's builder as though NetScript owns it.
- Copying Prisma private overloads or phantom type maps into public NetScript types.
- Fragment merging through widened `Record<string, ModelLike>` registries.
- Copying plugin PSL/schema files into applications.
- Requiring users to register the same extension separately for authoring, migrations and runtime.
- Executing plugin/application TS during migration apply.
- Generating a separate validation schema that can drift from the canonical contract.
- Treating TypeScript checking as runtime boundary validation.
- Validating a query projection with a full-model schema.
- Flattening namespaces to work around upstream inference bugs.
- Pretending uniqueness, foreign keys or arbitrary SQL checks are purely local validation.
- Reading environment variables or network state during schema construction.
- One mega-contract spanning unrelated providers.
- Exposing unrestricted ORM methods as an agent tool surface.

## 13. Conformance suite

The RFC should require at least:

1. Direct native Postgres contract, both emitted and no-emit.
2. App fragment composition preserving literal model/field/relation types.
3. Plugin-owned contract space with independent migration head.
4. One extension declaration correctly supplying authoring/control/runtime/validation.
5. Required/optional/default/generated/nullable create and update validation.
6. Selection-aware output validation.
7. Date, bigint, decimal, bytes, JSON, enum and vector input/output/wire round trips.
8. Multiple namespaces, including duplicate model names, with exact type/runtime parity.
9. Cross-space handle and ownership validation.
10. Duplicate model/constraint contribution diagnostics naming both owners.
11. Fragment reordering yielding the same canonical hash.
12. Environment/time/random/filesystem/network access rejected during deterministic evaluation.
13. Stale or half-published contract artifacts rejected.
14. Migration apply functioning from JSON/ops artifacts only.
15. Multiple database resources remaining type-, pool- and ledger-isolated.
16. Namespace use on SQLite rejected.
17. Postgres native enum, vector, RLS, indexes and checks.
18. SSR serialization/hydration round trip.
19. The same Standard Schema value consumed by Fresh, TanStack, oRPC, tRPC and form adapters.
20. Output corruption detected at an enabled trust boundary.
21. Prisma RC upgrade contained to the integration adapter.
22. Type-check and editor latency on a 500-model representative application.
23. Agent operation allowlisting and provenance.
24. Invalid helper arguments rejected even from JavaScript/untyped/generated code.
25. Invalid custom JSON input rejected before the database write, not after commit/RETURNING.

## 14. Kill criteria

Stop or redesign the proposal if any of these remain true:

- Native builder integration requires Prisma private import paths.
- The wrapper or fragment mechanism widens away Prisma's native inference.
- Multi-schema no-emit types remain wrong and NetScript can only hide the bug with casts.
- Schema evaluation cannot be made deterministic and build-phase-isolated.
- Extension facets cannot be identity/version checked.
- Canonical contract plus codec facets cannot produce sound value validators.
- Custom codecs silently become `unknown` rather than failing closed.
- Runtime and AOT validators cannot pass semantic-equivalence tests.
- Plugin migrations require arbitrary TypeScript execution during apply.
- Type-check/editor latency breaches the agreed budget.
- Migration hashes/receipts cannot bind applied migrations to exact contract artifacts.
- Prisma RC churn repeatedly leaks as public NetScript breaking changes.
- Multi-provider abstraction collapses into a lowest-common-denominator ORM surface.
- Invalid input can be committed before validation completes.
- Contract-space ordering/dependencies cannot safely represent NetScript plugin dependencies.

The architectural stance should be: **native Prisma model-first authoring, NetScript-owned
composition and operational system**. That preserves Prisma's strongest new idea—the TypeScript
contract as the source of a complete inferred model—while putting NetScript's effort into the gaps
that actually determine framework DX: zero-manual composition, deterministic artifacts, migration
ownership, extension bundles, runtime lifecycle, validation, and all consumer surfaces.

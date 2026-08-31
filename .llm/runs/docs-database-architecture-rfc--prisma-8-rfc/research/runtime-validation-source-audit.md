# Runtime validation source audit

> Provenance: independent delegated pinned-source audit. RC-tag evidence and post-RC-main evidence
> are explicitly separated below. No web sources were used. The requested `.llm/tmp/prisma-v8-rc1`
> path was absent; the evidence checkout actually inspected was the intact, clean, detached checkout
> at `/home/codex/.local/share/Trash/files/prisma-v8-rc1`, verified at HEAD
> `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5` (`v8.0.0-rc.1`). Post-RC comparison used the locally
> available Git object `71e2e0d` only where explicitly labeled.

## Bottom-line decision

**Qualified YES to interpretation, NO to contract-only full parity.** A NetScript runtime can
interpret the emitted contract into `StandardSchemaV1` validators for a deliberately bounded algebra
(model/value-object/union/list/dict/nullability/value-set plus known codecs), and can use plan
metadata for a bounded set of projections. That can eliminate generated validator _code_. It cannot
eliminate validator _metadata/contributions_, and it cannot correctly validate Prisma’s complete
create/update/filter/nested-write/aggregate/raw surface from the RC contract alone. Full parity
would require rebuilding the missing operation type system and custom-codec application predicates;
unsupported cases must fail at schema construction, never degrade to `unknown`/pass-through.

This is **source-level feasibility, not a stable Prisma API commitment**. The relevant common
contract facade is exported by the RC public package, but family IR/plan details remain experimental
and the package itself is `8.0.0-rc.1`.

## 1. What the machine contract actually contains (RC proof)

**Envelope/namespaces.** `packages/1-framework/0-foundation/contract/src/contract-types.ts:29-56`
calls `Contract` the canonical in-memory model and carries `target`, `targetFamily`, `roots`,
namespaced `domain`, family storage, `capabilities`, opaque `extensions: Record<string, unknown>`,
optional execution, `profileHash`, metadata, control policy; `:36-37` explicitly says persisted
`schemaVersion`/`sources` live only at serialization. `domain-envelope.ts:9-21` gives each
application namespace `models`, optional `valueObjects`, optional `enum`. `cross-reference.ts:5-14`
has namespace/model and optional cross-space `space`; `value-set-ref.ts:25-30` has plane,
namespaceId, entity kind/name and optional `spaceId`.

**Model/value shape.** `domain-types.ts:5-29` is the runtime value algebra: scalar
`{codecId,typeParams?}`, value-object by name, union of scalar/value-object, and fields with
mandatory `nullable` plus `many?`, `dict?`, `valueSet?`. `:31-39` gives ordered domain enums as
`{codecId,members:[{name,value:JsonValue}]}`. `:41-75` represents reference/embed relations,
local/target fields, cardinality, and N:M junction coordinates. `:77-99` has discriminator/variants,
value objects, model fields/relations/storage/base/owner. There is **no field-level
required/optional flag and no per-value Standard Schema**.

**Defaults.** `contract/src/types.ts:95-133` defines JSON values and storage column defaults
(`literal` or opaque function expression; author input may be `Date`); `:147-179` defines execution
generators by namespace/table/column and `onCreate`/`onUpdate`. These help determine some
omission/default behavior, but are not a complete create/update input grammar.

**SQL provider/native detail and constraints.** `packages/2-sql/1-core/contract/src/types.ts:65-75`
maps a model field to `{column,codecId?,nullable?}` and model to `{table,namespaceId,fields}`.
`ir/storage-column.ts:15-25,40-63` carries `nativeType`, `codecId`, `nullable`, `many`, mutually
exclusive `typeParams`/`typeRef`, default/control/valueSet. `ir/storage-table.ts:12-20,34-69`
carries columns, PK, uniques, indexes, FKs, checks and control. `ir/primary-key.ts:4-7`,
`ir/unique-constraint.ts:4-7`, and `ir/foreign-key.ts:5-24` carry names, column tuples, target refs
and referential actions. `ir/sql-index.ts:13-43,63-97` permits column or opaque expression, opaque
partial predicate, unique/type/options. `ir/check-constraint.ts:10-22` only models a structured
column→valueSet check, not arbitrary check SQL. Thus DB structural constraints are present, but
uniqueness/FK/index enforcement is not locally decidable and opaque expressions are
information-losing.

**SQL contract extensibility.** `ir/sql-storage.ts:65-69,98-118` is namespaced storage with known
`table`/`valueSet` plus open pack entity kinds; `:168-203` deliberately fails unknown storage type
discriminators. `validators.ts:131-177` validates registered entity kinds and fails unregistered
kinds; `:416-442` defines the full ArkType contract envelope.
`sql-contract-serializer-base.ts:40-61,81-99` validates structure then hydrates IR; `:219-240`
serializes all registered namespace entry kinds. Pack entities are therefore runtime-extensible but
only interpretable when their contributor is installed.

**Postgres native enum.**
`packages/3-targets/3-targets/postgres/src/core/postgres-native-enum.ts:6-12,21-38,49-59` stores
target-only native enum `typeName`, ordered string members and control under
`storage.namespaces[ns].entries.native_enum`. `postgres/src/core/codecs.ts:374-388` says its codec
is string pass-through and does **not** carry members; membership comes from the column
valueSet/native type. NetScript must resolve the valueSet/native-enum entity, not infer membership
from codec ID.

**Mongo family.** `packages/2-mongo-family/1-foundation/mongo-contract/src/contract-types.ts:37-78`
has model collection/relation storage and one namespaced domain; `:87-107,154-167` has phantom type
maps and falls back to `unknown` without them. `contract-schema.ts:7-80` validates field
algebra/enums/relations; `:82-135` Mongo JSON validator; `:139-211` indexes/collection options;
`:213-238` model discriminators/variants/base/owner; `:245-343` collection storage; `:345-351` value
sets; `:380-413` pack-fragment handling; `:416-458` full envelope.
`ir/mongo-validator.ts:3-10,29-40` stores Mongo JSON Schema/validation level/action;
`ir/mongo-collection.ts:19-24` stores indexes/validator/options/control. A stored Mongo validator is
DB-side collection validation, not automatically the application model/result schema.

**Type information that is NOT runtime data.** SQL `contract/src/types.ts:90-139` defines
codec/query-operation/field input/output/storage/aggregate maps, but `:207-215` installs them under
an optional phantom key. `framework/emitter/src/generate-contract-dts.ts:179-221` emits those maps
into generated `contract.d.ts`; SQL emitter `src/index.ts:531-541` says defaults use the codec JSON
channel, and `:575-615` renders refined input/output/valueSet/many/nullability types. These type
maps are erased at runtime. This is the strongest evidence against “contract alone has all Prisma
type semantics.”

## 2. Plans: operation and result-shape sufficiency (RC proof)

**Common plan.** `framework-components/src/execution/query-plan.ts:15-22` carries only `meta` plus
runtime-absent phantom `_row`; `:25-33` adds nothing in `ExecutionPlan`.
`contract/src/types.ts:223-232` plan metadata is target/family, storageHash, optional profileHash,
lane, arbitrary annotations—no executionHash, contract-full hash, or runtime row schema.

**SQL.** `relational-core/src/plan.ts:19-22` retains `AnyQueryAst` and params. AST operation kinds
are explicit: `ast/types.ts:1892-1910` insert rows/onConflict/returning, `:1984-2002` update
set/where/returning, `:2051-2065` delete/where/returning, and `:2122-2140` raw SQL. Select
`:1510-1538` retains from/joins/projection/filter/group/having/etc. Projection `:1480-1505` retains
alias, expression, optional `CodecRef`, but `:1484-1488` explicitly says codec is absent for
computed expressions, subqueries and raw aliases. Table source `:346-368` has namespaceId; direct
columns can be resolved to storage. The current decoder confirms the limits:
`packages/2-sql/5-runtime/src/codecs/decoding.ts:28-45` extracts projections and only resolves
codecs; `:164-171` says value validation lives only inside a codec; `:179-186` accepts null and
missing codecs/pass-through; `:198-223` checks only the array container for `many`; `:251-299`
checks missing projected aliases but is not a declarative result validator. Result: operation-aware
input walking is possible for literal/simple AST positions, and direct-column returning/select
output is recoverable by alias+column+codec; computed/raw/subquery/include/aggregate output is not
generally recoverable.

**Mongo.** `query-ast/src/query-plan.ts:15-20` retains collection, discriminated command and
optional `resultShape`. `result-shape.ts:1-13` is unusually useful: document/unknown, leaf
`{codecId,nullable}`, nested document/array/unknown. Commands `commands.ts:8-179` distinguish
insert/update/delete/find-and/aggregate and retain documents/filter/update/options. Raw commands
`raw-commands.ts:4-156` use opaque `Document`. The decoder proves the shape is a decode hint, not
enforcement: `runtime/src/codecs/decoding.ts:48-60` passes unknown/nonobject; `:65-85` passes
missing codecs; `:100-149` accepts null regardless of `nullable` and passes wrong document/array
types; `:159-175` passes unshaped keys. Thus NetScript can interpret a fully-known Mongo
`resultShape` more strictly than Prisma’s decoder, but must reject `unknown`/raw and needs a
separate operation grammar for filters/updates.

**Conclusion for plans.** They retain enough metadata for a useful subset and selection-aware
outputs when every leaf is known. They do **not** retain a universal runtime schema equivalent to
phantom `ResultType`/generated operation type maps.

## 3. Existing Standard Schema use (RC proof)

`packages/9-public/@prisma/orm-framework/package.json:17-20` depends on
`@standard-schema/spec ^1.1.0` and ArkType; exports include `./contract` and `./contract/types` at
`:50-75`. But `framework-components/src/shared/codec-descriptor.ts:27-54` gives
`paramsSchema: StandardSchemaV1<P>` specifically for JSON-sourced **codec parameters** and TS
renderers; it has no application/wire/json value schema. `:34-41` is explicit about parameter
validation and `.d.ts` rendering. `Codec` itself (`shared/codec.ts:16-32,34-51`) carries conversions
only. Other Standard Schema occurrences similarly cover config/control/policy/extension parameters.
Contract envelopes are authoritative ArkType schemas (which happen to be Standard-Schema-compatible
implementations), but they validate the **contract document**, not CRUD model data. There is no
existing general model-data Standard Schema surface.

## 4. Runtime vs driver-wire vs JSON (RC proof)

Prisma actually has **three** representations, not two: `shared/codec.ts:16-30` defines application
`TInput`, database-driver `TWire`, and target JSON used in artifacts/database-produced JSON;
`:44-51` exposes async encode/decode and sync encodeJson/decodeJson. Therefore a NetScript API
option named `wire` is ambiguous; public boundary modes should be `runtime | json`, reserving driver
wire for internal adapters.

Postgres examples:

- BigInt/int8: `postgres/codecs.ts:659-689` application `bigint`, driver string|number|bigint
  (canonical write string), JSON decimal string.
- Decimal/numeric: `:860-910` application/output is canonical numeric **string**, driver
  string|number, JSON string. It is not Prisma.Decimal in this codebase.
- Date: `:921-960`; timestamps `:971-1036`: runtime `Date`; JSON conversion is target helper/ISO.
  Date-only is UTC-midnight canonicalized.
- Bytes: `:1262-1298`: runtime/wire `Uint8Array` (Buffer normalized), JSON/base projection base64.
- JSON/jsonb: `:1471-1547`: application `JsonValue`, wire string|JsonValue, JSON identity.
- Native enum: `:390-410` runtime/wire/JSON string; membership elsewhere.

Mongo builtins `packages/3-mongo-target/2-mongo-adapter/src/core/codecs.ts:22-71`: ObjectId wire
BSON `ObjectId` → runtime hex string; primitives identity; Date runtime/wire Date ↔ JSON ISO; vector
number array. `:78-86,139-166` lists the standard builtins—no contract scalar codec for
Decimal128/Long/bytes/JSON there. Do not assume provider BSON exports imply supported application
scalar semantics.

Custom codecs are the hard stop: `mongo-codec/src/codecs.ts:23-42,44-82` requires conversion
functions and JSON roundtrip for non-JsonValue inputs, but no Standard Schema value predicate.
Conversion success is not validation (arbitrary coercion/acceptance is legal). Without a new
contributor-provided `{runtimeSchema,jsonSchema}` (and driver schema only if needed), a custom codec
must be unsupported/fail closed.

## 5. Contract-space aggregation (RC proof)

`migration/src/aggregate/types.ts:32-79` defines each app/extension as a separate space with its own
head/hash/contract; `:81-123` exposes an aggregate, sorted extension spaces and an ownership
oracle—it does not merge contracts. `aggregate/loader.ts:23-38,53-74` takes the live app contract
and lazily deserializes extension snapshots; `:77-95` synthesizes app head from storageHash;
`:108-148` loads extension spaces independently. Cross-space relation validation is explicitly
deferred: `contract/src/validate-domain.ts:140-147` skips `CrossReference.space` targets for
aggregate deploy-time verification.

Implication: validator identity and resolution must include `spaceId`; resolve cross-space
references/valueSets through a verified aggregate, never flatten models by namespace/name. Call
aggregate integrity first; unreadable/missing/mismatched space heads must make validator
construction fail.

## 6. Hash/version/cache identity (RC proof)

`contract/src/hashing.ts:14` fixes schema version `'1'`; `:39-43` is SHA-256. Crucially `:74-106`
computes three section hashes only: storage (`target/family/storage`), execution
(`target/family/execution`), profile (`target/family/capabilities`). Domain/roots/extensions are
excluded from all three. `contract-types.ts:21-26,41-55` stores executionHash only with execution,
storageHash inside storage, profileHash top-level. `canonicalization.ts:250-277` can produce
canonical full-contract bytes including roots/domain/storage/execution/extensions/capabilities/meta,
but there is no full-contract hash field. Plan meta only has storage/profile (`types.ts:223-232`).
SQL execution content hashing (`packages/2-sql/5-runtime/src/content-hash.ts:5-43`) keys
storageHash+SQL+params; that is an execution-result cache key, not sufficient validator identity.

Required derived-validator key: digest(canonical full contract snapshot + schemaVersion + spaceId +
target/family + representation + operation/selection shape + NetScript validator ABI/version +
codec/pack contributor ID/version). Include executionHash when default-sensitive. Do not use
storageHash alone: domain/API/extension semantics can change without storage changing. Codec IDs
conventionally embed `@version`, but a custom contributor registry version/identity should also be
explicit.

`contract/src/types.ts:238-247` marker has storage/profile hashes, contractJson, `canonicalVersion`,
timestamps etc.; it still supplies no domain/full-content digest. Contract JSON schemaVersion is
serialization-only (`contract-types.ts:36-37`).

## 7. Mandatory fail-closed cases

Throw a deterministic `DB_VALIDATION_UNSUPPORTED` while constructing a schema for: unknown codec or
codec without representation-specific value schema; async-only/non-deterministic value validators if
NetScript promises synchronous validation; unknown pack entity kind; unresolved/corrupt cross-space
ref/valueSet; union branches whose runtime identity cannot be discriminated safely; model
variants/discriminators when selection/branch cannot be resolved; opaque SQL
raw/computed/subquery/aggregate/include result with no explicit shape; `selectAllIntent` that cannot
map a unique table namespace; Mongo `resultShape.kind:'unknown'` or any unknown leaf; raw Mongo
`Document`; arbitrary SQL index/check expression (not local data validation); DB-state constraints
(unique/FK/exclusion/etc.); create/update/filter/nested-write semantics absent from a registered
operation contributor; JSON values with custom semantic schemas not contributed. Never mirror Prisma
decoders’ permissive pass-through behavior.

## 8. Can this be a StandardSchemaV1 interpreter without recreating Prisma’s type system?

**Yes, if bounded:** implement a small internal validation IR for
scalar/valueObject/union/list/dict/null/valueSet, plus object presence/default policy and
plan-shaped projections; wrap it as `StandardSchemaV1`. Codec/pack contributors supply
representation-specific leaf schemas. This is interpretation, not source generation and not a
reimplementation of Prisma’s TS conditional types.

**No for full Prisma parity:** create/update/filter operators, nested relation writes, polymorphic
narrowing, aggregates/computed expressions, custom codec predicates and exact projected rows live in
generated type maps/builders/phantoms, not in the runtime contract. Supporting all of them would
recreate Prisma’s operation type system. State the supported subset and fail closed outside it.

## 9. Smallest public API + conformance matrix

Recommended API (two methods, no public compiler/cache/generator):

```ts
const users = db.ref('primary').model('User');
const createSchema: StandardSchemaV1 = users.input('create', { representation: 'runtime' });
const resultSchema: StandardSchemaV1 = users.output(planOrSelection, { representation: 'runtime' });
```

Allow `representation: 'runtime' | 'json'`; do not call JSON `wire`. `output` should require a
plan/selection for selection-aware shape; optional whole-model output may be an explicit
`users.output('model', …)` form. Unsupported schema construction throws immediately. Keep
space/model lookup and contract pinning behind `db.ref()`.

Minimum conformance matrix before claiming support:

| Axis/case                                                | Expected                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| SQL/Postgres + Mongo; each namespace and extension space | Exact coordinate resolution; duplicate names never collide                                                               |
| Primitive identity scalars                               | accept correct, reject wrong, null independently                                                                         |
| Date, bigint, numeric, bytes, ObjectId, JSON             | test runtime and JSON separately with roundtrips and malformed/canonical edge cases                                      |
| Domain enum/valueSet/Postgres native enum                | only declared encoded values; order irrelevant to validation; cross-space refs tested                                    |
| nullable / many / dict / value object / union            | nested paths and issues; reject `many+dict` (domain validation already rejects at `validate-domain.ts:273-300`)          |
| create defaults / update patches                         | support only operations with explicit presence policy; otherwise unsupported                                             |
| SQL direct select/returning                              | aliases, missing/extra fields policy, column codec/nullability; namespace qualification                                  |
| SQL computed/subquery/include/aggregate/raw              | unsupported absent explicit contributed result schema                                                                    |
| Mongo fully-known nested resultShape                     | strict object/array/nullability/leaf enforcement                                                                         |
| Mongo unknown/raw                                        | unsupported                                                                                                              |
| custom codec with runtime+JSON schemas                   | supported and representation-specific                                                                                    |
| custom codec without either schema                       | unsupported, never `unknown`                                                                                             |
| unique/FK/index/arbitrary DB check                       | documented as DB constraints, not claimed as local value validation                                                      |
| contract-space broken head/hash/ref                      | construction fails before validator is returned                                                                          |
| cache mutation tests                                     | invalidate on domain-only, extension-only, execution-default, codec-version, representation, selection and space changes |
| Standard Schema protocol                                 | sync success, path-rich issues, no throws for invalid user data; construction errors only for unsupported metadata       |

## RC vs post-RC-main and stability

**RC-tag proof above is authoritative for v8.0.0-rc.1.** The checked-in RC SQL editor schema is
visibly stale: `packages/2-sql/2-authoring/contract-ts/schemas/data-contract-sql-v1.json:71-98`
still describes flat `models` and `storage.tables`, unlike the namespaced runtime types—do not treat
that JSON Schema as authoritative.

**Post-RC main evidence only:** object `71e2e0d` adds
`packages/2-sql/2-authoring/contract-ts/src/data-contract-json-schema.ts:10-15`, explicitly calling
generated JSON Schema lossy/advisory and ArkType authoritative; `:31-38` accepts unknown pack maps
generically because static JSON Schema cannot know contributed kinds; `:68-110` generates the editor
schema and wire-only keys from the contract schema. This fixes editor-schema drift, not model-data
validation. No post-RC change adds codec value Standard Schemas or a universal result schema. Treat
this as corroborating direction, not RC functionality.

**Public/stability seam:** `@prisma/orm-framework/package.json:2-7,50-75` is an RC public package
exporting contract surfaces. `packages/0-shared/publish-surface/src/shells.ts:156-170,182-194` says
facades republish `@internal/contract`; `:197-203` describes family/target/runtime republishing.
That makes pinned consumption feasible without importing `@internal/*`, but the detailed
contract/AST layouts are not demonstrated stable. Pin exact Prisma version, probe
schemaVersion/target/family/contributor IDs, and isolate all Prisma decoding behind one NetScript
adapter.

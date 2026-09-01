# Runtime Validation — Owner / Prisma Maintainer Exchange

## Provenance and confidence

- Source: three owner-provided screenshots from the public `#prisma-next` Discord channel.
- Exchange dates: 2026-03-05 through 2026-03-06.
- Participants visible in the screenshots: `rickyshowtime` (NetScript owner) and `wmadden`
  (identified by the owner as a Prisma maintainer).
- Confidence: primary evidence of an exploratory maintainer conversation, **not** an upstream
  roadmap commitment or proof that a stable public validation API ships in Prisma 8 RC1.

## What the exchange establishes

The owner proposed deriving Standard Schema-compatible validation from Prisma Next's
machine-readable contract so applications no longer hand-write or third-party-generate schemas that
mirror model types, nullability, and constraints. The proposed scope covered both:

1. mutation/query inputs; and
2. query outputs when data crosses trust boundaries such as API responses, SSR hydration, or an
   external service.

The owner initially described either a built-in emission step or a first-party `afterEmit` plugin.
The maintainer replied that the idea was viable and then sharpened the direction: validation could
probably be derived from the contract **at runtime**, skipping the extra generation step, because
the contract contains the necessary type and runtime data.

That distinction is architectural. The opportunity is not “replace one Zod generator with another.”
It is to make the resolved contract the runtime validation authority and treat any emitted validator
artifact as an optional, semantically equivalent optimization.

## NetScript design implications to resolve in the RFC

### Durable boundary

- Standard Schema is the interoperability contract; Zod, Valibot, ArkType, and other libraries are
  consumer choices, not framework foundations.
- The default validator is interpreted/compiled from the resolved contract snapshot and cached by
  target + contract/profile identity.
- Validation artifacts must never become a second source of truth. Optional ahead-of-time emission
  is atomic, derived, replaceable, and proven equivalent to the runtime interpreter.
- Plugin/contribution spaces participate automatically through the same resolved aggregate contract;
  plugin authors do not maintain parallel validator files.

### Two distinct planes

- **Input validation:** operation-aware mutation/query inputs, including required/optional/defaulted
  fields, nested writes, relation identifiers, constraint metadata, provider types, codecs, and
  plugin-contributed fields.
- **Output validation:** selection/projection-aware result shapes at an explicit trust boundary. A
  whole-model validator is incorrect for partial selects, aggregates, raw/provider results, or
  relation projections.

The RFC must also separate runtime database values from serialized/wire values. Dates, decimals,
bigints, bytes, native enums, JSON, custom codecs, and redacted fields can have different valid
representations before and after serialization.

### Candidate public shape

```ts
const users = db.ref('primary').model('User');

const createUser = users.input('create'); // StandardSchemaV1
const publicUser = users.output({ // selection-aware StandardSchemaV1
  select: { id: true, email: true },
  representation: 'wire',
});

const parsed = await createUser['~standard'].validate(requestBody);
const safe = await publicUser['~standard'].validate(responseBody);
```

The exact names remain subject to plan lock. The important constraints are that the surface is
target-aware, operation/selection-aware, representation-aware, and derived from a pinned contract
identity.

### Integration surface

- Fresh route/action params and bodies;
- form libraries that consume Standard Schema;
- tRPC/oRPC or other request/response boundaries;
- SSR serialization/hydration checks;
- plugin configuration and plugin-owned model inputs/outputs;
- test-fixture/data-factory validation without generated mirror types.

### Required failure semantics

- structured issues with target, contract identity, operation/selection path, field path, expected
  representation, actual value class, and stable NetScript error code;
- explicit errors for an unsupported contract construct or codec—never silently weakening to
  `unknown`;
- stale-contract/cache rejection when the manifest snapshot changes;
- deterministic behavior across interpreted and optional ahead-of-time modes.

## Plan-lock questions

1. Which Prisma contract constraints are public/stable enough at RC1 versus adapter-local?
2. Does the result plan expose enough selection/result-shape metadata for output validation without
   reconstructing Prisma's type system?
3. Which validation representations are required initially: runtime, JSON/wire, storage, or a strict
   subset?
4. How do custom extension codecs contribute Standard Schema behavior and serialization rules?
5. Is output validation opt-in per trust boundary, policy-driven, or both?
6. What is the cache and optional AOT equivalence proof?
7. What performance budget makes runtime derivation acceptable for cold start, edge, and hot paths?

## Mandatory RFC gates

- No hand-written or copied model validator in the default path.
- Input and selection-aware output examples compile and execute.
- Standard Schema consumer proof with at least two independent libraries/integrations.
- Contract-space/plugin fields appear automatically.
- Codec and wire-representation fixtures cover dates, decimals, bigints, bytes, JSON, enums, and one
  extension-defined type.
- Runtime and optional AOT modes, if both exist, pass the same semantic corpus.
- Contract change invalidates cached validators and stale artifacts deterministically.
- Unsupported constructs fail closed with structured diagnostics.

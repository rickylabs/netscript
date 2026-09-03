# RFC-5 source extract — zod → JSON Schema → per-language types (openapi-codegen group)

Fetch date: 2026-08-20

Sources:

- https://zod.dev/json-schema — raw:
  https://raw.githubusercontent.com/colinhacks/zod/main/packages/docs/content/json-schema.mdx
- https://raw.githubusercontent.com/StefanTerdell/zod-to-json-schema/master/README.md
- https://raw.githubusercontent.com/glideapps/quicktype/master/README.md
- https://raw.githubusercontent.com/omissis/go-jsonschema/main/README.md
- https://raw.githubusercontent.com/oxidecomputer/typify/main/README.md
- https://raw.githubusercontent.com/koxudaxi/datamodel-code-generator/main/docs/index.md
- https://raw.githubusercontent.com/corvus-dotnet/Corvus.JsonSchema/main/README.md
- (NJsonSchema C# settings are extracted in `openapi-codegen-raw-nswag.md` §8)

Official / community status of each step is recorded per section.

---

## STEP 1 — zod → JSON Schema

### 1a. `z.toJSONSchema()` — **official**, first-party, in `zod` core since `zod@4.0`

Doc callout verbatim: "Introduced in `zod@4.0`, Zod supports native
[JSON Schema](https://json-schema.org/) conversion."

Basic behaviour:

```ts
z.toJSONSchema(z.object({ name: z.string(), age: z.number() }))
// => {
//   type: 'object',
//   properties: { name: { type: 'string' }, age: { type: 'number' } },
//   required: [ 'name', 'age' ],
//   additionalProperties: false,
// }
```

Full options interface, verbatim:

```ts
interface ToJSONSchemaParams {
  /** The JSON Schema version to target.
   * - `"draft-2020-12"` — Default. JSON Schema Draft 2020-12
   * - `"draft-07"` — JSON Schema Draft 7
   * - `"draft-04"` — JSON Schema Draft 4
   * - `"openapi-3.0"` — OpenAPI 3.0 Schema Object */
  target?: "draft-04" | "draft-4" | "draft-07" | "draft-7" | "draft-2020-12"
         | "openapi-3.0" | ({} & string) | undefined;

  /** A registry used to look up metadata for each schema.
   * Any schema with an `id` property will be extracted as a $def. */
  metadata?: $ZodRegistry<Record<string, any>>;

  /** How to handle unrepresentable types.
   * - `"throw"` — Default. Unrepresentable types throw an error
   * - `"any"` — Unrepresentable types become `{}`
   * - A function — returns the JSON Schema to use, or `"any"`/`"throw"` */
  unrepresentable?: "throw" | "any"
    | ((ctx: { zodSchema: $ZodTypes; path: (string | number)[]; message: string })
        => JSONSchema | "throw" | "any" | undefined);

  /** How to handle cycles.
   * - `"ref"` — Default. Cycles will be broken using $defs
   * - `"throw"` — Cycles will throw an error if encountered */
  cycles?: "ref" | "throw";

  /* How to handle reused schemas.
   * - `"inline"` — Default. Reused schemas will be inlined
   * - `"ref"` — Reused schemas will be extracted as $defs */
  reused?: "ref" | "inline";

  /** A function used to convert `id` values to URIs to be used in *external* $refs.
   * Default is `(id) => id`. */
  uri?: (id: string) => string;
}
```

Plus (documented separately, same second argument):

- `io?: "input" | "output"` — "By default, the result of `z.toJSONSchema` represents the
  *output type*; use `"io": "input"` to extract the input type instead." Example:
  `z.string().transform(v => v.length).pipe(z.number())` → `{type:"number"}` by default,
  `{type:"string"}` with `io:"input"`.
- `override: (ctx) => void` — "The provided callback has access to the original Zod schema
  and the default JSON Schema. *This function should directly modify `ctx.jsonSchema`.*"
  "Note that unrepresentable types will throw an `Error` **before** this function is called."

#### **Fidelity loss: unrepresentable types (verbatim list)**

"The following APIs are not representable in JSON Schema. By default, Zod will throw an error
if they are encountered. It is unsound to attempt a conversion to JSON Schema."

```ts
z.bigint(); // ❌
z.int64(); // ❌
z.symbol(); // ❌
z.undefined(); // ❌
z.void(); // ❌
z.date(); // ❌
z.map(); // ❌
z.set(); // ❌
z.transform(); // ❌
z.nan(); // ❌
z.custom(); // ❌
```

`unrepresentable: "any"` converts them to `{}` ("the equivalent of `unknown` in JSON
Schema"). Notes verbatim:

- "Two schemas can share a `zodSchema` but not a `message` — an `undefined` member and a
  `bigint` member of the same literal both arrive as the literal — so branch on `message` to
  tell those apart."
- "A default *value* that can't be serialized to JSON goes through the same handler, as the
  `.default()` schema. Under `"any"` the default is dropped."
- "Returning a JSON Schema for a literal replaces the whole literal, dropping its
  representable members: `z.literal(["a", 1n])` becomes just what you returned, and `"a"` is
  gone."

#### Conversion table — string formats (verbatim)

```ts
// Supported via `format`
z.email();        // => { type: "string", format: "email" }
z.iso.datetime(); // => { type: "string", format: "date-time" }
z.iso.date();     // => { type: "string", format: "date" }
z.iso.duration(); // => { type: "string", format: "duration" }
z.ipv4();         // => { type: "string", format: "ipv4" }
z.ipv6();         // => { type: "string", format: "ipv6" }
z.uuid();         // => { type: "string", format: "uuid" }
z.guid();         // => { type: "string", format: "uuid" }
z.url();          // => { type: "string", format: "uri" }

// via contentEncoding
z.base64();       // => { type: "string", contentEncoding: "base64" }

// All other string formats are supported via `pattern`:
z.iso.time(); z.base64url(); z.cuid(); z.emoji(); z.nanoid(); z.cuid2();
z.ulid(); z.cidrv4(); z.cidrv6(); z.mac();
```

#### Numerics (verbatim)

```ts
z.number();  // => { type: "number" }
z.float32(); // => { type: "number", exclusiveMinimum: ..., exclusiveMaximum: ... }
z.float64(); // => { type: "number", exclusiveMinimum: ..., exclusiveMaximum: ... }
z.int();     // => { type: "integer" }
z.int32();   // => { type: "integer", exclusiveMinimum: ..., exclusiveMaximum: ... }
```

#### Objects / additionalProperties

- `z.object()` emits `additionalProperties: false` by default ("an accurate representation of
  Zod's default behavior, as plain `z.object()` schema strip additional properties").
- In `io: "input"` mode `additionalProperties` is **not set**.
- `z.looseObject()` will *never* set `additionalProperties: false`;
  `z.strictObject()` will *always* set it.

#### **Binary / file**

```ts
z.file();
// => { type: "string", format: "binary", contentEncoding: "binary" }

z.file().min(1).max(1024 * 1024).mime("image/png");
// => { type: "string", format: "binary", contentEncoding: "binary",
//      contentMediaType: "image/png", minLength: 1, maxLength: 1048576 }
```

Doc calls this "the following OpenAPI-friendly schema". Note `format: "binary"` is an OpenAPI
3.0-ism, not standard JSON Schema.

#### Nullability / optionality

```ts
z.null();                  // => { type: "null" }
z.nullable(z.string());    // => { type: ["string", "null"] }
z.nullable(z.string().min(5));
// => { anyOf: [{ type: "string", minLength: 5 }, { type: "null" }] }
z.optional(z.string());    // => { type: "string" }   (decorated with an `optional` annotation)
```

"Inner schemas that can't be written as a bare type fall back to `anyOf`."

#### Cycles and reuse

- Cycles → `$ref` (`{ '$ref': '#' }` for self-reference) unless `cycles: "throw"`.
- Reused schemas are **inlined** by default; `reused: "ref"` extracts to
  `$defs` with generated names like `__schema0`.

#### Registries (multi-schema output)

`z.toJSONSchema(z.globalRegistry)` returns `{ schemas: { <id>: {...} } }`; "**Important** —
All schemas should have a registered `id` property in the registry! Any schemas without an
`id` will be ignored." `$ref` URIs default to bare ids (`"User"`); the `uri` option maps ids
to absolute URIs (e.g. `https://example.com/User.json`).

### 1b. `z.fromJSONSchema()` — **official but EXPERIMENTAL**

Verbatim callout: "**Experimental** — The `z.fromJSONSchema()` function is experimental and is
not considered part of Zod's stable API. It is likely to undergo implementation changes in
future releases."

### 1c. `zod-to-json-schema` (npm) — **community, DEPRECATED**

Verbatim notice: "## Notice of deprecation — As of November 2025, this project will no longer
be actively maintained. [Zod v4 natively supports generating JSON schemas]… so I recommend
you switch to the new major."

Capabilities claimed: "Supports all relevant schema types, basic string, number and array
length validations and string patterns. Resolves recursive and recurring schemas with
internal `$ref`s. Supports targeting legacy Open API 3.0 specification (3.1 supports regular
Json Schema). Supports Open AI strict mode schemas (Optional object properties are replaced
with required but nullable ones). As of v3.25 you can use Zod v4 as a peer-dependency, so
long as you still provide v3-schemas."

Default output shape (verbatim example): root is
`{"$schema":"http://json-schema.org/draft-07/schema#","$ref":"#/definitions/mySchema","definitions":{...}}`.

Options surface (names + defaults, verbatim from the table):

| Option | Notes |
| --- | --- |
| `name?: string` | places schema under `definitions` and refs it |
| `nameStrategy?: "ref" \| "title"` | name as `title` meta instead of a ref |
| `basePath?: string[]` | defaults `["#"]` |
| `$refStrategy?: "root" \| "relative" \| "seen" \| "none"` | default `"root"`; `"none"` makes recursive references default to "any", i.e. `{}` |
| `effectStrategy?: "input" \| "any"` | default `"input"` |
| `dateStrategy?: "format:date" \| "format:date-time" \| "string" \| "integer"` | `"string"` is interpreted as `"format:date-time"`; `"integer"` creates integer schema with `format: "unix-time"` |
| `emailStrategy?: "format:email" \| "format:idn-email" \| "pattern:zod"` | default `"format:email"` |
| `base64Strategy?: "format:binary" \| "contentEnconding:base64" \| "pattern:zod"` | default `contentEncoding:base64`; "`format:binary` is not represented in the output type as it's not part of the JSON Schema spec and only intended to be used when targeting OpenAPI 3.0" |
| `definitionPath?: "definitions" \| "$defs"` | default `"definitions"` |
| `target?: "jsonSchema7" \| "jsonSchema2019-09" \| "openApi3" \| "openAi"` | default `"jsonSchema7"` |
| `strictUnions?: boolean` | "Scrubs unions of any-like json schemas, like `{}` or `true`" |
| `definitions?: Record<string, ZodSchema>` | manual defs |
| `errorMessages?: boolean` | emits custom error messages |
| `markdownDescription?: boolean` | copies `description` → `markdownDescription` |
| `patternStrategy?: "escape" \| "preserve"` | `.includes()/.startsWith()/.endsWith()` are converted to regex; non-alphanumerics escaped by default |
| `applyRegexFlags?: boolean` | default false; "JSON Schema's `pattern` doesn't support RegExp flags"; supported flags `i` (basic Latin only), `m`, `s` |
| `pipeStrategy?: "all" \| "input" \| "output"` | default emits both sides of `z.pipe` |
| `removeAdditionalStrategy?: "passthrough" \| "strict"` | |
| `allowedAdditionalProperties?: true \| undefined` | |
| `rejectedAdditionalProperties?: false \| undefined` | |
| `override?`, `postProcess?` | callbacks |
| `openAiAnyTypeName?: string` | default `"OpenAiAnyType"` |

**Known issues (verbatim, fidelity losses):**

- "The OpenAI target should be considered experimental for now."
- "When using `.transform`, the return type is inferred from the supplied function. In other
  words, there is no schema for the return type… the JSON schema will therefore reflect the
  input side of the Zod schema and not necessarily the output."
- "JSON Schemas does not support any other key type than strings for objects. When using
  `z.record` with any other key type, this will be ignored. An exception to this rule is
  `z.enum` as is supported since 3.11.3."
- "Relative JSON pointers… is not technically a part of [draft 2020-12]. Currently, most
  resolvers do not handle them at all."
- "Since v3, the Object parser uses `.isOptional()` to check if a property should be included
  in `required`… This has the potentially dangerous behavior of calling `.safeParse` with
  `undefined`."
- "JSON Schema version 2020-12 is not yet officially supported."

---

## STEP 2 — JSON Schema → types, per language

### 2a. quicktype — **community** (glideapps), multi-language

- "generates strongly-typed models and serializers from JSON, JSON Schema, TypeScript, and
  GraphQL queries."
- **Supported inputs**: JSON, JSON API URLs, JSON Schema, TypeScript, GraphQL queries.
- **Target languages** (verbatim list): Ruby, JavaScript, Flow, Rust, Kotlin, Dart, Python,
  C#, Go, C++, Java, Scala, TypeScript, Swift, Objective-C, Elm, JSON Schema, Pike,
  Prop-Types, Haskell, PHP.
- CLI: `quicktype -s schema schema.json -o src/ios/models.swift` (`--src`, `--src-lang`,
  `--lang`, `--top-level`, `--out`, `--just-types`).
- The README's own recommended workflow, verbatim: "generate a JSON schema from sample data,
  review and edit the schema, commit the schema to your project repo, then generate code from
  the schema as part of your build process… All of these models will serialize to and from
  the same JSON, so different programs in your stack can communicate seamlessly."
- Requires Node.js 20+ (quicktype 24+).
- TypeScript input is labelled "(Experimental)".

### 2b. go-jsonschema (omissis / atombender) — **community**, Go

- "generates Go data types and structs that corresponds to definitions in the schema, along
  with **unmarshalling code that validates the input JSON** according to the schema's
  validation rules."
- CLI: `go-jsonschema -p main schema.json`; multi-schema/multi-package via
  `--schema-package=<schema $id>=<full import URL>` and
  `--schema-output=<schema $id>=<file>`; cross-schema `$ref` becomes a Go package import.
- Special types: `SerializableDate`, `SerializableTime` — "needed because there is no native
  type provided by Go which properly handles them."
- Status: "While not finished, go-jsonschema can be used today."

**Support matrix (verbatim checkboxes) — the fidelity ledger:**

Supported (`[x]`): `null`/`boolean`/`object`/`array`/`number`/`string` data model;
`$ref` against **top-level** names (`#/$defs/someName`) and top-level names in external files;
comments; `description`; `default` (only for struct fields); `enum`; `type` (single);
`type` (multiple — "**note**: partial support, limited validation"); all numeric validations
(`multipleOf`, `maximum`, `exclusiveMaximum`, `minimum`, `exclusiveMinimum`);
`maxLength`/`minLength`/`pattern`; `items`/`maxItems`/`minItems`;
`required`/`properties`; semantic format "Dates and times".

**NOT supported (`[ ]`)** — copied verbatim:

```
  * [ ] References against nested names: `#/$defs/someName/$defs/someOtherName`
  * [ ] Option to use `json.Number`
  * [ ] `readOnly`  * [ ] `writeOnly`  * ~~`title`~~ (N/A)  * ~~`examples`~~ (N/A)
  * [ ] `const`
  * [ ] `uniqueItems`  * [ ] `additionalItems`  * [ ] `contains`
  * [ ] `patternProperties`  * [ ] `dependencies`  * [ ] `propertyNames`
  * [ ] `maxProperties`  * [ ] `minProperties`
  * [ ] `if`  * [ ] `then`  * [ ] `else`
  * Boolean subschemas (§6.7)
    * [ ] `allOf`  * [ ] `anyOf`  * [ ] `oneOf`  * [ ] `not`
  * Semantic formats: Email addresses, Hostnames, IP addresses, Resource identifiers,
    URI-template, JSON pointers, Regex   (all [ ])
```

i.e. **go-jsonschema supports none of `allOf`/`anyOf`/`oneOf`/`not`, and no `const`.**
License MIT.

### 2c. typify (oxidecomputer) — **community (vendor-maintained)**, Rust

Usage modes (verbatim): `cargo typify` CLI; `import_types!("types.json")` macro; a builder
interface for `build.rs`/`xtask`; builder functions producing persistent files "e.g. when
building API bindings".

Framing statement, verbatim: "JSON Schema is a constraint language designed for validation.
As a result, it is not well-suited--and is often seemingly hostile--to translation into
constructive type systems. It allows for expressions of arbitrary complexity with an infinity
of ways to articulate a given set of constraints. As such, typify does its best to discern an
appropriate interpretation, but it is far from perfect!"

Mapping rules:

- Integers/floats/strings map directly; min/max attributes select the integral type.
  `{"type":"string","format":"uuid"}` → `uuid::Uuid` (adds a crate dependency).
- Arrays → `Vec<T>`, `HashSet<T>` (when `uniqueItems: true`), or a Rust tuple (fixed-length
  arrays with a fixed list of item types).
- Objects → structs. No declared properties → `HashMap<String, T>` from
  `additionalProperties`, else `HashMap<String, serde_json::Value>`. Non-`required`
  properties → `Option<T>` with `#[serde(default)]`; types that already have a default (e.g.
  `Vec<T>`) get only `#[serde(default)]` (so no `Option<Vec<T>>`).
  Map type configurable via `TypeSpaceSettings::with_map_type` (e.g. `BTreeMap`,
  `indexmap::IndexMap`); if `T` is undefined typify falls back to
  `serde_json::Map<String, serde_json::Value>`.
- **`oneOf` → a Rust `enum`**, mapped onto "the various serde enum types" (i.e. serde's
  externally/internally/adjacently tagged and untagged representations).
- **`allOf` → merged schemas.** Verbatim: "While most of the time, typify tries to preserve
  and share type names, it can't always do this when merging schemas. You may end up with
  fields replicated across type; optimizing this generation is an area of active work."
- **`anyOf` → weakest area.** Verbatim: "The `anyOf` construct is much trickier. If can be
  close to an `enum` (`oneOf`), but where no particular variant might be canonical or unique
  for particular data. While today we (imprecisely) model these as structs with optional,
  flattened members, this is one of the weaker areas of code generation."
- `additionalProperties: false` → `#[serde(deny_unknown_fields)]`. Absent or `true` →
  ignored. Any **schema** value (including `{}` or `{"not": false}`) → a map field annotated
  `#[serde(flatten)]`. Verbatim caveat: "Note that this is true of **any** schema value for
  `additionalProperties` that is not a boolean."

Round-trip extension, verbatim:

```json
{
  "type": "object",
  "properties": { "..." : {} },
  "x-rust-type": {
    "crate": "crate-o-types",
    "version": "1.0.0",
    "path": "crate_o_types::some_mod::SomeType"
  }
}
```

"The extension includes the name of the crate, a Cargo-style version requirements spec, and
the full path (that must start with ident-converted name of the crate)." Default behaviour is
to **ignore** `x-rust-type`; the recommended mode is to allowlist each crate+version.

### 2d. datamodel-code-generator (koxudaxi) — **community**, Python

- Inputs (verbatim): "**OpenAPI 3**, **AsyncAPI**, **JSON Schema**, **Apache Avro**,
  **XML Schema**, **Protocol Buffers/gRPC**, **GraphQL**, **MCP tool schemas**, and raw data
  (JSON/YAML/CSV)"; also existing Python types via `--input-model path/to/file.py:ClassName`.
- Input table lists OpenAPI **3.0/3.1/3.2** and JSON Schema (`.json`, `.yaml`).
- Outputs (verbatim CLI): `--output-model-type` ∈
  `pydantic_v2.BaseModel`, `pydantic_v2.dataclass`, `dataclasses.dataclass`,
  `typing.TypedDict`, `msgspec.Struct`.
- Default when omitted: "datamodel-code-generator generates Pydantic v2 BaseModel output
  (`pydantic_v2.BaseModel`)".
- Composition claim, verbatim: "Handles complex schemas: `$ref`, `allOf`, `oneOf`, `anyOf`,
  enums, and nested types".
- Conformance: "CI exercises datamodel-code-generator against pinned external corpora for XML
  Schema, JSON Schema, AsyncAPI, Apache Avro, and Protocol Buffers."

### 2e. C# — two families

**NJsonSchema / NSwag (RicoSuter)** — see `openapi-codegen-raw-nswag.md` §8 for the full
`CSharpGeneratorSettings` surface. Fidelity-relevant highlights repeated here:
- Discriminator handling is `JsonPolymorphicSerializationStyle` with values `NJsonSchema`
  (default, custom converter) and `SystemTextJson` ("experimental/not complete").
- `JsonLibrary` default `NewtonsoftJson`; `SystemTextJson` "experimental/not complete".
- No union type: `AnyType = "object"` is the fallback.

**Corvus.Text.Json / Corvus.JsonSchema (corvus-dotnet, Apache-2.0)** — self-described:
"High-performance, source-generated, strongly-typed C# models from JSON Schema — with
pooled-memory parsing, full draft 4 through 2020-12 validation, and 136B per-document
allocation."

Feature bullets verbatim (protocol-relevant):

- "**Source Generation** — Generate strongly-typed C# from JSON Schema at build time with the
  Roslyn incremental source generator, or ahead of time with the `corvusjson` CLI tool."
- "**OpenAPI** — Generate strongly-typed OpenAPI 2.0, 3.0, 3.1, and 3.2 HTTP clients and
  ASP.NET Core server stubs with typed parameters, request/response validation, streaming,
  and result matching."
- "**AsyncAPI** — Generate strongly-typed AsyncAPI 2.6 and 3.0 producers, consumers,
  handlers, and request/reply flows with broker transport packages for NATS, Kafka, AMQP,
  MQTT, WebSocket, and Azure Service Bus."
- "**Schema Validation** — Full JSON Schema draft 4, 6, 7, 2019-09, and 2020-12 validation."
- "**Extended Types** — `BigNumber` for arbitrary-precision decimals, `BigInteger` for large
  integers, plus NodaTime integration for `date`, `date-time`, `time`, and `duration`
  formats."
- "**Pattern Matching** — Type-safe `Match()` for `oneOf`/`anyOf` discriminated unions with
  exhaustive dispatch."  ← the only C# path in this survey with first-class union support.

Usage shape (verbatim):

```csharp
[JsonSchemaTypeGenerator("Schemas/person.json")]
public readonly partial struct Person;

using var doc = ParsedJsonDocument<Person>.Parse("""{"name":"Alice","age":30}""");
Person person = doc.RootElement;
string name = (string)person.Name;
int age = (int)person.Age;
bool valid = person.EvaluateSchema();
```

Relevant packages: `Corvus.Text.Json` (core runtime),
`Corvus.Text.Json.SourceGenerator` (Roslyn incremental source generator),
`Corvus.Json.Cli` (`corvusjson` CLI, AOT generation),
`Corvus.Json.CodeGenerator` (`generatejsonschematypes`, "Immutable-model CLI tool… defaults
to V4"), `Corvus.Text.Json.OpenApi` + `.OpenApi.HttpTransport` (generated client runtime),
`Corvus.Text.Json.Validator` (runtime Roslyn-compiled validation).

---

## Pipeline-step official/community ledger (as recorded by the sources themselves)

| Step | Tool | Official? | Stability signal in the source |
| --- | --- | --- | --- |
| zod → JSON Schema | `z.toJSONSchema` | official (zod core, ≥4.0) | stable API |
| JSON Schema → zod | `z.fromJSONSchema` | official (zod core) | explicitly **experimental** |
| zod → JSON Schema | `zod-to-json-schema` | community | **deprecated Nov 2025**, unmaintained |
| JSON Schema → many langs | quicktype | community (glideapps) | active; TS input experimental |
| JSON Schema → Go | go-jsonschema | community | "While not finished… can be used today" |
| JSON Schema → Rust | typify | community (Oxide) | active; `anyOf` "one of the weaker areas" |
| JSON Schema → Python | datamodel-code-generator | community | active, corpus-conformance CI |
| JSON Schema → C# | NJsonSchema | community (single maintainer) | STJ paths "experimental/not complete" |
| JSON Schema → C# | Corvus.Text.Json | community (corvus-dotnet) | full draft 4–2020-12 validation |
| OpenAPI → clients | openapi-generator | official OpenAPITools | see `openapi-codegen-raw-openapi-generator.md` |
| OpenAPI → C# client | NSwag | community (single maintainer) | see `openapi-codegen-raw-nswag.md` |

## Cross-cutting fidelity losses attested by the sources

1. **Unions.** openapi-generator reports `Union ✗` for rust/go/python/csharp; go-jsonschema
   supports no `oneOf`/`anyOf`/`allOf`/`not`; typify calls `anyOf` "one of the weaker areas";
   NJsonSchema has no union type (`AnyType = "object"`). Corvus (`Match()` on `oneOf`/`anyOf`)
   and typify (`oneOf` → serde enum) are the two positive cases.
2. **Discriminators.** openapi-generator's `useOneOfDiscriminatorLookup` warns
   "**Validation (e.g. one and only one match in oneOf's schemas) will be skipped**".
   NSwag/NJsonSchema use a non-standard `JsonInheritanceConverter` by default
   (`JsonPolymorphicSerializationStyle = NJsonSchema`); the System.Text.Json style is
   "experimental/not complete". `SerializeTypeInformation` adds a `$type` property and is
   marked "not recommended".
3. **Binary.** zod emits `format: "binary" + contentEncoding: "binary"` (an OpenAPI 3.0-ism);
   zod-to-json-schema notes `format:binary` "is not part of the JSON Schema spec". NSwag routes
   binary out of the DTO system entirely into `FileParameter`/`FileResponse` (stream + status +
   headers, `IsPartial` = HTTP 206) and skips response-wrapping for `FileResponse`.
4. **`additionalProperties` defaults.** openapi-generator's
   `disallowAdditionalPropertiesIfNotPresent` **defaults to the documented-incorrect `true`**
   for go/python/csharp. zod defaults `z.object()` to `additionalProperties: false` on output
   but omits it on input. typify treats any non-boolean `additionalProperties` schema —
   including `{}` — as a `#[serde(flatten)]` map.
5. **Transforms / input-vs-output types.** zod's `io` option and zod-to-json-schema's
   `effectStrategy`/`pipeStrategy` both exist because a transformed schema has two shapes and
   JSON Schema can express only one.
6. **Enum evolution.** openapi-generator's `enumUnknownDefaultCase` (default `false`) is the
   only forward-compatibility escape hatch documented; without it "the client will fail to
   parse the network response" when the server adds an enum case.
7. **Date/time and big integers.** zod cannot represent `z.date()`, `z.bigint()`, `z.int64()`
   at all; go-jsonschema needs custom `SerializableDate`/`SerializableTime`; NJsonSchema
   collapses `date` and `date-time` both onto `DateTimeOffset` and `time`/duration onto
   `TimeSpan`; Corvus needs NodaTime + `BigNumber`/`BigInteger` extended types.
8. **`$ref` depth.** go-jsonschema resolves only **top-level** `$defs` names; nested
   `#/$defs/a/$defs/b` is unsupported.

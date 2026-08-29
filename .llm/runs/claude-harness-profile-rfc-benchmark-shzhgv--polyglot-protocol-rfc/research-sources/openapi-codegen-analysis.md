# RFC-5 analysis — source group `openapi-codegen`

Analyst: reverse-engineering pass over the three extracts in this group:

- `openapi-codegen-raw-nswag.md` (NSwag/NJsonSchema C# client generation — hereafter **[NSWAG]**)
- `openapi-codegen-raw-openapi-generator.md` (OpenAPI Generator rust/go/python/csharp landscape — **[OAG]**)
- `openapi-codegen-raw-schema-pipelines.md` (zod → JSON Schema → per-language types — **[PIPE]**)

Scope caveat, stated up front: this group is **contract/codegen tooling, not a task-execution
protocol**. It has no queue, no worker lifecycle, no heartbeats. Its value to RFC-5 is
different from the runtime-protocol groups: it is the best available evidence for (a) what a
**portable payload-schema subset** actually is across Rust/Go/Python/C#, (b) how mature
ecosystems shape a **generated error/response envelope**, and (c) how **static capability
declaration** (conformance matrices, maturity labels) substitutes for runtime negotiation.
Sections 2 and 3 are therefore thin and honest about it rather than padded.

Everything below cites the extract section it comes from. Anything not directly attested is
marked UNVERIFIED.

---

## 1. Message / verb inventory with wire shapes

There are no protocol verbs in this group; the "messages" are the **generated envelope types**
that every client in these ecosystems agrees on. These are the implicit request/response wire
shapes the tooling has converged on.

### 1.1 Success envelope — `SwaggerResponse` / `SwaggerResponse<TResult>` [NSWAG §6]

```csharp
SwaggerResponse          { int StatusCode; IReadOnlyDictionary<string, IEnumerable<string>> Headers; }
SwaggerResponse<TResult> : SwaggerResponse { TResult Result; }
```

- Opt-in via `WrapResponses` (per-client or per-method via `WrapResponseMethods`) [NSWAG §3].
- Structure: **(numeric status, headers-as-string-multimap, typed payload)**. The payload is
  a generic type parameter; the envelope itself is payload-agnostic.
- Response wrapping is *skipped* for file/stream results
  (`operation.UnwrappedResultType != "FileResponse"`) [NSWAG §6] — binary has its own envelope
  (§1.3 below).
- OpenAPI Generator's rust generator has the analogous `supportMultipleResponses` — "return
  type wraps an enum of all possible 2xx schemas" [OAG §7 rust] — i.e. multi-outcome success
  is modeled as a closed sum type, not a boolean.

### 1.2 Error envelope — `ApiException` / `ApiException<TResult>` [NSWAG §5]

```csharp
ApiException {
  int StatusCode;                                         // machine-readable code
  string Response;                                        // raw body, always preserved
  IReadOnlyDictionary<string, IEnumerable<string>> Headers;
  // message truncates Response at 512 chars; innerException chains cause
}
ApiException<TResult> : ApiException { TResult Result; }  // typed error payload when declared
```

Five-field error contract: **(human message, numeric code, raw payload string, metadata
multimap, optional typed detail)** plus cause-chaining. The raw body is *never* discarded even
when a typed `TResult` was parsed. See §4 for taxonomy analysis.

### 1.3 Binary envelopes — `FileParameter` / `FileResponse` [NSWAG §7]

```csharp
FileParameter { Stream Data; string FileName; string ContentType; }
FileResponse : IDisposable {
  int StatusCode; Headers; Stream Stream;
  bool IsPartial => StatusCode == 206;    // partial-content signal
  Dispose();                              // stream, then response, then client — ordered teardown
}
```

Binary is a **separate, non-JSON, stream-typed channel** that "bypasses the DTO type system
entirely and carries only status + headers + stream" [NSWAG §7]. Metadata (filename,
content-type) travels beside the stream, not inside it.

### 1.4 Dual parsed+raw carrier — `ObjectResponseResult<T>` [NSWAG §7]

```csharp
struct ObjectResponseResult<T> { T Object; string Text; }
```

The deserialized object **and** the original response text are both kept through the
deserialization boundary.

### 1.5 Schema-document "messages" [PIPE §1a]

The pipeline group's wire artifact is the JSON Schema document itself. `z.toJSONSchema()`
(official, zod ≥4.0) emits, e.g.:

```json
{ "type": "object",
  "properties": { "name": {"type":"string"}, "age": {"type":"number"} },
  "required": ["name","age"], "additionalProperties": false }
```

with a declared **target dialect** (`draft-04 | draft-07 | draft-2020-12 | openapi-3.0`), an
`io: "input" | "output"` selector (a transformed schema has two shapes), registry-driven
`$defs` extraction with `id → URI` mapping, and an explicit policy knob for unrepresentable
types (`"throw"` default vs `"any"` → `{}`) [PIPE §1a].

---

## 2. Lifecycle state machine (as actually implemented)

Degenerate: these are **one-shot request/response clients**. The only state machine visible in
the extracts is the generated call path in `Client.Class.liquid` [NSWAG §1, §5]:

```
PrepareRequest[Async]  →  send  →  classify by status code
    ├─ declared status           → parse declared schema → return (or wrap)
    ├─ undeclared 200/204        → return default value      ("Success is always expected")
    └─ any other undeclared code → throw ApiException("The HTTP status code of the response
                                     was not expected (…)", status, body, headers, null)
  finally: ProcessResponse[Async]
```

Facts:

- **Interception points are part of the contract.** `PrepareRequest()` / `ProcessResponse()`
  are partial-method (or mandatory-async, via
  `GeneratePrepareRequestAndProcessResponseAsAsyncMethods`) hooks on every generated client;
  base classes can additionally own client construction (`UseHttpClientCreationMethod`) and
  request-message construction (`UseHttpRequestMessageCreationMethod`) [NSWAG §1, §2]. This is
  where cross-cutting context (auth, tracing headers) is injected in practice.
- **Unknown-status policy is explicit and asymmetric** (template comment verbatim: "we don't
  want to throw on 'unknown status code'. Success is always expected") [NSWAG §5]: undeclared
  200/204 degrade gracefully to a default value; undeclared non-2xx is terminal.
- **Resource lifecycle is the only other lifecycle**: `DisposeHttpClient` (injected clients
  are never disposed), and `FileResponse.Dispose()`'s ordered teardown [NSWAG §2, §7].

No retry, no resume, no attempt tracking anywhere in the extracts. UNVERIFIED beyond the
extracts: whether openapi-generator's generichost C# library adds retry middleware — not in
the extract; do not assume.

## 3. Heartbeat / cancellation / deadline mechanics

**Absent from all three extracts.** No heartbeat, deadline, or timeout field appears in any
config surface or template fragment captured. The nearest artifacts:

- `IsPartial` (HTTP 206) on `FileResponse` [NSWAG §7] — a *partial delivery* marker, the only
  progress-adjacent signal in the group.
- rust `supportAsync` (default `true`) [OAG §7] — async call shape, which in Rust implies
  drop-based cancellation, but the extract says nothing about cancellation semantics.
  UNVERIFIED.
- Generated C# async methods almost certainly take `CancellationToken` — **UNVERIFIED**: the
  template fragments in the extract do not show parameter lists, so this is not attested.

Conclusion for RFC-5: this group contributes nothing to pillar-lifecycle heartbeat design and
should not be cited for it; use the runtime-protocol source groups instead.

## 4. Error taxonomy — retryable vs terminal representation

**Finding: retryability is not modeled anywhere in this group.** The taxonomy the ecosystem
converged on is:

| Axis | Representation | Source |
| --- | --- | --- |
| Machine class | `int StatusCode` (HTTP semantics carry retryability *by convention only*) | [NSWAG §5] |
| Human message | `message`, with raw body **truncated at 512 chars** inside it | [NSWAG §5] |
| Full evidence | `Response` — complete raw body string, always preserved | [NSWAG §5] |
| Metadata | headers multimap (`IReadOnlyDictionary<string, IEnumerable<string>>`) | [NSWAG §5] |
| Typed detail | `ApiException<TResult>.Result` — declared error schema, when the spec declares one | [NSWAG §5] |
| Cause chain | `innerException` | [NSWAG §5] |
| Expected vs unexpected | thrown message differs: declared-response description vs "status code … was not expected" | [NSWAG §5] |
| DTO-vs-transport | `WrapDtoExceptions` — deserialization failures wrapped so callers see one exception type | [NSWAG §2] |

Terminal-vs-retryable is thus **implicit in the numeric code** (a 503 vs a 400 — the client
does not interpret it), which is precisely the gap NetScript must not reproduce: RFC-5 should
carry an explicit `retryable` bit / retry-class rather than making every consumer re-derive it
from a code. What *is* worth copying is the layering: one stable machine code, one bounded
human message, one unbounded raw-evidence field, one optional typed detail, one cause chain —
five distinct fields, never collapsed into one string (NetScript today: `error: string|null` +
`exitCode`, which collapses all five).

A second, subtler taxonomy: **parse-failure-as-forward-compat-failure**. `enumUnknownDefaultCase`
[OAG §7 go]: without an open fallback variant, "the client will fail to parse the network
response" when the server adds an enum case — i.e. a *versioning* event surfaces as a
*deserialization error*. The documented cure is a reserved `unknown_default_open_api` variant
in every enum.

## 5. Versioning + capability negotiation

No **runtime** negotiation exists in this group; everything is resolved at generation time.
The mechanisms actually used:

1. **Generator-version stamping in the artifact.** Every generated NSwag type carries
   `[GeneratedCode("NSwag", "{{ ToolchainVersion }}")]` [NSWAG §5] — provenance travels with
   the code.
2. **Explicit dialect targeting.** `z.toJSONSchema({ target: "draft-2020-12" | "draft-07" |
   "draft-04" | "openapi-3.0" })` [PIPE §1a]; zod-to-json-schema similarly
   (`jsonSchema7 | jsonSchema2019-09 | openApi3 | openAi`) [PIPE §1c]. The schema *dialect* is
   a declared parameter, never implicit.
3. **Static capability matrices as conformance declarations.** Each openapi-generator
   generator publishes a machine-derivable feature matrix ("docs are generated from the
   generator implementations themselves" [OAG preamble]): Schema Support
   (Union/Polymorphism/oneOf/anyOf/allOf/not per OAS version) [OAG §4], Wire Format
   (JSON/XML/PROTOBUF/Custom) [OAG §5], Security Feature [OAG §6]. Consumers check the matrix,
   not the runtime.
4. **Maturity taxonomy on the surface itself.** `(beta)`, `(experimental)`, `(deprecated)`,
   no-suffix = stable [OAG §1]; option-level markers too ("Experimental. Subject to breaking
   changes without notice." on csharp `httpclient`/`unityWebRequest` libraries [OAG §7]).
   Cautionary detail: rust's metadata says `STABLE` while its own helpTxt says "(beta)"
   [OAG §3] — self-reported labels drift when they live in two places.
5. **Compat knobs with documented-wrong defaults.** `disallowAdditionalPropertiesIfNotPresent`
   defaults to `true`, documented as "Keep the old (**incorrect**) behaviour" [OAG §7 go];
   NSwag's default `SchemaType` is **Swagger2**, not OpenAPI 3 [NSWAG §4]. Legacy-compatible
   defaults outlive their justification and silently downgrade fidelity.
6. **Forward-compat escape hatches**: `enumUnknownDefaultCase` (§4 above); the unknown-2xx
   tolerance rule [NSWAG §5]; zod's `unrepresentable` handler [PIPE §1a].
7. **Namespaced extension vocabulary with allowlisting.** typify's `x-rust-type`
   (`crate` + semver requirement + full path), **ignored by default**, honored only per
   allowlisted crate+version [PIPE §2c] — an extension mechanism that degrades safely for
   non-understanding consumers and requires explicit trust to activate.

## 6. Transport + framing choices and why

- **JSON over HTTP is the invariant floor**: Wire Format matrix shows JSON ✓ for all four
  generators, XML ✓ for all four, **PROTOBUF ✗ for all four** (relegated to ToolingExtension)
  [OAG §5]. The portable interchange layer of this entire ecosystem is JSON; anything else is
  per-adapter.
- **Envelope = (numeric code, string→string[] metadata multimap, body)** — recurring in
  `SwaggerResponse`, `ApiException`, and `FileResponse` alike [NSWAG §5–§7]. Headers are
  always a *multimap*, never a flat map.
- **Binary framed out-of-band**: streams with sidecar metadata (`FileName`, `ContentType`),
  never base64-in-JSON, and response wrapping is disabled for it [NSWAG §7]. In the schema
  layer, binary is only describable via the OpenAPI-3.0-ism `format: "binary"` — zod emits it
  [PIPE §1b binary], zod-to-json-schema warns it "is not part of the JSON Schema spec"
  [PIPE §1c] — corroborating that JSON schemas do not model binary; a real protocol needs a
  distinct channel.
- **Serialization library is an adapter detail hidden behind the contract**: Newtonsoft vs
  System.Text.Json (`JsonLibrary`, STJ "experimental/not complete") [NSWAG §8]; urllib3 vs
  httpx vs asyncio (`library`) [OAG §7 python]; hyper vs reqwest [OAG §7 rust]. The generated
  *contract types* stay constant while the transport/serializer sub-template varies — the
  port/adapter split RFC-5 wants, already practiced.
- **Symmetric request/response settings are opt-in** (`UseRequestAndResponseSerializationSettings`,
  default false) [NSWAG §2] — the ecosystem acknowledges request and response serialization
  can legitimately differ.

## 7. STEAL CANDIDATES for NetScript's protocol

Tier legend used here: **T0** = minimal conformance every polyglot task/adapter must meet;
**T1** = standard ecosystem citizenship; **T2** = full/optional capability.

1. **Portable-core schema subset, defined by intersection, enforced at contract time.**
   [OAG §4] Union ✗ everywhere, `not` ✗ everywhere, `allOf` ✗ in rust+csharp; [PIPE §2b]
   go-jsonschema supports *none* of `allOf/anyOf/oneOf/not`, no `const`, only top-level
   `$defs` refs; [PIPE §1a] zod cannot represent bigint/int64/date/map/set at all. RFC-5's
   Tier-0 message and payload schemas must be written in the attested intersection: flat
   objects, primitives, arrays, string-keyed records, closed strings-only enums *with an open
   fallback*, top-level `$defs` only, no composition keywords except discriminated `oneOf` at
   the envelope root (see #3). Encode this as a lintable "NetScript-portable JSON Schema
   profile" checked in CI against the zod contract sources. → **interop, T0.**

2. **Five-field structured error envelope.** [NSWAG §5] `(code, message, raw, meta, detail?)`
   + cause chain: numeric/enumerated machine code; human message with the raw evidence
   **truncated (512-char precedent) for log safety**; full raw payload preserved separately;
   metadata multimap; optional schema-typed detail. Replaces `error: string|null` + `exitCode`.
   NetScript must add the field the sources lack: an explicit `retryable` / retry-class
   discriminant (§4). → **lifecycle/error, T0.**

3. **Discriminated-union envelope with mandatory exhaustive-dispatch adapters.** The only
   union form that survives all four languages is tagged `oneOf` (typify: "oneOf → a Rust
   enum" via serde tagging [PIPE §2c]; Corvus: "Type-safe `Match()` for oneOf/anyOf
   discriminated unions with exhaustive dispatch" [PIPE §2e]; rust `supportMultipleResponses`
   models multi-outcome as an enum [OAG §7]). RFC-5's protocol messages should be one
   discriminated union on a literal `type` (+ `v`) field, and adapter SDKs should expose a
   Match/exhaustive-switch surface with a mandatory unknown-arm. → **communication, T0
   (envelope shape); T1 (Match surface in adapters).**

4. **Unknown-member tolerance as a written rule, both directions.** `enumUnknownDefaultCase`'s
   reserved `unknown_default_open_api` variant [OAG §7 go] + NSwag's "don't throw on unknown
   status code… Success is always expected" [NSWAG §5] + the cautionary
   `disallowAdditionalPropertiesIfNotPresent=true` = "documented-incorrect" closed-world
   default [OAG §7]. RFC-5 rule: protocol *envelopes* are open (`additionalProperties`
   permitted and ignored), every protocol enum reserves an `unknown` variant, unknown message
   types are skipped-with-diagnostic, never fatal. Note the tension to resolve explicitly:
   zod's `z.object()` emits `additionalProperties: false` by default [PIPE §1a] — NetScript's
   contract source would silently produce closed envelopes unless the profile overrides it.
   → **interop/versioning, T0.**

5. **Input/output schema duality.** zod's `io: "input" | "output"` exists because "a
   transformed schema has two shapes and JSON Schema can express only one" [PIPE §1a, §1c,
   cross-cutting #5]. RFC-5 must publish task **param** schemas from the input projection and
   task **result** schemas from the output projection — one exported schema per direction,
   never one shared schema. Directly actionable since NetScript already uses zod on the
   workers surface. → **interop, T1.**

6. **Toolchain/protocol provenance stamped on every artifact.** `[GeneratedCode("NSwag",
   ToolchainVersion)]` [NSWAG §5]. Every RFC-5 handshake/first-line and every generated
   adapter type carries `{protocol: "netscript-task/1", generator, generatorVersion}` so a
   misbehaving worker's toolchain is identifiable from its messages alone. → **observability,
   T0 (protocol version), T1 (generator provenance).**

7. **Mandatory context-injection hook in adapter SDKs.** `PrepareRequest`/`ProcessResponse`
   partial-method hooks + base-class creation methods [NSWAG §1–§2] are where tracing/auth
   headers get injected in this ecosystem. NetScript's bug D-4 (queue path drops
   TRACEPARENT/CORRELATION_ID) is exactly what a single mandatory "prepare-context" chokepoint
   in the spawn/dispatch path prevents: one hook through which *every* dispatch route passes,
   with conformance test asserting traceparent presence. → **observability, T1 (hook API);
   the traceparent-propagation fix itself is T0.**

8. **Static capability matrix per adapter, generated from the implementation.** [OAG §1, §3–§6]
   feature matrices + maturity suffixes, "generated from the generator implementations
   themselves". Each NetScript language adapter ships a machine-readable conformance document
   (tier claimed, messages supported, schema-profile features, transports) generated from its
   conformance-test results — not hand-written prose (the rust STABLE-vs-"(beta)" drift
   [OAG §3] shows why hand-maintained duplicates rot). This *is* RFC-5's tiered-conformance
   surface. → **interop, T0 (declaring the matrix is the tier-0 entry bar).**

9. **Keep parsed and raw side by side.** `ObjectResponseResult<T> {Object, Text}` [NSWAG §7]
   and `ApiException.Response` raw preservation [NSWAG §5]. When the engine parses the result
   line into `TaskResult`, retain the raw line (bounded) in the job record/diagnostics so
   schema-mismatch failures are debuggable from the record alone. → **observability, T1.**

10. **Out-of-band binary channel with metadata sidecar and partial marker.**
    `FileParameter`/`FileResponse` (stream + FileName + ContentType + StatusCode + `IsPartial`,
    ordered `Dispose`) [NSWAG §7]; schema layer cannot express binary portably [PIPE
    cross-cutting #3]. If/when RFC-5 adds artifact/blob passing for polyglot tasks: reference
    + metadata in the JSON envelope, bytes on a separate channel (file path/fd/object store),
    never base64-in-payload at Tier 0. → **communication, T2.**

11. **Namespaced, ignored-by-default, allowlisted extension fields.** typify's `x-rust-type`
    with crate+semver+path and per-crate allowlisting [PIPE §2c]. Reserve `x-netscript-*` (or
    a top-level `ext` object) in the protocol: consumers MUST ignore unknown extensions
    (ties to #4), engines activate specific extensions only by explicit configuration.
    → **interop/versioning, T1.**

12. **Schema-as-committed-artifact, codegen in build.** quicktype's own recommended workflow:
    "commit the schema to your project repo, then generate code from the schema as part of
    your build process… All of these models will serialize to and from the same JSON, so
    different programs in your stack can communicate seamlessly" [PIPE §2a]. RFC-5: the
    versioned protocol JSON Schema is the committed source of truth (generated once from the
    zod contracts via official `z.toJSONSchema`, target `draft-2020-12` for the canonical copy
    [PIPE §1a]); per-language adapter types are CI-generated from it with the surveyed tools
    (typify/Rust, datamodel-code-generator/Python, go-jsonschema-class tooling/Go, Corvus or
    NJsonSchema/C#) rather than hand-written. → **interop, T1.**

13. **Success envelope carries metadata, not just payload.** `WrapResponses` →
    `SwaggerResponse<T>{StatusCode, Headers, Result}` [NSWAG §3, §6]. The RFC-5 `result`
    message should be an envelope `{outcome, meta (attempt, timing, taskId…), payload}` rather
    than payload-with-a-success-flag — NetScript's current `TaskResult {success:boolean}+bag`
    conflates the two layers. → **lifecycle + observability, T0.**

## 8. Anti-patterns to avoid (attested in the sources)

1. **Error-as-single-string.** The entire five-field ApiException structure [NSWAG §5] exists
   because status+body+headers+typed-detail cannot be collapsed; NetScript's current
   `error: string|null` is the pre-NSwag state of the world.
2. **Retryability by convention.** Nothing in this group marks errors retryable (§4);
   consumers must interpret numeric codes. Do not ship RFC-5 errors without an explicit
   retry-class field.
3. **Closed-world by default.** `disallowAdditionalPropertiesIfNotPresent=true` documented as
   "the old (**incorrect**) behaviour" yet still the default [OAG §7]; enums without an
   unknown variant make version skew a parse failure [OAG §7 go]; zod's default
   `additionalProperties:false` [PIPE §1a] would leak this into NetScript envelopes unnoticed.
4. **In-band type metadata.** `SerializeTypeInformation` (`$type`, "not recommended")
   [NSWAG §2, §8] and the default non-standard `JsonInheritanceConverter` discriminator
   [NSWAG §8]: implementation-specific type tags in payloads couple every peer to one
   serializer. Use a spec'd literal discriminator field instead.
5. **Fast-path that skips validation.** `useOneOfDiscriminatorLookup`: "Validation (e.g. one
   and only one match in oneOf's schemas) will be skipped" [OAG §7] — and it is offered even
   where the matrix says `oneOf ✗` (csharp) [OAG §7 vs §4]. Never let a performance option
   silently change acceptance semantics; NetScript conformance tiers must pin validation
   behavior.
6. **Legacy-compatible defaults that downgrade fidelity.** NSwag defaults to `SchemaType.Swagger2`
   [NSWAG §4]; nullability opt-in-off (`GenerateNullableReferenceTypes=false`) [NSWAG §8].
   RFC-5 defaults must be the current-correct behavior; compat is the opt-in.
7. **Self-reported capability labels in two places.** rust `STABLE` metadata vs "(beta)"
   helpTxt [OAG §3]. Conformance/maturity must have one generated source of truth (steal #8).
8. **Building the contract chain on deprecated community bridges.** `zod-to-json-schema`:
   deprecated Nov 2025, unmaintained [PIPE §1c]; `z.fromJSONSchema` explicitly experimental
   [PIPE §1b]. RFC-5's canonical direction must be zod → JSON Schema via the official
   `z.toJSONSchema` only; never make the reverse (JSON Schema → zod) load-bearing.
9. **Unions/composition in Tier-0 wire types.** Union ✗ across all four generators [OAG §4];
   go-jsonschema: no composition at all [PIPE §2b]; typify: `anyOf` "one of the weaker areas"
   [PIPE §2c]; NJsonSchema degrades unmodelled `oneOf`/`anyOf` to `object` [NSWAG §8]. Except
   for the single root discriminated `oneOf` (steal #3), keep composition keywords out of the
   portable profile — including nested `$defs` refs [PIPE §2b] and `not` (✗ everywhere).
10. **Binary smuggled through the type system.** The sources uniformly route binary around
    JSON ([NSWAG §7], [PIPE cross-cutting #3]); `format:"binary"` is a non-portable
    OpenAPI-3.0-ism [PIPE §1c]. Don't define Tier-0 messages that require base64 blobs.
11. **Unbounded raw payloads in human-facing strings.** NSwag deliberately truncates the body
    at 512 chars in the exception *message* while keeping the full body in a separate field
    [NSWAG §5] — copying raw stdout into `error` strings unbounded (a risk for NetScript's
    last-JSON-line design) pollutes logs and traces.

---

## Open questions (carried to StructuredOutput)

- Whether generated clients in these ecosystems expose cancellation (`CancellationToken` /
  request timeout parameters) is UNVERIFIED — template parameter lists were not captured; if
  RFC-5 wants precedent for cancellation-parameter surface shape, it must come from another
  source group.
- The NSwag `Client.Exception.liquid` and per-operation template internals failed to fetch;
  the throw-site fragments in [NSWAG §5] are sufficient for the error-envelope claim, but the
  exact deserialization-failure path of `WrapDtoExceptions` is only attested at the settings
  level.
- Whether datamodel-code-generator's composition support ("Handles complex schemas: $ref,
  allOf, oneOf, anyOf" [PIPE §2d]) is full-fidelity or lossy is a self-claim without a matrix;
  Python's portable-profile ceiling should be validated in NetScript's own conformance corpus.

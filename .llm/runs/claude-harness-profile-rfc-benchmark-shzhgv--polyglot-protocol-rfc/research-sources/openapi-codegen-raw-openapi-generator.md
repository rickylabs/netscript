# RFC-5 source extract — OpenAPI Generator landscape (openapi-codegen group)

Fetch date: 2026-08-20

Sources:

- https://openapi-generator.tech/docs/generators/ (rendered) —
  raw: https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators.md
- https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/rust.md
- https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/go.md
- https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/python.md
- https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/csharp.md

Status: **official** upstream tooling of the OpenAPITools org (community-governed,
Apache-2.0). Docs are generated from the generator implementations themselves.

---

## 1. Generator categories

Verbatim from `docs/generators.md`:

```
The following generators are available:

## CLIENT generators
## SERVER generators
## DOCUMENTATION generators
## SCHEMA generators
## CONFIG generators
```

Maturity is encoded as a suffix on the generator name in the list: `(beta)`,
`(experimental)`, `(deprecated)`; no suffix = stable.

## 2. CLIENT generator list (verbatim, full)

```
ada, android, apex, bash, c, clojure, cpp-boost-beast-client, cpp-oatpp-client,
cpp-qt-client, cpp-restsdk, cpp-tiny (beta), cpp-tizen, cpp-ue4 (beta), crystal (beta),
csharp, dart, dart-dio, eiffel, elixir, elm, erlang-client, erlang-proper, gdscript, go,
groovy, haskell-http-client, java, java-helidon-client (beta), java-micronaut-client (beta),
javascript, javascript-apollo-deprecated (deprecated), javascript-closure-angular (beta),
javascript-flowtyped, jaxrs-cxf-client, jetbrains-http-client (experimental), jmeter,
julia-client (beta), k6 (beta), kotlin, lua (beta), n4js (beta), nim (beta), objc, ocaml,
perl, php, php-dt (beta), php-nextgen (beta), powershell (beta), python, python-pydantic-v1,
r, ruby, ruby-nextgen (beta), rust, scala-akka, scala-gatling, scala-http4s, scala-pekko,
scala-sttp, scala-sttp4 (beta), scala-sttp4-jsoniter (beta), scalaz, swift-combine,
swift5 (deprecated), swift6, terraform-provider (experimental), typescript (experimental),
typescript-angular, typescript-aurelia, typescript-axios, typescript-fetch,
typescript-inversify, typescript-jquery, typescript-nestjs (experimental), typescript-node,
typescript-redux-query, typescript-rxjs, xojo-client, zapier (beta)
```

The four generators of interest (`rust`, `go`, `python`, `csharp`) all carry **no** maturity
suffix in the list.

## 3. Per-generator METADATA (verbatim)

| generator | stability | type | language | templating | helpTxt |
| --- | --- | --- | --- | --- | --- |
| `rust` | STABLE | CLIENT | Rust | mustache | "Generates a Rust client library (beta)." |
| `go` | STABLE | CLIENT | Go | mustache | "Generates a Go client library." |
| `python` | STABLE | CLIENT | Python (language version 3.10+) | mustache | "Generates a Python client library." |
| `csharp` | STABLE | CLIENT | C# | mustache | "Generates a C# client library (.NET Standard, .NET Core)." |

Note the internal contradiction on `rust`: metadata says `generator stability | STABLE`
while the generator's own `helpTxt` still says "(beta)".

## 4. Schema Support Feature matrices (verbatim tables)

These are the fidelity matrices — `Union`, `Polymorphism`, `oneOf`/`anyOf`/`allOf`/`not`.

### rust

```
|Simple|✓|OAS2,OAS3
|Composite|✓|OAS2,OAS3
|Polymorphism|✗|OAS2,OAS3
|Union|✗|OAS3
|allOf|✗|OAS2,OAS3
|anyOf|✗|OAS3
|oneOf|✓|OAS3
|not|✗|OAS3
```

### go

```
|Simple|✓|OAS2,OAS3
|Composite|✓|OAS2,OAS3
|Polymorphism|✗|OAS2,OAS3
|Union|✗|OAS3
|allOf|✓|OAS2,OAS3
|anyOf|✓|OAS3
|oneOf|✓|OAS3
|not|✗|OAS3
```

### python

```
|Simple|✓|OAS2,OAS3
|Composite|✓|OAS2,OAS3
|Polymorphism|✓|OAS2,OAS3
|Union|✗|OAS3
|allOf|✓|OAS2,OAS3
|anyOf|✓|OAS3
|oneOf|✓|OAS3
|not|✗|OAS3
```

### csharp

```
|Simple|✓|OAS2,OAS3
|Composite|✓|OAS2,OAS3
|Polymorphism|✓|OAS2,OAS3
|Union|✗|OAS3
|allOf|✗|OAS2,OAS3
|anyOf|✗|OAS3
|oneOf|✗|OAS3
|not|✗|OAS3
```

Summary of the cross-language intersection: **`Union` is ✗ everywhere; `not` is ✗
everywhere.** `oneOf` is the only composition keyword supported by all of rust/go/python but
**not** by csharp. `allOf` is unsupported by rust and csharp.

## 5. Wire Format Feature (verbatim)

| generator | JSON | XML | PROTOBUF | Custom |
| --- | --- | --- | --- | --- |
| rust | ✓ | ✓ | ✗ | ✓ |
| go | ✓ | ✓ | ✗ | ✗ |
| python | ✓ | ✓ | ✗ | ✓ |
| csharp | ✓ | ✓ | ✗ | ✗ |

PROTOBUF is `✗ | ToolingExtension` for all four.

## 6. Security Feature (verbatim, differences that matter)

| Name | rust | go | python | csharp |
| --- | --- | --- | --- | --- |
| BasicAuth | ✓ | ✓ | ✓ | ✓ |
| ApiKey | ✓ | ✓ | ✓ | ✓ |
| OpenIDConnect | ✗ | ✗ | ✗ | ✗ |
| BearerToken | ✓ | ✓ | ✓ | ✓ |
| OAuth2_Implicit | ✓ | ✓ | ✓ | ✓ |
| OAuth2_Password | ✗ | ✗ | ✗ | ✗ |
| OAuth2_ClientCredentials | ✗ | ✗ | ✗ | ✓ |
| OAuth2_AuthorizationCode | ✗ | ✗ | ✗ | ✗ |
| SignatureAuth | ✗ | ✓ | ✓ | ✓ |
| AWSV4Signature (ToolingExtension) | ✓ | ✓ | ✗ | ✗ |

## 7. Config surface — selected options (verbatim rows)

Preamble on every generator page: "These options may be applied as additional-properties
(cli) or configOptions (plugins)."

### rust

- `library` — "library template (sub-template) to use." Values: **hyper** (HTTP client: Hyper
  v1.x), **hyper0x** (Hyper v0.x), **reqwest** (Reqwest), **reqwest-trait** (Reqwest, trait
  based). Default: `reqwest`.
- `supportAsync` — "If set, generate async function call instead. This option is for
  'reqwest' library only". Default `true`.
- `supportMultipleResponses` — "If set, **return type wraps an enum of all possible 2xx
  schemas**. This option is for 'reqwest' and 'reqwest-trait' library only". Default `false`.
- `useSingleRequestParameter` — "generate functions with a single argument containing all API
  endpoint parameters instead of one argument per parameter." Default `false`.
- `avoidBoxedModels` — "If set, `Box<T>` will not be used for models". Default `false`.
- `bestFitInt` — "Use best fitting integer type where minimum or maximum is set". `false`.
- `preferUnsignedInt` — "Prefer unsigned integers where minimum value is >= 0". `false`.
- `packageName` — default `openapi`. `hideGenerationTimestamp` — default `true`.
- `withAWSV4Signature` — default `false`.

### go

- `packageName` default `openapi`; `structPrefix` — "whether to prefix struct with the class
  name. e.g. DeletePetOpts => PetApiDeletePetOpts", default `false`.
- `useOneOfDiscriminatorLookup` — "Use the discriminator's mapping in oneOf to speed up the
  model lookup. **IMPORTANT: Validation (e.g. one and only one match in oneOf's schemas) will
  be skipped.**" Default `false`.
- `disallowAdditionalPropertiesIfNotPresent` — default **`true`**, documented as
  "Keep the old (**incorrect**) behaviour that 'additionalProperties' is set to false by
  default"; `false` is "compliant with the OAS and JSON schema specifications".
- `enumUnknownDefaultCase` — "If the server adds new enum cases, that are unknown by an old
  spec/client, the client will fail to parse the network response. With this option enabled,
  each enum will have a new case, **'unknown_default_open_api'**, so that when the server
  sends an enum case that is not known by the client/spec, they can safely fallback to this
  case." Default `false`.
- `withXml` — "whether to include support for application/xml content type and include XML
  annotations in the model". Default `false`.
- `withAWSV4Signature` — default `false`.

### python

- `library` — "library template (sub-template) to use: asyncio, urllib3, httpx".
  Default `urllib3`.
- `mapNumberTo` — "Map number to Union[StrictFloat, StrictInt], StrictFloat, float or
  Decimal." Default `Union[StrictFloat, StrictInt]`.
- `packageName` default `openapi_client` (snake_case convention).
- `generateSourceCodeOnly` default `false`.
- `useOneOfDiscriminatorLookup` — same text + same validation-skipping warning as go.
- `disallowAdditionalPropertiesIfNotPresent` — same, default `true` (incorrect-by-default).
- A separate generator `python-pydantic-v1` exists in the CLIENT list (no maturity suffix)
  for projects pinned to pydantic v1.

### csharp

- `library` — "HTTP library template (sub-template) to use". Values:
  - **generichost** — "HttpClient, Generic Host integration, and System.Text.Json"
  - **httpclient** — "HttpClient and Newtonsoft … (**Experimental. Subject to breaking
    changes without notice.**)"
  - **unityWebRequest** — "(**Experimental. Subject to breaking changes without notice.**)"
  - **restsharp** — RestSharp
  - Default: `generichost`.
- `targetFramework` — "The target .NET framework version. To target multiple frameworks, use
  `;` as the separator, e.g. `netstandard2.1;netcoreapp3.1`". Values: netstandard1.3,
  netstandard1.4, netstandard1.5, netstandard1.6, netstandard2.0, netstandard2.1, net47,
  net48, net8.0, net9.0, net10.0. Default **`net10.0`**.
- `nullableReferenceTypes` — "Use nullable annotations in the project. Only supported on C# 8
  / ASP.NET Core 3.1 or newer. Starting in .NET 6.0 the default is true." Option default
  `false`.
- `netCoreProjectFile` — default `false`. `packageName` default `Org.OpenAPITools`.
- `useOneOfDiscriminatorLookup` — present with the same validation-skipping warning, even
  though the csharp Schema Support matrix reports `oneOf` as ✗.
- `disallowAdditionalPropertiesIfNotPresent` — same, default `true`.

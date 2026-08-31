# RFC-5 Round 2 — Source Aggregation: group `conformance-harness`

Faithful collection only. No analysis, no recommendations. All fetches performed **2026-08-20**.
Quoted blocks are verbatim from the cited source; bracketed `[…]` marks elision.

Sources are grouped by ecosystem. Each entry records: source URL, fetch date, and protocol-relevant
extracts bearing on (a) test-case naming/versioning, (b) optional-feature coverage declaration,
(c) report formats, (d) how the suite drives a capability matrix.

---

## 1. gRPC — Interoperability test descriptions (named-test-case + client/server-pair pattern)

### 1.1 `doc/interop-test-descriptions.md`

- Source: <https://raw.githubusercontent.com/grpc/grpc/master/doc/interop-test-descriptions.md>
- Fetched: 2026-08-20 (raw, 1522 lines)

Header:

> Interoperability Test Case Descriptions
> =======================================
>
> Client and server use
> [test.proto](../src/proto/grpc/testing/test.proto)
> and the [gRPC over HTTP/2 v2 protocol](./PROTOCOL-HTTP2.md).

**Client side — test-case naming and invocation:**

> Clients implement test cases that test certain functionally. Each client is
> provided the test case it is expected to run as a command-line parameter. Names
> should be lowercase and without spaces.

Client CLI contract (verbatim, abridged to the protocol-relevant flags):

> Clients should accept these arguments:
> * --server_host=HOSTNAME / --server_host_override=HOSTNAME / --server_port=PORT
> * --test_case=TESTCASE
>     * The name of the test case to execute. For example, "empty_unary"
> * --use_tls=BOOLEAN / --use_test_ca=BOOLEAN
> * --default_service_account=ACCOUNT_EMAIL / --oauth_scope=SCOPE / --service_account_key_file=PATH
> * --service_config_json=SERVICE_CONFIG_JSON / --additional_metadata=ADDITIONAL_METADATA
> * -- google_c2p_universe_domain=UNIVERSE_DOMAIN
>
> Clients must support TLS with ALPN. Clients must not disable certificate
> checking.

**Server side — orthogonal named features (the capability vocabulary):**

> Server
> ------
>
> Servers implement various named features for clients to test with. Server
> features are orthogonal. If a server implements a feature, it is always
> available for clients. Names are simple descriptions for developer
> communication and tracking.
>
> Servers should accept these arguments:
>
> * --port=PORT
> * --use_tls=BOOLEAN
>
> Servers that want to be used for dual stack testing must accept this argument:
>
> * --address_type=IPV4|IPV6|IPV4_IPV6
>     * What type of addresses to listen on. Default IPV4_IPV6
>
> Servers must support TLS with ALPN. They should use
> [server1.pem](...) for their certificate.

**Named server features (section headings, each with a markdown anchor id so test cases can
link to them):**

`EmptyCall`, `UnaryCall`, `CacheableUnaryCall`, `CompressedResponse`, `CompressedRequest`,
`StreamingInputCall`, `StreamingOutputCall`, `FullDuplexCall`, `Echo Status`, `Echo Metadata`,
`Observe ResponseParameters.interval_us`, `Echo Auth Information` (sub-features
`Echo Authenticated Username`, `Echo OAuth scope`), `Backend metrics report`,
`Fill peer socket address`, `Max concurrent streams limit`.

Feature definitions are declarative and behavioural, e.g.:

> ### CompressedRequest
> [CompressedRequest]: #compressedrequest
>
> When the client sets `expect_compressed` to true, the server expects the client
> request to be compressed. If it's not, it fails the RPC with `INVALID_ARGUMENT`.
> Note that `response_compressed` is present on both `SimpleRequest` (unary) and
> `StreamingOutputCallRequest` (streaming).

> ### StreamingInputCall
> [StreamingInputCall]: #streaminginputcall
>
> Server implements StreamingInputCall which upon half close immediately returns
> a StreamingInputCallResponse where aggregated_payload_size is the sum of all
> request payload bodies received.

**Test case template.** Every case is a `### <lowercase_name>` heading followed by a prose
statement of intent, a `Server features:` list of required named features, a numbered
`Procedure:`, and a `Client asserts:` list. Minimal example verbatim:

> ### empty_unary
>
> This test verifies that implementations support zero-size messages. Ideally,
> client implementations would verify that the request and response were zero
> bytes serialized, but this is generally prohibitive to perform, so is not
> required.
>
> Server features:
> * [EmptyCall][]
>
> Procedure:
>  1. Client calls EmptyCall with the default Empty message
>
> Client asserts:
> * call was successful
> * response is non-null
>
> *It may be possible to use UnaryCall instead of EmptyCall, but it is harder to
> ensure that the proto serialized to zero bytes.*

Feature-probing example (a case that discovers optional server capability at runtime):

> ### client_compressed_unary
>
> This test verifies the client can compress unary messages by sending two unary
> calls, for compressed and uncompressed payloads. It also sends an initial
> probing request to verify whether the server supports the [CompressedRequest][]
> feature by checking if the probing call fails with an `INVALID_ARGUMENT` status.
>
> Server features:
> * [UnaryCall][]
> * [CompressedRequest][]
>
> Procedure:
>  1. Client calls UnaryCall with the feature probe, an *uncompressed* message:
>     `{ expect_compressed:{ value: true } response_size: 314159 payload:{ body: 271828 bytes of zeros } }`
>  1. Client calls UnaryCall with the *compressed* message: (same body)
>  1. Client calls UnaryCall with the *uncompressed* message: (`expect_compressed: false`)
>
>     Client asserts:
>     * First call failed with `INVALID_ARGUMENT` status.
>     * Subsequent calls were successful.
>     * Response payload body is 314159 bytes in size.
>     * Clients are free to assert that the response payload body contents are
>       zeros and comparing the entire response message against a golden response.

**Full standardized case-name inventory** (each a `###` heading, in document order):

```
empty_unary
cacheable_unary
large_unary
client_compressed_unary
server_compressed_unary
client_streaming
client_compressed_streaming
server_streaming
server_compressed_streaming
ping_pong
empty_stream
compute_engine_creds
jwt_token_creds
oauth2_auth_token
per_rpc_creds
google_default_credentials
compute_engine_channel_credentials
custom_metadata
status_code_and_message
special_status_message
unimplemented_method
unimplemented_service
cancel_after_begin
cancel_after_first_response
timeout_on_sleeping_server
rpc_soak
channel_soak
orca_per_rpc
orca_oob
max_concurrent_streams_connection_scaling
```

**Maturity tiers inside the document** (how not-yet-conformance-bearing cases are quarantined):

> ### Experimental Tests
>
> These tests are not yet standardized, and are not yet implemented in all
> languages. Therefore they are not part of our interop matrix.
>
> #### long_lived_channel
>
> The client performs a number of large_unary RPCs over a single long-lived
> channel with a fixed but configurable interval between each RPC.
>
> #### concurrent_large_unary
>
> Status: TODO
>
> Client performs 1000 large_unary tests in parallel on the same channel.
>
> #### Flow control. Pushback at client for large messages (TODO: fix name)
>
> Status: TODO […]

Two further tiers follow: `### TODO Tests` (sub-headed `High priority:` / `Normal priority:` /
`Lower priority:` / `To prioritize:`, each a bare prose line with an owner's name in parentheses,
e.g. "Propagation of status code and message (yangg)"), and `### Postponed Tests` ("Resilience to
buggy servers […]", "Reconnect after transport failure", "Reconnect backoff", "Fuzz testing").
Neither tier is part of the interop matrix.

### 1.2 Optional-feature coverage declaration — `tools/run_tests/run_interop_tests.py`

- Source: <https://raw.githubusercontent.com/grpc/grpc/master/tools/run_tests/run_interop_tests.py>
- Fetched: 2026-08-20 (raw, 1903 lines)

Skip-groups are named constants; each language object declares what it does *not* implement, as
client and as server, by returning lists of test-case names:

```python
_SKIP_CLIENT_COMPRESSION = [
    "client_compressed_unary",
    "client_compressed_streaming",
]

_SKIP_SERVER_COMPRESSION = [
    "server_compressed_unary",
    "server_compressed_streaming",
]

_SKIP_COMPRESSION = _SKIP_CLIENT_COMPRESSION + _SKIP_SERVER_COMPRESSION

_SKIP_ADVANCED = [
    "status_code_and_message",
    "custom_metadata",
    "unimplemented_method",
    "unimplemented_service",
]

_SKIP_SPECIAL_STATUS_MESSAGE = ["special_status_message"]

_ORCA_TEST_CASES = ["orca_per_rpc", "orca_oob"]

_GOOGLE_DEFAULT_CREDS_TEST_CASE = "google_default_credentials"

_SKIP_GOOGLE_DEFAULT_CREDS = [
    _GOOGLE_DEFAULT_CREDS_TEST_CASE,
]

_COMPUTE_ENGINE_CHANNEL_CREDS_TEST_CASE = "compute_engine_channel_credentials"

_SKIP_COMPUTE_ENGINE_CHANNEL_CREDS = [
    _COMPUTE_ENGINE_CHANNEL_CREDS_TEST_CASE,
]

_TEST_TIMEOUT = 3 * 60

# disable this test on core-based languages,
# see https://github.com/grpc/grpc/issues/9779
_SKIP_DATA_FRAME_PADDING = ["data_frame_padding"]

# report suffix "sponge_log.xml" is important for reports to get picked up by internal CI
_DOCKER_BUILD_XML_REPORT = "interop_docker_build/sponge_log.xml"
_TESTS_XML_REPORT = "interop_test/sponge_log.xml"
```

Per-language declaration shape (verbatim, C++ shown; every language class follows the same
interface: `client_cmd`, `server_cmd`, `global_env`, `unimplemented_test_cases`,
`unimplemented_test_cases_server`, `safename`, `__str__`):

```python
class CXXLanguage:
    def __init__(self):
        self.client_cwd = None
        self.server_cwd = None
        self.http2_cwd = None
        self.safename = "cxx"

    def client_cmd(self, args):
        return ["cmake/build/interop_client"] + args

    def client_cmd_http2interop(self, args):
        return ["cmake/build/http2_client"] + args

    def server_cmd(self, args):
        return ["cmake/build/interop_server"] + args

    def unimplemented_test_cases(self):
        return (
            _SKIP_DATA_FRAME_PADDING
            + _SKIP_SPECIAL_STATUS_MESSAGE
            + _SKIP_COMPUTE_ENGINE_CHANNEL_CREDS
        )

    def unimplemented_test_cases_server(self):
        return []

    def __str__(self):
        return "c++"
```

Observed variants in the same file: some languages return the whole `_TEST_CASES` list from
`unimplemented_test_cases_server()` (i.e. client-only implementations), others return
`_TEST_CASES[1:]`, others compose `_SKIP_COMPRESSION + _ORCA_TEST_CASES`, etc.

### 1.3 Version/compat matrix driver — `tools/interop_matrix/README.md`

- Source: <https://raw.githubusercontent.com/grpc/grpc/master/tools/interop_matrix/README.md>
- Fetched: 2026-08-20 (raw, 63 lines)

> # Overview
>
> This directory contains scripts that facilitate building and running gRPC interoperability tests
> for combinations of language/runtimes (known as matrix).
>
> The setup builds gRPC docker images for each language/runtime and upload it to Artifact Registry
> (AR). These images, encapsulating gRPC stack from specific releases/tag, are used to test version
> compatibility between gRPC release versions.

> ## Step-by-step instructions for adding an AR docker image for a new release for compatibility test
>
> We have continuous nightly test setup to test gRPC backward compatibility between old clients and
> latest server. When a gRPC developer creates a new gRPC release, s/he is also responsible to add
> the just-released gRPC client to the nightly test. The steps are: […]
> - Add (or update) an entry in `./client_matrix.py` file to reference the github tag for the release.
> - Build new client docker image(s).  For example, for C and wrapper languages release `v1.9.9`, do
>   - `tools/interop_matrix/create_matrix_images.py --git_checkout --release=v1.9.9 --upload_images --language cxx python ruby php`

> ## Instructions for adding new language/runtimes
>
> - Create new `Dockerfile.template`, `build_interop.sh.template` for the language/runtime under `template/tools/dockerfile/`. […]
> - Add language/runtimes to `client_matrix.py` following existing language/runtimes examples.

> ## Instructions for creating new test cases
>
> - Create test cases by running `LANG=<lang> [RELEASE=<release>] ./create_testcases.sh`.  For example,
>   - `LANG=go ./create_testcases.sh` will generate `./testcases/go__master`, which is also a functional bash script. […]
> - Stage and commit the generated test case file `./testcases/<lang>__<release>`.

> ## Instructions for running test cases against AR docker images
>
> - Run `tools/interop_matrix/run_interop_matrix_tests.py`.  Useful options:
>   - `--release` specifies a git release tag.  Defaults to `--release=all`. […]
>   - `--language` specifies a language.  Defaults to `--language=all`. […]
> - The output for all the test cases is recorded in a junit style xml file (defaults to 'report.xml').

> ## Instructions for running test cases against an AR image manually
>
> - Download a docker image from AR. […]
>   - `docker_image=us-docker.pkg.dev/grpc-testing/testing-images-public/grpc_interop_go1.8:v1.16.0 ./testcases/go__master` will run go__master test cases against `go1.8` with gRPC release `v1.16.0` docker image in AR.

Note the frozen-test-case-file convention: `./testcases/<lang>__<release>` is a generated,
committed bash script — the case list is pinned per language *and* per release tag.

---

## 2. CloudEvents

### 2.1 `cloudevents/conformance` tool

- Source: <https://raw.githubusercontent.com/cloudevents/conformance/main/README.md>
- Fetched: 2026-08-20 (raw, 104 lines)

> # CloudEvents Conformance Testing
>
> `cloudevents` is a tool for testing CloudEvents receivers.
>
> This repository has been archived due to inactivity. If someone would like to
> continue with the work please send an email to cncf-cloudevents@lists.cncf.io.
>
> […]
> _Work in progress._

Commands:

> ## Usage
>
> `cloudevents` has three commands at the moment: `send`, `invoke` and `listen`.
>
> ### Send
> `send` will do a one-off creation of a cloudevent and send to a given target.
> `cloudevents send http://localhost:8080 --id abc-123 --source cloudevents.conformance.tool --type foo.bar`
>
> ### Invoke
> `invoke` will read yaml files, convert them to http and send them to the given target.
> `cloudevents invoke http://localhost:8080 -f ./yaml/v0.3`
>
> ### Listen
> `listen` will accept http request and write the converted yaml to stdout.
> `cloudevents listen -v > got.yaml`
> Optionally, you can forward the incoming request to a target.
> `cloudevents listen -v -t http://localhost:8181 > got.yaml`
>
> ### Diff
> `diff` compares two yaml event files.
> `cloudevents diff ./want.yaml ./got.yaml`
>
> `want.yaml` could have fewer fields specified to allow for fuzzy matching.
>
> Example, if you only wanted to compare on `type` and ignore additional fields:
>
> ```shell script
> $ cat ./want.yaml
> ContextAttributes:
>   type: com.example.someevent
> $ cat ./got.yaml
> Mode: structured
> ContextAttributes:
>   specversion: 1.0
>   type: com.example.someevent
>   time: 2018-04-05T03:56:24Z
>   id: 4321-4321-4321-a
>   source: /mycontext/subcontext
>   Extensions:
>     comexampleextension1 : "value"
>     comexampleextension2 : |
>       {"othervalue": 5}
> TransportExtensions:
>   user-agent: "foo"
> Data: |
>   {"world":"hello"}
>
> $ cloudevents diff ./want.yaml ./got.yaml --match type --ignore-additions
> ```
>
> This validates that at least one event of type `com.example.someevent` is present in the `got.yaml` file.
>
> ## Advanced Usage
>
> If you would like to produce a pre-produced event yaml file, you can use
> `listen` to collect requests. This works with both running event producers that
> can be directed at the `listen` port or directly with `send`.

Test-corpus versioning is by directory: `-f ./yaml/v0.3` (fixture folders named for the
spec version they target). The event fixture schema is the four-key YAML shape
`Mode` / `ContextAttributes` (incl. `Extensions`) / `TransportExtensions` / `Data`.

### 2.2 CloudEvents SDK requirements + feature-support matrix

- Source: <https://raw.githubusercontent.com/cloudevents/spec/main/cloudevents/SDK.md>
- Fetched: 2026-08-20 (HTTP 200)

> # CloudEvents SDK Requirements
>
> The intent of this document to describe a minimum set of requirements for new
> Software Development Kits (SDKs) for CloudEvents. […] As part of
> community efforts CloudEvents team committed to support and maintain the
> following SDKs:
>
> - [C#/.NET SDK](https://github.com/cloudevents/sdk-csharp)
> - [Go SDK](https://github.com/cloudevents/sdk-go)
> - [Java SDK](https://github.com/cloudevents/sdk-java)
> - [JavaScript SDK](https://github.com/cloudevents/sdk-javascript)
> - [Kotlin SDK](https://github.com/cloudevents/sdk-kotlin)
> - [PHP SDK](https://github.com/cloudevents/sdk-php)
> - [PowerShell SDK](https://github.com/cloudevents/sdk-powershell)
> - [Python SDK](https://github.com/cloudevents/sdk-python)
> - [Ruby SDK](https://github.com/cloudevents/sdk-ruby)
> - [Rust SDK](https://github.com/cloudevents/sdk-rust)
>
> The SDKs are community driven activities and are (somewhat) distinct from the
> CloudEvents specification itself. In other words, while ideally the SDKs are
> expected to keep up with changes to the specification, it is not a hard
> requirement that they do so. It will be continguent on the specific SDK's
> maintainers to find the time.

Version-support policy (the versioning axis of the matrix):

> ## Contribution Acceptance
>
> […] the CloudEvents community would like to ensure that:
>
> - Each SDK has active points of contact.
> - Each SDK supports the latest(N), and N-1, major releases of the
>   [CloudEvent spec](spec.md)\*.
> - Within the scope of a major release, only support for the latest minor
>   version is needed.
>
> Support for release candidates is not required, but strongly encouraged.
>
> \* Note: v1.0 is a special case and it is recommended that as long as v1.0
>   is the latest version, SDKs should also support v0.3.

Normative SDK requirements:

> ## Technical Requirements
>
> Each SDK MUST meet these requirements:
>
> - Supports CloudEvents at spec milestones and ongoing development version.
>   - Encode a canonical Event into a transport specific encoded message.
>   - Decode transport specific encoded messages into a Canonical Event.
> - Idiomatic usage of the programming language.
>   - Using current language version(s).
> - Supports HTTP transport renderings in both `structured` and `binary`
>   content mode.

> #### Encode/Decode an Event
>
> Each SDK MUST support encoding and decoding an Event with regards to a transport
> and encoding:
>
> - Each SDK MUST support structured-mode messages for each transport that it
>   supports.
> - Each SDK SHOULD support binary-mode messages for each transport that it
>   supports.
> - Each SDK SHOULD support batch-mode messages for each transport that it
>   supports (where the event format and transport combination supports batch mode).
> - Each SDK SHOULD indicate which modes it supports for each supported event
>   format, both in the [table below](#feature-support) and in any SDK-specific
>   documentation provided.
>
> Note that when decoding an event, media types MUST be matched
> case-insensitively, as specified in [RFC 2045] (https://tools.ietf.org/html/rfc2045).

**The capability matrix itself** (self-declared, maintained in-repo as a Markdown table):

> ## Feature Support
>
> Each SDK must update the following "support table" periodically to ensure
> they accurately the status of each SDK's support for the stated features.

Table shape (verbatim header + row taxonomy; cell values are
`:heavy_check_mark:` / `:x:` / blank):

```
| Feature | C# | Go | Java | Kotlin | JS | PHP | PS | Python | Ruby | Rust |
| **[v1.0]** |
| [CloudEvents Core]  | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Event Formats |
| [Avro]              | ✔ |   | ✘ |   | ✘ |   |   |   | ✘ | ✘ |
| [Avro Compact]      | ✔ |   | ✘ |   | ✘ |   |   |   |   | ✘ |
| [JSON]              | ✔ |   | ✔ |   | ✔ |   |   | ✔ | ✔ | ✔ |
| [Protobuf]          | ✔ |   | ✔ |   | ✘ |   |   |   | ✘ | ✘ |
| Bindings / Content Modes |
| [AMQP Binary]       | ✔ |   | ✔ |   | ✘ |   |   |   | ✘ | ✘ |
| [AMQP Structured]   | ✔ |   | ✔ |   | ✘ |   |   |   | ✘ | ✘ |
| [HTTP Binary]       | ✔ |   | ✔ |   | ✔ |   |   | ✔ | ✔ | ✔ |
| [HTTP Structured]   | ✔ |   | ✔ |   | ✔ |   |   | ✔ | ✔ | ✔ |
| [HTTP Batch]        | ✔ |   | ✘ |   | ✘ |   |   |   | ✔ | ✔ |
| [Kafka Binary]      | ✔ |   | ✔ |   | ✔ |   |   | ✔ | ✘ | ✔ |
| [Kafka Structured]  | ✔ |   | ✔ |   | ✔ |   |   | ✔ | ✘ | ✔ |
| [MQTT v5 Binary]    | ✘ |   | ✘ |   | ✔ |   |   |   | ✘ | ✘ |
| [MQTT Structured]   | ✔ |   | ✘ |   | ✔ |   |   |   | ✘ | ✘ |
| [NATS Binary]       | ✘ |   | ✘ |   | ✘ |   |   |   | ✘ | ✔ |
| [NATS Structured]   | ✘ |   | ✘ |   | ✘ |   |   |   | ✘ | ✔ |
| [WebSockets Binary] | ✘ |   | ✘ |   | ✔ |   |   |   | ✘ | ✘ |
| [WebSockets Structured] | ✘ | | ✘ |   | ✔ |   |   |   | ✘ | ✘ |
| Proprietary Bindings |
| [RocketMQ]          | ✘ |   | ✔ |   | ✘ |   |   |   | ✘ | ✘ |
| [RabbitMQ]          | ✘ |   |   |   |   |   |   |   |   |   |
|                     |
| **[v0.3]** |
| [CloudEvents Core]  | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ | ✔ | ✔ | ✔ |
| … (same Event Formats / Bindings row taxonomy repeated for v0.3) |
```

Each feature row links to the exact spec document/anchor that defines it (e.g.
`bindings/http-protocol-binding.md#31-binary-content-mode`) — the matrix row identity *is* a
spec section reference, and the whole table is duplicated per spec version (v1.0 block, v0.3
block).

### 2.3 CloudEvents core spec — conformance vocabulary

- Source: <https://raw.githubusercontent.com/cloudevents/spec/main/cloudevents/spec.md>
- Fetched: 2026-08-20

Protocol-relevant lines (grep excerpts, line numbers from the raw file):

```
35: implementations MUST support the [JSON format](formats/json-format.md).
48: For clarity, when a feature is marked as "OPTIONAL" this means that it is
49: OPTIONAL for both the [Producer](#producer) and [Consumer](#consumer) of a
57: [Intermediary](#intermediary) SHOULD forward OPTIONAL attributes.
127: Each Event Format MUST define a structured-mode representation, and MAY define
175: Every CloudEvent conforming to this specification MUST include context
176: attributes designated as REQUIRED, MAY include one or more OPTIONAL context
214: string-encoding for each type that MUST be supported by all implementations.
340: producers MUST use a value of `1.0` when referring to this version of the
```

---

## 3. WebSocket — Autobahn|Testsuite (report-per-implementation model)

### 3.1 Repository README

- Source: <https://raw.githubusercontent.com/crossbario/autobahn-testsuite/master/README.md>
- Fetched: 2026-08-20 (raw, 364 lines)

> # Autobahn|Testsuite
>
> WebSocket protocol implementation conformance test suite.
>
> The **Autobahn**|Testsuite provides a fully automated test suite to verify client and server
> implementations of [The WebSocket Protocol](http://tools.ietf.org/html/rfc6455) for
> specification conformance and implementation robustness.

Published per-implementation reports (the public artifact):

> ## Reports
>
> For some current reports on the test coverage of [Autobahn|Python] see
>
> * [WebSocket client functionality](https://crossbar.io/autobahn/testsuite/reports/clients/index.html)
> * [WebSocket server functionality](https://crossbar.io/autobahn/testsuite/reports/servers/index.html)

Case categories:

> ## Test Suite Coverage
>
> The test suite will check an implementation by doing basic WebSocket
> conversations, extensive protocol compliance verification and performance
> and limits testing.
>
> **Autobahn**|Testsuite is used across the industry and contains over 500 test cases covering
>
> * Framing
> * Pings/Pongs
> * Reserved Bits
> * Opcodes
> * Fragmentation
> * UTF-8 Handling
> * Limits/Performance
> * Closing Handshake
> * Opening Handshake (under development)
> * WebSocket compression ([permessage-deflate extension](https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression))

Frozen-reference-testbed policy (versioning of the suite itself):

> 🧊 Legacy Compatibility Note
>
> The Autobahn|Testsuite Docker image is frozen intentionally on
> pypy:2-7-bullseye (PyPy 7.3.11 / Python 2.7.18 / OpenSSL 1.1.1w).
> This combination is the last working environment for the original
> WebSocket conformance suite before the Python 3 transition.
>
> Newer base images (e.g. Debian bookworm, OpenSSL 3.x) are incompatible
> with the pinned PyPy2-era cryptography and Twisted dependencies.
>
> **Purpose: preserve a stable, reproducible reference testbed
> against which WebSocket implementations can validate conformance
> — even as the main Autobahn project evolves.**

Runner + config (optional-feature opt-out lives in the spec file):

> ```console
> docker run -it --rm \
>     -v "${PWD}/config:/config" \
>     -v "${PWD}/reports:/reports" \
>     -p 9001:9001 \
>     --name fuzzingserver \
>     crossbario/autobahn-testsuite:25.10.1
> ```
>
> ```json
> {
>     "url": "ws://127.0.0.1:9001",
>     "outdir": "./reports/clients",
>     "cases": ["*"],
>     "exclude-cases": [
>         "9.*",
>         "12.*",
>         "13.*"
>     ],
>     "exclude-agent-cases": {}
> }
> ```
>
> > This specific config will run all test cases, but exclude the longer running mass/performance
> > test cases 9.*, and exclude the WebSocket compression test cases 12.*/13.* (which only make
> > sense if your client library implements [RFC7692 ("permessage-deflate")]).

Aggregating multiple implementations into one report:

> > To test multiple clients and generate one big report containing all clients, do NOT stop the
> > testsuite container, but run all your clients, and then stop the container. The generated
> > reports will include all clients.

`wstest` modes (the client/server-pair inversion):

> ```
>   -m, --mode=            Test mode, one of: echoserver, echoclient,
>                          broadcastclient, broadcastserver, fuzzingserver,
>                          fuzzingclient, testeeserver, testeeclient, massconnect,
>                          serializer [required]
>   -t, --testset=         Run a test set from an import test spec.
>   -s, --spec=            Test specification file [required in some modes].
>   -w, --wsuri=           WebSocket URI [required in some modes].
>   -i, --ident=           Testee client identifier [optional for client testees].
> ```

Testing a server (fuzzing client mode) — case count is printed per run:

> ```console
> (wstest)oberstet@thinkpad-t430s:~/test$ wstest -m fuzzingclient
> Auto-generating spec file 'fuzzingclient.json'
> Loading spec from /home/oberstet/test/fuzzingclient.json
> ...
> Autobahn Fuzzing WebSocket Client (Autobahn Version 0.7.4 / Autobahn Testsuite Version 0.10.9)
> Ok, will run 521 test cases against 1 servers
> ...
> ```

### 3.2 Docker README (same config contract)

- Source: <https://raw.githubusercontent.com/crossbario/autobahn-testsuite/master/docker/README.md>
- Fetched: 2026-08-20 (raw, 56 lines)

Restates the `fuzzingserver.json` shape (`url`, `outdir`, `cases`, `exclude-cases`,
`exclude-agent-cases`) and the "do NOT stop the container between clients to get one big report"
aggregation rule, verbatim as above.

### 3.3 Result vocabulary — `autobahntestsuite/case/case.py`

- Source: <https://raw.githubusercontent.com/crossbario/autobahn-testsuite/master/autobahntestsuite/autobahntestsuite/case/case.py>
- Fetched: 2026-08-20

```python
class Case:

   FAILED = "FAILED"
   OK = "OK"
   NON_STRICT = "NON-STRICT"
   WRONG_CODE = "WRONG CODE"
   UNCLEAN = "UNCLEAN"
   FAILED_BY_CLIENT = "FAILED BY CLIENT"
   INFORMATIONAL = "INFORMATIONAL"
   UNIMPLEMENTED = "UNIMPLEMENTED"

   # to remove
   NO_CLOSE = "NO_CLOSE"

   SUBCASES = []

   def __init__(self, protocol):
      self.p = protocol
      self.received = []
      self.expected = {}
      self.expectedClose = {}
      self.behavior = Case.FAILED
      self.behaviorClose = Case.FAILED
      self.result = "Actual events differ from any expected."
      self.resultClose = "TCP connection was dropped without close handshake"
      self.reportTime = False
      self.reportCompressionRatio = False
      self.suppressClose = False # suppresses automatic close behavior (used in cases that deliberately send bad close behavior)

      ## defaults for permessage-deflate - will be overridden in
      ## permessage-deflate test cases (but only for those)
      ##
      self.perMessageDeflate = False
      self.perMessageDeflateOffers = []
      self.perMessageDeflateAccept = lambda connectionRequest, ...: None
```

Note there are **two** independent verdicts per case: `behavior` (the protocol exchange) and
`behaviorClose` (the closing handshake).

### 3.4 Case identity/versioning — `caseset.py` and a concrete case

- Source: <https://raw.githubusercontent.com/crossbario/autobahn-testsuite/master/autobahntestsuite/autobahntestsuite/caseset.py>
- Fetched: 2026-08-20

Case IDs are dotted integer tuples derived from the class name; the API surface:

```
def __init__(self, CaseSetName, CaseBaseName, Cases, CaseCategories, CaseSubCategories)
def caseClasstoId(self, klass)
def caseClasstoIdTuple(self, klass)
def caseIdtoIdTuple(self, id)          # return tuple([int(x) for x in id.split('.')])
def caseIdTupletoId(self, idt)         # return '.'.join([str(x) for x in list(idt)])
def caseClassToPrettyDescription(self, klass)
def resolveCasePatternList(self, patterns)
def parseSpecCases(self, spec)
def parseExcludeAgentCases(self, spec)
def checkAgentCaseExclude(self, patterns, agent, case)
def getCasesByAgent(self, spec)
def generateCasesByTestee(self, spec)
```

`checkAgentCaseExclude(patterns, agent, case)` is the per-implementation exclusion hook backing
`exclude-agent-cases` in the JSON spec.

- Source: <https://raw.githubusercontent.com/crossbario/autobahn-testsuite/master/autobahntestsuite/autobahntestsuite/case/case1_1_1.py>
- Fetched: 2026-08-20

A case is a class named `Case1_1_1` → id `1.1.1`, carrying a `DESCRIPTION` and an `EXPECTATION`
string plus the expectation-machine wiring:

```python
class Case1_1_1(Case):

   DESCRIPTION = """Send text message with payload 0."""

   EXPECTATION = """Receive echo'ed text message (with empty payload). Clean close with normal code."""

   def onOpen(self):
      payload = ""
      self.expected[Case.OK] = [("message", payload, False)]
      self.expectedClose = {"closedByMe":True,"closeCode":[self.p.CLOSE_STATUS_CODE_NORMAL],"requireClean":True}
      self.p.sendFrame(opcode = 1, payload = payload)
      self.p.killAfter(1)
```

`self.expected` is keyed by *behavior verdict* — i.e. a case may declare distinct expected event
sequences that map to `OK` vs `NON-STRICT` etc.

### 3.5 Report generation — `fuzzing.py`

- Source: <https://raw.githubusercontent.com/crossbario/autobahn-testsuite/master/autobahntestsuite/autobahntestsuite/fuzzing.py>
- Fetched: 2026-08-20

Relevant lines (line numbers from raw file):

```
129:                       "agent": self.caseAgent,
288:            print "Skipping test case %s for agent %s by test configuration!" % (cc_id, self.caseAgent)
430:      agent = caseResults["agent"]
433:      ## index by agent->case
437:      self.agents[agent][case] = caseResults
439:      ## index by case->agent
443:      self.cases[case][agent] = caseResults
456:   def createReports(self, produceHtml = True, produceJson = True):
478:               self.createAgentCaseReportHTML(agentId, caseId, self.outdir)
480:               self.createAgentCaseReportJSON(agentId, caseId, self.outdir)
493:   def makeAgentCaseReportFilename(self, agentId, caseId, ext):
495:      Create filename for case detail report from agent and case.
498:      return self.cleanForFilename(agentId) + "_case_" + c + "." + ext
532:      report_filename = "index.json"
549:      report_filename = "index.html"
608:      ## write big agent/case report table
610:      f.write('      <table id="agent_case_results">\n')
612:      ## sorted list of agents for which test cases where run
614:      agentList = sorted(self.agents.keys())
643:               f.write('  <td class="agent close_flex" colspan="2">%s</td>\n' % agentId)
652:            f.write('  <td class="case_subcategory" colspan="%d">%s %s</td>\n' % (len(agentList) * 2 + 1, caseSubCategoryIndex, caseSubCategory))
658:         f.write('  <tr class="agent_case_result_row">\n')
718:  […] '<td class="%s"><a href="%s">%s</a><br/><span class="case_duration">%s</span></td><td class="close close_hide %s"><span class="close_code">%s</span></td>'
735:      f.write('      <div id="test_case_descriptions">\n')
758:   def createAgentCaseReportJSON(self, agentId, caseId, outdir)
```

Summary of the artifact layout as encoded in the code: results are double-indexed
(`agent -> case` and `case -> agent`); per-(agent, case) detail files are written as
`<cleaned-agent-id>_case_<case-id>.html` and `.json`; the roll-up is `index.html` +
`index.json`; the HTML roll-up is literally a table `id="agent_case_results"` with agents as
columns (two `<td>` per agent — behavior and close-behavior) and case rows grouped by
`case_subcategory`, followed by a `test_case_descriptions` block.

**Implementation identity ("agent")** comes from the testee: `wstest -i/--ident=` for client
testees, otherwise the peer's advertised agent string — that is the matrix column key.

---

## 4. MQTT — Eclipse Paho testing utilities

- Source: <https://raw.githubusercontent.com/eclipse-paho/paho.mqtt.testing/master/README.md>
- Fetched: 2026-08-20

> # Eclipse Paho Testing Utilities
>
> The Paho Testing Utilities are a collection of code and tools to help test MQTT clients and Brokers.
>
> All the features are currently in the interoperability directory.  The components, or capabilities include:
>
> - a Python MQTT broker which implements versions 3.1.1 and 5.0 (plus the start of MQTT-SN support)
> - a simple Python MQTT client, also supporting versions 3.1.1 and 5.0, used for simple general test suites
> - an MQTT network proxy, which can forward traffic to and from a broker, and display the MQTT packet info
> - Python modules to de/serialize MQTT packets for MQTT 3.1.1 and 5.0
> - an MQTT load/connection loss test, designed to investigate the reconnection logic for QoS 1 and 2 flows
>
> Check the readme in the interoperability directory for details.
>
> ## Links
> - Project Website: https://www.eclipse.org/paho
> - Paho Testing Page: https://www.eclipse.org/paho/clients/testing/
> - GitHub: https://github.com/eclipse/paho.mqtt.testing

- Source: <https://raw.githubusercontent.com/eclipse-paho/paho.mqtt.testing/master/interoperability/README.md>
  (fetched 2026-08-20 via summarizing fetch — the following is a paraphrase of that page, not a
  verbatim quote; treat as lower-fidelity than the blocks above)

Organization is **per protocol version**, one test script each:
`client_test5.py` for MQTT v5 and `client_test.py` for MQTT 3.1.1; the whole suite or a single
case is run as `python3 client_test5.py Test.test_name` (i.e. cases are Python unittest method
names, and case selection is by fully-qualified method path). A reference broker is started with
`python3 startbroker.py`, optionally with a Mosquitto-style `.conf` file for listener ports, TLS
certificates, and auth. Implementation is split into sub-packages `mqtt/formats/MQTTV5`,
`mqtt/clients/V5`, `mqtt/brokers/V5`. Unimplemented capabilities are tracked as GitHub issues in
the repo rather than as declarations in the suite. The page does not describe a report format
beyond unittest output.

---

## 5. LSP — evidence of the missing official conformance suite, and community substitutes

### 5.1 The standing question

- Source: <https://github.com/microsoft/language-server-protocol/issues/353>
- Fetched: 2026-08-20 (issue page fetched; **comment thread was not retrievable** — see
  `failed_urls`/notes)

Retrieved verbatim from the page:

> **Title:** "Is there standard suite of tests to test a new language server against?"
>
> **Dec 13, 2017 — Eddie Ash:** "I want to create a new language server in perl. I was wondering if
> there is a standard suite of tests that I can run on my language server to make sure that I
> implemented it properly?"

Page metadata observed: status **Closed**, no assignees, no labels. The comment bodies were not
present in the fetched HTML, and the GitHub API path was blocked for this session (see notes), so
**no maintainer answer is quoted here**. The issue's continued citation as the canonical
"does an LSP conformance suite exist?" reference is itself the evidence collected.

Related issues surfaced by search (titles only, not fetched):
- `Support for tests · Issue #1267 · microsoft/language-server-protocol`
- `Execute tests via lang server · Issue #313 · microsoft/language-server-protocol`
- `microsoft/language-server-protocol-inspector` — "Interactive Language Server log inspector"

Search-engine characterization (2026-08-20, WebSearch; secondhand, not a primary quote):

> "The search results show that while individual LSP implementations aim for conformance with the
> protocol specification, there doesn't appear to be an official, centralized test suite provided by
> the Language Server Protocol maintainers. Instead, developers are expected to build their own test
> suites covering specific functionalities, with two common approaches being unit testing and
> integration testing."

### 5.2 Community substitute: `swyddfa/lsp-devtools` (incl. `pytest-lsp`)

- Source: <https://raw.githubusercontent.com/swyddfa/lsp-devtools/develop/README.md>
- Fetched: 2026-08-20

> <h1 align="center">LSP Devtools</h1>
>
> This repo is an attempt at building the developer tooling I wished existed when I first started
> working on [Esbonio](https://github.com/swyddfa/esbonio/).
>
> This is a monorepo containing a number of sub-projects.
>
> ## `lib/lsp-devtools` - A grab bag of development utilities
>
> A collection of cli utilities aimed at aiding the development of language servers and/or clients.
>
> - `agent`: Used to wrap an lsp server allowing messages sent between it and the client to be intercepted and inspected by other tools.
> - `record`: Connects to an agent and record traffic to file, sqlite db or console. Supports filtering and formatting the output
> - `inspect`: A browser devtools inspired TUI to visualise and inspecting LSP traffic. Powered by [textual](https://textual.textualize.io/)
> - `client`: **Experimental** A TUI language client with built in `inspect` panel. Powered by [textual](https://textual.textualize.io/)
>
> ## `lib/pytest-lsp` - End-to-end testing of language servers with pytest
>
> `pytest-lsp` is a pytest plugin for writing end-to-end tests for language servers.
>
> It works by running the language server in a subprocess and communicating with it over stdio, just
> like a real language client.
> This also means `pytest-lsp` can be used to test language servers written in any language - not
> just Python.
>
> `pytest-lsp` relies on the [`pygls`](https://github.com/openlawlibrary/pygls) library for its
> language server protocol implementation.
>
> ```python
> import pytest_lsp
> from lsprotocol import types
> from pytest_lsp import ClientServerConfig, LanguageClient, client_capabilities
>
> @pytest_lsp.fixture(
>     scope="module",
>     config=ClientServerConfig(server_command=[sys.executable, "-m", "esbonio"]),
> )
> async def client(lsp_client: LanguageClient):
>     # Setup
>     response = await lsp_client.initialize_session(
>         types.InitializeParams(
>             capabilities=client_capabilities("visual-studio-code"),
>             workspace_folders=[
>                 types.WorkspaceFolder(
>                     uri="file:///path/to/test/project/root/", name="project"
>                 ),
> […]
> ```

Note the `client_capabilities("visual-studio-code")` helper: the substitute suite parameterizes
tests by a **named real-client capability profile** rather than by a standardized case id.

Other community artifacts surfaced by search (not fetched): `pytest-language-server` (PyPI /
lib.rs), `lsp-testing` (sr.ht `~wahn/lsp-testing`), `go.lsp.dev/protocol`,
`OmniSharp/csharp-language-server-protocol`.

---

## Collection notes / gaps

- The gRPC `test.proto` itself and `PROTOCOL-HTTP2.md` were referenced but not fetched.
- Autobahn's full 500+ case index was not enumerated case-by-case; the identity scheme
  (`CaseX_Y_Z` → `"X.Y.Z"`, with `"9.*"`, `"12.*"`, `"13.*"` as the performance/compression
  categories) is captured from `caseset.py`, `case1_1_1.py`, and the config docs.
- The rendered Autobahn public report (`crossbar.io/.../reports/servers/index.html`) was
  **not reachable** from this environment (DNS failure); the report structure above is instead
  reconstructed verbatim from the generator source `fuzzing.py`.
- LSP issue #353 comment bodies could not be retrieved (GitHub API access is scoped to
  `rickylabs/netscript` in this session, and the rendered issue page did not include the thread).
  Only the title and the opening question are quoted.
- `paho.mqtt.testing/interoperability/README.md` was read through a summarizing fetch, so its
  entry is explicitly marked as paraphrase, not verbatim.
- AMQP: no dedicated conformance suite source was fetched in this pass; the only AMQP evidence
  collected is the CloudEvents AMQP-binding rows in the SDK feature-support matrix (§2.2).

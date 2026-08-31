# lifecycle-standards raw extracts — part 2 (CloudEvents v1.0.2, W3C trace-context, OpenTelemetry env/OTLP)

Aggregator note: faithful extracts only. No analysis, no recommendations.

---

## Source 3 — CloudEvents Spec v1.0.2 (core)

- URL fetched: https://raw.githubusercontent.com/cloudevents/spec/v1.0.2/cloudevents/spec.md
  (canonical: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md)
- Also fetched for comparison: `main` branch copy, self-titled
  "CloudEvents - Version 1.0.3-wip" —
  https://raw.githubusercontent.com/cloudevents/spec/main/cloudevents/spec.md
  (unreleased WIP; the v1.0.2 released text is used below).
- Fetch date: 2026-08-20

### Attribute naming constraints

> CloudEvents attribute names MUST consist of lower-case letters ('a' to 'z') or
> digits ('0' to '9') from the ASCII character set. Attribute names SHOULD be
> descriptive and terse and SHOULD NOT exceed 20 characters in length.

Every CloudEvent MUST include all REQUIRED context attributes, MAY include
OPTIONAL context attributes, and MAY include extension context attributes. "Each
context attribute MUST only appear at most once in a CloudEvent."

### Abstract type system (canonical string encodings)

- `Boolean` — case-sensitive `true` / `false`.
- `Integer` — whole number in −2,147,483,648 … +2,147,483,647 (signed 32-bit
  two's complement). String encoding: integer component of a JSON Number
  (RFC 7159 §6), optionally prefixed with a minus sign.
- `String` — sequence of allowable Unicode characters. Disallowed: control
  characters U+0000–U+001F and U+007F–U+009F inclusive; Unicode noncharacters;
  surrogate code points U+D800–U+DBFF and U+DC00–U+DFFF unless properly paired.
- `Binary` — sequence of bytes. String encoding: Base64 (RFC 4648).
- `URI` — absolute URI (RFC 3986 §4.3).
- `URI-reference` — URI-reference (RFC 3986 §4.1).
- `Timestamp` — RFC 3339.

> All context attribute values MUST be of one of the types listed above.
> Attribute values MAY be presented as native types or canonical strings.

### REQUIRED attributes

**`id`** — Type `String`.
> Identifies the event. Producers MUST ensure that `source` + `id` is unique for
> each distinct event. If a duplicate event is re-sent (e.g. due to a network
> error) it MAY have the same `id`. Consumers MAY assume that Events with
> identical `source` and `id` are duplicates.
Constraints: REQUIRED; MUST be a non-empty string; MUST be unique within the
scope of the producer. Examples: producer-maintained counter, a UUID.

**`source`** — Type `URI-reference`.
> Identifies the context in which an event happened. Often this will include
> information such as the type of the event source, the organization publishing
> the event or the process that produced the event. The exact syntax and
> semantics behind the data encoded in the URI is defined by the event producer.
Constraints: REQUIRED; MUST be a non-empty URI-reference; an absolute URI is
RECOMMENDED. Examples: `https://github.com/cloudevents`,
`urn:uuid:6e8bc430-9c3a-11d9-9669-0800200c9a66`, `/cloudevents/spec/pull/123`,
`/sensors/tn-1234567/alerts`.

**`specversion`** — Type `String`.
> The version of the CloudEvents specification which the event uses. … Compliant
> event producers MUST use a value of `1.0` when referring to this version of the
> specification.
Only 'major' and 'minor' numbers appear; patch changes do not change the value.
Constraints: REQUIRED; MUST be a non-empty string.

**`type`** — Type `String`.
> This attribute contains a value describing the type of event related to the
> originating occurrence. Often this attribute is used for routing,
> observability, policy enforcement, etc. The format of this is producer defined…
Constraints: REQUIRED; MUST be a non-empty string; SHOULD be prefixed with a
reverse-DNS name. Examples: `com.github.pull_request.opened`,
`com.example.object.deleted.v2`.

### OPTIONAL attributes

**`datacontenttype`** — Type `String` per RFC 2046.
> Content type of `data` value. This attribute enables `data` to carry any type
> of content, whereby format and encoding might differ from that of the chosen
> event format.
> In some event formats the `datacontenttype` attribute MAY be omitted. For
> example, if a JSON format event has no `datacontenttype` attribute, then it is
> implied that the `data` is a JSON value conforming to the "application/json"
> media type. In other words: a JSON-format event with no `datacontenttype` is
> exactly equivalent to one with `datacontenttype="application/json"`.
Constraints: OPTIONAL; if present MUST adhere to RFC 2046.

**`dataschema`** — Type `URI`.
> Identifies the schema that `data` adheres to. Incompatible changes to the
> schema SHOULD be reflected by a different URI.
Constraints: OPTIONAL; if present MUST be a non-empty URI.

**`subject`** — Type `String`.
> This describes the subject of the event in the context of the event producer
> (identified by `source`). … Identifying the subject of the event in context
> metadata (opposed to only in the `data` payload) is particularly helpful in
> generic subscription filtering scenarios where middleware is unable to
> interpret the `data` content.
Constraints: OPTIONAL; if present MUST be a non-empty string. Example:
`source`: `https://example.com/storage/tenant/container`, `subject`:
`mynewfile.jpg`.

**`time`** — Type `Timestamp`.
> Timestamp of when the occurrence happened. If the time of the occurrence
> cannot be determined then this attribute MAY be set to some other time (such as
> the current time) by the CloudEvents producer, however all producers for the
> same `source` MUST be consistent in this respect.
Constraints: OPTIONAL; if present MUST adhere to RFC 3339.

### Extension context attributes

> A CloudEvent MAY include any number of additional context attributes with
> distinct names, known as "extension attributes". Extension attributes MUST
> follow the same naming convention and use the same type system as standard
> attributes. Extension attributes have no defined meaning in this specification,
> they allow external systems to attach metadata to an event, much like HTTP
> custom headers.

> The definition of an extension SHOULD fully define all aspects of the
> attribute - e.g. its name, type, semantic meaning and possible values.

### Message / format vocabulary (terminology section)

- **Event Format** — "specifies how to serialize a CloudEvent as a sequence of
  bytes." "Each Event Format MUST define a structured-mode representation, and
  MAY define a batch-mode representation." "All implementations MUST support the
  JSON format."
- **structured-mode message** — "one where the entire event (attributes and
  data) are encoded in the message body, according to a specific event format."
- **binary-mode message** — "one where the event data is stored in the message
  body, and event attributes are stored as part of message metadata."
- **batch-mode message** — "one where multiple (zero or more) events are encoded
  in a single message body… The only restriction is that all CloudEvents within
  the same batch MUST have the same value for the `specversion` attribute."
- **Protocol Binding** — "describes how events are sent and received over a given
  protocol."

---

## Source 4 — CloudEvents JSON Event Format v1.0.2

- URL fetched: https://raw.githubusercontent.com/cloudevents/spec/v1.0.2/cloudevents/formats/json-format.md
- Fetch date: 2026-08-20

### Type system mapping (§2.2)

| CloudEvents | JSON |
|---|---|
| Boolean | boolean |
| Integer | number, only the integer component optionally prefixed with a minus sign is permitted |
| String | string |
| Binary | string, Base64-encoded binary |
| URI | string following RFC 3986 |
| URI-reference | string following RFC 3986 |
| Timestamp | string following RFC 3339 (ISO 8601) |

> Unset attributes MAY be encoded to the JSON value of `null`. When decoding
> attributes and a `null` value is encountered, it MUST be treated as the
> equivalent of unset or omitted.

> extensions are placed as top-level JSON properties. Extensions MUST be
> serialized as a top-level JSON property.

### Envelope (§3)

> Each CloudEvents event can be wholly represented as a JSON object.
> Such a representation MUST use the media type `application/cloudevents+json`.
> All REQUIRED and all not omitted OPTIONAL attributes in the given event MUST
> become members of the JSON object, with the respective JSON object member name
> matching the attribute name…
> OPTIONAL not omitted attributes MAY be represeted as a `null` JSON value.

### Handling of `data` (§3.1)

Serialization rules:
- If the runtime data type is `Binary`: the value MUST be a JSON string
  containing the Base64-encoded binary value, stored under member name
  **`data_base64`**. "If present, the `datacontenttype` MUST reflect the format
  of the original binary data."
- Otherwise, JSON-formatted content is defined as a `datacontenttype` whose
  media subtype equals `json` or ends with `+json` — i.e. of the form `*/json`
  or `*/*+json` after stripping parameters. "If the `datacontenttype` is
  unspecified, processing SHOULD proceed as if the `datacontenttype` had been
  specified explicitly as `application/json`."
- For JSON-formatted content the serializer MUST translate the data value to a
  JSON value under member name **`data`**. "The data value MUST be stored
  directly as a JSON value, rather than as an encoded JSON document represented
  as a string."
- Otherwise the serializer MUST store a string representation of the data value,
  properly encoded per `datacontenttype`, in the `data` member.
- > Out of this follows that the presence of the `data` and `data_base64`
  > members is mutually exclusive in a JSON serialized CloudEvent.
- > the `data` member JSON value is unrestricted, and MAY contain any valid JSON
  > if the `datacontenttype` declares the data to be JSON-formatted. In
  > particular, the `data` member MAY have a value of `null`, representing an
  > explicit `null` payload as distinct from the absence of the `data` member.

Deserialization rules:
- Presence of `data_base64` indicates Base64-encoded binary; the deserializer
  MUST decode it into a binary runtime type.
- With `data` present and a JSON-declaring `datacontenttype`, `data` MUST be
  treated directly as a JSON value. "Note: if the `data` member is a string, a
  JSON deserializer MUST interpret it directly as a JSON String value; it MUST
  NOT further deserialize the string as a JSON document."
- With a non-JSON `datacontenttype`, `data` SHOULD be treated as an encoded
  content string.
- With `data` present and `datacontenttype` absent, deserializers SHOULD proceed
  as if it were `application/json`.

### Examples (verbatim from §3.2)

Binary-valued data:

```JSON
{
    "specversion" : "1.0",
    "type" : "com.example.someevent",
    "source" : "/mycontext",
    "id" : "A234-1234-1234",
    "time" : "2018-04-05T17:31:00Z",
    "comexampleextension1" : "value",
    "comexampleothervalue" : 5,
    "datacontenttype" : "application/vnd.apache.thrift.binary",
    "data_base64" : "... base64 encoded string ..."
}
```

Same event re-encoded in HTTP Binary Content Mode (shows the `ce-` header
prefix convention):

```
ce-specversion: 1.0
ce-type: com.example.someevent
ce-source: /mycontext
ce-id: A234-1234-1234
ce-time: 2018-04-05T17:31:00Z
ce-comexampleextension1: value
ce-comexampleothervalue: 5
content-type: application/vnd.apache.thrift.binary

...raw binary bytes...
```

JSON-object-valued data (note `"subject": null` and `"unsetextension": null`
usages appear in the spec examples):

```JSON
{
    "specversion" : "1.0",
    "type" : "com.example.someevent",
    "source" : "/mycontext",
    "subject": null,
    "id" : "C234-1234-1234",
    "time" : "2018-04-05T17:31:00Z",
    "comexampleextension1" : "value",
    "comexampleothervalue" : 5,
    "datacontenttype" : "application/json",
    "data" : {
        "appinfoA" : "abc",
        "appinfoB" : 123,
        "appinfoC" : true
    }
}
```

### JSON Batch Format (§4)

> In the _JSON Batch Format_ several CloudEvents are batched into a single JSON
> document. The document is a JSON array filled with CloudEvents in the JSON
> Event format.
> Although the _JSON Batch Format_ builds ontop of the _JSON Format_, it is
> considered as a separate format: a valid implementation of the _JSON Format_
> doesn't need to support it. The _JSON Batch Format_ MUST NOT be used when only
> support for the _JSON Format_ is indicated.
> The outermost JSON element is a JSON Array…
> A JSON Batch of CloudEvents MUST use the media type
> `application/cloudevents-batch+json`.

---

## Source 5 — CloudEvents Distributed Tracing extension v1.0.2

- URL fetched: https://raw.githubusercontent.com/cloudevents/spec/v1.0.2/cloudevents/extensions/distributed-tracing.md
- Fetch date: 2026-08-20

Attributes:

- **`traceparent`** — Type `String`. "Contains a version, trace ID, span ID, and
  trace options as defined in [W3C trace-context] section 3.2". Constraint:
  **REQUIRED** (within the extension).
- **`tracestate`** — Type `String`. "a comma-delimited list of key-value pairs,
  defined by section 3.3". Constraint: OPTIONAL.

Usage rules (quoted):

> The Distributed Tracing Extension is not intended to replace the protocol
> specific headers for tracing, like the ones described in W3C Trace Context for
> HTTP.
> Given a single hop event transmission (from sink to source directly), the
> Distributed Tracing Extension, if used, MUST carry the same trace information
> contained in protocol specific tracing headers.
> Given a multi hop event transmission, the Distributed Tracing Extension, if
> used, MUST carry the trace information of the starting trace of the
> transmission. In other words, it MUST NOT carry trace information of each
> individual hop…
> Middleware between the source and the sink of the event could eventually add a
> Distributed Tracing Extension if the source didn't include any…

Example (HTTP, showing extension attribute `ce-traceparent` coexisting with the
protocol-level `traceparent`):

```bash
CURL -X POST example/webhook.json \
-H 'ce-id: 1' \
-H 'ce-specversion: 1.0' \
-H 'ce-type: example' \
-H 'ce-source: http://localhost' \
-H 'ce-traceparent:  00-0af7651916cd43dd8448eb211c80319c-b9c7c989f97918e1-01' \
-H 'traceparent:  00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' \
-H 'tracestate: rojo=00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01,congo=lZWRzIHRoNhcm5hbCBwbGVhc3VyZS4'
```

---

## Source 6 — W3C Trace Context (traceparent / tracestate)

- URLs fetched:
  https://www.w3.org/TR/trace-context/ and the editor-source file
  https://raw.githubusercontent.com/w3c/trace-context/main/spec/20-http_request_header_format.md
- Fetch date: 2026-08-20

### `traceparent` header name

> Header name: `traceparent`
> The header name is ASCII case-insensitive. That is, `TRACEPARENT`,
> `TraceParent`, and `traceparent` are considered the same header. The header
> name is a single word; it does not contain any delimiters such as a hyphen.
> In order to increase interoperability across multiple protocols and encourage
> successful integration, tracing systems SHOULD encode the header name as ASCII
> lowercase.

### `traceparent` ABNF (verbatim)

```abnf
HEXDIGLC = DIGIT / "a" / "b" / "c" / "d" / "e" / "f" ; lowercase hex character
value           = version "-" version-format
```

> The dash (`-`) character is used as a delimiter between fields.

```abnf
version         = 2HEXDIGLC   ; this document assumes version 00. Version ff is forbidden
```

> Version (`version`) is an 8-bit unsigned integer value, serialized as an ASCII
> string with two characters. Version 255 (`"ff"`) is invalid. This document
> specifies version 0 (`"00"`) of the `traceparent` header.

```abnf
version-format   = trace-id "-" parent-id "-" trace-flags
trace-id         = 32HEXDIGLC  ; 16 bytes array identifier. All zeroes forbidden
parent-id        = 16HEXDIGLC  ; 8 bytes array identifier. All zeroes forbidden
trace-flags      = 2HEXDIGLC   ; 8 bit flags.
```

**trace-id**
> This is the ID of the whole trace forest and is used to uniquely identify a
> distributed trace through a system. It is represented as a 16-byte array, for
> example, `4bf92f3577b34da6a3ce929d0e0e4736`. All bytes as zero
> (`00000000000000000000000000000000`) is considered an invalid value.
> The value of `trace-id` SHOULD be globally unique. … Implementers SHOULD use a
> `trace-id` generation method which randomly (or pseudo-randomly) generates at
> least the right-most 7 bytes of the ID. If the right-most 7 bytes are randomly
> (or pseudo-randomly) generated, the corresponding random trace id flag SHOULD
> be set.
> If the `trace-id` value is invalid (for example if it contains non-allowed
> characters or all zeros), vendors MUST ignore the entire header.

**parent-id**
> This is the ID of this request as known by the caller (in some tracing systems,
> this is known as the `span-id`, where a `span` is the execution of a client
> request). It is represented as an 8-byte array, for example,
> `00f067aa0ba902b7`. All bytes as zero (`0000000000000000`) is considered an
> invalid value.
> Vendors MUST ignore the `traceparent` when the `parent-id` is invalid (for
> example, if it contains non-lowercase hex characters).

**trace-flags**
> This is an 8-bit field that controls tracing flags such as sampling, trace
> level, etc. These flags are recommendations given by the caller rather than
> strict rules to follow…
> Like other fields, `trace-flags` is hex-encoded. For example, all `8` flags set
> would be `ff` and no flags set would be `00`.
> both `01` (`00000001`) and `03` (`00000011`) represent that the trace has been
> sampled because the sampled flag (`00000001`) is set, and `03` and `02`
> (`00000010`) both represent that at least the right-most 7 bytes of the
> `trace-id` are randomly (or pseudo-randomly) generated because the random bit
> (`00000010`) is set.
> A common mistake when interpreting bit-fields is using a comparison of the
> whole number rather than interpreting a single bit.

Reference handling code from the spec:

```java
static final byte FLAG_SAMPLED = 1; // 00000001
static final byte FLAG_RANDOM = 2; // 00000010
...
boolean sampled = (traceFlags & FLAG_SAMPLED) == FLAG_SAMPLED;
boolean random = (traceFlags & FLAG_RANDOM) == FLAG_RANDOM;
```

Sampled flag description (from the TR page):
> When set, the least significant bit (right-most), denotes that the caller may
> have recorded trace data. When unset, the caller did not record trace data
> out-of-band.

Full example value: `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`.

### `tracestate` ABNF (verbatim)

> The `tracestate` field value is a `list` of `list-members` separated by commas
> (`,`). A `list-member` is a key/value pair separated by an equals sign (`=`).
> Spaces and horizontal tabs surrounding `list-member`s are ignored. There can be
> a maximum of 32 `list-member`s in a `list`. If adding an entry would cause the
> `tracestate` list to contain more than 32 `list-members` the right-most
> `list-member` should be removed from the list.

```abnf
list  = list-member 0*31( OWS "," OWS list-member )
list-member = (key "=" value) / OWS
```

```abnf
key = ( lcalpha / DIGIT ) 0*255 ( keychar )
keychar    = lcalpha / DIGIT / "_" / "-"/ "*" / "/" / "@"
lcalpha    = %x61-7A ; a-z
```

(The spec also defines a multi-tenant key form `tenant-id "@" system-id`.)

```abnf
value    = 0*255(chr) nblk-chr
nblk-chr = %x21-2B / %x2D-3C / %x3E-7E
chr      = %x20 / nblk-chr
```

i.e. values are printable ASCII 0x20–0x7E excluding comma (`,`, 0x2C) and equals
(`=`, 0x3D), and MUST NOT end in a space.

Notation note from the spec:
> This section uses the Augmented Backus-Naur Form (ABNF) notation of [RFC5234],
> including the DIGIT rule in appendix B.1 for RFC5234. It also includes the
> `OWS` rule from RFC9110 section 5.6.3.
> The `OWS` rule defines an optional whitespace character.

### Size limits and mutation rules

> Vendors SHOULD propagate at least 512 characters of a combined header. This
> length includes commas required to separate list items and optional white space
> (`OWS`) characters.
> There are systems where propagating of 512 characters of `tracestate` may be
> expensive. In this case, the maximum size of the propagated `tracestate` header
> SHOULD be documented and explained.

Truncation guidance (from the TR page):
> Entries larger than 128 characters long SHOULD be removed first. Then entries
> SHOULD be removed starting from the end.

Mutation guidance (from the TR page):
> Modified keys SHOULD be moved to the beginning (left) of the list.
Vendors "SHOULD NOT delete keys that were not generated by them."

Example `tracestate` from the spec:
`rojo=00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01,congo=lZWRzIHRoNhcm5hbCBwbGVhc3VyZS4`

---

## Source 7 — OpenTelemetry: Environment Variables as Context Propagation Carriers

- URL fetched: https://opentelemetry.io/docs/specs/otel/context/env-carriers/
- Fetch date: 2026-08-20
- Spec status on the page: **Release Candidate**

Purpose (as stated): environment variables propagate context across process
boundaries where network protocols do not apply — batch systems, CI/CD, and
command-line tools.

### Key normalization algorithm

1. Replace an empty key with a single underscore (`_`).
2. Uppercase all ASCII letters.
3. Replace non-alphanumeric characters (except underscore) with underscores.
4. Prefix with an underscore if the name would start with a digit.

Resulting pattern: `^[A-Z_][A-Z0-9_]*$`.

Worked example given: `x-b3-traceid` normalizes to `X_B3_TRACEID`.

Applying the same algorithm to the W3C trace-context propagator's header names
yields `TRACEPARENT` and `TRACESTATE`; the W3C Baggage propagator's `baggage`
yields `BAGGAGE`.

### Normative requirements (quoted)

> Language implementations MUST ensure that environment variable `Get`, `Set`,
> and `Keys` operations use normalized key names.

- Set: "MUST write values using the normalized form of the key provided by the
  propagator."
- Get: "MUST normalize the key requested by the propagator and MUST use the
  normalized key name to read from the carrier."
- Keys: "MUST return only key names that are already normalized."

> The environment variable carrier MUST be format-agnostic and MUST treat values
> as opaque strings and MUST NOT apply propagation-format-specific logic.

Propagators remain responsible for key naming, validation, parsing, and
format-specific behavior.

> Language implementations MUST NOT spawn child processes as part of environment
> variable context propagation.

---

## Source 8 — OpenTelemetry SDK environment variables

- URL fetched: https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/
- Fetch date: 2026-08-20

### General SDK configuration

| Variable | Default | Meaning |
|---|---|---|
| `OTEL_SDK_DISABLED` | `false` | "Disable the SDK for all signals" |
| `OTEL_SERVICE_NAME` | (empty) | Sets the `service.name` resource attribute; takes precedence over `OTEL_RESOURCE_ATTRIBUTES` |
| `OTEL_RESOURCE_ATTRIBUTES` | (empty) | "Key-value pairs to be used as resource attributes" |
| `OTEL_LOG_LEVEL` | `info` | "Log level used by the SDK internal logger" |
| `OTEL_PROPAGATORS` | `tracecontext,baggage` | Comma-separated propagator list |
| `OTEL_TRACES_SAMPLER` | `parentbased_always_on` | Sampler for traces |
| `OTEL_TRACES_SAMPLER_ARG` | (empty) | Sampler-specific configuration value |

Known `OTEL_PROPAGATORS` values: `tracecontext`, `baggage`, `b3`, `b3multi`,
`jaeger` (deprecated), `xray`, `ottrace` (deprecated), `none`.

Known `OTEL_TRACES_SAMPLER` values: `always_on`, `always_off`, `traceidratio`,
`parentbased_always_on`, `parentbased_always_off`, `parentbased_traceidratio`,
`parentbased_jaeger_remote`, `jaeger_remote`, `xray`.

### Batch Span Processor

| Variable | Default |
|---|---|
| `OTEL_BSP_SCHEDULE_DELAY` | 5000 ms |
| `OTEL_BSP_EXPORT_TIMEOUT` | 30000 ms |
| `OTEL_BSP_MAX_QUEUE_SIZE` | 2048 |
| `OTEL_BSP_MAX_EXPORT_BATCH_SIZE` | 512 |

### Attribute limits

| Variable | Default |
|---|---|
| `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT` | no limit |
| `OTEL_ATTRIBUTE_COUNT_LIMIT` | 128 |

### Exporter selection

| Variable | Default | Known values |
|---|---|---|
| `OTEL_TRACES_EXPORTER` | `otlp` | `otlp`, `zipkin`, `console`, `logging`, `none`, `otlp/stdout` |
| `OTEL_METRICS_EXPORTER` | `otlp` | `otlp`, `prometheus`, `console`, `logging`, `none`, `otlp/stdout` |
| `OTEL_LOGS_EXPORTER` | `otlp` | `otlp`, `console`, `logging`, `none`, `otlp/stdout` |

### Declarative configuration

| Variable | Default |
|---|---|
| `OTEL_CONFIG_FILE` | (empty) |
| `OTEL_EXPERIMENTAL_CONFIG_FILE` | (empty) |

---

## Source 9 — OpenTelemetry OTLP Exporter configuration

- URL fetched: https://opentelemetry.io/docs/specs/otel/protocol/exporter/
- Fetch date: 2026-08-20

### Endpoints

- `OTEL_EXPORTER_OTLP_ENDPOINT` — default `http://localhost:4318` for HTTP
  transports, `http://localhost:4317` for gRPC. Accepts scheme, host, port and
  path components.
- Signal-specific overrides: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`,
  `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`.

Path-append rules for HTTP: when only the base
`OTEL_EXPORTER_OTLP_ENDPOINT` is set, the SDK appends `/v1/traces`,
`/v1/metrics`, `/v1/logs` respectively. Signal-specific endpoints are used
as-is; if no path exists, `/` is added. The base URL should end with `/` for
proper concatenation.

### Protocol

- `OTEL_EXPORTER_OTLP_PROTOCOL` — default `http/protobuf`; allowed values
  `grpc`, `http/protobuf`, `http/json`.
- Signal-specific: `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`,
  `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`, `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`.

### TLS / security

- `OTEL_EXPORTER_OTLP_INSECURE` — default `false`; signal-specific
  `_TRACES_INSECURE`, `_METRICS_INSECURE`, `_LOGS_INSECURE`.
- `OTEL_EXPORTER_OTLP_CERTIFICATE` — trusted certificate for TLS verification;
  signal-specific variants exist.
- `OTEL_EXPORTER_OTLP_CLIENT_KEY` — client private key (PEM) for mTLS;
  signal-specific variants exist.
- `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE` — client certificate/chain (PEM) for
  mTLS; signal-specific variants exist.

### Other options

- `OTEL_EXPORTER_OTLP_HEADERS` — format `key1=value1,key2=value2` (W3C Baggage
  format); signal-specific `_TRACES_HEADERS`, `_METRICS_HEADERS`,
  `_LOGS_HEADERS`.
- `OTEL_EXPORTER_OTLP_TIMEOUT` — default 10s; signal-specific variants exist.
- `OTEL_EXPORTER_OTLP_COMPRESSION` — allowed values `gzip`, `none`;
  signal-specific variants exist.

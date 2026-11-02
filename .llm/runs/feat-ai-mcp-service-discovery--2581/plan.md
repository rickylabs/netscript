# Plan & Design — AI MCP discovery

Status: READY FOR PLAN REVIEW. Feature leaf, Archetype 5. Baseline 6766130.

## Locked contract

`netscript plugin ai mcp add orders --service=orders-mcp --path=/mcp` generates an app-owned
HTTP MCP configuration. `--protocol=http|https` selects the discovery endpoint (default http);
`--path` defaults to /mcp. `--auth=<ENV>` retains the existing HTTP token mechanism. Exactly one
of --service, --url or --stdio is accepted. A present-but-empty/boolean selector is invalid;
service-only options on URL/stdio are invalid. No writes on validation failure.

1. Extend the generator input as a discriminated union retaining existing URL/stdio shapes.
   The service arm carries logical service name, MCP path and protocol. Runtime output stays
   the existing core streamable-http transport. Validate names, nonempty targets and root-relative
   MCP paths before emission. Paths cannot change origin, include backslashes/control characters,
   query or fragment; invalid protocol fails. Explicit URL mode retains valid HTTP/HTTPS behavior.
2. Emit `getServiceUrl` from `@netscript/sdk/discovery`, joined with the validated MCP path using
   Web `URL`. Resolution occurs when the generated app configuration is loaded at runtime, not
   during CLI generation. Missing discovery fails with the SDK's service/key diagnostic. No
   fallback port, network probe, custom discovery implementation or service registration.
3. Declare the SDK in the existing generated AI namespace imports, pinned from existing plugin
   package metadata. No CLI init assets or release/dependency-version bump.
4. Keep registry/pool lifecycle and URL/stdio output compatible. The showcase owner wires the
   app's Aspire reference and owns authentication/server implementation. Document that prerequisite
   and the distinction from scaffold --mcp.

## Slices and proving gates

- S0: this plan/research/checkpoint and independent PLAN-EVAL. Draft PR first.
- S1: generator input/validation/runtime emission, CLI parsing, AI namespace import, README and
  AI plugin reference docs. Tests colocated with generator and a focused plugin integration file.
  Existing AI command/resource/install tests plus new no-write invalid-input and compatibility
  controls prove the change. One implementation slice, fewer than 15 source/docs files.
- S2 only if required: reviewed correction from actual gate findings, kept in the same leaf.

## Runtime and consumer proof

A real Deno HTTP MCP test server binds 127.0.0.1 port 0. Generate the config through the plugin
CLI, inject an isolated `services__<name>__http__0` environment value, load the generated module,
and use the real AI MCP client for tools/list and tools/call. Assert the selected path, prefix,
arguments and result; test optional auth and missing discovery. Stop client/server and restore
environment in finally. A generated-source check uses the consumer import map with no repository
path embedded in the artifact. This is protocol-fixture proof, not external AI/provider proof.

## Required gates

Deno 2.9.7 structured scoped check (--unstable-kv), test, lint and TS format wrappers; all AI plugin
tests and MCP core regression tests; generated consumer check and actual MCP runtime test;
quality:gate (quality + architecture); plugin export doc lint and JSR audit/publish dry-run;
docs snippets/accuracy for changed docs; four carrier generators/freshness and root check tasks.
At merge readiness run one full `scaffold.runtime --cleanup` suite in CI, plus core CI.
Independent IMPL-EVAL is mandatory before sign-off and readiness.

## Risks and mitigations

- URL path escapes discovery authority: single-root-relative validation and deliberate negatives.
- Silent option ambiguity/partial files: validate before addMcpServer writes; prove empty workspace
  and existing registry remain unchanged on failure.
- Generated import missing in consumers: explicit SDK mapping and emitted consumer typecheck.
- Import-time discovery error: deliberate server startup failure, with the original SDK diagnostic;
  CLI generation requires no running Aspire instance. Document configuration before startup.
- Global environment/test leaks: unique logical identity, bounded aborts, cleanup and restoration.
- Generator contract drift: direct emitter input validation as well as CLI validation.

## Open decisions and deferred scope

No must-resolve decisions remain. Endpoint index is fixed to SDK default0; additional indices and
dynamic rediscovery can be future extensions if a caller needs them. Existing app-owned config
remains editable. Northwind composition, server implementation, authorization policy, durable chat,
thread stores, UI/visual acceptance and external provider credentials belong to #2571, not this leaf.
No accepted product debt; no changes to sibling artifacts or core transport/discovery contracts.

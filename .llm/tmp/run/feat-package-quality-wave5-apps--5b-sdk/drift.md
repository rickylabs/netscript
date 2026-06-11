# Drift log — Sub-wave 5b: `@netscript/sdk`

## D-1 — 7 of 9 sdk private-type-refs are upstream (plugin-streams-core) (2026-06-11)

Umbrella baseline attributed "sdk 9 ptr" to the sdk. Combined doc-lint raw shows 7 of
them point at `packages/plugin-streams-core/src/{application/create-durable-stream.ts,
builders/define-stream-schema.ts}` (`StreamStateDefinition`, `StateSchema`,
`StreamProducerPort` — package-owned there, unexported), surfaced through sdk's
`./streams` facade re-export. Consequence: the fix is a **cross-package slice** in a
Wave-4 package (additive type exports only), not sdk-local work. Umbrella should note
the attribution correction.

## D-2 — Dry-run `excluded-module` ×37 (root exclude), as predicted (2026-06-11)

Root `deno.json` still excludes `packages/sdk/`; `deno publish --dry-run` reports all
package modules excluded (same artifact 5a drift D-2 predicted for sdk/fresh-ui/fresh).
Plan slice 19 lifts the exclude as the closing gate.

## D-3 — Declared `ServiceTransport` seam is unused by the client implementation (2026-06-11)

`interfaces/transport.ts` forward-declares the RFC-14 transport port, but
`client/service-client.ts` constructs `RPCLink` inline — the seam exists on paper
only. Plan D-8 wires an internal link-factory port (http adapter) without implementing
unified mode. Recorded because the umbrella carried-in caveat ("protect transport
seam") implied the seam was real; it was declared-but-dormant.

## D-4 — `deno.json` better than baseline implied (2026-06-11)

Umbrella noted "tasks missing on sdk+service"; correct, but sdk already has
description, license, and a publish block (service had none). 5b metadata slice is
tasks-only.

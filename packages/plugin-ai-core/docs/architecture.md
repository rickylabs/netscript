# plugin-ai-core architecture

**Archetype: 1 — Small Contract** (publishes only types and oRPC contract handles; no service, no
runtime state, no presentation layer).

`@netscript/plugin-ai-core` is a **contract-only** package: it defines the oRPC `/v1/ai` route
surface and its Zod IO vocabulary, and ships **zero service implementation**. It sits at the
contract layer of the AI plugin stack.

## Layering

```
@netscript/ai (engine vocabulary: Message, AgentChunk, ModelDescriptor, …)
        │  (types re-derived, never imported as services)
        ▼
@netscript/plugin-ai-core  ← THIS PACKAGE (contract + schemas only)
        │  extends BasePluginContract from @netscript/plugin/contract-base
        ▼
plugins/ai connector (P2, out of scope here) ── implements the contract
        ▼
@netscript/fresh/ai client ── generates a typed caller from `aiContract`
```

- The package imports only **types** from `@netscript/ai/contracts`; it never pulls an engine
  service. Every route schema mirrors an engine type and a compile-time drift guard
  (`z.ZodType<EngineType> = schema`) asserts the mirror cannot silently diverge.
- `aiContract` extends `BasePluginContract` and spreads `BASE_PLUGIN_CONTRACT_ROUTES` verbatim,
  inheriting the mandatory `describe` route unchanged.

## Public surface

Two entry points keep the root export budget small:

| Entry point                              | Contents                                                          |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `.` (`mod.ts`)                           | Contract handles (`aiContract`, `aiContractV1`) + route IO types. |
| `./contracts/v1` (`contracts/v1/mod.ts`) | Full surface: Zod `*Schema` validators + engine-derived types.    |

The complete symbol set exceeds 25 because the `./contracts/v1` subpath exposes every named schema a
connector wires plus the re-exported engine vocabulary; the root path stays within the ≤20-export
doctrine budget by curating to the handles and IO types a typical consumer imports.

## SSE framing (durable-CHAT)

`chat` (POST `/chat`) has an `eventIterator(chatChunkZodSchema)` output whose element type is
`ChatChunk` (= engine `AgentChunk`). Because the contract output is an async event-iterator, a
connector's `chat` handler must yield frames — a buffered single response does not type-check.
Stream errors surface in-band as the `error` chunk rather than as an oRPC error.

## Files

- `mod.ts` — root entry, `@module` JSDoc, curated re-export of `src/public/mod.ts`.
- `src/public/mod.ts` — curated root export set.
- `src/contracts/v1/ai.contract.ts` — route IO types, IO Zod schemas, the `aiContractDefinition`,
  `aiContract`, `aiContractV1`, and engine re-exports.
- `src/contracts/v1/ai.contract-schemas.ts` — named, explicitly-annotated Zod vocabulary schemas +
  engine drift guards.
- `src/contracts/v1/mod.ts` — full v1 subpath surface.

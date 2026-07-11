# Plan

## Profile

Archetype 2 (Integration): a telemetry-side adapter binds the external OTel API to the AI-owned `TelemetryPort` contract.

## Locked decisions

- Add a dedicated `@netscript/telemetry/ai` subpath; do not add any telemetry dependency to AI core.
- Accept an injected OTel `Tracer` for deterministic tests, defaulting to the global tracer.
- Forward AI chat span operations directly and translate `gen_ai.tool.call` events into short `execute_tool` spans.
- Normalize known GenAI keys through pinned semconv exported constants; preserve NetScript-owned attributes unchanged.
- Add explicit package import-map entries for AI and semantic conventions so the JSR graph contains no unmapped bare imports.

## Gates

- Scripted agent loop with in-memory OTel exporter proves chat/tool spans and real usage.
- Scoped check, lint, and format wrappers for telemetry (AI only if touched).
- Full telemetry export-map doc lint.
- Telemetry package publish dry-run (hard gate).
- Doctrine/package audit and consumer import check.

## Risks

- Tool events have no duration lifecycle; the adapter emits an instantaneous execution span and retains event attributes.
- Experimental semconv exports may move; the dependency is pinned/mapped and publish dry-run verifies the graph.

## Deferred

- Tool duration/result/error attributes require a richer AI port event lifecycle and are outside issue #497.


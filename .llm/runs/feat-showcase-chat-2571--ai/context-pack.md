# Resume

Issue #2571 app-owned AI/MCP slice; only new showcase/ai templates, showcase-ai tests and this private run are owned.
Implementation complete: 15 canonical templates plus rendered-consumer validation and 15/15 passing behavioral scenarios. Read integration.md for exact destinations, setup/configuration and remaining parent gates. The consumer uses real framework/provider ports, real durable persistence/replay, upstream MCP and a real typed HTTP RPC test, with no real model key.

Critical correction: `routerName: 'orders'` plus the SDK default apiVersion v1 reaches the generated v1.orders router. The requested literal `v1.orders` value duplicates the version in the RPC URL and fails; see drift.md and the live RPC test.

Critical setup: connected chat requires the existing auth BFF and private upstream streams prefix, server-only streams credential, persistent KV/streams storage and supported provider credential. Missing/broken auth or public streams fail closed. No-key renders connect-provider without fake responses.

Structured source/rendered check/lint/fmt, 15 scenario tests and quality:gate passed. Independent IMPL-EVAL, provider-boundary production build, real configured runtime/browser and full scaffold.runtime remain parent-owned. Do not treat this slice as merge approval.
Parent owns integration and independent review. Do not read profiles/, open PRs, push or contact others.

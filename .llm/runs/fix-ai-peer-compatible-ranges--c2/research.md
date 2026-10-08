# Research

Issue #2036 inspected live. Current main baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Keep AI provider and Fresh AI adapter resolutions peer-compatible without consumer overrides.

Design evidence: Pin the existing qualified AI core/provider family and add an all-admitted-version peer metadata plus cold Deno resolution guard; preserve provider transport and validate production bundling

Cold published 0.0.7 consumer resolves core 0.52.3, Anthropic 0.18.13 (core peer ^0.59.0) and OpenAI 0.22.8 (core peer ^0.55.0). No workspace lock or override was used. Guard against baseline declarations exits 1 for actual peer conflicts.

Pinned framework family: core 0.52.3, Anthropic 0.18.3, OpenAI 0.22.3, MCP 0.3.8 and Fresh Preact 0.14.4. Their declared core peers admit 0.52.3. Latest inventory inspected through deps:latest; unrelated upgrades excluded. Current doctrine: AI integration Keep; Fresh retains existing package debt, no API change in this slice.

Qualification update before implementation: default Deno dependency-age policy rejects newly-published core 0.65.1 and Preact 0.20.0. The cold graph for core 0.65.0 / Anthropic 0.19.5 / OpenAI 0.27.0 / MCP 0.8.0 / Preact 0.19.5 resolves one core, no unresolved modules, under the unchanged default age policy. Select that exact family; transitive ai-client 0.37.0 and openai-base 0.12.4 align. Preserve the policy; do not disable it. The independent evaluator should adjudicate this qualified candidate before source implementation. Evidence retained privately.

## Review repair research
PR #2087; reviewed baseline a7e3cc6a1ff950a085707ec47d6585413d8cda26. Owner scope: Rebuild pruned root lock from main, selectively restore the reviewed AI 0.65 graph, retain every main workspace/graph entry and MCP/Zod4 cluster; prove deps checks, frozen install and Fresh UI lock check.. Re-baseline against live origin/main and preserve both feature contracts. MCP guidance consulted; focused local implementation and owner review are authoritative for exact repair.

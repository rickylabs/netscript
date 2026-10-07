# Research

Issue #2036 inspected live. Current main baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Keep AI provider and Fresh AI adapter resolutions peer-compatible without consumer overrides.

Design evidence: Pin the existing qualified AI core/provider family and add an all-admitted-version peer metadata plus cold Deno resolution guard; preserve provider transport and validate production bundling

Cold published 0.0.7 consumer resolves core 0.52.3, Anthropic 0.18.13 (core peer ^0.59.0) and OpenAI 0.22.8 (core peer ^0.55.0). No workspace lock or override was used. Guard against baseline declarations exits 1 for actual peer conflicts.

Pinned framework family: core 0.52.3, Anthropic 0.18.3, OpenAI 0.22.3, MCP 0.3.8 and Fresh Preact 0.14.4. Their declared core peers admit 0.52.3. Latest inventory inspected through deps:latest; unrelated upgrades excluded. Current doctrine: AI integration Keep; Fresh retains existing package debt, no API change in this slice.

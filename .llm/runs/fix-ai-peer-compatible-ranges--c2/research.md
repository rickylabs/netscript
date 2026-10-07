# Research

Issue #2036 inspected live. Current main baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Keep AI provider and Fresh AI adapter resolutions peer-compatible without consumer overrides.

Design evidence: Pin the existing qualified AI core/provider family and add an all-admitted-version peer metadata plus cold Deno resolution guard; preserve provider transport and validate production bundling

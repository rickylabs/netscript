# Multi-file README examples must compile together

CI quality includes docs:readme-fences, beyond quality:gate. A README import of an application-owned module needs a matching checked fence with the first line `// packages/.../module.ts`. snippet-compiler.ts materializes each such block under the same per-README synthetic root; sibling relative imports resolve correctly. Prefer a complete real example over no-check exemptions, fixture-only shims, or a larger error ratchet.

The #2374 failure was a missing operations-core factory source. Adding that real factory fence preserves the exact imported consumer-facing path and adds coverage. gh job log reads containing ANSI require `gh api <endpoint> --allow-escape-sequences` (the flag belongs after api).

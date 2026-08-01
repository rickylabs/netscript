# Context Pack

- Objective: close #1026 by making Aspire/Deno diagnostics discoverable from `netscript agent init`.
- Baseline: `3ab64720f`; branch `fix/1026-aspire-agent-wiring`.
- Phase: Implement. Owner waived the open-model lane; Opus supervisor PLAN-EVAL `PASS` is committed at `31adeb936` with four binding conditions.
- Locked design: unconditional Aspire MCP config; optional bounded Aspire delegation behind port/adapter; shipped Aspire/Deno/help assets; symptom-indexed AGENTS block.
- User facts: Aspire 13.4.6 delegation completes in ~7s but writes no MCP config. No repository evidence contradicts this.
- Exclusions: scaffold runtime E2E, `.llm/tools` shipping, scaffold templates, `packages/mcp`.
- Binding conditions: warn when Aspire is missing despite unconditional MCP config; skip delegation when Playwright product exists; prove the AGENTS → installed route → symptom/command chain; make the #1023 overlap explicit.
- S2 implemented: Aspire/Deno/help assets, manifest/router updates, regenerated embedded hash. Focused agent tests currently pass in the working tree.
- S3 implemented and gated: unconditional Aspire MCP config; injected Deno adapter; timeout, warning, failure swallowing, and Playwright-product idempotence. Focused tests/check/lint/quality gate pass.
- S4 complete: real cold start proves the three-link discovery chain, Playwright installation, second-run skip, both MCP entries, and missing-binary warning with unconditional config. All owned/scoped gates pass; the exact broad Markdown fmt command exposes three pre-existing unrelated files.

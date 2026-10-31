# Drift

- Owner explicitly overrides evaluator matrix with Claude Opus 5.5 high effort, and exempts test-only work from CLI E2E.
- RTK absent; focused native commands used. No production scope drift.
- Highest-priority operator directive requires PR body to begin Refs issue URL and forbids closing keywords; honor it over generic delivery boilerplate. Final report uses excluded file publication handoff.

- Follow-up CI repair: quality failed in check:mcp-export-corpus because the changed public test-harness JSDoc was not regenerated into the MCP documentation corpus. Extend the declared write surface only to the canonical generated corpus. Decoded old/new rows prove identical symbol names, kinds and signatures; only the intended one-line JSDoc wording changes. No runtime implementation change.

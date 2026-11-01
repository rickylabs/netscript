# Preset and theming follow-ups — 2026-11-01

The independently reviewed change is tracked by PR #2559 and `.llm/runs/preset-theming-followups/`.

- Fix policy diagnostics at both the shared URL validator and the config-schema boundary; otherwise a generic refine still hides the real error. Preserve policy messages but redact native URL parser failures.
- A scoped CLI lint/fmt root does not override the root config's exclusions. Use an exclusion-free config and exact source-hash baseline so untouched debt is recorded while edited/new files must pass. Real wrapper fixture negatives cover the ratchet and crashes.
- The documentation carrier chain needs clean intermediate commits: source, then agent prose/assets/publish carriers, then export corpus. Do not bypass provenance guards with dirty-generation flags.
- A tooling baseline containing Aspire filenames participates in the generated Aspire inventory. Regenerate the manifest rather than exempting the new file or historical run context.
- Deno 2.9.7 needs bare imports mapped to catalog:, not literal npm:zod@catalog: source imports. The resulting root/private lock changes are workspace metadata only; preserve validated peer-ID flattening.
- Runtime tests require an available Docker/Aspire environment. Record unavailable full scaffold runtime as UNPROVEN and keep the public leak evidence to verdict/counts, leaving foreign/unknown resources alone.

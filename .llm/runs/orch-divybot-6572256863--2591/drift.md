# Drift

- RTK absent; direct read commands and structured validation wrappers used.
- Local Docker runtime unavailable. Full local reproduction is unproven, not a product pass.
- Specific operator instructions override generic assignment boilerplate: Refs #2591, draft
  review surface, no merge during the canary hold. Final report uses the file publication handoff.
- No product debt accepted.

- S2 adds tracked Aspire-referencing gate files, so its generated surface inventory must refresh.
  The allowed derived surface includes `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv`,
  regenerated exclusively through `aspire-surface-manifest.ts`; no version pin changes.

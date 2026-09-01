# Drift Log

## 2026-09-01 — generated-app discriminator

- **Significant:** the real generated HTML contains the exact
  `<!--frsh:island:ServiceShowcaseLab:1:-->` boundary, its server-rendered initial row, and the client
  boot mapping. The active investigation is client-side; loader/layer null rendering and module
  identity are no longer live branches.
- **Coverage hole, deferred:** `probe-app-reference.ts:26-61` checks SSR-visible markers only, so a
  fully non-hydrating app can pass `behavior.app-reference`. This slice records but does not fix that
  separate gate defect, per the S2 brief.
- **Process:** the latest supervisor direction supersedes the prior S2 handoff's “do not open a PR”
  note and requires a draft PR immediately after this discriminator is recorded. Evaluator
  separation and the prohibition on self-certification remain unchanged.

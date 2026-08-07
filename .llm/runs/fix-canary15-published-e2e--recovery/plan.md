# Plan

## Contract

Closes #1345 by making the existing published production E2E contract compatible with formatted scaffold output and a fresh pre-generation workspace.

## Architecture

- Archetype: 6 — CLI / Tooling.
- Overlay: none.
- Public surface: unchanged; only scaffold template consistency and E2E lifecycle/fixture behavior change.
- Doctrine focus: A14 fitness evidence, AP-18 semantic assertions, and edge-owned process execution.
- New debt: none.

## Slices

1. Add focused regressions and repair the two exact boundaries: semantic formatted-argument rewrite and a service-scoped step-3 check that leaves the documented whole-project task at step 6.
2. Run proportional static/focused gates, then canonical one-pass runtime and quickstart validation; preserve lock/leak evidence.
3. Obtain mandatory independent IMPL-EVAL PASS, reconcile PR/issue acceptance, and merge only on current-head green CI.

## Gates

- Focused unit tests for the changed fixture/template/quickstart behavior.
- Scoped check, lint, and format wrappers for owned CLI/E2E TypeScript.
- `deno task quality:gate`.
- `deno task e2e:cli run quickstart.walk --cleanup --format pretty`.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Clean lock diff and leak report.
- Independent IMPL-EVAL PASS and current-head required CI.

## PLAN-EVAL

N/A. The production logs and local exact-version reproduction establish a bounded mechanical repair with no material architecture, sequencing, or product-policy decision.

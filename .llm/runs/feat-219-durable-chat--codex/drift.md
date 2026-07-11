# Drift

## D1 — PLAN-EVAL owner waiver

- Severity: carried process override.
- Source: slice brief: “PLAN-EVAL owner-waived (carried drift D1)”.
- Effect: implementation may begin after a real plan/design section is written; this run does not self-issue a PLAN-EVAL verdict.

## D2 — implementation already landed on baseline

- Severity: significant re-baseline finding.
- Source: issue #219 owner update (2026-07-04) and current `@netscript/fresh/ai` source.
- Effect: the brief describes building FA1/FA2, but current main already contains them. Scope narrows to the missing acceptance-level lifecycle proof and minimal corrections it reveals; no duplicate adapter or protocol will be created.

## D3 — JSR helper/module-tag disagreement

- Severity: baseline/tooling discrepancy.
- Source: `audit-jsr-package.ts` reports module-tag findings for `./ai` and `./vite`; the authoritative full-export `run-deno-doc-lint.ts` reports zero diagnostics, and `./ai` contains an explicit `@module` tag.
- Effect: recorded as auxiliary baseline evidence. No unrelated entrypoint edits were made; publish dry-run is green.

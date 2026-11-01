## Summary

The generated app now uses the Figma Studio Utility dashboard, records/detail, settings, sign-in and command-palette layouts. Pages read actual generated routes, theme, typed service data and enabled auth/workers/streams/AI capabilities. Missing features show designed empty states with valid CLI add commands; unavailable backends remain errors. Settings save real browser appearance preferences. Post-init service creation connects only an unchanged scaffold-owned records placeholder.

The shared command palette now filters results, dispatches keyboard selection and exposes visible dismissal and keyboard help. Existing canonical service examples remain the mutation surface. No showcase data or new provider/workload plumbing is added.

**Draft — runtime acceptance UNPROVEN.** Independent visual review passed all96 screenshots. Independent Claude Opus5.5 high implementation review passed with no blocking code findings. The required runtime command could not pass Aspire/Docker preflight; no policy skip is claimed.

## Scope

Refs #2570
Refs #2566

Reuses current main components; #2488 remains open. Showcase plumbing belongs to #2571.

## Slices

- [x] Plan and independent PLAN-EVAL.
- [x] Shared shell and absent-capability pages.
- [x] Typed live capability wiring and post-init connection.
- [x] Desktop/mobile, light/dark renders and independent visual acceptance.
- [ ] Final independent implementation evaluation and required runtime acceptance.

## Validation

Deno2.9.7:302 tests pass across43 files, including #2566 regressions. All15 root `check:*` tasks, `release:preflight`, `docs:accuracy`, `quality:gate`, and `publish:dry-run` pass. Structured source/generated-app check/lint/fmt pass. CSS budgets remain unchanged and pass.

Browser proof covers72 page cases,12 interaction sets and96 captures across no-db/service/plugin variants, desktop/mobile and light/dark. Separate read-only Astra review scores every page at least8/10 fidelity and quality.

The exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited1 at Aspire preflight and cleanup because Docker was unavailable. Runtime and container cleanup are **UNPROVEN**. CLI documentation lint passes; FreshUI reports124 diagnostics in unchanged baseline files, documented in the audit.

Evidence: `.llm/runs/orch-divybot-6557001595--2570/s4-verification.md`, `visual-review.md`, `s3-browser.json`, and their linked receipts. Public evidence uses repository-relative paths and no session identifiers.

## Drift / Debt

Accepted CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY: no-workers apps resolve the workers typed contract. Shared release resolution and a version-parity regression mitigate skew; the debt ledger requires an optional adapter before independent plugin major upgrades. The owner-requested draft/Refs-only/no-label process overrides generic dispatcher defaults.

## Definition of Done

- [x] Requested pages derive content from actual generated capabilities.
- [x] No static placeholder business rows or misleading capability claims.
- [x] Independent visual fidelity and quality scores >=8/10 on every page.
- [ ] Required checks green or explicitly skipped by workflow policy; runtime remains UNPROVEN.
- [x] Independent IMPL-EVAL passes.

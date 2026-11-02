## Summary

The generated app now uses the Figma Studio Utility dashboard, records/detail, settings, sign-in and command-palette layouts. Pages read actual generated routes, theme, typed service data and enabled auth/workers/streams/AI capabilities. Missing features show designed empty states with valid CLI add commands; unavailable backends remain errors. Settings save real browser appearance preferences. Post-init service creation connects only an unchanged scaffold-owned records placeholder.

The shared command palette now filters results, dispatches keyboard selection and exposes visible dismissal and keyboard help. Existing canonical service examples remain the mutation surface. No showcase data or new provider/workload plumbing is added.

**Review candidate — runtime UNPROVEN; required CI pending.** Independent visual review passed all96 screenshots. Independent Claude Opus5.5 high implementation review passed with no blocking code findings. The runtime command could not pass Aspire preflight (.NET SDK missing; Docker unavailable). A supplemental independent review confirms the existing non-opt-in runtime policy permits that lane to skip. CI run 41309455869 exposed stale scaffold assertions and a resource regeneration conflict. The S5 repair preserves canonical loader inputs only after exact re-render proof; the expanded regression suite and independent review cover the fix. Required CI checks must still finish green on the pushed correction.

## Scope

Refs #2570
Refs #2566

Reuses current main components; #2488 remains open. Showcase plumbing belongs to #2571.

## Slices

- [x] Plan and independent PLAN-EVAL.
- [x] Shared shell and absent-capability pages.
- [x] Typed live capability wiring and post-init connection.
- [x] Desktop/mobile, light/dark renders and independent visual acceptance.
- [ ] Final required CI acceptance (independent implementation evaluation passed).

## Validation

Deno2.9.7:387 tests pass across51 files, including #2566 regressions and the previously failing public command-tree, canonical formatting, navigation and template tests. S5 independent implementation review passes. All15 root `check:*` tasks, `release:preflight`, `docs:accuracy`, `quality:gate`, and `publish:dry-run` pass. Structured source/generated-app check/lint/fmt pass. CSS budgets remain unchanged and pass.

Browser proof covers72 page cases,12 interaction sets and96 captures across no-db/service/plugin variants, desktop/mobile and light/dark. Separate read-only Astra review scores every page at least8/10 fidelity and quality.

The exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited1 at Aspire preflight and cleanup because Docker was unavailable. Runtime and container cleanup are **UNPROVEN**. CLI documentation lint passes; FreshUI reports124 diagnostics in unchanged baseline files, documented in the audit.

Evidence: `.llm/runs/orch-divybot-6557001595--2570/s4-verification.md`, `visual-review.md`, `s3-browser.json`, `s5-ci-repair.md`, `s5-scaffold-tests.json`, and their linked receipts. Public evidence uses repository-relative paths and no session identifiers.

## Drift / Debt

Accepted CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY: no-workers apps resolve the workers typed contract. Shared release resolution and a version-parity regression mitigate skew; the debt ledger requires an optional adapter before independent plugin major upgrades. The owner-requested draft/Refs-only/no-label process overrides generic dispatcher defaults.

## Definition of Done

- [x] Requested pages derive content from actual generated capabilities.
- [x] No static placeholder business rows or misleading capability claims.
- [x] Independent visual fidelity and quality scores >=8/10 on every page.
- [x] Required local scaffold/template, carrier, release, docs, scoped quality and CSS gates have passing evidence; the runtime command was attempted and is explicitly UNPROVEN under the verified non-opt-in workflow policy.
- [x] Independent IMPL-EVAL passes.


Required CI remains an independent readiness condition: core checks/test shards, Fresh UI quality/browser checks, docs checks and close-gate must finish green before READY is declared. Completing the local-validation checklist does not certify those pending CI results.

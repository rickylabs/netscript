# Plan & Design — READY FOR REVIEW

Archetype 6 CLI/tooling with frontend scope. Asset templates remain in the existing registry/writer path; no new command abstractions or package interfaces.

LOCKED: consume existing typed service projections; currency totals never mix; daily chart uses UTC buckets; browser-facing dates use request locale; missing data never becomes zero. Shared registry components are copied through the canonical scaffold install. Search/status/sort/pagination stay server-backed; selection/export is a small app-owned island. Expose only real timestamp changes, never fabricate historical status events. Resource health preserves JSON opt-in and SSR liveness. No fake password/OAuth provider controls.

Slices:
1. Projection-driven Overview, Records and record detail, shared format/presentation, real search and selection/export. Prove template regressions and emitted app compile/browser behavior.
2. Designed live CRUD, resource health, plugin activity/job details and remaining Figma polish. Prove absent/empty/error controls and seeded plugin-enabled browser matrix.
3. Carrier regeneration, complete validation, independent implementation and visual review, CI, final evidence.

Gates: Deno 2.9.7 scoped check/lint/fmt/tests including emitted app; quality:gate; CSS budgets; release:preflight/docs:accuracy; carrier chain and all root check:* tasks; full scaffold.runtime CI. Capture all pages in light/dark desktop and 390px; independent Astra side-by-side review >=8/10 per page. Unexecuted gates remain UNPROVEN.

PLAN-EVAL: N/A. The owner fixes page scope, data contracts, design references, component choices and acceptance. This is composition over merged interfaces, not a new architectural decision. Independent slice/implementation and visual review remain mandatory.

Risk: generated strings alone do not prove emitted TSX; compile clean generated projects. Incomplete stream history must stay explicit rather than fake. New shared styles may exceed budgets; consolidate before measured adjustments. Defer unrelated pending S3 components and showcase provisioning to their owners; merge main normally when available.

## S6 — owner polish checkpoint, 2026-11-01

Owner direction places PR #2586 on hold and supersedes the previous READY. Baseline bc0d1cd; normal merge of origin/main a182c37 is already satisfied. Same branch and evaluator override; no rebase or force push.

1. Public surface: five weekly count bins with axis and hover/keyboard values; varied sample dates and natural names; neutral cancellations and declines; genuine background readiness; consistent filters and record names.
2. Vocabulary: weekly bin is a consecutive group of up to seven UTC days within the current 30-day period; background readiness means the child's own registry and dependency flags, never the API sibling's availability.
3. Ports: existing service projections, ChartBlock, generated Aspire resource maps and server-only discovery, child /health, canonical sample factory. No dependency or authentication changes.
4. Constants: named seven-day bin width and deterministic sample day offsets/time slots; existing theme tokens for ink, field sizing and typography.
5. Slice: S6 implements required #2587 items 1/2/5/6 (owner list 1–4), meaningful focused tests, source and emitted gates, live screenshots and independent source/visual review; commit includes this run. Carriers and all check:* gates plus full runtime CI required on final head.
6. Deferred scope: assess record mutation event publication and seed-triggered jobs separately; preserve them in #2587 if their lifecycle/authentication work cannot fit the roughly two-hour window. Do not present fixture-triggered work as shipped seed behavior.
7. Contributor path: app/lib/scaffold-projections.ts.template explains chart data; service/sample-records.ts.template owns seed realism. Existing canonical scaffold README remains the architecture entry point.

Architecture: CLI/tooling archetype 6 plus existing Fresh UI component contract. Shared ChartBlock needs an opt-in interactive value mode because the current component has neither focus targets nor hover values; retain default rendering for existing consumers. Aspire generator passes background resources to app registration and injects only readiness-bearing Deno/KV child endpoints server-side. No new public network API or architectural debt.

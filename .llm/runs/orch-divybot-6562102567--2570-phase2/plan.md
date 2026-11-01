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

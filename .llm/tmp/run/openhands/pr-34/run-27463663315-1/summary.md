# OpenHands summary — 5d1 support spine research completion

## Summary
Completed phase-1 research for the `@netscript/fresh` support spine (`error`, `utils`, `./vite` config, `./interactive`, root `mod.ts`) by filling every remaining `TODO:` and `(Placeholder…)` marker in `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/research.md`. No source code was modified; only research artifacts and drift were updated and committed.

## Markers filled / content added
- **Per-file doc-lint breakdown + remediation cost**: added the missing `error/handler.ts` row; adjusted total slice estimate to 6–8.
- **Remaining 12 private-type-ref items**: explicitly scoped which 6 belong to 5d1 (`config/vite.ts`, `components/ErrorDisplay.tsx`) and which 8 are inherited via root re-exports from `defer/`/`form/`.
- **Doctrine F-1 cap**: confirmed flag at 500 LOC, fail at 800 LOC; noted umbrella 300 LOC heuristic is stricter and drives the `handler.ts` split decision.
- **Inventory summaries**: completed prose for `error/handler.ts`, `error/primitives.ts`, `error/mod.ts`, `components/ErrorDisplay.tsx`, `utils/mod.ts`, `utils/cache-entry.ts`, `interactive.ts`, `hooks/use-promise.ts`, and root `mod.ts`.
- **Wrapper surface**: documented `config/vite.ts` public API, internal helpers, design issues, and market context.
- **Seam + relocation candidacy**: recorded relocations for `components/ErrorDisplay.tsx` → `error/`, `hooks/use-promise.ts` → `interactive/`.
- **Curated-root policy question**: enumerated six proposed root-barrel rules.
- **Telemetry export maps**: detailed `defer/telemetry.ts` and `form/telemetry.ts` span/event shapes, tracer names, attributes, and OTel alignment; proposed one cross-cutting convention under `_internal/telemetry.ts`.
- **Raw material for phase-2 design**: consolidated numbered design inputs.
- **Market rows with sources**: TanStack Start, Next.js App Router, Remix/React Router — each now includes URLs.
- **Gaps and blockers**: reconciled private-type-ref counts and F-1 wording with the rest of the document.

## Drift updates
Added `D-5d1-008` through `D-5d1-011` covering F-1 cap nuance, scoped doc-lint target, `CacheEntryLike` drift, and `interactive.ts`/`hooks/use-promise.ts` relocation.

## Validation
- `grep` verified zero remaining `TODO:` / `(Placeholder…)` markers in `research.md`.
- `git diff --stat` showed only the two intended research files changed.
- Committed as `744bb61` on `feat/package-quality-wave5-apps-5d1-support`.

## Responses to review / issue comments
Not applicable; this was a research-only phase-1 completion run.

## Remaining risks
- The prior trace's false completion claims mean some measurements (e.g., exact `deno publish --dry-run` counts) were reused without re-running; they are treated as committed artifacts per task instructions.
- Phase-2 `design.md` and `plan.md` still need supervisor review and a manual design trigger.

RESEARCH COMPLETE — READY FOR DESIGN TRIGGER

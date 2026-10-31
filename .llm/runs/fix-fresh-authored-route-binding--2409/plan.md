# Plan & Design — READY FOR REVIEW

Issue #2409, tracker #2474 F1. Archetype 6 generator concern in existing archetype 4 Fresh package.

LOCKED: an existing explicit .withRoute(...) binding is author-owned. Preserve its entire source,
including imports and formatting, for default/sidecar forms. Do not retarget arbitrary expressions,
rewrite templates, or evaluate modules. Unbound pages still receive generated binding/imports;
inline contracts retain their existing generation and conflict behavior. Preserve one canonical
scaffold authoring form: appRoutes as already shipped. No automatic repair of historical duplicates.

S0: research/design/run bootstrap and early draft PR. Gate: complete plan and independent PLAN-EVAL.
S1: guard in existing rewriter; unit cases for appRoutes property/bracket and whitespace variants,
sidecar/default, repeated passes, and existing generated bindings; filesystem pass and Vite dev/build
regressions. Correct two docs paragraphs about authored bindings. Gates: focused route/Vite tests,
negative control reverting only guard, structured check/lint/fmt, quality:gate, explicit changed-source
quality scan, JSR audit, export-map doclint baseline comparison, package publish dry-run, docs freshness.
S2: any required derived docs carriers and final run evidence. Gate: native freshness checks and
independent IMPL-EVAL, then ready for CI and final exact-head review.

Risks: suppressing unbound generation (existing A/B/C tests), changing inline conflict behavior
(existing discovery tests), Vite dev/build drift (exercise both real plugin hooks), doc carrier
staleness (native generation only). Scanner false positives in comments/other objects are inherited;
no parser redesign. Existing canonical missing-import repair will be preserved if doing so does not
change already-valid source; no import needed for appRoutes.

No unresolved implementation decision. Historical duplicate cleanup, scanner redesign and Fresh UI
scaffold/theme edits are deferred, independent scope. No new accepted architecture debt.
Full scaffold.runtime CI required under repository merge policy; coordinator arms/schedules it.
No full local runtime. Do not merge before independent exact-head MERGE and all required gates.

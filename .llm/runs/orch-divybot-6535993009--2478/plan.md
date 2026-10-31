# Plan & Design — READY FOR REVIEW

Locked: use the Lume runtime Element constructor in an unknown-to-Element predicate, and guard article() with its existing clear parse error. Remove the double assertion, keep output unchanged, introduce no suppression or casts.

1. Bootstrap run and draft PR.
2. Independent PLAN-EVAL before implementation (explicit process requirement; despite earlier waiver).
3. One implementation slice: fixture guard, existing fixture regression suite, broken-guard negative control then restoration, structured check/lint/fmt, durable full repo-quality scan.
4. Push, independent IMPL-EVAL; mark ready if no blockers; inspect current-head CI and review threads; final exact-pushed-head evaluation; final report handoff.

Risks: Lume/browser DOM compatibility needs explicit type predicate; preserve constructor identity by importing from the parser module. Mutation must be restored before commit and positive suite rerun. Docs-only CI may never materialize Code quality; report unproven rather than alter workflow.

No unresolved implementation decisions. Deferred: coordinator-only merge and green-main proof; workflow path-filter repair outside approved docs scope. No architecture debt introduced. JSR, runtime, browser and release gates N/A: fixture-only change.

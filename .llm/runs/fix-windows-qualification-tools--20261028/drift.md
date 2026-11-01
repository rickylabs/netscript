# Drift

- Preparation: RTK unavailable on native PATH; direct git reads and structured wrappers retained. No scope change.
- Validation: initial native test filter selected zero; retained but rejected as evidence, corrected regex selected two meaningful failing regressions.
- Validation: root lint excludes all `.llm` owners. Explicit run-local diagnostic config retains root lint rules and includes exact four owners. Initial UTF-8 BOM parse failure retained; corrected UTF-8-without-BOM report processes all four. No existing config changed.
- Downstream: related corpus sentinel fails on native sourcePath identity; installed Aspire bundle has five links to missing aspireify. No out-of-scope owner patched or ignored. DB cold variant not run, following supervisor's explicit steering to reuse its existing graph evidence.
- Supervisor rescope: explicitly authorized ONE additional existing source owner, `.llm/tools/docs/jsdoc-example-policy.ts`, after reviewing the native RED. Canonicalize document identity at existing sourcePath/moduleExampleOwner/publishedPaths boundaries, preserving native filesystem paths, selection, dedup and all 20 immutable #1766 corpus controls. Corpus/policy tests remain unchanged. Repeat relevant policy/corpus gates with old-signature TS2322 negative; no other source expansion or commit authorized.

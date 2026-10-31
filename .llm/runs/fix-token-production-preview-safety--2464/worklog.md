# Worklog

## Design checkpoint

1. Public surface: production builds retain the dev-only token catalog boundary; tokens clean preserves preset metadata via the existing shared constant; design preset queries select only installed preview styles and otherwise retain the configured theme.
2. Domain vocabulary: configured preset, requested preset, installed preview stylesheet, production import graph. No new public schemas.
3. Ports: existing FileSystemPort/TokenEnginePort for cleaning; Vite's compile-time import.meta.glob supplies installed preview availability without runtime filesystem or failed HTTP probes.
4. Constants: reuse TOKEN_PRESET_FILE. Preview glob is necessarily a Vite literal; HTTP and filesystem paths retain their existing distinct roots.
5. Commit slices: bootstrap plan/run; one implementation slice for all three #2464 findings with production-theme/app-token/real Vite preview regressions and scoped gates; generated carrier refresh through canonical tools; separate final evaluator evidence.
6. Deferred scope: token values/Figma, S3 component contracts, installer redesign, releases, unrelated tracker cells.
7. Contributor path: packages/cli/src/kernel/templates/app/production-theme_test.ts (boundary) and a focused design-theme runtime regression beside it.

Research spike first: prove Vite's installed-file glob can enumerate optional static preview assets without loading/requesting them, before locking the production template change. No framework source edited yet.

## Research result and plan gate

Pinned Vite probe passed both absent/installed cases. Plan locked; PLAN-EVAL N/A for this bounded contract-preserving repair. No source edits before the Design checkpoint. Next: bootstrap draft PR, then failing runtime regression before implementation.

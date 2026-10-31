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

## Red/green implementation evidence

Real Vite SSR/static regression before implementation: 5 pass, 2 fail (missing and partially installed preview CSS incorrectly selected the requested preset). After installed-file selection, all six Vite cases pass, including HTTP 200 for the emitted preview link and retaining configured font metadata without preview CSS.

Production guard negative control: replacing Vite ignore with an empty list fails the guard with the intended message (exit 1); source restored exactly. That temporary control overlapped the first positive multi-file run and caused its one expected guard failure, so the clean positive suite is rerun only after restoration. No source issue or test waiver.

Native lock refresh adds only the root vite dependency entry; complete npm and JSR resolution/integrity maps are byte-equivalent after parsing. No published CLI import-map change.

## Final implementation and validation

85 focused tests pass after carrier generation; all 12 raw/shipped preview cases pass. Actual Vite callback guard has negative controls for absent exclusion, wrong regex, and a direct production catalog import (each exit 1). The shipped-carrier red test failed exactly the two missing-preview scenarios before regeneration. Three-file scoped check/lint/fmt and a two-file consumer check using actual generated compilerOptions/types pass.

The experimental root alias failed broader quality at isolated reference resolution. Canonical CLI-local package.json devDependencies wiring fixes ownership without runtime imports; final root/private locks add only CLI packageJson metadata, and all npm/JSR resolutions/integrities remain unchanged. Final broad gate is rerun on this wiring.

Full CLI runtime attempt exits 1 at preflight.aspire and cleanup.aspire-stop because Aspire doctor fails and Docker is unavailable. Runtime remains UNPROVEN, never PASS. No scaffold AppHost started; foreign and unknown processes from the read-only leak report remain untouched. Ordinary PR runtime smoke is opt-in under existing workflow policy; no opt-in labels added under owner instructions.

Independent read-only review PASS with no blocking findings. Non-blocking portability note addressed: test import stripping accepts both LF and CRLF template lines. All five carrier checks are confirmed PASS. Final focused portability check and same-session verification follow.

Portability follow-up review returned FAIL_FIX because it read the long pre-format line and stale formatting evidence. The scoped formatter already split that line as requested. Before re-steering the same reviewer, rerun all three scoped checks and the full 85-test focused selection, update reports/validation.json, and freeze source. This is one consecutive failure, preserved in evaluate-portability.md.

Final same-session IMPL-EVAL PASS after exact-source recheck. All 85 focused tests and three scoped checks rerun successfully after formatting; LF/CRLF controls pass. Source frozen before review. No architectural debt accepted. Reconciled against baseline f4aa307; changes remain within the declared final surface. Commit, push and ready transition follow; continue #2461 without CI polling.

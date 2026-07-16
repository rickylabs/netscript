# Plan: fix #782 — Preact Windows dedupe

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-782-beta10-stabilization--preact-windows-dedupe` |
| Branch | `fix/782-beta10-stabilization` |
| Phase | `plan` |
| Target | `packages/fresh` `./vite` subpath |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

`@netscript/fresh` is assigned Archetype 4 by doctrine because its primary package product is its
public builder/DSL family. This slice stays within the existing `src/application/vite/` integration
surface and does not introduce a second archetype, a new port, or a new public builder concern.

## Current Doctrine Verdict

Doctrine file 10 records `@netscript/fresh` as **Restructure**, with the historical builder-monolith
headline. That AP-1 debt was resolved by the Wave 5 split. The remaining Fresh debt entries do not
cover Vite path identity and are not deepened by this slice.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 | Keep the public plugin surface stable and make Windows correctness a default policy. |
| A6 | Preact-ID canonicalization is justified NetScript policy with a regression seam, not a generic path-helper rename. |
| A7 | Use Vite's upstream `normalizePath()` rather than inventing slash conversion. |
| A8 | Keep implementation and regression colocated in the existing Vite concern. |
| A14 | Lock the production module-identity failure with an executable regression and package gates. |

## Goal

Make NetScript's Fresh Vite plugin collapse slash-variant IDs for the same physical Preact module on
Windows production builds while retaining Vite's normal resolution metadata, `@app` alias behavior,
and user configuration merging.

## Scope

- Return `resolve.dedupe: ['preact']` from the NetScript plugin config as the standard linked/peer
  dependency baseline.
- Match bare Preact, Preact subpaths, and versioned `npm:`/`npm:/` Preact specifiers.
- Delegate matching imports through Vite with `skipSelf: true`, preserve the resolved object, and
  normalize only its final `id` with Vite `normalizePath()`.
- Add a failing-layer production-build regression that mixes a direct Preact-hooks import with a
  virtual peer package import and proves both slash variants become one module identity/one hooks
  patch.
- Document why dedupe is useful but insufficient for slash-variant IDs.

## Non-Scope

- General normalization of every resolved Vite ID; virtual modules, URLs, and foreign plugin IDs
  are not proven safe by this issue.
- Fresh dependency-optimizer changes; Fresh 2.3 already owns `optimizeDeps.noDiscovery`.
- React compatibility aliases or the separate versioned-`npm:` cold-loader aliases from the
  consumer repository.
- Scaffold templates, CLI runtime wiring, or a full `scaffold.runtime` E2E run.
- PLAN-EVAL/IMPL-EVAL dispatch, sign-off, merge, or self-certification.

## Hidden Scope

- The normalizer must preserve Vite resolution metadata by returning the delegated object with only
  `id` replaced.
- `@app` alias resolution must remain first and unchanged.
- Empty explicit alias lists must still receive `resolve.dedupe`.
- The regression must distinguish two module IDs without depending on a Windows host, so it models
  Vite's production Rollup graph with controlled Windows slash variants.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Normalize Preact resolutions only. | This is the proven failure boundary; broad filesystem normalization could alter unrelated virtual/URL IDs. |
| D2 | Use `this.resolve(..., { ...options, skipSelf: true })`. | It preserves Vite/Fresh/Deno resolution and avoids recursion into the NetScript plugin. |
| D3 | Return `{ ...resolved, id: normalizePath(resolved.id) }`. | Keeps externality, side-effect, meta, and attribute information intact. |
| D4 | Keep `@app` alias resolution before Preact delegation. | Preserves existing package behavior and focused tests. |
| D5 | Add `resolve.dedupe` through the config hook rather than app templates. | `packages/fresh` owns the framework policy and every consumer should receive it. |
| D6 | Prove module identity with a Vite production build fixture at the resolver layer. | It reproduces Rollup's string-identity failure cross-platform and is the smallest runtime gate tied to the owner. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Normalize all Windows filesystem IDs | safe to defer | The issue asks for this only if safe; Preact-only behavior is already proven. |
| Run a real Windows browser hydration job in this implementation session | safe to defer | The production-build fixture proves the owning layer; supervisor/CI may add native Windows evidence without changing implementation. |
| Alter the exported hook type to expose Vite `ResolvedId` | safe to defer | No consumer-facing type change is needed for runtime correctness. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Resolver recursion | Always delegate with `skipSelf: true`; regression records delegated options. |
| Matching `preact-render-to-string` accidentally | Require `/` or end-of-string after optional Preact version. |
| Dropping Vite resolution metadata | Spread the delegated result and replace only `id`; assert retained metadata. |
| Breaking `@app` aliases | Preserve alias-first resolution and existing alias test. |
| Config replacement loses dedupe or aliases | Return both under one `resolve` object and test both fields. |
| Cross-platform fixture produces a false green | The pre-fix one-off reproduction is recorded; the new production-build fixture must fail before implementation and pass after it. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-2 | risk | Use Vite `normalizePath()` directly; no home-grown slash helper. |
| AP-9 | risk | Keep policy Preact-specific instead of abstracting an unproven general resolver framework. |
| AP-14 | risk | Import Vite behavior for internal use only; do not add upstream re-exports. |
| AP-25 | existing boundary | Keep the build fixture and Vite effects in the existing application/Vite edge and tests. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1..F-19 applicable to Archetype 4 | yes | `deno task arch:check` plus manual diff review |
| Code-quality scan | yes | `deno task quality:scan` |
| F-19 scoped source gates | yes | scoped check/lint/fmt wrappers over `packages/fresh` |
| F-5/F-7 public docs | yes | `deno task doc:lint --root packages/fresh --pretty`; changed `./vite` entrypoint must remain clean, with existing route debt attributed separately |
| F-6 publishability | yes | package `deno task publish:dry-run` |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| Fresh Vite Windows module identity | none | Fix lands in owning layer with regression; no deferred violation. |
| Existing Fresh debt entries | none | Unrelated and not deepened. |

## Commit Slices

1. **S0 — Activate and expose the harness plan.** Proves the issue, baseline, architecture, and
   gates are locked. Files: this run directory. Gate: artifact review plus clean git status.
2. **S1 — Canonicalize Preact production module identity.** Proves dedupe configuration, delegated
   normalization, one-hooks-runtime behavior, and package fitness. Files:
   `packages/fresh/src/application/vite/vite.ts`, `vite.test.ts`, Vite README, and run evidence.
   Gates: focused failing/passing regression, Fresh tests, scoped wrappers, quality scan,
   architecture check, doc lint, and publish dry-run.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Pre-fix baseline | focused Vite test plus delegated-resolution `deno eval` | Existing tests pass; simulated Preact resolution returns null and never delegates. |
| 2 | Regression red | focused Vite test after adding the production module-identity fixture but before implementation | New fixture fails because two slash-variant hook IDs remain. |
| 3 | Focused runtime | `deno test --allow-all packages/fresh/src/application/vite/vite.test.ts` | All Vite tests pass; fixture loads/patches one hooks runtime. |
| 4 | Package runtime | package Fresh test task | Pass. |
| 5 | Scoped static | check/lint/fmt wrappers with `--root packages/fresh --ext ts,tsx` | Pass. |
| 6 | Code quality | `deno task quality:scan` | Pass with no new suppressions. |
| 7 | Doctrine | `deno task arch:check` | Pass. |
| 8 | Docs | `deno task doc:lint --root packages/fresh --pretty` | Changed `./vite` entrypoint has zero findings; any unrelated baseline findings are attributed and unchanged. |
| 9 | Publish | `deno task publish:dry-run` from `packages/fresh` | Pass. |
| 10 | Scaffold runtime | not run | N/A: scaffold output/runtime wiring is unchanged. |

## Dependencies

- Vite 7.2.2 public plugin hooks and `normalizePath()`.
- Fresh 2.3 dependency-optimizer policy remains unchanged.
- Preact 10.29.x module identities represented by controlled production-build fixture IDs.

## Drift Watch

- If Vite cannot reproduce distinct slash IDs through a controlled build fixture, record and
  rescope the regression rather than weakening it into a string-only assertion.
- If implementation requires scaffold templates, public signatures, or general path normalization,
  stop and rescope because that is materially larger than the approved slice.

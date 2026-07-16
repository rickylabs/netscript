# Research — fix-782-beta10-stabilization--preact-windows-dedupe

## Re-baseline

- Carried-in source: issue #782 and its linked consumer reproduction in `rickylabs/eis-chat` PR
  #150.
- Re-derived against `origin/feat/beta10-integration` @
  `0daa575ba50b1c6b98181b7e1e24d79b7b5a1248` on 2026-07-16.
- What changed vs the carried-in version:
  - The NetScript branch still has no Preact dedupe or delegated Preact-ID normalizer.
  - The consumer workaround remains narrow and removable: delegate normal Vite resolution, then
    apply Vite `normalizePath()` only to resolved Preact IDs.
  - The existing `@app` alias resolver and seven focused Vite tests are green before the fix.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Issue #782 is open, has no comments, targets milestone `0.0.1-beta.10`, and is the authoritative scope. | GitHub REST `GET /repos/rickylabs/netscript/issues/782` using `resolveGithubToken()` |
| 2 | The production failure is one physical Preact runtime represented by `C:\\...` and `C:/...` Rollup IDs; `resolve.dedupe` alone does not canonicalize those strings. | Issue #782 Evidence and Proposed NetScript fix |
| 3 | The proven consumer workaround matches bare Preact, subpaths, and versioned `npm:` forms, delegates with `skipSelf: true`, preserves the resolved object, and normalizes only its `id`. | `rickylabs/eis-chat` PR #150, `apps/dashboard/vite.config.ts` patch |
| 4 | `createNetScriptVitePlugin()` currently returns only `resolve.alias` from its config hook and has no `resolve.dedupe`. | `packages/fresh/src/application/vite/vite.ts` config hook |
| 5 | The current `resolveId` hook resolves `@app` aliases directly and never delegates Preact imports. A pre-fix simulation returned `null` and recorded `delegatedResolverCalled: false` for `preact/hooks`. | `deno eval --config packages/fresh/deno.json ...`; output recorded in `worklog.md` |
| 6 | Existing focused coverage passes before the fix: 7 tests, 0 failures. | `deno test --allow-all packages/fresh/src/application/vite/vite.test.ts` |
| 7 | Vite is a live repo dependency and source concern, not a removable import. | `deno task deps:why vite` reported `sourceUsed: true` |
| 8 | The package is doctrine Archetype 4 with the frontend overlay; this slice changes the existing `./vite` implementation policy, not the public builder/export shape. | Doctrine file 06, Archetype 4 profile, `packages/fresh/deno.json` exports |
| 9 | Relevant Fresh implementation debt is unrelated or resolved. Doctrine file 10 separately tracks current route-contract doc-lint debt; this fix creates no new debt and the `./vite` entrypoint remains at zero diagnostics. | Fresh entries in `.llm/harness/debt/arch-debt.md`, doctrine file 10, focused doc-lint attribution |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/fresh/mod.ts`, `packages/fresh/deno.json` exports, and
  `packages/fresh/src/application/vite/vite.ts` via `deno doc` before broad implementation reads.
- Planned surface change: none. `createNetScriptVitePlugin()` keeps its name, options, return type,
  and `./vite` subpath. Only returned Vite configuration and resolver behavior change.
- Slow-type / surface risks: no new exported symbols or signatures; existing Vite type-resolution
  warnings observed during `deno doc` are baseline dependency diagnostics. The final package
  publish dry-run passes. Structured doc-lint attributes zero findings to `./vite` and 25 existing
  findings to the untouched route-contract surface tracked in doctrine file 10.

## Open questions

- None that force rework. The issue and consumer proof lock the narrow Preact-only normalization
  policy. General normalization of every filesystem ID is safe to defer because the issue does not
  prove that broader policy across virtual IDs, URLs, and other plugin namespaces.

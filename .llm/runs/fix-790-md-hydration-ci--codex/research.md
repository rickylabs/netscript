# Research — Fresh Markdown clean-runner production build

## Re-baseline

- Carried-in source: PR #790 regression and GitHub Actions job `87754952044` from PR #795.
- Re-derived against `feat/beta10-integration` at `3265b516` on 2026-07-17.
- The original local hydration proof remains valid on a warm native-WSL cache, but a clean
  `DENO_DIR` reproduces the CI production-build failure deterministically.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The assertion did include the child stderr as an undifferentiated equality message; the underlying build failure is present only in the complete job log. | GitHub REST `GET /repos/rickylabs/netscript/actions/jobs/87754952044/logs` via `resolveGithubToken()`; log lines 6175–6411. |
| 2 | The peer warning is not the build failure. Rollup fails to resolve Fresh core's `npm:@preact/signals@^2.5.1` import from `runtime/client/reviver.ts`. | Job log lines 6386–6398. |
| 3 | A clean local Deno cache reproduces the same failure; the normal warm cache passes, explaining the local/CI split. | `DENO_DIR=.llm/tmp/deno-cache-md-ci deno test -A --unstable-kv packages/fresh-ui/tests/registry/markdown-renderer.test.ts --filter 'generated Fresh Markdown island production-builds for hydration'`. |
| 4 | Generated apps already map bare `@preact/signals` to a pinned npm version, while `@netscript/fresh/vite` canonicalizes only Preact specifiers and dedupes only `preact`. | `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts`; `packages/fresh/src/application/vite/vite.ts`. |
| 5 | The package-owned Vite resolver runs before downstream resolution and is the existing seam for versioned Preact-family module identity. | `createNetScriptVitePlugin()` and adjacent resolver tests. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `@netscript/fresh/vite` and `@netscript/fresh-ui` export maps.
- Slow-type / surface risks: none. No export or signature changes are planned; the change is an
  internal Vite resolution policy plus tests and adjacent documentation.
- Publish dry-run remains a package gate because framework source is touched.

## Open questions

- None. The actual failure, owning seam, and deterministic clean-cache reproduction are resolved.


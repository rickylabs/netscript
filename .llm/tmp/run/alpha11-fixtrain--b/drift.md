# alpha.11 fix-train Slice B drift

- minor: F-15c was reproducible on current main/slice branch. Generated `apps/dashboard/vite.config.ts`
  failed against Vite 7.2.2 because `NetScriptVitePlugin` was not assignable to `PluginOption`.
  Disposition: fixed in `packages/fresh/src/application/vite/vite.ts`.
- minor: Fresh local-source scaffold also exposed stale SDK subpath local import mappings
  (`packages/sdk/client/mod.ts`, `packages/sdk/query/mod.ts`, `packages/sdk/query-client/mod.ts`).
  Copied SDK packages place these files under `packages/sdk/src/**/mod.ts`. Disposition: fixed in
  CLI scaffold and maintainer local import resolvers.
- informational: CLI wrapper lint/fmt returned nonzero with zero findings for `packages/cli`; raw
  `deno lint .` and TS-only `deno fmt --check` were clean. Package-wide raw fmt still has unrelated
  Markdown drift in `packages/cli/e2e/README.md`, left untouched.

# alpha.11 fix-train Slice B research

## Scope

- Branch: `fix/scaffold-typecheck-alpha11-b`
- Codex thread: `019f09d4-0752-7600-88f2-0660c7521db3`
- Archetype: 6, CLI / Tooling. The primary edited surface is `packages/cli` scaffold output.
- Fresh overlay: generated Fresh app templates and Vite config are part of the consumer gate.

## Findings

- `QueryClientPort` exposes `getQueryData`, `setQueryData`, `invalidateQueries`, `fetchQuery`,
  `getQueryCache`, `mount`, `unmount`, and `clear`; it does not expose `getQueryState`.
- The scaffolded `service-showcase.ts` used `queryClient.getQueryState(...)` to read
  `dataUpdatedAt`, which is outside the SDK port contract.
- Reproduction scaffold before the fix:
  `deno run -A packages/cli/bin/netscript-dev.ts init typecheck-b-before --path .llm/tmp --db sqlite --service --service-name users --service-port 3001 --editor zed --ci --yes --no-git --force`.
- Generated workspace before the fix failed `deno task check` with SDK subpath import misses,
  template typing fallout, and a Vite 7 `PluginOption` assignability error in
  `apps/dashboard/vite.config.ts`.
- F-15c was reproducible on current `main`/slice branch with Vite 7.2.2, so it is not treated as
  publish-only drift for this implementation.

## JSR / public surface scan

- No SDK public surface widening was needed or performed.
- `packages/fresh` public Vite helper type changed from a package-owned facade interface to the
  upstream `Plugin` type that the function already constructs. This removes an existing
  `as unknown as` cast and aligns the exported return type with Vite 7.

## Open questions

- None blocking this slice. Generated workspace `deno task check` is the authoritative consumer
  gate.

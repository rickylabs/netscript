# Research

## Authority

The implementation authority is Slice B in
`origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`.
The plan is locked and already evaluated. This run does not re-plan it.

## Baseline

- Branch base and `origin/main`: `850cc7757d11d420b9061dbe6a61536357ab77fe`.
- Opening worktree: clean.
- Product touch ceiling: the six paths enumerated by Slice B.
- Measured overlap with PR #1664: zero paths, per the owner-provided D9 result.

## Findings relied on

- `resolveNetScriptRouteManifestOptions` accepts `routesDir` and `outputPath` overrides.
- `discoverNetScriptRoutes` returns Fresh-owned `routeKeyPath`; the CLI must consume it rather
  than infer a property chain.
- `writeNetScriptRouteManifestSync` writes and content-compares sibling `manifest.ts` and
  `routes.ts` outputs.
- The page-module rewrite pass remains internal and is not part of the Slice B public seam.
- `packages/fresh` is Archetype 4 and `packages/cli` is Archetype 6; both have a current doctrine
  verdict of Keep. The frontend overlay applies.

## JSR surface risks

- New public Fresh functions and types require documentation and zero new normalized doc-lint
  diagnostics.
- The CLI must declare `@netscript/fresh` explicitly with an allowed `jsr:` specifier.
- Publish include/exclude configuration must include the new production adapters and exclude tests.
- The dependency edit owns `deno.lock` only if Deno resolution actually changes it.

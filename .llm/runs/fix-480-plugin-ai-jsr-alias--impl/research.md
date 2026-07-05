# Research - fix-480-plugin-ai-jsr-alias--impl

## Re-baseline

- Carried-in source: user prompt for #480 with verified e2e-cli-prod failure.
- Re-derived against `main` baseline `6e9eddf3f4674ef6fb65403e486d4e9b3f3ab266` on 2026-07-05.
- What changed vs carried-in version:
  - The root-cause file and function still match the prompt.
  - The e2e official plugin suite already includes `scaffold.plugin.ai`; this is not an e2e suite enumeration miss.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Bare plugin aliases map official shorthand to JSR packages before kind-registry planning. `ai` was absent. | `packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts` |
| 2 | `resolvePluginDescriptorBeforePlanning` only takes the JSR validator route for aliases, `@scope/name`, or `jsr:` specs. A bare `ai` without an alias falls through to kind planning. | `packages/cli/src/public/features/plugins/install/install-plugin.ts` |
| 3 | Trust-tier policy is scope-based (`scope === 'netscript'`), so `@netscript/plugin-ai` is already first-party once resolved. | `packages/cli/src/public/features/plugins/install/plugin-trust-tier.ts` |
| 4 | `OFFICIAL_PLUGIN_DIRS` rewrites local copied plugin relative paths for `sagas`, `streams`, `triggers`, and `workers`; it omits `auth`, so it is not the public official-plugin alias list and should not gain `ai` in this slice. | `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts` |
| 5 | e2e official plugin capability lists already include `ai`. | `packages/cli/e2e/suites/scaffold/capability-suites.ts`, `packages/cli/e2e/src/domain/extension-axes.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: CLI public install path only; no package exports or JSR metadata changed.
- Slow-type / surface risks: N/A. This is a CLI behavior fix for package resolution, not a publish-surface change.

## Open questions

- None blocking. Prod-path verification must prove local CLI resolves the published `@netscript/plugin-ai` package without `--local-path`.

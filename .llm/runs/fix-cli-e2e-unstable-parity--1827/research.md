# Research — #1827 CLI/E2E compiler-lib parity

## Re-baseline

- Carried-in source: issue #1827, draft PR #1828, and `context-pack.md`.
- Re-derived against `main` at `0274c0a707e36ded3b4470a3911315f963e642d4` on 2026-08-31.
- Current branch head before implementation: `3ef931caa8b67a64c763cd0aaa575964f463e37e`.
- Supervisor correction: the production oracle is `packages/cli/deno.json`, not the repository
  root config. The member preserves the relative order of its existing entries and is missing the
  middle production entry only.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The production CLI oracle `packages/cli/deno.json` has `compilerOptions.lib` exactly `["deno.ns", "deno.unstable", "dom"]`. | Resolve `../../deno.json` from `packages/cli/e2e/tests/` and read it. |
| 2 | `packages/cli/e2e/deno.json` has `compilerOptions.lib` exactly `["deno.ns", "dom"]`; its exact delta is missing `"deno.unstable"` between the two existing canonically ordered entries. | Resolve `../deno.json` from the test directory and read it. |
| 3 | Repository-root `deno.json` has `["dom", "deno.ns", "deno.unstable"]`, but it is not the production CLI oracle and must not determine this member's order. | Resolve `../../../../deno.json` from the test directory; compare its path and value with `../../deno.json`. |
| 4 | AP-20 and F-8 require a workspace member that overrides `compilerOptions.lib` to include `deno.unstable`. | `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`. |
| 5 | The E2E member is `publish: false`, and the doctrine explicitly excludes it as an independently published top-level doctrine unit. | Member `deno.json`; doctrine file 09 under F-19. |

## JSR-audit surface scan

N/A: this is a non-published CLI/E2E workspace member (`publish: false`), and the slice changes no
export, package surface, dependency, version, or publish artifact.

## Open questions

None. The supervisor fixed the oracle, exact expected order, scope, RED→GREEN sequence, and gate set.

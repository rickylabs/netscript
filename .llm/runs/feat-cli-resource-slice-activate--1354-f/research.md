# Research — Slice F activation (#1354)

## Re-baseline

- Carried-in source: `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md` and the owner-provided verbatim Slice F contract.
- Re-derived against integration commit `be3e3dded7720ab00474eccf4ba4123b8ecdbe23` on 2026-09-02. `origin/feat/app-service-client-wiring` has since advanced from the integrated `9295eabaa` to `e8983cca5`; the PR remains stacked on that branch as directed.
- The branch contains the expected Slice A selector and Slice E unregistered command. The neutral planner/templates and Fresh manifest adapter are present.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | `generate resource` exists but is not registered and has no composed production dependencies. | `rg -n 'createGenerateResourceCommand|generateResourceDependencies' packages/cli/src` |
| 2 | Init still writes hand-maintained generated route seeds before emitting its routes. | `write-app-files.ts` imports/calls `generateRouteManifestSeed` and `generateRoutesSeed`. |
| 3 | The old example writer still renders every retired canonical/dependent template; only `service-query.ts` plus telemetry/README are retained demo assets. | `write-example-service-app-files.ts`; Slice F retire-set. |
| 4 | The retire-set consumer census found no additional importer or rendered consumer. All code-side references are confined to the expected writer, manifest, carrier, support, and route-template test files. Template import references are confined to the enumerated retired templates; the surviving examples index contains descriptive text only. | scoped `rg` searches recorded in the session and repeated before deletion. |
| 5 | `deno.lock` is initially clean at blob `202d4c9bfb5841f1d3cee766351fdf63efc53a3b`. | `git diff -- deno.lock`; `git hash-object deno.lock`. |
| 6 | The current doctrine verdict for `packages/cli` is Keep / Archetype 6. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`. |

## jsr-audit surface scan

- Surface scanned: `packages/cli/deno.json`, command composition, and the carried-in resource command types.
- Slow-type / surface risks: Slice F adds no new JSR export or inferred exported declaration. Risks are command composition reachability, generated carrier freshness, file inclusion, and dry-run slow-type regressions; the CLI JSR audit and package publish dry-run are required gates.

## Open questions

- None. Any newly discovered retire-set importer or rendered consumer is a stop/rescope condition, not an implementation choice.

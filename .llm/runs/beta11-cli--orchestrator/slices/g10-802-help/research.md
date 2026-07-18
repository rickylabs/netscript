# Research — beta11-cli--orchestrator/slices/g10-802-help

## Re-baseline

- Carried-in source: live issue #802 and the supervisor brief.
- Re-derived against `origin/main` @ `56cf84b57a64cea3e09b2ea1468c83a387bc5038` on 2026-07-18.
- The live issue has no comments, remains open, and is assigned milestone `0.0.1-beta.11`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Workers has 21 command definitions whose `usage` begins with uninstalled `ns-workers`. | `rg -n "usage:.*ns-workers|^ *'ns-workers" plugins/workers/src/cli/commands.ts` |
| 2 | Sagas has 8 command definitions whose `usage` begins with uninstalled `ns-sagas`. | `rg -n "usage:.*ns-sagas|^ *'ns-sagas" plugins/sagas/src/cli/commands.ts` |
| 3 | Triggers has 12 command definitions split across `commands.ts` and `management-commands.ts`, all using uninstalled `ns-triggers`. | focused `rg` over `plugins/triggers/src/cli` |
| 4 | Streams ships `./cli` but defines no `usage` strings, so it is an audited no-change sibling. Its composition entrypoint documents the direct `deno x -A jsr:@netscript/plugin-streams/cli` form. | `plugins/streams/src/cli/composition/main.ts`; focused `rg` |
| 5 | The shared plugin CLI help formatter prints command names/descriptions only; the affected `usage` values are command metadata returned by plugin backends. | `packages/plugin/src/cli/presentation/help-formatter.ts`; static backend implementations |
| 6 | Elsewhere, executable JSR subpaths are presented in direct `deno x` form, including the streams CLI entrypoint and MCP CLI guidance. | streams composition module and package docs/source |

## jsr-audit surface scan

- Surface scanned: `./cli` exports in the four sibling plugin `deno.json` files and their composition entrypoints.
- Planned change is string metadata plus tests only; it adds no export, type, entrypoint, permission, dependency, JSDoc, or publish-file change.
- Slow-type / surface risk: none introduced. Existing publish surfaces remain unchanged; full plugin tests and scoped static wrappers are the proportional gate. No publish command will be run because this is not a release/publish slice and the owner stop-line forbids release publication.

## Open questions

- None. The single a/b/c decision is resolved and locked in `plan.md` before implementation.


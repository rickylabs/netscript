# Research — chore-declare-streams-core-dependency--1543

## Re-baseline

- Carried-in source: issue #1543 and the owner-provided base assessment.
- Re-derived against `main` @ `38f2ce7358f80e4075c481b450b52e1a01c5984c` on 2026-09-01.
- The two carried-in manifest omissions matched, but the original completeness derivation did not:
  it scoped search to those members and conflated a string reference with a module edge.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `packages/plugin-workers-core/deno.json` omitted `@netscript/plugin-streams-core` despite imports in `src/streams/{producer,schema}.ts`. | `rg -n 'plugin-streams-core' packages/plugin-workers-core` |
| 2 | `plugins/triggers/deno.json` omitted the same dependency despite module imports in `streams/{producer,factory,schema}.ts`. | static import/export census over `plugins/triggers` |
| 3 | `plugins/workers/deno.json` declares the established exact specifier `jsr:@netscript/plugin-streams-core@0.0.6`. | `plugins/workers/deno.json:26` |
| 4 | The base publish dry-run succeeds and emits no rejection or undeclared-import warning. | `deno task publish:dry-run` → `REAL_EXIT=0` |
| 5 | Three additional publishable members have static module edges but no declaration: `packages/sdk`, `packages/plugin-sagas-core`, and `packages/plugin-auth-core`. | workspace-wide static import/export census + manifest comparison |
| 6 | `packages/cli/e2e` has five genuine static imports across five scaffold-gate files and no declaration. | five files under `src/application/gates/scaffold/` |
| 7 | `plugins/triggers/src/public/mod.ts:23` is a `definePlugin(...)` string literal, not an import. CLI codegen strings, generated assets/prose, docs, and diagnostics literals are also not dependency edges. | syntax-context inspection of every target-string occurrence |

## jsr-audit surface scan

- Surface scanned: workspace-wide static import/export edges, separately from string references and
  the streams-core package's legitimate self-references, plus every consumer member manifest.
- Slow-type / surface risks: none; no export or TypeScript surface changes.
- The repository publish dry-run is the applicable publishability evidence for this manifest-only
  slice. A broader JSR surface audit is N/A because no published API or file set changes.

## Open questions

- None after the owner-authorized cycle-2 expansion to the four remaining importing members.

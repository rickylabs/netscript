# Research — version-scheme-0-0-x

## Re-baseline

- Carried-in source: owner assignment plus `.llm/runs/version-scheme-0-0-x/implement.md`.
- Re-derived against `origin/main` at
  `8dca679855ab6b5f45d7e3d597432769cc3afaeb` on 2026-07-31.
- The owner's baseline count reproduces exactly: 325 matches of
  `0.0.1-beta(?:.<number>)?` outside `.git`, `node_modules`, `_site`, and `.llm`.
- A supervisor refinement committed after launch adds a three-tier deletion/stage/auto-bump
  mandate. The current owner prompt does not contain that expansion. This plan follows the current
  owner hierarchy: derive, make derivable, then retain a literal only for a genuine one-off or
  historical fact.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | 325 baseline matches are distributed across `packages` 158, root `deno.lock` 66, `plugins` 65, `.agents` 9, `.claude` 9, `docs` 8, `resources` 4, `rfcs` 2, and four one-off root/tool files. | `rg -o --hidden ... '0\\.0\\.1-beta(?:\\.[0-9]+)?'` grouped by top-level path. |
| 2 | 193 occurrences in 54 files are already owned by `discoverVersionFiles()` plus `PUBLISH_ASSET_OUTPUTS`; the assignment correctly requires leaving these at beta.12 until `release:cut`. | Import `discoverVersionFiles` and `PUBLISH_ASSET_OUTPUTS`, count matches. |
| 3 | `packages/fresh-ui/deno.lock` contains 65 beta.11 workspace dependency references. It is one release behind the beta.12 manifests and is invisible to both version-file discovery and residue checks. | `rg -n '0\\.0\\.1-beta\\.11' packages/fresh-ui/deno.lock`; inspect `.llm/tools/deps/bump-version.ts`. |
| 4 | Site install examples already derive from `docs/site/_data.ts` via `releaseVersion` and `releaseSpecifier`; these need no duplicated literal. | `rg -n 'releaseVersion|releaseSpecifier' docs/site`. |
| 5 | `plugins/ai` and Fresh UI already use generated package metadata. MCP has `MCP_PACKAGE_VERSION` but its server handshake hardcodes beta.9. Saga-core and streams-core instrumentation hardcode beta.5 and have no generated version constant. | `packages/mcp/src/application/runner/mcp-server.ts`; plugin-core telemetry files; `.llm/tools/generate-publish-assets.ts`. |
| 6 | The CLI guard named `version-drift_test.ts` recognizes only `0.0.1-alpha.N`; stable `0.0.x`, beta, and canary pins evade it. The broader release scanner is generic, but this local regression test is false-green. | `packages/cli/src/kernel/constants/version-drift_test.ts`. |
| 7 | Markdown preflight recognizes only `0.0.1-<label>.<N>` pins and defers all `docs/site` findings. It cannot catch stale normal-core pins such as `@0.0.2` during a `0.0.3` cut. | `MARKDOWN_PIN_PATTERN` and `DEFERRED_MARKDOWN_PREFIX` in `.llm/tools/release/preflight-release.ts`. |
| 8 | `validateStableTarget()` is already correct: it accepts only a normal semver target, and canary tests already prove `0.0.2-canary.N`. No relaxation is needed. | `.llm/tools/release/canary.ts` and `canary_test.ts`. |
| 9 | Live open milestones are `0.0.2` through `0.0.9` plus `Backlog / Triage`; `wave:*` labels span multiple milestones and no longer determine a unique milestone. | GitHub milestones and issue-search API queried 2026-07-31; results recorded in `drift.md`. |
| 10 | Beta.5 telemetry alias-window prose, the beta.7 worker incident, beta.10 release incident notes, captured trace fixtures, public-surface baselines, and `.llm/runs/**` are historical facts and should remain. | Focused `rg -n -C 3 '\\bbeta\\b'` plus owner non-scope. |
| 11 | Root and package READMEs contain no frozen NetScript install versions; the root uses `@<version>`. Root maturity prose still says “beta” and should become “pre-1.0.” | `rg` across `README.md`, `packages/*/README.md`, and `plugins/*/README.md`. |
| 12 | `deno doc` succeeds for MCP, saga-core, streams-core, and CLI. Planned generated constants remain internal and do not add exports or alter public signatures. | `deno doc packages/{mcp,plugin-sagas-core,plugin-streams-core}/mod.ts`. |

## Reference classification

| Class | Treatment |
| --- | --- |
| Coordinated manifests, root lock, scaffold manifests, generated metadata | Leave beta.12 in this PR; prove `release:cut -- 0.0.2 --dry-run` moves them. |
| Nested tracked lock | Add to bump/residue discovery; reconcile beta.11 to the current manifest graph once. |
| Runtime-reported package versions | Import an existing generated constant or add a generated internal constant. |
| Install snippets and current-release docs | Use existing derived site data or a version-neutral placeholder. |
| Tests, visual mocks, workflow examples | Use `0.0.2` only where the literal is intentionally isolated test/example data. |
| Historical incidents and compatibility windows | Preserve the shipped version verbatim and state why in the PR. |
| Maturity prose | Say “pre-1.0,” not “beta,” because releases are now normal `0.0.x` versions. |

## jsr-audit surface scan

- Surfaces inspected with `deno doc`: `@netscript/mcp`, `@netscript/plugin-sagas-core`,
  `@netscript/plugin-streams-core`, and `@netscript/cli`.
- Planned product-code changes add internal generated string constants and replace runtime metadata
  literals. No `mod.ts`, export-map, public type, dependency, or JSDoc surface changes.
- Slow-type risk: none introduced. Full export-map doc lint remains a final gate for the three
  affected publishable packages; publish dry-run/readiness is the release proof.
- File-list risk: generated metadata must be included by the packages' existing `**/*.ts` publish
  includes. `gen:publish-assets --check` and package dry-run will verify freshness/inclusion.

## Open questions

- None that force implementation rework. Historical-versus-current classification is locked in the
  table above; any newly discovered ambiguous occurrence is logged before editing.

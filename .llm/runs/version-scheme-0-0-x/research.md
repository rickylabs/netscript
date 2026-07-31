# Research — version-scheme-0-0-x

## Re-baseline

- Carried-in source: owner brief in `implement.md`, refined by commit `fbd57c3bf`.
- Re-derived against `origin/main` at `8dca679855ab6b5f45d7e3d597432769cc3afaeb` on 2026-07-31.
- The exact owner census reproduces: 325 matches of `0.0.1-beta*` in 84 files when `.git`,
  `node_modules`, `_site`, and `.llm` are excluded.
- The revised brief replaces “derive every reference” with a three-tier triage: delete, retain only
  stage meaning, or keep exact and prove automatic release-cut movement.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | The baseline has exactly 325 occurrences in 84 files. | `rg --json --hidden` with the brief's exclusion set and regex `0\\.0\\.1-beta(?:\\.[0-9]+)?`. |
| 2 | 131 occurrences are in two tracked lockfiles; 106 are in workspace `deno.json` manifests. These 237 occurrences must remain unchanged on this branch and are rewritten by `coordinateVersionBump`. | `deno.lock`, `packages/fresh-ui/deno.lock`, and `.llm/tools/deps/bump-version.ts::discoverVersionFiles`. |
| 3 | Twelve more occurrences are in six `scaffold.plugin.json` files, which `discoverVersionFiles` walks and rewrites. | `.llm/tools/deps/bump-version.ts:discoverVersionFiles`. |
| 4 | Nine generated TypeScript version constants are regenerated from bumped manifests by `gen:publish-assets`, which `prepareRelease` runs before readiness. | `.llm/tools/generate-publish-assets.ts` and `.llm/tools/release/prepare-release.ts`. |
| 5 | Therefore at least 258/325 occurrences are necessarily Tier 3 before considering other exact consumers. “Most of all 325 in Tiers 1–2” cannot hold when counting raw occurrences. The intended reduction test is meaningful on the non-manifest/non-generated remainder. | Findings 2–4; recorded as significant drift. |
| 6 | The release bumper intentionally scans JSON and locks; publish readiness separately scans publishable TypeScript pins and Markdown pins. This is the correct split to preserve. | `.llm/tools/release/publish-readiness.ts`. |
| 7 | Current publishable-source exceptions include hardcoded telemetry instrumentation versions and MCP server metadata. These are candidates for Tier 3 derivation through generated package metadata, not literal updates. | `packages/plugin-sagas-core/src/telemetry/otel-saga-telemetry.ts`, `packages/plugin-streams-core/src/telemetry/instrumentation.ts`, `packages/plugin-triggers-core/src/telemetry/attributes.ts`, `packages/mcp/src/application/runner/mcp-server.ts`. |
| 8 | CLI/fresh-ui tests contain scenario literals. They should use generic fixture versions when the number is only sample data, or a release constant when asserting current lockstep behavior. | `packages/cli/src/kernel/application/ui/registry-deno-json_test.ts`, `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts`, `packages/fresh-ui/tests/registry/components/ui/desktop.test.tsx`. |
| 9 | The release skill still teaches the superseded prerelease-target canary doctrine. The PR/milestone skill still names obsolete prerelease milestones. The `.claude/skills` copies are generated and must not be edited directly. | `.agents/skills/netscript-release/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`, `deno task agentic:sync-claude`. |
| 10 | `validateStableTarget` is already correct: canary targets are now normal versions, so no relaxation is needed. | `.llm/tools/release/canary.ts` and `canary_test.ts`. |
| 11 | Historical release incident evidence (notably beta.10) is still semantically correct and must remain literal. | Release skill incident/recovery section; assignment non-scope. |
| 12 | Package quality risk is limited to derivation wiring and fixture semantics; no public exports or `deno.json` versions are planned to change. | Planned slice map and manifest non-scope. |

## Preliminary Tier Census

This is a planning census, not the final PR table. Counts will be recomputed from the final tree and
the diff after every slice.

| Surface | Occurrences | Preliminary tier | Mechanism / action |
| --- | ---: | --- | --- |
| `deno.lock` files | 131 | 3 | `coordinateVersionBump` |
| workspace `deno.json` files | 106 | 3 | `coordinateVersionBump` |
| `scaffold.plugin.json` files | 12 | 3 | `discoverVersionFiles` scaffold walk |
| generated package-version constants | 9 | 3 | `gen:publish-assets` |
| remaining source/tests/docs/skills/resources | 67 | 1/2/3/historical | site-by-site triage required |

Historical occurrences are reported separately from the mutable Tier 1–3 counts because the owner
explicitly requires immutable published-version history to remain unchanged.

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: current generated package metadata, exact JSR pins emitted by CLI/plugin
  scaffolds, and runtime metadata literals in affected publishable source.
- No export-map, `mod.ts`, or public type changes are planned.
- Slow-type risk: none introduced by replacing string literals with imported/generated `string`
  constants. Any newly generated constant must keep an explicit `: string` annotation.
- Publish risk: a hardcoded exact version in publishable TypeScript can evade the JSON/lock residue
  scan. `publish:readiness` plus the final `release:cut -- 0.0.2 --dry-run` is the authoritative
  consumer proof.
- Existing unrelated JSR debt is not expanded by this run.

## Open questions

- Resolved now: raw occurrence majority cannot be Tier 1/2 because 258 are already release-cut-owned
  Tier 3. Final reporting will show both the all-occurrence census and the reducible remainder.
- Safe to defer: whether future release tooling should emit a machine-readable permanent tier
  inventory. This PR may add a narrowly targeted regression gate only if the existing gates cannot
  prove a discovered Tier 3 path.

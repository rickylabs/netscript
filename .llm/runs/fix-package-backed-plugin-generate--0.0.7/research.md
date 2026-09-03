# Research — fix-package-backed-plugin-generate--0.0.7

## Re-baseline

- Carried-in source: issue #1966, Canary 8 run 33697779870/job 100470315665, and `implement-brief.md`.
- Re-derived against `origin/main` at `79adb103be568260e51b0eb3ba9fae281a5fe1f0` on 2026-09-03.
- Branch bootstrap head is `954126717fb82f43e1128ce1d6d4113d3dd9e149`; its only delta from the dispatch baseline is the tracked implement brief.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Issue #1966 records one Canary 8 failure: the published CLI exits zero while omitting the workers registry; doctor then reports the missing/empty/stale registry truthfully. | `gh issue view 1966 --repo rickylabs/netscript --json body` |
| 2 | `GeneratePluginRegistriesCommand` resolves the option through `requireProjectRoot`, then passes the returned root unchanged to `GenerateInstalledPluginRegistries`. | `packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts` |
| 3 | The installed generator discovers exact JSR runtime entrypoints from the selected root's `appsettings.json`, resolves local/source/published manifests, runs the declared generator with `cwd` and `--config` set to the selected project root, and asserts every declared output exists. | `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts` |
| 4 | Local-source scaffold coverage can resolve a workspace member or `.netscript-source-root`; package-backed coverage must fetch `scaffold.runtime.json` and execute its command over an HTTPS/JSR graph. | `resolveRuntimeManifest()` and existing installed-runtime-registry tests |
| 5 | `packages/cli` is Archetype 6 with doctrine verdict Keep. `plugins/workers` is Archetype 5 with Refactor debt; it is consumer-only unless reproduction proves its published generator is defective. | doctrine 06/10 and `.llm/harness/debt/arch-debt.md` |

## jsr-audit surface scan

- Surface scanned: `@netscript/cli` public command/publish execution shape; no export-map, `mod.ts`, metadata, or JSDoc change is planned.
- Slow-type / surface risks: the repair must work when the generator command is loaded from the published HTTPS/JSR graph; a local publish dry-run is only static evidence and cannot replace the hosted package-backed gate.
- Existing debt: CLI public doc completeness remains open; workers has a no-increase allowance of 20 `private-type-ref` diagnostics. This slice must not deepen either.

## Open questions

- Does the exact Canary 8 command ignore `--project-root` when `cwd` differs, or does published-manifest/generator resolution omit package-backed registry generation?
- Does local CLI source at baseline `79adb103b` reproduce the same behavior against the same package-backed root?

## Resolved cause and supervisor correction

The exact replay resolved both questions before product code changed. Repo-cwd and project-cwd runs
both reach the published workers generator with the explicit fixture root. That nested Deno process
uses the fixture project's `deno.json`, but the config did not carry the outer command's
`--minimum-dependency-age=0` policy. Deno's default 24-hour policy therefore rejects the freshly
published `@netscript/config@0.0.7-canary.8`, and no registry is written. The supervisor correction
binds the repair to the package-backed E2E fixture; product generator and doctor code are excluded.

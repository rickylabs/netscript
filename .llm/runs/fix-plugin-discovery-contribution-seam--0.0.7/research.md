# Research — fix-plugin-discovery-contribution-seam--0.0.7

## Re-baseline

- Carried-in source: leaf brief for #1093.
- Re-derived against `origin/main` and local `HEAD` at `bd9d463b4480847dcd6f76efe5bc1e53bb926bec` on
  2026-08-31.
- Branch: `fix/plugin-discovery-contribution-seam`.
- Worktree was clean before research. `deno.lock` SHA-256 was and remains
  `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
- The brief's defect reproduces in the tree: `AstExtractor` has no constructor/configuration seam
  and iterates a private three-row `CONTRIBUTION_BUILDERS` constant.

## Architecture Evidence

### Selected archetype and verdict

- `packages/plugin` is explicitly assigned **Archetype 4 — Public DSL / Builder** in
  `docs/architecture/doctrine/06-archetypes.md`, despite also owning SDK discovery ports. It is not
  Archetype 5, which is reserved for first-party packages under `plugins/*`.
- The current doctrine verdict is **Keep — preserve manifest, discovery, validation, and host
  contracts** (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`).
- The relevant doctrine says open cross-package extension uses registration rather than inheritance,
  and a registration mechanism belongs on a named open axis. Here the named variation is the mapping
  from a source-level factory callee to a generated contribution axis.

### The existing discovery boundary

1. `WalkedFile` is only `{ path, text }`; the walker does not know plugin manifests or factory
   semantics (`src/sdk/discovery/ports/walker-port.ts`).
2. `ExtractorPort.extract(files)` owns the transformation from walked source text to
   `ExtractedContribution { file, symbol, axis }` (`src/sdk/discovery/ports/extractor-port.ts`).
3. `runWalkerPipeline` already constructor-injects the walker, extractor, and emitter. The port seam
   is public from `@netscript/plugin/sdk`.
4. `AstExtractor` is the default `ExtractorPort`, but its builder-to-axis policy is a private
   constant. Its public `deno doc` surface has no constructor.
5. `startWalker(root)` always creates `new AstExtractor()` and exposes no options. The lower-level
   pipeline is extensible, while the default AST implementation and preset are closed.

These facts place the missing seam at the extractor boundary. A plugin manifest declaration would
cross boundaries: neither runtime `PluginManifest` nor static `PluginInstallerManifest` is supplied
to `runWalkerPipeline`, and `ManifestResolverPort` is not part of that pipeline. Transporting syntax
metadata through either manifest would require a broader resolver/host integration and validation
contract, not a narrow correction to the extractor's policy input.

## Hardcoded Enumeration Census

Production TypeScript was searched for the three factory names, `CONTRIBUTION_BUILDERS`, and named
official-plugin collections. Tests, generated blobs, and scaffold asset strings were separated from
production policy.

| Location                                                             | Enumeration                                                                               | Classification                                                                                   | Scope disposition                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `packages/plugin/src/sdk/discovery/ast-extractor.ts:4`               | `defineJob -> jobs`, `defineSaga -> sagas`, `defineWebhook -> triggers`                   | The only builder/factory-to-discovery-axis table in `packages/plugin`; it directly causes #1093. | In scope: retain as backward-compatible defaults and make the extractor accept additional mappings. |
| `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:292`   | `OFFICIAL_PLUGIN_RUNTIME_LOCAL_PATHS` for workers, sagas, and triggers runtime specifiers | Local-source scaffold/import path compatibility, not AST discovery.                              | Out of scope: owned by CLI/scaffold work and not required to open the extractor axis.               |
| `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts:188` | `OFFICIAL_PLUGIN_DIRS` containing sagas, streams, triggers, workers                       | Maintainer path rewriting for the monorepo's official source layout, not AST discovery.          | Out of scope: `packages/cli` is explicitly outside this leaf.                                       |

`SCAFFOLD_PACKAGES` and its import-resolver maps also name individual first-party package subpaths,
but they are package-resolution constants rather than a closed plugin discovery list. The
manifest-backed official-plugin source adapter discovers checked-in manifests rather than declaring
another fixed factory table. No second builder/factory table was found in `packages/plugin`.

## Consumer and Compatibility Findings

- The three official factories are asserted together in
  `packages/plugin/tests/sdk/walker-ports_test.ts`; the expected result has exactly the current
  jobs, sagas, and triggers contributions.
- Two CLI production consumers instantiate `new AstExtractor()` with no arguments:
  `packages/cli/src/public/features/plugins/list/list-plugins-command.ts` and
  `packages/cli/src/public/features/root/public-command-dependencies.ts`. Keeping the no-argument
  constructor behavior byte-for-behavior compatible protects them without a CLI edit.
- Package-level custom discovery can already inject an entirely custom `ExtractorPort`, but that
  forces third-party authors to reimplement official extraction or composition. Configuring the
  existing `AstExtractor` is the missing narrow seam.
- Automatic transport of a third-party descriptor from an installed plugin into those CLI callers is
  not present today. It is a separate host-integration concern and cannot be silently claimed by a
  `packages/plugin`-only leaf.

## Published Surface and MCP Corpus

- `@netscript/plugin` publishes `./sdk`; `AstExtractor`, `ExtractorPort`, `WalkedFile`,
  `runWalkerPipeline`, and `startWalker` are already on that public subpath.
- The planned seam needs a documented public descriptor/options type and adds an optional
  constructor/preset parameter. This is an additive published-surface change, not an internal-only
  refactor.
- The MCP export-surface generator consumes every package export map and serializes Deno-doc symbol
  signatures. Therefore a new exported type and the changed `AstExtractor`/`startWalker` signatures
  make `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` stale.
- `packages/mcp/**` is outside the locked ceiling. Corpus regeneration is a required coordination
  report to the supervisor, not work this leaf may absorb.

## Decisive Proof Shape

The decisive package test supplies a synthetic mapping such as
`{ callee: 'defineChannelSync', axis: 'channel-syncs' }`, scans a `WalkedFile` containing an
exported `defineChannelSync(...)` call, and receives that contribution without editing the private
official defaults. The same test (or an adjacent compatibility test) must also show the three
official factory mappings still work when no options are supplied. Merely adding a fourth row to the
private constant would leave the extension axis closed and does not satisfy #1093.

## Measured Base-Commit Gate Baselines

All commands below were run at `bd9d463b4480847dcd6f76efe5bc1e53bb926bec`. No package tests were
executed in S1 because the brief restricts this phase to static, package-level, read-only commands.

| Gate                 | Base command                                                                                                          | Exit | Exact baseline / S2 contract                                                                                                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ---: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped check         | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx`                  |    0 | 153 files, 2 batches, 0 failed batches, 0 findings. Must remain green.                                                                                                                                                                                                                                                 |
| Scoped lint          | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx`                   |    0 | 153 selected/processed, 0 dropped/refused, 0 findings. Must remain green.                                                                                                                                                                                                                                              |
| Scoped format        | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx`                    |    0 | 153 selected/processed, 0 findings. Must remain green.                                                                                                                                                                                                                                                                 |
| Full export doc-lint | `deno task doc:lint --root packages/plugin --pretty`                                                                  |    1 | **Pre-existing red:** 15 deduplicated `private-type-ref`, 0 `missing-jsdoc`, 0 other. File totals: `base-contract.ts` 10, `base-errors.ts` 1, `create-plugin-service.ts` 2, `plugin-contract-binder.ts` 2. Non-increase contract: total <=15, missing/other remain 0, and no diagnostic may point to an S2-owned file. |
| JSR/package audit    | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin --text` |    1 | **Pre-existing red:** 4 FAIL (missing `@module` on `./abstracts`, `./config`, `./cli`, `./testing`), 2 WARN (cardinality: `src` 17, `src/config/domain` 15), 1 INFO (sanctioned oRPC slow-type signal). Dry-run OK. Exact non-increase contract.                                                                       |
| Publish dry-run      | `deno task --cwd packages/plugin publish:dry-run`                                                                     |    0 | Pass; exactly 2 existing `unanalyzable-dynamic-import` warnings (`generated-project-registry.ts:69`, `manifest-resolver.ts:33`). No new warning class/count.                                                                                                                                                           |
| Code-quality scan    | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin --max-allow 0`                  |    0 | 0 findings, 0 allowances. Must remain green.                                                                                                                                                                                                                                                                           |
| Doctrine scan        | `deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --root packages/plugin --text`                |    0 | 0 FAIL, 3 WARN (README one TS fence; cardinality 17 and 15), 1 INFO (`docs/architecture.md` absent). Exact non-increase contract.                                                                                                                                                                                      |

Static inspection of `walker-ports_test.ts` measured five existing tests and an official-extractor
expectation containing exactly three results. S2 must execute the focused test through the
structured test wrapper; S1 deliberately did not execute it.

## jsr-audit Surface Scan

- Surface scanned: all 13 exports in `packages/plugin/deno.json`, with focused `deno doc` inspection
  of `./sdk` and `./protocol`.
- Metadata and export paths resolve; package dry-run passes.
- Existing risks are captured exactly above. The new descriptor/options types require JSDoc and
  explicit annotations so they add no `missing-jsdoc`, `private-type-ref`, or slow-type finding.
- The `./sdk` signature change moves the generated MCP export corpus even if symbol cardinality
  changes by only one.

## Open Questions Closed by the Plan

- **Where is the seam?** Extractor configuration, because source syntax-to-axis mapping is extractor
  policy and the manifest does not enter the walker pipeline.
- **Global registry or instance configuration?** Instance configuration. A module-global registry
  would introduce load-order/state leakage and still would not be populated merely by filesystem
  discovery.
- **Replace or extend official defaults?** Extend. Third-party mappings are additional; the no-arg
  path and three official mappings remain unchanged.
- **Does host/CLI transport belong here?** No. The package exposes the seam; automatic installed
  plugin-to-CLI transport requires a separately owned `packages/cli` decision.

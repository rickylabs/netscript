# Publish-source repair — independent IMPL-EVAL

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Reviewed source: **2372823dac8b6fb2d82605ac789276af4f45a335**. The retained separate Anthropic evaluator ran the exact owner command `claude -p --model claude-opus-5-5 --effort high`, read-only with closed stdin and only Read/Glob/Grep. Process exit0, successful response, observed model usage claude-opus-5-5; source head and clean checkout are unchanged before/after. No independent command execution or provider-side identity attestation is claimed. Private transcript identity stays outside tracked artifacts.

The supervisor accepts this source/local-proof verdict for the repair. It does NOT renew READY: the required CI quality job must succeed at the final pushed head after this evidence-only commit. Preserve that head and put CI proof in the external PR/issue handoff rather than moving it with another evidence commit.

## Substantive evaluator response

REVIEWED 2372823dac8b6fb2d82605ac789276af4f45a335

# Publish-source repair (issue #2415, PR #2468): PASS

The repair fully resolves Cockpit's Release preflight blocker. I found no new blockers.

## Why it passes
- **The banned imports are gone.**
  - `packages/fresh-ui/src/registry/fresh-ui-registry.ts` and `validate-registry.ts` now import plain TypeScript constants from `src/registry/assets/registry.generated.ts`.
  - The only JSON import attributes left in the package are under `scripts/` and `tests/`, which `publish.exclude` already leaves out of the published package.
- **The embedding follows the existing token pattern.** `scripts/embed-registry-assets.ts` matches `embed-token-assets.ts`:
  - It reads the authoritative JSON, gzips and base64-encodes it, and decodes it at runtime with `DecompressionStream`.
  - Output is formatted with `deno fmt` under the package config.
  - `--check` mode compares only and never writes.
  - The original `registry.json` and the two schema JSON files are unchanged.
- **Validation is still synchronous.** The schemas are typed as Ajv's `SchemaObject`, so `ajv.compile<Registry>` and `compile<RegistryItem>` still narrow `unknown` input. There are no casts or suppressions. `freshUiRegistryJson` is still validated when the module loads.
- **Stale output can't pass silently.**
  - In the root `check:assets-barrel`, the read-only `registry:embed:check` runs before `gen:assets-barrel` regenerates anything.
  - `gen:assets-barrel` regenerates the embedding, and the package has `registry:embed` / `registry:embed:check` tasks.
  - That check runs in the required CI quality job (assets-barrel gate) and in the generated-carriers workflow.
- **The negative tests are real.** `packages/fresh-ui/tests/registry-embeddings.test.ts`:
  - compares the catalog and both schemas with their JSON sources
  - in a separate copied fixture, shows that changing each of the three inputs makes `--check` fail with the file left unchanged
  - shows that a missing output fails without being recreated, and that regeneration restores the exact bytes and then passes
- **The public API is unchanged.**
  - `./registry` still exports `freshUiRegistryJson`, `REGISTRY_ITEM_TYPES`, the registry types and `freshUiRegistryManifest`.
  - `registry.manifest.ts` still exports the legacy projection that the `--registry-root` loader and design-sync read.
  - The package exports map is unchanged.
- **The published files changed only as intended.** The raw JSON copies were dropped from `publish.include`, and the README and the upstream MIT license are still included. Measured file set: 100 files, 2,341,743 bytes, down 114,063 from 102 files and 2,455,806 bytes before the repair. The existing 5,000,000-byte cap was not raised. I did not check or repeat the brief's "0.9 MB-class" description.

## Receipts I read (I ran nothing myself)
- **`release:preflight` before:** FAIL with exactly three findings, at `fresh-ui-registry.ts:1` and `validate-registry.ts:2-3`.
- **`release:preflight` after:** text imports, import attributes, file-URL `import.meta` and self-imports all PASS with 0 findings.
- **Durable receipts**, each recording git head `2372823…` with outcome PASS and exit 0:
  - quality-gate. The root quality gate now passes because the upstream unsafe-cast fix came in through the main merge.
  - assets-barrel
  - publish-assets
  - mcp-export-corpus
  - agent-docs-prose
  - publish-dry-run
- **Test reports:** S2 regressions 366/0/0, real CLI 3/0/0, focused embedding/schema 9/0/0, publish-size 1/0/0.
- **Wrappers:** structured check found 0 issues across the 5 selected files, and lint exits 0. The format report shows 0 findings; I didn't read the full contents of its refusals list.

## What this PASS does not cover
- **Required CI is still pending.** The required quality job must go green at the final checked head before READY can be renewed. This verdict doesn't certify that run or readiness.
- **Scaffold runtime is still unproven.** `scaffold.runtime --cleanup` remains unproven because the Docker daemon is unavailable, and this repair did not re-run it.
- **Doc-lint findings remain.** The full Fresh UI doc-lint still has the same 123 findings in component sources.

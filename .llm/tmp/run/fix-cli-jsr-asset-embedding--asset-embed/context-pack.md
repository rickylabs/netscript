# Context Pack — fix-cli-jsr-asset-embedding--asset-embed

## Current State

- Branch: `fix/cli-jsr-asset-embedding`
- PLAN-EVAL: waived by user for this slice.
- Active implementation order: S1, S2, S3 from `plan.md`.

## Completed

### S1 — CLI embedded registry + kill URL overload

- CLI template assets now have a generated import-attribute barrel:
  `packages/cli/src/kernel/assets/embedded.generated.ts`.
- `TemplateRegistry` is content-backed and no longer carries asset URLs or fetch hydration.
- `readTemplateAsset` and `readTemplateAssetSync` accept only `TemplateKey`.
- Service, database, plugin registry, and Windows env scaffolders now use keyed template reads.
- `deno.lock` has no intended S1 churn.

## Validation Evidence

- `run-deno-check.ts --root packages/cli --root packages/plugin --root packages/fresh-ui --ext ts,tsx`
  — PASS.
- `deno task check:assets-barrel` — PASS.
- Focused template tests — PASS, 4 tests.
- Explicit-file format wrapper for S1 files — PASS.
- Explicit-file lint with `no-import-prefix` excluded for existing test import style — PASS.

## Next

- S2: add embedded plugin skeleton content to `@netscript/plugin` and remove CLI
  `pluginTemplateRoot` / `import.meta.resolve('@netscript/plugin')`.
- S3: add embedded fresh-ui registry export and rewrite CLI UI install to consume content records.

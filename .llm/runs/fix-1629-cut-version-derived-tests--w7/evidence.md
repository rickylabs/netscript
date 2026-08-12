# Evidence — issue #1629

This file is append-only evidence for pre-fix discriminators, implementation gates, and the
disposable `0.0.7` release-cut rehearsal. Command output will be recorded untruncated.

## Pre-fix red — arbitrary coordinated bump

Disposable copy `/tmp/netscript-1629-prefix.6YQXIY/repo` at bootstrap commit `cb12adb29`:

```text
$ rtk proxy deno task release:cut -- 0.0.7 --dry-run
release:cut bumped 0.0.5 -> 0.0.7
Success Dry run complete
release:cut gate: deno ci --prod
release:cut dry-run complete; branch/commit/push/PR skipped.
exit: 0
```

The affected six-file test command exited 1:

```text
FAILED | 25 passed (50 steps) | 8 failed (5 steps) (5s)
error: Test failed
```

The version-derived discriminator failed on these exact pre-fix assertions:

```text
rejects a split root and subpath with every involved version
  actual: @netscript/fresh@0.0.7; expected substring: @netscript/fresh@0.0.5
fails closed on a non-exact closure member
  actual: non-exact version "^0.0.7"; expected substring: "^0.0.5"
generateAppDenoJson / rejects an incoherent resolver result before serializing the app manifest
  actual: @netscript/fresh@0.0.7; expected substring: @netscript/fresh@0.0.5
generateAppDenoJson / rejects a non-exact closure member at init
  actual: non-exact version "^0.0.7"; expected substring: "^0.0.5"
generated closure verifier rejects split JSR identities with version-bearing output
  actual: @netscript/fresh@0.0.7; expected substring: @netscript/fresh@0.0.5
generated closure verifier fails closed on a range pin
  actual: non-exact version "^0.0.7"; expected substring: "^0.0.5"
```

## Pre-fix red — unpublished resolution and strictness guard

The same bumped-copy command failed before the combined local-resolution/strictness path could
reach its missing-export guard:

```text
first-party control-plane modules are import-safe and preserve application barrels
  failed assertion: inspection.success
  cause: @netscript/plugin-ai@0.0.7 does not exist on JSR
installs the AI markdown registry closure into its generated namespace
  failed assertion: check.code === 0
  cause: @netscript/ai@0.0.7 does not exist on JSR
keeps the configured AI module resolvable across a forced reinstall
  failed assertion: loadRegisteredPlugins completes
  cause: @netscript/plugin-ai@0.0.7 does not exist on JSR
keeps the plugin-owned AI namespace configured in local-source installs
  failed assertion: check.code === 0
  cause: @netscript/fresh@0.0.7 does not exist on JSR
```

The strictness discriminator is ordered after local map construction. Pre-fix, the local-resolution
assertion above fails first. Post-fix, `cut-local imports fail closed when a first-party export
target is missing` reaches and requires `Deno.errors.NotFound`. Existing published-identity guards
continue to require thrown errors for non-exact and split JSR identities.

## Targeted green — version-derived assertions

```text
rejects a split root and subpath with every involved version ... ok
fails closed on a non-exact closure member ... ok
generated closure verifier rejects split JSR identities with version-bearing output ... ok
generated closure verifier fails closed on a range pin ... ok
generateAppDenoJson ... ok
```

## Targeted green — cut-local resolution and fail-closed guard

```text
$ deno test --allow-all packages/cli/tests/support/local-workspace-imports_test.ts \
  packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure_test.ts \
  packages/cli/src/kernel/templates/app/generators-config_test.ts \
  packages/cli/src/kernel/templates/workspace/dependency-closure-verifier_test.ts \
  packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts \
  packages/cli/src/public/features/plugins/install/install-plugin_test.ts \
  packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts
first-party control-plane modules are import-safe and preserve application barrels ... ok
installs the AI markdown registry closure into its generated namespace ... ok
keeps the configured AI module resolvable across a forced reinstall ... ok
keeps the plugin-owned AI namespace configured in local-source installs ... ok
cut-local imports fail closed when a first-party export target is missing ... ok
ok | 34 passed (55 steps) | 0 failed (18s)
exit: 0
```

The helper derives aliases from every actual `packages/*` and `plugins/*` manifest export, carries
the root workspace import/catalog contract into the temporary project, and calls `Deno.stat` on
each export target. It therefore cannot convert a real missing first-party package/export into a
green result.

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w7","mode":"check","summary":{"filesSelected":878,"batches":5,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit: 0
```

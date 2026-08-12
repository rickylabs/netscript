# Evidence — issue #1629

This file records pre-fix discriminators, implementation gates, and the disposable `0.0.7`
release-cut rehearsal. Every verdict block below includes the complete command summary and exit
status; no verdict line is elided.

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
plugin install ai --no-samples omits samples and type-checks the generated workspace
  failed assertion: run(...) completes
  cause: @netscript/config@0.0.7 does not exist on JSR
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

The standalone plugin-owned cut fixture is green after applying the same local mapping before the
install command reads generated project configuration:

```text
$ deno test --allow-all plugins/ai/tests/adapter/no-samples-install_test.ts
Check plugins/ai/tests/adapter/no-samples-install_test.ts
running 1 test from ./plugins/ai/tests/adapter/no-samples-install_test.ts
plugin install ai --no-samples omits samples and type-checks the generated workspace ... ok (2s)

ok | 1 passed | 0 failed (2s)
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

## Final requested gates

All commands ran from `/home/codex/repos/ns006-w7` at final implementation commit `cce0f01e6`.

```text
$ rtk proxy deno task check
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w7"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2917,"batches":25,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit: 0

$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w7","exitCode":0},"selection":{"filesSelected":2034,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
exit: 0

$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w7","mode":"check","summary":{"filesSelected":2034,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit: 0

$ rtk proxy deno task quality:gate
Task quality:gate deno task quality:scan && deno task arch:check
{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins","docs/site"],"findings":[],"allowCount":7}
arch:check: PASS (all roots; zero FAIL findings; existing WARN/INFO diagnostics retained)
exit: 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w7"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":878,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit: 0
```

The full live-tree test gate completed before the last two-line fixture hookup; that hookup then
passed its focused test above, and the final bumped-tree full suite below exercises the complete
final implementation:

```text
$ rtk proxy deno task test
ok | 3386 passed (624 steps) | 0 failed | 17 ignored (3m19s)
exit: 0
```

## Decisive disposable 0.0.7 proof

Fresh no-hardlink clone: `/tmp/netscript-1629-final.EefZ2l/repo`, cloned from final implementation
commit `cce0f01e6`. No command in this section targeted the working tree or the live `0.0.6` cut.

```text
$ rtk proxy deno task release:cut -- 0.0.7 --dry-run
release:cut bumped 0.0.5 -> 0.0.7
release:cut gate: gen:publish-assets
release:cut gate: gen:mcp-export-corpus
{"schemaVersion":1,"frameworkVersion":"0.0.7","packageCount":35,"subpathCount":270,"symbolCount":7602}
release:cut gate: gen:assets-barrel
release:cut gate: publish:readiness
release:preflight text-imports — PASS
release:preflight import-attributes — PASS (0 findings)
release:preflight file-url-import-meta — PASS (0 findings)
release:preflight self-imports — PASS (0 findings)
{"gate":"publish-readiness","id":"publish-set","status":"PASS","summary":"35 effective members match workspace declarations"}
{"gate":"publish-readiness","id":"markdown-pins","status":"PASS","summary":"no stale NetScript version pins","details":[]}
{"gate":"publish-readiness","id":"lockstep-residue","status":"PASS","summary":"all release version surfaces are 0.0.7","details":[]}
{"gate":"publish-readiness","id":"versionless-specifiers","status":"PASS","summary":"2359 framework source files carry only versioned, current NetScript JSR specifiers"}
{"gate":"publish-readiness","id":"new-packages","status":"PASS","summary":"0 first-publish package(s) detected from JSR metadata"}
{"gate":"publish-readiness","id":"first-publish","status":"PASS","summary":"0 first-publish package(s) satisfy the production checklist"}
{"gate":"publish-readiness","id":"provisioning-dry-check","status":"PASS","summary":"no new packages require provisioning"}
{"gate":"publish-readiness","id":"import-attribute-preflight","status":"PASS","summary":"canonical release:preflight passed"}
{"gate":"publish-readiness","ok":true,"version":"0.0.7"}
release:cut gate: publish:dry-run
Success Dry run complete
release:cut dry-run complete; branch/commit/push/PR skipped.
exit: 0

$ rtk proxy deno task test
first-party control-plane modules are import-safe and preserve application barrels ... ok (13s)
plugin install ai --no-samples omits samples and type-checks the generated workspace ... ok
installs the AI markdown registry closure into its generated namespace ... ok
keeps the configured AI module resolvable across a forced reinstall ... ok
keeps the plugin-owned AI namespace configured in local-source installs ... ok
rejects a split root and subpath with every involved version ... ok
fails closed on a non-exact closure member ... ok
generated closure verifier rejects split JSR identities with version-bearing output ... ok
generated closure verifier fails closed on a range pin ... ok
ok | 3386 passed (624 steps) | 0 failed | 17 ignored (4m33s)
exit: 0
```

This proves an arbitrary coordinated bump survives both failure classes. Published-consumer
strictness is unchanged: the range and split-identity cases above still assert rejection, and the
local import mapper's missing-target test still requires `Deno.errors.NotFound`.

## Lock hygiene

```text
$ git diff --stat origin/main...HEAD -- deno.lock packages/fresh-ui/deno.lock
(no output)
exit: 0
```

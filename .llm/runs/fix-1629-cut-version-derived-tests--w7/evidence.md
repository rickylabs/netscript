# Evidence — issue #1629

This file records pre-fix discriminators, implementation gates, and the disposable `0.0.7`
release-cut rehearsal. Every verdict block below includes the complete command summary and exit
status; no verdict line is elided.

## Provenance correction

The line `Release version coherence: FAIL (expected 0.0.5; 3 of 3 manifests mismatch)` is not a
release-cut failure. It is expected post-test output from the passing negative control `release
version coherence reports every coordinated manifest mismatch` in
`.llm/tools/release/assert-release-version_test.ts`. This slice does not modify that test, its
intentional `0.0.4`/`0.0.5` data, or the coherence mechanism.

## Version-literal scope audit

| Location | Touched literal | Why derived or fixed |
| --- | --- | --- |
| `netscript-web-runtime-closure_test.ts` split diagnostic | active `fresh` and version-list expectations | Derived: the corresponding fixture inputs call `jsr(..., NETSCRIPT_RELEASE_VERSION)`; the fixed `0.0.6-canary.3` mismatch side remains unchanged. |
| `netscript-web-runtime-closure_test.ts` range diagnostic | `^<active>` expectation | Derived: the input constructs the range from `NETSCRIPT_RELEASE_VERSION`. |
| `generators-config_test.ts` split and range diagnostics | active-side expectations | Derived: the injected resolver constructs those exact inputs from `NETSCRIPT_RELEASE_VERSION`; fixed canary data remains unchanged. |
| `dependency-closure-verifier_test.ts` split and range diagnostics | active-side expectations | Derived: the generated verifier fixture inputs use `NETSCRIPT_RELEASE_VERSION`; fixed canary data remains unchanged. |
| `dependency-closure-verifier_test.ts` coherent local graph | fixed `0.0.5` input and output | Fixed: this isolated synthetic graph tests coherence for arbitrary local data, not the checkout release. Restored unchanged after refinement audit. |
| `.llm/tools/release/assert-release-version_test.ts` | fixed `0.0.4`/`0.0.5` mismatch controls | Fixed and untouched: these literals define the passing negative control cited in the provenance correction. |

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

One shared test-only seam, `useLocalWorkspaceImports`, serves every affected family. Call-site
ordering was audited after the orchestrator refinement:

| Affected path | Seam placement before execution that resolves first-party imports |
| --- | --- |
| control-plane module probe | once, immediately after fixture import-map creation and before the mutator/config/plugin flow; durable through module loading |
| public AI registry closure | once, immediately after project creation and before install; durable through generated-source import resolution and `deno check` |
| public forced reinstall | once, immediately after project creation and before install; durable through both installs, `loadConfig`, and `loadRegisteredPlugins` |
| local contributor install | once, immediately after project/config creation and before install; durable through both installs and generated route `deno check` |
| AI `--no-samples` CLI integration | before the install command, hence before install-time config/plugin loading |

The seam lives only under `packages/cli/tests/support/` and is imported only by test modules; no
consumer or product code path calls it. No exit-78 or named-exclusion behavior was introduced.

The contract is exactly one early seam installation per temporary project, before config and plugin
loading, durable through to use. A second call on the same normalized project root throws. The
focused persistence guard installs once, rewrites unrelated project configuration, and then imports
both a config package and a plugin package through the preserved local aliases. Dropping the seam or
overwriting its imports therefore fails instead of reaching the registry or being repaired by a
later call.

## Replacement focused gate — retired session 15574

The first focused gate's unified-exec buffer was retired before its terminal verdict could be
collected. The orchestrator authorized exactly one replacement run. This is the complete,
untruncated output of that replacement command:

```text
$ NO_COLOR=1 deno test --allow-all packages/cli/tests/support/local-workspace-imports_test.ts packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts packages/cli/src/public/features/plugins/install/install-plugin_test.ts
running 1 test from ./packages/cli/src/public/features/plugins/install/install-plugin_test.ts
public install plugin flow ...
  threads includeSamples false into the workers scaffolder ... ok (71ms)
  threads includeSamples false into the sagas scaffolder ... ok (65ms)
  threads includeSamples false into the triggers scaffolder ... ok (61ms)
  threads includeSamples false into the streams scaffolder ... ok (67ms)
  plans a starter plugin request from project metadata ... ok (0ms)
  preserves a jsr:-prefixed exact canary through validation, scaffold dispatch, and generated state ... ok (7ms)
  preserves a prefixless exact canary through validation, scaffold dispatch, and generated state ... ok (1ms)
  rejects a configured service-less plugin without appsettings or a conventional plugin directory ... ok (0ms)
  rejects an unresolvable plugin (no JSR/local descriptor) instead of CLI-side rendering ... ok (1ms)
  rejects a resolvable plugin when no process runner can dispatch its scaffolder ... ok (1ms)
  installs a published Prisma fragment from JSR metadata into the root schema tree ... ok (3ms)
  rejects a DB-required JSR plugin that declares migrations without a published fragment ... ok (1ms)
  previews a local-path plugin-owned scaffolder without writing files ... ok (35ms)
  installs and links the fixture third-party plugin without officialSource or CLI branches ... ok (30ms)
  installs the AI markdown registry closure into its generated namespace ... ok (2s)
  keeps the configured AI module resolvable across a forced reinstall ... ok (233ms)
  derives plugin-owned service and background workdirs from existing files after a skipped scaffold ... ok (2ms)
  adds workers from the real local-path plugin-owned scaffolder ... ok (64ms)
  previews the real workers local-path scaffolder without writing files ... ok (52ms)
  reruns the real workers scaffolder idempotently ... ok (110ms)
  runs the real sagas local-path scaffolder through plugin install ... ok (62ms)
  previews the real sagas local-path scaffolder without writing files ... ok (57ms)
  reruns the real sagas scaffolder idempotently ... ok (110ms)
  runs the real triggers local-path scaffolder through plugin install ... ok (60ms)
  previews the real triggers local-path scaffolder without writing files ... ok (63ms)
  reruns the real triggers scaffolder idempotently ... ok (111ms)
  runs the real streams local-path scaffolder through plugin install ... ok (63ms)
  previews the real streams local-path scaffolder without writing files ... ok (49ms)
  reruns the real streams scaffolder idempotently ... ok (124ms)
  reconciles dependency-derived plugin references independently of install order ... ok (420ms)
  runs the real auth local-path scaffolder through plugin install ... ok (65ms)
  previews the real auth local-path scaffolder without writing files ... ok (51ms)
  reruns the real auth scaffolder idempotently ... ok (103ms)
public install plugin flow ... ok (5s)
running 1 test from ./packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts
local contributor install plugin flow ...
  writes starter plugin files with local imports for non-canonical plugin names ... ok (4ms)
  renders canonical plugins without copying source when no local path is supplied ... ok (1ms)
  writes thin local-import stubs for canonical plugins when source copy is disabled ... ok (1ms)
  keeps the plugin-owned AI namespace configured in local-source installs ... ok (1s)
  skips the target generated project when discovering the official plugin source root ... ok (0ms)
local contributor install plugin flow ... ok (1s)
running 19 tests from ./packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts
PluginWorkspaceMutator ensures plugins root and plugin packages are workspace members ... ok (1ms)
PluginWorkspaceMutator injects first-party plugin core imports into root deno config ... ok (797µs)
root-level scaffold runtime imports resolve in both package-source modes ... ok (2ms)
PluginWorkspaceMutator registers background plugins with companion API service ... ok (356µs)
PluginWorkspaceMutator omits appsettings entries for service-less plugins ... ok (127µs)
PluginWorkspaceMutator honors absolute local source service entrypoints ... ok (284µs)
PluginWorkspaceMutator keeps package id separate from the instance name ... ok (284µs)
PluginWorkspaceMutator writes saga store backend appsettings for saga plugins ... ok (164µs)
PluginWorkspaceMutator provisions shared Garnet cache when missing ... ok (179µs)
PluginWorkspaceMutator reuses existing shared cache entry ... ok (82µs)
PluginWorkspaceMutator appends project-local plugin config specs ... ok (374µs)
PluginWorkspaceMutator registers generated plugin glue entrypoints ... ok (134µs)
PluginWorkspaceMutator rejects a missing configured plugin module ... ok (509µs)
PluginWorkspaceMutator removes exactly one plugin instance from netscript config ... ok (272µs)
PluginWorkspaceMutator removes generated root-level plugin glue declarations ... ok (83µs)
first-party control-plane modules are import-safe and preserve application barrels ... ok (12s)
first-party generated namespaces have complete imports in JSR and local-source modes ... ok (4ms)
PluginWorkspaceMutator writes no ai kind-source jsr pins into local-source projects ... ok (224µs)
PluginWorkspaceMutator rewrite map covers every @netscript/telemetry export subpath ... ok (332µs)
running 2 tests from ./packages/cli/tests/support/local-workspace-imports_test.ts
cut-local imports fail closed when a first-party export target is missing ... ok (5ms)
cut-local imports install once and survive until config and plugin loading ... ok (19ms)

ok | 23 passed (38 steps) | 0 failed (18s)

exit: 0
```

After moving the single seam installation to project creation, the affected install/config/plugin
families remain green:

```text
$ deno test --allow-all <five local-resolution test modules>
installs the AI markdown registry closure into its generated namespace ... ok
keeps the configured AI module resolvable across a forced reinstall ... ok
keeps the plugin-owned AI namespace configured in local-source installs ... ok
first-party control-plane modules are import-safe and preserve application barrels ... ok
cut-local imports fail closed when a first-party export target is missing ... ok
plugin install ai --no-samples omits samples and type-checks the generated workspace ... ok
ok | 23 passed (38 steps) | 0 failed (25s)
exit: 0
```

Refinement audit gate after restoring the intentional fixed local-graph fixture:

```text
$ deno test --allow-all <eight affected test modules>
generated closure verifier rejects split JSR identities with version-bearing output ... ok
generated closure verifier fails closed on a range pin ... ok
generated closure verifier accepts one coherent local package graph ... ok
first-party control-plane modules are import-safe and preserve application barrels ... ok
installs the AI markdown registry closure into its generated namespace ... ok
keeps the configured AI module resolvable across a forced reinstall ... ok
keeps the plugin-owned AI namespace configured in local-source installs ... ok
cut-local imports fail closed when a first-party export target is missing ... ok
plugin install ai --no-samples omits samples and type-checks the generated workspace ... ok
ok | 35 passed (55 steps) | 0 failed (22s)
exit: 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --root plugins/ai --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w7","mode":"check","summary":{"filesSelected":917,"batches":5,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit: 0
```

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w7","mode":"check","summary":{"filesSelected":878,"batches":5,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit: 0
```

## Final requested gates

The static and fitness commands below were rerun from `/home/codex/repos/ns006-w7` at refined
implementation commit `175725981` after the shared seam was moved to temporary-project creation.

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

The static/fitness commands were rerun after the owner refinement with the same verdicts: check
2917 files / 25 batches / 0 diagnostics; lint 2034 files / 0 findings; format 2034 files / 0
findings; focused CLI check 878 files / 8 batches / 0 diagnostics; `quality:gate` exit 0 with no
new quality findings and no architecture FAIL findings.

The full live-tree test gate completed before the last two-line fixture hookup; that hookup then
passed its focused test above, and the final bumped-tree full suite below exercises the complete
final implementation:

```text
$ rtk proxy deno task test
ok | 3386 passed (624 steps) | 0 failed | 17 ignored (3m19s)
exit: 0
```

## Decisive disposable 0.0.7 proof

Fresh no-hardlink clone: `/tmp/netscript-1629-final-refine.ku78HE/repo`, cloned from refined
implementation commit `175725981`. No command in this section targeted the working tree or the live
`0.0.6` cut.

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
ok | 3386 passed (624 steps) | 0 failed | 17 ignored (3m49s)
exit: 0
```

This proves an arbitrary coordinated bump survives both failure classes. Published-consumer
strictness is unchanged: the range and split-identity cases above still assert rejection, and the
local import mapper's missing-target test still requires `Deno.errors.NotFound`.

The same exact-head full run also executed the untouched release-coherence negative control. Its
deliberate `Release version coherence: FAIL ...` post-test output was followed by `... ok`; both
coherence tests passed. That confirms the provenance correction without changing the negative
fixture's meaning.

## Lock hygiene

```text
$ git diff --stat origin/main...HEAD -- deno.lock packages/fresh-ui/deno.lock
(no output)
exit: 0
```

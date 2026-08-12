# Evidence — W2-F exact canary plugin install (#1456)

Date: 2026-08-12

## Verdict

PASS. Both exact JSR spellings retain `0.0.6-canary.2` from input through static validation,
plugin-owned scaffold dispatch, generated import/appsettings state, and persisted plugin manifest.
The live JSR negative control reports stable `latest: 0.0.5`, so the exact canary result cannot be
a false positive caused by equality with `latest`.

## Regression test: red before green

The red run was reproduced in an isolated detached worktree at the recorded baseline
`3c9dc1f3907c605d2d30d76f5a20ade1e4754736`, with only the resolver and validator regression
tests applied. The detached worktree was removed after capture.

Command:

```text
deno test --allow-all packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts
```

Exit: `1`

Complete output:

```text
╭ Warning
│
│  Ignored build scripts for packages:
│  npm:lmdb@3.5.5
│  npm:msgpackr-extract@3.0.4
│
│  Lifecycle scripts are only supported when using a `node_modules` directory.
│  Enable it in your deno config file:
│  "nodeModulesDir": "auto"
╰─
Check packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts
Check packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts
running 1 test from ./packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts
resolvePluginPackageSpec ...
  resolves bare aliases to verified NetScript plugin packages ... ok (0ms)
  resolves the AI bare alias to the published NetScript AI plugin package ... ok (0ms)
  passes scoped package names through unchanged ... ok (0ms)
  passes explicit JSR package specs through unchanged ... ok (0ms)
  preserves an exact version from a jsr:-prefixed package spec ... FAILED (1ms)
  preserves an exact version from a prefixless package spec ... FAILED (1ms)
  rejects malformed package specs ... ok (1ms)
resolvePluginPackageSpec ... FAILED (due to 2 failed steps) (8ms)
running 1 test from ./packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts
FetchJsrPluginValidator ...
  returns a validated plugin descriptor for a published NetScript manifest ... ok (3ms)
  installs the CLI's own release version rather than latest ... ok (0ms)
  preserves an explicit exact version when stable latest differs ... FAILED (1ms)
  resolves the semver-greatest prerelease when JSR latest is null ... ok (1ms)
  skips yanked versions when falling back from null latest ... ok (0ms)
  reports invalid metadata when no non-yanked version is installable ... ok (1ms)
  reports missing JSR packages as not found ... ok (0ms)
  reports yanked latest versions ... ok (0ms)
  reports packages that do not publish scaffold.plugin.json ... ok (0ms)
  reports invalid plugin manifests without executing package code ... ok (1ms)
FetchJsrPluginValidator ... FAILED (due to 1 failed step) (14ms)

ERRORS

resolvePluginPackageSpec ... preserves an exact version from a jsr:-prefixed package spec
error: Error: Invalid JSR plugin package spec "jsr:@acme/plugin-billing@0.0.6-canary.2". Expected @scope/package.
    at toResolvedPackageSpec (packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:67:11)
    at resolvePluginPackageSpec (packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:49:12)
    at Object.<anonymous> (packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts:48:24)
    at TestSuiteInternal.runTest (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:437:16)
    at TestSuiteInternal.runTest (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:425:33)
    at fn (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:386:37)

resolvePluginPackageSpec ... preserves an exact version from a prefixless package spec
error: Error: Invalid JSR plugin package spec "@acme/plugin-billing@0.0.6-canary.2". Expected @scope/package.
    at toResolvedPackageSpec (packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:67:11)
    at resolvePluginPackageSpec (packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:56:10)
    at Object.<anonymous> (packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts:48:24)
    at TestSuiteInternal.runTest (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:437:16)
    at TestSuiteInternal.runTest (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:425:33)
    at fn (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:386:37)

FetchJsrPluginValidator ... preserves an explicit exact version when stable latest differs
error: Error: Invalid JSR plugin package spec "jsr:@netscript/plugin-workers@0.0.6-canary.2". Expected @scope/package.
    at toResolvedPackageSpec (packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:67:11)
    at resolvePluginPackageSpec (packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:49:12)
    at Object.<anonymous> (packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts:82:7)
    at TestSuiteInternal.runTest (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:437:16)
    at TestSuiteInternal.runTest (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:425:33)
    at fn (https://jsr.io/@std/testing/1.0.19/_test_suite.ts:386:37)

FAILURES

resolvePluginPackageSpec ... preserves an exact version from a jsr:-prefixed package spec
resolvePluginPackageSpec ... preserves an exact version from a prefixless package spec
FetchJsrPluginValidator ... preserves an explicit exact version when stable latest differs

FAILED | 0 passed (14 steps) | 2 failed (3 steps) (120ms)

error: Test failed
```

## Focused green proof

Command:

```text
deno test --allow-all packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts packages/cli/src/public/features/plugins/install/install-plugin_test.ts
```

Exit: `0`

Complete terminal result:

```text
resolvePluginPackageSpec ...
  preserves an exact version from a jsr:-prefixed package spec ... ok (0ms)
  preserves an exact version from a prefixless package spec ... ok (0ms)
resolvePluginPackageSpec ... ok (6ms)
public install plugin flow ...
  preserves a jsr:-prefixed exact canary through validation, scaffold dispatch, and generated state ... ok (8ms)
  preserves a prefixless exact canary through validation, scaffold dispatch, and generated state ... ok (1ms)
public install plugin flow ... ok (3s)
FetchJsrPluginValidator ...
  installs the CLI's own release version rather than latest ... ok (1ms)
  preserves an explicit exact version when stable latest differs ... ok (0ms)
FetchJsrPluginValidator ... ok (13ms)

ok | 3 passed (50 steps) | 0 failed (4s)
```

All unchanged test steps in the three suites also passed; the complete Deno terminal verdict above
is the authoritative aggregate.

## Live JSR negative control

Command:

```text
deno eval '<instantiate FetchJsrPluginValidator; validate jsr:@netscript/plugin-ai@0.0.6-canary.2; print resolved identities>'
```

Exit: `0`

Complete output:

```json
{
  "requested": "jsr:@netscript/plugin-ai@0.0.6-canary.2",
  "stableLatest": "0.0.5",
  "validatedVersion": "0.0.6-canary.2",
  "manifest": "@netscript/plugin-ai@0.0.6-canary.2",
  "scaffoldTarget": "jsr:@netscript/plugin-ai@0.0.6-canary.2/scaffold"
}
```

This query uses JSR's live package metadata through the product validator. The differing
`stableLatest` and `validatedVersion` prove an explicit version is not replaced by the registry
stable channel.

## Required gates

### `rtk proxy deno task check`

Exit: `0`

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w2-1456"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2879,"batches":24,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task test`

Exit: `0`

```text
ok | 3233 passed (622 steps) | 0 failed | 17 ignored (4m17s)
```

### `rtk proxy deno task lint`

Exit: `0`

```json
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w2-1456","exitCode":0},"selection":{"filesSelected":2013,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task fmt:check`

Exit: `0`

```json
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w2-1456","mode":"check","summary":{"filesSelected":2013,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
```

### Scoped CLI check

Command:

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
```

Exit: `0`

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w2-1456"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":861,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task quality:gate`

Exit: `0`

```text
Task quality:gate deno task quality:scan && deno task arch:check
{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7}
All doctrine checks completed with FAIL=0.
```

The gate printed existing repository warnings and seven pre-existing, reasoned allowances; it
reported no finding in this change and exited successfully.

## Additional package gates

### `deno task doc:lint --root packages/cli --pretty`

Exit: `0`

```json
{"summary":{"totalPackages":1,"totalErrors":0,"totalPrivateTypeRef":0,"totalMissingJSDoc":0,"totalOther":0}}
```

### `deno task --cwd packages/cli publish:dry-run`

Exit: `0`

```text
Simulating publish of @netscript/cli@0.0.5
Success Dry run complete
```

The dry run retained the package's existing dynamic-import warnings and completed successfully.

### Changed-diff quality scan

Command:

```text
git diff --unified=0 | rg '^\+.*(deno-lint-ignore|as unknown as|@ts-ignore)' || true
```

Exit: `0`

Complete output: empty — no newly added suppression, double assertion, or TypeScript ignore.

### Whitespace and lock hygiene

`git diff --check` exited `0`. `deno.lock` is unchanged and is not part of the diff.

## Acceptance mapping

- [x] `--jsr-url jsr:@scope/pkg@version` is accepted and installs exactly that version.
- [x] `--jsr-url @scope/pkg@version` is accepted and installs exactly that version.
- [x] Unversioned aliases and scoped/JSR package forms retain the prior resolution path.
- [x] Explicit `0.0.6-canary.2` wins over live stable `latest: 0.0.5`.
- [x] Exact version reaches validator descriptor, `/scaffold` process target, root dependency,
  appsettings service target, and installed `scaffold.plugin.json`.
- [x] Regression coverage is red on the baseline and green with the fix.

## Scope note

`scaffold.runtime` was not started, per the slice instruction.

## PR and evaluator

- PR: https://github.com/rickylabs/netscript/pull/1579
- Implementation commit: `f4657d6aca3b458b700d1af5dce00b76330bb749`
- Evaluated head after the required main re-sync:
  `b80e56249bd857e31814d6640b9665639e24046f`
- Automatic IMPL-EVAL: `PASS`
- Evaluator run: https://github.com/rickylabs/netscript/actions/runs/31602734057
- Review-thread gate: `PASS`; 0 threads, 0 unanswered.
- PR state at handoff: open, ready for review, mergeable/clean, exactly one status label
  (`status:augment-review`), milestone `0.0.6`; not merged.

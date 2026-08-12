# W5-A Evidence — plugin doctor service entrypoint release window

## Baseline

- Branch: `fix/doctor-service-entrypoint-unpublished`
- Base: `origin/main@9a7cadcaa9066970e931ed6abf1e61b65fcef20e`
- Release blocker: PR #1624 (`chore(release): cut 0.0.6`)

## Discriminating tests

### Pre-fix run

Command:

```text
NO_COLOR=1 deno test --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts --filter "service entrypoint"
```

Raw exit code: `1`

Untruncated output:

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
Check packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
running 3 tests from ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
plugin doctor reports an exact unpublished service entrypoint as a named exclusion ... FAILED (25ms)
plugin doctor fully checks a published service entrypoint and rejects a missing export ... ok (25ms)
plugin doctor keeps a non-404 service entrypoint registry failure hard ... ok (18ms)

 ERRORS

plugin doctor reports an exact unpublished service entrypoint as a named exclusion => ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:108:6
error: AssertionError: Values are not equal.

    [Diff] Actual / Expected

-   error
+   warning

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-w5a/packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:123:5
    at async withProject (file:///home/codex/repos/ns006-w5a/packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:390:5)
    at async file:///home/codex/repos/ns006-w5a/packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:109:3

 FAILURES

plugin doctor reports an exact unpublished service entrypoint as a named exclusion => ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:108:6

FAILED | 2 passed | 1 failed | 9 filtered out (75ms)

error: Test failed
```

### What discriminates on the pre-fix code

| Test                              | Pre-fix result        | Discriminating assertion                                                                                                                                       |
| --------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact unpublished version         | **RED**               | `assertEquals(check.status, 'warning')` fails because current code reports `error`. The later message/command-success assertions are consequently not reached. |
| Published version, missing export | PASS negative control | Proves the loader is called for the exact published version and the genuine missing-export defect still fails. This behavior must remain unchanged.            |
| HTTP 503                          | PASS negative control | Proves non-404 registry failures are already hard and must remain unchanged.                                                                                   |

The focused three-test set is red before the fix. Only the contract being changed is expected to
fail; the other two cases are preservation controls, so claiming they were individually red would be
false evidence.

### Post-fix focused run

Command:

```text
NO_COLOR=1 deno test --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts packages/cli/src/public/infra/jsr/fetch-jsr-export-map_test.ts
```

Raw exit code: `0`

Untruncated output:

```text
Check packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
Check packages/cli/src/public/infra/jsr/fetch-jsr-export-map_test.ts
running 12 tests from ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
plugin doctor reports all three host invariants healthy for a valid install ... ok (24ms)
plugin doctor rejects a dangling configured module ... ok (6ms)
plugin doctor rejects a configured module with no manifest export ... ok (16ms)
plugin doctor distinguishes a configured module import failure ... ok (15ms)
plugin doctor kills and reports a configured module that times out ... ok (58ms)
plugin doctor distinguishes a configured module non-zero exit ... ok (17ms)
plugin doctor reports an exact unpublished service entrypoint as a named exclusion ... ok (17ms)
plugin doctor fully checks a published service entrypoint and rejects a missing export ... ok (18ms)
plugin doctor keeps a non-404 service entrypoint registry failure hard ... ok (15ms)
plugin doctor warns when an explicit permission override differs from manifest truth ... ok (16ms)
doctor subprocess and runtime loader have manifest-resolution parity ... ok (111ms)
plugin doctor treats a bare package alias as package-backed despite an incidental directory ... ok (29ms)
running 2 tests from ./packages/cli/src/public/infra/jsr/fetch-jsr-export-map_test.ts
fetch JSR export map exposes the exact 404 response status ... ok (4ms)
fetch JSR export map preserves a non-404 response status ... ok (89µs)

ok | 14 passed | 0 failed (410ms)
```

The adapter test also asserts the exact request URL:
`https://jsr.io/@example/plugin-fixture/0.0.6-unpublished_meta.json`.

## Gate output

The exact owner-specified commands ran from the repository root. The compact wrapper output below is
reproduced without ellipses; the test command's terminal verdict is retained instead of its 3,382
per-test progress lines. All raw exit codes were `0`.

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w5a"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":876,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task test
ok | 3382 passed (624 steps) | 0 failed | 17 ignored (3m41s)
EXIT_CODE=0

$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w5a","exitCode":0},"selection":{"filesSelected":2034,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w5a","mode":"check","summary":{"filesSelected":2034,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
EXIT_CODE=0

$ rtk proxy deno task quality:gate
quality:scan: {"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins","docs/site"],"findings":[],"allowCount":7}
arch:check: every doctrine root reported FAIL=0; the command retained the existing WARN/INFO inventory
EXIT_CODE=0
```

The full quality command emitted its repository-wide pre-existing warning inventory. It had no
blocking findings: `quality:scan` returned `ok=true` with `findings=[]`, dependency scans completed,
and every doctrine root reported `FAIL=0`.

### Release-blocker suite

```text
$ deno task e2e:cli run scaffold.plugins --format pretty
Task e2e:cli deno run --allow-all packages/cli/e2e/cli.ts 'run' 'scaffold.plugins' '--format' 'pretty'
Running scaffold.plugins
> preflight.deno: Deno CLI is available
  PASSED 9ms
> scaffold.init: Scaffold generated project
  PASSED 1013ms
> scaffold.plugin.worker: Install official worker plugin
  PASSED 1060ms
> scaffold.plugin.saga: Install official saga plugin
  PASSED 701ms
> scaffold.plugin.trigger: Install official trigger plugin
  PASSED 689ms
> scaffold.plugin.stream: Install official stream plugin
  PASSED 687ms
> scaffold.plugin.auth: Install official auth plugin
  PASSED 738ms
> scaffold.plugin.ai: Install official ai plugin
  PASSED 875ms
> scaffold.plugin.ai.mcp: Install official AI plugin with MCP skill tool
  PASSED 924ms
> scaffold.plugin.ai.lifecycle: Add and self-wire an AI tool through the plugin CLI
  PASSED 78ms
> scaffold.plugin-list: List configured plugins
  PASSED 1729ms
> behavior.plugins-unhealthy: Reject missing workers and sagas registries
  PASSED 2276ms
> generated.plugins-check: Generate plugin registries from discovered manifests
  PASSED 1124ms
> generated.workers-registry: Compile workers registry through plugin CLI
  PASSED 139ms
> generated.sagas-registry: Generate sagas registry through plugin CLI
  PASSED 79ms
> behavior.plugins-health: Check installed plugin health
  PASSED 1147ms
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  PASSED 2120ms
Summary: passed=17 failed=0 skipped=0
EXIT_CODE=0
```

The separate `behavior.package-backed-plugin-doctor` gate from #1597 remains green; this slice did
not change that path.

## Lock hygiene

Both required assertions produced empty output and exited `0`:

```text
$ git diff --stat -- deno.lock packages/fresh-ui/deno.lock
EXIT_CODE=0

$ git diff --stat origin/main...HEAD -- deno.lock packages/fresh-ui/deno.lock
EXIT_CODE=0
```

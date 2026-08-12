# Evidence — W3-J #1597

All defect-proof output below is untruncated. The temporary generated-asset edit used only to
construct steps 1–3 was restored to `0.0.5` immediately after each execution and is absent from the
working diff.

## 1–2. Construct unpublished tree version; show red before the fix

Temporary state:

```ts
export const CLI_PACKAGE_VERSION: string = '0.0.1597-unpublished';
```

The gate factory generated the command from that constant and the pre-fix fixture aborted:

```text
GENERATED_COMMAND=["deno","run","-A","file:///home/codex/repos/ns006-w3-1597/packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts","--project-root","/home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-red-package-doctor","--repo-root","/home/codex/repos/ns006-w3-1597","--cli-entrypoint","packages/cli/bin/netscript-dev.ts","--package-version","0.0.1597-unpublished"]
PACKAGE_BACKED_PLUGIN_DOCTOR_FAIL
- missing generated registry: .netscript/generated/plugin-workers/job-registry.ts
- generate aspire exited 1: Error: Project config loader failed: Warning: config file file:///home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-red-package-doctor/deno.json is not a member of the workspace at file:///home/codex/repos/ns006-w3-1597/. Ignoring the parent workspace config.
Download https://jsr.io/@netscript/config/meta.json
error: Could not find version of '@netscript/config' that matches specified version constraint '0.0.1597-unpublished'
    at file:///home/codex/repos/ns006-w3-1597/packages/cli/src/kernel/adapters/config/project-config-loader-child.ts:6:28
- plugin doctor exited 1: Plugin	Status	Check	Message
workspace	error	Could not load netscript.config.ts.	Project config loader failed: Warning: config file file:///home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-red-package-doctor/deno.json is not a member of the workspace at file:///home/codex/repos/ns006-w3-1597/. Ignoring the parent workspace config.
Download https://jsr.io/@netscript/config/meta.json
error: Could not find version of '@netscript/config' that matches specified version constraint '0.0.1597-unpublished'
    at file:///home/codex/repos/ns006-w3-1597/packages/cli/src/kernel/adapters/config/project-config-loader-child.ts:6:28
Plugin doctor failed: workspace. Follow the remediation commands above.
Error: Plugin doctor failed: workspace. Follow the remediation commands above.
  plugins: workspace
- doctor did not report published permissions: @netscript/plugin-workers	healthy	Permission metadata	--unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run
- doctor did not report published permissions: @netscript/plugin-streams	healthy	Permission metadata	--allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi
- doctor did not execute healthy workers check: generated job registry exists
- doctor did not execute healthy workers check: generated job registry is non-empty
- doctor did not execute healthy workers check: every declared job is registered
- doctor did not resolve exact published module: jsr:@netscript/plugin-workers@0.0.1597-unpublished
- doctor did not resolve exact published module: jsr:@netscript/plugin-streams@0.0.1597-unpublished
- generated plugin AppHost helper is missing
- generated background AppHost helper is missing
--- doctor output ---
Plugin	Status	Check	Message
workspace	error	Could not load netscript.config.ts.	Project config loader failed: Warning: config file file:///home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-red-package-doctor/deno.json is not a member of the workspace at file:///home/codex/repos/ns006-w3-1597/. Ignoring the parent workspace config.
Download https://jsr.io/@netscript/config/meta.json
error: Could not find version of '@netscript/config' that matches specified version constraint '0.0.1597-unpublished'
    at file:///home/codex/repos/ns006-w3-1597/packages/cli/src/kernel/adapters/config/project-config-loader-child.ts:6:28
Plugin doctor failed: workspace. Follow the remediation commands above.
Error: Plugin doctor failed: workspace. Follow the remediation commands above.
  plugins: workspace
error: Uncaught (in promise) Error: Package-backed plugin doctor assertions failed.
  throw new Error('Package-backed plugin doctor assertions failed.');
        ^
    at file:///home/codex/repos/ns006-w3-1597/packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts:182:9
RAW_EXIT_CODE=1
```

## 3. Same unpublished tree version after the fix

The real `CommandGate`, command adapter, fixture, and pretty reporter were used:

```text
GENERATED_COMMAND=["deno","run","-A","file:///home/codex/repos/ns006-w3-1597/packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts","--project-root","/home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-green-package-doctor","--repo-root","/home/codex/repos/ns006-w3-1597","--cli-entrypoint","packages/cli/bin/netscript-dev.ts","--package-version","0.0.1597-unpublished"]
  SKIPPED 449ms
    Package-backed plugin doctor excluded: the pinned NetScript version is not published on JSR.
GATE_RESULT={"id":"behavior.package-backed-plugin-doctor","title":"Validate package-backed plugin doctor truth","critical":true,"verdict":"skipped","evidence":[{"kind":"command","label":"behavior.package-backed-plugin-doctor attempt 1","data":{"command":["deno","run","-A","file:///home/codex/repos/ns006-w3-1597/packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts","--project-root","/home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-green-package-doctor","--repo-root","/home/codex/repos/ns006-w3-1597","--cli-entrypoint","packages/cli/bin/netscript-dev.ts","--package-version","0.0.1597-unpublished"],"cwd":"/home/codex/repos/ns006-w3-1597","code":78,"timedOut":false,"stdoutTail":"PACKAGE_BACKED_PLUGIN_DOCTOR_EXCLUDED\nversion=0.0.1597-unpublished\nunpublishedPackages=@netscript/config,@netscript/plugin-workers,@netscript/plugin-streams\n","stderrTail":""}}],"attempts":[{"attempt":1,"verdict":"passed","durationMs":449,"exitCode":78}],"retried":false,"message":"Package-backed plugin doctor excluded: the pinned NetScript version is not published on JSR."}
```

## 4. Published version still exercises the full gate

With the generated asset restored to the published `0.0.5`, the same real gate path passed rather
than skipping:

```text
GENERATED_COMMAND=["deno","run","-A","file:///home/codex/repos/ns006-w3-1597/packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts","--project-root","/home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-published-package-doctor","--repo-root","/home/codex/repos/ns006-w3-1597","--cli-entrypoint","packages/cli/bin/netscript-dev.ts","--package-version","0.0.5"]
  PASSED 5540ms
GATE_RESULT={"id":"behavior.package-backed-plugin-doctor","title":"Validate package-backed plugin doctor truth","critical":true,"verdict":"passed","evidence":[{"kind":"command","label":"behavior.package-backed-plugin-doctor attempt 1","data":{"command":["deno","run","-A","file:///home/codex/repos/ns006-w3-1597/packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts","--project-root","/home/codex/repos/ns006-w3-1597/.llm/tmp/cli-e2e/w3-j-published-package-doctor","--repo-root","/home/codex/repos/ns006-w3-1597","--cli-entrypoint","packages/cli/bin/netscript-dev.ts","--package-version","0.0.5"],"cwd":"/home/codex/repos/ns006-w3-1597","code":0,"timedOut":false,"stdoutTail":"PACKAGE_BACKED_PLUGIN_DOCTOR_PASS\nregistry=.netscript/generated/plugin-workers/job-registry.ts\nworkersPermissions=--unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run\nstreamsPermissions=--allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi\n","stderrTail":""}}],"attempts":[{"attempt":1,"verdict":"passed","durationMs":5540,"exitCode":0}],"retried":false}
```

## Focused regression tests

```text
running 2 tests from ./packages/cli/e2e/tests/application/gates/scaffold/behavior-plugins-health-gate_test.ts
package-backed doctor uses the tree version locally and names its unpublished skip ... ok
package-backed doctor follows the exact published CLI version ... ok
running 2 tests from ./packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-version_test.ts
reports every package missing at the exact pinned version ... ok
does not degrade registry failures other than an unpublished 404 ... ok

ok | 10 passed | 0 failed
```

The final required gate outputs follow after validation.


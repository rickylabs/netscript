# W2-H implementation evidence — package-backed plugin doctor truth (#1454)

**Branch:** `fix/1454-plugin-doctor-package-backed`  
**Draft PR:** [#1574](https://github.com/rickylabs/netscript/pull/1574)  
**PLAN-EVAL:** PASS at immutable head `ad7574bb7`; Claude Opus 5 medium, opposite-family,
verdict in `verdict-plan-fallback.md`.

## Implemented result

The CLI now records a configured plugin's installation contract as either `local-workdir` or
`package`. Relative, absolute, and `file:` specifiers are local; package/import-map specifiers are
package-backed regardless of whether an incidental conventional directory exists. Only the local
variant carries `workdir` and `rootDir`.

Package manifests are imported in the existing bounded child process and returned through a
versioned, validated, JSON-safe envelope. Doctor and generated Aspire runtime configuration now
consume the manifest's existing permissions and workers doctor contribution. No plugin manifest
field, package export, or plugin public file changed.

The one permission chain used by doctor and generated runtime resolution is:

```text
explicit appsettings/service cfg.Permissions
  > pluginService.permissions
    > plugin.permissions
      > global defaults
```

`plugin list` renders a package install as `package:<configured-specifier>`. Doctor emits an
explicit healthy package-backed source check and does not invent a workspace-directory check.

## Slice-to-file and gate map

| Slice | Principal files | Direct proof |
| --- | --- | --- |
| Source contract and caller migration | `resolved-config.ts`, `registered-plugin-source.ts`, guarded deploy/doctor/list callers | source classifier tests; package-with-incidental-directory doctor test; package list rendering test; CLI scoped check |
| Bounded probe contract | `configured-plugin-manifest-summary.ts`, probe parent/child | valid and malformed envelope tests; doctor probe parity tests |
| Package metadata and doctor | `plugin-registry.ts`, `doctor-plugin-use-case.ts` | published workers/streams focused E2E; workers contributed registry checks |
| Runtime permissions | deploy resolvers and `workspace-mutator.ts` | four-slot precedence unit test; generated helper semantic assertions in focused E2E |
| Consumer gate | `package-backed-plugin-doctor-fixture.ts`, scaffold suite registration | baseline red, deliberate seam red, restored green below |

## Slice 1 caller inventory

The type migration enumerated and guarded every production reader found by the plan evaluator:

- `deploy-config-background.ts` reads local workdir only after `source.kind === 'local-workdir'`;
- `deploy-config-resolvers.ts` does the same for plugin services;
- `doctor-plugin-use-case.ts` guards both the workdir reader and the local doctor `rootDir` reader;
- `list-plugins-command.ts` chooses local workdir or the deliberate package rendering;
- `doctor-plugin-command_test.ts`, `doctor-plugin-invariants_test.ts`, and the auth doctor fixture
  construct explicit local source variants; and
- the existing E2E userland fixtures remain explicit local/copy-mode consumers, while the new
  published-package fixture is the package variant.

The Aspire `generate-register-*.ts` `entry.Workdir` reads consume already-resolved deploy config and
are not `RegisteredPluginConfig` callers.

## Negative control 1 — baseline RED before product implementation

The composite gate was committed first at `668b3b3d6`, then executed before any product fix. The
fixture completed registry and Aspire helper generation; it failed specifically because doctor
invented local directories, discarded published permissions, and skipped the workers adapter.

```text
$ deno task e2e:cli gate scaffold.plugins behavior.package-backed-plugin-doctor --cleanup --format pretty
Running scaffold.plugins
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  FAILED 1390ms
    Command exited 1; expected 0.
    PACKAGE_BACKED_PLUGIN_DOCTOR_FAIL
    - doctor did not report published permissions: @netscript/plugin-workers healthy Permission metadata --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run
    - doctor did not report published permissions: @netscript/plugin-streams healthy Permission metadata --allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi
    - doctor did not execute healthy workers check: generated job registry exists
    - doctor did not execute healthy workers check: generated job registry is non-empty
    - doctor did not execute healthy workers check: every declared job is registered
    - doctor emitted forbidden diagnostic: plugins/workers does not exist
    - doctor emitted forbidden diagnostic: plugins/streams does not exist
    - doctor emitted forbidden diagnostic: No plugin permissions declared
    - generated plugin AppHost helper lacks workers manifest permissions
    - generated plugin AppHost helper lacks streams manifest permissions
    - generated background AppHost helper lacks workers manifest permissions
    --- doctor output ---
    Plugin Status Check Message
    apphost warning Aspire AppHost running No AppHost is running for this project. Start it and rerun plugin doctor.
    workers healthy Configured module resolves jsr:@netscript/plugin-workers@0.0.5
    workers healthy Configured module exports manifest jsr:@netscript/plugin-workers@0.0.5
    workers healthy Service entrypoint resolves jsr:@netscript/plugin-workers@0.0.5/services
    workers healthy Manifest resolved Workers
    workers warning Workspace directory plugins/workers does not exist
    workers warning Permission metadata No plugin permissions declared
    streams healthy Configured module resolves jsr:@netscript/plugin-streams@0.0.5
    streams healthy Configured module exports manifest jsr:@netscript/plugin-streams@0.0.5
    streams healthy Service entrypoint resolves jsr:@netscript/plugin-streams@0.0.5/services
    streams healthy Manifest resolved Streams
    streams warning Workspace directory plugins/streams does not exist
    streams warning Permission metadata No plugin permissions declared
Summary: passed=0 failed=1 skipped=0
EXIT_CODE=1
```

No `plugins/workers` or `plugins/streams` directory and no consumer permission duplication was
added to obtain this red.

## Negative control 2 — post-fix narrow-seam RED

After the gate first passed, the single manifest-summary assignment was deliberately changed from
the published permission array to `undefined`. The focused gate failed on both doctor and runtime
truth, demonstrating that it cannot report clean while the transport does nothing:

```text
$ deno task e2e:cli gate scaffold.plugins behavior.package-backed-plugin-doctor --cleanup --format pretty
Running scaffold.plugins
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  FAILED 1884ms
    Command exited 1; expected 0.
    PACKAGE_BACKED_PLUGIN_DOCTOR_FAIL
    - doctor did not report published permissions: @netscript/plugin-workers healthy Permission metadata --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run
    - doctor did not report published permissions: @netscript/plugin-streams healthy Permission metadata --allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi
    - generated plugin AppHost helper lacks workers manifest permissions
    - generated plugin AppHost helper lacks streams manifest permissions
    - generated background AppHost helper lacks workers manifest permissions
    --- doctor output ---
    @netscript/plugin-workers healthy Permission metadata --allow-net
    @netscript/plugin-streams healthy Permission metadata --allow-net
Summary: passed=0 failed=1 skipped=0
EXIT_CODE=1
```

The inverse patch restored the exact assignment. A path-scoped diff of the fixture against the
pre-fix gate commit was empty before the restored green; neither negative control added/deleted a
fake directory or changed fixture permissions.

## Restored focused gate — GREEN

```text
$ deno task e2e:cli gate scaffold.plugins behavior.package-backed-plugin-doctor --cleanup --format pretty
Running scaffold.plugins
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  PASSED 1845ms
Summary: passed=1 failed=0 skipped=0
EXIT_CODE=0
```

The verifier asserts the exact workers and streams permission arrays, all three healthy workers
registry checks, exact JSR modules, generated plugin/background helper permissions, no fake
directory warning, and doctor exit 0.

## Required gates

Complete command logs are retained untruncated in the orchestration slice `logs/` directory. The
decisive verdicts are:

```text
$ rtk proxy deno task check
filesSelected=2891 batches=25 failedBatches=0 occurrences=0
EXIT_CODE=0

$ rtk proxy deno task test
ok | 3260 passed (622 steps) | 0 failed | 17 ignored (3m34s)
EXIT_CODE=0

$ rtk proxy deno task lint
filesSelected=2019 batches=11 findings=0
EXIT_CODE=0

$ rtk proxy deno task fmt:check
filesSelected=2019 batches=11 failedBatches=0 findings=0 ignoredFindings=0
EXIT_CODE=0

$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
filesSelected=867 batches=8 failedBatches=0 occurrences=0
EXIT_CODE=0

$ rtk proxy deno task quality:gate
quality:scan ok=true findings=[]
arch:check completed with FAIL=0; existing doctrine warnings remain visible
EXIT_CODE=0
```

The filtered package test invocation also exercised the CLI/E2E unit set. Its one cwd-sensitive
quickstart test was not used as a verdict; the root task above ran that same test from the canonical
repository cwd and passed. CLI source tests and E2E unit tests separately completed green.

## Serialized runtime verdict

`scaffold.runtime` is pending an explicit orchestrator slot grant. It will be run once, in the
required one-pass form, after that grant and before draft → ready:

```text
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

## Lock and diff hygiene

Before every implementation commit:

```text
$ git diff --stat -- deno.lock packages/fresh-ui/deno.lock
EXIT_CODE=0
```

The output was empty. Both deliberate breaks were restored. Added lines contain no
`deno-lint-ignore`, `as unknown as`, or `@ts-ignore`; `git diff --check` is clean. Files were staged
by explicit path only, and no publication command ran.

## #1022 debt close-out

The exact close-out gate is `behavior.package-backed-plugin-doctor`, scheduled in both
`scaffold.plugins` and `scaffold.runtime`. The focused published-package red/green evidence is above.
The `cli-plugin-doctor-published-module` debt row will close only after the granted one-pass runtime
suite also passes.

## Acceptance status

All implementation claims are pre-merge provable. The six explicit PR-body acceptance items are
implemented and covered by the focused gate; the serialized merge-readiness verdict and formal
separate-session IMPL-EVAL remain pending. This implementation session does not self-certify the
formal evaluator box.

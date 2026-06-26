# Worklog

Run id: `feat-e2e-cli-prod-local--prod-suite`

## Design

1. Public surface
   - Add root task `e2e:cli:prod`.
   - Add GitHub workflow `.github/workflows/e2e-cli-prod-local.yml`.
   - Relax the e2e scaffold preflight guard for JSR source mode.
2. Domain vocabulary
   - `prod-local`: local public CLI binary plus generated JSR package source.
   - `public bin`: `packages/cli/bin/netscript.ts`.
   - `contributor bin`: `packages/cli/bin/netscript-dev.ts`.
3. Ports
   - No new ports.
4. Constants
   - Reuse existing `PACKAGE_SOURCE.JSR`, `GATE.SCAFFOLD_INIT`, and `SCAFFOLD.RUNTIME`.
5. Commit slices
   - Single surgical implementation slice covering guard, task, workflow, docs, tests, and evidence.
6. Deferred scope
   - `--package-version` override on public `init`.
   - Published-CLI workflow changes.
7. Contributor path
   - Read `packages/cli/e2e/README.md`, then use `deno task e2e:cli:prod --cleanup --format pretty`
     to run prod-local mode.

## Evidence

| Gate | Command | Result |
| --- | --- | --- |
| TS fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts --file packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts --ext ts --write --pretty` | PASS: filesSelected=2, failedBatches=0, findings=0 |
| TS check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx --pretty` | PASS: filesSelected=74, failedBatches=0, totalOccurrences=0 |
| TS lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts --file packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts --ext ts --pretty` | PASS: filesSelected=2, totalOccurrences=0 |
| Focused guard test | `deno test --allow-all packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts` | PASS: 2 passed, 0 failed |
| Maintainer runtime smoke | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS: Summary passed=47 failed=0 |
| Prod-local runtime smoke | `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` | FAIL: `scaffold.plugin.worker`, exit code 3 |
| Workflow validation | `actionlint` | NOT RUN: `actionlint` is not installed |
| Lock hygiene | `git diff --name-only -- deno.lock` | PASS: no output; `deno.lock` unchanged |

## Prod-Local Failure Detail

The prod-local run did not fail with a missing `@netscript/*` package version. It scaffolded the
project using the local public binary and started resolving published dependencies, then failed when
the public `plugin add` flow dispatched the plugin CLI with `deno dx ...`.

Raw failure from `.llm/tmp/cli-e2e/plugin-smoke-20260626-115601.log`:

```text
> scaffold.plugin.worker: Add official worker plugin
  FAILED 1632ms
command: deno run -A packages/cli/bin/netscript.ts plugin add worker --name workers --project-root /home/codex/repos/netscript-e2e-prod-local/.llm/tmp/cli-e2e/plugin-smoke-20260626-115601 --samples --force
error: Module not found "file:///home/codex/repos/netscript-e2e-prod-local/.llm/tmp/cli-e2e/plugin-smoke-20260626-115601/dx".
```

Manual spot-check:

```text
deno dx --help
error: Module not found "file:///home/codex/repos/netscript-e2e-prod-local/dx".
```

This blocks the required proof that `deno task e2e:cli:prod --cleanup --format pretty` works.

## Dispatch Fix Attempt Evidence

The public dispatch implementation was corrected from `deno dx` to `deno run -A`, with matching
JSDoc, unit expectation, and reference/prose docs. The first-party plugin `/cli` exports that are
expected to participate in the published plugin-management path were resolved with `deno info
--no-lock`:

- `jsr:@netscript/plugin-workers@0.0.1-alpha.4/cli`: resolved
- `jsr:@netscript/plugin-sagas@0.0.1-alpha.4/cli`: resolved
- `jsr:@netscript/plugin-triggers@0.0.1-alpha.4/cli`: resolved
- `jsr:@netscript/plugin-streams@0.0.1-alpha.4/cli`: resolved

`plugins/auth/deno.json` does not expose `./cli`; if prod-local reaches
`scaffold.plugin.auth`, that remains a separate public plugin-management blocker.

| Gate | Command | Result |
| --- | --- | --- |
| Focused dispatch test | `deno test --allow-all packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts` | PASS: 1 test, 4 steps, 0 failed |
| TS check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx --pretty` | PASS: filesSelected=519, failedBatches=0, totalOccurrences=0 |
| TS lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts --file packages/cli/src/public/public-api.ts --file packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts --file plugins/streams/src/cli/composition/main.ts --ext ts --pretty` | PASS: filesSelected=4, totalOccurrences=0 |
| TS fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts --file packages/cli/src/public/public-api.ts --file packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts --file plugins/streams/src/cli/composition/main.ts --ext ts --pretty` | PASS: filesSelected=4, failedBatches=0, findings=0 |
| Prod-local runtime smoke | `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` | FAIL: `scaffold.plugin.worker`, exit code 3 |
| Lock hygiene | `git diff -- deno.lock` | PASS: no output; `deno.lock` unchanged |

Raw prod-local failure after the `deno run -A` correction:

```text
> scaffold.plugin.worker: Add official worker plugin
  FAILED 314ms
command: deno run -A packages/cli/bin/netscript.ts plugin add worker --name workers --project-root /home/codex/repos/netscript-e2e-prod-local/.llm/tmp/cli-e2e/plugin-smoke-20260626-121007 --samples --force
stderr: Error: Plugin command failed: add worker
  verb: add
  pkg: worker
  code: 1
  stderr: Download https://jsr.io/worker/meta.json
error: JSR package not found: worker
```

Manual follow-up showed that resolving the official package alias is not enough. The published
worker plugin CLI resolves, but it does not implement the framework `add` verb:

```text
deno run --no-lock -A --minimum-dependency-age=0 jsr:@netscript/plugin-workers@0.0.1-alpha.4/cli add --name workers --project-root . --samples --force
Unknown command: add
```

The generated JSR-mode e2e gate passes `--minimum-dependency-age=0` to the top-level CLI runner.
Nested plugin CLI dispatch would also need that Deno flag once the plugin-owned `add` verb exists;
otherwise the generated workspace's dependency-age policy can block just-published plugin packages.

## Final Implementation Evidence

| Gate | Command | Result |
| --- | --- | --- |
| Focused dispatch test | `deno test --allow-all packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts` | PASS: 1 test, 4 steps, exit code 0 |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS: filesSelected=520, failedBatches=0, totalOccurrences=0 |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | PASS: filesSelected=77, failedBatches=0, totalOccurrences=0 |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx` | PASS: filesSelected=21, failedBatches=0, totalOccurrences=0 |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts $(git diff --name-only -- '*.ts' '*.tsx' | sed 's#^#--file #') --pretty` | PASS: filesSelected=25, totalOccurrences=0 |
| Scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts $(git diff --name-only -- '*.ts' '*.tsx' | sed 's#^#--file #') --pretty` | PASS after formatting `plugins/workers/bin/combined.ts`: filesSelected=25, failedBatches=0, findings=0 |
| Prod-local runtime smoke | `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` | PASS: Summary passed=47 failed=0, raw exit code 0 |
| Prod-local runtime smoke repeat | queued duplicate `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` | PASS: Summary passed=47 failed=0, raw exit code 0 |
| Maintainer runtime smoke | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS: Summary passed=47 failed=0, raw exit code 0 |

## Final Prod Fix Notes

- Added the missing prod import-map/dependency entries for copied official plugin workspaces,
  including streams `@durable-streams/server` and worker `@netscript/cron`.
- Added generated worker runtime loading for `.netscript/generated/plugin-workers/jobs.registry.ts`
  so prod workers have both static job definitions and in-process handlers.
- `deno.lock` was updated naturally by Deno resolution. The delta is limited to root workspace
  dependency membership for `plugins/auth`, `plugins/sagas`, `plugins/streams`, `plugins/triggers`,
  and `plugins/workers`; no package version re-resolution churn was observed.
- Drift: `rtk proxy`/tool polling repeatedly left or queued an additional prod smoke process. I
  waited for active runs to finish and verified the process table before starting the maintainer
  smoke.

## Final Rerun Evidence After Streams/KV Prod Fix

| Gate | Command | Result |
| --- | --- | --- |
| Focused dispatch test | `deno test --allow-all packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts` | PASS: 1 test, 4 steps, raw exit code 0 |
| Focused Aspire helper tests | `deno test --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts` | PASS: 4 suites, 51 steps, raw exit code 0 |
| Focused HTTP/describe tests | `deno test --allow-all packages/cli/e2e/tests/application/gates/http-gate_test.ts packages/cli/src/kernel/adapters/database/operation-runner_test.ts` | PASS: 2 suites, 5 steps, raw exit code 0 |
| Scoped package check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS: filesSelected=520, failedBatches=0, totalOccurrences=0 |
| Scoped changed-TS check/lint/fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file ... --ext ts,tsx && deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file ... --ext ts,tsx && deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file ... --ext ts,tsx` | PASS: filesSelected=27, check/lint/fmt raw exit code 0 |
| Prod-local runtime smoke | `rtk proxy deno task e2e:cli:prod --cleanup --format pretty` | PASS: Summary passed=47 failed=0, raw exit code 0 |
| Maintainer runtime smoke | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS: Summary passed=47 failed=0, raw exit code 0 |

Notes:

- The last prod-local failure was worker execution polling after a successful trigger. Generated
  Aspire resources now wire `GARNET_URI` and `REDIS_URI` from the configured cache endpoint for
  KV-backed plugins/background processors, so the published alpha.4 queue code uses the shared
  Garnet resource instead of process-local fallback state.
- The streams production dependency fix uses package-level imports only; no import-map entries were
  added for sub-exports.
- Package-wide lint/fmt wrappers returned exit code 1 with zero reported findings after one touched
  file was formatted. The final green wrapper verdict used explicit changed TS files, which is the
  scoped source surface for this slice.

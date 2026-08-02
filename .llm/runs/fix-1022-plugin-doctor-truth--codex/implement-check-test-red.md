use harness

# Slice — repair the three repo-wide `check-test` failures on PR #1045

## Context

PR #1045, branch `fix/1022-plugin-doctor-truth`, worktree `/home/codex/repos/fix-1022`,
head `0716faefd`.

Cloud `check-test` is **red**: `2420 passed | 3 failed`. All three reproduce locally and are
caused by this branch. Every other gate is green, including
`scaffold-runtime (aspire + docker + postgres)` — so do not touch anything outside these three
failures.

Read the failures below as diagnosed facts; they were read from the cloud log and reproduced
locally, not guessed.

## Failure 1 — `packages/cli/src/kernel/constants/version-drift_test.ts:32`

> `no hardcoded pinned NetScript JSR specifiers in CLI src`
> Offender: `packages/cli/src/public/features/plugins/doctor/doctor-plugin-command_test.ts`

That test hardcodes `deno run -A jsr:@netscript/plugin-workers@0.0.2/cli compile-registry`.
The guard requires such specifiers to be derived from `NETSCRIPT_RELEASE_VERSION` /
`netscriptJsrSpecifier` rather than pinned literally.

This one matters beyond the gate: 0.0.3 is being cut shortly, and a literal `0.0.2` in an
assertion would keep passing while silently asserting the wrong version.

Fix the **test**, not the guard: build the expected string from the same version constant the
production code uses (`PLUGIN_PACKAGE_VERSION` from
`plugins/workers/src/package-metadata.generated.ts` is what
`plugins/workers/src/adapter/plugin.ts` uses to render the remediation), or from the CLI's
release-version constant if that is the correct source for this file. Do not weaken or
special-case the guard, and do not add an allowance marker.

Check whether the sagas equivalent and
`plugins/{workers,sagas}/tests/adapter/plugin-doctor_test.ts` have the same literal-`0.0.2`
problem and fix them the same way if the guard covers them.

## Failure 2 — `packages/cli/e2e/tests/presentation/suite-registry_test.ts:42`

> `plugin suite includes all official plugin and generated-check gates`

The expected gate list is missing the three gates this branch added. The diff shows exactly
which, in order:

- `behavior.plugins-unhealthy` — expected between `scaffold.plugin-list` and
  `generated.plugins-check`
- `generated.workers-registry` and `generated.sagas-registry` — expected between
  `generated.plugins-check` and `behavior.plugins-health`

Update the expectation to match the real suite. Keep the existing ordering semantics: doctor must
be asserted **failing before** the registries are generated, and `behavior.plugins-health` stays
**last**, after generation. Do not reorder the suite to make the test easier.

## Failure 3 — `packages/cli/e2e/tests/application/runner/suite-runner_test.ts:64`

> `suite runner skips cleanup phase when cleanup is disabled` — `report.ok` was `false`,
> expected `true`.

Cause: the test's `CommandExecutor` double returns `{ code: 0, stdout: '' }` for **every**
command. `createScaffoldRuntimeSuite` now includes `behavior.plugins-unhealthy`, which declares
`expectedExitCode: 1` and a `stdoutIncludes` list (the two registry paths and the two
`deno run -A jsr:@netscript/plugin-…` remediation commands). A universal exit-0/empty-stdout
double therefore fails that gate, which makes `report.ok` false.

**Fix the test double, not the gate.** Make the fake executor return a result consistent with the
command it is given — for the `plugin doctor` invocation, exit code 1 with stdout containing the
required substrings; exit 0 for everything else.

**Do not** remove `expectedExitCode`, remove `stdoutIncludes`, drop the gate from the suite, or
relax the assertion to `report.ok !== undefined` or similar. The whole point of this PR is that a
broken project makes `plugin doctor` fail with an actionable message; deleting the assertion that
proves it would defeat the change. On #1041 an assertion was deleted to hide a scaffold
regression and had to be repaired — do not repeat that.

Check the sibling tests in the same file that construct the runtime suite; if they use the same
universal double, they need the same treatment.

## Verification you must actually run

Run these and paste the real output:

- `deno test -A packages/cli/e2e/tests/application/runner/suite-runner_test.ts packages/cli/e2e/tests/presentation/suite-registry_test.ts packages/cli/src/kernel/constants/version-drift_test.ts`
  → 15 passed, 0 failed.
- `deno test -A plugins/workers/tests/adapter/ plugins/sagas/tests/adapter/ packages/cli/src/public/features/plugins/`
  → 0 failed (34 passed before your change; must not regress).
- `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --root plugins/workers --root plugins/sagas --pretty`
  → 0 diagnostics. This wrapper emits `--unstable-kv` itself; **never** pass `--unstable-kv` to it.
- `deno lint` and `deno fmt --check` on touched files → exit 0.

Then run the repo-wide suite the failing gate actually runs, because targeted runs missed all
three of these: `deno task test` (or the repo-wide task `check-test` uses) → 0 failed.

Do not report an exit code you did not observe.

## Plan-Gate

The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
then proceed directly to implementation.

## Teardown — part of the job, not a courtesy

If you start an Aspire AppHost, you own stopping it before you return.

- Stop AppHosts with `aspire stop --all --non-interactive --nologo`.
- **Never kill `aspire mcp start`** — those are the session's MCP servers, not AppHosts.
- **Never run a blanket `docker rm -f` or `docker ps -aq | xargs`.** Remove only containers your
  own run created, scoped by name and status.
- Prefer `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Before returning, verify with `docker ps -a` and `aspire ps` that you left nothing behind, and
  say what you found.

## SKILL

Use the tooling this repo ships instead of improvising:

- `.llm/tools/run-deno-check.ts` for scoped type-checking (never `--unstable-kv`).
- `deno lint` / `deno fmt --check` scoped to touched files.
- `deno doc` / `deno info` to understand a symbol before changing it.
- The `aspire`, `deno` and `netscript-*` skills in `.agents/skills/`; reach for `aspire` CLI verbs
  and `netscript plugin doctor` rather than hand-rolled `curl` probes.

Read the logs you generate. An unread log is the same waste as an unstopped container.

## Commit

One commit, conventional style. Do not push; the supervisor pushes.

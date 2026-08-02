use harness

# Slice — remove the unreachable saga install branch in the scaffold plugin-install gate

## Context

PR #1045, branch `fix/1022-plugin-doctor-truth`, worktree `/home/codex/repos/fix-1022`.
Augment review comment `3698098623` on
`packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts` is **correct and
confirmed by the supervisor**. Do not re-litigate whether it is valid; fix it.

In `pluginInstallCommand` the control flow is now:

1. `suiteId === SCAFFOLD.USERLAND_INSTALL` → pushes `--ci` and `--local-path`, returns.
2. `packageSource !== PACKAGE_SOURCE.JSR` → pushes `--local-path`, returns.
3. `packageSource === PACKAGE_SOURCE.JSR` → returns.

Because branch 2 and branch 3 together cover every possible `packageSource`, everything after
branch 3 is unreachable — including the `kind === PLUGIN.SAGA` block that ran
`deno run -A packages/cli/bin/netscript-dev.ts ...` and the trailing `return cli(context, ...args)`.

## What is in scope

Remove the dead code and make the remaining intent explicit. Branch 2's routing is
**intentional and must stay**: `PACKAGE_SOURCE.LOCAL` is the default for these suites, and the
strengthened doctor lane requires the *local* plugin source to be installed, because the new
remediation strings (`deno run -A jsr:@netscript/plugin-workers@<version>/cli compile-registry`
and the sagas equivalent) exist only in local plugin source. Installing a published plugin there
would make `behavior.plugins-unhealthy` assert against code that does not contain the change.

So: keep branches 1 and 2 exactly as they behave today, collapse the redundant branch 3 into a
plain fallthrough return, and delete the unreachable saga `netscript-dev.ts` block.

**Preserve `--ci` on the `USERLAND_INSTALL` branch.** A previous revision dropped it; that was a
regression and it has been restored. Do not remove it again.

## What is NOT in scope

- Do not change doctor behaviour, remediation strings, or any file under `plugins/`.
- Do not weaken, skip, or delete any gate or assertion.
- Do not touch `skills/`, `.github/workflows/ci.yml`, or `.llm/tools/validation/`.

## Verification you must actually run

- `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --pretty` → 0 diagnostics.
  Note: this wrapper emits `--unstable-kv` itself; **never** pass `--unstable-kv` to it.
- `deno lint` and `deno fmt --check` on the touched file → exit 0.
- Confirm by reading the final file that no statement after the last `return` is reachable.

Report the real command output. Do not report an exit code you did not observe.

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

One commit, conventional style, scoped to the single file. Do not push; the supervisor pushes.

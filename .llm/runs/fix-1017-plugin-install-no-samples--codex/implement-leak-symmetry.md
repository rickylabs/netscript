use harness

## SKILL

netscript-harness + netscript-tools + netscript-pr. Same branch `fix/1017-plugin-install-no-samples`,
same worktree `/home/codex/repos/fix-1017`, current head `2ebe99f85`. Follow-up commit on the
**existing PR #1028** — do not open a new PR, do not rebase, do not force-push, do not touch prior
commits.

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

**Owner is available live:** ask in-session if you hit a real blocker. Do not stub around it.

# Mission: close the source-leak coverage gap left by widening the userland suite

CI is fully green — this is **not** a gate fix. It addresses a valid Augment review finding
(comment `3696795078`) that the supervisor verified against the source.

## The finding

In `packages/cli/e2e/suites/scaffold/true-userland-install-suite.ts`, inside
`TRUE_USERLAND_ASSERTION_SCRIPT`, `forbiddenPaths` is asymmetric after the suite was widened from one
plugin to four.

The **sample** paths correctly cover all four plugins:

```
workers/jobs/health-check.ts, sagas/user-registration-saga.ts,
triggers/daily-maintenance.ts, triggers/generic-inbound-webhook.ts,
triggers/incoming-file-watch.ts, streams/notifications-stream.ts
```

But the **plugin-source-leak** paths still only cover `workers`:

```
"packages",
"plugins/workers/src",
"plugins/workers/scaffold.ts",
"plugins/workers/worker",
"plugins/workers/tests",
```

The suite now installs `saga`, `trigger` and `stream` as well, so a leak of *their* source trees into
the userland project would pass silently. The "no source leak" guarantee is only enforced for one of
the four installed plugins.

## The fix

Add the symmetric entries. The supervisor confirmed each of these directories genuinely exists in
this repo, so they are meaningful things to assert are *absent* from a userland project:

```
"plugins/sagas/src",     "plugins/sagas/scaffold.ts",     "plugins/sagas/tests",
"plugins/triggers/src",  "plugins/triggers/scaffold.ts",  "plugins/triggers/tests",
"plugins/streams/src",   "plugins/streams/scaffold.ts",   "plugins/streams/tests",
```

Notes:
- `worker` (`plugins/workers/worker`) is workers-specific — there is no equivalent directory in the
  other three, so do **not** invent one. Verify with `ls plugins/<name>` before adding any path; only
  assert paths that actually exist in the repo.
- Keep the existing `workers` entries and `"packages"` exactly as they are.
- This only **adds** assertions. Do not remove, relax, or reorder any existing one.

## Verify empirically — this is the important part

Run the real gate:

```sh
deno task e2e:cli run scaffold.userland-install --cleanup
```

- **If it passes** → good, coverage is now symmetric and no leak exists. Ship it.
- **If it fails**, one of the newly-asserted trees is genuinely leaking into userland. That is a
  **real product bug you have just discovered** — do NOT delete the assertion to get green. Stop,
  record exactly which path leaked with raw output in your worklog, and report it back. The
  supervisor will decide whether it is fixed here or filed separately.

## Out of scope

- Do not touch the `ai` plugin (deferred to #1039), production CLI/plugin/connector code, the
  suite-registry test, PR metadata, or issue #1017.
- Do not reformat `packages/cli/e2e/README.md` — it is unformatted on `main` already and is not ours.

## Gates

Paste **raw** output into your worklog:

1. `deno task e2e:cli run scaffold.userland-install --cleanup`
2. `deno test --allow-all packages/cli/e2e`
3. `deno lint packages/cli/e2e`
4. `deno fmt --check packages/cli/e2e/suites/scaffold/true-userland-install-suite.ts`

## Commit and hand back

- One commit, e.g. `test(cli-e2e): assert no source leak for all four installed plugins`.
- Reference as `Refs #1017`. Do **not** write `close`/`closes`/`fixes` followed by `#1017` anywhere —
  GitHub parses those anywhere in the text and would wrongly auto-close a partially-fixed issue.
- **Do not push.** The worktree has no upstream by design; the supervisor pushes. Report the SHA.

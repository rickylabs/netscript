use harness

# Slice: PR #1027 review remediation — AppHost ownership hardening

Branch `fix/1011-db-apphost-lifecycle`, worktree `/home/codex/repos/fix-1011`.
Base HEAD `ed9c114d5`. PR #1027 (`rickylabs/netscript`) is open, NOT draft, CI green at that head.

## SKILL

Activate, in this order:

- `.agents/skills/netscript-harness` — run artifacts, slice discipline, drift recording.
- `.agents/skills/netscript-cli` — Archetype 6 CLI adapter work; this slice is entirely inside
  `packages/cli/src/kernel/adapters/database/` plus `packages/cli/e2e/`.
- `.agents/skills/netscript-doctrine` — adapter/seam boundaries before you add any new injected
  dependency.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers and gate evidence.
- `.agents/skills/rtk` — prefix read-heavy `git`/`grep` with `rtk`.

Run artifacts go in `.llm/runs/fix-1011-db-apphost-lifecycle--codex/` (existing dir; append, do not
overwrite `plan.md`, `research.md`, `worklog.md`, `drift.md`).

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

## Context

PR #1027 makes `netscript db *` stop only an AppHost that the invocation itself started. Augment
posted four review comments. The supervisor has verified all four as real; they are specified below
as work, not as leads to re-litigate. If implementation research shows one is wrong, record that in
`drift.md` and say so in `worklog.md` — do not silently skip it.

The PR deliberately carries `Refs #1011`, **not** a closing keyword, because acceptance box 1 is
unmet by design (`aspire start` still runs under the resident project identity). **Do not add a
closing keyword. Do not tick acceptance box 1.** Keep the `## Remaining scope` section of the PR
body accurate against whatever you actually change.

## S1 — Close the ownership race (review comment 3696651723, MEDIUM)

`operation-runner.ts:128` decides `startedByInvocation` *before* `aspire start`. Two concurrent
`netscript db` invocations in the same project can both observe "not running", both start, both
claim ownership, and the first one to finish stops the AppHost out from under the second. This is
the same bug class the PR exists to fix, so it needs a real fix, not a comment.

Required shape:

- Serialise the whole detached lifecycle (probe → start → poll → logs → conditional stop) behind an
  **inter-process advisory lock** keyed on the apphost path. Only the lock holder may probe and
  claim ownership, so the claim can no longer race.
- Acquire with an atomic exclusive create (`Deno.open` with `createNew: true`) — not
  `exists()`-then-create, which reintroduces the same TOCTOU.
- Write the holder's pid and an ISO timestamp into the lock file.
- **Stale-lock recovery is mandatory**, otherwise a crashed `db` command bricks the project: if the
  recorded pid is no longer alive, or the lock is older than the runner's `timeoutMs`, remove it and
  retry. Wait using the injected `sleep` at `pollIntervalMs` so tests stay instant.
- Release in a `finally` that cannot mask the operation's own error.
- **Introduce the lock as an injected seam** on `DbOperationRunnerOptions`, exactly like `executor`
  and `sleep` are today, with the file-based implementation as the default. The existing tests use
  `PROJECT_ROOT = 'C:\repo\sample-app'`, which does not exist on this machine — a non-injectable
  filesystem lock would break every test in `operation-runner_test.ts`. Give the fast test runner a
  fake lock.
- Cover with tests: the lock is acquired before the first `describe` and released after the last
  command; a stale lock (dead pid) is reclaimed; the lock is released when the operation throws.

Lock file location: it must be inside an **already-gitignored** directory of scaffold output, or you
will pollute `git status` in the `scaffold-runtime` E2E lane. Verify the candidate directory against
the scaffold constants and the generated `.gitignore` before choosing — record which you picked and
why in `worklog.md`. Do not invent a new top-level dot-directory.

## S2 — Harden the probe (review comments 3696651730 LOW and 3696651737 LOW)

Both are in `hasRunningAppHost` (`operation-runner.ts:159–180`).

- **3696651730:** `NO_RUNNING_APPHOST_MESSAGE` is matched as a bare substring across concatenated
  stdout+stderr. A misclassification here fails *open* — the runner would wrongly believe it owns a
  resident AppHost and stop it, which is precisely the reported bug. Tighten it: extract the
  classification into a named, directly unit-tested helper in `operation-runner-helpers.ts`, and
  match the phrase **anchored to the start of a line** (allowing a leading `error:`/whitespace
  prefix) rather than anywhere in the blob. An unrelated failure that merely quotes the phrase
  mid-sentence must then classify as ambiguous and throw. Add a test for exactly that case.
- **3696651737:** the thrown `aspire describe failed: ...` drops `output.code`. Include the numeric
  exit code in the message. Apply the same treatment to `runAspire` (line 259) so both probe and
  command failures are diagnosable when stdout/stderr are empty.
- **Watch out:** `operation-runner_test.ts:249-253` asserts the message
  `'aspire describe failed: Dashboard connection failed.'`. `assertRejects` matches on substring, so
  inserting the exit code **will** break that assertion. Update the test to assert the new message
  including the exit code — do not weaken the assertion to a bare `'aspire describe failed'`.

## S3 — Resident + failure coverage (review comment 3696651743, LOW)

`operation-runner_test.ts` covers resident-AppHost + success (line 212) and
invocation-owned + failure (line 228), but not resident + failure. Add the missing case: an
already-running AppHost with a non-zero DB operation exit code must return that code and still issue
no `stop`. The gap is real — verified.

## S4 — Live-AppHost reproduction evidence (highest-value item; best effort)

The issue's original reproduction has **never** been re-run against a live AppHost. That is the
single most valuable thing missing from this PR, and it is now cheap: the `scaffold.runtime` E2E
suite already starts a real AppHost and persists metadata (see
`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`, the `aspire start` gate that
writes `aspire-start.json`).

Add a gate to that suite which, against the already-running AppHost:

1. records the AppHost identity (pid / dashboard URL) from the existing start metadata;
2. runs `netscript db status`;
3. re-runs `aspire describe` and asserts the **same** AppHost is still alive and unchanged.

That is the issue's reproduction, executed in a CI lane that is already green.

Constraints: reuse the existing gate builders and the existing started AppHost — do **not** start a
second one, and do not add a new Docker/Postgres dependency. Keep the gate inside the existing
`scaffold.runtime` suite so no new CI job is required.

**If this cannot be made deterministic within this slice, stop and do not fake it.** Record the
blocker in `drift.md`, say so in `worklog.md`, and leave the PR body's "Residual risk" and
"Acceptance evidence" sections stating that the live reproduction was not run. A fabricated or
flaky-passing gate here is far worse than an honest gap.

## S5 — PR body

Update the #1027 body to match reality:

- Add the new slices to `## Slices` with their real SHAs.
- Extend `## Validation` with the actual commands and exit codes you ran.
- If and only if S4 lands green, update `## Acceptance evidence` box 3 and the
  `### Residual risk for the human reviewer` section to reflect that the live reproduction now runs.
  **Box 1 stays unticked regardless.**
- Keep `Refs #1011`. Do not introduce the strings `close`, `closes`, `fix`, `fixes`, `resolve`, or
  `resolves` followed by `#1011` anywhere in the body — GitHub parses those anywhere in the text,
  including inside a sentence that denies them.

## Validation (all required, record exit codes in `worklog.md`)

```
deno test -A packages/cli/src/kernel/adapters/database/
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
deno task quality:scan
deno task arch:check
```

Do **not** pass `--unstable-kv` to `.llm/tools/run-deno-check.ts` — the wrapper emits it by default
and rejects the flag with exit 1.

If S4 lands, also run `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` and report
the raw exit code. If that suite cannot run in this environment, say so explicitly rather than
implying it passed.

## Rules

- Commit in logical slices with real messages; do not squash everything into one commit.
- **Do not push.** The supervisor pushes and verifies local/remote SHA parity.
- Do not amend or rebase the five existing commits.
- Do not edit `deno.lock` unless a dependency genuinely changed.
- Do not reply to the GitHub review threads — the supervisor does that.

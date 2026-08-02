use harness

## SKILL

netscript-harness + netscript-tools + netscript-pr. Implementation slice on branch
`fix/1017-plugin-install-no-samples` (worktree `/home/codex/repos/fix-1017`, current head
`071808e4d`, based on `origin/main` `26b01ea5b`). This is a **follow-up commit on the existing
PR #1028** — do NOT open a new PR, do NOT rebase, do NOT force-push, do NOT touch the six
existing commits.

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

**Owner is available live:** if you need a decision or hit a real blocker, ASK in your session.
Do not silently stub around it.

# Mission: make `check-test` green on PR #1028 without weakening any assertion

PR #1028 is one red gate away from review-ready: **`check-test`** (the repo-wide `deno test` job).
Every other gate passes. Exactly **one** test fails, and the cause is already fully diagnosed
below — you do not need to re-investigate it, only to fix it correctly.

## Task 1 (required) — the stale suite-registry expectation

**Failing test:** `packages/cli/e2e/tests/presentation/suite-registry_test.ts:61`
(`true userland suite runs init, one local-path plugin install, assertion, and cleanup`).

Reproduce with:

```sh
deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts
```

Observed failure (identical locally and in CI job 91411892941):

```
[Diff] Actual / Expected
    [
      "preflight.deno",
      "scaffold.init",
      "scaffold.plugin.worker",
-     "scaffold.plugin.saga",
-     "scaffold.plugin.trigger",
-     "scaffold.plugin.stream",
      "userland-install.assertions",
      "cleanup.userland-smoke-root",
    ]
```

**Cause.** Commit `fe5c523ec` deliberately widened the true-userland suite from one plugin to
four — `packages/cli/e2e/suites/scaffold/true-userland-install-suite.ts` now builds gates for
`worker, saga, trigger, stream` with `samples: false`, which is the whole point of the issue-#1017
black-box coverage. The presentation test still pins the old single-plugin gate list. **The
production change is correct; the test expectation is stale and must track it.**

**Do this:**

1. Add `'scaffold.plugin.saga'`, `'scaffold.plugin.trigger'`, `'scaffold.plugin.stream'` to the
   expected array at `suite-registry_test.ts:61`, in the exact order the suite emits them (worker,
   saga, trigger, stream — matching the `.filter(...)` order in the suite file).
2. Rename the test — `one local-path plugin install` is now wrong. Use something honest such as
   `true userland suite runs init, four no-samples plugin installs, assertion, and cleanup`.

**Hard constraint — do not weaken the assertion.** It must stay a single `assertEquals` over the
**complete** gate-id list. Do **not** convert it to `.some(...)`, `.includes(...)`, a length check,
a subset check, or a sorted comparison; do not delete the test; do not add `.ignore`. Another PR in
this train weakened an assertion to get green and was blocked for it. The only legitimate edit is
updating the expected values to the new correct list.

## Task 2 (secondary, conditional) — restore the dropped materialisation assertions

Commit `fe5c523ec` also **removed four assertions** from `requiredPaths` in
`TRUE_USERLAND_ASSERTION_SCRIPT` (same suite file) when it flipped the suite to no-samples:

```
"plugins/workers/mod.ts",
"plugins/workers/scaffold.plugin.json",
"plugins/workers/services/src/main.ts",
"plugins/workers/database/schema.prisma",
```

These assert the **plugin package is materialised in userland**. That is orthogonal to sample
emission, so dropping them looks like unintended coverage loss (PR #1028 discloses it to the
reviewer as an open point).

**Restore them only if they genuinely hold under `--no-samples`.** Verify empirically:

```sh
deno task e2e:cli run scaffold.userland-install --cleanup
```

- If the suite passes with them restored → keep them, and note in your worklog that userland
  plugin-package materialisation coverage is back.
- If any of the four legitimately does **not** exist under `--no-samples` → do **not** force it and
  do **not** fudge the assertion. Leave that path out, and write down in your worklog exactly which
  path was absent and why, so the supervisor can record it accurately in the PR body.

Task 2 must never be allowed to break Task 1 or any currently-green gate. If it destabilises
anything, drop Task 2 entirely and ship Task 1 alone — Task 1 is the gate-blocking work.

## Out of scope — do not do these

- **Do not touch the `ai` plugin.** `plugins/ai/src/adapter/plugin.ts` still emits its starter tool
  and agent under `--no-samples`; that is knowingly deferred to #1039 and is why PR #1028 says
  `Refs #1017` rather than `Closes`. Leave the partial framing alone.
- Do not edit the PR body or issue #1017 — the supervisor does that.
- Do not touch `packages/plugin`, `packages/cli/src`, or the connector plugins; the install fix
  itself is already reviewed and correct.

## Gates to run before you report done

Run these and paste **raw** output into your worklog — no paraphrase, no "expected" results:

1. `deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts`
2. `deno test --allow-all packages/cli` (the whole CLI package — this is the surface `check-test`
   covers for your change)
3. `deno run --allow-all .llm/tools/run-deno-check.ts --root packages/cli --ext ts`
   — **note:** do NOT pass `--unstable-kv`; the tool emits it by default and rejects the flag.
4. `deno lint packages/cli/e2e` and `deno fmt --check packages/cli/e2e`
5. Task 2 only: `deno task e2e:cli run scaffold.userland-install --cleanup`

## Commit and hand back

- One commit, conventional style, e.g.
  `test(cli-e2e): track four-plugin no-samples userland gate list`.
- Body must state plainly that the **test expectation was stale relative to an intentional
  production change**, and that the assertion remains an exact full-list `assertEquals`.
- Reference the issue as `Refs #1017` — **no closing keyword**, and do not write the word `close`
  / `closes` / `fixes` followed by `#1017` anywhere in the message. GitHub parses those anywhere in
  the text, including inside a negation, and it would wrongly auto-close a partially-fixed issue.
- **Do not push.** The worktree has no upstream by design and the supervisor pushes explicitly.
  Leave the commit local and report the SHA.

Report: the commit SHA, the raw gate output, and whether Task 2 landed or was dropped (with the
reason).

use harness

## SKILL

netscript-harness, netscript-cli, netscript-tools

## Evaluator waiver — read this first

The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
then proceed directly to implementation.

## Supervisor IMPL-EVAL on your rebase slice — two corrections

Your rebase and both Augment fixes are **correct and verified**. I re-ran the gates myself:
9/9 focused tests pass, scoped `packages/cli` check is 746 files / 0 diagnostics, scoped lint is
746 files / 0 findings, `deno task fmt:check` exits 0, and no destructive docker guidance survives
anywhere under `skills/`. I also proved independently that no content was dropped in the merge:
after normalising both sides, `skills/{help,aspire/SKILL,deno/SKILL}.md` are byte-identical to
`main`, and `skills/netscript/SKILL.md` correctly carries `main`'s content **plus** this PR's six
new routing and hand-off rows. That resolution is right.

Two things to fix, both mine to own — the first was my instruction and it was the wrong call.

---

## Correction 1 — undo the Markdown reflow

I told you to run `deno fmt` over `skills/**.md` after the rebase. That instruction was stale: its
only justification was staying byte-convergent with #1034 **before** the merge, and #1034 has now
merged. The reflow costs us ~700 lines of pure whitespace churn on a PR whose real skills change is
six table rows, and it silently diverges every shipped skill from the formatting `main` just
landed. `deno task fmt:check` does not cover `skills/**.md`, so this buys no gate — only review
noise and a harder rebase for the next sibling branch. Revert it.

Restore these four files to `origin/main`'s **exact bytes**:

```sh
git checkout origin/main -- \
  skills/help.md \
  skills/aspire/SKILL.md \
  skills/deno/SKILL.md \
  skills/manifest.json
```

That is safe and lossless — I verified each of those three Markdown files is content-identical to
`main` today, and `skills/manifest.json` should be `main`'s `0.2.0` manifest unchanged.

For **`skills/netscript/SKILL.md`**, do **not** blanket-checkout — it carries this PR's actual
payload. Start from `main`'s bytes and re-apply only the six new rows, matching `main`'s existing
unwrapped table style and column padding:

- `## Routing` table gains three rows:
  - `Aspire orchestration, resource health, logs, spans, or traces` → `` `aspire` ``
  - `Deno runtime, type checking, permissions, or module resolution` → `` `deno` ``
  - `Something hangs, vanishes, or stays silent and the cause is unclear` →
    ``[`help.md`](../help.md)``
- `## Hand-offs` table gains one row:
  - `Unexplained hang, vanish, silence, or “Healthy but not responding”` →
    ``[`help.md`](../help.md)``

Keep the linked `[`help.md`](../help.md)` form — Unit 3's extended matcher exists precisely to
validate it, and switching those to bare backticks would make the new coverage vacuous.

**Do not** reformat `skills/netscript-build/SKILL.md` or `skills/netscript-operate/SKILL.md`; their
drift is `main`'s.

After this, `git diff origin/main -- skills/` must show **only** `skills/netscript/SKILL.md`, and
only those added rows. Verify that literally before moving on — paste the diffstat into the
worklog.

## Correction 2 — `skills/manifest.json` is unformatted

Your rebase left a stray trailing blank line on `skills/manifest.json`, so
`deno fmt --check skills/manifest.json` **exits 1**:

```text
from /home/codex/repos/fix-1026/skills/manifest.json:
15 | -
error: Found 1 not formatted file in 1 file
```

`main`'s copy ends `}\n`; ours ends `}\n\n`. The `git checkout origin/main -- skills/manifest.json`
above fixes it. Confirm with `deno fmt --check skills/manifest.json` exiting **0**, and record the
exit code.

---

## Regenerate and re-verify

The embedded bundle hash is derived from these files, so this is load-bearing:

```sh
deno task gen:assets-barrel
git status --porcelain          # must be clean after a second run
```

Then re-run, and paste real output for each:

```sh
deno test -A packages/cli/src/public/features/agent/init/init-agent_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno task fmt:check
deno fmt --check skills/manifest.json
grep -rnE 'docker (rm|kill|prune)|xargs .*docker' skills/    # must print nothing
```

**Do not pass `--unstable-kv` to `.llm/tools/run-deno-check.ts`** — it emits that flag by default
and rejects it (exit 1).

**Verify the artefact, never the exit code.** Read the output; a piped command reports the exit
status of the last stage in the pipe.

## Commit

**Amend into the existing commits** rather than stacking a revert on top — a "reformat then
un-reformat" pair in the history is noise a reviewer has to read twice.

The supervisor has already committed this brief as `chore(harness): brief the supervisor un-reflow
correction` on top of your work. Fold the un-reflow and the regenerated barrel into whichever of
`fix(cli): gate Aspire delegation on the selected agent host` or `test(cli): validate linked routing
targets for dangling routes` already touches those files (interactive rebase is unavailable in this
environment — use `git rebase --onto` / `git commit --fixup` + `--autosquash`, or reset and
re-commit). Add a short worklog section recording this correction and why.

**Do not push.** The supervisor pushes and verifies that local and remote SHAs match.

## Teardown

Same obligation as before. You should need no AppHost and no container for this slice. If you start
one, you own stopping it: `aspire stop --all --non-interactive --nologo`. **Never kill
`aspire mcp start`** — those are the session's MCP servers. **Never run a blanket `docker rm -f` or
`docker ps -aq | xargs`.** The three `postgres:18.3` containers you correctly identified as
belonging to other concurrent work must still be running when you finish — leave them alone and
confirm they are untouched.

## Report back

- the `git diff --stat origin/main -- skills/` output after the un-reflow
- `deno fmt --check skills/manifest.json` exit code
- full re-run output for every gate above
- the final commit SHAs
- teardown verification, including that the three foreign postgres containers are untouched

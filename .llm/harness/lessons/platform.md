# Platform Lessons (Windows + tooling)

Source: supervisor sessions for `feat/package-quality` Wave 2 (2a–2c); Wave 4 4a
IMPL-EVAL (`rtk proxy` masking); Wave 4 4b (OpenHands eval automation lock churn);
Wave 4 4d PLAN-EVAL (stale OpenHands summary comment).

These are environment gotchas that silently corrupt harness bookkeeping if not
known up front. All confirmed on Windows 11 + PowerShell + RTK shell hook.

## RTK serves stale git reads

The shell hook rewrites `git …` → `rtk git …`, and rtk caches read commands, so
`git log`/`git rev-parse`/`git status` can lag reality (especially right after a
remote merge). Symptoms: a branch tip that "won't update," a merge that "didn't
happen."

Bypass for ground truth:

- `rtk proxy git <args>` — runs the raw command, no cache.
- **Preferred for scripts:** spawn git directly with no shell, e.g.
  `deno eval 'new Deno.Command("git",{args:[...]})'`, or use
  `.llm/tools/git-verify.ts`. No shell = no rewrite = no cache.

(Also captured in auto-memory `rtk-stale-git-cache`.)

## `rtk proxy deno task check` can mask a real failure (gate-evidence trap)

Wave 4 4a slice S22 recorded "`packages/cli` `deno task check` PASS" as a
consumer-import gate result. The 4a IMPL-EVAL (separate session) re-ran it raw and
found `packages/cli` actually **fails** TS9016/TS9027 (`isolatedDeclarations`) in
`src/maintainer/features/sync/plugin/copy-official-plugin.ts` — pre-existing base
debt, not a regression, but the green check was **false evidence**: the rtk hook's
filtering/summarization swallowed the failing file and the slice trusted it.

Rule for **gate evidence** (consumer-import checks especially): do **not** rely on
`rtk proxy deno task check` / hook-filtered output for a PASS/FAIL verdict. Run the
underlying `deno check --unstable-kv <entrypoints>` (or `deno task check` outside the
hook) and read the raw exit code + full error list. rtk is fine for token savings on
exploratory reads; it is **not** a verdict source for gates. When a consumer check
"passes" but you didn't see the file list and error count, treat it as unverified.

## The OpenHands eval automation can commit `deno.lock` churn (silent drift)

Wave 4 4b was the first sub-wave to run both evaluator passes on the OpenHands
GitHub-Actions automation (`@openhands-agent model=… use harness proceed to
PLAN-EVAL/IMPL-EVAL`). The **PLAN-EVAL** run, while executing `deno check` /
`deno publish --dry-run` to verify the plan, re-resolved the workspace and committed
the result into `deno.lock` (`chore(openhands): apply agent changes`): a
**`@opentelemetry/semantic-conventions` 1.40.0→1.28.0 downgrade** plus unrelated
`esbuild`/`esbuild-wasm`/`@deno/loader`/`preact`/`zod` additions (+179/−63 vs the
sub-wave base). It rode through implementation and **into the merged umbrella** —
nobody reviewed it, and the implementer's per-slice "`deno.lock` unchanged" check was
true only relative to its own already-churned baseline, not the pre-sub-wave base.

Rules:

- **A PLAN-EVAL must never mutate `deno.lock`.** It is read-only over the plan. If the
  automation's checks re-resolve the lock, that churn is an artifact, not a result —
  the run prompt should instruct the agent to `git checkout -- deno.lock` before
  committing, the same lock-hygiene rule given to generators.
- **Diff the lock against the true sub-wave base, not the working baseline.** When
  closing a sub-wave, the supervisor should `git diff --stat <base> <head> -- deno.lock`
  (base = the commit the sub-wave forked/synced from, e.g. `2c24662`), because an
  in-branch "unchanged" claim hides churn that predates the first slice.
- **Reconcile, don't revert mid-wave.** Once churn has merged into the umbrella and
  later work validated against it, reverting just re-churns. Carry it forward, log it
  (registry + drift), and do one deliberate, reviewed lock pass at the umbrella→track
  closeout. (Golden Rule 6: never delete the lock or `--reload` without approval.)

## The OpenHands `<!-- openhands-agent-summary -->` PR comment can be stale

The automation maintains **one persistent summary comment** per PR (marker
`<!-- openhands-agent-summary -->`) and updates it each run from `.llm/tmp/openhands/summary.md`.
That file is **not always regenerated** for the new run: Wave 4 4d's PLAN-EVAL run
(`bb985d0`, qwen3.7-max) bumped the comment's `updated_at` to the run instant but left
the **previous 4c sagas IMPL-EVAL `FAIL_FIX`** body in place — so the visible PR summary
on the 4d PLAN-EVAL PR read "Wave 4 · 4c sagas IMPL-EVAL (PR #20) … FAIL_FIX". A reviewer
trusting the PR comment would have read the wrong package, wrong phase, and wrong verdict.

Rule: **the verdict source is the committed run artifact, never the PR comment.** Read
`<run>/plan-eval.md` (PLAN-EVAL) or `<run>/evaluate.md` (IMPL-EVAL) from the bot commit
and confirm it names the **right run id, the right slices, and the right surface** before
accepting the verdict. The `<!-- openhands-agent-summary -->` comment is a convenience
mirror that can lag a run behind. (Same shape as the `rtk proxy` false-evidence trap: the
convenient summary is not the gate.)

## MSYS mangles `ref:path` colons

In the Bash tool (MSYS), `git show <ref>:<path>` and similar `rev:path` forms get
their colon path-mangled and fail or read the wrong thing. Work around by spawning
git directly via `deno eval` (no shell translation), not by escaping.

## Bash tool ≠ PowerShell here-strings

The Bash tool runs **bash**, not PowerShell. A PowerShell `@'…'@` here-string
passed to `git commit -m` leaks a literal `@` into the commit subject (observed:
`@ chore(2c)…`). In the Bash tool use bash quoting or multiple `-m` flags; reserve
`@'…'@` for the PowerShell tool only. If it slips through on a PR-less seed branch,
`git commit --amend` + `git push --force-with-lease` is safe.

## `gh` CLI not on the Bash PATH

The GitHub CLI is not reliably on PATH in the Bash tool here. Use the GitHub MCP
tools instead (`pull_request_read`, `update_pull_request`, `merge_pull_request`,
`create_pull_request`, `get_file_contents`, `create_or_update_file`). They also
integrate with the permission UI.

## Syncing a local track worktree without touching lock files

When a stale local track worktree blocks a supervisor-doc commit and `deno.lock`
has uncommitted churn: `git stash push -- deno.lock` (preserves, does not delete),
then `git merge --ff-only origin/<track>`. Never delete lock files or run
`deno cache --reload` without approval (Golden Rule 6). Leave intentional lock
churn parked in the stash rather than committing it into a docs commit.

# Platform Lessons (Windows + tooling)

Source: supervisor sessions for `feat/package-quality` Wave 2 (2a–2c); Wave 4 4a
IMPL-EVAL (`rtk proxy` masking).

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

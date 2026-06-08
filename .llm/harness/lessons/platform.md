# Platform Lessons (Windows + tooling)

Source: supervisor sessions for `feat/package-quality` Wave 2 (2a–2c).

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

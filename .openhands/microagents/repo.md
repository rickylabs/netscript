# NetScript Repo Context for OpenHands

Read `AGENTS.md` before changing files.

## Operating Model

- Use `.agents/skills/netscript-harness/SKILL.md` when the task says `use harness`.
- Use `.agents/skills/netscript-doctrine/SKILL.md` before changing `packages/` or `plugins/`.
- Use `.agents/skills/openhands-handoff/SKILL.md` for GitHub comment, label, commit-message, and
  output conventions.
- Use `rtk` for read-heavy git, grep, GitHub CLI, listing, and Docker commands when available.
- Do not run destructive git commands. Preserve user changes.
- Do not delete lock files or caches. Do not run `deno cache --reload` without approval.

## Validation

Run the smallest gate that proves the change. For Deno checks touching workspace code, include
`--unstable-kv`. Wrap `deno task` runs in `rtk proxy` when `rtk` exists.

Common gates:

- `deno task check`
- `deno task test`
- `deno task lint`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root <path> --ext <list>`
- `deno task publish:dry-run`
- `deno task arch:check`

## Output Contract

Before finishing an OpenHands workflow run, write `.llm/tmp/openhands/summary.md` with:

- summary of what was done,
- changed files or areas,
- validation run and results,
- responses to relevant PR, issue, or review comments,
- remaining risks or follow-up work.

When the workflow output mode is `thread-replies`, optionally write
`.llm/tmp/openhands/replies.json`:

```json
[
  {
    "comment_id": 123456789,
    "body": "Addressed in commit abc123; validation passed."
  }
]
```

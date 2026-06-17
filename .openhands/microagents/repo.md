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

Before finishing an OpenHands workflow run, write the file named by `OPENHANDS_SUMMARY_PATH` with:

- summary of what was done,
- changed files or areas,
- validation run and results,
- responses to relevant PR, issue, or review comments,
- remaining risks or follow-up work.

Do not write or reuse `.llm/tmp/openhands/summary.md`. That legacy shared path is ignored by the
workflow because older PR branches can contain stale committed summaries. Runtime artifacts live in
`OPENHANDS_RUN_DIR`; durable run trace metadata is mirrored under `OPENHANDS_TRACE_DIR`.

Do not post GitHub issue or PR comments directly. The workflow reacts to the trigger, creates the
running status comment, and edits that comment with this summary artifact.

When the workflow output mode is `thread-replies`, optionally write
the file named by `OPENHANDS_REPLIES_PATH`:

```json
[
  {
    "comment_id": 123456789,
    "body": "Addressed in commit abc123; validation passed."
  }
]
```

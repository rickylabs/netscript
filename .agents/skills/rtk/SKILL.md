---
name: rtk
description: "Token-saving CLI proxy for NetScript development. USE FOR: any git, gh, grep/rg, ls/tree, or docker command where you want 60-90% token reduction — PREFIX the command with `rtk` (e.g. `rtk git status`, `rtk git diff`, `rtk grep <pattern>`). USE `rtk proxy <cmd>` for commands RTK does not filter natively (e.g. `deno task` runs). DO NOT USE FOR: interactive commands, MCP tool calls, file read/write (use Read/Edit/Write), or when full unfiltered output is explicitly required."
---

# rtk — token-saving CLI proxy

**Mental model:** `rtk` is a transparent output filter — prefix a read-heavy
shell command with `rtk` and it compresses the output before it reaches the model
context, without changing the command's semantics or exit code.

`rtk` is a single machine-level binary (v0.38.0) already on PATH
(`~/.local/bin/rtk`, Windows `C:\Users\<user>\.local\bin\rtk.exe`). It is
environment-level, so it is available in this repo and every worktree.

## When to Use

- Any **read-heavy, non-interactive** shell command whose raw output would burn
  context: `git status`/`log`/`diff`/`show`, `grep`/`rg`, `ls`/`tree`,
  `docker ps`/`logs`, `gh pr view`/`pr list`/`issue list`.
- Long harness runs where you repeatedly inspect git state between slices.
- `deno task` runs whose logs you want tracked/compressed → `rtk proxy deno task …`.

## When Not to Use

- Interactive commands (they hang behind the filter).
- MCP tool calls — those are not shell commands; call the tool directly.
- File operations — use the Read/Edit/Write tools, not `cat`/`echo` through rtk.
- When you genuinely need the full, unfiltered output — run raw, or use
  `rtk proxy <cmd>` to stay tracked while keeping full output.

## Key Concepts

| Term | Meaning |
|------|---------|
| **Prefix mode** | `rtk <cmd>` — rtk recognizes and compresses the command's output. The reliable mode on Windows bare-metal. |
| **Proxy mode** | `rtk proxy <cmd>` — runs any command unfiltered but tracked in gain stats (use for `deno task …`). |
| **Gain** | `rtk gain` reports token savings for the session; `rtk gain --history` is per-command. |

## Workflow

1. Reach for `rtk` whenever step 4 of the AGENTS.md Tooling order (shell
   commands) applies to a read-heavy git/gh/grep/ls/docker command.
2. Prefix it: `rtk git diff`, `rtk git status`, `rtk grep "<pattern>"`,
   `rtk ls <dir>`.
3. For Deno tasks, wrap with proxy: `rtk proxy deno task check:packages`,
   `rtk proxy deno task lint`, `rtk proxy deno task test`.
4. Keep git commands non-paging as usual (rtk preserves semantics; `--no-pager`
   still applies to raw git).
5. Optionally check `rtk gain` to confirm savings during long runs.

## Supported commands

| Category | Examples |
|----------|----------|
| Git | `rtk git log`, `rtk git diff`, `rtk git status`, `rtk git show`, `rtk git add`, `rtk git commit`, `rtk git push` |
| GitHub CLI | `rtk gh pr view`, `rtk gh pr list`, `rtk gh issue list` |
| Search | `rtk grep`, `rtk rg` |
| Listing | `rtk ls`, `rtk tree` |
| Docker | `rtk docker ps`, `rtk docker logs` |
| Anything else | `rtk proxy <cmd>` (full output, tracked) |

## Common Pitfalls

- Prefixing an **interactive** command → it hangs. Only proxy non-interactive output.
- Expecting `rtk deno …` to filter — it does not; use `rtk proxy deno task …`.
- Using `rtk cat`/`rtk echo` to read/write files — use the editor's file tools instead.
- Assuming output changed — rtk only compresses presentation; exit codes and
  side effects are identical to the raw command.

## Reference Files

- This skill is the canonical reference; `rtk --help` and `rtk gain` are the
  in-tool references.
- `AGENTS.md` → Tooling / Validation sections cite rtk as the token-efficient
  shell path.

## Checklist

- [ ] Command is non-interactive and read-heavy → prefix with `rtk`.
- [ ] It's a `deno task` → use `rtk proxy deno task …`.
- [ ] Not a file op or MCP call (those bypass rtk).
- [ ] Full output truly needed → run raw or `rtk proxy`.

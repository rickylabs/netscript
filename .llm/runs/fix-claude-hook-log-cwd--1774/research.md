# Research — fix-claude-hook-log-cwd--1774

## Re-baseline

- Carried-in source: issue #1774 and the leaf brief in `implement.md`.
- Re-derived against live `main` at `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` on 2026-08-30.
- Remote state: `origin/main` equals the baseline; the feature branch did not exist remotely before
  Bootstrap.
- Carried claim result: confirmed against the exact command in `.claude/settings.json` for both
  configured events. Root succeeds; nested run cwd fails before Deno loads the logger.

## Exact RED reproduction

Configured command under test:

```text
deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude/claude-hook-log.ts
```

Raw output, including exit codes:

```text
CASE PreToolUse root
CWD /home/agent/projects/netscript/worktrees/007-leaf-1774
COMMAND deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude/claude-hook-log.ts
EXIT 0
OUTPUT_BEGIN

OUTPUT_END
CASE PreToolUse nested
CWD /home/agent/projects/netscript/worktrees/007-leaf-1774/.llm/runs/fix-claude-hook-log-cwd--1774
COMMAND deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude/claude-hook-log.ts
EXIT 1
OUTPUT_BEGIN
error: Module not found "file:///home/agent/projects/netscript/worktrees/007-leaf-1774/.llm/runs/fix-claude-hook-log-cwd--1774/.llm/tools/agentic/claude/claude-hook-log.ts".
OUTPUT_END
CASE Stop root
CWD /home/agent/projects/netscript/worktrees/007-leaf-1774
COMMAND deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude/claude-hook-log.ts
EXIT 0
OUTPUT_BEGIN

OUTPUT_END
CASE Stop nested
CWD /home/agent/projects/netscript/worktrees/007-leaf-1774/.llm/runs/fix-claude-hook-log-cwd--1774
COMMAND deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude/claude-hook-log.ts
EXIT 1
OUTPUT_BEGIN
error: Module not found "file:///home/agent/projects/netscript/worktrees/007-leaf-1774/.llm/runs/fix-claude-hook-log-cwd--1774/.llm/tools/agentic/claude/claude-hook-log.ts".
OUTPUT_END
```

The two successful root invocations appended distinct `PreToolUse` and `Stop` payloads to the root
worktree's ignored `.llm/tmp/claude/hooks/issue-1774-research/events.jsonl`. Neither nested
invocation reached the logger.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `PreToolUse` and `Stop` carry the identical relative shell-form command. | `.claude/settings.json` |
| 2 | The logger writes `.llm/tmp/claude/hooks/<run-id>/events.jsonl` relative to `Deno.cwd()`, so changing only the executable path would still misplace output. | `.llm/tools/agentic/claude/claude-hook-log.ts` (`outDir`) |
| 3 | Claude Code exports `CLAUDE_PROJECT_DIR` as the session launch root and substitutes `${CLAUDE_PROJECT_DIR}` in command/args. It does not follow `EnterWorktree`; official guidance prefers exec form when a hook references a path placeholder. | [Claude Code hooks reference](https://code.claude.com/docs/en/hooks#reference-scripts-by-path); cycle-1 PLAN-EVAL verification |
| 4 | Installed Claude Code is `2.1.251`, which supports the documented exec-form command/args surface. | `claude --version` |
| 5 | The current hook needs only three environment reads (`CLAUDE_PROJECT_DIR`, `NETSCRIPT_RUN_ID`, `CLAUDE_SESSION_ID`) and writes only beneath the session launch root's hook-log directory. It does not need runtime read permission. | Granular permission probe below; logger source |
| 6 | `.llm/tools/agentic/claude/validate-claude-surface.ts` is the mandatory Claude-surface gate and currently checks JSON, skill sync, and that three root-cwd logger runs leave `deno.lock` unchanged. It does not cover nested cwd or configured-command fidelity. | `CLAUDE.md`; validator source |
| 7 | There is no focused hook test today. Existing Claude launcher tests are separate and do not exercise `.claude/settings.json`. | `find .llm/tools/agentic/claude`; focused `rg Deno.test` |
| 8 | `/home/codex` is absent, while `wslHome()` still defaults through `wslUser() === "codex"` to `/home/codex`; the existing unit test explicitly preserves that historical default. | `test ! -e /home/codex`; `agentic-lib.ts`; `agentic-lib_test.ts` |
| 9 | No relevant open architecture-debt entry covers Claude hook path resolution. | focused scan of `.llm/harness/debt/arch-debt.md` |

## Permission probe

The current script succeeds from the root with the proposed minimum permission classes:

```text
CLAUDE_PROJECT_DIR=<worktree> NETSCRIPT_RUN_ID=issue-1774-permission-probe \
CLAUDE_SESSION_ID=research-session deno run --no-lock \
--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID \
--allow-write=<worktree>/.llm/tmp/claude/hooks \
<worktree>/.llm/tools/agentic/claude/claude-hook-log.ts
permission_probe_exit=0
{"ts":"2026-08-30T15:07:17.837Z","sessionId":"research-session","event":{"hook_event_name":"research-permission-probe"}}
```

`--allow-read` is therefore unnecessary for the logger. The final config must express `<worktree>`
with `${CLAUDE_PROJECT_DIR}`, never a host path.

## Option analysis

| Option | Worktree portability | Cost / defect coverage | Research verdict |
| --- | --- | --- | --- |
| Settings only | Strong when it uses `${CLAUDE_PROJECT_DIR}` | Loads the correct script, but current logger still writes relative to turn cwd. | Reject as incomplete. |
| Hook script only | Can anchor output after it starts | Cannot repair a relative entrypoint that Deno fails to load. | Reject as impossible alone. |
| New wrapper | Can change cwd and launch the logger | Adds another executable/config seam and a helper whose only job is path indirection. | Reject under A6/A7. |
| Exec-form settings + logger launch-root output | Uses Claude's documented session launch-root contract; does not follow `EnterWorktree` | Smallest complete repair for #1774's nested-cwd defect; settings selects the launch checkout and script anchors output there. | Preferred for the plan. |

## Fixture shape

The focused test must parse `.claude/settings.json` instead of duplicating its commands. It will:

1. enumerate both `PreToolUse` and `Stop` configured command handlers;
2. substitute a supplied project root exactly as Claude does and execute shell form (RED) or exec
   form (GREEN), preserving stdin payloads;
3. invoke each handler from the session launch checkout and a nested `.llm/runs/...` cwd;
4. create a decoy cwd with `Deno.makeTempDir`, place its relative logger exactly at
   `<decoy cwd>/.llm/tools/agentic/claude/claude-hook-log.ts`, and require RED to reach its marker
   and distinctive exit;
5. in GREEN, model the session launch root through placeholder substitution, then assert its event
   log contains each unique payload and that the decoy marker is absent; and
6. clean its ignored log output.

Before repair, the nested cases fail at module resolution. The test itself must land and be pushed
as its own failing RED commit. After repair, the same unchanged fixture supplies GREEN and proves
both events plus worktree discrimination.

## jsr-audit surface scan (package/plugin waves)

N/A: this is repository-owned Claude hook tooling and does not change a published package or
plugin surface.

## Scope conclusion

- #1774 owns `.claude/settings.json`, the hook logger's session-launch-root output resolution, its
  focused fixture, any necessary validator alignment, and hook documentation directly made stale.
- The `wslHome()` `/home/codex` default is a confirmed sibling defect but belongs to launcher/home
  configuration work tracked by #1776. It is explicitly out of scope: changing it would alter
  unrelated Codex launcher contracts and tests.
- No `.github/workflows/**` edit is required; the repo-scope PAT boundary is not engaged.
- Aspire, Docker, browser, `e2e:cli`, and `scaffold.runtime` are irrelevant to this tooling-only
  repair and must not run without the serialized expensive-gate lease.

## Open questions

None that would force implementation rework. The plan must lock the combined settings/script
repair, granular permissions, unchanged RED→GREEN fixture, and the exact structured gate set.

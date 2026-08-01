use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-tools, netscript-pr

## Gate waiver — read first, verbatim from the owner

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

## Assignment — PR #1040 review-comment fix (cross-platform test paths)

Branch: `fix/1009-release-publish-arg-separator` (already checked out).
Worktree: `/home/codex/repos/fix-1009` — reuse it, never recreate or delete it.
Run dir: `.llm/runs/fix-1009-release-publish-arg-separator--codex/`
PR: #1040 (out of draft, CI currently 10 pass / 0 fail — **do not regress the green state**).

This is a MECHANICAL, single-file change. Do not write a plan document; write a two-line plan into
`worklog.md` and implement.

### The review comment (Augment, id=3696557434, SEVERITY MEDIUM)

`.llm/tools/release/preflight-text-imports_test.ts:72`:

> Passing `script.pathname` / `fixture.pathname` to `deno run` can break on Windows because
> `URL.pathname` for `file:` URLs is POSIX-ish (e.g. `/C:/...`) and may be percent-encoded.
> Convert these file URLs to platform file paths before using them as CLI args so the subprocess
> test is cross-platform.

### What to change

In `.llm/tools/release/preflight-text-imports_test.ts` only:

1. Import `fromFileUrl` from `jsr:@std/path@^1` — that is the specifier the sibling fixtures in
   `.llm/tools/release/tests/fixtures/` already use, and `.llm/tools/release/surface-diff.ts` uses
   `jsr:@std/path@^1.0.0` for the same helper. Do **not** introduce a new dependency or a new
   version range; match what this directory already does.
2. Replace **every** `new URL(...).pathname` in this test file with `fromFileUrl(new URL(...))`.
   There are six sites: line 72's two subprocess args (`script`/`fixture`), and the five
   `scanFile(new URL(...).pathname)` calls at roughly lines 32, 44, 49, 55, 64. The `scanFile`
   ones have the identical defect — `scanFile(path: string)` hands the value to
   `Deno.readTextFile`, which cannot open `/C:/...` or a percent-encoded path on Windows. Fixing
   only the flagged line would leave the same bug five lines up; fix the file.
3. Change nothing else. No behaviour change to `preflight-text-imports.ts`, no new tests, no
   refactor of the surrounding suite.

### Verification (run these, read the output, paste it into `worklog.md`)

- `deno test --allow-all .llm/tools/release/preflight-text-imports_test.ts` — all tests must pass,
  including `release:preflight task argv accepts a bare separator`.
- Repo-native scoped fmt + lint wrappers under `.llm/tools/` for the changed file.
- `.llm/tools/run-deno-check.ts` for the changed file. **Do not pass `--unstable-kv`** — the tool
  emits it by default and rejects the flag (exit 1).

### Commit

One commit, conventional: `fix(release): use platform paths in preflight test subprocess args`.
Do **not** push — the supervisor pushes explicitly. Leave the commit local on the branch.

## Teardown obligation — part of the job, not a courtesy

- If you start an Aspire AppHost, you own stopping it: `aspire stop --all --non-interactive --nologo`.
- **Never kill `aspire mcp start`** — those are the session's MCP servers, not AppHosts.
- **Never run a blanket `docker rm -f`** or `docker ps -aq | xargs`. Remove only containers your own
  run created, scoped by name and status. Prefer
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Before you return, verify with `docker ps -a` and `aspire ps` that you left nothing behind, and
  say what you found in your final message.

## Use the tooling we ship

Reach for `aspire` CLI verbs, `netscript plugin doctor`, `deno doc` / `deno info`, and the
`.llm/tools/` wrappers before hand-rolling a command. Read the logs you generate — an unread log is
the same waste as an unstopped container.

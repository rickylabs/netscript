# IMPL-EVAL — fix/1026-aspire-agent-wiring

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)
Subject: `0870b992e` (branch head), commits `7281006bd`, `51731c033`, `0870b992e`
Base: `origin/main` @ `3ab64720f` · PR #1030

Every result below was produced by the evaluator in this worktree. None is quoted from the slice.

## Commits inspected

| SHA | What the diff actually does |
| --- | --- |
| `7281006bd` | Adds `skills/aspire/SKILL.md`, `skills/deno/SKILL.md`, `skills/help.md`; extends `skills/manifest.json`; rewrites the `netscript` router hand-off table; regenerates `skills.generated.ts` (content + hash). |
| `51731c033` | Adds the `AspireAgentInitializer` port and `DenoAspireAgentInitializer` adapter; writes the `aspire` MCP entry into both host configs; replaces `AGENTS_SECTION` with a symptom-indexed block; 60 s `AbortSignal.timeout`; +162 lines of tests. |
| `0870b992e` | Run artifacts only (worklog, context-pack). No source. |

## Gates — run by the evaluator

```
deno test -A packages/cli/src/public/features/agent/      → ok | 9 passed | 0 failed
run-deno-check.ts --root packages/cli --ext ts,tsx        → 744 files, 7 batches, 0 diagnostics
run-deno-lint.ts  --root packages/cli --ext ts,tsx        → 744 files, 4 batches, 0 findings
deno task gen:assets-barrel; git status --porcelain       → empty (barrel is reproducible)
```

`deno fmt --check skills` reports 2 unformatted files — `skills/netscript-build/SKILL.md` and
`skills/netscript-operate/SKILL.md`, **both untouched by this branch** and both outside the repo's
`fmt:check` task (which scopes to `packages/**` and `plugins/**` `.ts`/`.tsx`). Pre-existing, not a
regression, not gating.

`e2e:cli run scaffold.runtime` not run: scaffold output is unchanged. Correct omission.

## Live cold-start behaviour — evaluator ran `agent init` into fresh temp dirs

1. **First run, `aspire` on PATH.** `.mcp.json` contains both `netscript` and
   `aspire: {command: "aspire", args: ["agent","mcp"]}`. Installed skills:
   `aspire deno help.md netscript netscript-build netscript-operate playwright-cli` — the
   delegation really ran and really installed `playwright-cli`.
2. **Second run.** `NetScript agent integration is already current.` in **1 second** — the
   delegation was skipped, not silently re-executed.
3. **`aspire` absent from PATH.** Output:
   `Installed NetScript agent integration for claude.` followed by
   `Aspire agent wiring was skipped: the aspire executable was not found on PATH.`
   The `aspire` MCP entry was still written and the command still succeeded.

## Plan-eval conditions

| Condition | Verdict |
| --- | --- |
| 1. Warn when the `aspire` binary is missing though the MCP entry is written | **Met** — live run 3 above; `messages` surfaced through `init-agent-command.ts`. |
| 2. Delegation idempotence | **Met** — guarded on `.claude/skills/playwright-cli/SKILL.md`; live run 2 completes in 1 s. |
| 3. Discoverability as a chain, not a grep | **Met** — (a) the `AGENTS.md` block names the symptom *and* the skill and orders `netscript plugin doctor` / `aspire logs` / `aspire otel` / `deno info` **before** `curl` or print debugging; (b) the routing test resolves every installed skill's routes, and the previously dangling `deno-fresh` / `netscript-deno-toolchain` references are gone; (c) `help.md` carries the symptoms with the commands beside them (`Healthy is not proof` → `aspire otel logs`; event never fires → `aspire otel traces`). |
| 4. #1023 overlap visible | **Met** — PR body carries `Closes #1026` and a `Refs #1023` paragraph that does not claim to close it. |

## Issue acceptance criteria

- [x] Aspire agent wiring installed — both routes taken: delegation **and** the `.mcp.json` entry.
- [x] Generated project exposes Aspire MCP tools — entry present in `.mcp.json` and `.vscode/mcp.json`.
- [x] `playwright-cli` installed — observed on disk after a real cold start.
- [x] Delegation bounded and non-interactive — 60 s `AbortSignal.timeout`, verified argv, three
      swallow/cancel tests, and a live missing-binary run.
- [x] Test asserts the `.mcp.json` Aspire entry and that installed routes resolve.

## Findings the slice did not report

1. **`netscript plugin doctor` is still not anchored to a symptom in `help.md`.** It appears only in
   `netscript-build/SKILL.md`. Given the measurement that motivated this cluster (0 invocations
   across five runs), that is the weakest remaining link. It is **#1023's acceptance box 5**, not
   #1026's, so it does not block this PR — but it must not be lost.
2. **Scope overlap with the in-flight #1023 branch.** Both branches rewrite `skills/manifest.json`
   and the inlined `skills.generated.ts`. Whichever merges second will conflict in a generated file;
   the resolution is "take the merged side, re-run `deno task gen:assets-barrel`". A human should
   sequence the two.

## Verdict

PASS — the fix is real, the gates are green, and every acceptance box on #1026 is evidenced.

Held as a **draft** for a human decision on merge order with #1023 only, per finding 2.

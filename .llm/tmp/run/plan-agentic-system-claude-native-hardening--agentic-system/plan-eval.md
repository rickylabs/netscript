# PLAN-EVAL — plan-agentic-system-claude-native-hardening--agentic-system

- Plan evaluator session: OpenHands / openrouter/minimax/minimax-m3, action run 27721989442.
- Run: `plan-agentic-system-claude-native-hardening--agentic-system`.
- Surface / archetype: docs / infrastructure / tooling (no package or plugin surface change).
- Scope overlays: `SCOPE-docs.md` (drift log + terminology), harness evaluator overlay (PLAN-EVAL
  protocol + plan-gate checklist).
- Implementation slice evaluated: `2857f552` "docs(agentic): add Claude-native supervision surface".

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` re-baselines against `origin/feat/package-quality@d1a5f212` and `origin/main@531f2b46` (PR #49 S2 quality-lane merge); carried-in plan explicitly not treated as ground truth. |
| Decisions locked                        | PASS              | `plan.md` "Locked Decisions" lists 5 architecture decisions (AGENTS.md vs CLAUDE.md split, `.agents/skills` canonical / `.claude/skills` generated, OpenHands as evaluator, daemon-attached WSL Codex as implementation agent, Claude native surfaces as complements not replacements) with rationale. |
| Open-decision sweep                     | PASS              | `plan.md` "Deferred Scope" + `worklog.md` "Deferred Scope" list 3 items (replacing WSL Codex, Claude plugin packaging, Agent SDK orchestration); all marked "safe to defer" and would not force rework. None would force rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS              | `plan.md` names 5 slices; `worklog.md` collapses to 3. Slice 1 (`2857f552`) touches 23 tracked files; the rest are doc-only / registry-only. The 2857f552 slice names the gate set in the PR body, but the per-slice gate mapping is implicit rather than explicit (minor). |
| Risk register                           | PASS              | `plan.md` "Risks" names 3 risks (mirror drift, Claude CLI version variance, hook noise) with mitigations (sync-claude:check, smoke script, JSONL-only v1 hooks). |
| Gate set selected                       | PASS              | 4 gates: `agentic:sync-claude:check`, `agentic:check-claude`, `agentic:smoke-claude-remote`, `deno check .llm/tools/agentic/*.ts`. Matches `SCOPE-docs.md` "Additional Gates" (source alignment, scope separation, link integrity, terminology, drift log). The `agentic:smoke-claude-remote` gate is environment-dependent and the worklog's "PASS" claim does not record that (see Findings). |
| Deferred scope explicit                 | PASS              | `plan.md` "Deferred Scope" + `worklog.md` "Deferred Scope" + `pr-body.md` all say live remote-control is explicit via `--live`; WSL Codex replacement deferred until parity proven. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | No package or plugin surface change; `AGENTS.md` doctrine says jsr-audit applies to `packages/` and `plugins/` waves only. |

## Open-decision sweep (evaluator-run)

None. All deferred items are explicitly listed and would not force rework if deferred.

## Findings (informational — do not block the plan-gate)

### F-1 — Hook lockfile-churn latent hazard (LOW, forward-looking)

`/.claude/settings.json` PreToolUse and Stop hooks run:

```
deno run --allow-env --allow-read --allow-write .llm/tools/agentic/claude-hook-log.ts
```

…without `--no-lock`. The worklog's design intent (and the explicit claim in the Gate Evidence
notes) is: **"Agentic Deno tasks use `--no-lock` because the tools have no external imports and
should not normalize `deno.lock`."** All four `agentic:*` Deno tasks honour that intent; the
hooks do not.

**Empirical check** (this evaluator session, after `git restore deno.lock`): running the hook 5
times in a row does NOT mutate `deno.lock` today, because the hook script has zero imports and
Deno's lock resolution is a no-op. The hazard is forward-looking: any future change to the hook
script (or to any agentic tool the hook transitively loads) that adds an import will cause
`deno.lock` to be rewritten on every PreToolUse invocation (Bash / Write / Edit / MultiEdit)
across every Claude session in every worktree. That is the literal "lockfile churn" hazard the
evaluator scope asks about.

**Suggested fix** (follow-up slice, not a plan-gate blocker):

```diff
- "command": "deno run --allow-env --allow-read --allow-write .llm/tools/agentic/claude-hook-log.ts"
+ "command": "deno run --no-lock --allow-env --allow-read --allow-write .llm/tools/agentic/claude-hook-log.ts"
```

…in both the `PreToolUse` and `Stop` hook entries. Add a regression check that asserts
`deno.lock` is byte-identical after running the hook N times.

### F-2 — Smoke gate evidence does not record the actual exit code (MEDIUM, evidence hygiene)

`worklog.md` Gate Evidence shows `deno task agentic:smoke-claude-remote` as **PASS**, but the
tool has no environment-detection: it spawns `claude --version`, `claude --help`, `claude
remote-control --help`, and `claude agents --help`, and exits 1 if any of them fail. In the
default CI / Linux-container environment (and in this evaluator session) the `claude` binary is
not on PATH, so the tool returns **EXIT=1**:

```
FAIL claude --version
FAIL claude --help
FAIL claude remote-control --help
FAIL claude agents --help
EXIT=1
```

…with stderr `NotFound: Failed to spawn 'claude': entity not found`.

The generator's environment must have had `claude` installed (likely the user's macOS Codex
machine). The worklog should say so explicitly. As written, the gate table is misleading and
will propagate a false positive to any downstream evaluator that treats `worklog.md` Gate
Evidence as ground truth. The gate itself is appropriate (it documents the Claude CLI surface
that v2.1 ships); the evidence just needs to be honest.

**Suggested fix** (follow-up slice):

- In `worklog.md` and `commits.md`, record the actual exit code and the environment for every
  smoke run. Example: `agentic:smoke-claude-remote` | PASS | macOS, `claude@1.x` installed;
  SKIP in CI without `claude` on PATH (tool returns EXIT=1 by design, not a defect).
- Consider an `--env-aware` mode in `claude-remote-smoke.ts` that emits a structured `SKIP` exit
  code (e.g. 0 with `report.skipped: true`) when `claude` is not on PATH, so the gate can be
  wired into CI without false negatives.

### F-3 — `.llm/tmp/claude/` and `deno.lock` churn in this worktree (RESIDUAL, not in PR)

This worktree currently has uncommitted churn in `deno.lock` (281 lines added) and in
`.llm/tmp/run/openhands/{pr-17,pr-25,...}/request.md` scratch files. The `deno.lock` churn is
from `deno install` materializing catalog and transitive npm dependencies (`@prisma/*`,
`@orpc/*`, `@durable-streams/*`, `amqplib`, `pg`, `clsx`, `tailwind-merge`, `ioredis`,
`@tanstack/db`, `preact-render-to-string`, etc.). None of that is from the agentic tools; it
is unrelated environment churn. It should be `git restore`d before the next slice is committed
so the PR does not mix unrelated lock churn into the agentic surface.

The `2857f552` commit itself does NOT include this churn. Verified via `git show --stat
2857f552`: the commit touches only the agentic surface (CLAUDE.md, .claude/, .agents/skills/,
.gitignore, .llm/tools/agentic/, .llm/harness/, run artifacts).

### F-4 — Plan-gate process discipline (PROCESS, not a plan defect)

Per `run-loop.md` § 4 and `plan-gate.md` "Why this gate exists", implementation may not begin
until the Plan-Gate verdict is `PASS` or the user waives it in writing. Slice `2857f552` was
committed (Wed Jun 17 2026) before this PLAN-EVAL session ran (action run 27721989442). That is
a process violation by the generator, not a defect in the plan or the slice. The slice itself
is sound; the order was not. Future runs should have the workflow block implementation until
PLAN-EVAL emits `PASS`.

## Verdict

`PASS`

All 8 plan-gate boxes are satisfied; the plan is decision-complete; the design checkpoint in
`worklog.md` matches the implementation slice `2857f552`; the gate set is appropriate for the
docs / infrastructure / tooling surface (no package or plugin change).

The two implementation findings (F-1, F-2) and the residual risk (F-3) are real but they are
out of scope for the plan-gate. They should be addressed in a follow-up slice before the next
agentic change is merged. The process note (F-4) is a workflow-level fix, not a plan fix.

### Required follow-ups (next slice, not this gate)

1. Add `--no-lock` to the hook `deno run` invocation in `.claude/settings.json` (F-1).
2. Record the actual exit code and environment for `agentic:smoke-claude-remote` in
   `worklog.md` / `commits.md`; consider a `--env-aware` SKIP exit code in the smoke tool
   (F-2).
3. `git restore deno.lock` and remove the untracked scratch under `.llm/tmp/run/openhands/`
   before the next slice is committed (F-3).

### Notes

- This evaluator ran on action run 27721989442 with model openrouter/minimax/minimax-m3 per
  `netscript-harness/SKILL.md` "Agent Delegation Contract" (PLAN-EVAL must run in OpenHands
  with minimax M3).
- The `.claude/skills` mirror is current: 17/17 source skills mirrored;
  `agentic:sync-claude:check` returns `OK CLAUDE.md: contains @AGENTS.md / OK
  .claude/settings.json: valid JSON / OK .gitignore: ignores .claude/settings.local.json / OK
  .claude/skills: agentic:sync-claude OK: 17 skill(s), 17 mirrored file(s)`. No stale-skill
  drift.
- No false mobile-visible agent claims found. The plan and worklog correctly defer WSL Codex
  replacement behind parity evidence and require daemon status + thread id + remote-control
  proof before claiming user-visible attachment. No false Claude-attachment claims.
- The plan correctly separates doctrine (`.llm/harness/`, `AGENTS.md`,
  `docs/architecture/`) from current-state Claude surface (`.claude/`). `CLAUDE.md` `@AGENTS.md`
  import keeps cross-agent doctrine single-sourced.

use harness

# Leaf brief — #1774 make Claude hook logging independent of turn cwd

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1774`
- Branch: `fix/claude-hook-log-cwd-independent` @ `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` (live `main`), **no upstream**
- Run dir: `.llm/runs/fix-claude-hook-log-cwd--1774/`
- Push: explicit refspec only — `git push origin HEAD:refs/heads/fix/claude-hook-log-cwd-independent`
- Closes exactly **#1774**

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load
`.agents/skills/claude-manager` (Claude session/hook configuration surface),
`.agents/skills/netscript-tools` (structured wrappers, gate receipts, `agentic:check-claude`,
lock hygiene), `.agents/skills/netscript-doctrine` (`.llm/tools/agentic/**` is repo tooling — layering
and no-`any` rules apply), and `.agents/skills/netscript-pr`.

`CLAUDE.md` requires `.llm/tools/agentic/claude/validate-claude-surface.ts` when Claude
configuration, skills, hooks, or agent orchestration docs change — treat that as a mandatory gate.

## The defect (read #1774 in full: `gh issue view 1774`)

Checked-in `.claude/settings.json` invokes `.llm/tools/agentic/claude/claude-hook-log.ts` by
**relative path**. Claude hooks inherit the turn's cwd, so when a supervisor or evaluator works from a
run directory, `PreToolUse` and `Stop` resolve a nonexistent nested path like
`<worktree>/.llm/runs/<run>/.llm/tools/agentic/claude/claude-hook-log.ts` and emit a non-blocking
`Module not found` false positive. It reproduced in the live 0.0.7 features, Aspire, and evaluator
sessions; the same hook succeeds from the worktree root.

**Re-derive this yourself before building on it.** Reproduce the failure from a nested
`.llm/runs/<run>` cwd and confirm success from the root, and record the raw output. A prior leaf in
this lane spent two cycles on a carried claim that was re-run against the wrong entrypoint.

## Phase

Bootstrap → research → plan, then **stop at the plan gate**. Do not implement before PLAN-EVAL.

## What the plan must settle

- **How the root is resolved** without a host-specific path. The acceptance criteria forbid
  introducing `/home/agent` **or** the retired `/home/codex`. Note as current fact: **`/home/codex`
  no longer exists on this host**, and `.llm/tools/agentic/lib/agentic-lib.ts`'s `wslHome()` still
  defaults to `/home/${wslUser()}` = `/home/codex`, which already breaks `launch-codex-slice` unless
  `NETSCRIPT_WSL_HOME` is set. Decide whether #1774 fixes only the hook path or also names that
  sibling defect as out of scope — do not silently widen.
- Whether resolution is done in `settings.json`, in the hook script itself, or by a wrapper — and what
  each costs in worktree portability.
- **Both** `PreToolUse` and `Stop` must be covered; say how the fixture proves each.
- Permissions: keep hook output and permissions no broader than required, and say what "required" is.

## The five acceptance gates are executable — plan them as gates, not prose

1. Fixture invokes each configured hook from the worktree root **and** from a nested
   `.llm/runs/<run>` directory; both exit successfully.
2. The nested-cwd fixture **demonstrably fails before the repair** — this is your RED and it must be
   visible in history as its own commit.
3. The resolved command executes **this worktree's** checked-in `claude-hook-log.ts`, not a global or
   sibling checkout. Prove it distinguishes them.
4. `agentic:check-claude` plus the focused hook/launcher tests pass with structured evidence.
5. No host-specific `/home/agent` or `/home/codex` path introduced — assert it, do not merely avoid it.

## Working rules

RED before GREEN, visible as its own commit. Commit and push at every slice boundary. Copy SHAs from
`git log`, never retype. Record drift in `drift.md` as you go.

## Host facts (current)

PID 1 is `tini`, **0 zombies** — root `deno task test` **is** a usable verdict source and is green at
this base. `fs.inotify.max_user_instances` is **1024**. Docker/DinD is operational (**28.5.2**) but
Aspire, Docker, browser, `e2e:cli` and `scaffold.runtime` need the coordinator's serialized
expensive-gate lease, which this leaf does **not** hold. `rtk` is not installed. Do not kill any
process you did not start.

**Credential boundary — plan around it.** The current PAT carries `repo` scope only, so **any commit
touching `.github/workflows/**` cannot be pushed**; a sibling leaf is stranded on exactly that today.
`.claude/settings.json` is *not* a workflow file and is fine. If your plan needs CI wiring, isolate it
into its own final commit so the remainder stays pushable, and say so.

## Boundaries

Open the PR **draft** with `Closes #1774`, milestone `0.0.7`, labels `type:fix` + `area:tooling` +
`area:agentic` and exactly one `status:`. Do not merge, mark ready, relabel the issue, close anything,
or change milestone scope. Do not launch or simulate any evaluator — PLAN-EVAL and IMPL-EVAL are
dispatched separately by the supervisor. Do not modify other lanes' worktrees or sessions.

Report when `plan.md` is pushed, with the head SHA and your PLAN-EVAL readiness statement.

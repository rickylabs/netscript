use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, aspire, deno

## Assignment — rebase PR #1036 onto current `origin/main` and re-prove the gates

Repo: `rickylabs/netscript`. Worktree: `/home/codex/repos/fix-1025` (already checked out — **reuse
it, never recreate or delete it**). Branch: `fix/1025-aspire-otel-discovery`.
Run dir: `.llm/runs/fix-1025-aspire-otel-discovery--otel-discovery/`.
PR: #1036 (draft). Issue: #1025.

PR #1036 has **no failing checks and no open review threads**. Its only blocker is
`mergeStateStatus: DIRTY` — the branch is **13 commits behind and 9 ahead** of `origin/main` and
conflicts. Your job is the rebase and the re-proof, **not a redesign of the fix**.

### Evaluator lane — read this before you plan

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

### The rebase

```sh
cd /home/codex/repos/fix-1025
git fetch origin --prune
git rebase origin/main            # currently 8b69d78f0
```

Thirteen fixes merged since this branched. The supervisor ran a **throwaway probe rebase in a
scratch clone** (not this worktree) and measured **exactly one conflict**, in commit
`c5c70c21b fix(cli): emit detached Aspire telemetry tasks`:

`packages/cli/src/kernel/constants/scaffold/scaffold-files.ts`

```
<<<<<<< HEAD
  TSCONFIG_ROOT: 'tsconfig.json',
  TSCONFIG_APP: 'tsconfig.json',
=======
  ASPIRE_CLI_TASK: 'aspire-cli.ts',
>>>>>>> c5c70c21b (fix(cli): emit detached Aspire telemetry tasks)
```

**Resolve by taking the merged sources — keep all three keys**, `ASPIRE_CLI_TASK` from this branch
plus `TSCONFIG_ROOT`/`TSCONFIG_APP` from `#1038`. Never resolve a conflict by taking one side
wholesale, and regenerate generated files rather than hand-patching them. Treat the probe as a
hint, not gospel — if the real rebase differs, resolve on the merits and say so in the worklog.

The other four files that both sides touched (`plan-init.ts`, `plan-init_test.ts`,
`generators_test.ts`, `suite-registry_test.ts`) auto-merged cleanly in the probe.

### Two invariants you must preserve through the rebase

1. **#1034** replaced destructive `docker ps -aq | xargs -r docker rm -f` guidance in `skills/help.md`
   with Aspire-CLI-first commands, and made the whole `skills/` surface free of blanket-removal
   advice. **Never reintroduce docker-nuke guidance anywhere.** Verify after rebasing:
   `grep -rn "docker ps -aq\|docker rm -f" skills/ .agents/skills/ .claude/skills/` must return
   nothing.
2. **#1041** wired `check:emitted-samples` into `.github/workflows/ci.yml` (line ~133) and extended
   it to the `add` surface. **Do not drop that.** Verify: `grep -n "emitted-samples"
   .github/workflows/ci.yml` still hits, and `deno task check:emitted-samples` passes.

### Gates to run after the rebase (scoped — root wrappers exclude `packages/cli`)

Root `lint`/`fmt:check`/`check` exclude `packages/cli` by their own exclude regex; a green root
wrapper proves nothing here. Re-run scoped over the packages you touched:

```sh
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
```

**Do not pass `--unstable-kv` to `.llm/tools/run-deno-check.ts`** — it emits that flag by default and
rejects it on the command line (exit 1).

Then the CI-relevant repo gates:

```sh
deno task check
deno task test
deno task check:emitted-samples
deno task lint && deno task fmt:check
deno task docs:maintenance   # or the docs:links / docs:accuracy pair, whichever exists
```

Known pre-existing, **not yours to fix**: `deno task agentic:sync-claude:check` reports
`stale: .claude/skills/netscript-release/SKILL.md` on **`origin/main` itself** (the supervisor
verified this on a clean `8b69d78f0` checkout). Leave it alone; do not sync-regenerate unrelated
mirrors to chase it. If your change touches `.agents/skills/aspire/SKILL.md`, its
`.claude/skills/aspire/SKILL.md` mirror **must** stay in sync — that one is yours.

### The runtime evidence that actually matters

The measured bar for this cluster: across five agent runs `aspire otel` and `aspire export` were
invoked **zero** times. Prose alone fixes nothing — an agent starting cold must reach working traces
without ever knowing `--dashboard-url` exists. The branch's answer is the generated `aspire:otel` /
`aspire:export` workspace tasks plus the `behavior.otel-task-traces` gate.

The last full runtime pass **never reached that gate**: it exited 1 at `behavior.service-health`
because the users service's Prisma database check stayed unhealthy. `#1043
fix(cli): resolve published plugin Prisma schemas on dependency-mode install` has since merged into
`main` and is a strong candidate for exactly that failure — so after the rebase, run the full suite
once and find out:

```sh
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Record the **terminal exit code** and, specifically, whether `behavior.otel-task-traces` was reached
and what it returned. That gate result is the evidence the supervisor needs to decide which
acceptance boxes on issue #1025 may be ticked. If it still fails before reaching the gate, say so
plainly with the failing gate name — **do not** paper over it and do not claim traces you did not
observe. **Read the logs you generate**; an unread log is wasted evidence.

### Teardown is part of the job, not a courtesy

Dangling Aspire AppHosts and Docker containers from agent runs have cost this project real time.
**If you start an AppHost, you own stopping it before you return.**

- Prefer `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — the `--cleanup` flag
  exists for exactly this.
- Stop strays with `aspire stop --all --non-interactive --nologo`.
- **Never kill `aspire mcp start`** — those are the session's MCP servers, not AppHosts.
- **Never run a blanket `docker rm -f` or `docker ps -aq | xargs`.** That is precisely the
  destructive shortcut being deleted from the shipped skills in #1034; do not practise what we are
  deleting. Remove only containers your own run created, scoped by name and status.
- Before you return, verify with `docker ps -a` and `aspire ps` that you left nothing behind, and
  state what you found.

Use the tooling we ship rather than improvising: `aspire` CLI verbs, `netscript plugin doctor`,
`deno doc` / `deno info`, and the `.llm/tools/` wrappers, before hand-rolling a command.

### Push — explicitly

The worktree has **no upstream by design**. A previous run left six good commits unpushed while CI
graded a stale head.

```sh
git push --force-with-lease origin HEAD:refs/heads/fix/1025-aspire-otel-discovery
git rev-parse HEAD
git ls-remote origin fix/1025-aspire-otel-discovery
```

The force is legitimate here and only here: a rebase rewrites history, and the remote head is
`b8edf03c5`, which you are replacing. **Confirm the two SHAs match** before you report done.
Always pass `--repo rickylabs/netscript` to every `gh` command.

### Out of scope — the supervisor does these, not you

- Do **not** edit the PR #1036 body, its labels, or its draft state.
- Do **not** edit or tick boxes on issue #1025.
- Do **not** open an issue on the upstream Aspire repository — nobody in this lane has authority to
  file on external repos.
- Do **not** redesign the fix. If you believe the design is wrong, write that in `drift.md` and say
  so in your report; do not act on it unilaterally.

### Non-negotiables (learned the hard way — do not rediscover these)

1. **VERIFY THE ARTEFACT, NEVER THE EXIT CODE.** A previous session produced two false "pushed"
   reports from an `&&` chain short-circuiting on a no-op commit, and silently lost a file. After any
   commit or push, confirm the object exists: `git log`, `git ls-remote`, `gh pr view`.
2. **ALWAYS pass `--repo rickylabs/netscript` to every `gh` command.** Running `gh pr edit` from the
   wrong directory once destroyed an unrelated merged PR's body.
3. **Scoped gate evidence only.** See the scoped-runner note above.
4. **Report what happened, not what should have happened.** A partial result reported honestly is
   worth more than a green claim that does not survive `gh pr checks`.

### Deliverables

- Rebased branch pushed; local and remote SHAs confirmed identical.
- `worklog.md` in the run dir updated with: the conflict and how you resolved it, every gate command
  with its real exit code, the `scaffold.runtime` terminal result including whether
  `behavior.otel-task-traces` was reached, and the teardown verification output.
- A final report stating the pushed SHA, the gate results, and anything still red.

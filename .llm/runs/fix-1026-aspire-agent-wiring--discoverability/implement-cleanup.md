use harness

## SKILL

netscript-harness, netscript-cli, netscript-tools, netscript-doctrine, netscript-pr

## Evaluator waiver — read this first

The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
then proceed directly to implementation.

## Assignment — one follow-up slice on PR #1030

Branch: `fix/1026-aspire-agent-wiring` (already checked out at `/home/codex/repos/fix-1026`).
Run dir: `.llm/runs/fix-1026-aspire-agent-wiring--discoverability/`
PR: #1030 (draft). Baseline for this slice: `1760e58b4`.

This is a **single mechanical, convergent doc fix plus a regeneration**. Do not re-plan the PR, do
not touch the agent-init TypeScript, do not rebase, do not push.

### The defect

`skills/help.md` — added by this PR in commit `7281006bd` — ships destructive cleanup guidance:

- line 153, section `## Cleaning up after yourself`:
  `docker ps -aq | xargs -r docker rm -f`
- line 40, section `## A dangling AppHost is causing conflicts`:
  `docker ps -a   # then clear exited orphans`

`docker ps -aq | xargs -r docker rm -f` force-removes **every** container on the machine, including
containers that belong to other projects, other developers, and other AppHosts. On a shared or dev
host this is data loss, and it is guidance we are shipping *into* every scaffolded project through
`netscript agent init`. Augment flagged the identical line on sibling PR #1034 at **severity: high**
(comment `3696483256`).

### Why we fix it here rather than waiting for the rebase

Sibling PR #1034 (`fix/1023-agent-init-skill-surface`, head `a5310a19c`) already fixed this in its
commit `707e8d235`, replacing the docker-nuke with inspect-first Aspire CLI guidance. #1034 lands
first and this branch then rebases onto it.

But #1030 is a draft that must stand on its own, and today it *reintroduces* the destructive line.
If the rebase conflict in `skills/help.md` were resolved toward this branch's side, the high-severity
fix would be silently dropped. So: **converge this branch's two sections onto #1034's already-fixed
wording** before the rebase, so the conflict resolves trivially and neither side can lose the fix.

### What to change

Fetch the canonical wording from #1034 rather than inventing your own:

```sh
git fetch origin fix/1023-agent-init-skill-surface
git show a5310a19c:skills/help.md
```

In `/home/codex/repos/fix-1026/skills/help.md`, replace **only** these two sections' bodies with
#1034's versions (verbatim, so the rebase is a clean convergence):

1. `## A dangling AppHost is causing conflicts` — the fenced block plus the trailing paragraph. The
   fixed version inspects first (`aspire ps --format Json`, `aspire describe --format Json`), offers
   `aspire resource <resource> stop` for targeted cleanup, gates `aspire stop --all` on "only after
   confirming every listed AppHost is yours", and ends with "leave leftover containers for Aspire to
   reclaim rather than removing containers by hand." The **Never kill `aspire mcp start`** sentence
   stays.
2. `## Cleaning up after yourself` — the whole section. #1034's version is Aspire-CLI-only: inspect,
   targeted stop, `aspire stop --all` gated on confirmation, then the `dcp` ~20s note, the
   `aspire doctor` escalation, and the `aspire cache clear` clarification.

Invariants for this file after your change:

- **No command anywhere in `skills/help.md` removes, kills, or prunes a container.** `grep -nE
  'docker (rm|kill|prune|stop)|xargs .*docker' skills/help.md` must return nothing.
- Any surviving `docker` mention must be read-only and clearly subordinate to the Aspire CLI.
- Every command you leave in the file must actually exist on Aspire CLI 13.4.6 — the file's own
  header promises that. Verify with `aspire --help` / `aspire <verb> --help`; if a flag does not
  exist, drop the flag rather than shipping a command that errors.
- Do not change any other section of `help.md`. This slice is scoped to the two cleanup sections.

### Regeneration (this is the part that is easy to forget)

`skills/help.md` is inlined into `packages/cli/src/kernel/assets/skills.generated.ts`. That file is
**generated** — do not hand-edit it:

```sh
deno task gen:assets-barrel
```

Then prove it is reproducible: run the generator a second time and confirm `git diff` is empty.
`surface-diff` and `check-test` in CI will catch a stale barrel, so verify locally first.

### Validation — verify the artefact, never the exit code

```sh
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root skills --ext md
deno test -A packages/cli/src/public/features/agent/init/init-agent_test.ts
```

Do **not** pass `--unstable-kv` to `.llm/tools/run-deno-check.ts` — it emits that flag by default and
rejects it explicitly (exit 1).

Do not run `deno task e2e:cli`. Scaffold output is unchanged by this slice; the supervisor is
handling the `scaffold-runtime` gate.

Record the raw command output in the run dir's `worklog.md`, including the `grep` result that proves
no container-removal command survives.

### Commit and stop

One commit on `fix/1026-aspire-agent-wiring`:

```
fix(skills): replace destructive docker cleanup with Aspire CLI guidance
```

Include in the body: the Augment finding id `3696483256`, the convergence with #1034 `707e8d235`,
and that `skills.generated.ts` was regenerated rather than hand-edited.

**Do not push.** The supervisor pushes and drives CI. Write your worklog entry and stop.

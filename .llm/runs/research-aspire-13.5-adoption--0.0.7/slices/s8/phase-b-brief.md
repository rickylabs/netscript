use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, and `.agents/skills/netscript-pr/SKILL.md` before acting.
You are the Codex · GPT-5.6 Sol · medium implementation thread for this slice; the supervisor holds
the serialized host runtime lease for this phase only.

# S8 Phase B — execute `runtime.typed-db-phase-b` live (lease-backed, same thread)

You are the S8 implementer for #1720 / PR #1754 (thread `01a051e6-90d4-7e50-a91e-ac4bd23b880c`,
worktree `/home/agent/projects/netscript/worktrees/007-aspire-s8`, branch
`feat/aspire-13-5-s8-typed-resource-commands` @ `f2395465`, stacked on S6; push with the explicit
refspec only). No evaluators, no `evaluate*.md`, no product source change unless a Phase-B gate
proves a defect in your own S8 code (then: RED test → minimal fix → same commit trail).

## Host protocol (supersedes every earlier host paragraph)

- `netscript-dind` = `10.4.12.22`, Docker 28.5.2, `DOCKER_HOST=tcp://netscript-dind:2375` via
  `/home/agent/.local/bin/mise exec --`; `/home/agent` bind-mounted identically into the dind;
  generated `DataPath` bind mounts work.
- The supervisor runs an owner-scoped relay under the lease so DCP's `127.0.0.1:<port>` publishes
  are reachable at `127.0.0.1:<port>` here. Containers named `relay-*` and the `loopback-relay.ts`
  process are **supervisor-owned**: never stop/remove/report them as leaks; list them as
  foreign/supervisor-owned.
- The e2e runner already performs the workspace install, restore, and `--isolated` start; do not
  add manual steps around it.

## Steps

1. Preflight verbatim into the worklog: `aspire ps` → `[]`; `docker ps -a` → empty or `relay-*`
   only; `docker volume ls` → empty; head equals origin.
2. One pass, from the worktree root, with a report file:
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/runs/<your run dir>/receipts/phase-b-scaffold-runtime.json`
   (if `--report` is not a flag of this runner, use the runner's documented report output and
   copy it). This executes `runtime.typed-db-phase-b` (`<db>-cli --help`, `migrate --timeout 60`,
   `reset` without `--confirm`, Unhealthy-but-Running bounded wait + recovery, AppHost count) with
   the other runtime gates. Do not split it into individual gate commands. No retry: one pass,
   whatever the verdict.
3. Persist: the report JSON, the per-gate stdout/stderr tails for every `runtime.*` gate, the exact
   `aspire ps` count evidence, and `receipts/phase-b-relay-inventory.txt` (the `relay-*`
   containers you observed and left untouched).
4. Fix the D-44 A-1 wording in `05-consumer-typecheck-13.5.3.txt` (tsc exit 2 with exactly the two
   allowed `TS2307 'zod'` baseline errors, zero S8 errors — not "exit 0 / no zod errors").
5. Teardown: the suite's `--cleanup` stops the AppHost; then remove only your persistent
   `postgres-*` survivor (creation time inside your window) and its same-second anonymous volume;
   `agentic:leak-check` (ignore `relay-*`); final `aspire ps` `[]`, `docker ps -a` only `relay-*`
   or empty, volumes empty — recorded verbatim.
6. Commit run artifacts, push explicitly, comment on PR #1754 `## [PHASE: IMPL] S8 phase B` with
   the SHA, suite verdict (`passed/failed` counts, failing gate names if any), and the zero proof.
   If a gate fails for a host reason keep the exact receipt, tear down, report; no workaround.

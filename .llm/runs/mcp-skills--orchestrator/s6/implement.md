use harness

# Slice S6 — CLI trigger tools: `list_commands` + `execute_command` gate

## SKILL

Read before coding: `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-cli/SKILL.md` (command registry + public tree),
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s6`. Branch: `feat/netscript-mcp-skills-s6-clitrigger`.
- **Base verification preflight (mandatory, first)**: `git -C /home/codex/repos/ns-combo-s6
  log --oneline -1` must show `454be64d` (or a descendant containing it — run
  `git -C /home/codex/repos/ns-combo-s6 merge-base --is-ancestor 454be64d HEAD`), and
  `/home/codex/repos/ns-combo-s6/packages/mcp/src/application/flows/doctor-flow.ts` must exist.
  If not, STOP and report.
- **Harness provisioning**: you are authorized to provision this slice's run-dir artifacts at
  `/home/codex/repos/ns-combo-s6/.llm/runs/mcp-skills--orchestrator/s6/` (pattern: committed
  `s1/`, `s3/`–`s5/` dirs), including separate-session PLAN-EVAL; escalate after two failures.
- GitHub issue: rickylabs/netscript#730 (epic #721, umbrella PR #715). Conventional commits
  referencing `#730` (no closing keyword).
- A sibling agent authors the public skill bundle under a new top-level `skills/` dir — you will
  not collide; do not create `skills/`.
- Lock hygiene: no new external deps. A workspace dep from `packages/mcp` on `@netscript/cli`
  is FORBIDDEN (S7 makes cli depend on mcp). Use ports + injection (see below).
- Scope ONLY S6. No `agent` CLI command group (that is S7); no docs/telemetry changes.

## Context

- Design: `/home/codex/repos/ns-combo-s6/.llm/runs/mcp-skills--orchestrator/design.md` §3 (CLI
  trigger). Research `research-netscript-surfaces.md` §2 (CliCommandRegistry, public command
  tree, no uniform --json). Epic #701 grows the verb surface — enumeration must be DYNAMIC.
- S5 established the dependency-inversion pattern (`ProjectDoctorPort` + injected adapter) —
  follow it: `packages/mcp` defines ports; the CLI (S7) injects real implementations.

## Deliverables

1. **Domain ports** (`src/domain/`):
   - `CommandCatalogPort`: enumerate available CLI verbs → `CommandDescriptor[]` (path e.g.
     `db migrate`, description, args/flags summary — bounded strings).
   - `CommandExecutorPort`: run a verb with args → `{ exitCode, durationMs, outputTail,
     truncated }` (outputTail bounded, e.g. last 4KiB combined stdout+stderr).
   - `CommandPolicy` (pure domain data + functions): allowlist decision for a command path.
     Policy model: explicit allow-prefix list + explicit deny-prefix list, deny wins, default
     deny. Ship a DEFAULT policy: allow `db` (init/generate/migrate/seed/status/introspect —
     NOT reset), `generate`, `contract`, `service` (read/list ops), `plugin` (add/list/sync/
     doctor — NOT remove), `ui`; deny `deploy`, `init`, `marketplace`, `db reset`, anything
     unknown. Policy is data (exported constant) so S7/S8 can render it and consumers can
     override via server options.
2. **Flows** (`src/application/flows/`): `list_commands` (catalog port, optional filter/limit),
   `execute_command` (policy check → structured `command_denied` error naming the rule;
   allowed → executor port; result includes exitCode, durationMs, bounded outputTail,
   truncated flag). Tool description text must state the allowlist gate and that output is a
   bounded tail.
3. **Default infrastructure adapters** (`src/infrastructure/`):
   - `SpawnCommandExecutor`: spawns the project's CLI as a subprocess. Command resolution:
     explicit `cliCommand` option (string[]) → default `['deno', 'task', 'netscript', ...verb]`?
     — VERIFY how scaffolded apps invoke the CLI (check `packages/cli/src/kernel/templates/app/`
     for the deno.json tasks the scaffold emits, e.g. a `netscript` task or `deno run -A
     jsr:@netscript/cli`) and use that as the documented default; make it injectable either way.
     Timeout option (default e.g. 120s) → kill + `timed_out` in result.
   - `StaticCommandCatalog`: catalog from a static descriptor list (S7 injects a real
     registry-backed catalog from the CLI side; ship the port + a stub/static default that
     returns an informational "catalog not wired" descriptor set — mirror the S5 stub pattern).
   Record in drift.md: real registry-backed catalog + real executor default wiring arrive in S7.
4. **Contract fit**: adjust `list_commands`/`execute_command` schemas minimally to carry these
   shapes; keep all tests green.
5. **Composition**: wire flows in `cli.ts` (additive; policy from options/default).
6. **Tests**: policy table-driven tests (allow/deny/deny-wins/default-deny), executor test using
   a cheap real subprocess (e.g. `deno eval 'console.log(1)'` as the injected cliCommand) incl.
   timeout + truncation paths, list_commands filter/limit, execute_command denied path.

## Validation (run, paste real output into worklog)

- `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts` (+ lint + fmt wrappers)
- `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`
- `deno task arch:check`; doc lint; package publish dry-run.

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s6/.llm/runs/mcp-skills--orchestrator/s6/worklog.md`; drift in
`s6/drift.md`. Small logical commits, then push:
`git -C /home/codex/repos/ns-combo-s6 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s6-clitrigger`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.

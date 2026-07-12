use harness

# Slice S7 — CLI integration: `netscript agent mcp` + `netscript agent init`

## SKILL

Read before coding: `.agents/skills/netscript-cli/SKILL.md` (command tree, registry,
scaffold), `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-deno-toolchain/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s7`. Branch: `feat/netscript-mcp-skills-s7-cli`.
- **Base verification preflight (mandatory, first)**:
  `git -C /home/codex/repos/ns-combo-s7 merge-base --is-ancestor cac53d66 HEAD` must succeed and
  `/home/codex/repos/ns-combo-s7/skills/manifest.json` must exist. If not, STOP and report.
- **Harness provisioning**: you are authorized to provision this slice's run-dir artifacts at
  `/home/codex/repos/ns-combo-s7/.llm/runs/mcp-skills--orchestrator/s7/` (pattern: committed
  `s1/`–`s6/`), including separate-session PLAN-EVAL; escalate after two failures.
- GitHub issue: rickylabs/netscript#731 (epic #721, umbrella PR #715). Conventional commits
  referencing `#731` (no closing keyword).
- SIBLING COORDINATION (important): epic #701 agents may be working other `packages/cli`
  command groups on different branches. Your `agent` command group is NEW — keep changes to
  shared files (`public-command-tree.ts`, root registry) minimal and additive.
- Lock hygiene: only the workspace dep `@netscript/cli` → `@netscript/mcp` (mirror how the CLI
  imports other workspace packages). No external deps.
- Scope ONLY S7. No new MCP tools; no docs-site pages (S9); no skill-content edits (only COPY
  the bundle).

## Context

- Design: `/home/codex/repos/ns-combo-s7/.llm/runs/mcp-skills--orchestrator/design.md` §3
  (meta), §4 (skills/agent init), §2 (one binary, three faces).
- `packages/mcp` is complete through S6. Injection seams awaiting real adapters (read the drift
  files `s5/drift.md`, `s6/drift.md` + the ports):
  - `ProjectDoctorPort` (`packages/mcp/src/infrastructure/plugin-doctor-family.ts` /
    `src/domain/`) — inject an adapter wrapping the CLI plugin-doctor use-case
    (`packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`, typed
    `PluginDoctorReport[]`).
  - `CommandCatalogPort` — inject a live catalog built from the public
    `CliCommandRegistry`/command tree (`packages/cli/src/public/features/root/
    public-command-tree.ts`, `src/public/composition/cli-command-registry.ts`): walk registered
    commands (+ Cliffy sub-commands where enumerable) into bounded `CommandDescriptor`s.
  - `CommandExecutorPort` default: resolve how a scaffolded app invokes the CLI (inspect
    `packages/cli/src/kernel/templates/app/` deno.json tasks) and wire that as the default
    executor command; keep injectable.
- Skill bundle: `skills/manifest.json` + three skill dirs at repo root (S8).

## Deliverables

1. **`agent` command group in the public CLI** (`packages/cli/src/public/features/agent/`,
   following the folder/command conventions of existing groups like `db`):
   - `netscript agent mcp` — start the `@netscript/mcp` stdio server composed with ALL real
     adapters (telemetry query via the shared resolver; docs corpus rooted at the project's
     docs or the installed NetScript docs — decide + document; plugin-doctor adapter; live
     command catalog; executor default; allowlist policy default with a
     `--allow`/`--deny`-prefix override flags option if simple). Flags: `--endpoint`,
     `--project-root`, `--docs-root`.
   - `netscript agent init` — detect agent host(s) and install the combo into the CURRENT
     project: write `.mcp.json` (Claude Code shape: `{"mcpServers":{"netscript":{"command":
     "deno","args":[...run agent mcp...]}}}` — match the real invocation you wire) and/or
     `.vscode/mcp.json` (extensible host table; `--host` flag: `claude|vscode|all`, default
     detect-or-all); copy the skill bundle from the manifest into `.claude/skills/` (Claude
     host) with manifest-hash verification; create or append a marked section to `AGENTS.md`
     (idempotent re-runs: second run is a no-op, verified by content hash / marker comments).
   - IMPORTANT: the skill bundle files must be available to the PUBLISHED CLI. Decide the
     embedding mechanism: check how the CLI embeds scaffold assets today
     (`packages/cli/src/kernel/assets/embedded.generated.ts` + its generator) and reuse that
     mechanism to embed `skills/**` at build/generate time. Record the decision; if embedding
     needs a generator run, wire it the same way existing embedded assets are generated.
2. **MCP composition module** in the CLI (application layer, not inside the command action):
   builds `createMcpServer` options from project root + flags. `cli.ts` in `packages/mcp` stays
   the generic zero-CLI-dep entry; the CLI's composition is the batteries-included path.
3. **Doctor injection**: `netscript agent mcp` doctor now reports real plugin-doctor results
   (family no longer "not wired").
4. **Tests**:
   - `packages/cli` tests for the agent group: init writes expected files (tempdir fixture
     project), idempotence (second run no-op), host table selection, manifest-hash mismatch
     error path.
   - Composition test: spawned `netscript agent mcp` (or direct composition call) round-trips
     initialize → tools/list (13 tools) → `list_commands` returns REAL verbs (assert `db`,
     `plugin` present) → `doctor` includes the plugin-doctor family with real (non-stub) source.
   - Keep all `packages/mcp` tests green.

## Validation (run, paste real output into worklog)

- `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts` AND `--root packages/cli --ext ts`
  (+ lint + fmt wrappers, same roots; cli may need `--unstable-kv`)
- `deno test --no-lock ...` for `packages/mcp/tests/` and the touched `packages/cli` test dirs
- `deno task arch:check`; doc lint on mcp entrypoints; publish dry-run for BOTH packages
  (workspace publish dry-run if scoped is impossible — note result).

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s7/.llm/runs/mcp-skills--orchestrator/s7/worklog.md`; decisions +
drift in `s7/drift.md` (embedding mechanism + docs-root decision REQUIRED entries). Small
logical commits, then push:
`git -C /home/codex/repos/ns-combo-s7 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s7-cli`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.

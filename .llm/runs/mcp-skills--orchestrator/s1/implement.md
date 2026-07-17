use harness

# Slice S1 — `packages/mcp` skeleton: Archetype-6 layout, tool contracts, stdio server, doctor v0

## SKILL

Read before coding: `.agents/skills/netscript-doctrine/SKILL.md` (archetype/folder law),
`.agents/skills/netscript-deno-toolchain/SKILL.md` (deps/catalog/publish rules),
`.agents/skills/netscript-tools/SKILL.md` (validation wrappers, lock hygiene),
`.agents/skills/rtk/SKILL.md` (prefix read-heavy git/grep with `rtk`).

## Identity + ground rules

- You are a WSL Codex implementation agent. Worktree (ABSOLUTE, use for every file op):
  `/home/codex/repos/ns-combo-s1`. Branch: `feat/netscript-mcp-skills-s1-skeleton`.
  Never `cd` elsewhere; never touch other checkouts. Use absolute paths in all shell commands.
- **Base verification preflight (mandatory, do first)**: `git -C /home/codex/repos/ns-combo-s1
  log --oneline -1` must show `7c800e74`; the files
  `/home/codex/repos/ns-combo-s1/.llm/runs/mcp-skills--orchestrator/design.md` and
  `.../research-netscript-surfaces.md` must exist. If either fails, STOP and report.
- GitHub issue: rickylabs/netscript#725 (epic #721, umbrella PR #715). Commit style:
  conventional commits; reference `#725` (no closing keyword) in commit bodies.
- Do not delete lock files/caches; do not run `deno cache --reload`; do not commit `deno.lock`
  churn unless a new dependency genuinely requires it.
- Work only on this slice. Do NOT start S2–S9 scope (no docs corpus, no telemetry adapter beyond
  the reachability probe, no CLI command registration).

## Context (read these first)

- Design: `/home/codex/repos/ns-combo-s1/.llm/runs/mcp-skills--orchestrator/design.md` — the
  authoritative design. §2 doctrine decisions, §3 the full v1 tool surface, §6 risks.
- Research: `.llm/runs/mcp-skills--orchestrator/research-netscript-surfaces.md` §1 (telemetry
  read surface), §6 (doctrine constraints — folder law, gates);
  `research-aspire-combo.md` §2/§5 (tool-surface + token-efficiency patterns).
- Doctrine: `docs/architecture/doctrine/06-archetypes.md` (Archetype 6, ~line 216) and
  `05-*` layering. Peer example package for shape: `packages/telemetry`, `packages/aspire`
  (deno.json, mod.ts, README conventions). Use `deno doc` on `@netscript/telemetry` exports
  rather than reading all source.

## Deliverables

Create `packages/mcp` (`@netscript/mcp`, same version as workspace siblings — check their
`deno.json` version fields):

1. **Folder law** (Archetype 6): `mod.ts` (lib entry: tool registry + server factory + public
   types), `cli.ts` (stdio server executable entry), `README.md`, `deno.json`,
   `src/{domain,application/{flows,runner},presentation,infrastructure}`, `tests/`.
   No `utils/helpers/common/lib` folders. Presentation parses protocol input ONLY — no fs, no
   process spawn, no network in `src/presentation/`.
2. **Domain contracts (contract-first)**: Standard-Schema input/output contracts in `src/domain/`
   for the FULL v1 tool surface from design §3 (get_app_status, list_runs, get_run,
   get_recent_errors, get_last_job_result, analyze_service_performance, analyze_db_bottlenecks,
   doctor, search_docs, list_docs, get_doc, list_commands, execute_command). Reuse
   `@netscript/telemetry` filter schemas where they fit. Output contracts are compact structured
   summaries (counts + top-N), never raw dumps.
3. **Tool registry as data**: name, description (WITH token-discipline text, e.g. "returns a
   bounded summary; do not print raw output to the user"), input schema, output schema, flow ref,
   and a `kind: 'read' | 'mutate' | 'meta'` tag. Registry is enumerable so the CLI-twin table and
   skills can be generated/validated from it later.
4. **Stdio server runner** (`src/application/runner` + `src/infrastructure`): MCP protocol over
   stdio — `initialize`, `tools/list`, `tools/call` (JSON-RPC 2.0, newline-delimited or
   Content-Length framing per MCP spec — match the current MCP spec's stdio transport).
   **Dependency decision (make it in-slice and record it)**: prefer a minimal zero-dep
   implementation of the protocol subset over pulling `@modelcontextprotocol/sdk` (npm) — the
   subset is small and the publish surface stays lean. If you judge the SDK genuinely necessary,
   it must go through the npm catalog per the deno-toolchain skill, and you must record the
   rationale in README + `/home/codex/repos/ns-combo-s1/.llm/runs/mcp-skills--orchestrator/s1/drift.md`.
   Unregistered/unimplemented tools return a structured MCP error. Server-side truncation
   defaults (max items, max string length) live in the runner and are applied to every tool
   result.
5. **`doctor` v0**: one working flow — telemetry endpoint reachability. Endpoint resolution v0:
   explicit option → `NETSCRIPT_TELEMETRY_ENDPOINT` env → default `http://localhost:18888`;
   probe with a short-timeout fetch; return structured pass/warn/fail + fix suggestion. The
   fetch lives in `src/infrastructure/` behind a port defined in `src/domain/` (or `src/ports/`
   if the workspace convention uses that — mirror `packages/telemetry`'s layering vocabulary).
   All other tools registered but return a structured `not_implemented` error carrying the slice
   reference ("planned").
6. **Workspace wiring**: add `packages/mcp` to the root workspace config the same way sibling
   packages are wired. README documents: purpose, public API, data boundary (telemetry +
   project metadata + docs; never source, env values, secrets), and the CLI/skill combo
   positioning (public wording only — no internal process/app names/PR numbers).
7. **Tests** (`packages/mcp/tests/`): stdio round-trip smoke (spawn `cli.ts`, initialize →
   tools/list → call `doctor` with unreachable endpoint → structured warn/fail), registry/schema
   validation tests, truncation unit tests.

## Validation (run, capture real output)

- `deno run --allow-read --allow-run /home/codex/repos/ns-combo-s1/.llm/tools/run-deno-check.ts --root packages/mcp --ext ts`
  (add `--unstable-kv` variants only if needed)
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts`
- `deno test` scoped to `packages/mcp`
- `deno task arch:check`
- `deno doc --lint` on the public entrypoints (publish bar)
- `deno task publish:dry-run` if it can run scoped; otherwise note why not.

## Definition of done

All deliverables implemented, validations green with pasted evidence, committed on
`feat/netscript-mcp-skills-s1-skeleton` (small logical commits), worklog at
`/home/codex/repos/ns-combo-s1/.llm/runs/mcp-skills--orchestrator/s1/worklog.md` (append-only:
decisions, drift, validation evidence). Push the branch:
`git -C /home/codex/repos/ns-combo-s1 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s1-skeleton`.
Do NOT open a PR; do NOT merge; the supervisor reviews and merges into the umbrella.

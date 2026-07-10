# PR 7 inventory — `.llm/tools/agentic/` production-grade cleanup

Date: 2026-07-10. Agent: Fable 5 (owner-authorized single subagent). Baseline before any change:
`deno test --no-lock -A .llm/tools/agentic/` = 201 passed, 0 failed.

## Reference-analysis method

Every file was checked against ALL of: relative imports across the repo (`grep "from '"` over
`.llm/tools/agentic/**`), `deno.json` tasks, `.agents/skills/**` + `.claude/skills/**` mentions,
`.llm/harness/**` docs, `.claude/settings.json` hooks, `CLAUDE.md`/`AGENTS.md`,
`.github/workflows/**`, and `docs/**`. `.llm/runs/**` history was surveyed for usage evidence but is
never edited (history stays as-is; stale paths there are acceptable and expected).

## Verdict summary

- **Deleted: nothing.** Every `.ts` file in the suite has at least one live reference (import,
  `deno.json` task, settings hook, or skill/harness doc). There is no provably-dead or draft code to
  cut; the epic left a *flat layout*, not dead files.
- **Moved: every top-level tool** into a concern-named folder (see table). `runtime/` internals stay
  in place (heavily cross-referenced by harness docs, e.g. `lane-policy.md` →
  `runtime/routing-policy.ts`), gaining only a `runtime/cli/` edge folder.
- File names are preserved (no renames) so history, run artifacts, and grep muscle-memory survive;
  `git mv` keeps follow-history intact.

## New layout

| Folder | Concern |
| --- | --- |
| `lib/` | Shared pure+impure primitives (`agentic-lib.ts`) + its test + real fixtures |
| `runtime/` | Desired-state runtime controller: contract, state, planner, controller, output, policies, adapters (unchanged layout) |
| `runtime/cli/` | Human/agent entry points over the runtime brain (doctor/status/repair, routing state, evidence, canaries, rollout) |
| `codex/` | WSL Codex lane: launch / status / watch / resume |
| `openhands/` | OpenHands lane: dispatch / status / verdict watch |
| `github/` | GitHub REST lane: PR lifecycle, CI/verdict watch, durable token |
| `wsl/` | WSL foundation doctor/bootstrap + contract lib |
| `claude/` | Claude surface: hook logger, remote-control smoke, skill-mirror sync, surface validator |
| (root) | `README.md` (navigation-first rewrite) + `compatibility-wrappers_test.ts` (deprecation-boundary guard spanning codex/claude/wsl) |

## Per-file disposition

| File (old path, relative to `.llm/tools/agentic/`) | Disposition | Live references proving it (beyond README) |
| --- | --- | --- |
| `agentic-lib.ts` | moved → `lib/` | imported by 13 tools + `runtime/adapters/codex-adapter.ts`; task-driven transitively |
| `agentic-lib_test.ts` | moved → `lib/` | test suite; asserts real fixtures |
| `__fixtures__/` (2 files) | moved → `lib/__fixtures__/` | read by `agentic-lib_test.ts` |
| `agentic-runtime.ts` | moved → `runtime/cli/` | `deno.json` task `agentic:runtime`; run docs |
| `routing-state.ts` + `_test` | moved → `runtime/cli/` | task `agentic:routing-state`; referenced by rollout canary matrix (task name, path-independent) |
| `antigravity-evidence-cli.ts` + `_test` | moved → `runtime/cli/` | task `agentic:antigravity-evidence` |
| `provider-canary.ts` (top-level CLI; distinct from pure `runtime/provider-canary.ts`) | moved → `runtime/cli/` | task `agentic:provider-canary` |
| `rollout-canary-cli.ts` + `_test` | moved → `runtime/cli/` | task `agentic:rollout-canary` |
| `rollout-canary-runner.ts` + `_test` | moved → `runtime/cli/` | imported by `rollout-canary-cli.ts` |
| `launch-codex-slice.ts` | moved → `codex/` | task `agentic:launch-codex-slice`; codex-wsl-remote + netscript-tools skills; harness tooling.md; compatibility guard |
| `codex-status.ts` | moved → `codex/` | task `agentic:codex-status`; skills; compatibility guard |
| `codex-watch.ts` | moved → `codex/` | task `agentic:codex-watch`; skills; harness tooling.md |
| `codex-resume.ts` | moved → `codex/` | task `agentic:codex-resume`; skills; compatibility guard |
| `dispatch-openhands.ts` | moved → `openhands/` | task `agentic:dispatch-openhands`; openhands-handoff/netscript-tools/netscript-cli skills; agent-handoff.md; workflow comments |
| `openhands-status.ts` | moved → `openhands/` | task `agentic:openhands-status`; skills; workflow comments |
| `watch-openhands-verdict.ts` | moved → `openhands/` — **kept, flagged ambiguous** (see below) | imports `agentic-lib.extractVerdict` (29 test references); documented in README |
| `gh-pr.ts` | moved → `github/` | task `agentic:gh-pr`; skills; tooling.md |
| `gh-watch.ts` | moved → `github/` | task `agentic:gh-watch`; skills; tooling.md |
| `gh-token.ts` | moved → `github/` | task `agentic:gh-token`; skills; tooling.md |
| `wsl-foundation.ts` | moved → `wsl/` | task `agentic:wsl-foundation`; spawned by `runtime/adapters/foundation-adapter.ts`; compatibility guard |
| `wsl-foundation-lib.ts` | moved → `wsl/` | imported by `wsl-foundation.ts`, `runtime/adapters/foundation-adapter.ts`, `mobile-control-adapter.ts`, tests |
| `wsl-foundation_test.ts` | moved → `wsl/` | test suite |
| `claude-hook-log.ts` | moved → `claude/` | `.claude/settings.json` hooks (2); task `agentic:claude-hook-log`; validated by `validate-claude-surface.ts`; tooling.md |
| `claude-remote-smoke.ts` | moved → `claude/` | task `agentic:smoke-claude-remote`; tooling.md; compatibility guard |
| `sync-claude-skills.ts` | moved → `claude/` | tasks `agentic:sync-claude`, `agentic:sync-claude:check`; spawned by `validate-claude-surface.ts`; tooling.md |
| `validate-claude-surface.ts` | moved → `claude/` | task `agentic:check-claude`; `docs:maintenance` chain; CLAUDE.md; tooling.md |
| `compatibility-wrappers_test.ts` | kept at root (updated relative paths + task-string map only; asserted task names, flags, and delegation contracts unchanged) | guards the #576 one-cycle deprecation boundary |
| `runtime/**` (all 41 files incl. `adapters/`) | kept in place | dense internal import graph; harness `lane-policy.md` → `runtime/routing-policy.ts`; rollout matrix pins `runtime/routing-state-machine_test.ts` path |
| `README.md` | kept at root, rewritten navigation-first | referenced by openhands-handoff + codex-wsl-remote skills at this exact path |

## Deletions

None. Deletion candidates examined and rejected with evidence:

1. **`watch-openhands-verdict.ts` vs `gh-watch.ts`** — the only real overlap suspicion (both poll a
   PR for an OpenHands verdict). Evidence: both landed together (beta.5 cut, commit `317e4b50`);
   they have *different* contracts (gh-watch: gh-pr-aligned exit codes 0/10/12/4/1, terminal-state
   blocking; watch-openhands-verdict: layered `extractVerdict` matching with re-armable exit-2
   timeout heartbeat); `extractVerdict` is live in `agentic-lib.ts` with 29 test assertions. Neither
   supersedes the other by any recorded decision. **Kept both; flagged to the owner** as a possible
   future consolidation — `watch-openhands-verdict.ts` is the only tool with no `deno.json` task and
   no skill reference.
2. **Top-level `provider-canary.ts` vs `runtime/provider-canary.ts`** — not duplicates: the former
   is the task-exposed CLI edge, the latter the pure contract module it drives. Both kept (now
   `runtime/cli/provider-canary.ts` vs `runtime/provider-canary.ts`, disambiguated by the cli/
   boundary and README).
3. **`runtime/legacy-checkpoint_test.ts`, `antigravity-compat_test.ts`, `deferred-boundaries_test.ts`** —
   names sound stale but each pins live compatibility behavior of current modules (checkpoint
   migration, Antigravity/gemini normalization, planner boundaries). Kept.

## Reference updates performed after moves

- `deno.json`: all 16 `agentic:*` task paths.
- `.claude/settings.json`: both `claude-hook-log.ts` hook commands.
- Sources: every relative import crossing a new folder boundary; `foundation-adapter.ts` child
  script URL; `validate-claude-surface.ts` spawn paths; usage strings in tool headers/help text.
- Docs/skills: `.agents/skills/{codex-wsl-remote,netscript-tools,openhands-handoff,netscript-cli}/SKILL.md`,
  `.llm/harness/workflow/{tooling,agent-handoff}.md`, `CLAUDE.md`, `.github/workflows/openhands-agent.yml`
  (comments), then `deno task agentic:sync-claude` to regenerate `.claude/skills/` mirrors.
- `compatibility-wrappers_test.ts`: wrapper map values now carry the folder prefix; task-name keys,
  required flags, and delegation assertions unchanged.

## Expansion: central config, harmonization, tests, README (owner-directed, same PR)

### Central config surface (`config/`)

New single source for every volatile value; every prior hardcoded literal re-pointed at it.

| Concern | Central location | De-hardcoded from |
| --- | --- | --- |
| Model ids | `config/models.ts` (`MODEL_IDS`, `OPENROUTER_MODEL_IDS`) | `runtime/routing-policy.ts`, `runtime/provider-profiles.ts`, `runtime/cli/rollout-canary-runner.ts` |
| Routing bindings | `runtime/routing-policy.ts` (`CANONICAL_ROUTE_POLICY`, references config ids) | already the authority; now reconciled to config for the id strings |
| Tool versions | `config/versions.ts` (`NODE_TARGET_VERSION`, `COMPONENT_EXPECTED_VERSIONS`, `COMPAT_PINNED_TOOL_VERSIONS`, `TEST_COMPONENT_VERSIONS`) | `wsl/wsl-foundation-lib.ts`, `wsl/wsl-foundation.ts`, `runtime/routing-signal-classifier.ts`, `runtime/test-fixtures.ts` |
| Endpoints | `config/endpoints.ts` | `wsl/wsl-foundation.ts` (node dist host), `wsl/wsl-foundation-lib.ts` (installer), `runtime/provider-profiles.ts` (OpenRouter base URLs), `lib/agentic-lib.ts` (GitHub API base) |

Enforcement: `config/no-hardcoded-volatile_test.ts` fails if any volatile literal reappears outside
`config/`. It caught two real leaks during implementation (`rollout-canary-runner.ts` minimax/glm),
now fixed. `MODEL_IDS.antigravity` (`agy`) is deliberately excluded because `agy` is also the
legitimate CLI executable name across `wsl/` and the adapters. The one boundary: the
`agentic:wsl-foundation` `--allow-net=` allowlist in `deno.json` cannot read a TS const (Deno parses
task strings statically); documented in `config/endpoints.ts` to keep in sync.

### Harmonization / consistency pass

The #576–#582 modules were already contract-unified via `runtime/contract.ts` (`RouteIdentity`,
`RuntimeDiagnostic`, `DiagnosticCode`, `EXIT_CODES`), `runtime/ports.ts` seams, and
`runtime/adapters/**` as the sole impure boundary — no contract reshaping was needed or done (it
would risk the 200+ invariant-pinning tests for no observable gain). Applied: uniform central-config
surface, one doc-header style, `isolatedDeclarations`-clean export forms, consistently annotated
re-export shims. Deliberately left as-is: per-test-file local `assert`/`assertEquals` helpers (empty
import map makes `@std/assert` unavailable; documented repo convention; consolidating across 40+
files is cosmetic churn with regression risk).

### Useless-test audit

**Deleted: none.** Audited every test name plus the smallest bodies. All assert a real invariant
(bounded/finite edges, credential/prompt rejection, fail-closed, frozen fixtures, delegation
boundaries). None trivial/duplicate/tautological, so removing any violates the invariant-coverage
constraint. Net count 201 → 202 (the new enforcement guard).

### README

Rewritten from scratch in the NetScript docs house voice (studied `docs/site/cli-reference.md`):
narrative arc (what it is → brain vs. hands → everyday flows → the brain → safety model →
maintenance map), runnable blocks with real captured output, per-CLI purpose/when/example. All task
names and file paths verified; example outputs captured from live read-only runs.

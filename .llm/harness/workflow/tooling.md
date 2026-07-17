# Tooling Index

The single harness-facing index of the **mandatory** tool surface for a run. This page is a map, not
a manual: it names each tool, its `deno task` entry, and when to reach for it, then points at the
canonical skill that documents flags and gotchas. Do not restate command maps here.

Canonical homes:

- **netscript-tools** — validation wrappers, gate evidence, git ground-truth, supervisor automation.
- **netscript-deno-toolchain** — the Deno 2.9 dependency/release/inspection toolchain and the
  `deps/*` wrappers (the `deno outdated --latest` trap, the `catalog:` npm-only law).
- **rtk** — token-compressing prefix for read-heavy `git`/`gh`/`grep`/`ls` and `rtk proxy <cmd>`.

## Quality gates — evidence is wrapper-sourced (mandatory)

Type-check / lint / format / doc-lint / dependency evidence MUST come from these wrappers. Raw root
`deno check .` / `deno fmt --check` / `deno lint` and hand-rolled registry curls are
**non-verdicts**.

| Concern      | Task / wrapper                                                                            | Notes                                                                                                                                                                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type-check   | `deno task check` · `.llm/tools/run-deno-check.ts --root <path> --ext ts,tsx`             | scoped; structured JSON                                                                                                                                                                                                                                                          |
| Lint         | `deno task lint` · `.llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx`               | scoped; excludes generated/future-wave                                                                                                                                                                                                                                           |
| Format       | `deno task fmt:check` · `.llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx`           | source TS only (`--ext ts,tsx`)                                                                                                                                                                                                                                                  |
| Doc-lint     | `deno task doc:lint --root <pkg> --pretty` · `.llm/tools/run-deno-doc-lint.ts`            | lints the full `deno.json` export map; per-file attribution                                                                                                                                                                                                                      |
| Code-quality | `deno task quality:gate` (`quality:scan` + `arch:check`) · repo audit `quality:scan:repo` | **required** for any `packages/**`/`plugins/**` wave; the scoped check/lint/fmt wrappers do NOT catch `any`/`as unknown as`/host-side hardcoded plugin names or an inline `deno-lint-ignore no-explicit-any` — `quality:gate` does. Mirrored by CI `code-quality.yml`. See #745. |

**Framework-wave gate law:** a slice touching `packages/**` or `plugins/**` is not gate-complete on
the scoped check/lint/fmt wrappers alone — run `deno task quality:gate`. A green wrapper over code
containing `any`, `as unknown as`, or a hardcoded plugin-name branch is a false pass; that is the
exact hole that let the beta.9 CLI wave merge violations (#745). The `quality:scan` escape hatch is
an inline `// quality-allow: <reason>` on the offending line only — never a blanket ignore — and its
count is reported (`--max-allow <n>` bounds it).

See **netscript-tools** § Validation Wrappers / Publish And Docs.

## Dependency evidence (mandatory)

Latest / outdated / why / audit / prod-install evidence MUST go through the `deps/*` wrappers —
never a registry curl, never `deno outdated --latest` for "latest".

| Question                                       | Task                          |
| ---------------------------------------------- | ----------------------------- |
| Latest stable?                                 | `deno task deps:latest`       |
| What's behind (transitive)?                    | `deno task deps:outdated`     |
| Why is this in the graph / is the import dead? | `deno task deps:why <pkg>`    |
| Any advisories?                                | `deno task deps:audit`        |
| Does the published surface install?            | `deno task deps:prod-install` |

See **netscript-deno-toolchain** (canonical: command map + gotchas).

## Supervisor automation — `agentic:*` task family

`.llm/tools/agentic/` is the **only** interface for driving Tier-D Codex and Tier-E OpenHands (never
ad-hoc `wsl.exe`). Each tool is exposed as a `deno task`; run with `--help` for usage. Most take
`--dry-run`.

The suite is concern-grouped — `codex/`, `opencode/`, `openhands/`, `github/`, `wsl/`, `claude/`,
the runtime controller `runtime/` + its `runtime/cli/` entry points, and `lib/`; its `README.md` is
the map. Everything volatile is centralized in `.llm/tools/agentic/config/` (model ids, tool
versions, endpoints), with the routing lane→model bindings in `runtime/routing-policy.ts`
referencing those ids; change a model/version/endpoint only there. See the suite README's
"Maintenance map".

| Task                             | Tool                                      | Use                                                                                                |
| -------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `agentic:launch-codex-slice`     | `launch-codex-slice.ts`                   | stage + safety-check + launch a WSL Codex slice; records the thread id                             |
| `agentic:codex-resume`           | `codex-resume.ts`                         | steer an existing Codex thread (never a rival second send)                                         |
| `agentic:codex-status`           | `codex-status.ts`                         | read-only daemon / worktree / session snapshot                                                     |
| `agentic:codex-watch`            | `codex-watch.ts`                          | event-driven wake on a slice's git progress or turn completion (run inside WSL)                    |
| `agentic:dispatch-openhands`     | `dispatch-openhands.ts`                   | validate + post an `@openhands-agent` trigger (enforces the handoff contract)                      |
| `agentic:openhands-status`       | `openhands-status.ts`                     | read an OpenHands run's verdict (local trace or remote comment)                                    |
| `agentic:gh-pr`                  | `gh-pr.ts`                                | leaf-PR lifecycle: create · verdict · merge (eval-gated by default)                                |
| `agentic:gh-watch`               | `gh-watch.ts`                             | **token-free CI/verdict watch** — background, exits terminal to re-wake the supervisor             |
| `agentic:gh-token`               | `gh-token.ts`                             | **durable GitHub-token resolver/store** — `check` at session start, `store` once on rotation       |
| `agentic:claude-hook-log`        | `claude-hook-log.ts`                      | append Claude Code hook events to the run's hook log                                               |
| `agentic:sync-claude` / `:check` | `sync-claude-skills.ts`                   | regenerate / verify the `.claude/skills/` mirror from `.agents/skills/`                            |
| `agentic:check-claude`           | `validate-claude-surface.ts`              | validate the Claude configuration/skills/hooks surface                                             |
| `agentic:smoke-claude-remote`    | `claude-remote-smoke.ts`                  | smoke the Claude remote launch path                                                                |
| `agentic:opencode`               | `opencode-run.ts`                         | run a general native OpenCode turn; message-first argv protects repeated `-f` inputs               |
| `agentic:opencode-eval`          | `opencode-eval.ts`                        | capture canonical Kimi vision evidence from one or more native WSL image paths                     |
| `agentic:opencode-web`           | `opencode-web.ts`                         | host OpenCode's browser UI; loopback default, password required for LAN/mDNS exposure              |
| `agentic:runtime`                | `runtime/cli/agentic-runtime.ts`          | desired-state controller: `doctor` / `status` / `repair codex-remote` (inspect-first; `--dry-run`) |
| `agentic:routing-state`          | `runtime/cli/routing-state.ts`            | read-only view of persisted quota-fallback routing state                                           |
| `agentic:antigravity-evidence`   | `runtime/cli/antigravity-evidence-cli.ts` | run/aggregate bounded Antigravity evidence-lane probes                                             |
| `agentic:provider-canary`        | `runtime/cli/provider-canary.ts`          | statically validate every OpenRouter preset; `--live` opts into one bounded provider turn          |
| `agentic:rollout-canary`         | `runtime/cli/rollout-canary-cli.ts`       | rollout canary + report for route promotion (#582)                                                 |
| `agentic:wsl-foundation`         | `wsl/wsl-foundation.ts`                   | WSL foundation doctor + reversible bootstrap/rollback planner                                      |

`gh-watch.ts` and `gh-token.ts` are the two durable GitHub infra utilities — see **netscript-tools**
§ Supervisor Automation for their exit codes and token-handling rules.

## Supervisor wake — no polling

Wake is event-driven, never a polling loop kept in agent context:

| Tool                                        | Wakes on                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `.llm/tools/harness/watch-run.ts <run-dir>` | next change to the run dir's `worklog.md` (background; exit 0 on change, 2 on heartbeat timeout) |
| `agentic:codex-watch`                       | a Codex slice's next git event or turn completion                                                |
| `agentic:gh-watch`                          | a PR's OpenHands verdict becoming terminal                                                       |

## Tool layout

`.llm/tools/` is organized into topic subfolders: `agentic/` (Claude/Codex/OpenCode/OpenHands
orchestration), `deps/` (dependency toolbelt), `docs/` (site link/caveat checks), `fitness/`
(doctrine + design-system gates), `release/` (publish/JSR wrappers, cut, github-release), `search/`
(find/list/compare code surfaces), `git/` (ground-truth git helpers), `reporting/` (coverage-report
generation), `e2e/`, `harness/` (supervisor wake), and `validation/` (readme/scaffold/internal-doc
checks). Note: the coverage-report tool lives in `reporting/`, **not** `coverage/`, because
`.gitignore` has an unanchored `coverage/` rule that would silently un-track any file placed in a
`coverage/` directory anywhere in the tree.

**Stable-path exceptions — do not move into a subfolder:**

- `run-deno-{check,lint,fmt,doc-lint}.ts` — stay at the tools root; their paths are hardcoded in
  `deno.json` `files:` arrays and many task strings (deepest-wired surface).
- `generate-cli-assets-barrel.ts` — stays at the tools root because its path is embedded as a
  `// @generated by .llm/tools/generate-cli-assets-barrel.ts` provenance header in four
  out-of-surface `packages/**/*.generated.ts` files. Moving it would strand those headers (fixable
  only under the `packages/` lane by regenerating). Do not "tidy" it into a `codegen/` subfolder
  without first repointing/regenerating those headers.

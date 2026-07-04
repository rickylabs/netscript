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
`deno check .` / `deno fmt --check` / `deno lint` and hand-rolled registry curls are **non-verdicts**.

| Concern | Task / wrapper | Notes |
| --- | --- | --- |
| Type-check | `deno task check` · `.llm/tools/run-deno-check.ts --root <path> --ext ts,tsx` | scoped; structured JSON |
| Lint | `deno task lint` · `.llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx` | scoped; excludes generated/future-wave |
| Format | `deno task fmt:check` · `.llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx` | source TS only (`--ext ts,tsx`) |
| Doc-lint | `deno task doc:lint --root <pkg> --pretty` · `.llm/tools/run-deno-doc-lint.ts` | lints the full `deno.json` export map; per-file attribution |

See **netscript-tools** § Validation Wrappers / Publish And Docs.

## Dependency evidence (mandatory)

Latest / outdated / why / audit / prod-install evidence MUST go through the `deps/*` wrappers — never
a registry curl, never `deno outdated --latest` for "latest".

| Question | Task |
| --- | --- |
| Latest stable? | `deno task deps:latest` |
| What's behind (transitive)? | `deno task deps:outdated` |
| Why is this in the graph / is the import dead? | `deno task deps:why <pkg>` |
| Any advisories? | `deno task deps:audit` |
| Does the published surface install? | `deno task deps:prod-install` |

See **netscript-deno-toolchain** (canonical: command map + gotchas).

## Supervisor automation — `agentic:*` task family

`.llm/tools/agentic/` is the **only** interface for driving Tier-D Codex and Tier-E OpenHands (never
ad-hoc `wsl.exe`). Each tool is exposed as a `deno task`; run with `--help` for usage. Most take
`--dry-run`.

| Task | Tool | Use |
| --- | --- | --- |
| `agentic:launch-codex-slice` | `launch-codex-slice.ts` | stage + safety-check + launch a WSL Codex slice; records the thread id |
| `agentic:codex-resume` | `codex-resume.ts` | steer an existing Codex thread (never a rival second send) |
| `agentic:codex-status` | `codex-status.ts` | read-only daemon / worktree / session snapshot |
| `agentic:codex-watch` | `codex-watch.ts` | event-driven wake on a slice's git progress or turn completion (run inside WSL) |
| `agentic:dispatch-openhands` | `dispatch-openhands.ts` | validate + post an `@openhands-agent` trigger (enforces the handoff contract) |
| `agentic:openhands-status` | `openhands-status.ts` | read an OpenHands run's verdict (local trace or remote comment) |
| `agentic:gh-pr` | `gh-pr.ts` | leaf-PR lifecycle: create · verdict · merge (eval-gated by default) |
| `agentic:gh-watch` | `gh-watch.ts` | **token-free CI/verdict watch** — background, exits terminal to re-wake the supervisor |
| `agentic:gh-token` | `gh-token.ts` | **durable GitHub-token resolver/store** — `check` at session start, `store` once on rotation |
| `agentic:claude-hook-log` | `claude-hook-log.ts` | append Claude Code hook events to the run's hook log |
| `agentic:sync-claude` / `:check` | `sync-claude-skills.ts` | regenerate / verify the `.claude/skills/` mirror from `.agents/skills/` |
| `agentic:check-claude` | `validate-claude-surface.ts` | validate the Claude configuration/skills/hooks surface |
| `agentic:smoke-claude-remote` | `claude-remote-smoke.ts` | smoke the Claude remote launch path |

`gh-watch.ts` and `gh-token.ts` are the two durable GitHub infra utilities — see **netscript-tools**
§ Supervisor Automation for their exit codes and token-handling rules.

## Supervisor wake — no polling

Wake is event-driven, never a polling loop kept in agent context:

| Tool | Wakes on |
| --- | --- |
| `.llm/tools/watch-run.ts <run-dir>` | next change to the run dir's `worklog.md` (background; exit 0 on change, 2 on heartbeat timeout) |
| `agentic:codex-watch` | a Codex slice's next git event or turn completion |
| `agentic:gh-watch` | a PR's OpenHands verdict becoming terminal |

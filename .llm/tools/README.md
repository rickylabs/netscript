# .llm/tools README

Reusable Deno utilities for MCP/Codex sessions live here. This is the single navigable home for the
`.llm/tools/` surface: what each subtree is for, and which script answers which question. Keep
one-off scripts in `.llm/tmp/`.

This README is reference for the tooling **architecture**; it does not restate the operating rules
that govern *when* to reach for these tools. For those, see:

- [`AGENTS.md` -> Tooling](../../AGENTS.md#tooling) -- preferred tool order, the `rtk` token-saving
  convention, the dependency-decision policy, and the supervisor-wake pattern.
- [`AGENTS.md` -> Validation](../../AGENTS.md#validation) -- which validation proves which change,
  plus the scoped check/lint/fmt wrapper policy.
- [`.llm/harness/README.md`](../harness/README.md) -- harness run mechanics that orchestrate these
  tools (commit/worklog tracking, gates, evaluator protocol).

## Subtree map

| Subtree | Purpose | Detail |
| ------- | ------- | ------ |
| `.llm/tools/` (root) | Scoped check/lint/fmt wrappers, text/import/symbol scanners, export inventory, the supervisor watch utility, and the CLI E2E smoke. | This README + [`entry.md`](./entry.md). |
| `.llm/tools/deps/` | Structured wrappers over the Deno 2.8 dependency commands (`latest`/`outdated`/`why`/`audit`/`prod-install`) plus the centralization/catalog/file-link scan gates. | [Dependency toolbelt](#dependency-toolbelt-llmtoolsdeps) below and the `netscript-deno-toolchain` skill. |
| `.llm/tools/agentic/` | Claude Code surface validation, skill-mirror sync, hook event logging, and remote-control smoke. | [Agentic tooling](#agentic-tooling-llmtoolsagentic) below. |
| `.llm/tools/fitness/` | Doctrine and package-readiness gates. Do not duplicate these under the `.llm/tools/` root. | The `netscript-doctrine` skill + `docs/architecture/doctrine/`. |

## Start Here

- Use `deno task e2e:cli` for the full CLI merge-readiness gate.
- Use `.llm/tools/scaffold-e2e-test.ts` only as a legacy comparison smoke when debugging parity with
  the previous repo checkout.
- Use `.llm/tools/run-deno-check.ts` to run scoped type-checks or summarize noisy deno-check logs.
- Use `.llm/tools/run-deno-lint.ts` to run scoped lint checks and summarize findings as JSON.
- Use `.llm/tools/run-deno-fmt.ts` to run scoped, non-mutating fmt checks by root and extension. Add
  `--ignore-line-endings` for known baseline line-ending drift; add `--show-ignored` only when the
  ignored file list is needed.
- Use `.llm/tools/watch-run.ts <run-dir>` as a **background** process to wake the supervisor when a
  sub-agent writes -- never poll. See [Supervisor watch](#supervisor-watch-watch-runts).
- Use the `deps:*` tasks for any dependency-version or dead-import decision. See the
  [Dependency toolbelt](#dependency-toolbelt-llmtoolsdeps).
- Use `.llm/tools/fitness/*.ts` for doctrine and package-readiness gates; do not duplicate those
  scripts under `.llm/tools`.
- Use `.llm/tools/agentic/*.ts` for Claude Code, skill-mirror, and agent-orchestration checks.

## Common Commands

```powershell
# Full CLI E2E merge gate
deno task e2e:cli

# Explicit full suite with readable output
deno task e2e:cli run scaffold.runtime --cleanup --format pretty

# Scoped check / saved-log check diagnostics
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/logger --pretty
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --input .llm/tmp/check.log --pretty

# Scoped lint/fmt validation
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/logger --pretty
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/logger --ext md --pretty

# Validate Claude Code project surface and generated skill mirror
deno task agentic:check-claude
```

## Scoped check/lint/fmt wrappers

These wrap the root `deno check`/`deno lint`/`deno fmt` tasks for cases where the root task is too
broad or too noisy. They select explicit files by `--root`, `--ext`, and include/exclude regex,
batch the run, and emit structured (JSON, or `--pretty`) output. `AGENTS.md` -> Validation governs
when to prefer them over the root tasks (notably: package-quality fmt gates must target source
TypeScript only and exclude generated output).

| Tool | Use | Key flags |
| ---- | --- | --------- |
| `run-deno-check.ts` | Scoped `deno check` runner and parser; also parses a saved log (`--input`), stdin, or a wrapped command (`-- deno task check`). | `--root`, `--ext ts,tsx`, `--input`, `--cwd`, `--pretty` |
| `run-deno-lint.ts` | Scoped `deno lint` runner with findings grouped by rule into JSON. | `--root`, `--ext`, `--include`/`--exclude`, `--input`, `--pretty` |
| `run-deno-fmt.ts` | Scoped, non-mutating `deno fmt --check` (or mutating `deno fmt`) over explicit roots/extensions without shell glob expansion. | `--root`, `--ext`, `--ignore-line-endings`, `--show-ignored`, `--pretty` |
| `run-deno-doc-lint.ts` | Structured `deno doc --lint` runner with per-entrypoint and per-file attribution -- the publish-quality documentation bar. | (see file header) |

## Dependency toolbelt (`.llm/tools/deps/`)

Thin, structured wrappers over the Deno 2.8 dependency commands. They emit JSON by default
(`--pretty` for human output) so agents read versions/advisories without scraping human tables or
re-querying registries by hand. The `netscript-deno-toolchain` skill is the canonical command map;
[`entry.md`](./entry.md#dependency-toolbelt-deps) carries the per-script detail. The full registry of
`deps:*` tasks lives in `deno.json`.

> **Gotcha (load-bearing): never decide "latest" from `deno outdated --latest`.** The native
> `--latest` view ignores semver and reports pre-release tags as latest (it once reported
> `@fedify/fedify 2.3.0-dev.*` while stable was `2.2.5`). `deps:latest` reads each registry's
> **stable** channel and is the authority for "latest stable".

| Task | Script | Purpose |
| ---- | ------ | ------- |
| `deps:latest` | `deps/latest.ts` | Latest **stable** per registry (jsr `meta.json.latest` / npm `dist-tags.latest`, pre-release filtered) for every declared workspace dependency. The authority for "latest stable". Flags: `--behind-only`, `--filter`, `--allow-prerelease`, `--fail-behind`. |
| `deps:outdated` | `deps/outdated.ts` | Lock-aware/transitive view: wraps `deno outdated --recursive --latest`, parses the table to JSON, and flags pre-release "Latest" rows. |
| `deps:why` | `deps/why.ts` | Dead-import detection: combines source-usage grep with `deno why <pkg>` graph provenance (`likelyDeadImport` / `fullyRemovable`). |
| `deps:audit` | `deps/audit.ts` | Advisory check: wraps `deno audit --level <floor>`, normalized to JSON. Flags: `--level`, `--fail-on-find`. |
| `deps:prod-install` | `deps/prod-install.ts` | Proves the production (non-dev) surface installs against a frozen lock (`deno ci --prod --frozen`). Additive to the quality lane. |
| `deps:census` | `deps/census.ts` | Workspace dependency census. |
| `deps:check` | `deps/scan-jsr-centralization.ts`, `deps/audit-file-link.ts`, `deps/scan-npm-catalog-compliance.ts` | Centralization, file-link, and npm-catalog-compliance scan gates (run together by the task). |

## Agentic tooling (`.llm/tools/agentic/`)

These keep the Claude Code project surface honest and the generated skill mirror in sync. The
operating rule -- edit `.agents/skills/` source, never hand-edit the `.claude/skills/` mirror -- lives
in [`CLAUDE.md`](../../CLAUDE.md) (Claude Supervisor Rules); these scripts enforce it.

| Task | Script | Purpose | Flags |
| ---- | ------ | ------- | ----- |
| `agentic:sync-claude` | `agentic/sync-claude-skills.ts` | Regenerate `.claude/skills/` from `.agents/skills/` (source of truth). | `--check` (report stale, exit 1, no writes), `--pretty` |
| `agentic:sync-claude:check` | `agentic/sync-claude-skills.ts --check` | Diff-only gate mode: fails if the mirror has drifted from source. | `--check`, `--pretty` |
| `agentic:check-claude` | `agentic/validate-claude-surface.ts` | Validate the Claude surface: `CLAUDE.md` references `@AGENTS.md`, `.claude/settings.json` is valid JSON, `.gitignore` ignores `.claude/settings.local.json`, the skill mirror is in sync, and the hook lock is sound. Exits non-zero on any failure. | `--pretty` |
| `agentic:smoke-claude-remote` | `agentic/claude-remote-smoke.ts` | Fast Claude CLI / remote-control smoke (`--version`, `--help`, `remote-control --help`, `agents --help`); env-aware skip when `claude` is absent from PATH, with an optional live `--bg` launch. | `--env-aware`, `--live`, `--prompt <path>`, `--timeout`, `--pretty` |
| (hook target) | `agentic/claude-hook-log.ts` | Reads a hook event from stdin and appends it as JSONL to `.llm/tmp/claude/hooks/$NETSCRIPT_RUN_ID/events.jsonl` (run/session scoped). Invoked by a Claude Code hook, not run by hand. | (stdin; `NETSCRIPT_RUN_ID`, `CLAUDE_SESSION_ID` env) |

`validate-claude-surface.ts` is the F1 fitness gate for any change to Claude configuration, skills,
hooks, or agent-orchestration docs (see `CLAUDE.md`).

## Supervisor watch (`watch-run.ts`)

`watch-run.ts <run-dir>` blocks until a harness run directory changes, then exits -- so the
supervisor re-wakes without polling (which burns tokens). Run it as a **background** process: it
`Deno.watchFs`-es the run dir and exits **0** on the first relevant change (a sub-agent appending
`commits.md` / `worklog.md`), or exits **2** on the `--timeout-seconds` heartbeat if a sub-agent
hangs without writing. Bad args exit **1**.

```powershell
deno run --allow-read .llm/tools/watch-run.ts <run-dir> --files commits.md,worklog.md --timeout-seconds 1800 --quiet
```

Defaults: `--files commits.md,worklog.md`, `--timeout-seconds 1800`. See
[`AGENTS.md` -> Tooling (Supervisor wake)](../../AGENTS.md#tooling) for the surrounding convention.

## Tool Index

| Tool                        | Use                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `find-lines.ts`             | Substring or regex scans across one or more roots.                                 |
| `find-import-patterns.ts`   | Import alias and relative-path debt scans.                                         |
| `find-symbol-usages.ts`     | Symbol-boundary usage scans for refactors.                                         |
| `list-exports.ts`           | Export and re-export inventory for package surfaces.                               |
| `compare-export-surface.ts` | Compare actual exports against an expected symbol list.                            |
| `run-deno-doc-lint.ts`      | Structured `deno doc --lint` runner with per-entrypoint + per-file attribution.    |
| `run-deno-check.ts`         | Scoped `deno check` runner and parser for saved, stdin, or wrapped command output. |
| `run-deno-lint.ts`          | Scoped lint runner with grouped JSON findings.                                     |
| `run-deno-fmt.ts`           | Scoped fmt runner with non-mutating `--check` default.                             |
| `watch-run.ts`              | Background supervisor wake: exit on run-dir change, heartbeat on timeout.          |
| `git-commit-paths.ts`       | Commit/push selected paths without Windows shell quoting issues.                   |
| `scaffold-e2e-test.ts`      | Legacy full scaffold smoke for CLI/plugin/DB/Aspire parity debugging.              |
| `deps/*.ts`                 | Dependency-version, dead-import, audit, and prod-install decisions (see above).    |
| `agentic/sync-claude-skills.ts` | Generate or check `.claude/skills` from `.agents/skills`.                      |
| `agentic/validate-claude-surface.ts` | Validate `CLAUDE.md`, Claude settings, gitignore, and skill mirror.     |
| `agentic/claude-hook-log.ts` | Append Claude hook events as run-scoped JSONL (hook target).                       |
| `agentic/claude-remote-smoke.ts` | Fast Claude CLI/remote-control smoke, with env-aware skip and optional live `--bg` launch. |

See `.llm/tools/entry.md` for examples and selection notes.

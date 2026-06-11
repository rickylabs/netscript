# AGENTS.md

NetScript package and plugin architecture is governed by the Architecture Doctrine under
`docs/architecture/doctrine/`. Use `.agents/skills/netscript-doctrine` for package and plugin
architecture decisions, gates, and debt entries. Use `.agents/skills/netscript-harness` and
`.llm/harness/` for harnessed work. Follow `.agents/rules/*.mdc` where present.

Use `.agents/skills/netscript-cli` for CLI/scaffold/plugin/maintainer command work and
`.agents/skills/netscript-tools` for repo tooling, validation evidence, OpenHands triggers, raw git
verification, and lock-hygiene decisions.

When the user says `use harness`, activate the harness workflow. The evaluator must be a separate
session from the implementation session.

## Operating Rules

1. Doctrine first for `packages/` and `plugins/`: identify archetype, public surface, gates, and
   debt before changing framework code.
2. Contract first: define the schema/type contract, then implementation, then tests.
3. Wrap, do not reinvent: prefer Web Platform APIs, `Deno.*`, `@std/*`, and upstream APIs before
   local abstractions.
4. Research before writing: check relevant `.agents/` skills, `.llm/harness/` context, doctrine,
   repo docs, and existing code before implementing.
5. Drift is explicit: if implementation reality diverges from plan, docs, or doctrine, record it in
   the harness run drift/worklog artifacts.
6. Do not delete lock files or caches, and do not run `deno cache --reload`, without approval.

## Read Order

Read only what the task needs.

1. `AGENTS.md`
2. relevant `.agents/skills/*/SKILL.md`
3. relevant doctrine files under `docs/architecture/doctrine/`
4. relevant harness workflow/archetype/gate files under `.llm/harness/`
5. relevant run artifacts under `.llm/tmp/run/`
6. relevant package/plugin docs and README files
7. focused code

For internal `@netscript/*` package APIs, prefer `deno doc <module>` and
`deno doc --filter <symbol>` before broad implementation reads.

## Tooling

Preferred order:

1. Relevant MCP server or repo-native tool.
2. Reusable Deno scripts in `.llm/tools/` or `tools/`.
3. Focused shell commands — **prefix read-heavy `git`/`gh`/`grep`/`ls`/`docker` commands with
   `rtk`** to cut output tokens 60–90% (e.g. `rtk git status`, `rtk git diff`,
   `rtk grep <pattern>`); use `rtk proxy <cmd>` for `deno task` runs. See `.agents/skills/rtk`.
   `rtk` preserves command semantics and exit codes — do not use it for interactive commands, MCP
   calls, or file I/O.
4. Web search only when repo context is insufficient or freshness is required.

Use checked-in Deno scripts instead of complex one-off PowerShell when the logic is reusable.
Temporary scratch/output belongs in `.llm/tmp/`; reusable helper scripts belong in `.llm/tools/` or
`tools/` depending on whether they are harness/agent utilities or product-facing repo tooling.

## Validation

Run the smallest validation that proves the change. For targeted `deno check` commands that touch
workspace code, include `--unstable-kv`.

Wrap `deno task` validation runs in `rtk proxy` to keep logs tracked and compressed (e.g.
`rtk proxy deno task check`), and prefix git inspection between slices with `rtk` (`rtk git status`,
`rtk git diff`). See `.agents/skills/rtk`.

For root check, lint, and formatting validation, prefer the scoped wrappers:
`.llm/tools/run-deno-check.ts`, `.llm/tools/run-deno-lint.ts`, and `.llm/tools/run-deno-fmt.ts`.
They accept roots, extensions, include/exclude filters, batching, and structured compact output,
avoiding raw CLI noise and shell glob expansion. Package-quality formatting gates must target source
TypeScript only (`--ext ts,tsx`) and exclude generated output, scratch workspaces, and future-wave
packages. Do not treat raw root `deno fmt --check` across Markdown, generated files, or
line-ending-only legacy drift as a package-quality verdict, and do not run the mutating root
`deno task fmt` unless the user explicitly asks for repo-wide formatting changes.

Common commands:

```powershell
deno task check
deno task test
deno task lint
deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <path> --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx
deno task publish:dry-run
deno task arch:check
```

Before a branch is considered ready to merge, run the full CLI E2E test suite:

```powershell
deno task e2e:cli
```

The bare task runs the `scaffold.runtime` merge-readiness suite with cleanup enabled. For debugging,
use `deno task e2e:cli suites`, `deno task e2e:cli gates scaffold.runtime`, or
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

For changes that affect scaffold output, plugin scaffolding, DB wiring, Aspire helper generation, or
official plugin copy mode, use the full scaffold/plugins smoke in one pass:

```powershell
deno task e2e:cli run scaffold.plugins --cleanup --format pretty
```

Do not replace that command with separate `gates` or individual scaffold commands when a full
scaffold/plugins verdict is requested. The `scaffold.plugins` suite creates a local-source project,
adds the first-party plugins (`workers`, `sagas`, `triggers`, `streams`), provisions DB/runtime
state, restores Aspire modules, validates plugin endpoints/background paths, and cleans up when
`--cleanup` is present.

OpenHands PR trigger template for this gate:

```text
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run the full scaffold/plugins E2E smoke for this PR.

Use this single one-pass command from the repository root:

deno task e2e:cli run scaffold.plugins --cleanup --format pretty

Do not split this into individual gate commands. Report the raw exit code and summarize failing suite/test names if any. Preserve lock hygiene: do not commit deno.lock or source churn unless the run explicitly requires a reviewed fix.
```

This gate is expensive. Do not run it for every intermediate implementation loop; run it during the
evaluator/merge-readiness pass or when explicitly requested.

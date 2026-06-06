# AGENTS.md

NetScript package and plugin architecture is governed by the Architecture Doctrine under
`docs/architecture/doctrine/`. Use `.agents/skills/netscript-doctrine` for package and plugin
architecture decisions, gates, and debt entries. Use `.agents/skills/netscript-harness` and
`.llm/harness/` for harnessed work. Follow `.agents/rules/*.mdc` where present.

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
3. Focused shell commands.
4. Web search only when repo context is insufficient or freshness is required.

Use checked-in Deno scripts instead of complex one-off PowerShell when the logic is reusable.
Temporary scratch/output belongs in `.llm/tmp/`; reusable helper scripts belong in `.llm/tools/` or
`tools/` depending on whether they are harness/agent utilities or product-facing repo tooling.

## Validation

Run the smallest validation that proves the change. For targeted `deno check` commands that touch
workspace code, include `--unstable-kv`.

Common commands:

```powershell
deno task check
deno task test
deno task lint
deno task fmt
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

This gate is expensive. Do not run it for every intermediate implementation loop; run it during the
evaluator/merge-readiness pass or when explicitly requested.

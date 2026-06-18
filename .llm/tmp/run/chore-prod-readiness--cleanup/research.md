# Research — chore-prod-readiness--cleanup

> Supervisor-deepened (2026-06-18). Concrete candidate inventory + resolved method. The generator
> still MEASURE-FIRST verifies each candidate's consumers (import-graph + tests) before removal.

## Re-baseline

- Carried-in source: handover §3.1; re-derived against `main` @ `cc3b8731`.
- The S1 program followed **L-no-backcompat** (renames delete, no alias/shim) — confirmed: the shim
  surface is **small and inline**. `Glob **/{compat,legacy,deprecated,shim,aliases}*.{ts,tsx}` → **0
  files**; there are no dedicated shim/compat modules, only inline `@deprecated` markers.

## Repo shape (resolves the dead-code denominator)

- Top-level code/content dirs: `packages/`, `plugins/`, `ops/`, `.llm/tools/`, `docs/`, `.github/`,
  `.agents/`, `.claude/`, `.openhands/`, `.zed/`.
- **No top-level `examples/` or `apps/`** → dead-code denominator excludes them. Generated example
  code lives in scaffold templates under `packages/cli/src/kernel/templates/` and must be scanned
  as a consumer surface.
- 13 root files, **all legitimate**: `.gitattributes .gitignore .gitleaks.toml AGENTS.md
  AGENTS-handoff.md CLAUDE.md CODE_OF_CONDUCT.md CONTRIBUTING.md LICENSE README.md SECURITY.md
  deno.json deno.lock`.

## Shim / deprecation inventory (candidates — file:line)

| # | Location | Kind | Class | Verify-before-remove |
|---|----------|------|-------|----------------------|
| S1 | `packages/telemetry/src/context/job.ts` (whole file) | `@deprecated` pure re-export of `payload-context.ts` | **REMOVE** (back-compat shim) | importers of `createJobTraceEnv`/`extractJobTraceContext` from `job.ts` |
| S2 | `packages/cli/src/kernel/constants/windows.ts:217–231` | 8 `@deprecated` constant aliases (`DEFAULT_SERVY_CLI_PATH`…`DEFAULT_V8_HEAP_MB`) | **REMOVE** (internal) | CLI usages; **not** `scaffold-versions.ts` |
| S3 | `packages/database/mod.ts:254` | `@deprecated` fn alias → `buildPostgresConnectionString` | REMOVE (public) | doc:lint + dry-run for `@netscript/database` |
| S4 | `packages/database/extensions/sql-json.extension.ts:556` (`mssqlJsonExtension`, **`@deprecated` @554**) | deprecated alias → `sqlJsonExtension` | REMOVE (public, already deprecated) | importers |
| S4′ | `packages/database/extensions/sql-json.extension.ts:571` (`mysqlJsonExtension`) | sibling back-compat alias → `sqlJsonExtension` — **NOT `@deprecated`** (docstring @567–570 carries no tag) | **DEPRECATE-FIRST, DEFER removal** | deleting it now is a *silent* public-API break; mark `@deprecated` this run, remove in a later cycle |
| S5 | `packages/database/adapters/mssql.adapter.ts:66` (`@deprecated`), **live internal writer @415–416** (`config.options!.trustedConnection = true`) | deprecated public option (`trustedConnection`) backed by an active code path | **REFACTOR + REMOVE — not a delete** | option consumers **+** migrate the internal writer to `authentication.type = 'ntlm'` (interface @53–57); needs the mssql adapter's own behavioural test |
| S6 | `packages/plugin-workers-core/{streams/schema.ts:106, builders/job-builder.ts:48,130, public/root.ts:179}` **+ generated-output consumer `plugins/workers/src/scaffolding/job-scaffolders.ts:64–65`** (emits `.schedule(...)` into scaffolded job modules) | `@deprecated` recurring-job API | **REMOVE — PUBLIC, highest risk** | scaffold templates + the scaffolder above + `e2e:cli scaffold.runtime`; the recurring→scheduled-trigger migration must update the scaffolder **and** its test fixture or generated output references a removed method |
| S7 | `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:250` | `@deprecated` config path | REMOVE | importers / scaffold |
| S8 | `packages/fresh/src/runtime/server/define-fresh-app.ts:48,71` | `@deprecated` options (`staticFiles`/`fsRoutes`) | REMOVE (public option) | option consumers + fresh examples |
| F1 | `packages/cli/src/kernel/templates/aspire/helpers/helpers-generator-pipeline.ts:50` | "Aspire **compat shim** (D-7 Node.js workaround)" | **OFF-LIMITS — functional** | upstream workaround, not back-compat |
| F2 | `packages/cli/src/kernel/adapters/windows/compile/compile-bundler.ts:41,124,125,141` | esbuild "CJS **shim**" patch | **OFF-LIMITS — functional** | bundler-correctness fix |
| F3 | `packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:139` (writer) + `env-file-values.ts:130`, `env-file-content.ts:98` (writers) | "legacy alias" `ConnectionStrings__{provider}db` env var | **OFF-LIMITS — FUNCTIONAL (confirmed)** | **read by** `packages/service/src/diagnostics/database-connectivity.ts:48,71,94` (`ConnectionStrings__mysqldb`/`postgresdb`/`mssqldb`) — removing it breaks `@netscript/service` DB diagnostics. Tracked as arch-debt `database-connectivity-legacy-connstring-alias`. |

> Removing the **public** deprecated API (S3, S4, S6, S8) is a breaking change. That is acceptable at
> the target `0.0.1-alpha.0` (pre-1.0), but each requires the unit's archetype gates: consumer scan
> (incl. scaffold templates), `deno doc --lint` clean, and `publish:dry-run` non-regression. S6
> (plugin-workers-core recurring jobs) is the single highest-risk removal — scaffold output may emit
> recurring-job code, so it is gated on a full `e2e:cli scaffold.runtime` pass.
>
> **Deprecate-before-remove rule (PLAN-EVAL fix, cycle 1):** a public symbol may only be *removed*
> this run if it already carries an `@deprecated` marker on `main`. An un-marked public alias
> (**S4′ `mysqlJsonExtension`**) must be *deprecated this run and its removal deferred* — silently
> deleting it would be an unannounced breaking change even at alpha. **S5 `trustedConnection`** is
> not a symbol delete at all: the option is consumed by a live internal writer
> (`mssql.adapter.ts:415–416`), so removing the public option is a *behavioural refactor* (migrate
> the writer to `authentication.type = 'ntlm'`) carrying its own adapter test, not a deletion.

## Root-doc relocation — `AGENTS-handoff.md` → `openhands-handoff` skill

- Handover §3.1 named **`agents-handover.md`** as an example stray root file. No file of that exact
  name exists; the nearest real file is **`AGENTS-handoff.md`** (the *Agent Handoff Protocol* —
  OpenHands PR-comment trigger syntax + token rules).
- It is **still valid / load-bearing**: cited by `.agents/skills/openhands-handoff/SKILL.md` and the
  generated `.claude/skills/openhands-handoff/SKILL.md` (lines 44, 87), and by
  `.llm/harness/workflow/agent-handoff.md:26` as the canonical OpenHands trigger/token reference.
- **User directive (2026-06-18):** *"if it's still valid then it should be a skill not a root .MD
  file."* → the content stays, but moves into the skill; the root file goes.
- **Resolution (locked — plan PR-4, Slice G1-0):** fold `AGENTS-handoff.md` content into the
  canonical `.agents/skills/openhands-handoff/SKILL.md` so the skill is self-contained for trigger
  syntax + token rules; re-point the 3 references (the skill's own lines 44/87 become self-refs;
  `.llm/harness/workflow/agent-handoff.md:26` points at the skill); delete root `AGENTS-handoff.md`;
  regenerate the `.claude/skills/` mirror; `validate-claude-surface.ts` green. **Atomic slice** —
  the delete is meaningless without the content move, so they ship together. (The handover's literal
  `agents-handover.md` remains a non-existent phantom; the root is otherwise clean.)

## Dead-code method (RESOLVED)

- Reachability via `deno info <entry>` import-graph from each package's public entry
  (`deno.json` exports / `mod.ts`), cross-checked with `.llm/tools/find-import-patterns.ts` and the
  `codemogger` symbol search.
- A symbol/file is "dead" **only if** unreferenced across `packages/`, `plugins/`, `ops/`,
  `.llm/tools/`, `docs/`, **and** `packages/cli/src/kernel/templates/` (generated scaffold output),
  proven by graph **and** grep — never assumed.
- Cruft scope: gitignored scratch (`.llm/tmp/{claude,cli-e2e,openhands}`) is already untracked → not
  cleanup work. Hunt **tracked** `.bak`/`.tmp`/build leftovers and orphaned `.md` files (no nav /
  README / CI link). `.llm/tmp/run/` is durable tracked evidence — never delete.

## Open questions (status)

- Dead-code detection method — **RESOLVED** (above).
- `examples/`/`apps/` in scope — **RESOLVED** (absent at top level; scaffold templates are the
  generated-consumer surface to scan).
- Which compat shims exist / who consumes them — **RESOLVED** (inventory above; generator verifies
  each candidate's consumers before removal).
- **F3 `ConnectionStrings__{provider}db` legacy alias — RESOLVED (functional, off-limits).** Written
  by `servy-environment.ts:139` / `env-file-values.ts:130` / `env-file-content.ts:98`; **read** by
  `packages/service/src/diagnostics/database-connectivity.ts:48,71,94`. It is a load-bearing runtime
  contract, not back-compat debt. Filed as arch-debt `database-connectivity-legacy-connstring-alias`
  for eventual consolidation (out of this run's scope).
- **S4′ vs S4 (deprecate-first) — RESOLVED.** `mssqlJsonExtension` is `@deprecated` → removable;
  `mysqlJsonExtension` is not → deprecate-this-run, defer removal. See the deprecate-before-remove
  rule above.
- **S5 `trustedConnection` shape — RESOLVED.** Behavioural refactor (live internal writer at
  `mssql.adapter.ts:415–416`), not a delete.

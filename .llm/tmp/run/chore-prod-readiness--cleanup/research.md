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
| S4 | `packages/database/extensions/sql-json.extension.ts:554` | `@deprecated` alias → `sqlJsonExtension` | REMOVE (public) | importers |
| S5 | `packages/database/adapters/mssql.adapter.ts:65` | `@deprecated` auth option (`type='ntlm'`) | REMOVE (public option) | option consumers |
| S6 | `packages/plugin-workers-core/{streams/schema.ts:106, builders/job-builder.ts:48,130, public/root.ts:179}` | `@deprecated` recurring-job API | **REMOVE — PUBLIC, highest risk** | scaffold templates + `e2e:cli`; recurring→scheduled-trigger migration |
| S7 | `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:250` | `@deprecated` config path | REMOVE | importers / scaffold |
| S8 | `packages/fresh/src/runtime/server/define-fresh-app.ts:48,71` | `@deprecated` options (`staticFiles`/`fsRoutes`) | REMOVE (public option) | option consumers + fresh examples |
| F1 | `packages/cli/src/kernel/templates/aspire/helpers/helpers-generator-pipeline.ts:50` | "Aspire **compat shim** (D-7 Node.js workaround)" | **OFF-LIMITS — functional** | upstream workaround, not back-compat |
| F2 | `packages/cli/src/kernel/adapters/windows/compile/compile-bundler.ts:41,124,125,141` | esbuild "CJS **shim**" patch | **OFF-LIMITS — functional** | bundler-correctness fix |
| F3 | `packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:139` | "legacy alias" connection-string env var | **VERIFY (likely functional)** | may be required by deployed services — confirm before touching |

> Removing the **public** deprecated API (S3–S6, S8) is a breaking change. That is acceptable at the
> target `0.0.1-alpha.0` (pre-1.0), but each requires the unit's archetype gates: consumer scan
> (incl. scaffold templates), `deno doc --lint` clean, and `publish:dry-run` non-regression. S6
> (plugin-workers-core recurring jobs) is the single highest-risk removal — scaffold output may emit
> recurring-job code, so it is gated on a full `e2e:cli scaffold.runtime` pass.

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

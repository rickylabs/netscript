# Evaluation: S13 stale version-bound surface cleanup, D-17 telemetry resolver, parity phase 2

Independent IMPL-EVAL (fresh session, opposite family to the Codex · GPT-5.6 Sol generator). No
verdict was inherited; every gate below was re-run or independently challenged from this session.

## Metadata

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Run ID         | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a`                                  |
| Target         | `packages/mcp` (D-17 resolver + Aspire-ps edge), `packages/cli` scaffold consumers, `.llm/tools/validation` parity phase 2, generated carriers |
| Archetype      | `6 - CLI / Tooling` (MCP Archetype 2 seam folded in)                                    |
| Scope overlays | `docs` (one MCP README precedence line; run artifacts)                                  |
| Evaluator      | native Claude / Fable 5 / medium — 2026-08-30, session `5263170d…`, worktree `007-aspire-s13` |
| Evaluated head | `e3ffb5ddcbaa717b9db22c2ca29573626a20de69` (exact; `actualGitHead` in every receipt matches) |
| Evaluated range| `a46ea16d..e3ffb5dd` (6 commits, 51 files, +2602/−128); S10′ base `a46ea16d` unchanged |
| Slice / PR     | S13, issue #1724, epic #1712, draft PR #1779 (base `test/aspire-13-5-s10-e2e-gate-upgrades`) |
| Host state     | `mise exec -- aspire ps --format Json --nologo --non-interactive` → `[]` before and after; `docker ps -a` → empty. No AppHost, container, or `e2e:cli` was started. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `N/A` (justified) | `supervisor.md` "Recorded lane/eval overrides": epic PLAN-EVAL exhausted two `FAIL_PLAN` cycles, coordinator ratified D-1…D-17 (supervisor `drift.md` D-60 "D-17 ratified as written … S13 static Phase A is now dispatchable") and dispatched S13. Leaf records `PLAN-EVAL: N/A` before slice 1 (`worklog.md` progress row "bootstrap / PLAN-EVAL disposition", committed in `f3bf3c9d`). Accepted under the authorized escalation path. |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` with Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path, committed in slice 1 (`f3bf3c9d`) before any product change. Lighter than the Archetype-6 template (no spine/registry catalog) — acceptable because the slice touches no spine abstract, registry, or composition file. |
| Commit slices match design plan        | `PASS` | Planned 5 slices → 6 commits: `f3bf3c9d` RED contracts + run dir (slice 1); `7e9891fa` D-17 resolver/reader/README (slice 2); `5fac7818` cleanup, templates, env, consumer CI, teardown, carriers, manifest (slice 3); `07aa2638` parity phase 2 + tests + `deno.json` task (slice 4); `d3ac56ff` + `e3ffb5dd` gate-catalog receipt wiring and JSDoc (slice 5, two commits). Every commit touches the run dir (`worklog.md`), as the harness requires. Slice 5 deviates slightly from "run dir only" by touching `.llm/tools/gates/catalog.ts` and two JSDoc lines — both were needed for the exact-head receipt and doc-lint evidence; not a scope breach. |
| Each slice has a passing gate          | `PASS` | Slice 1 RED reproduced by the wrapper (exit 1, 9 type errors — intended); slices 2–5: MCP tests 139/0, CLI+validation focused tests 106/0, parity tests 10/0, freshness/fitness receipts at exact head. All re-run here (see Static Gates). |
| No speculative seams (unused files)    | `PASS` | Every new export (`AspirePsDashboardPort`, `AspirePsDashboardReader`, `resolveTelemetryEndpoint` root export, `DEFAULT_TELEMETRY_ENDPOINT`) has ≥ 2 real consumers: MCP `cli.ts`, `doctor-flow.ts`, `telemetry-doctor-family.ts`, `mcp-server.ts`, `telemetry-query-adapter.ts`, the generated telemetry route template, and the generated `.netscript/aspire-cli.ts`. `SCAFFOLD_COMMUNITY_TOOLKIT` removed with zero remaining references (`grep` over `packages plugins .llm/tools` → only the RED test asserting absence). |
| Constants used for finite vocabularies | `PASS` | `TelemetryEndpointSource` union extended with `'aspire_ps'`; `ASPIRE_PS_ARGS` centralized in the reader; `DEFAULT_TELEMETRY_ENDPOINT` remains the only home of `18888` in product code; `{{ASPIRE_SDK}}` rendered from `SCAFFOLD_VERSIONS.ASPIRE_SDK`. `PHASE_TWO_COMPAT_VERSION = '13.5.3'` is the contract-mandated fixed rule (D-13/D-16), not a product pin. |
| Contract (D-17) implemented as ratified| `PASS` | `packages/mcp/src/domain/telemetry-endpoint.ts`: explicit → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → `aspirePs?.readDashboardUrl()` (`source: 'aspire_ps'`) → `DEFAULT_TELEMETRY_ENDPOINT` (`source: 'default'`). `source` preserved on every branch. Domain performs no IO (port is an interface; the reader is the only `Deno.Command`/`Deno.realPathSync` site, in `src/infrastructure/`). Test `telemetry-endpoint_test.ts` proves ordering **and** laziness (`reads === 0` when `ASPIRE_DASHBOARD_PORT` wins). README line at `packages/mcp/README.md:317-319` matches the code order. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root packages/mcp --ext ts,tsx` | `PASS` | 117 files, 0 findings (re-run) | matches `receipts/mcp-check.json` |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/validation --ext ts,tsx` | `PASS` | 18 files, 0 findings (re-run) | |
| Slice typecheck  | `deno check --unstable-kv` over touched CLI/teardown files | `PASS` | exit 0 (re-run); `receipts/cli-validation-check.json` 101 files, 0 findings | |
| Format           | `run-deno-fmt.ts --root packages/mcp`; `deno fmt --check --no-config --single-quote --line-width 100` over 33 changed non-generated TS files | `PASS` | 116/116 and 33/33 clean (re-run) | |
| Lint             | `run-deno-lint.ts --root packages/mcp`; `deno lint --no-config` over the same 33 files | `PASS` | 0 findings (re-run) | no new `deno-lint-ignore`, `any`, or `as unknown as` in added product lines (scan of `+` lines excluding `*.generated.ts`) |
| Tests            | `run-deno-test.ts -- --allow-all packages/mcp/tests` | `PASS` | 139 passed / 0 failed (re-run) | |
| Tests            | `run-deno-test.ts` over the 9 focused CLI/teardown/validation files | `PASS` | 106 passed / 0 failed (re-run) | includes `check-aspire-version-parity_test.ts` (10) |
| Doc lint         | `deno doc --lint` on `telemetry-endpoint.ts` + `aspire-ps-dashboard-reader.ts` | `PASS` | "Checked 2 files", exit 0 (re-run) | |
| Doc lint (root)  | `deno doc --lint packages/mcp/mod.ts` | `N/A` (pre-existing) | exactly one error: `private-type-ref` `SchemaViewName` in `tool-contracts.ts` | not introduced or deepened by S13 |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` in `packages/mcp` | `PASS` | "Dry run complete", exit 0 (evaluator-run; not in the generator's receipt set) | new exports carry explicit types and JSDoc |
| Quality scan     | `deno task quality:scan` | `PASS` | `ok:true` twice; 0 findings; 7 pre-existing allowances (re-run) | matches `receipts/quality-scan.json` |
| Doctrine         | `deno task arch:check` | `PASS` | 36 roots, `FAIL=0` everywhere; `mcp` WARN=3 / `cli` WARN=55 identical to pre-existing baseline (re-run) | matches `receipts/arch-check.json` |
| Claude mirror    | `deno task agentic:sync-claude:check` | `PASS` | 18 skills, 22 mirrored files OK (re-run) | `.claude/skills/codex-wsl-remote/SKILL.md` byte-identical to `.agents` source |
| JSR specifiers   | `deno task check:netscript-jsr-specifiers` | `PASS` | scanned 2376, failures 0 (re-run) | new `JSR_SPECIFIERS.mcp` conforms |
| Scaffold pins    | `deno task check:scaffold-versions` | `PASS` | 11 stable pins (re-run) | no pin changed by S13 |
| Asset barrel     | `check:assets-barrel` | `PASS` (receipt) | `receipts/assets-barrel.json` exit 0 at `e3ffb5dd` | not re-run (task regenerates in place); `embedded.generated.ts` diff limited to the two telemetry templates and the compose workflow |
| Publish assets   | `check:publish-assets` | `PASS` (receipt) | `receipts/publish-assets.json` exit 0 at `e3ffb5dd` | `publish-assets.generated.ts` README diff = the one precedence line |
| Emitted samples  | `check:emitted-samples` | `PASS` (receipt) | 47 samples / 37 paths, exit 0 at `e3ffb5dd` | **covers plugin scaffolder emissions only** — it does not render `.netscript/aspire-cli.ts` or the app telemetry route (see F-1) |
| Parity phase 1 (default) | `deno task check:aspire-version-parity` | `PASS` (behaviour) | exit 1; `phase:1`, `manifestFresh:true`, 799 checked, fail 7 (all S1: toolchain.env, 3 workflows, policy test, `scaffold-versions.ts`, `scaffold-aspire.ts`), deferred 17, info 6, skipped 1 (re-run) | the red is the expected S1-absent state on this stack; phase 1 **is** the no-argument default |
| Parity phase 2 (report) | `deno task check:aspire-version-parity -- --phase 2 --report` | `PASS` (process) / `ok:false` (report) | exit 0; 799 checked, **fail 24**, deferred 0, info 6, skipped `packages/fresh-ui/deno.lock`, missing 0, `manifestFresh:true` (re-run, identical to `receipts/aspire-version-parity-phase2-report.json`) | This is **not** phase-2 enforcement green; it is a report-mode receipt whose child report is intentionally `ok:false`. |
| Parity phase 2 (enforce) | `deno task check:aspire-version-parity -- --phase 2` | expected `FAIL` | exit 1 (re-run) | confirms enforce mode fails closed on the 24 hits; `--phase 3` throws as designed |
| Link/path check  | manifest row source `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv`; checker import of `tools/aspire-surface-manifest.ts` | `PASS` | both tracked on the branch (`git ls-files`); `.gitignore` excludes only `.llm/tmp/` | see F-6 for the tree-dependence caveat |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `PASS` | new files: reader 95 LOC, checker 285 LOC, tests 229/42/37/13 LOC; `arch:check` no new F-1 WARN | none new |
| F-2  | Helper-reinvention scan      | `PASS` | reader reuses `extractAspireJson`/`isAspireRecord`/`aspireStringField` from `service-endpoints/aspire-cli-output.ts`; generated `.netscript/aspire-cli.ts` drops its private JSON/record helpers in favour of the shared reader | none |
| F-3  | Layering check               | `PASS` | domain (`telemetry-endpoint.ts`) has no IO; application (`doctor-flow`, `telemetry-doctor-family`, `mcp-server`) takes the port by injection; infrastructure owns `Deno.Command`; `cli.ts` composes the default reader | none |
| F-4  | Inheritance audit            | `PASS` | one class, implements an interface, no inheritance | none |
| F-5  | Public surface audit         | `PASS` with note | `mod.ts` gains 3 value exports + 7 type exports, all documented; `deno doc --lint` clean on the new modules; scaffold now depends on this surface (see F-3 finding) | none |
| F-6  | JSR publishability gate      | `PASS` | `deno publish --dry-run` exit 0 | none |
| F-7  | Doc-score gate               | `PASS` | member-level JSDoc on every new export (`e3ffb5dd`) | none |
| F-8  | Workspace `lib` override     | `N/A` | no compilerOptions change | |
| F-9  | Permission declaration       | `PASS` | MCP README already declares `--allow-run` for `aspire ps`; generated `aspire:otel`/`aspire:export` tasks keep `--allow-run=aspire --allow-read`, which the reader needs (`Deno.Command('aspire')`, `Deno.realPathSync`); verified by loading `packages/mcp/mod.ts` and constructing the reader under exactly `--allow-run=aspire --allow-read` → loads and resolves | none |
| F-10 | Test-shape audit             | `PASS` | semantic assertions (S2 `aspire ps` shape incl. banner, empty `[]`, precedence, laziness, both parity phases, compat rule, archival class override, freshness/unmatched, missing paths, exact-pin sweep); no giant snapshots | none |
| F-11 | Forbidden-folder lint        | `PASS` | `arch:check` unchanged | none |
| F-12 | Naming-convention lint       | `PASS` | `aspire-ps-dashboard-reader.ts`, `*_test.ts`, `check-aspire-version-parity.ts` follow package conventions | none |
| F-13 | Saga/runtime invariants      | `N/A` | | |
| F-14 | Console-log lint             | `PASS` | only `console.log` is in the `.llm/tools` checker `import.meta.main` block (tooling, allowed) | none |
| F-15 | Re-export-of-upstream lint   | `PASS` | no upstream re-exports added | none |
| F-16 | Folder-cardinality lint      | `PASS` | `mcp/src/domain` 14 and `application/flows` 16 are pre-existing WARNs, unchanged by S13 (no new files in either) | none new |
| F-17 | Abstract/derived co-location | `N/A` | no abstracts | |
| F-18 | Sub-barrel lint              | `PASS` | no new barrels | none |
| F-19 | Scoped source gate runners   | `PASS` | wrappers used for check/lint/fmt/test; raw `--no-config` lint/fmt only as a supplement | none |
| F-CLI-* | Archetype-6 specific      | `PENDING_SCRIPT` | manual: no `Deno.exit` outside `bin/**`/tooling; `Deno.*` in CLI limited to `adapters/**` (env-file adapters) and the `.llm/tools` checker; no composition/presentation change; no new `.template` outside `kernel/assets/**` | none observed |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| `scaffold.runtime` / `e2e:cli` | full scaffold + AppHost smoke | `N/A` (explicitly prohibited by this dispatch) | Coordinator-owned; canary C. Note that the local-source E2E path (`packagesAsWorkspaceMembers=true`) would **not** reproduce F-1 below, because workspace members resolve `@netscript/mcp` by name. |
| AppHost start / containers | — | `NOT_RUN` (prohibited) | `aspire ps` stayed `[]`; `docker ps -a` empty |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| Generated app `apps/<app>/deno.json` | `@netscript/mcp` import-map entry (jsr + local) | `PASS` | `generate-app-deno-json.ts` adds `NETSCRIPT_MCP` unconditionally; `generators-config_test.ts` asserts the local path `../../packages/mcp/mod.ts`; JSR path = `jsr:@netscript/mcp@<release tag>` via `JSR_SPECIFIERS.mcp` |
| Generated app telemetry route (`telemetry-trace.ts.template`) | env → running AppHost → "dashboard unavailable — run `aspire ps`"; no bare `18888` | `PASS` | template asserts in `route-templates_test.ts`; `grep 18888` over assets/templates/adapters → only the RED test's negative assertion; `telemetry-view.tsx.template` hides "Open Dashboard" when `dashboardUrl` is undefined |
| Generated workspace root `deno.json` + `.netscript/aspire-cli.ts` | `@netscript/mcp` must resolve from the root task | **`FAIL`** | Rendered `generateDenoJson` in every mode: `jsr` (members true/false) → root `imports` = `@netscript/config, contracts, kv, plugin, @database/zod` — **no `@netscript/mcp`**; `local` without members → `imports` = `@database/zod` only; only `local` + `packagesAsWorkspaceMembers=true` lists `./packages/mcp` as a workspace member. The public CLI hard-codes `packagesAsWorkspaceMembers: () => false` (`public-command-dependencies.ts:242`). The generated runner's first line is `import { AspirePsDashboardReader } from '@netscript/mcp';`, so `deno task aspire:otel` / `aspire:export` fail at module load for every `netscript init` consumer. No test or gate renders this file with its import map (`emitted-samples` covers plugin scaffolders only; `generators_test.ts` asserts the import string but not resolution). |
| Windows env adapters | `ASPIRE_DASHBOARD_PORT` only when configured | `PASS` | `env-file-dashboard_test.ts` (values + content); `4318` OTLP default untouched (not S13-owned) |
| Consumer CI template `deploy-compose-ghcr.yml.template` | `dotnet tool install Aspire.Cli --version {{ASPIRE_SDK}}` before `aspire restore`; `{{ASPIRE_SDK}}` rendered from `SCAFFOLD_VERSIONS.ASPIRE_SDK` | `PASS` | `plan-init_test.ts` asserts the literal and the ordering; `plan-init.ts` renders both placeholders; `embedded.generated.ts` carries the new steps |
| AppHost wording | `render-ts-apphost.ts` "Aspire ≥ 13.4 validates …" | `PASS` | `s13-stale-surface_test.ts` |
| Teardown ownership | `MCP_COMMAND = /(?:^|\s)aspire\s+agent\s+mcp\b/i` | `PASS` | `ownership_test.ts` rejects `aspire agent mcp`; no `aspire mcp` remnant in `.llm/tools/agentic/teardown` |
| Skill toolchain snapshot | `.agents/skills/codex-wsl-remote/SKILL.md` + `.claude` mirror | `PASS` | replaced with a `.github/toolchain.env` reference; mirror check OK |
| Manifest freshness | committed TSV vs `buildAspireSurfaceManifest()` | `PASS` (this tree) | `manifestFresh:true`, 0 unmatched, 800 rows on the branch tree; S13-owned rows carry no remaining stale literal (phase-2 fail set has zero `S13` owners) |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | `CLEAR` | no monolith; largest new file 285 LOC (tooling) | |
| AP-2  | `CLEAR` | domain resolver has no IO | |
| AP-3  | `CLEAR` | application flows take the port by injection | |
| AP-4  | `N/A` | | |
| AP-5  | `CLEAR` | port has two real adapters (reader + test fixtures) and five consumers | |
| AP-6  | `N/A` | no base flow | |
| AP-7  | `N/A` | | |
| AP-8  | `CLEAR` with note | new root exports are intentional (design "Public Surface"); see F-3 for the unrecorded plan/research contradiction | |
| AP-9  | `N/A` | | |
| AP-10 | `N/A` | | |
| AP-11 | `CLEAR` | `Deno.Command`/`realPathSync` only in `mcp/src/infrastructure/`; CLI `Deno.env` only in the existing windows env adapter | |
| AP-12 | `N/A` | | |
| AP-13 | `CLEAR` | | |
| AP-14 | `CLEAR` with note | `aspire ps` is a bounded single invocation with fixed argv; but it is a **synchronous** `outputSync()` spawn executed inside a Fresh route loader on every page load in the generated telemetry example (F-4) | |
| AP-15 | `CLEAR` | no upstream re-export | |
| AP-16 | `CLEAR` | no forbidden folder | |
| AP-17 | `N/A` | | |
| AP-18 | `CLEAR` | template truth lives in `.template` files; generated carriers regenerated, not hand-edited; tests are semantic | |
| AP-19 | `CLEAR` | permissions declared (README; generated task flags suffice — verified) | |
| AP-20 | `N/A` | | |
| AP-21 | `CLEAR` | no new presentation folder | |
| AP-22 | `CLEAR` | no new barrel | |
| AP-23 | `CLEAR` | composition (`cli.ts`) stays declarative: one `new AspirePsDashboardReader(...)` at the edge | |
| AP-24 | `CLEAR` | union extended; no switch-over-union added | |
| AP-25 | `CLEAR` | side effects confined to the infrastructure reader and `.llm/tools` `import.meta.main` | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `.llm/harness/debt/arch-debt.md` not in the diff; plan says "No new debt is planned" |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | `arch:check` WARN sets for `mcp`/`cli` identical to baseline; `SchemaViewName` doc-lint defect untouched |
| Unrecorded violations | 0     | none of the findings below is a doctrine violation requiring a debt entry; F-1 is a functional defect, F-3 is a drift-recording gap |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| **high** | **F-1 — Generated root `.netscript/aspire-cli.ts` imports `@netscript/mcp`, but the generated workspace root `deno.json` never maps it outside the local-workspace-member mode; the public CLI hard-codes `packagesAsWorkspaceMembers: () => false`, so every `netscript init` consumer (JSR mode, and public local mode) gets `aspire:otel` / `aspire:export` tasks that fail at module load.** | `templates/workspace/aspire-cli-task.ts:13` (`import { AspirePsDashboardReader } from '@netscript/mcp';`); `templates/workspace/deno-json.ts:50-59` (`jsrImports` = config/contracts/kv/plugin only; `imports` empty in local mode); `public-command-dependencies.ts:242`; evaluator render of `generateDenoJson` in all four mode combinations (jsr/local × members true/false) — `@netscript/mcp` present only as a workspace member in local+members. No gate covers it: `check:emitted-samples` iterates plugin scaffolder resources only; `generators_test.ts` asserts the import string, not resolution. The prohibited `scaffold.runtime` E2E runs local-source with workspace members and would also miss it. | **fix** (plan stays valid): either add `@netscript/mcp` to the root import map for every mode (`jsrImports` + local path when not a workspace member), or keep the runner dependency-free (the pre-S13 inline `aspire ps` logic was correct and self-contained) and use the shared reader only where an import map already exists (app + MCP). Add a test that renders the workspace `deno.json` + runner together and proves the specifier resolves in jsr **and** public-local mode. Re-run `generators_test.ts`, `plan-init_test.ts`, and the freshness gates. |
| medium | F-2 — The telemetry example template changes scheme for the `ASPIRE_DASHBOARD_PORT` path: the old template built `https://localhost:${port}`; the new one takes `resolved.endpoint` (`http://localhost:${port}`) and ignores `httpsFallback`. The MCP query adapter handles the http→https fallback in `createAspireDashboardFetch`; the generated route does not. | `telemetry-trace.ts.template:70-76` vs pre-S13 line 70; `telemetry-endpoint.ts:47-52` (`endpoint: http://…`, `httpsFallback: https://…`). Not covered by any test. | fix in the same cycle (use `httpsFallback ?? endpoint` for `aspire_port`, or the adapter's fetch) **or** record an explicit disposition in `drift.md` with the reason the http form is correct for the dashboard API. |
| medium | F-3 — `research.md` §jsr-audit locks "no new export map or root export" and "templates do not acquire a new JSR dependency"; the implementation adds 3 value + 7 type root exports to `@netscript/mcp` and makes every generated app **and** workspace root depend on `@netscript/mcp` (an MCP-server package pulling `@netscript/telemetry/query`, `@netscript/aspire`, …) at runtime. The Design section anticipates the root export, but the new generated-project dependency and the widened surface are recorded nowhere in `drift.md`. | `research.md:100-107`; `mod.ts:126-142`; `scaffold-packages.ts:10`, `jsr-specifiers.ts`, `generate-app-deno-json.ts:59,77`, `import-resolver.ts:30,129`; `drift.md` has three entries, none about this. | record the drift (footprint, rationale, canary-C coupling: JSR-mode scaffolds need an `@netscript/mcp` release that carries these exports — the current `NETSCRIPT_RELEASE_TAG` line does not until canary C publishes); the coordinator should confirm this dependency direction (CLI-generated app → MCP package) is intended. |
| medium | F-4 — `AspirePsDashboardReader.readDashboardUrl()` is a **synchronous** `Deno.Command(...).outputSync()` spawn of the Aspire CLI. In the generated telemetry route it runs inside `fetchDashboardTraces()` on every page load, blocking the event loop for the duration of `aspire ps`; and that call site passes **no `appHostPath`**, so with several AppHosts running the first `running` entry wins (non-deterministic dashboard). The MCP CLI and the workspace runner do pass the exact path. | `aspire-ps-dashboard-reader.ts:85-88,116-122`; `telemetry-trace.ts.template:71-75` (`new AspirePsDashboardReader()`); worklog Design justifies the sync port by "the existing synchronous resolver and CLI composition" — the Fresh route is neither. | fix or explicit disposition: pass a project-relative/absolute AppHost path from the generated app (or accept and document "first running AppHost"), and consider caching or an async variant for the route; at minimum record the trade-off in `drift.md`. |
| low | F-5 — The reader swallows every failure (`catch { return undefined }`), so the generated `.netscript/aspire-cli.ts` lost its previous actionable causes ("aspire ps exited N", "aspire ps JSON was invalid: …", "aspire ps did not emit a JSON array") and now always prints "no running AppHost matched aspire/apphost.mts". | `aspire-cli-task.ts` pre-S13 lines 64-90 vs new `resolveDashboardUrl()`; `formatAspireDashboardResolutionFailure` still exists but only receives the one generic cause. | consider surfacing the failure reason from the reader (e.g. a result type or a diagnostics callback); not blocking. |
| low | F-6 — Manifest freshness is tree-dependent: the committed 800-row manifest lists the four run-dir paths tracked on **this** branch (`aspire-surface-manifest.tsv`, `tools/aspire-surface-manifest.ts`, `slices/s5/repair/{drift,worklog}.md`), whereas `origin/main` `24f6642f` tracks **zero** files under `.llm/runs/research-aspire-13.5-adoption--0.0.7/` and the supervisor worktree tracks 205. After any convergence/rebase the `manifestFresh` check flips to `fail` in **both** phases (the freshness finding is unconditional), so the manifest must be regenerated in the convergence commit like the other carriers (D-54 discipline). Also the S1 branch owns a different `check-aspire-version-parity.ts`; whichever lands second must merge the two checkers. | `check-aspire-version-parity.ts:137-153`; `git ls-tree -r origin/main -- .llm/runs/research-aspire-13.5-adoption--0.0.7/` → 0; branch `git ls-files` → 4. | record in `drift.md` / coordinator convergence checklist: regenerate `tools/aspire-surface-manifest.ts` at the merge head; reconcile with S1's checker. Not blocking for Phase A. |
| low | F-7 — Sub-issue acceptance lists `docs/site/reference/mcp/index.md:194` as S11 prose; correctly untouched here (`docs/` not in the diff). PR `closingIssuesReferences` is empty because the base is a topic branch (D-58) — known, coordinator-owned retarget before merge. | `gh pr view 1779` | none for S13; coordinator retargets + re-runs close-gate. |
| info | F-8 — The phase-2 report receipt is process-PASS with `ok:false`; the PR body and worklog state this truthfully ("24 non-archival predecessor/derived hits"). Remaining non-archival phase-2 owner groups at `e3ffb5dd`: **S1** 7 (`.github/toolchain.env`, `e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml`, `aspire-nuget-cache-policy.test.ts`, `scaffold-versions.ts`, `scaffold-aspire.ts`); **S3** 5 compat fixtures missing `13.5.3` (`teardown/probes_test.ts`, `service-env-evidence_test.ts`, `generated-app-endpoint_test.ts`, `mcp/tests/service-endpoint-source-fixtures.ts`, `telemetry-live-fixture_test.ts`); **S9** 4 (`skills/aspire/SKILL.md`, `skills/help.md`, dogfood-bundle `aspire/SKILL.md`, `help.md`); **S11** 2 (`docs/site/explanation/aspire.md`, `deploy-local-aspire.md`); **S1/S4** 2 (`generate-aspire-config_test.ts`, `generators-tools-db-index_test.ts`); **derived** 2 (`embedded.generated.ts`, `skills.generated.ts`); **S4/S6** 1 (`_aspire-compat.ts.template`); **S4/S5/S6/S8** 1 (`generate-aspire-config.ts`). Sum 24. **None is S13-owned.** | re-run output `byOwner` | none; convergence tracking. |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence |
| --------- | ----------- | -------------- | ---------- |
| Generated root-level scripts need their own import-resolution test | When a workspace-root generated file (`.netscript/*.ts`) gains a bare `@netscript/*` import, render the root `deno.json` **and** the file together and assert resolution per import mode; `check:emitted-samples` only covers plugin scaffolders, and the local-source E2E masks the JSR-mode defect via workspace members. | Archetype 6 (scaffold generators) | high |
| "Extract to shared helper" must preserve the call site's import map reality | A shared package helper is only shareable where the consumer already has (or is given) an import map entry; otherwise the pre-existing inline copy was the correct design. | Archetype 6, Archetype 2 seams | high |
| Report-mode receipts carry `ok:false` on purpose | State "report PASS / ok:false" explicitly; never fold a report-mode receipt into "enforcement green". | harness gates | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` |
| Rationale | The ratified D-17 chain, `source` preservation, injected IO boundary, S2/empty fixtures, Windows env conditional emission, consumer CI ordering, AppHost wording, `SCAFFOLD_COMMUNITY_TOOLKIT` removal, `aspire agent mcp` ownership, regenerated carriers, manifest freshness on this tree, parity phases 1/2 with phase 1 default, fixed `13.5.3` compat rule, archival/lockfile handling, stale/unmatched detection, `ci.yml` unflipped, and every listed static/doctrine gate are all verified and green at `e3ffb5dd`. The plan remains valid. However the scaffold consumer path is broken for real users: the generated root `.netscript/aspire-cli.ts` imports `@netscript/mcp` while the generated root `deno.json` never maps it in the public CLI's modes (F-1) — a "consumer import not updated" failure that no gate in the set can observe. F-2/F-3/F-4 need a fix or a recorded disposition in the same cycle. Phase A is therefore **not complete**; S13 has no Phase B. |
| Parity flip | **Deferred, correctly.** `.github/workflows/ci.yml` contains no `aspire-version-parity` reference (unchanged from base); `parsePhase([])` → 1 with a test locking it; `origin/main` `24f6642f` still pins `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.6` / `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.6` and neither `chore/aspire-13-5-s1-pin-bump` nor `fix/aspire-13-5-s9-skills-mcp-alignment` is contained in `main`, so the S1 #1727 + S9 #1759 + S11 #1771 prerequisite is unmet at evaluation time. |
| Re-eval scope | After the F-1 fix commit (plus F-2/F-3/F-4 dispositions), a **scoped** re-check is sufficient: `generators_test.ts` + the new resolution test, `plan-init_test.ts`, `check:assets-barrel`, `check:publish-assets`, `check:emitted-samples`, `drift.md` review, and a re-read of the runner/template diff. The MCP, parity, and doctrine evidence at `e3ffb5dd` need no rerun unless those files change. |
| PR hygiene (read-only) | #1779 draft, base `test/aspire-13-5-s10-e2e-gate-upgrades`, head `e3ffb5dd`; labels `type:chore`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:tooling`, `priority:p2`, exactly one `status:impl`; milestone `0.0.7`; body has `Closes #1724`, `Part of #1712`, per-slice checklist and DoD; six `[PHASE: IMPL]` per-slice comments with commit SHAs; #1724 open, `status:impl`, milestone `0.0.7`. Deficiency: `closingIssuesReferences` empty (topic-branch base, D-58) — coordinator retarget before merge. Not modified. |
| Evaluator non-mutation | Only this file was written. `git status` shows the same two untracked receipt/prompt artifacts as at start; no commits, pushes, comments, labels, or ready-state changes; scratch scripts lived under `$CLAUDE_JOB_DIR/tmp` outside the repository and were removed. |

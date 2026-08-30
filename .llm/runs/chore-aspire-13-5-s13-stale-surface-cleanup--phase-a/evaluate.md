# Evaluation: S13 stale version-bound surface cleanup, D-17 telemetry resolver, parity phase 2 — IMPL-EVAL cycle 2

Fresh independent IMPL-EVAL cycle 2 (native Claude · Fable 5 · medium; opposite family to the
Codex · GPT-5.6 Sol generator). Cycle 1's verdict was read as input only; nothing was inherited.
Every gate below was re-run or independently challenged from this session at the exact head.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Target         | `packages/mcp` (D-17 resolver + `aspire ps` runtime edge), `packages/cli` scaffold consumers/templates/env adapters, `.llm/tools/validation` parity phase 2, teardown ownership, regenerated carriers |
| Archetype      | `6 - CLI / Tooling` (MCP Archetype 2 seam folded in) |
| Scope overlays | `docs` (one MCP README precedence line; run artifacts) |
| Evaluator      | native Claude / Fable 5 / medium — 2026-08-30, job `b7095b3b`, worktree `007-aspire-s13`, cycle 2 (fresh session; cycle 1 was `5263170d…`) |
| Evaluated head | `fc0a0c8ccc02ed8f741931de3455e7778df8697d` (exact; `git rev-parse HEAD` matches; PR #1779 `headRefOid` matches) |
| Evaluated range| `a46ea16d..fc0a0c8c` (7 commits, 54 files, +2968/−145); focused re-evaluation of `e3ffb5dd..fc0a0c8c` (remediation: 10 files, 5 product) |
| Slice / PR     | S13, issue #1724, epic #1712, draft PR #1779 (base `test/aspire-13-5-s10-e2e-gate-upgrades`, S10′ `a46ea16d`) |
| Host state     | `mise exec -- aspire ps --format Json --nologo --non-interactive` → `[]`; `docker ps -a` → empty (header only). No AppHost, container, `aspire start`, or `e2e:cli` was run. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `N/A` (justified) | `supervisor.md` "Recorded lane/eval overrides" + `worklog.md` bootstrap row: epic PLAN-EVAL exhausted two `FAIL_PLAN` cycles, coordinator ratified D-1…D-17 (supervisor `drift.md` D-60 "D-17 ratified as written … S13 static Phase A is now dispatchable"), and the leaf recorded `PLAN-EVAL: N/A` in slice 1 (`f3bf3c9d`) before any product change. Accepted under the authorized escalation path. |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` (Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path), committed in `f3bf3c9d`. Lighter than the full Archetype-6 template; acceptable because no spine abstract, registry, composition file, or command vocabulary changes. |
| Commit slices match design plan        | `PASS` | Planned 5 slices → 7 commits: `f3bf3c9d` RED contracts + run dir (tests only: 8 test/test-support files + 6 run-dir files, zero product code); `7e9891fa` D-17 resolver/reader/README; `5fac7818` cleanup/templates/env/consumer CI/teardown/carriers/manifest; `07aa2638` parity phase 2; `d3ac56ff`+`e3ffb5dd` receipt wiring + JSDoc; `fc0a0c8c` evaluator remediation (slice 6, recorded in worklog/drift/supervisor). Every commit touches the run dir (`git show --name-only`: 6/1/1/2/1/1/5 run-dir files). Seven `[PHASE: IMPL]` PR comments, one per commit, with SHAs. |
| Each slice has a passing gate          | `PASS` | Slice 1 RED reproduced by the generator (wrapper exit 1, 9 type errors — intended); slices 2–6 gates re-run here: MCP 139/0, focused CLI+teardown+validation 106/0, fitness/freshness gates exit 0 at `fc0a0c8c` (see Static Gates). Receipts under `receipts/` carry `actualGitHead` `fc0a0c8c` for arch-check, assets-barrel, emitted-samples, publish-assets, quality-scan; the parity report receipt is at `e3ffb5dd` (see F-4). |
| No speculative seams (unused files)    | `PASS` | Every new export has real consumers: `AspirePsDashboardPort`/`AspirePsDashboardReader`/`resolveTelemetryEndpoint`/`DEFAULT_TELEMETRY_ENDPOINT` used by `cli.ts`, `doctor-flow.ts`, `telemetry-doctor-family.ts`, `mcp-server.ts`, `telemetry-query-adapter.ts`, the telemetry route template, and the generated `.netscript/aspire-cli.ts`. `SCAFFOLD_COMMUNITY_TOOLKIT` has zero references left (`grep` over `packages plugins .llm/tools` → only the RED test asserting absence). `NETSCRIPT_MCP` scaffold constant consumed by `import-resolver.ts`, `generate-app-deno-json.ts`, `deno-json.ts`. |
| Constants used for finite vocabularies | `PASS` | `TelemetryEndpointSource` union extended with `'aspire_ps'`; `ASPIRE_PS_ARGS` centralized in the reader; `DEFAULT_TELEMETRY_ENDPOINT` is the only product home of `18888` in the changed surface; `{{ASPIRE_SDK}}` rendered from `SCAFFOLD_VERSIONS.ASPIRE_SDK`; `SCAFFOLD_PACKAGES.NETSCRIPT_MCP` + `JSR_SPECIFIERS.mcp` (specifier guard: scanned 2376, failures 0). `PHASE_TWO_COMPAT_VERSION = '13.5.3'` is the D-13/D-16 contract rule, not a product pin. |
| Contract (D-17) implemented as ratified| `PASS` | `packages/mcp/src/domain/telemetry-endpoint.ts:36-56`: explicit → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → `aspirePs?.readDashboardUrl()` (`source: 'aspire_ps'`) → `DEFAULT_TELEMETRY_ENDPOINT` (`source: 'default'`); `source` preserved on every branch; the port is an interface, the domain performs no IO. `telemetry-endpoint_test.ts` proves ordering and laziness (`reads === 0` when the port wins). README `packages/mcp/README.md:317-319` matches the code order; `publish-assets.generated.ts` diff is exactly that line. |
| Cycle-1 findings dispositioned         | `PASS` | **F-1 fixed** (`deno-json.ts:60-66` maps `@netscript/mcp` in every mode where the runner is emitted and packages are not workspace members — same `!options.noAspire` gate as the runner emission at `plan-init.ts:285-290`; `generators_test.ts` locks JSR + local; evaluator render confirms, see Consumer Gates). **F-2 fixed** (`telemetry-trace.ts.template:77-79` `resolved.httpsFallback ?? resolved.endpoint`; asserted in `route-templates_test.ts:96-99`). **F-3 dispositioned** (`drift.md` "Shared MCP helper widens generated consumer dependencies"). **F-4 dispositioned** (`drift.md` "Synchronous telemetry discovery trade-off"). **F-6 dispositioned** (`drift.md` "Convergence must regenerate the tree-bound manifest"). F-5 explicitly left as a non-blocking improvement (`worklog.md` "Reconcile — evaluator cycle 1"). |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root packages/mcp --ext ts,tsx` | `PASS` | 0 findings (re-run) | matches `receipts/mcp-check.json` |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/validation --ext ts,tsx` | `PASS` | 0 findings (re-run) | |
| Slice typecheck  | `deno check --unstable-kv` over 14 touched CLI/teardown/gate/validation source files | `PASS` | exit 0 (re-run) | receipts `cli-validation-check.json`, `evaluator-fix-check.json` 0 findings |
| Format           | `run-deno-fmt.ts --root packages/mcp`; `deno fmt --check --no-config --single-quote --line-width 100` over the 33 changed non-generated TS files | `PASS` | 116/116 and 33/33 clean (re-run) | |
| Lint             | `run-deno-lint.ts --root packages/mcp`; `deno lint --no-config` over the same 33 files | `PASS` | 0 findings (re-run) | scan of all `+` lines in the range (excluding `*.generated.ts`, run dir): no `any`, `as unknown as`, `deno-lint-ignore`, `quality-allow`, `@ts-ignore` |
| Tests            | `run-deno-test.ts -- --allow-all packages/mcp/tests` | `PASS` | 139 passed / 0 failed (re-run) | |
| Tests            | `run-deno-test.ts` over the 9 focused CLI/teardown/validation files | `PASS` | 106 passed / 0 failed (re-run) | includes `check-aspire-version-parity_test.ts` (10), `generators_test.ts`, `route-templates_test.ts`, `plan-init_test.ts`, `env-file-dashboard_test.ts`, `ownership_test.ts` |
| Doc lint (targeted) | `deno doc --lint` on `telemetry-endpoint.ts` + `aspire-ps-dashboard-reader.ts` | `PASS` | "Checked 2 files", exit 0 (re-run) | |
| Doc lint (root)  | `deno doc --lint packages/mcp/mod.ts`; `deno task doc:lint --root packages/mcp` | `N/A` (pre-existing) | exactly one error: `private-type-ref` `SchemaViewName` (`tool-contracts.ts`) on `mod.ts`/`cli.ts` entrypoints | not introduced or deepened by S13 |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` in `packages/mcp` | `PASS` | "Dry run complete", exit 0 (re-run) | |
| Quality scan     | `deno task quality:scan` | `PASS` | exit 0; 0 findings; 7 pre-existing allowances (re-run) | matches `receipts/quality-scan.json` @ `fc0a0c8c` |
| Doctrine         | `deno task arch:check` | `PASS` | exit 0; 36 roots; 0 FAIL; only pre-existing WARNs (DEPS-NPM-CATALOG, F-5/F-6 `export default`) (re-run) | matches `receipts/arch-check.json` @ `fc0a0c8c` |
| Claude mirror    | `deno task agentic:sync-claude:check` | `PASS` | 18 skills, 22 mirrored files OK (re-run); `.claude/skills/{codex-wsl-remote,netscript-pr,netscript-harness}` byte-identical to `.agents` sources | |
| JSR specifiers   | `deno task check:netscript-jsr-specifiers` | `PASS` | scanned 2376, failures 0 (re-run) | |
| Scaffold pins    | `deno task check:scaffold-versions` | `PASS` | 11 stable pins (re-run); no pin changed by S13 | |
| Asset barrel     | `deno task check:assets-barrel` | `PASS` | exit 0 (re-run at `fc0a0c8c`; tree unchanged afterwards) | `embedded.generated.ts` diff limited to the two telemetry templates + compose workflow |
| Publish assets   | `deno task check:publish-assets` | `PASS` | exit 0 (re-run) | |
| Emitted samples  | `deno task check:emitted-samples` | `PASS` | 47 samples / 37 paths, exit 0 (re-run) | covers plugin scaffolder emissions only (not the root runner) — hence the evaluator render below |
| Parity phase 1 (default) | `deno task check:aspire-version-parity` | `PASS` (behaviour) | exit 1; `phase:1`, `expectedVersion:13.4.6`, `manifestFresh:true`, 799 checked, fail 7 (all owner S1), deferred 17, info 6, skipped 1, missing 0 (re-run) | the red is the expected S1-absent state; no-argument default is phase 1 (`parsePhase([]) → 1`, test-locked) |
| Parity phase 2 (report) | `deno task check:aspire-version-parity -- --phase 2 --report` | `PASS` (process) / `ok:false` (report) | exit 0; 799 checked, **fail 24**, deferred 0, info 6, skipped `packages/fresh-ui/deno.lock`, missing 0, `manifestFresh:true` (re-run at `fc0a0c8c`; counts identical to the generator's `e3ffb5dd` receipt) | **Not** phase-2 enforcement green — report-mode receipt with an intentionally `ok:false` child verdict. |
| Parity phase 2 (enforce) | `deno task check:aspire-version-parity -- --phase 2` | expected `FAIL` | exit 1 (re-run) | fails closed on the 24 predecessor/derived hits |
| CI flip          | `grep aspire-version-parity .github/workflows/ci.yml` | `PASS` (unflipped) | no match; `ci.yml` not in the diff | see Verdict "Parity flip" |
| Link/path check  | manifest row source + checker import | `PASS` | `.llm/runs/research-aspire-13.5-adoption--0.0.7/{aspire-surface-manifest.tsv,tools/aspire-surface-manifest.ts}` tracked on the branch; branch tool's `RULES` block byte-identical to the supervisor copy (only refactored into an importable `buildAspireSurfaceManifest()`); branch TSV differs from the supervisor TSV only by the run-dir rows tracked on each tree (F-6 disposition) | |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `PASS` | reader 95 LOC, checker 285 LOC, `deno-json.ts` 133 LOC; `arch:check` no new F-1 WARN | none new |
| F-2  | Helper-reinvention scan      | `PASS` | reader reuses `extractAspireJson`/`isAspireRecord`/`aspireStringField`; generated runner dropped its private JSON helpers; `deno-json.ts` reuses `resolveNetScriptImports` instead of a second path table | none |
| F-3  | Layering check               | `PASS` | domain `telemetry-endpoint.ts` has no IO; application flows take the port by injection; `Deno.Command`/`Deno.realPathSync` only in `src/infrastructure/aspire-ps-dashboard-reader.ts`; `cli.ts` composes the default reader; CLI `Deno.env` only in the existing windows env adapter | none |
| F-4  | Inheritance audit            | `PASS` | one class implementing an interface; no inheritance | none |
| F-5  | Public surface audit         | `PASS` with note | `mod.ts` +3 value / +7 type exports, all documented; widened surface + generated-consumer dependency recorded in `drift.md` (cycle-1 F-3) | none |
| F-6  | JSR publishability gate      | `PASS` | `deno publish --dry-run` exit 0 | none |
| F-7  | Doc-score gate               | `PASS` | member-level JSDoc on every new export; targeted `deno doc --lint` clean | none |
| F-8  | Workspace `lib` override     | `N/A` | no compilerOptions change | |
| F-9  | Permission declaration       | `PASS` | MCP README declares `--allow-run` for `aspire ps`; generated `aspire:otel`/`aspire:export` tasks keep `--allow-run=aspire --allow-read`, which the reader needs | none |
| F-10 | Test-shape audit             | `PASS` | semantic assertions: S2 `aspire ps` shape incl. banner, empty `[]`, precedence + laziness, both parity phases, fixed 13.5.3 compat rule, archival class override, freshness/unmatched, missing paths, exact-pin sweep, root import map per mode, https fallback, conditional `ASPIRE_DASHBOARD_PORT`, CI install ordering | none |
| F-11 | Forbidden-folder lint        | `PASS` | `arch:check` unchanged | none |
| F-12 | Naming-convention lint       | `PASS` | `aspire-ps-dashboard-reader.ts`, `*_test.ts`, `check-aspire-version-parity.ts` | none |
| F-13 | Saga/runtime invariants      | `N/A` | | |
| F-14 | Console-log lint             | `PASS` | only `console.log` in the `.llm/tools` checker `import.meta.main` block (tooling) and the generated runner template (consumer script, pre-existing pattern) | none |
| F-15 | Re-export-of-upstream lint   | `PASS` | none added | none |
| F-16 | Folder-cardinality lint      | `PASS` | no new files in the pre-existing WARN folders (`mcp/src/domain`, `application/flows`) | none new |
| F-17 | Abstract/derived co-location | `N/A` | no abstracts | |
| F-18 | Sub-barrel lint              | `PASS` | no new barrels | none |
| F-19 | Scoped source gate runners   | `PASS` | wrappers used for check/lint/fmt/test; raw `--no-config` lint/fmt only as a supplement | none |
| F-CLI-* | Archetype-6 specific      | `PENDING_SCRIPT` | manual: no `Deno.exit` outside `bin/**`/tooling/generated consumer script; `Deno.*` in CLI limited to `adapters/**`; no composition/presentation change; `.template` files only under `kernel/assets/**`; backed by `arch:check` 0 FAIL | none observed |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| `scaffold.runtime` / `e2e:cli` | full scaffold + AppHost smoke | `N/A` (explicitly prohibited by this dispatch; coordinator-owned; canary C) | Static-only dispatch; runtime verdict re-earned at the merge head per D-41/D-54 |
| AppHost start / containers | — | `NOT_RUN` (prohibited) | `aspire ps` stayed `[]`; `docker ps -a` empty |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| Generated workspace root `deno.json` + `.netscript/aspire-cli.ts` (**cycle-1 F-1**) | `@netscript/mcp` must resolve from the root task in every mode that emits the runner | `PASS` | `deno-json.ts:60-66`: mapped unless `noAspire` (runner not emitted) or `local`+`packagesAsWorkspaceMembers` (`./packages/mcp` is a workspace member — `mcp` ∈ `SCAFFOLD_WORKSPACE_PACKAGES`). Evaluator render under `.llm/tmp/` (removed): **jsr** → `@netscript/mcp: jsr:@netscript/mcp@0.0.6` beside config/contracts/kv/plugin; **local non-member** (`localBase` up-path) → `../../../../packages/mcp/mod.ts` and `deno check .netscript/aspire-cli.ts` **exit 0** against the monorepo. `generators_test.ts` locks both public modes. The public CLI path (`init-command.ts:128` `importMode: 'jsr'`, `public-command-dependencies.ts:242` members=false) is now covered. |
| JSR-mode published-tag coupling | resolution against the currently published tag | `PASS` with note | `deno check` of the rendered jsr runner → `TS2305 Module 'https://jsr.io/@netscript/mcp/0.0.6/mod.ts' has no exported member 'AspirePsDashboardReader'`; `deno doc jsr:@netscript/mcp@0.0.6` → 0 matches. Expected: `NETSCRIPT_RELEASE_TAG` pins the whole train and `mcp` is published from the same workspace; `mcp` ∈ `SCAFFOLD_JSR_RELEASE_PACKAGES` so the P1D `minimumDependencyAge` exclusion covers it. Recorded in `drift.md` (canary C coupling). See F-1 (info). |
| Generated app `apps/<app>/deno.json` | `@netscript/mcp` import-map entry (jsr + local) | `PASS` | `generate-app-deno-json.ts:59,77`; `generators-config_test.ts` asserts jsr key order and local path `../../packages/mcp/mod.ts` |
| Generated app telemetry route (`telemetry-trace.ts.template`) | env → running AppHost → "dashboard unavailable — run `aspire ps`"; no bare `18888`; https fallback for `ASPIRE_DASHBOARD_PORT` (**cycle-1 F-2**) | `PASS` | template lines 70-79; `route-templates_test.ts:87-105` incl. `!includes('18888')`; `telemetry-view.tsx.template` hides "Open Dashboard" when `dashboardUrl` undefined; `grep 18888 packages/cli/src` → only unrelated pre-existing constants (`port-ranges.ts`, windows `manifest.ts`, plugin-loader test) and negative assertions |
| Windows env adapters | `ASPIRE_DASHBOARD_PORT` only when configured | `PASS` | `env-file-values.ts:213-215`, `env-file-content.ts:292-294`; `env-file-dashboard_test.ts` (values + content); OTLP `4318` default untouched (not S13-owned) |
| Consumer CI template `deploy-compose-ghcr.yml.template` | `dotnet tool install Aspire.Cli --version {{ASPIRE_SDK}}` before `aspire restore`; placeholder rendered from `SCAFFOLD_VERSIONS.ASPIRE_SDK` | `PASS` | template lines 42-46; `plan-init.ts:178-180`; `plan-init_test.ts:186-193` asserts literal and ordering |
| AppHost wording | `render-ts-apphost.ts:81` "Aspire ≥ 13.4 validates …" | `PASS` | `s13-stale-surface_test.ts` |
| `SCAFFOLD_COMMUNITY_TOOLKIT` removal | constant deleted, no consumer | `PASS` | `scaffold-aspire.ts` diff; grep → only the negative test |
| Teardown ownership | `MCP_COMMAND = /(?:^|\s)aspire\s+agent\s+mcp\b/i` | `PASS` | `ownership.ts:48`; `ownership_test.ts` rejects `aspire agent mcp`; no `aspire mcp` remnant under `.llm/tools/agentic/teardown` |
| Skill toolchain snapshot | `.agents/skills/codex-wsl-remote/SKILL.md:149` + `.claude` mirror | `PASS` | replaced with `.github/toolchain.env` reference; mirror byte-identical |
| Manifest freshness | committed TSV vs `buildAspireSurfaceManifest()` | `PASS` (this tree) | `manifestFresh:true`, 0 unmatched on both phases at `fc0a0c8c`; the remediation commit added no new Aspire-mentioning tracked path, so the `e3ffb5dd` manifest remains fresh at head. Zero S13-owned rows in the phase-2 fail set. |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | `CLEAR` | largest new file 285 LOC (tooling) | |
| AP-2  | `CLEAR` | domain resolver has no IO | |
| AP-3  | `CLEAR` | application flows take the port by injection | |
| AP-4  | `N/A` | | |
| AP-5  | `CLEAR` | port has a real adapter + test fixtures and five consumers | |
| AP-6  | `N/A` | no base flow | |
| AP-7  | `N/A` | | |
| AP-8  | `CLEAR` | widened root exports are intentional (Design "Public Surface") and now drift-recorded | |
| AP-9  | `N/A` | | |
| AP-10 | `N/A` | | |
| AP-11 | `CLEAR` | `Deno.Command`/`realPathSync` only in `mcp/src/infrastructure/`; CLI `Deno.env` only in the existing windows env adapter | |
| AP-12 | `N/A` | | |
| AP-13 | `CLEAR` | | |
| AP-14 | `CLEAR` with note | bounded single `aspire ps` invocation with fixed argv; synchronous spawn in the example route is drift-dispositioned (cycle-1 F-4) | |
| AP-15 | `CLEAR` | | |
| AP-16 | `CLEAR` | | |
| AP-17 | `N/A` | | |
| AP-18 | `CLEAR` | template truth in `.template` files; carriers regenerated (freshness gates exit 0); tests semantic | |
| AP-19 | `CLEAR` | permissions declared; generated task flags suffice | |
| AP-20 | `N/A` | | |
| AP-21 | `CLEAR` | no new presentation folder | |
| AP-22 | `CLEAR` | no new barrel | |
| AP-23 | `CLEAR` | `cli.ts` composition stays declarative: one `new AspirePsDashboardReader(...)` at the edge | |
| AP-24 | `CLEAR` | union extended; no switch-over-union added | |
| AP-25 | `CLEAR` | side effects confined to the infrastructure reader, `.llm/tools` `import.meta.main`, and generated consumer scripts | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `.llm/harness/debt/arch-debt.md` not in the diff; plan "No new debt is planned" |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | `arch:check` WARN set unchanged; `SchemaViewName` doc-lint defect untouched |
| Unrecorded violations | 0     | no finding below is a doctrine violation requiring a debt entry |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| info | F-1 — JSR-mode scaffolds cut from this head reference `jsr:@netscript/mcp@0.0.6`, whose published surface lacks `AspirePsDashboardReader`/`resolveTelemetryEndpoint`; the generated runner and telemetry route only work once CLI and MCP ship together on the 0.0.7 train (canary C). Structurally sound (single `NETSCRIPT_RELEASE_TAG`, `mcp` in the workspace publish and in the min-age exclusion list) and already recorded in `drift.md`. | evaluator `deno check` → `TS2305 … no exported member 'AspirePsDashboardReader'`; `SCAFFOLD_JSR_RELEASE_PACKAGES` includes `mcp` | none for S13; coordinator keeps canary C coupled (publish MCP + CLI in the same cut) and confirms the CLI-generated-project → `@netscript/mcp` dependency direction is intended (cycle-1 F-3 ask; drift now records it). |
| low | F-2 — `.claude/skills/netscript-pr/SKILL.md` is classed `skill:internal / archival` in the manifest ("historical branch-name example") and appears in the range diff. It is a pure `agentic:sync-claude` regeneration (the `.agents` source already carried the added acceptance-checkbox paragraph at base `a46ea16d`; the mirror was stale); the historical example content is untouched and the row is info-only in both parity phases. | `git show a46ea16d:.agents/skills/netscript-pr/SKILL.md` contains the paragraph; `cmp` mirror byte-identical; manifest row owner `archival` | none for S13 (mechanical mirror sync required by the `agentic:sync-claude:check` gate); coordinator may reclassify `.claude/**` mirrors as `derived` in the manifest tool at convergence so a mirror sync never reads as an archival edit. |
| low | F-3 — `AspirePsDashboardReader.readDashboardUrl()` swallows every failure, so the generated runner always reports "no running AppHost matched aspire/apphost.mts" where it previously distinguished "aspire ps exited N" / invalid JSON / not-an-array (cycle-1 F-5, explicitly left open). | `aspire-ps-dashboard-reader.ts:60-79` vs pre-S13 `aspire-cli-task.ts:64-90` | non-blocking follow-up: surface the failure cause (result type or diagnostics callback); not Phase-A scope. |
| low | F-4 — The only parity receipt is at `e3ffb5dd` (`receipts/aspire-version-parity-phase2-report.json`); no exact-head receipt at `fc0a0c8c`. The remediation commit changes no manifest-relevant tracked path, and this evaluator's re-run at `fc0a0c8c` reproduces the identical report (799/24/0/6/1/0, `manifestFresh:true`). Receipts embed bounded hashed output, not the report body. | receipt `actualGitHead`; evaluator re-run | none blocking; the coordinator's convergence commit re-earns the receipt at the merge head anyway (D-54, drift F-6 entry). |
| low | F-5 — `context-pack.md` was written in slice 1 and never refreshed: it still says "Current phase: implement", "In Progress: First commit/push and stacked draft PR creation", gates "pending". `worklog.md`, `drift.md`, `supervisor.md`, and the seven PR comments carry the resumable state, so resume is possible, but the harness asks for the context pack to be current per slice. | `context-pack.md` lines 9, 26-34, 43-50; only commit touching it is `f3bf3c9d` | update `context-pack.md` (phase, completed slices, gate status, cycle-2 verdict) in the coordinator sign-off/convergence commit; not blocking. |
| low | F-6 — PR #1779 `closingIssuesReferences` is empty because the base is a topic branch (D-58); `Closes #1724` is in the body. #1724 acceptance/`gate:` boxes remain unchecked (coordinator close-gate work, listed as open DoD items in the PR body). | `gh pr view 1779`; `gh issue view 1724` | coordinator: retarget to `main` after the parent stack lands, run acceptance mirror + close-gate before `status:ready-merge`. Not modified by this evaluator. |
| info | F-7 — Remaining non-archival phase-2 owner groups at `fc0a0c8c` (24, none S13-owned): **S1** 7 (`.github/toolchain.env`, `e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml`, `aspire-nuget-cache-policy.test.ts`, `scaffold-versions.ts`, `scaffold-aspire.ts`); **S3** 5 compat fixtures missing `13.5.3` (`teardown/probes_test.ts`, `service-env-evidence_test.ts`, `generated-app-endpoint_test.ts`, `mcp/tests/service-endpoint-source-fixtures.ts`, `telemetry-live-fixture_test.ts`); **S9** 4 (`skills/aspire/SKILL.md`, `skills/help.md`, dogfood-bundle `aspire/SKILL.md`, `help.md`); **S11** 2 (`docs/site/explanation/aspire.md`, `deploy-local-aspire.md`); **S1/S4** 2 (`generate-aspire-config_test.ts`, `generators-tools-db-index_test.ts`); **derived** 2 (`embedded.generated.ts`, `skills.generated.ts`); **S4/S6** 1 (`_aspire-compat.ts.template`); **S4/S5/S6/S8** 1 (`generate-aspire-config.ts`). Info rows 6 (archival). | evaluator phase-2 report `findings` grouped by owner | none; convergence tracking. |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence |
| --------- | ----------- | -------------- | ---------- |
| Generated root-level scripts need their own import-resolution test | When a workspace-root generated file gains a bare `@netscript/*` import, render the root `deno.json` and the file together and assert resolution per import mode; `check:emitted-samples` covers plugin scaffolders only and the local-source E2E masks JSR-mode defects via workspace members. Confirmed by cycle 1 → cycle 2. | Archetype 6 (scaffold generators) | high |
| Gate the import map on the same predicate as the emission | An import-map entry for a generated script must be keyed on exactly the condition that emits the script (`!noAspire` here) and on whether a workspace member already resolves it; otherwise either an orphan mapping or an unmapped import appears. | Archetype 6 | high |
| Report-mode receipts carry `ok:false` on purpose | State "report PASS / ok:false" explicitly and re-run the report at the evaluated head when the receipt head lags; never fold a report-mode receipt into "enforcement green". | harness gates | medium |
| Mirror regeneration of an archival-classed row is not an archival edit | Derived mirrors (`.claude/**`) should be classed `derived` in surface manifests so mechanical syncs do not trip "never edit archival rows". | parity/manifest tooling | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | At exact head `fc0a0c8ccc02ed8f741931de3455e7778df8697d` the ratified D-17 chain with `source` preserved and an injected IO-free domain, the S2-shaped and empty-`[]` fixtures, infrastructure-only process IO, the MCP README precedence line and documented public exports, the telemetry route (env → running AppHost → "dashboard unavailable — run `aspire ps`", no bare `18888`, https fallback restored), conditional Windows `ASPIRE_DASHBOARD_PORT`, consumer CI install-before-restore with `{{ASPIRE_SDK}}` from `SCAFFOLD_VERSIONS`, the `≥ 13.4` wording, `SCAFFOLD_COMMUNITY_TOOLKIT` removal, `aspire agent mcp` ownership, regenerated carriers and fresh manifest, parity phases 1 and 2 (phase 1 default, report mode, fixed `13.5.3` compat rule, archival/lockfile/stale/unmatched handling, tests), `ci.yml` unflipped, and every listed static/doctrine gate are independently verified green. Cycle-1 F-1 is fixed and proven by generator tests plus an evaluator render (`deno check` exit 0 in local non-member mode; correct JSR mapping); F-2 is fixed; F-3/F-4/F-6 are validly dispositioned in `drift.md`. No forbidden scope or technique was found (no `docs/site` prose, skill behaviour text, version pins, archival content edits, resource emission, runtime, `any`, unsafe casts, or lint ignores). Remaining findings are info/low bookkeeping items for the coordinator. **Phase A is complete; S13 has no Phase B.** |
| Parity flip | **Deferred, correctly.** `.github/workflows/ci.yml` contains no `aspire-version-parity` reference and is not in the diff; `parsePhase([]) → 1` with a test locking it; `origin/main` `24f6642f` still pins `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.6` / `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.6`, and none of `chore/aspire-13-5-s1-pin-bump` (S1 #1727), `fix/aspire-13-5-s9-skills-mcp-alignment` (S9 #1759), `docs/aspire-13-5-s11-public-docs-refresh` (S11 #1771) is an ancestor of `origin/main` at evaluation time, so the all-three prerequisite is unmet. |
| Not a merge verdict | PASS certifies Phase A of S13 only. Merge still requires the coordinator's D-58 retarget, close-gate on #1724, stack convergence with manifest regeneration and S1/S13 checker reconciliation (drift F-6 entry), canary C publishing MCP + CLI together, and the executed runtime verdict at the merge head. |
| PR hygiene (read-only) | #1779 draft, base `test/aspire-13-5-s10-e2e-gate-upgrades`, head `fc0a0c8c`; labels `type:chore`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:tooling`, `priority:p2`, exactly one `status:impl`; milestone `0.0.7`; body has `Closes #1724`, `Part of #1712`, slice checklist and DoD; seven `[PHASE: IMPL]` comments with commit SHAs (slice 6 comment records the remediation truthfully). #1724 open, `status:impl`, milestone `0.0.7`. Deficiency: `closingIssuesReferences` empty (D-58). Nothing modified. |
| Evaluator non-mutation | Only this file was written. `git status` shows the same pre-existing `M evaluate-prompt.md` and untracked `receipts/` as at start; no commits, pushes, comments, labels, or ready-state changes; freshness gates left the tree unchanged; scratch dirs under `.llm/tmp/s13-eval*` were removed; `aspire ps` `[]` and `docker ps -a` empty throughout. |

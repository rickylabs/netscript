# Worklog: S9 Phase A

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-13-5-s9-skills-mcp-alignment--impl` |
| Branch | `fix/aspire-13-5-s9-skills-mcp-alignment` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` (shipped skill prose only) |

## Design

### Public Surface

- `GATE.AGENT_ASPIRE_MCP_SMOKE` — stable E2E gate identifier.
- `createAspireMcpSmokeGate()` — suite gate definition.
- Injectable MCP transport/session contract — unit-test seam for recorded JSON-RPC fixtures.

### Domain Vocabulary

- `AspireMcpSmokeReceipt` — exact persisted proof schema.
- `AspireMcpTranscriptEntry` — redacted request/response event.
- `AspireMcpTransport` — bounded initialize/list/call/close session behavior.
- `AspireMcpSmokeDependencies` — gate-edge filesystem, command, clock, and transport injection.

### Ports

- Injectable JSON-RPC transport — required to test timeouts, partial receipts, and recorded
  transcripts without starting a live server.
- Gate dependencies — keep filesystem/process IO at the runtime/gate edge.

### Constants

- `AGENT_ASPIRE_MCP_SMOKE = 'agent.aspire-mcp-smoke'`.
- Expected 15-tool set, 13.4.6 14-tool baseline, dashboard-only 3-tool set.
- Lifecycle deadlines: 30s initialize, 10s list, 30s call, 120s whole gate, 10s graceful close,
  5s SIGTERM grace.
- Upstream workflow skills: `aspire-init`, `aspire-orchestration`, `aspire-monitoring`,
  `aspire-deployment`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Lock RED tests and implement the injectable MCP smoke gate, partial receipt, transcript, and both-tier registration | focused E2E wrapper tests + `quality:scan` + `arch:check` | `packages/cli/e2e/**`, run artifacts |
| 2 | Align canonical Aspire skill and agent-init generator contract, then regenerate all derived mirrors/assets/corpora/dogfood | focused init tests + generator checks + acceptance grep | `skills/**`, `packages/cli/src/**`, generated outputs, run artifacts |
| 3 | Close Phase-A static/fitness/consumer gate set and write docs-audit request | full listed Phase-A gates | run receipts/artifacts and any gate-only fixes |

### Deferred Scope

- Phase-B live receipt and dashboard-only observation — requires the supervisor's serialized lease.
- Public docs — S11.

### Contributor Path

Add or amend MCP assertions in the smoke evaluator module, extend the recorded transcript fixture,
then verify ordering in the suite registry test. Update agent prose only in `skills/aspire/SKILL.md`
or the canonical generator source and run the documented generators.

### D-194 Repair Design

- **Public surface:** unchanged; only internal lifecycle command arguments change.
- **Invariant:** `aspire.config.json` belongs to the AppHost workspace and is resolved from the
  AppHost path, while `.netscript/e2e/aspire-start.json` remains rooted in the generated project.
- **Ports/constants:** no new port or domain constant; `@std/path` derives the config path at the
  command-adapter edge.
- **Commit slice:** repair start/restart config identity and add the deterministic lifecycle gate
  regression; prove with focused wrapper tests, scoped wrappers, quality gates, and root check.
- **Deferred:** live runtime proof remains CI/supervisor-owned under the host lease.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | bootstrap | complete | Clean required baseline; contract and skill chain read; no runtime started. |
| 2026-08-30 | 1 | RED | Focused test failed on the intentionally missing MCP smoke module (`TS2307`). |
| 2026-08-30 | 1 | static receipt | One no-AppHost MCP session captured 13.5.3 identity, doctor, and a truthful 14-tool surface; zero-state checks remained clean. |
| 2026-08-30 | 1 | implementation | Added injectable JSON-RPC transport/evaluator, exact semantic receipt and redacted transcript, durable lifecycle wrapper, explicit runtime skip, both-tier suite ordering, and agent-init prerequisite. |
| 2026-08-30 | 1 | delivery | Pushed gate commits `83ae1a43` and `06a0e5e1`; opened stacked draft PR #1759 and posted one implementation trail comment per commit. |
| 2026-08-30 | 2 | skill alignment | Updated the canonical Aspire skill to 13.5.3 evidence, generated `.agents`/`.claude` mirrors and CLI embedded assets, and kept the observed 14-tool mismatch explicit. |
| 2026-08-30 | 2 | agent init | Selected the four non-colliding upstream workflow skills explicitly and proved canonical NetScript `aspire/SKILL.md` remains hash-stable. |
| 2026-08-30 | 2 | corpora | Regenerated CLI assets, MCP export corpus, publish assets, and the consumer dogfood bundle; added a deterministic dogfood check gate. |
| 2026-08-30 | 2 | delivery | Pushed commit `418eb4b9` and posted the required slice-2 implementation comment on draft PR #1759. |
| 2026-08-30 | 3 | acceptance | Added the supervisor-dispatched Codex Sol prose-audit request and reran the complete static, generator, fitness, and focused test set. |
| 2026-08-30 | docs-audit fix 1 | implementation | Applied the opposite-family `AUDIT: FAIL_FIX` findings: narrowed 13.5 certification to tagged claims, bounded S2-V4 telemetry wording, replaced stale timings with S2-V2/V9 values, corrected `healthReports` to object, added exact CLI-help receipts, documented dashboard-only MCP startup, and regenerated every required consumer. |
| 2026-08-30 | IMPL-EVAL fix 1 | implementation | Preserve accumulated MCP observations in failure receipts, leave outer timeout headroom, record structured-log error/count evidence, and add the recorded 14-tool failure regression. SQLite-tier visibility names remain assumed—not proven—and must be explicit Phase-B brief inputs. |
| 2026-08-30 | pre-Phase-B D-45 | implementation | Coordinator-ratified the observed 14-tool set as required; `get_integration_docs` is documented-unobserved INFO, wrapper timeout is 140s, structured-log count is nullable without response-shape evidence, and S2-V9 cites the elapsed-time receipt. |
| 2026-08-30 | hosted dashboard availability | implementation | Hosted proof run `33328972788` established that Aspire 13.5.3 can list the dashboard-backed MCP tools while an isolated headless AppHost returns exact JSON-RPC `-32603` dashboard-unavailable evidence. Added RED-first coverage and a documented degraded receipt outcome without weakening the 14-tool, visibility, redaction, or dashboard-only surface assertions. |
| 2026-08-30 | hosted dashboard availability cycle 2 | implementation | Hosted proof run `33330455111` supplied the full `-32603` message and showed per-tool degradation was the wrong model. Aspire 13.5.3 source at `b5f143315` proves the CLI selects the scaffold's `https` profile; the profile's `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true` prevents `AppHost:DashboardApiKey` generation, while MCP rejects a null API token as dashboard-unavailable. Chose shape A: authenticate only the E2E scratch profile before detached start/restart, keep all MCP calls/assertions mandatory, and annotate the exact error in a failing partial receipt. |
| 2026-08-30 | coordinator classification amendment | implementation | Reclassified only code `-32603` plus the byte-exact hosted 13.5.3 message on dashboard-gated AppHost calls as a documented degradation. Primary and dashboard-only initialize/tools-list surfaces remain mandatory; accumulated visibility/redaction evidence and the degraded tool name persist. Truncated text, a changed suffix, a wrong code, and the exact payload on `doctor` remain hard failures. Static only: no AppHost, runtime, CI dispatch, or evaluator. |
| 2026-08-31 | D-148 un-stack | delivery | Rebased the ten S9 commits onto reconstructed S8 `bc838a0b3`; unioned S8 UI/typed-DB and S9 agent-init/Aspire-MCP registrations; retained each job's three narrow artifact paths plus only its matching MCP receipt path, `include-hidden-files: true`, and 30-day retention. No runtime or evaluator was started. |
| 2026-08-31 | D-194 repair | RED | Added `Aspire lifecycle gates bind aspire.config.json to the AppHost workspace`; the structured test wrapper exited 1 because the start command supplied no AppHost-local config argument. |
| 2026-08-31 | D-194 repair | implementation | Passed the config path derived from `dirname(appHost)` into initial start and restart fallback, shifted the typed database argument without changing its value, and kept absent/malformed config fail-closed. No runtime resource was started. |
| 2026-08-31 | D-213 convergence | rebase | Replayed exactly 12 S9 commits from `bc838a0b3..29eed9ef9` onto converged S8 `d1c6d8b54`; resolved three conflicts only in `skills.generated.ts` by taking upstream/S8. No non-generated or listener-contract conflict occurred. |
| 2026-08-31 | D-213 convergence | evidence | Regenerated the assets barrel, committed the one generated delta as `55791043e`, proved 23/23 non-generated package blobs identical, and completed the required non-runtime gates. |
| 2026-09-02 | authenticated telemetry | RED | Added the realistic `list_traces` adapter regression; the structured test wrapper exited 1 because `createAspireMcpTelemetryQuery` did not exist on the raw-HTTP adapter. |
| 2026-09-02 | authenticated telemetry | implementation | Routed the shared `TelemetryQueryPort` through short-lived `aspire agent mcp` stdio calls, normalized MCP trace/log projections, folded Flow-B producer identity onto the shared adapter, and removed the remaining raw Dashboard readers. Anonymous mode remains false in the runtime start script. |
| 2026-09-02 | authenticated telemetry | static evidence | Focused adapter test passed 2/2; affected consumer/registry tests passed 73/73; requested `packages/cli/e2e/tests/` passed 241/241; 6-file check/lint/fmt and repository quality gate passed. No runtime or workflow command ran. |
| 2026-09-02 | authenticated telemetry co-author audit | RED/GREEN | Audited live PR head `712776baf`: pre-adapter parent `e72da5161` failed the structured wrapper because the MCP adapter export was absent; the live adapter passed 2/2 while explicit 401 and HTTP-200/empty raw Dashboard fakes each recorded zero reads. One-file structured check/lint/fmt also passed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Inherit external Plan-Gate | Supervisor already ran two separate PLAN-EVAL cycles and dispatched this exact contract | supervisor plan + owner prompt |
| JSR publish audit is N/A for the new gate | `packages/cli/e2e` is unpublished and the gate is not exported by `@netscript/cli` | `packages/cli/e2e/deno.json` / `mod.ts` |
| Cycle-2 shape A: secure the E2E scratch dashboard | The launch profile is selected, but its anonymous mode suppresses the dashboard API key required by Aspire MCP; changing the scratch config exercises the real call contract without changing product scaffold output | `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts`; Aspire `v13.5.3` `GuestAppHostProject.cs`, `DistributedApplicationBuilder.cs`, `DashboardUrlsHelper.cs`, `McpToolHelpers.cs`; hosted run `33330455111` |
| Coordinator amendment: exact payload on dashboard-gated calls is documented degradation | Hosted CI still proves the headless condition; the ratified correction supersedes the earlier shape choice. Matching is fail-closed by tool, code, and full message. | coordinator steering after cycle 2; hosted run `33330455111` |
| D-148 selective workflow union | The broad report globs belonged to S9's obsolete base and would restore D-112's `.data` traversal regression. Keep S8's narrow paths, add only the two S9 MCP receipt paths and retention. | coordinator D-148 ruling |
| Authenticate telemetry through stdio MCP | Anonymous mode must remain false for Aspire MCP, while raw Dashboard HTTP has no credential. Reuse the existing transport and preserve the package-owned query port rather than changing the three consumers' call shape. | owner dispatch; hosted run `33592084708` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `rtk` unavailable on host | minor | yes |
| 13.5.3 static MCP lacks locked `get_integration_docs` | significant | yes |
| First scoped-check wrapper flag was redundant/invalid | minor | yes |
| Requested AGENTS guidance authority moved to a template generator source | minor | yes |
| HTTPS credential lacked workflow scope for the workflow-only commit | minor | yes |
| Final host inventory contained foreign S5 runtime resources under `007-aspire-s5-conv`; S9 did not start, inspect beyond ownership, or mutate them | external | no — not S9 drift |
| Aspire 13.5.3 MCP trace/log JSON is a lossy AI projection rather than raw OTLP (no log timestamp; no span-event or link-attribute fields in upstream projection) | significant | yes |

## Gate Results

| Gate | Result | Notes |
| --- | --- | --- |
| Focused MCP + suite registry tests | PASS | 25 passed, 0 failed |
| Scoped Deno check | PASS | 11 files, 0 diagnostics; wrapper supplied `--unstable-kv` |
| Explicit runtime-absent path | SKIPPED as designed | durable lifecycle receipt contains the concrete missing `aspire-start.json` reason |
| `quality:scan` | PASS | zero findings |
| `arch:check` | PASS | exit 0; pre-existing repository warnings only |
| Focused agent-init tests | PASS | 23 passed, 0 failed; includes explicit skill selection and canonical hash preservation |
| Slice-2 scoped check | PASS | 8 touched TypeScript inputs, zero diagnostics |
| Slice-2 raw lint/fmt | PASS | 9 config-excluded files; repo single-quote/100-column formatting options used |
| Slice-2 `quality:scan` | PASS | zero findings |
| Slice-2 `arch:check` | PASS | exit 0; pre-existing repository warnings only |
| Dogfood generation/check | PASS | exact Aspire MCP entry, four workflow skills, relative local paths, and no stale CLI 0.0.2 pin |
| Final focused tests | PASS | 48 passed, 0 failed across MCP smoke, suite registry, and agent-init contracts |
| Final scoped check | PASS | 11 files across MCP gate and agent-init roots, zero diagnostics |
| `13.4.6` active-surface grep | PASS | zero hits in the required active skill/mirror/embedded roots; no archival rows edited |
| Final generated-surface checks | PASS | assets barrel, Claude sync/validation, MCP corpus, and publish assets reproduce cleanly |
| Final `quality:scan` / `arch:check` | PASS | zero quality findings; doctrine exit 0 with pre-existing warnings only |
| Static MCP expected delta | BLOCKED | observed 14 baseline tools and no `get_integration_docs`; truthful receipt cannot prove locked `+get_integration_docs` |
| Docs-audit fix cycle 1 | IMPLEMENTED | one prose/regeneration slice; independent re-audit remains supervisor-owned |
| Hosted dashboard RED/GREEN | PASS | Run `33328972788` exact `-32603` fixture failed before implementation; final focused suite passed 12/12, including non-dashboard and different-error rejection guards. |
| Hosted dashboard scoped check/lint/fmt | PASS | Check covered 187 TypeScript files; lint/fmt covered 180 with zero findings after excluding the unrelated standalone `desktop-native` fixture whose detached config cannot resolve the root `zod` catalog. |
| Hosted dashboard fitness gates | PASS | `quality:scan` reported zero findings; `arch:check` exited 0 with pre-existing repository warnings only. |
| Hosted dashboard cycle-2 RED/GREEN | PASS | Exact run `33330455111` `list_resources` error plus authenticated-start assertions failed 2/32 before implementation; final MCP/runtime-builder suites passed 32/32. |
| Hosted dashboard cycle-2 scoped gates | PASS | Check covered 187 TypeScript files; lint/fmt covered 180 with zero findings under the recorded standalone-fixture exclusion; `quality:scan` and `arch:check` passed. |
| Exact-payload amendment RED/GREEN | PASS | The two exact dashboard-backed success cases failed before implementation; final focused suite passed 16/16, including required truncated-message, changed-suffix, wrong-code, and non-dashboard-tool negatives. |
| Exact-payload amendment scoped gates | PASS | Check covered 187 TypeScript files; lint/fmt covered 180 files with zero findings under the existing `desktop-native` fixture exclusion. |
| Exact-payload amendment fitness gates | PASS | `quality:scan` reported zero findings; `arch:check` exited 0 with pre-existing repository warnings only. |
| Exact-payload amendment resource ownership | PASS (S9) | S9 started no AppHost/container. Read-only inventory found a foreign S5 AppHost at `007-aspire-s5-conv/.llm/tmp/s5-concurrent/**` and five S5-named containers; left untouched. |
| D-148 asset barrel generation/check | PASS | `gen:assets-barrel` exit 0; `check:assets-barrel` exit 0; working-tree diff remained empty. |
| D-148 stacked ancestry | PASS | `git merge-base HEAD bc838a0b3` equals full S8 head; old S5 `56bf42556`, S6 `9f97954b6`, S8 `f23954658`, and old head `9dd06647` are not ancestors. |
| D-148 range-diff | PASS | All ten S9 commits map in order; only ruled union commits 1/2 and generated-corpus commit 3 differ, while commits 4–10 are patch-identical. |
| D-148 workflow safety | PASS | Each runtime job retains narrow JSON/NDJSON/listener paths, adds one matching `agent.aspire-mcp-smoke*` path, keeps `include-hidden-files: true` and `retention-days: 30`; no `.llm/tmp/**` glob exists. |
| D-148 scoped check | PASS | Structured wrapper exit 0; 24 changed non-generated TypeScript files, 1 batch, `failedBatches: 0`. |
| D-148 scoped lint/fmt | PASS | Authoritative no-exclude rules-preserving config runs each covered all 24 files with no dropped files or findings. Initial root-config runs exited 2 as honest coverage refusals and are non-verdicts; temporary config was removed. |
| D-148 repo-wide check | PASS | Exit 0; 2,981 files, 25 batches, `failedBatches: 0`, zero diagnostics. |
| D-148 focused registry/suite tests | PASS | Structured test wrapper exit 0; 60 passed, 0 failed across suite registry, runtime gates, UI data-screen registration, and Aspire MCP smoke. |
| D-148 Aspire version parity | PASS | Exit 0; checked 812 manifest entries and reported `fail: 0`. |
| D-148 quality gate | PASS | Exit 0; repository quality scan had zero findings and doctrine reported `FAIL=0` with pre-existing warnings only. |
| D-148 runtime/evaluator | NOT RUN by ruling | No Aspire/Docker/runtime command, PLAN-EVAL, or evaluator rerun was dispatched. |
| D-194 regression RED | EXPECTED FAIL | Structured test wrapper exit 1; expected AppHost-local config path, actual `undefined`. |
| D-194 focused runtime-gates test | PASS | Structured test wrapper exit 0; 23 passed, 0 failed. |
| D-194 scoped check | PASS | Exit 0; 3 changed TypeScript files, 1 batch, `failedBatches: 0`; wrapper invoked `deno check --unstable-kv`. |
| D-194 scoped lint | PASS | Exit 0; 3 selected/processed files, zero dropped files or findings. |
| D-194 scoped fmt | PASS | Exit 0; 3 selected/processed files, zero findings. |
| D-194 focused gate tests | PASS | Exit 0; 43 passed, 0 failed across runtime lifecycle and suite registry tests. |
| D-194 quality gate | PASS | Exit 0; code-quality scan had zero findings and doctrine reported `FAIL=0` with pre-existing warnings only. |
| D-194 repo-wide check | PASS | Exit 0; 2,981 files, 25 batches, `failedBatches: 0`, zero diagnostics. |
| D-213 asset barrel | PASS | Explicit generation exit 0 produced a 3-add/3-delete `skills.generated.ts` delta; the first check honestly exited 1 before the delta commit; post-commit reproducibility check exited 0. |
| D-213 stacked ancestry | PASS | `git merge-base HEAD d1c6d8b54` returned `d1c6d8b54fdb02f4d913f0c269aea2be4a5dfce0`, exit 0. |
| D-213 range-diff | PASS WITH EXPLAINED GENERATED DELTA | 9 of 12 map `=`; commits 3, 5, and 7 map `!` only because their generated `skills.generated.ts` conflict took upstream. Separate `55791043e` deterministically regenerates the aggregate barrel. |
| D-213 blob identity | PASS | All 23 changed non-generated files under `packages/` have identical old/new blob hashes; 0 changed. Full table is in `d213-converge-onto-s8.md`. |
| D-213 scoped check | PASS | Exact changed-file structured wrapper exit 0; 21 files, `deno check --unstable-kv`, one batch, zero diagnostics. The initial 206-file broad attempt exited 1 on an ambient `Timeout` interaction and is a recorded non-verdict. |
| D-213 scoped lint/fmt | PASS | Exact changed-file wrapper runs each processed 21/21 with zero findings under a temporary rules-preserving no-exclude config, then removed it. Initial root-config runs exited 2 on honest coverage refusal. |
| D-213 focused tests | PASS | Structured wrapper exit 0; 82 passed, 0 failed across runtime-gates, Aspire MCP smoke, suite registry, and agent-init suites. |
| D-213 Aspire version parity | PASS | Exit 0; phase 1 checked 812 entries and reported `fail=0`. |
| D-213 quality gate | PASS | Exit 0; code-quality scan clean and doctrine `FAIL=0` with pre-existing warnings only. |
| D-213 runtime/evaluator | NOT RUN by ruling | No Aspire, Docker, AppHost, `e2e:cli`, PLAN-EVAL, or IMPL-EVAL command was run. |
| Authenticated telemetry RED | EXPECTED FAIL | Structured adapter test wrapper exit 1; planned `createAspireMcpTelemetryQuery` export was absent from the raw-HTTP adapter. |
| Authenticated telemetry focused GREEN | PASS | Structured wrapper exit 0; 2 passed, 0 failed against realistic Aspire 13.5.3 trace/log tool text, including Flow-B identity and trace-scoped log routing. |
| Authenticated telemetry affected tests | PASS | Structured wrapper exit 0; 73 passed, 0 failed across telemetry, MCP smoke, producer reconnect, Flow-B validation, suite registry, and runtime-gate tests. |
| Authenticated telemetry requested suite | PASS | Exact `deno test --allow-all packages/cli/e2e/tests/` through the structured wrapper: 241 passed, 0 failed. |
| Authenticated telemetry scoped check | PASS | 6 changed TypeScript files; `deno check --unstable-kv`; 1 batch, 0 failed batches, 0 diagnostics. |
| Authenticated telemetry scoped lint/fmt | PASS | Rules-preserving no-exclude config processed 6/6 files; lint and `fmt --check` each exited 0 with zero findings. Temporary config removed after evidence capture. |
| Authenticated telemetry quality gate | PASS | `deno task quality:gate` exit 0; quality scan had zero findings and doctrine reported `FAIL=0` with pre-existing warnings only. |
| Authenticated telemetry runtime/workflows/evaluator | NOT RUN by ruling | No Aspire, AppHost, Docker, hosted tier, `e2e:cli`, workflow mutation, or evaluator dispatch occurred. |
| Authenticated telemetry co-author RED | EXPECTED FAIL | Detached pre-adapter parent `e72da5161`; structured wrapper exit 1 with TS2724 because `createAspireMcpTelemetryQuery` did not exist. Temporary worktree removed after capture. |
| Authenticated telemetry co-author GREEN | PASS | Structured wrapper exit 0; 2 passed, 0 failed. The 401 and HTTP-200/empty Dashboard fakes each recorded zero reads while MCP trace/log calls returned normalized evidence. |
| Authenticated telemetry co-author scoped check/lint/fmt | PASS | One selected/processed test file; `deno check --unstable-kv`, lint, and `fmt --check` each exited 0 with zero diagnostics/findings. |

## Handoff Notes

- Supervisor/evaluator should inspect lifecycle cleanup, partial receipt persistence, redaction, and
  explicit skip registration before generated prose.
- The external docs audit request is `docs-audit-request.md`; this implementation session did not
  dispatch or self-certify it.
- Phase A is pushed and locally green except for the upstream static MCP acceptance mismatch recorded
  in `drift.md` and `receipts/aspire-13.5.3-mcp-tools-static.json`.
- Cycle-1 help captures are non-runtime CLI reads; pre/post Aspire and Docker inventories stayed empty.
- D-148's rewritten implementation head before this evidence commit is `0c4d9990a`; the final
  delivery commit and lease-safe push are recorded by the PR commit list and delivery comment.
- D-194 leaves the config read fail-closed: a genuinely absent AppHost-local config still throws
  from `Deno.readTextFile`; no creation, catch, fallback, or sqlite exclusion was added.
- D-194 IMPL-EVAL is supervisor-dispatched after the pushed bytes change; this session does not
  request, dispatch, or perform it.
- D-213 is convergence, not repair: the existing Postgres `database.seed` result was not chased and
  no product behavior changed. The 23/23 non-generated blob identity result is the carry-forward
  evidence for the supervisor's evaluator decision.
- **Post-slice reconcile:** PR #1759 remains the delivery surface on the same branch and base; no
  labels, lifecycle state, issue state, or PR base were changed. The supervisor owns the next
  evaluation transition.
- The Aspire 13.5.3 MCP projection does not carry every raw OTLP field; static tests prove the
  adapter's declared projection mapping, but only the held hosted tiers can establish the complete
  Flow-B/reconnect runtime verdict after this transport change.
- Owner ruling now makes `.agents/skills/**` authoritative and replaces `.claude/skills/**` with one
  bridge. That global bridge/sync-tool repair is separately coordinated; this co-author slice did
  not edit any skill, bridge, generated asset, workflow, or sync-tool file.

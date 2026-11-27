# Evaluation of the Aspire 17.0.0 upgrade

**FAIL_FIX.** The hosted scaffold passes on both database tiers. The generated Deno permission adapter drops explicit denials in a supported configuration, the release-train bumper fails on the real workflows, and the consumer migration guide leaves the old SDK in place. The evidence for closing #2259 also falls short of the approved plan.

## Metadata

| Field | Value |
| --- | --- |
| Run | `epic-aspire-17-upgrade--2278`, IMPL-EVAL round 1, 2026-11-27 |
| Target | [PR #2693](https://github.com/rickylabs/netscript/pull/2693), branch `epic/aspire-17-upgrade`, evaluated local HEAD `147cb11a989359f4c25d9706563f48d14e0de673` |
| Archetypes and overlays | A6 CLI/tooling, supporting A2 Aspire/MCP integrations, service and docs overlays |
| Evaluator | Owner-selected feature tier. Requested and observed Codex / GPT-6.2 Astra / xhigh, session `01a21e38-55a6-76f0-bcd7-d44231d9b5ff`. Independent of Antigravity/Gemini implementation. First route used. |
| Provenance | GitHub checked out `d85ffd325250d6886a66d074112a5ed3293cad8f`, a test merge of PR head `d8fbcbbf7012eb8aa115fe784659764d7ac877a5` into `7eecfe51f9fadcae79927ebd69898003dcdd27ab`. Its Git tree and the PR head's tree both equal `9c610677dff31fb1a6d3b4e0f758b573ae441b69`. |
| Local delta | `git diff --exit-code d8fbcbbf7..147cb11a9 -- ':!.llm/'` exited 0. The full delta is four run files and the debt registry. No workflow, gate implementation, fixture or shipped file changed above the tested tree. |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan approval before implementation | PASS | Both independent PLAN-EVAL rounds recorded `FAIL_PLAN`. The owner directly approved the seven corrections at `36f896a64` before S1 at `452a24f80`, as recorded in the worklog and evaluation brief. Record this as owner approval when updating the PR checklist. |
| Design checkpoint and evaluator brief | PASS | `worklog.md` contains Design and the review-chain override. The evaluation brief includes the required SKILL chapter. |
| Slice order and review trail | FAIL | Git history follows S1 through S6. The PR conversation has three plan/plan-eval comments and no implementation slice reviews. S3a changed 28 files and S5b's generated-bundle commit changed 29 against plan §5's limit of 25. Record the historical deviations and link any actual review evidence. |
| Each slice still meets its gate | FAIL | S1's real-tree bumper fails after the S5 cache relocation. S3's permission contract and S5's migration instructions have regressions. S6's Studio and dashboard evidence is incomplete. |
| Reachable seams and finite vocabularies | PASS | Traced the generated readiness helpers, cache renderer, permission adapter, DB refresh and bumper through their call sites. Recovery has explicit startable and transitioning states. |
| Merge close-gate | FAIL | The hosted check returned failure. Mirroring was deliberately deferred while implementing. PR head was mergeable, zero behind and had zero unresolved threads. Findings below independently preclude ready-merge. |

## Static Gates

Commands below ran locally with Deno 2.9.8 unless a hosted job is named. Status reflects command exit, including gates whose result differs from the worklog.

| Gate | Result | Evidence |
| --- | --- | --- |
| Narrow and slice typecheck | PASS | Hosted `check-test-shard (check)` and all six test shards plus browser shard passed. Local `check:emitted-samples` checked 48 samples. `check:streams-types` and real-SDK generated-helper compile tests passed. |
| Lint and format | PASS | `quality:cli` processed 1,297 lint and 1,179 format files with zero findings. Hosted `quality` passed. |
| Version, ports and dependencies | PASS | Both phases of `check:aspire-version-parity` exited 0 with fresh manifest. `check:scaffold-versions`, `check:aspire-host-ports`, `deps:check`, `check:netscript-jsr-specifiers` and `check:scaffold-provider-boundary` exited 0. |
| Pin maintenance command | FAIL | `deno task aspire:bump --offline` exits 1 looking for the install step in `.github/workflows/e2e-cli.yml`. The documented `deno task aspire:bump -- --dry-run` also exits 1 on the argument separator. |
| Generated carriers | PASS | `check:assets-barrel`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets` and `maint:dogfood-skills:check` all exited 0. |
| Doc lint | FAIL | Individual `doc:lint --root packages/<name>` calls passed for CLI and MCP. Aspire exited 1. Its combined scan reports zero, but adapters/application/public/testing subpath scans report 2/9/36/2 private-type references. The Aspire package and wrapper blobs are unchanged from the integrated baseline. |
| Workspace publish dry-run | PASS | `publish:dry-run` exited 0. |
| JSR audit | FAIL | `audit-jsr-package.ts --root packages/<name>` passed for CLI/MCP. Aspire exited 1 on the four pre-existing missing module tags. These are separate from the private-type findings. |
| Links and docs accuracy | PASS | `docs:links` found zero broken links, anchors or orphans in 105 docs. `docs:accuracy` passed. See the separate migration finding. |
| README standard | FAIL | `docs:readme:check` exited 1 on the unchanged `packages/bench/README.md` Install section. |
| Focused tests | PASS | `deno test --frozen --allow-all --unstable-kv` over native member generation, legacy preflight, manifest reconciliation, all Aspire helper tests, refresh recovery, credential/MCP/live-endpoint gates, parity, fixture and cache policy, and bumper tests. 211 passed, 286 steps, 0 failed, 3 ignored. Bumper unit tests seed synthetic workflows with the retired installation path. A second invocation covered agent initialization/Claude mirrors, Aspire generation/inspection, the DB operation runner and canary workflow tests. It passed 80 tests and 16 steps. Combined local total was 291 passed, 302 steps, zero failed and 3 ignored. |

## Fitness Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| F-1 file size | FAIL | Compat/TCP-RESP/Postgres templates are 347/343/183 lines. Infrastructure/cache renderers are 425/215. The changed DB operation runner grew from 497 to 528 and live endpoint verifier from 623 to 719. Doctrine §05 calls for a refactor justification on the PR for files over 500 lines. |
| F-2 through F-4 | PASS | `quality:gate` and scaffold-provider boundary passed. Generated helpers now consume the existing Aspire subpaths. The code adds no inheritance family. |
| F-5 public surface | PASS | `packages/aspire` Git tree is identical on both commits compared against main. The native workspace and external-local subpath consumer compile tests passed. |
| F-6 publishability | PASS | Workspace publish dry-run exited 0. |
| F-7 package documentation | FAIL | See the per-package JSR audit and per-entrypoint doc-lint exits above. |
| F-8 workspace libs | PASS | Typecheck and emitted samples passed. |
| F-9 permissions | FAIL | Explicit deny flags are lost in the generated resource adapter. |
| F-10 test shape | FAIL | Studio connectivity and dashboard environment masking can both be reported successful without observing the required behavior. |
| F-11 through F-15 | PASS | Architecture/quality scan exited 0. Hosted runtime exercised background consumers, sagas and telemetry. Existing Aspire exports are reused. |
| F-16 folder cardinality | DEBT_ACCEPTED | Immediate children remained 19→19 in `kernel/adapters` and 94→94 in `e2e/src/application/gates/scaffold`. Existing debt is `cli-showcase-cardinality-2571`. |
| F-17 through F-19 | PASS | No new abstract family or public sub-barrel. CLI quality wrappers and the hosted check shard passed. |

## Runtime Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Hosted static scaffold | PASS | Service 8/8, contracts 5/5, plugins 18/18, zero skips. Artifact `15207524215`. [Static job](https://github.com/rickylabs/netscript/actions/runs/46021010832/job/140580932643) |
| Hosted Postgres and Docker | PASS | `RUN=true`, runtime 124/124, zero skips. Credential acceptance/rejection, listener failure, MCP smoke, typed DB operations, live users CRUD/telemetry and cleanup ran. Artifact `15212385898`. [Postgres job](https://github.com/rickylabs/netscript/actions/runs/46021010832/job/140580933133) |
| Hosted SQLite and Garnet | PASS | `RUN=true`, runtime 115/115 and showcase 7/7, zero skips, browser step succeeded. Artifact `15212285448`. [SQLite job](https://github.com/rickylabs/netscript/actions/runs/46021010832/job/140580933172) |
| Desktop | PASS | Native Linux job succeeded. [Desktop job](https://github.com/rickylabs/netscript/actions/runs/46021010832/job/140580932620) |
| Lifecycle | PASS | Generated tool monitor registers `onResourceStopped`. The long-lived Studio resource survived the hosted suite. Exit-16 recovery requires the stop-failure diagnostic, rechecks unique executable identity, refuses unknown states, and uses the original combined abort signal before start and health wait. Focused tests passed. |
| Local runtime and cleanup | N/A | Hosted jobs supply the Docker evidence. The retained local leak report found no proven worktree-owned survivors, with process and Aspire probes available and Docker probes unavailable. |

## Consumer Gates

| Target | Result | Disposition |
| --- | --- | --- |
| #319 native AppHost | PASS | Fresh scaffolds emit the workspace member and native imports. Command-entry tests verify refusal with zero mutations for both legacy manifest shapes. The two hosted tiers restore and start. The migration guide for existing workspaces still needs correction. |
| #320 first-party Deno hosting | FAIL | Services, plugins, background processors and task apps use `addDenoApp`. Default telemetry is endpoint-conditional, web CORS uses awaited `BrowserOrigins`, and the runtime suites pass. Granular permission composability still regresses. Hold closure. |
| #295 dogfood evidence | PASS | Both S6 runtime receipts substantiate the dogfood run. The issue owner identifies #295 as the umbrella for #319 and #320. Change the PR's closing keyword to a reference and close manually after the children are complete, per the repository's umbrella rule. [Owner's issue comment](https://github.com/rickylabs/netscript/issues/295#issuecomment-4871769509) |
| #2174 empty helpers | PASS | `empty-registration_test.ts` runs Deno lint on the emitted helpers and checks empty Map, void, false, infrastructure context and populated-sibling CORS contracts. |
| #2202 foreign Docker loopback | PASS | Container-backed TCP and RESP paths emit `FOREIGN_DOCKER_LOOPBACK` after the threshold. Stubbed tests cover remote and local cases. The additional CLI diagnostic has a scope defect below. |
| #2259 secret masking and consumer connections | FAIL | Whole raw describe is scanned before parsing at `verify-credential-rejection.ts:68`. Both processes are present with redacted fields, and users CRUD succeeds. Studio DB access and dashboard resource-detail masking still need positive observations. Hold closure. |
| Part of #2278, Refs #1726 and #2184 | PASS | Keep all three reference-only. Canary/published-consumer proof follows this PR. PostgreSQL has credential readiness. MySQL/MSSQL credential classifiers and live wrong-password coverage remain separate. Container DBs gained REPL support and MSSQL gained atomic password provisioning. |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-1 | VIOLATION | The locked helper splits pass. Additional file growth crosses or deepens the file-size review threshold without a PR justification. |
| AP-2, AP-9, AP-14, AP-15, AP-16, AP-22, AP-26 | CLEAR | Reviewed the helper split, generated imports, published carrier checks, new paths and subpath use. |
| AP-10, AP-11, AP-12, AP-13, AP-25 | CLEAR | Lifecycle and Docker I/O are in adapters or generated host code. Generated service handlers gained no timers or error swallowing. |
| AP-18 | CLEAR | Real-SDK compile fixtures and behavioral assertions exercise the emitted code. |
| AP-19 | VIOLATION | Deny permissions disappear when blanket allow is present. |
| AP-21 | DEBT_ACCEPTED | The two monitored directories retain their baseline cardinality. |
| AP-3–8, AP-17, AP-20, AP-23, AP-24 | N/A | The slices introduce no corresponding interface/base-class family, workspace lib override, command composition root or new registry axis. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New registry entries | 0 | Existing CommunityToolkit, npm-island and Browsers rows were revised. |
| Resolved registry entries | 2 | Native AppHost replaces the npm island. First-party hosting and direct imports supersede the CommunityToolkit/D-7 work. D-7 is included in the first-party row. |
| Deepened size findings | 2 existing large files | Live endpoint verification grew 623→719 and plugin install 824→826. The latter adds the required preflight. |
| Unrecorded behavioral violation | 1 | AP-19 generated permission loss requires a product fix. |
| New size threshold crossing | 1 | DB operation runner 497→528. Record a split or review justification. Browsers preview remains accepted with its stable-17.x exit criterion. |
| Incorrect debt rationale | 1 | `arch-debt.md:214` describes SQLite as `addConnectionString`. The generator at `generate-register-infrastructure.ts:105` uses a non-secret file-path parameter. The external arm uses `addConnectionString`. Correct the resolved row. |

## Findings

| Severity | Finding and required action |
| --- | --- |
| High | **Preserve explicit Deno denials.** In `_aspire-compat.ts.template:130–134`, the blanket-allow branch skips the deny map for services, plugins and background resources. The previous generator passed the original permission vector through. Deno 2.9.8 reports read permission as denied for a blanket grant combined with a read denial. Preserve that effective permission through the generated host and add a regression covering the combination. |
| High | **Fix the bumper on the checked-in files.** `aspire-bump.ts:214` matches the old `.aspire/bin` path. All three workflows install into `.dotnet/aspire-cli`. The loop writes earlier files before validating later transforms, so a changed-target apply can leave a split train. Validate the full candidate before writes, test a real-workflow snapshot and failure leaving the tree untouched, and align the skill invocation with the CLI. Its online resolver also takes the minimum of the per-package maxima instead of the highest member of the intersection, and its Browsers fallback can select a different major. Validate membership for all seven packages before proposing an online train. |
| High | **Finish the 0.0.9 migration procedure.** The guide's step 2 removes the Node island and regenerates helpers, but never updates `aspire/aspire.config.json`. `renderAspireSurface` generates helper files, while initial scaffolding separately writes SDK and package configuration. The old file still selects 13.5.3 and omits `Aspire.Hosting.JavaScript`. Supply the SDK/integration edits, preserve existing root members and `raw-imports`, and verify the published instructions against a legacy workspace through restore and typecheck. |
| High | **Prove #2259 on the named surfaces.** `verify-credential-rejection.ts:199–244` checks the Studio wrapper environment, absence of an error file and secret-free log bytes. A correct-looking environment does not exercise a query. The dashboard reader scans telemetry resources/logs and accepts any secret-free HTTP 200 body. The 17.0.0 telemetry resources fixture carries names and telemetry flags, and the unit test accepts an unrelated object. Exercise a read through Studio, and observe the masked connection fields in the actual dashboard resource detail or its backing projection. Require target identity and expected fields, keep the raw scan, and make a missing target fail. Also withhold the raw Studio error-file payload currently interpolated at line 210 so a child diagnostic cannot expose credentials in CI. |
| Medium | **Scope the CLI foreign-daemon diagnostic.** `operation-runner.ts:320` checks every non-SQLite timeout. The resolver drops the configured database mode. An external Postgres service can be blamed on the unrelated Docker context. Preserve evidence of container backing and the relevant endpoint before adding the diagnosis. Test an external database timeout with a remote context. |
| Medium | **Repair the evidence record.** Correct the Aspire doc-lint exit, the SQLite debt explanation, the #295 keyword, the missing slice review trail and the file-size justifications. The hosted CI workflow concluded failure on the deliberately deferred close-gate, and `deps-report` was skipped. Quality, all eight shards and core lane visibility passed. The unchanged README and Aspire doc/JSR findings need an explicit baseline disposition if retained. [CI run](https://github.com/rickylabs/netscript/actions/runs/46021010611) |
| Low | **Exercise actual concurrent password creation.** The new helper uses an exclusive temp file, hard-link publication and cleanup. Its test at `aspire-compat-tool-manifest_test.ts:194` queues synchronous calls on one JS thread. Use independent workers or processes to exercise the planned first-creator race. |

## Lessons for Promotion

| Lesson | Applies to | Confidence |
| --- | --- | --- |
| Run an allowlisted migration tool in dry-run mode against the real repository after later slices change its inputs. Synthetic copies can stay green after production syntax changes. | CLI/tooling upgrades | High |
| Match a runtime acceptance claim to the component that must perform the operation. A process environment establishes credential delivery. A successful Studio read establishes database use. | Service and integration gates | High |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **FAIL_FIX** |
| Rationale | The approved plan is implementable. Product and migration fixes and stronger #2259 evidence are required. Keep the PR in implementation and bring the corrected candidate and its hosted runtime receipts back for independent re-evaluation. |

---

## Round 2 — independent IMPL-EVAL, 2026-11-27

**FAIL_FIX** on `c312e2beba95e36e7ed4e9089e672a19911ca83f`. Two Round-1 fixes remain incomplete. The documented migration leaves the released workspace's check command pointing at a deleted compiler. The pin bumper accepts incompatible SDK and Browsers trains through explicit and offline inputs. Both hosted runtime tiers passed on the candidate tree.

### Metadata and process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Evaluator | PASS | Feature tier, cycle 2. Requested and observed Codex / GPT-6.2 Astra / xhigh, independent session `01a21e8b-986f-74b1-8199-76fe1c8a2bd1`, first route. Generator was Antigravity/Gemini. A6 CLI/tooling and A2 integration, with docs and service overlays. |
| Plan and design | PASS | Both PLAN-EVAL records say `FAIL_PLAN`. The owner approved the seven corrections at `36f896a64`, an ancestor of S1 at `452a24f80`. The worklog contains the design checkpoint and the S1–S6 evidence. |
| Checkout and CI provenance | PASS | Initial raw Git status was clean. The local and PR heads both equaled the full SHA above. The Postgres job checked out GitHub test merge `6b7ecae249c13dbf5eaf80d233f9bb9737a3f3a3` over `7eecfe51f9fadcae79927ebd69898003dcdd27ab`. Its tree and the candidate tree both equal `155d42e62460c37e222fc1dc4fe86e19e8da00d2`. [Postgres job](https://github.com/rickylabs/netscript/actions/runs/46053272427/job/140689861659) |
| Implementation review trail | PASS | The PR carries a consolidated remediation comment. Git confirms S3a changed 28 files at `f0e762124`. The 29-file S5b commit was `b8e900f77` (S5b-2c). The worklog cites `c527abb3a`, which changed 12 files (S5b-2e). The comment establishes the remediation review, while contemporaneous per-slice PR reviews remain unverified. [Implementation comment](https://github.com/rickylabs/netscript/pull/2693#issuecomment-7226055490) |
| Close-gate | FAIL | PR was mergeable, zero behind, `status:implementing`, milestone unset. The review-thread gate returned zero threads and zero unanswered. Across 34 check runs, 26 succeeded, seven skipped and only `close-gate` failed. Acceptance mirroring, milestone `0.0.10`, ready-merge and close-gate rerun remain with the coordinator after a passing evaluation. [PR](https://github.com/rickylabs/netscript/pull/2693) |

### Static and fitness gates

All local results below are raw exit codes with Deno 2.9.8. Runtime receipts are identified separately.

| Gate | Result | Independent evidence |
| --- | --- | --- |
| Version parity and current pins | PASS | `deno task check:aspire-version-parity`, default and `--phase 2`, each checked 1,053 surfaces with a fresh manifest, zero failures, deferred or missing entries. Both requested `aspire:bump` offline invocations exited 0 with 0/7 files changed. |
| Bumper contract | FAIL | The real workflows match the new installation path. The seven transforms finish before the write loop. Tests cover validation failure without partial writes, the six-package intersection, and automatic Browsers selection. Explicit and offline target selection still accept mixed trains, as detailed below. |
| Typecheck, tests, lint and format | PASS | Hosted quality and all eight check/test shards, including browser, succeeded. Local `quality:cli` processed 1,299 lint and 1,181 format files with zero findings. Two local `deno test --frozen --allow-all --unstable-kv` runs exited 0. The 18 remediation/contract files passed 170 tests (45 steps). Five Docker topology, generated health and doctor files passed 46 tests (25 steps). [Core CI](https://github.com/rickylabs/netscript/actions/runs/46053272509) |
| Carriers, docs and publication | PASS | `check:assets-barrel`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets`, `maint:dogfood-skills:check`, `docs:links`, `docs:accuracy` and `publish:dry-run` each exited 0. The link checker examined 105 docs with zero broken links, anchors or orphans. |
| F-1, F-2–6, F-8, F-11–15, F-17–19 | PASS | `quality:gate` ran `quality:scan` and `arch:check`. Both it and `check:scaffold-provider-boundary` exited 0. The compat/TCP/Postgres templates are 347/343/183 lines. The DB runner and extracted helper are 468/347. The live verifier and extracted authority helper are 377/361. The 824→826-line public plugin installer adds the pre-mutation guard and its import. |
| F-7 and README baseline | FAIL | `doc:lint --root packages/aspire` exits **1**. The combined doc invocation exits 0, but the adapters/application/public/testing entrypoints report 2/9/36/2 private-type references. The Aspire JSR audit exits 1 on four missing module tags. `docs:readme:check` exits 1 on the bench Install section. The Aspire tree is `ea9a1d8174d6fc70ba9940119e3754a06ed688f7` at base and head, and the bench README has no diff. These failures predate the PR. |
| F-9 permissions and credential creation | PASS | The emitted adapter applies the deny map after the blanket/granular allow branch. The tests observe the builder calls and a real Deno child denying the targeted read with exit 42. Aspire 17's argument builder emits deny flags with the blanket grant. The four-process first-creation test passed. [Aspire 17 source](https://github.com/microsoft/aspire/blob/v17.0.0/src/Aspire.Hosting.JavaScript/DenoHostingExtensions.cs#L600-L614) |
| F-10 behavioral coverage | FAIL | Fresh-scaffold runtime and masking controls pass. The released-workspace check and crossed-train cases below still fail their contracts. |
| F-16 | DEBT_ACCEPTED | Raw Git tree counts at base and head are 19→19 immediate children in CLI adapters and 94→94 in scaffold gates. Existing entry `cli-showcase-cardinality-2571` applies. |

### Runtime and consumer gates

| Gate or closing target | Result | Independent evidence |
| --- | --- | --- |
| Hosted scaffold, runtime and desktop | PASS | Downloaded artifacts `15224864385`, `15225864327` and `15225983169`. Static service/contracts/plugins passed 8/5/18 steps. Postgres passed 124/124, SQLite passed 116/116 and its showcase passed 8/8, all with zero skips. MCP, OTel traces, streams reconnect and cleanup exited 0 in both runtime reports. The Postgres log shows `RUN: true` and all three cache hits. Desktop and lane visibility succeeded. Hosted jobs supply Docker evidence. [E2E run](https://github.com/rickylabs/netscript/actions/runs/46053272427) |
| #319 native AppHost and #320 first-party hosting | PASS | For **fresh scaffolds**, the generated-member compile tests, pre-mutation legacy refusal, first-party registration, mixed permission tests and both hosted starts support these NetScript adoption targets. The existing-workspace migration is a separate blocking deliverable below. |
| #2174 empty helpers and #2202 foreign Docker | PASS | `empty-registration_test.ts` linted the generated variants. Generated health tests exercised remote-loopback and local-daemon behavior. The DB resolver carries mode into the operation runner. The timeout tests skip Docker inspection for SQLite, External and explicit non-loopback targets. The helper also excludes File mode. |
| #2259 masking and connected consumers | PASS | In the Postgres artifact, `runtime.health.credential-rejected` exited 0 in 21,847 ms. Its stdout identifies `studioDb=plugin-smoke-20261127-185937-db`, matching the run workspace, and masked resource details for `users-asrcbrac` and `prisma-studio-ndnwuesf`. The gate scans raw describe bytes, reads the seeded row through Studio's SQL endpoint, inspects the rendered dashboard env rows via Chrome and validates the telemetry resources/logs shape. Studio error-file content is withheld. Cleanup exited 0 in 5,809 ms. The receipt supports this candidate. See the advisory below for future runs. [Postgres artifact](https://github.com/rickylabs/netscript/actions/runs/46053272427/artifacts/15225864327) |
| Migration from published `v0.0.9` | FAIL | The released CLI generated a SQLite/users workspace with the Node island. The candidate CLI refused it before migration. After the documented edits, root members, unstable flags and profiles were preserved, generation succeeded and `generate aspire --check` accepted 17 outputs. The guide's next command, `deno task check`, failed on the removed `aspire/node_modules/typescript/bin/tsc`. |
| Reference-only targets | PASS | The body has exactly five closing keywords, `Part of #2278`, and `Refs #295, #1726, #2184`. The owner identifies #295 as the umbrella. Broader credential-readiness and MySQL/SQL Server work remains with #1726 and #2184. [Owner's #295 comment](https://github.com/rickylabs/netscript/issues/295#issuecomment-4871769509) |

### Anti-patterns and architecture debt

AP-19 is **CLEAR** for the mixed permission case. The Round-1 AP-1 file-size findings on the DB runner and live verifier are cleared by the splits. AP-21 remains **DEBT_ACCEPTED** at the unchanged directory counts. The corrected debt rationale matches the generator's SQLite `addParameter` and External `addConnectionString` branches. The Browsers preview entry remains applicable. No new architecture debt is needed for the two implementation fixes.

### Findings

| Severity | Finding | Required action or disposition |
| --- | --- | --- |
| High — blocking | **The migration guide leaves the released quality runner installed.** Guide §2 deletes the compiler and its config. Section 4 invokes the root task whose `v0.0.9` runner still calls them. Candidate `generate aspire` updated the helpers and left that runner byte-identical. The verbatim trial also hit the unpublished `@netscript/aspire@^0.0.10` during dependency setup, even though Aspire restore exited 0. To isolate the runner, a second copy used the published `@netscript/aspire@0.0.9` whose package source and manifest match this head, generated the Prisma client, and completed restore and direct native AppHost checking. The guide's root check then passed its 145 ordinary files and failed its 15 AppHost files solely on the missing compiler. Replacing only the runner with the candidate-generated version made the same root task pass all 160. | Document or implement how an existing workspace receives the native quality runner, identify the candidate NetScript CLI prerequisite, and validate the guide's literal root task on a scaffold created by the released CLI. Record any pre-publication dependency substitution. |
| Medium — blocking | **The bumper's same-train rule covers automatic online selection only.** Read-only `deno task aspire:bump -- --dry-run --offline --version 18.0.0` exited 0 and proposed seven changes while keeping Browsers `17.0.0-preview.1.26567.5`. An injected online index with all six stable packages at `17.0.0` and an explicit, available Browsers `16.0.0-preview.1` also returned a successful plan. Both cases reach the same validated update list used by `--apply`. | Validate the final SDK/Browsers pair on every input path before constructing updates. Add negative controls for a crossed-train explicit online version and an offline major bump retaining the old Browsers pin. |
| Medium — advisory | **The Studio gate can credit a different seeded scaffold.** When Aspire omits Studio's HTTP URL the gate uses port 5555. The SQL assertion accepts any nonempty database name with `Seed User`. An independent injected response naming `unrelated-scaffold-db` returned a successful receipt. The hosted artifact itself identifies the expected database. | Match `current_database()` against the expected database from this workspace or the verified process connection and add a wrong-database negative control. |
| Low — evidence record | The S5b SHA for the 29-file change and the aggregate Aspire doc-lint command status need the distinctions recorded above. | Use `b8e900f77` and wrapper exit 1 in the next worklog summary. |

### Lessons for promotion

Run migration instructions on a project generated by the last published CLI. Preserve its generated maintenance scripts and invoke the exact verification task from the guide. For version bumpers, test an actual train change through each supported target-selection path.

### Verdict

| Field | Value |
| --- | --- |
| Verdict | **FAIL_FIX** |
| Rationale | The approved scope remains valid. Correct the legacy migration and mixed-train bumper paths, then re-evaluate the repaired candidate. Keep PR #2693 in implementation. |

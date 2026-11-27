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

## Round 3 — independent IMPL-EVAL, 2026-11-27

**FAIL_FIX** at `ad2fa1e8435a9dbeee931527ce52795cb905af4d`. The stock released-workspace migration now passes the guide’s root check. Two public-command controls still fail. Generation can discard a local quality-runner edit, and rejection of a legacy workspace happens after dependency installation has written into that workspace.

### Metadata and process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Evaluator and scope | PASS | Feature tier, cycle 3. Requested and observed Codex / GPT-6.2 Astra / xhigh, session `01a21eeb-a726-7eb3-bdf5-1400b48b0d56`, first route. The generator was Antigravity/Gemini. A6 CLI/tooling, supporting A2 integrations, docs and service overlays. |
| Design and plan authority | PASS | The worklog records Design, the S1–S6 slices, the two historical PLAN-EVAL failures and direct owner approval at `36f896a64`. Git confirms that approval precedes S1 at `452a24f80`. The PR has a Round-2 remediation comment for the evaluated head. |
| Checkout and hosted provenance | PASS | Initial raw Git status was clean. Local HEAD, remote branch, PR head and both workflow head SHAs agreed. GitHub’s test merge `3bdd1c6f2fb935a6bba8b0cc8592aa32d16849df` has base `7eecfe51f9fadcae79927ebd69898003dcdd27ab` and the same tree as the candidate, `2e99441bbd7b967e503ed79d5cfb2afc9950d116`. |
| Close-gate | FAIL | The PR was mergeable, zero behind, `status:implementing`, with no milestone. `check:review-threads` returned 0 unanswered. Of 34 checks, 26 succeeded, seven skipped and only `close-gate` failed. Its log identifies seven unchecked acceptance items across #2174, #2202 and #2259. Acceptance mirroring and ready-merge remain pending. [PR #2693](https://github.com/rickylabs/netscript/pull/2693) |

### Static and fitness gates

| Gate | Result | Independent evidence |
| --- | --- | --- |
| Aspire pins and bumper | PASS | Both parity phases each checked 1,053 surfaces with a fresh manifest and zero failed, deferred or missing entries. Both requested offline bumper forms exited 0 with 0/7 files changed. Adding `--version 18.0.0` to the separator/dry-run/offline form exited 1 with `Incompatible Aspire trains`. All resolution paths reach `assertSameAspireTrain` before the file-planning loop. The injected online test rejected an explicitly available crossed-train Browsers version. |
| Typecheck, format, lint and architecture | PASS | Hosted quality and all eight check/test shards succeeded. Locally, `quality:cli` processed 1,299 lint and 1,181 format files with zero findings. `quality:gate`, including `arch:check`, exited 0. [Core CI](https://github.com/rickylabs/netscript/actions/runs/46061650802) |
| Docs, generated carriers and publication | PASS | `check:assets-barrel`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets`, `maint:dogfood-skills:check`, `docs:links`, `docs:accuracy` and `publish:dry-run` each exited 0 in a clean copy of the exact commit. Links covered 105 docs with zero broken paths, anchors or orphans. The guide gives the `jsr:@netscript/cli@^0.0.10` install and manual runner fallback. |
| F-7 baseline and worklog | FAIL | `deno task doc:lint --root packages/aspire` exited 1. The combined child exited 0. The adapters/application/public/testing subpaths reported 2/9/36/2 private-type findings. The Aspire package tree is `ea9a1d8174d6fc70ba9940119e3754a06ed688f7` at base and head. Worklog line 77 records this correctly. Line 106 still assigns the combined child’s exit 0 to the named wrapper. Git independently confirms `b8e900f77` is S5b-2c and changed 29 files. |
| F-10 behavioral coverage | FAIL | Two independent local `deno test --frozen --allow-all --unstable-kv` invocations passed 136 tests/16 steps and 24 tests/25 steps. These include dry-run preservation, current-runner idempotence, crossed-train controls, Studio database mismatch, real SDK compilation, empty helpers and the foreign-Docker diagnostic. The two consumer controls below expose cases those tests miss. |

### Runtime and consumer gates

| Gate | Result | Independent evidence |
| --- | --- | --- |
| Hosted runtime and desktop | PASS | Downloaded artifacts `15230540733`, `15230050964` and `15228873472` and matched all three SHA-256 digests to the Actions API. Postgres passed 124/124, SQLite passed 116/116 plus 8/8 showcase, and static service/contracts/plugins passed 8/5/18. All reports had zero skips. The Postgres log records `RUN: true` and three cache hits. Native Linux desktop and both visibility checks succeeded. [Hosted E2E](https://github.com/rickylabs/netscript/actions/runs/46061650750) |
| Stock migration from published `0.0.9` | PASS | The published CLI scaffolded a SQLite workspace with a users service. Applied guide §2, preserving existing members, unstable flags and profiles. Used the candidate CLI from source and the published, tree-identical `@netscript/aspire@0.0.9` in place of the guide’s pre-publication pin. Public `generate aspire` upgraded the released runner (SHA-256 `3704a834…`) byte-for-byte to `generateQualityRunner()` (`9a5b786e…`). Aspire CLI `17.0.0+2d325b13` restore and Prisma `db:generate` exited 0. Public `generate aspire --check` accepted 17 outputs. The literal root `deno task check` exited 0 across 145 workspace files and all 15 AppHost files. |
| Custom runner preservation and legacy preflight | FAIL | Both failures reproduced through the public candidate CLI on temporary consumer projects. Inputs, observations and corrections are in Findings. |
| #319, #320, #2174 and #2202 | PASS | The native-member, real-SDK helper compilation and first-party hosting tests plus both hosted starts support the NetScript adoption leaves. The empty-helper lint matrix passed. The generated health tests exercised remote-loopback and local-daemon cases through both TCP and RESP. |
| #2259 | PASS | Traced the database name from Studio’s process environment through the URL/Npgsql agreement check to the strict comparison with SQL `current_database()`. The unrelated-database negative control passed. The live Postgres receipt records `studioDb=plugin-smoke-20261127-201122-db`, rendered dashboard masking for both users and Studio, and the full describe redaction check. Credential rejection exited 0 in 15,635 ms, cleanup exited 0 in 7,729 ms and database init/generate/seed/migration-artifact steps passed. [Postgres artifact](https://github.com/rickylabs/netscript/actions/runs/46061650750/artifacts/15230540733) |
| Issue references | PASS | Compared the five closing keywords with the issue bodies and the evidence above. The PR correctly uses `Part of #2278` and `Refs #295, #1726, #2184`. The owner identifies #295 as an umbrella. Broader per-engine credential readiness remains with #1726/#2184. [Owner’s #295 comment](https://github.com/rickylabs/netscript/issues/295#issuecomment-4871769509) |

### Anti-pattern check and architecture debt

AP-21 remains **DEBT_ACCEPTED** under `cli-showcase-cardinality-2571`. Immediate child counts at base and head are 19/19 in CLI adapters and 94/94 in scaffold gates. The Round-2 remediation has zero debt-registry changes. The two failures require implementation fixes within the approved migration scope.

### Findings

| Severity | Finding and reproduction | Required action |
| --- | --- | --- |
| High — blocking | **Generation overwrites a customized released runner.** Added a single `'jobs'` entry to `SOURCE_ROOTS` in an actual `0.0.9` runner, retaining the generated header. With all Aspire helpers already current, public `generate aspire` reported one rewritten file. The edited runner’s SHA-256 changed from `3a29226c…` to the stock candidate’s `9a5b786e…` and the jobs entry disappeared. With the identical body edit and a workspace-owned first line, the command wrote zero files and preserved the digest. The three string checks at `workspace-mutator.ts:179` establish that a legacy compiler reference is present. The unit test at `workspace-mutator_test.ts:482` changes the header position and misses a body-only customization. | Limit automatic whole-file replacement to a recognized unmodified released runner, preserve other bodies, and make the manual path clear for those users. Add a body-only customization control alongside the stock, dry-run and idempotence cases. |
| Medium — blocking | **Legacy rejection runs after project dependency installation.** On a second newly published-CLI scaffold, candidate `generate aspire --project-root <legacy>` exited 246 with the expected diagnostic. Its previously absent root `node_modules/` now occupied 279 MiB. All 262 pre-existing regular files outside that directory retained identical hashes and no lockfile appeared. `generate-aspire.ts:91` loads project configuration for composition validation before the guard at `workspace-mutator.ts:159`. This violates the pre-write guarantee in design L2 and the opening of the guide. | Run the legacy preflight before project configuration or dependency loading and cover the public command against a pristine scaffold with no installed dependencies. Assert that the refused workspace gains no paths. |
| Low — advisory | The aggregate doc-lint result is accurate in the new worklog summary, but the older baseline sentence at line 106 still attributes exit 0 to the wrapper. | Label that 0 as the combined child exit and retain 1 as the command exit. |

### Lessons for promotion

For a released-file migration, test a stock file and a body-only customization with the same ownership header. For a pre-write guard, compare the whole consumer directory before and after the public command, including dependency paths omitted by Git.

### Verdict

| Field | Value |
| --- | --- |
| Verdict | **FAIL_FIX** |
| Rationale | Stock migration, same-train validation, hosted database-identity proof and the five issue-closing claims are supported. Customized-runner preservation and the legacy pre-write guarantee still fail at the public entry point. This third feature-tier result is due for owner notification. |

## Round 4 — independent IMPL-EVAL, 2026-11-27

**FAIL_DEBT** at `21077ac3bfc248e2e6ec793d351a8917ee484948`. All three Round-3 findings are fixed, and each fix reproduced through the public CLI on a workspace scaffolded by the published `jsr:@netscript/cli@0.0.9`. This pass found no product defect. It fails on bookkeeping: the PR pushes one directory over the folder-cardinality cap and deepens a second, with no debt entry for either. It also carries a source change to `@netscript/plugin-streams-core` that the plan, the run records and the PR body never mention. Every required action is a registry, run-record or PR-body edit; no product file needs to change.

### Metadata and process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Evaluator and scope | PASS | Feature tier, cycle 4, single pass under the owner override recorded in `worklog.md`, `supervisor.md` and `drift.md`. Requested `claudeAgent` / `claude-fable-5-2` / `xhigh`. Observed model `claude-fable-5-2`, session `19874bc6-d3fd-4cef-9e95-4790a566cbe9`, first route. The effort setting cannot be read from inside the session; the launch record is its source. Generator was Antigravity/Gemini, so session and vendor family both differ. A6 CLI/tooling, supporting A2 integrations, docs and service overlays. The pass ran into 2026-11-28. |
| Plan and design authority | PASS | Both PLAN-EVAL records say `FAIL_PLAN`. Git orders the owner's direct approval at `36f896a64` before S1 at `452a24f80`. The worklog has the Design section. The evaluation brief carries a `## SKILL` chapter. |
| Checkout and hosted provenance | PASS | Local HEAD, `origin/epic/aspire-17-upgrade` and the PR head all equal the SHA above, 36 ahead and 0 behind `origin/main` `7eecfe51f`. The only local modifications are the three disclosed run files; nothing outside `.llm/runs/` differs from HEAD. GitHub's test merge `68889cb812e7617c02ee7de7bb26ca50438fa510` has parents `7eecfe51f` and the head, and its tree `ec7f4b1d695fb670475115bcd5843c0f673131a0` equals the head tree. Both workflow runs report this head SHA at attempt 1. |
| Round-3 findings | PASS | High #1, Medium #2 and Low #3 are each closed. Evidence is in the consumer and static tables below. `worklog.md:106` now gives wrapper exit 1 and combined child exit 0. |
| Commit trail and drift record | FAIL | The PR has a remediation comment for `d3844f98c`, and `21077ac3b` is recorded in the worklog. Four earlier commits are not itemised anywhere in the worklog: `3bf3cc56f`, `8fd152efc`, `b8397d8b5` and `af25a56ec`. One of them changes a package outside the plan. See Findings. [Round-3 remediation comment](https://github.com/rickylabs/netscript/pull/2693#issuecomment-7228823282) |
| Close-gate | FAIL | Expected before closeout. The PR is mergeable, `status:implementing`, no milestone. `check:review-threads` returned 0 threads and 0 unanswered. The close-gate log names seven unchecked acceptance boxes across #2174, #2202 and #2259 and nothing else. The mirror did not run because the PR lacks `status:ready-merge`. Evidence for all seven boxes exists and is listed under Consumer gates. |
| Release-gate class | N/A | This PR is not a cut. Canary and published-consumer proof follow the merge. |

### Static gates

All local results are raw exit codes from Deno 2.9.8 in this worktree. `git status` after every chain showed only the three disclosed run files, and `deno.lock` was untouched.

| Gate | Command or check | Result | Evidence |
| --- | --- | --- | --- |
| Narrow typecheck | `deno check --frozen --unstable-kv` on the four changed CLI sources and the two changed streams-core sources | PASS | Exit 0. Hosted `check-test-shard (check)` succeeded at the head. |
| Lint and format | `deno task quality:cli` | PASS | 1,299 lint and 1,181 format files, zero findings, zero refusals. Hosted `quality` succeeded. |
| Architecture and quality scan | `deno task quality:gate`, `deno task check:scaffold-provider-boundary` | PASS | Both exit 0. `arch:check` reports `FAIL=0` in every package. Its F-16 warnings are assessed under Fitness gates. The whole PR adds no `deno-lint-ignore`, `as unknown as` or `any` to non-test product code. |
| Aspire pins | `deno task check:aspire-version-parity`, default and `-- --phase 2` | PASS | Each checked 1,053 surfaces: 0 failed, 0 deferred, 0 missing, manifest fresh. `check:scaffold-versions`, `check:aspire-host-ports` and `check:netscript-jsr-specifiers` exited 0. |
| Bumper | `deno task aspire:bump --offline`, `-- --dry-run --offline`, `-- --dry-run --offline --version 18.0.0` | PASS | The first two exited 0 with 0/7 files changed. The crossed-train form exited 1 with `Incompatible Aspire trains` raised from `assertSameAspireTrain`. |
| Generated carriers | `check:assets-barrel`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets`, `maint:dogfood-skills:check` | PASS | All five exited 0 and left the tree unchanged. |
| Links and docs accuracy | `deno task docs:links`, `deno task docs:accuracy` | PASS | 105 docs, 0 broken links, anchors or orphans. Accuracy reported PASS. |
| Publish dry-run | `deno task publish:dry-run` | PASS | Exit 0, `Success Dry run complete`. |
| Doc lint | `deno task doc:lint --root packages/<name>` | FAIL | CLI and MCP exited 0. Aspire exited 1 on per-subpath private-type references 2/9/36/2 with combined child exit 0. `plugin-streams-core` also exited 1, with 1, 3 and 6 references in `./mod.ts`, `./src/telemetry/mod.ts` and `./src/testing/mod.ts` and combined child exit 0. Both are baseline: the Aspire tree is `ea9a1d8174d6fc70ba9940119e3754a06ed688f7` at base and head, and this PR changes none of those three streams-core files. |
| JSR audit | `audit-jsr-package.ts --root packages/<name>` | FAIL | CLI, MCP and `plugin-streams-core` exited 0. Aspire exited 1 on the four baseline missing `@module` tags. |
| README standard | `deno task docs:readme:check` | FAIL | Exit 1 on the unchanged `packages/bench/README.md` Install section. Baseline. |
| Focused tests | `deno test --frozen --allow-all --unstable-kv` in four invocations | PASS | Remediation and preflight files: 45 passed. Bumper, parity, fixture and workflow-policy tools: 49 passed. Aspire helper templates, credential readiness and DB operations: 140 passed, 302 steps, 3 ignored. Fresh AI browser-import guard and streams-core proxy tests: 30 passed. Zero failures. `version-drift_test.ts` passes with the derived specifier. |

### Fitness gates

| Gate | Result | Evidence |
| --- | --- | --- |
| F-1 file size | PASS | The remediation's sources are 241, 244, 110 and 24 lines. Every F-1 warning from `arch:check` in the three touched packages matches a file already over its cap on `origin/main`. The only growth is generated carriers and the recorded 824→826 plugin installer. |
| F-2 through F-4 | PASS | `quality:gate` and the provider-boundary check exited 0. The new preservation warning writes through the existing `outputWarning`, which goes to stderr. Seventeen CLI adapters already import that output module on main. |
| F-5 and F-6 | PASS | The Aspire package tree is identical at base and head. The streams-core change adds one import-map entry and no export. Publish dry-run exited 0. |
| F-7 package documentation | FAIL | Baseline only. See doc lint and JSR audit above. |
| F-8 through F-15, F-17 through F-19 | PASS | Typecheck, quality scan and CLI quality wrappers passed. Hosted runtime exercised background consumers, sagas and telemetry. No new abstract family or public sub-barrel. |
| F-10 test shape | PASS | The new mutator test's body-only case asserts zero rewrites and identical bytes, which by inspection the Round-3 string checks could not satisfy. The new preflight test asserts the composition validator is never called and that the workspace tree is unchanged. Both controls also reproduced live. |
| F-16 folder cardinality | FAIL | Two directories grew past the cap with no debt entry. `packages/cli/src/kernel/templates/aspire` went from 11 to 13 immediate children. `packages/cli/e2e/src/application/gates/scaffold/runtime` went from 29 to 31. The two parents the plan named stayed at 19 and 94, which is all Rounds 1 to 3 measured. See Findings. |

### Runtime gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Artifact integrity | PASS | Downloaded `15233929058`, `15235276207` and `15234862287`. Their SHA-256 values match both the Actions API digests and the brief: `6c1e57fd…`, `0feef948…` and `a3fcbc84…`. |
| Hosted static scaffold | PASS | Service 8/8, contracts 5/5, plugins 18/18. Zero failed, skipped or retried. The job's `Skipped by policy` step was itself skipped, so the lane ran. |
| Hosted Postgres and Docker | PASS | 124/124, zero failed, skipped or retried. The policy-skip step was skipped and the Aspire CLI came from cache with the preflight step succeeding. `runtime.health.credential-rejected` exited 0 in 30,423 ms. `agent.aspire-mcp-smoke`, `behavior.otel.traces`, `behavior.streams.producer-reconnect` and `cleanup.aspire-stop` (7,022 ms) passed. [Postgres job](https://github.com/rickylabs/netscript/actions/runs/46074769676/job/140760192326) |
| Hosted SQLite and Garnet | PASS | 116/116 and showcase 8/8, zero failed, skipped or retried. The browser gate exited 0. MCP smoke, OTel traces, streams reconnect and cleanup passed. [SQLite job](https://github.com/rickylabs/netscript/actions/runs/46074769676/job/140760192217) |
| Hosted core CI | PASS | `quality`, `check-test` and all eight shards succeeded. Of 34 check runs at the head, 26 succeeded, 7 were skipped and only `close-gate` failed. [Core CI](https://github.com/rickylabs/netscript/actions/runs/46074769741) |
| Desktop native | N/A | The job concluded `success` in four seconds through its `Skipped by policy` step. Checkout, packaging, install, update and rollback were all skipped. The lane runs only on release or manual events, or with `desktop-native-gate` or `ci:full`. The plan does not require it, but it is not a pass. See Findings. [Desktop job](https://github.com/rickylabs/netscript/actions/runs/46074769676/job/140760192092) |
| Local runtime and cleanup | N/A | No AppHost was started locally. The only Aspire command run was `aspire restore` from a scratch CLI `17.0.0+2d325b13` with a scratch `ASPIRE_HOME`. No process remained afterwards. |

### Consumer gates

Every control below used a workspace created by `jsr:@netscript/cli@0.0.9` with `init --db sqlite --service --service-name users`, run outside the monorepo with `--no-config --no-lock --node-modules-dir=none`. The candidate CLI ran from source with the repository's frozen lock. Snapshots list every directory and file with mode and SHA-256.

| Consumer | Result | Evidence |
| --- | --- | --- |
| Control A: zero-side-effect preflight | PASS | On the pristine legacy workspace, `generate aspire` and `generate aspire --check` each exited 246 with `Legacy Node.js Aspire AppHost detected`. The 298-entry snapshot was identical afterwards and no `node_modules/` existed. This held through both the public `netscript.ts` entry and the `netscript-dev.ts` entry, each with `--project-root` and from inside the project. |
| Control A, other entry points | PASS | Twelve more invocations were each run on a fresh pristine copy: `service add`, `service remove`, `service set`, `service generate`, `service ref add`, `db add`, `db remove --purge`, `plugin install` for workers, streams and auth, `plugin remove` and `plugin update`. All exited 246 with the legacy diagnostic, zero changed entries and no `node_modules/`. |
| Control A sensitivity | PASS | `generate plugins` does not touch Aspire and is not refused. On the same pristine workspace it exited 0 and created a 279 MiB `node_modules/`, the size Round 3 reported. Configuration loading therefore does install dependencies here, so its absence above is meaningful. |
| Control B: body-edited runner | PASS | After the guide's §2 edits, one `'jobs'` entry was added to `SOURCE_ROOTS` with the generated header kept. `generate aspire` printed the preservation warning on a first run that rewrote 13 helpers and on a second run that rewrote none. The runner's SHA-256 stayed `3c0b9fce…` and the entry remained. |
| Control B, manual path | PASS | With that customized runner the root `deno task check` exited 1 on the removed compiler, as the warning says. After applying the guide's `runAppHostCheck` snippet the warning stopped, the runner was still preserved, and `deno task check` exited 0 across 160 files. |
| Control C: stock migration | PASS | The scaffolded runner hashed `3704a834…`. After §2, `generate aspire` rewrote 14 files and the runner became `9a5b786e…`, the digest of `generateQualityRunner()` at this head. A second run rewrote none. `aspire restore` exited 0. After Prisma `db:generate`, `generate aspire --check` reported the surface current over 17 outputs, and the literal root `deno task check` exited 0: 145 workspace files and 15 AppHost files. The worklog records 161 files; this run and Round 3 both saw 160. |
| Legacy digest set | PASS | The template has four commits. Evaluating `generateQualityRunner()` at each gives `f6ea6468…` at `1455231b0` and `3704a834…` at `01e096049`, `v0.0.7`, `v0.0.8`, `v0.0.9`, `v0.0.10-canary.1`, `v0.0.10-canary.7` and `origin/main`. The exported set holds exactly those two. |
| Pre-publication substitution | PASS | The guide pins `@netscript/aspire@^0.0.10`, which is unpublished. The controls used published `0.0.9`. Between `v0.0.9` and this head the package differs only in `README.md`, so the source and manifest are identical. The trees are not, contrary to the worklog's "tree-identical". |
| #319 and #320 | PASS | Unchanged since Round 3. Native-member and first-party hosting tests passed again locally and both hosted tiers restored and started. Neither issue has acceptance checkboxes. |
| #2174 | PASS | `empty-registration_test.ts` runs `deno lint --no-config` on each of the seven emitted helpers in empty, all-empty and populated-sibling graphs, and passed. This covers both acceptance boxes. |
| #2202 | PASS | The generated readiness helper returns `FOREIGN_DOCKER_LOOPBACK` naming the daemon host and pointing at `netscript plugin doctor`. The stubbed remote and local topology tests passed. This covers both boxes. |
| #2259 | PASS | The hosted receipt reads `describe=redacted`, `studioDb=plugin-smoke-20261127-221055-db`, which matches this run's workspace, and masked dashboard details for `users` and `prisma-studio`. `database.init`, `generate`, `seed`, `codegen` and `migration-artifacts` passed. This covers all three boxes. |
| Issue references | PASS | The body has exactly five closing keywords, for #319, #320, #2174, #2202 and #2259, plus `Part of #2278` and `Refs #295, #1726, #2184`. The close-gate resolved the same five. |

### Anti-pattern check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-1 | CLEAR | No source file crosses or deepens a size cap in this remediation. |
| AP-19 | CLEAR | Unchanged since Round 2. The mixed-permission tests passed again. |
| AP-21 | VIOLATION | Two directories exceed the cap of 12 after growing in this PR, and neither growth is recorded. The two directories under `cli-showcase-cardinality-2571` are unchanged at 19 and 94 and remain DEBT_ACCEPTED. |
| AP-2, AP-9 through AP-16, AP-18, AP-22, AP-25, AP-26 | CLEAR | Reviewed the digest helper, the reordered guard, the warning path and the streams-core logger swap. |
| AP-3 through AP-8, AP-17, AP-20, AP-23, AP-24 | N/A | No corresponding surface changed. |

### Arch-debt delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | The remediation does not touch `arch-debt.md`. Across the PR, three existing Aspire rows were revised. |
| Resolved entries | 2 | Unchanged from Round 1. |
| Deepened violations | 1 | `gates/scaffold/runtime`, 29→31, from `dashboard-resource-masking.ts` and `live-db-authority.ts` in `600ea1ac8`. |
| Unrecorded violations | 2 | The deepening above, and the new crossing in `kernel/templates/aspire`, 11→13, from `generate-apphost-deno-json.ts` and its test in `8b4864b1b`. |

### Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| Blocking — debt record | **A new F-16 crossing has no debt entry.** S2a put two planned files in `packages/cli/src/kernel/templates/aspire`, taking it from 11 to 13 children. | `git ls-tree` gives 11 on `origin/main` and 13 at the head. `arch:check` prints `directory has 13 immediate children; doctrine cap is 12 (src/kernel/templates/aspire)`. Archetype 6 names no override for this folder. Neither `arch-debt.md` nor the CLI README mentions it. | Add a debt entry with reason, owner, target, linked plan, status and closing gate. Moving the pair into a bounded subfolder also clears it, but that changes product files and needs fresh hosted proof. |
| Blocking — debt record | **An over-cap gate directory was deepened without a record.** The Round-1 remediation added two files under `gates/scaffold/runtime`, 29→31. The worklog states F-16 was preserved because the parent stayed at 94. | Same measurement method. `cli-showcase-cardinality-2571` says it covers only its two showcase additions. `scaffold-runtime-a8-f16-1333` targets a split before the next gate or probe is added. | Record the deepening in the registry, in a new entry or by extending `scaffold-runtime-a8-f16-1333`, and correct the worklog sentence. |
| Medium — required record | **The PR changes `@netscript/plugin-streams-core` outside the plan and says so nowhere.** `8fd152efc` swaps `createLogger` from `@netscript/logger` for `getLogger` from `@logtape/logtape` in two proxy modules, adds the import-map entry, adds `packages/fresh/tests/ai-browser-import_test.ts` and adds one line to four lock files. | The plan, worklog, drift log, context pack, PR body and all six PR comments have no mention of it. No earlier round reviewed it. On the merits it is sound: `createLogger` with an array category returns `getLogger` of the same array (`packages/logger/creators.ts:119`), the new guard and the proxy tests pass, and the JSR audit and publish dry-run exit 0. | Add a drift row and a worklog entry that name the commit, the reason and the files. List the three sibling commits too. Add the change to the PR body's scope. |
| Low — evidence record | **Hosted results are overstated.** The worklog and brief say 33 non-close-gate checks passed and that `desktop-native-linux` passed. | 26 succeeded and 7 were skipped. The desktop job was a policy skip, as were the desktop jobs in the Round 1 to 3 runs: each finished in three or four seconds with checkout skipped. | State 26 succeeded and 7 skipped, and record desktop as policy-skipped. S3a changed desktop app registration, which has compile-level proof only until that lane runs at the canary cut. |
| Low — closeout | **The PR body is not ready for the close-gate.** Its `## Status` box still names `c312e2beb` and Round 2. It has no Definition of Done, Validation or Drift/Debt section. It describes the dependency reconciler as serving legacy Node AppHosts, which are now refused. | PR body at the head. `status:implementing` is also absent from `.github/labels.yml`. | Rewrite the body to the `netscript-pr` template and add the `acceptance-evidence` blocks for the seven boxes before applying `status:ready-merge`. |
| Low — advisory | **Small gaps in the new warning path.** The warning and the guard error cite a repository docs path that a consumer workspace does not contain. The unit test checks preserved bytes but not that the warning is emitted. The guide's snippet omits replacing the inline `args: [...]` with `args`. | `workspace-mutator.ts:191`, `workspace-mutator_test.ts:518`, guide §2. The live controls confirmed the behavior. | Optional follow-up. Does not block. |

### Lessons for promotion

| Lesson | Applies to | Confidence |
| --- | --- | --- |
| Measure folder cardinality for every directory that gains a file. Checking only the parents a plan names lets growth move to a sibling or child unnoticed. | All archetypes, F-16 | High |
| Read step-level conclusions before recording a hosted job as passed. A job-level `success` can be a policy skip. | Hosted gate evidence | High |
| Diff a PR against its base by package before accepting its scope. An unblocking fix in another package needs a drift row in the same commit. | Harness runs | High |

### Verdict

| Field | Value |
| --- | --- |
| Verdict | **FAIL_DEBT** |
| Rationale | The approved scope is implemented and verified, and the three Round-3 findings are closed. Two folder-cardinality growths are unrecorded, which the verdict rules do not allow under `PASS`. The fix is two debt entries plus the drift, evidence and PR-body corrections above, all outside product code. The tree outside `.llm/` can stay as verified here, so a confirmation limited to those records, or the owner's direct acceptance, is enough to clear it. |

PR https://github.com/rickylabs/netscript/pull/2693, head 21077ac3bfc248e2e6ec793d351a8917ee484948, checks and reviews 26 succeeded, 7 skipped, close-gate failing by design, 0 review threads; IMPL-EVAL Round 4 FAIL_DEBT

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

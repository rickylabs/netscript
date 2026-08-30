# S11 public-docs changeset audit — cycle 2

- PR: `rickylabs/netscript#1771`
- Head: `b8d66f6fabd0047a609eb079210fa3a23f648c12`
- Range: `a46ea16d..b8d66f6f`
- Session: opposite-family `docs_audit` (`Codex · GPT-5.6 Sol · high`, declared
  `large_changeset` escalation)
- Scope: one immutable cycle-2 pass over the entire changeset; no tracked-file edits, commits,
  pushes, AppHost/container starts, or CLI E2E

## Cycle-1 finding dispositions

| ID | cycle-1 finding | disposition | cycle-2 file:line evidence | evidence / remaining change |
| --- | --- | --- | --- | --- |
| H1 | Detached `start` / `ps` JSON schemas and conditional token handling | **CLOSED** | `docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md:25-38,43-65` | The examples now use the S2 receipt shapes: start has `appHostPath`, `appHostPid`, `cliPid`, `dashboardUrl`, `logFile`; `ps` adds `status`, `sdkVersion`, and `logFilePath`. Token redaction is conditional. This matches `02-aspire-start-1.json`, `02-aspire-ps-1.json`, and S2 V5. |
| H2 | Nonexistent S2 receipt names and nonexistent S10 Phase-B proof | **OPEN** | `.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/worklog.md:19-21,46` | The public receipt section was removed and line 46 names real S2 receipts, but the authoritative S11 worklog still asserts the nonexistent `03-v2-*`, `03-v3-*`, and `03-v4-*` files plus unspecified S10 receipts at line 21. S10’s handoff still says Phase B was not delivered. Mark the historical line superseded or replace it with the real `02-*` paths and remove the S10 runtime assertion. |
| H3 | Non-interactive/help, wait, timing, and `--isolated` accuracy | **OPEN** | `docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md:18,69,73-96,110`; `docs/site/explanation/aspire.md:98-99`; `docs/site/reference/aspire/index.md:13-18` | The `--nologo` distinction and resource-only `wait` are fixed. However, two observed starts do not establish that cold starts “typically” require 25–39 seconds; 13.5.3 help proves randomized ports and isolated **user secrets**, not “run state into a dedicated directory”; and S2 V3 shows two isolated starts reused Postgres host port `14428`, contradicting the other touched pages’ “free infra ports” / “parallel-safe ports” language. Narrow all three pages to help/receipt-proven behavior and keep `DcpPublisher__RandomizePorts=true` as a separate generated-task setting. |
| H4 | npm package and installation-aware `aspire update --self` | **CLOSED** | `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:59-61` | Fresh `aspire docs get install-aspire-cli` and `aspire docs get aspire-update-command` confirm `@microsoft/aspire-cli`, `npm install -g @microsoft/aspire-cli@latest`, and installation-method-aware self-update. |
| H5 | “Generated” scaffold sample versus exact-head generator and 13.5 pin/parity dependency | **OPEN** | `docs/site/explanation/aspire.md:76-88`; `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:57-61`; `docs/site/reference/aspire/index.md:17` | A fresh exact-head scaffold now matches the displayed 13.4.6 JSON, including Redis, so the local sample mismatch is removed. But this resolves the finding by reverting active docs to 13.4.6, contrary to the S11 requirement for SDK/hosting `13.5.3` and Browsers `13.5.3-preview.1.26425.3`. The reference page simultaneously says the generated AppHost pins the 13.5 Browsers package, which exact HEAD does not. `check:aspire-version-parity` is still absent. Restack on the 13.5.3 pin/parity owner and regenerate all affected examples. |
| H6 | Generated Aspire wrapper versus NetScript MCP endpoint precedence | **OPEN** | `docs/site/observability/how-to/add-opentelemetry.md:157-169`; `packages/mcp/src/domain/telemetry-endpoint.ts:13,23-40`; `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:37` | Wrapper behavior is now separated correctly: forward, then exact-AppHost `ps` retry. The newly moved MCP chain is still false: `netscript agent mcp` accepts `--endpoint`, not `--dashboard-url`; its telemetry resolver has four sources—explicit, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT`, default—and no `aspire ps` source. Replace the five-step list with the implementation’s four-step contract. |
| H7 | Phase-B-blocked health, typed-command, and `excludeFromMcp` behavior stated as observed | **CLOSED** | `docs/site/reference/aspire/index.md:20-27` | The affected block is now explicitly a set of generated/configuration contracts. It no longer claims live CLI/dashboard observations, and `excludeFromMcp()` is scoped only to MCP exposure. Separate runtime overclaims in the preceding paragraph are recorded below. |
| M1 | Aspire MCP connection form and internal decision language | **CLOSED** | `docs/site/reference/ai/skills.md:51-57` | The page now includes `aspire agent mcp --dashboard-url <url>` with optional `--api-key`, lists the exact 14 tools, keeps `get_integration_docs` documented-but-unobserved, and removes `OF-1` / “ratified” wording. Fresh 13.5.3 help and S2 V8 support it. |
| M2 | Conditional `ps` token and exact `stop --force` help contract | **CLOSED** | `docs/site/cli-reference.md:139-141` | Token presence is conditional and `--force` is described exactly as stopping the AppHost and cleaning persistent resources. |
| M3 | Per-row manifest disposition/proving grep and correct PR base | **OPEN** | `.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/manifest-disposition.md:3-128`; PR #1771 body | The PR body now names base `a46ea16d` and links the report, and the report contains all 113 S11 `doc:*` paths with zero deferred rows. The proof is not accurate: ten rows are marked `EDITED` but have no change in `a46ea16d..HEAD` (`aspire-resource-graph.mmd`, `glossary.md`, `index.vto`, `deploy.md`, `quickstart/aspire.md`, three tutorial rows, `why.vto`, and root `README.md`), while changed `docs/site/_data/xref.ts` and `docs/site/how-to/index.md` are marked `VERIFIED_CLEAN`. The no-change rows contain only a blanket assertion, not their proving grep, and the PR body does not carry the row-level proof. Regenerate dispositions from the exact PR range and attach the deterministic grep evidence in the body/report. |
| M4 | Internal audit vocabulary and machine-specific public paths | **CLOSED** | all touched public pages | Exact touched-public-page scans find no decision IDs, phase/receipt/worklog vocabulary, `.llm/`, `/home/agent`, NAS paths, or public issue/PR-number leakage. |
| M5 | Diagram source/asset parity | **OPEN (environment)** | gate-level | `deno task diagrams:check` from `docs/site` still cannot execute because pinned `mmdc` is unavailable. Per the cycle-2 instruction this is recorded as an environment limitation, not a content-gate failure. Lume only proves that 21 referenced committed assets exist; it is not a source/SVG parity verdict. |

Cycle-1 closure count: **7 CLOSED, 4 OPEN, 1 OPEN (environment)**.

## Cycle-2 findings

| severity | claim | file:line | evidence | required change |
| --- | --- | --- | --- | --- |
| **high** | The fix introduced an incorrect public NetScript MCP telemetry contract. The option is named `--endpoint`, and the resolver has no running-AppHost/`aspire ps` source. | `docs/site/observability/how-to/add-opentelemetry.md:163-169` | `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:37`; `packages/mcp/src/domain/telemetry-endpoint.ts:13,23-40`; `packages/mcp/README.md:317-318` | Document explicit `--endpoint` → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → `http://localhost:18888`. Do not splice the generated task wrapper’s `aspire ps` retry into the MCP resolver. |
| **high** | S11’s required 13.5.3 train is not present at exact HEAD. Active prose now contains 13.4.6, while another touched page falsely says the generated AppHost pins Browsers 13.5.3 preview. | `docs/site/explanation/aspire.md:81-88`; `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:57-61`; `docs/site/reference/aspire/index.md:17` | Fresh exact-head `netscript init` generated SDK/PostgreSQL/Redis `13.4.6` and Browsers `13.4.6-preview.1.26319.6`. The required parity task is absent. The cycle contract requires SDK/hosting `13.5.3`, Browsers `13.5.3-preview.1.26425.3`, and no active 13.4.6. | Restack on the S1 13.5 pin/parity slice, regenerate, and make every generated/current statement agree. |
| **high** | Isolation and browser-log runtime behavior remains overstated across touched pages. Isolated starts are called parallel-safe for infra ports despite an observed repeated Postgres host port; exact browser-console capture is presented as current behavior although S2 explicitly says it was not proven. | `docs/site/explanation/aspire.md:98-99`; `docs/site/reference/aspire/index.md:13-18`; `docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md:69,87-96` | S2 verification matrix V3 / `02-runtime-lifecycle.md` records both isolated starts using Postgres host port `14428`. S2 V11 / `03-v11-regressions.md` says `withBrowserLogs` projection and child creation are proven but exact capture needs a launched browser session. 13.5.3 `start --help` promises randomized ports and isolated user secrets only. | Narrow the behavior paragraph to static emitted configuration and help-proven semantics. Do not call infrastructure ports parallel-safe without the separate NetScript randomization setting and a receipt; do not claim observed browser forwarding until the missing runtime receipt exists. |
| **medium** | The cycle-1 timing rewrite generalizes two measurements into a typical CI range, and cleanup asserts an orphan-free result without a receipt or exact-AppHost targeting. | `docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md:69,100-110` | S2 V2 contains exactly two local starts, `38.62 s` and `24.80 s`; it does not establish population-level “typically.” S2 lifecycle cleanup receipts use `aspire stop --apphost <exact>` and disclose a persistent Postgres survivor in the non-force orphan path. | Say “two S2 local runs measured 24.80 s and 38.62 s,” use exact-AppHost stop guidance for shared hosts, and make the post-stop check a verification step rather than a guaranteed result. |
| **medium** | The row-level manifest acceptance artifact is range-inaccurate and lacks per-row proving grep; the PR body only links it. | `.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/manifest-disposition.md:3-128`; PR #1771 body | Deterministic comparison against `git diff --name-only a46ea16d..HEAD` finds ten false `EDITED` rows and two changed rows marked `VERIFIED_CLEAN`. | Recompute the table from the exact range and include the actual no-change scans/proving grep in the PR body or its linked deterministic report. |

The cycle-1 fix therefore **did introduce new overclaim**: the five-step MCP resolver and the
“typically” / isolated-run-state generalizations are not supported by the cited implementation,
help, or receipts.

## Required checks

| # | result | evidence |
| --- | --- | --- |
| 1. Every touched 13.5.3 behavior claim has a receipt or cited upstream source; no prose-only observation | **FAIL** | The MCP resolver is contradicted by source; isolation/parallel-safe infra-port statements are contradicted by S2 V3; exact browser-log forwarding remains unproved per S2 V11; “typically” is generalized from two runs; and the S11 worklog retains nonexistent receipt names. D-42/D-43/D-55 still block the missing Phase-B receipts. |
| 2. Version snippets, CLI/SDK pairing, self-update, and no active 13.4.6 | **FAIL** | Pairing and installation-aware `aspire update --self` are correct. Exact-head fresh generation and active prose remain on SDK/hosting `13.4.6` and Browsers `13.4.6-preview.1.26319.6`; the required S11 13.5.3 train and parity task are absent. |
| 3. Detached-start how-to fields, token handling, timeout/wait, and isolation | **FAIL** | Start/ps schemas, conditional token wording, `ASPIRE_CLI_START_TIMEOUT`, resource-only `wait --timeout`, and empty `ps` are now correct. Timing is overstated, isolated run-state wording is not help-proven, cross-page infra-port claims contradict S2 V3, and shared-host cleanup is not exact-AppHost scoped. |
| 4. MCP/skills baseline, connection forms, upstream skills, and `excludeFromMcp` scope | **PASS** | `aspire agent mcp` and `--dashboard-url`/optional `--api-key` match 13.5.3 help; S2 V8 proves the exact 14-tool baseline and `get_integration_docs` distinction; four upstream workflow skills coexist beside NetScript `aspire`; the Aspire reference now scopes `excludeFromMcp()` to MCP exposure only. The separate NetScript telemetry resolver error is counted under check 1. |
| 5. Fresh current-CLI sample comparison; no doctrine/product implementation changes | **PASS** | Fresh exact-head init matched the displayed current 13.4.6 JSON including Redis and `.mts` imports; scratch was deleted. This exposes check 2’s version-train failure rather than a fresh-sample mismatch. Doctrine diff is empty. `packages/` / `plugins/` changes are limited to `packages/aspire/README.md` and regenerated `agent-docs` / publish carriers; no product implementation changed. |
| 6. Terminology, public wording, manifest disposition, and PR base | **FAIL** | All 113 S11 `doc:*` rows scan clean for `.NET Aspire` and `AI-Assistant`; touched public pages have no internal wording, issue/PR-number, local-home, or NAS-path leakage. PR base is correctly `a46ea16d`, but the row-level disposition/proving evidence is inaccurate and incomplete. |

## Gate log

| command/check | exit | result | evidence |
| --- | ---: | --- | --- |
| `git rev-parse HEAD`; remote-head and base comparison | 0 | **PASS** | Detached local HEAD and remote branch both resolve `b8d66f6fabd0047a609eb079210fa3a23f648c12`; `a46ea16d` is an ancestor. |
| `/home/agent/.local/bin/mise exec -- aspire --version` | 0 | **PASS** | `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688`. |
| 13.5.3 `start`, `ps`, `wait`, `stop`, `agent mcp`, `otel traces`, and `export` help reads | 0 | **PASS** | Executed without an AppHost. Help proves the cited flags, resource-only wait, force wording, MCP connection flags, search option, and zip export. |
| `aspire docs get install-aspire-cli`; `aspire docs get aspire-update-command` | 0 | **PASS** | Confirms npm package and installation-aware self-update behavior. |
| `aspire docs search/get` for timestamp telemetry filtering | 0 | **PASS** | Upstream 13.5 docs explicitly support `timestamp:>=<ISO date/time>`. |
| `deno task docs:links` | 0 | **PASS** | `docs=103`, broken links `0`, broken anchors `0`, orphans `0`. |
| `deno task build` from `docs/site` | 0 | **PASS** | Source format OK; 642 files generated; 228 HTML files validated; 21 diagram references present. |
| `deno task check:agent-docs-prose` | 0 | **PASS** | `fresh: true`, `stalePaths: []`. |
| `deno task check:publish-assets` | 0 | **PASS** | Generator check completed without drift. |
| `deno task diagrams:check` from `docs/site` | 1 | **N/A (environment)** | Pinned `@mermaid-js/mermaid-cli@10.9.1` reports `mmdc` unavailable. Per cycle-2 steering this is stated explicitly rather than graded as a content failure. |
| `deno task doc:lint` | 1 | **N/A (D-30)** | Root task invokes a TypeScript JSDoc wrapper without its required `--root`; it does not lint Markdown public prose. |
| `deno task check:aspire-version-parity` | 1 | **FAIL (task absent)** | Exact task is not wired at this head. |
| Manifest-equivalent phase-1 set report | 0 set comparison | **PASS (coverage)** | Supervisor manifest: 124 `doc:*` rows = 113 S11-owned + 9 archival + 2 derived assets. The linked disposition contains all 113 S11 doc rows, no missing/extra paths, and zero row-level deferred statuses. |
| Manifest disposition accuracy check against exact range | scan completed | **FAIL** | Ten false `EDITED` rows and two changed rows marked `VERIFIED_CLEAN`; no per-row proving grep. |
| Touched-public-page internal wording / issue / PR / local-home / NAS-path scans | no matches | **PASS** | No leakage. |
| S11-owned `doc:*` terminology scan | no matches | **PASS** | No `.NET Aspire`, `AI-Assistant`, or `AI Assistant` regression across all 113 rows. |
| Active version scan | matches present | **FAIL** | Active `13.4.6` at `explanation/aspire.md:83,88` and `deploy-local-aspire.md:58`. |
| `deno task check:netscript-jsr-specifiers` plus touched-page versionless scan | 0 | **PASS** | Official guard: `scanned=2375`, `allowances=1`, `ranges=0`, `failures=0`; no new versionless NetScript specifier. |
| `git diff --stat a46ea16d..HEAD -- packages/ plugins/`; doctrine scan | 0 | **PASS** | Only package README and two generated carriers; doctrine paths unchanged; no product code. |
| Fresh exact-head `netscript init` comparison | 0 generation | **PASS (comparison), version failure exposed** | Generated SDK/Postgres/Redis 13.4.6 and Browsers `13.4.6-preview.1.26319.6`; current displayed JSON and `.mts` imports match. Scratch `.llm/tmp/s11-doc-audit-cycle2-b8d66f6f` was deleted. |
| PR #1771 body/base check | connector read | **FAIL (proof)** | Base text and GitHub base SHA are correct at `a46ea16d`; body links the disposition but does not carry accurate per-row disposition/proving grep. |
| Final `git status --short` | 0 | **PASS** | Clean. Gate-created 11-line `deno.lock` hydration was removed exactly; no tracked audit changes remain. |
| Initial and final `aspire ps --format Json` | 0 | **PASS** | Both returned `[]`; no AppHost or container was started. |

## Verdict and escalation

The build and generated-asset gates are green, and seven cycle-1 findings are closed. The changeset
is still not claim-correct: it remains off the required 13.5.3 scaffold train, publishes a false
NetScript MCP endpoint-resolution chain, overstates isolated/runtime behavior, retains stale
nonexistent worklog receipts, and lacks accurate manifest disposition proof.

This is the second consecutive `docs_audit` `FAIL_FIX`. Per `doc-audit.md`, normal audit retries are
exhausted and the result escalates to the supervisor; do not begin an automatic third audit cycle.

AUDIT: FAIL_FIX

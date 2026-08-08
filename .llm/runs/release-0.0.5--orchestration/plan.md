# Wave plan v3 — NetScript 0.0.5 continuation

Status: **PLAN-EVAL PASS; IMPLEMENTATION AUTHORIZED**.

Baseline: `origin/main` at `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` on 2026-08-06. The carried
Claude run is evidence, not an implementation base. Separate Minimax M3 PLAN-EVAL session
`567e3125-0fe9-4637-b0bb-30c20f9d3c26` returned `PASS` on 2026-08-06; implementation may proceed
under the locked wave and merge gates below.

## Locked decisions

1. The future-milestone rollover is complete. Milestones 21, 20, 19, 18, 17, 16, and 24 were renamed
   highest-to-lowest; new milestone 25 is `0.0.6`; the exact mapping and preserved metadata are in
   `research.md`.
2. #1331 is complete through merged PR #1336. Its formal phase split remains Minimax M3 PLAN-EVAL
   and Qwen 3.8 Max IMPL-EVAL; it is not reopened as an implementation slice.
3. The 0.0.5 scope is reduced from 38 open issues to 30. Eight rows whose acceptance cannot be
   completed safely inside this release move to new milestone 25 after PLAN-EVAL passes; every move
   receives a written reason. No closed historical assignment moves.
4. Existing PRs #1315–#1318 and every new implementation PR target `canary/0.0.5-canary.14` (or the
   content-derived successor train after a cut), never the published canary.13 branch. A train
   umbrella PR carries no closing keyword.
5. One supervisor owns one PR cluster. A wave has at most three active supervisors. Dependencies
   cross waves; they are not hidden inside concurrent clusters.
6. Implementation defaults to Codex GPT-5.6 Sol low. Sol medium is justified only for #1329
   (versioned contract + telemetry + runtime proof) and #1333 (large scaffold/UI/contract design).
   Major UI design for #1333 also takes the lane-policy GLM 5.2 xhigh design review. Ordinary
   adversarial review uses the owner-authorized OpenRouter Grok 4.5 route and is recorded as
   temporary drift while Claude plan allowance is exhausted.
7. Formal PLAN-EVAL is `minimax/minimax-m3` high; formal IMPL-EVAL is `qwen/qwen3.8-max` high. They
   run in separate sessions and never evaluate their own work.
8. The orchestrator alone merges train PRs, promotes a train to `main`, dispatches release
   workflows, and accepts canary evidence. Delegated lanes never merge or publish.
9. Canaries are content units, not dispatch units. Exactly three planned cuts remain: canary.14,
   canary.15, and canary.16. Membership is derived from merged history at each boundary.
10. #1004, #1090, #1126, #1166, and #1169 are evidence/observation/umbrella closures. No code PR
    carries a closing keyword for them. #1139 remains gated out by F2 and moves to 0.0.6.

## Issue disposition — all 38 open issues exactly once

| Class                               | Issues                                                                                                                                            | Closure rule                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Existing train PR                   | #1295→#1315, #1189→#1316, #1117→#1317, #1115→#1318                                                                                                | Existing PR body may close only its own fully verified issue; unticked acceptance blocks merge                   |
| New implementation PR               | #1024, #1102, #1108, #1119, #1137, #1138, #1148, #1197, #1202, #1208, #1312, #1324, #1325, #1326, #1327, #1328, #1329, #1330, #1332, #1333, #1334 | Closing keyword only after the issue body is evidence-complete                                                   |
| Evidence / observational hand-close | #1004, #1090, #1166                                                                                                                               | Re-query acceptance after real canary/provider evidence; hand-close or move with written reason                  |
| Umbrella hand-close                 | #1126, #1169                                                                                                                                      | No closing keyword; close only after all retained children/one-pass evidence are complete                        |
| Move to new `0.0.6` (milestone 25)  | #1085, #1093, #1112, #1139, #1201, #1210, #1260, #1293                                                                                            | Move after PLAN-EVAL with issue-specific reason; #1112+#1293 stay together as one MySQL public-surface follow-up |

Move rationale:

- #1085 and #1093 are p2 hardening/extension work with no 0.0.5 release-blocking acceptance.
- #1112 requires #1293's net-new MySQL exported adapter/error-hook surface; that public API design
  is larger than an honest docs-only fix, so both move together.
- #1139 is explicitly gated on F2; the gate has not flipped.
- #1201 and #1260 add new MCP corpus/export surfaces after the retained adoption fixes, rather than
  repairing a release blocker.
- #1210 is a broad competitive tutorial/deep-dive program. The release retains the focused p0
  tutorial #1208 and moves the larger program intact.

## Archetype, overlay, doctrine, and JSR plan

| Cluster family                                                                                                                                | Archetype / overlay                                                                                                   | Current doctrine verdict and debt                                                                                                                                 | Required proving gates                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agentic/release/CLI/scaffold (#1004, #1024, #1102, #1108, #1115, #1119, #1148, #1166, #1197, #1202, #1312, #1324, #1327, #1328, #1330, #1333) | A6 CLI/tooling; docs/frontend/service overlays where named                                                            | `packages/cli` A6 promotion is complete, but open accepted debt includes maintainer/public mixing and permission docs; no slice may deepen either                 | Scoped check/lint/fmt wrappers; `check-doctrine`; manual F-CLI-1..31 evidence where scripts do not cover; generated consumer compile; `scaffold.runtime` for scaffold/DB/Aspire changes; browser/route proof for #1333 |
| Plugin linking/triggers (#1189, #1325)                                                                                                        | A5 plugin + service/runtime overlay                                                                                   | `plugins/triggers` retains verification-shape and connector convergence debt; thinness/parity law applies                                                         | Plugin/core scoped static + JSR audits; `verify-plugin`; host-loader consumer proof; Redis and Deno KV runtime health; correlated OTEL; full `scaffold.runtime`                                                        |
| Streams contract/runtime (#1329, #1326)                                                                                                       | A3 runtime folded into A5/core ownership; service/docs/frontend overlays for SSE consumer                             | `plugin-streams-core` has accepted AP-13 console warning debt and streams connector convergence debt. #1326 must replace, not deepen, misleading warning behavior | Contract-first public schema, doc lint, publish dry-run, F-13 lifecycle/cancellation, real service recovery, ordering/backpressure tests, correlated producer→SSE OTEL, consumer conformance                           |
| OpenAPI/MCP contracts (#1117, #1137, #1138, #1126)                                                                                            | A4 service contract surface + service/docs overlays                                                                   | `packages/service` remains Refactor with assets/presets debt; vendored Scalar debt accepted                                                                       | Contract/client check, service runtime, doc lint/publish dry-run for touched exports, generated MCP consumer proof, source/link alignment                                                                              |
| Frontend/docs narrative (#1208, #1332, #1333, #1334)                                                                                          | A6 scaffold plus frontend/docs overlays; affected `fresh`/`fresh-ui` public surfaces retain their assigned archetypes | `packages/fresh` restructure/doc debt is resolved; `fresh-ui` has known full-surface private-type-ref debt and must not acquire new slow types                    | Typed examples, docs source/link checks, Fresh route/browser states, responsive light/dark proof, scaffold golden + runtime, GLM design review for #1333                                                               |
| Dependency train (#1295)                                                                                                                      | Published package graph; dependency/toolchain overlay                                                                 | Known Zod 3 boundary remains explicitly deferred to #1320; no prerelease AG-UI substitution                                                                       | `deps:why`, stable-channel dependency wrappers as needed, frozen install, package consumers, publish dry-run, no catalog use in generated child configs                                                                |

JSR rubric applied to every package/plugin cluster:

- Preserve scoped names, descriptions, explicit exports, module/symbol JSDoc, ESM-only files, and
  clean publish file lists.
- Any new export is contract-first, explicitly annotated for `isolatedDeclarations`, documented, and
  verified across the full export map with the structured doc-lint runner.
- No new slow-type waiver is allowed. Existing accepted debt is cited, not generalized.
- Internal self-imports stay relative; generated assets are checked-in TypeScript constants or
  otherwise proven remote-graph safe; no top-level filesystem resolution over `jsr:`/`https:`.
- `publish:dry-run` is static evidence only. Every canary requires real OIDC publish plus pinned
  `e2e-cli-prod` against the published graph.

## Ordered PR/commit slices (<30)

Each row is one supervisor-owned PR cluster and the intended atomic merge slice. Supervisors may use
multiple local commits, but the cluster cannot absorb unrelated acceptance.

| Slice | Issues / existing PR | Proves                                                                                                                         | Expected paths                                                                                                | Decisive gates                                                                                                      | Route      |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| T1-A  | #1295 / #1315        | AI/MCP Zod 4 boundary is catalog-sourced without pretending transitive Zod 3 vanished                                          | root/member `deno.json`, dependency guard tests                                                               | `deps:why zod`; frozen check/test; generated child-config regression; package consumers                             | Sol low    |
| T1-B  | #1189 / #1316        | Plugin-declared links install/remove cleanly and a fixture third-party service is called with correlated OTEL                  | `packages/cli/src/public/features/plugins/**`, plugin config/link seams, e2e fixtures                         | existing unit tests; isolated live service→plugin proof; close-gate; `scaffold.runtime`                             | Sol low    |
| T2-A  | #1117 / #1317        | Scaffolded OpenAPI operations are genuinely agent-reachable MCP tools                                                          | agent-init/MCP generation and service operation tests                                                         | current CI, real agent tool reachability, review-thread/close gate                                                  | Sol low    |
| T2-B  | #1115 / #1318        | Follow/list reports observed working/idle/stalled state rather than replaying a stale status field                             | `.llm/tools/agentic/**`, CLI tests/docs                                                                       | current CI, same-thread observed-state fixture, review-thread/close gate                                            | Sol low    |
| W1-A  | #1312 + #1148        | Release refuses before minting when budget is unsafe, classifies partial publish, and scans every emitted version-bearing file | `.github/workflows/release-canary.yml`, `.llm/tools/release/**`, release skill/tests                          | negative budget fixture; residue fixture; release checks; same-semver policy; no publish during PR                  | Sol low    |
| W1-B  | #1024 + #1328        | Consumer tool bundle and generated quality tasks cover owned TS/TSX/plugin/runtime source without generated-doc churn          | `packages/cli/src/**/agent*`, scaffold task/templates, `tests/e2e-cli/**`                                     | injected TS/TSX negatives; clean generated lint/fmt; standalone consumer smoke; `scaffold.runtime`                  | Sol low    |
| W1-C  | #1324 + #1330        | OpenCode attaches generated MCP config, fails closed on absence, and resumes provider-valid history                            | `.llm/tools/agentic/opencode/**`, runtime/provider config and tests                                           | config merge fixtures; history matrix; real MCP lookup; real OpenRouter resume                                      | Sol low    |
| W2-A  | #1325                | Generated triggers runtime selects Redis/Garnet or Deno KV without manual edits                                                | `plugins/triggers/src/adapter/resources/glue/**`, generator/e2e fixtures                                      | RED-first output test; both backends healthy; `verify-plugin`; full `scaffold.runtime`                              | Sol low    |
| W2-B  | #1329                | One exported versioned SSE event envelope governs server, Fresh consumer, docs, offsets, and trace context                     | `packages/plugin-streams-core/**`, streams service/consumer helpers, `docs/site/durable-workflows/streams.md` | schema/contract tests; doc lint + publish dry-run; real consumer; correlated OTEL                                   | Sol medium |
| W2-C  | #1202 + #1327        | DB scaffold uses the live endpoint and migrate success proves a created/applied artifact in TTY and headless modes             | `packages/cli/src/public/features/db/**`, scaffold DB templates, CLI E2E                                      | file + DB-state assertions; clean resource health; `scaffold.runtime`                                               | Sol low    |
| W3-A  | #1326                | Durable producer has bounded reconnect/readiness/buffer/shutdown semantics based on W2's event envelope                        | `packages/plugin-streams-core/src/application/create-durable-stream.ts`, runtime tests/telemetry              | initial/mid-session outage, ordering, overflow, cancel/stop, recovery, OTEL                                         | Sol medium |
| W3-B  | #1102 + #1197        | Intent-aware discovery is actually adopted when tools are attached; corpus result is bounded and measured                      | MCP search/capability tools, agent-init measurement fixtures/docs                                             | checked-in query corpus; non-zero real tool use; bounded top-k; negative attachment control                         | Sol low    |
| W3-C  | #1119                | AI rollout vocabulary no longer collides with release canaries                                                                 | `.llm/tools/agentic/**`, workflow/docs references                                                             | exhaustive reference scan + focused runtime/tool tests                                                              | Sol low    |
| W4-A  | #1333                | Default app is project-named and an executable, idiomatic Fresh/Fresh-UI reference                                             | frontend scaffold assets/templates, `packages/cli` scaffold tests, Fresh example routes                       | GLM design review; golden/type/lint; browser loading/error/empty/success; responsive light/dark; `scaffold.runtime` | Sol medium |
| W4-B  | #1208                | A focused runnable tutorial teaches the page builder and retained W4-A patterns                                                | `docs/site/tutorials/**`, examples/fixtures                                                                   | copyable example check; real route/browser flow; source/link alignment                                              | Sol low    |
| W4-C  | #1108                | Generated package references are mechanically checked against live export maps                                                 | docs/reference generator and export-map fixtures                                                              | seeded missing/renamed export fails; repaired inventory passes; docs links                                          | Sol low    |
| W5-A  | #1137 + #1138        | First-party contract summaries/tags and agent-facing reference match the shipped OpenAPI→MCP surface                           | first-party contracts, `packages/service/**`, `docs/site/**`                                                  | scoped contracts/service check; full doc lint/publish dry-run if exports move; link/source alignment                | Sol low    |
| W5-B  | #1332 + #1334        | Homepage/docs show DB-generated-schema→contract flow and the complete capability argument without catalog sprawl               | homepage and contracts/route/database docs + docs tests                                                       | multi-model typed fixture; responsive/tab/diagram browser proof; link/source alignment                              | Sol low    |

## Wave schedule and dependencies

| Wave        | Active supervisors (max 3) | Dependency / boundary                                                                                       |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| T1          | T1-A, T1-B                 | Repair inherited red PRs against canary.14 train; #1316 cannot merge without isolated runtime/OTEL evidence |
| T2          | T2-A, T2-B                 | Rebase/update after T1 train mutations; both currently green but still take current-base merge gates        |
| W1          | W1-A, W1-B, W1-C           | Starts after inherited train is coherent; W1-A must land before the first new publish                       |
| **Cut C14** | orchestrator only          | Train umbrella → main; derive membership; publish/verify canary.14                                          |
| W2          | W2-A, W2-B, W2-C           | Fresh canary.15 train from C14 main; independent clusters                                                   |
| W3          | W3-A, W3-B, W3-C           | W3-A depends W2-B; W3-B depends W1-C; W3-C independent                                                      |
| **Cut C15** | orchestrator only          | Train umbrella → main; publish/verify canary.15                                                             |
| W4          | W4-A, W4-B, W4-C           | W4-B consumes W4-A reference surface and therefore dispatches after W4-A merges, leaving two active lanes   |
| W5          | W5-A, W5-B                 | W5-B consumes #1332 and the W4-A/W4-B story; W5-A independent                                               |
| **Cut C16** | orchestrator only          | Final train → main; publish/verify canary.16; latest green pair becomes stable-cut prerequisite             |
| F           | evidence closures          | Re-query #1004/#1090/#1126/#1166/#1169; move any unearned row with reason; final stable release checklist   |

## Canary cost and release gates

Last authoritative post-canary.13 evidence is 1,076/4,000 attempts used after 35/35 packages were
published. No later canary publish exists at plan time. Three planned all-package cuts cost at most
105 base attempts before retries, leaving 2,819 attempts against that observed denominator. W1-A
must replace this arithmetic-only protection with an authenticated fail-closed preflight before
canary.14; if the preflight cannot prove sufficient headroom, the cut is blocked before minting.

At every cut:

1. Freeze membership from actual first-parent/merge history and update `cut-trace.md`.
2. Run the milestone pre-merge gate, close-gate, review-thread gate, changed-file docs audit, scoped
   static/fitness/consumer gates, and the single one-pass `scaffold.runtime` command.
3. Merge the train umbrella only after all child PR checks and acceptance evidence are current.
4. Dispatch the checked-in OIDC release workflow. Never publish locally.
5. Verify every expected JSR package at the emitted version, then require pinned `e2e-cli-prod` and
   `release/canary-pair` green. A red pair blocks promotion/cut and is fixed forward.
6. Record actual attempts, partial/full classification, workflow runs, content SHA, tag, and
   production E2E in `cut-trace.md`.

## Launch and evaluation contract

Before each wave, record provider state and paid-transport canaries. The 2026-08-06 baseline is:

- `agentic:routing-state`: canonical Minimax PLAN and Qwen IMPL routes, no persisted fallback.
- Minimax live canary: passed; tools 6, reasoning 26, streaming 31.
- Qwen live canary: passed; tools 6, reasoning 93, streaming 98.

Every Codex supervisor is launched only through `.llm/tools/agentic/` with bypass permissions. Its
slice record must contain worktree, branch, Codex thread id, observed model/effort, remote-control
connection proof, same-thread steering command, draft PR, and an actual CLI tmux attach command. If
supported runtime attachment is absent, record `failed/not-attached`, repair through
`agentic:runtime`, and do not substitute an invisible shell.

Each PR receives separate Qwen IMPL-EVAL after implementation gates. Grok 4.5 adversarial review is
additional and cannot replace Qwen. #1333 additionally requires the canonical GLM design lane.

## Open-decision sweep

| Decision                                        | Class                                                                            | Resolution owner                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| Exact publish-attempt reset/report API          | must resolve in W1-A before canary.14; would force release rework if deferred    | W1-A supervisor, evaluator, orchestrator |
| #1316 isolated AppHost/OTEL proof               | must resolve before merge                                                        | T1-B supervisor                          |
| #1333 final scaffold information architecture   | must resolve in design checkpoint before implementation; GLM review is mandatory | W4-A supervisor + design evaluator       |
| #1139 F2 opt-in                                 | safe to defer; currently out and moves to 0.0.6                                  | orchestrator                             |
| Evidence closures #1004/#1090/#1126/#1166/#1169 | safe until final cut because they require real cut/observation evidence          | orchestrator                             |
| Future MCP export/corpus breadth (#1201/#1260)  | safe to defer to 0.0.6; retained fixes do not depend on it                       | milestone 0.0.6                          |

## Risk register

| Risk                                                   | Mitigation                                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Inherited checks are green/red against stale base      | update each PR onto current train, require current SHA check rollup and review-thread gate            |
| #1315 catalog breaks generated child configs           | targeted child-project regression; no `catalog:` without root catalog                                 |
| #1316 reports unit green without real integration      | fixture third-party plugin, isolated AppHost, correlated OTEL, full install/remove lifecycle          |
| Publish quota half-publishes another immutable version | W1-A authenticated preflight and fail-before-mint; same-semver recovery policy; only three cuts       |
| Plugin/runtime work deepens accepted debt              | cite exact debt, run per-root doctrine/JSR audits, no new waiver/cast/ignore without registry entry   |
| Expensive Aspire/E2E gates collide                     | one expensive-gate holder at a time; leak-check before/after; leave unknown resources untouched       |
| UI scaffold becomes a giant showcase                   | GLM design checkpoint, progressive reference flow, browser state/responsive evidence, W4-B docs split |
| Observational rows are auto-closed by code             | no closing keywords; GraphQL closing-reference audit before every merge                               |
| Evaluator route silently falls back                    | live provider canary + route identity in artifacts; fail closed, never substitute                     |
| Delegated lane is not observable                       | supported runtime repair; explicit failed/not-attached state until bridge/tmux evidence exists        |

## Deferred scope

The eight named 0.0.6 moves, stable publication itself until canary.16 is green, all future
milestone work, broad doctrine remediation unrelated to changed files, and any new capability not
required by the acceptance above are outside this plan. Findings become linked issues with full
taxonomy/milestone; they do not expand an active PR silently.

## Post-C14 owner correction — authoritative continuation plan

This section supersedes the earlier train-target, W1-before-C14, always-PLAN-EVAL, Qwen-default, and
OpenHands statements above. Canary.14 is released and verified. From the first post-C14
implementation onward:

- Each meaningful, tightly connected issue cluster owns one draft PR directly against `main`, with
  an independent CI/review lifecycle. The orchestrator branch is coordination history only, never a
  code aggregation target.
- W1 is the first canary.15 dependency group: W1-A (#1312 + #1148), W1-B (#1024 + #1328), and W1-C
  (#1324 + #1330) remain separate direct-to-main PRs. Billing Run waits for canary.15 because
  canary.14 does not publish W1-B's consumer tooling/quality surface or W1-C's OpenCode MCP attach
  and provider-valid resume fixes; testing the demo earlier would exercise stale published code.
- PLAN-EVAL is used only for genuinely complex or decision-heavy work. Independent IMPL-EVAL stays
  mandatory. Its default is `deepseek/deepseek-v4-flash-0731` at max; only an OpenRouter-blocked
  lane may fall back through the checked-in AGY/Google toolchain to Gemini 3.6 Flash high.
- OpenHands remains paused until repaired. Preserve valid evidence, never rerun a valid PASS solely
  because a default changed, and repair only an actual failing current-head gate.
- Never overlap app-server and CLI/tmux resume writers for the same thread/worktree.

Exact first action after `/clear`: fetch and re-query `origin/main` plus #1312/#1148, then open the
W1-A direct-to-main draft PR from a fresh clean worktree; do not implement Billing Run yet.

---

# Wave plan v4 — stable-cut continuation (2026-08-08)

Supersedes v3's remaining wave schedule (W2 onward). Everything v3 records as landed stands; this
section re-baselines the _undispatched_ remainder against live `origin/main` and adds the strict
0.0.6/0.0.7 pull-forward sweep required before the plan is frozen.

## Re-baseline

| Fact                              | Value                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline                          | `origin/main@6c6044da9` (`chore(agentic): refresh native model routing`, #1391)                                                                                                                                                 |
| Latest published canary           | `0.0.5-canary.16`, release commit `94feaea3b`, source `fac9e3390`                                                                                                                                                               |
| Canary.16 pair                    | publish [31201279314](https://github.com/rickylabs/netscript/actions/runs/31201279314) + pinned E2E [31201560939](https://github.com/rickylabs/netscript/actions/runs/31201560939), both success; `release/canary-pair` success |
| Unshipped on main since canary.16 | exactly one merge: #1391 (`6c6044da9`)                                                                                                                                                                                          |
| Open 0.0.5 issues                 | 21                                                                                                                                                                                                                              |
| Open 0.0.5 PRs                    | #1337 only (superseded orchestration artifact PR)                                                                                                                                                                               |
| Landed since v3 froze             | W1-A #1341 (#1312/#1148), W1-B #1342 (#1024/#1328), W1-C #1344 (#1324/#1330), canary.15 repair #1346 (#1345), routing refresh #1391                                                                                             |

## Strict 0.0.6 / 0.0.7 pull-forward sweep

One sweep, performed 2026-08-08 over all 32 open 0.0.6 and 12 open 0.0.7 issues. Test applied:
**critical AND bounded AND low-risk AND directly repairs a public surface the stable release depends
on.** Every candidate examined is dispositioned below; silence is not a disposition.

### Pulled forward into 0.0.5 (5)

| Issue      | From  | Why it crosses the bar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Lands in |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| #1373 (p0) | 0.0.6 | The golden path is the stable release's core promise and it is unfollowable: the quickstart's closing instruction sends a first-time reader to `apps/<app>/client.ts`, which is the Fresh **CSS entry**; `lib/api-clients.ts` is taught on 10 published pages and written by no generator; two incompatible query dialects are each taught as "the" spine; `service add <name> --with-client` emits `exampleService*` symbols for every service. Its own Boundaries clause scopes it away from restructuring the default app, so it is bounded to docs + one template + a CLI test + two negative gates. Largest of the five — recorded as such. | W5-A     |
| #1356 (p1) | 0.0.7 | Every `ui:*` command resolves the **workspace** root while `init` installs the registry into `apps/<app>/`, so the advertised UI surface writes outside the Fresh app; the published how-to documents an `--app` flag that does not exist; the repo's own E2E gate asserts the wrong root, so CI is green _because_ it encodes the defect. Bounded: one shared app-root resolver, `--app` on five commands, fix the gate.                                                                                                                                                                                                                        | W4-B     |
| #1375 (p1) | 0.0.6 | `agent init --with-docs` installs a docs bundle that the `.mcp.json` it emits cannot reach — no `--docs-root`, no probe — leaving `search_docs` at two documents. This is the _mechanism_ under retained #1197/#1102; without it those two measure a structurally broken surface. Bounded to `writeHostConfig` + a probe + tests.                                                                                                                                                                                                                                                                                                                | W3-B     |
| #1376 (p1) | 0.0.6 | `execute_command` in the CLI-hosted MCP server spawns `jsr:@netscript/cli@<MCP version>` instead of re-entering the host CLI, and reports `version: "current"`, so an agent scaffolds from a different binary than the one it documents. Published-package correctness on the same surface as #1375.                                                                                                                                                                                                                                                                                                                                             | W3-B     |
| #1359 (p1) | 0.0.7 | Generated `appRoutes.crudExample` aliases `serviceExample`, so both example cards navigate away from the CRUD page the scaffold also emits, and a template test asserts the alias verbatim. One template line, one test, one structural check — and it sits inside #1333's surface.                                                                                                                                                                                                                                                                                                                                                              | W4-A     |

### Rejected — stay in their milestone (rationale recorded)

| Issue                                                                                                                                              | Rejection rationale                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1357 (0.0.7, p1)                                                                                                                                  | Its own target contract calls it "the minimal composable core of the #1354 slice". Making `ui:add page --island` emit a real data screen is a **feature** gated on the #1354/#1355 SDK generator design; not quick, not bounded.                          |
| #1358 (0.0.7, p1)                                                                                                                                  | Gallery lists 50 of 66 registry items. Real, but it needs a registry↔gallery conformance gate that does not exist; not a one-line repair, and not on the golden path.                                                                                     |
| #1360 (0.0.7, p2)                                                                                                                                  | `initialDataUpdatedAt` depends on #1357's triad. p2.                                                                                                                                                                                                      |
| #1349–#1355, #1361 (0.0.7)                                                                                                                         | The SDK contribution-chain program, still at RFC/review status (#1348, #1361, draft PRs #1389/#1390). Architectural; explicitly out.                                                                                                                      |
| #1379 (0.0.6, p1)                                                                                                                                  | Turning root check/lint on for the excluded `packages/fresh-ui` is unbounded — the error count is unknown until it runs, and it overlaps the #1278 type-soundness umbrella.                                                                               |
| #1378, #1374 (0.0.6, p1)                                                                                                                           | Gate/tooling improvements (`quality:scan` blind spots; `docs:accuracy` is a needle checker). They improve _how we check_, not the shipped surface. #1373's negative gates are implemented on the existing needle infrastructure and do not wait on #1374. |
| #1377, #1380 (0.0.6, p2)                                                                                                                           | Reference-page IA and doctrine verdict-table drift. Docs debt, not a release blocker.                                                                                                                                                                     |
| #1343 (0.0.6, p1)                                                                                                                                  | Deliberately deferred at the canary.16 recovery as an _installed-consumer observation_ against a post-fix canary. Correctly placed; closing it needs a canary that does not exist yet.                                                                    |
| #1373-adjacent #1335                                                                                                                               | Repo-wide generated-surface conformance sweep — out by #1373's own boundary.                                                                                                                                                                              |
| #1306, #1296, #1293, #1280, #1278, #1263, #1262, #1260, #1246, #1243, #1210, #1201, #1163, #1175, #1140, #1139, #1112, #1093, #1085, #1320 (0.0.6) | p2/p3 hardening, blocked-on-upstream, new-capability, or verification rows with no stable-release dependency. #1163 (verify: 0.0.5 runs on the orchestrator profile) is observational on _this_ run and belongs in 0.0.6 by construction.                 |

**Scope after the sweep: 26 issues** — 21 retained + 5 pulled forward. No 0.0.5 issue is moved out
by this plan.

## Frozen groups and dependency order

One draft PR per group, **direct to `main`**, independent CI/review lifecycle. The orchestrator
branch is coordination history only. Max three active supervisors per wave.

| Group    | Issues                                   | Proves                                                                                                                                                                                                   | Route                            | Depends on                                            |
| -------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| **W2-A** | #1325                                    | Generated triggers background runtime registers the configured KV adapter and reaches real health on both Redis/Garnet and Deno KV                                                                       | Sol low                          | —                                                     |
| **W2-B** | #1329                                    | One exported versioned SSE event envelope governs server, Fresh consumer, docs, offsets and trace context                                                                                                | Sol medium                       | —                                                     |
| **W2-C** | #1202 + #1327                            | Scaffolded DB binds the live Postgres endpoint, and `db migrate` success proves a created/applied artifact in TTY **and** headless modes                                                                 | Sol low                          | —                                                     |
| **W3-A** | #1326                                    | `DurableStreamProducer` has bounded reconnect / readiness / buffer / shutdown semantics on W2-B's envelope                                                                                               | Sol medium                       | W2-B                                                  |
| **W3-B** | #1102 + #1197 + #1375 + #1376            | The agent MCP surface is reachable and honest: emitted config finds the installed corpus, `execute_command` re-enters the host CLI at its real version, and intent-aware discovery is measurably adopted | Sol medium                       | —                                                     |
| **W3-C** | #1119                                    | AI-rollout "canary" vocabulary no longer collides with release canaries                                                                                                                                  | Sol low                          | —                                                     |
| **C17**  | —                                        | Canary publish + pinned production E2E green pair                                                                                                                                                        | orchestrator                     | W2, W3                                                |
| **W4-A** | #1333 + #1359                            | Default scaffolded app is project-named, idiomatic, and every generated link reaches the page it names                                                                                                   | Sol medium + GLM 5.2 design pass | C17                                                   |
| **W4-B** | #1356                                    | `ui:*` resolves an **app** root, `--app` exists on every `ui:*` command, and the E2E gate asserts the app-relative paths                                                                                 | Sol low                          | C17                                                   |
| **W4-C** | #1108                                    | Generated package references are mechanically checked against live export maps                                                                                                                           | Sol low                          | C17                                                   |
| **W5-A** | #1373                                    | Exactly one data-layer module name and one query dialect on the golden path, enforced by negative gates                                                                                                  | Sol medium                       | W4-A (module-name coordination, per #1373 Boundaries) |
| **W5-B** | #1137 + #1138                            | First-party contract summaries/tags and the agent-facing OpenAPI→MCP reference match the shipped surface                                                                                                 | Sol low                          | —                                                     |
| **W5-C** | #1332 + #1334                            | Homepage and data docs show the generated-DB-schema → contract flow and the complete capability argument                                                                                                 | Sol low                          | —                                                     |
| **W5-D** | #1208                                    | A runnable tutorial teaches the page builder on W4-A's reference patterns and W5-A's ratified naming                                                                                                     | Sol low                          | W4-A, W5-A                                            |
| **C18**  | —                                        | Final canary publish + pinned production E2E green pair; **this pair is the stable-cut prerequisite for the same content**                                                                               | orchestrator                     | W4, W5                                                |
| **F**    | #1004, #1090, #1126, #1166, #1169, #1338 | Evidence / observational / umbrella hand-closure or move-with-reason                                                                                                                                     | orchestrator                     | C17, C18                                              |
| **Cut**  | —                                        | `release:cut 0.0.5` → `release:publish v0.0.5`                                                                                                                                                           | orchestrator                     | C18 green pair, no merge after C18                    |

## Canary points — declared

Two remaining boundaries, not three. **C17** at the W3 boundary and **C18** at the W5 boundary; the
stable cut consumes C18's pair, so **no merge may land between C18 and the cut**
(`netscript-release`: "no `release:publish` without a green canary pair for the same content").
Membership at each point is computed from first-parent merge history by `release:canary-label`,
never from this table — a PR that lands out of plan order is still in the payload. Canary.16's
payload therefore already excludes #1391, which becomes the first row of C17's payload.

The two owner-undecided cadence questions in `canary-cadence.md` are **not** resolved by this plan.
This run's recorded decision: canary at every wave boundary where a boundary exists (both of them),
and a failed canary blocks only the cut, not the next dispatch — recorded as a run decision, not
promoted to a rule.

## Lane bindings for v4

Superseding v3 rows 6–7. Routes are taken from `lane-policy.md` as rendered by
`agentic:routing-state` on 2026-08-08 — the OpenRouter formal-evaluator defaults recorded in v3
(Minimax PLAN / Qwen→DeepSeek IMPL) are now the `open_only` **escalation**, not the default.

| Purpose                                   | Route                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Orchestration (`planning_decisions`)      | Claude · Anthropic · Opus 5 · high (this session, `/rc` enabled)                                                                            |
| Implementation                            | Codex · GPT-5.6 Sol · low/medium per the group table                                                                                        |
| Ordinary adversarial review of Codex work | Fable 5 · low (Sol·medium impl) / Opus 5 · high (Sol·low impl), per the #794 pairing ladder                                                 |
| **IMPL-EVAL** (mandatory, every group)    | Native opposite-family: **Fable 5 · medium** evaluates Codex-authored work                                                                  |
| **IMPL-EVAL** of Claude-authored work     | Codex · GPT-5.6 Sol · xhigh                                                                                                                 |
| PLAN-EVAL (conditional)                   | Codex · GPT-5.6 Sol · high for Claude-authored plans                                                                                        |
| Escalation only                           | OpenRouter Minimax M3 high (PLAN) / DeepSeek V4 Flash 0731 max (IMPL) — third opinion or native quota block; then AGY Gemini 3.6 Flash high |
| Major UI/UX (#1333)                       | GLM 5.2 · `claude-design-glm-5-2` · xhigh design pass — mandatory, not optional                                                             |
| OpenHands                                 | paused by owner; not in this run                                                                                                            |

## PLAN-EVAL decision for v4

**Selected.** The v3 wave plan passed a separate Minimax M3 PLAN-EVAL, but v4 changes milestone
scope (five pull-forwards), regroups the undispatched remainder, and reduces three declared canary
points to two with a stable-cut coupling. That is decision-heavy and wide. Route: **Codex · GPT-5.6
Sol · high** (opposite family — v4 is Claude-authored), separate session.

W2 is dispatched **without waiting** on that verdict: W2-A/W2-B/W2-C are the three v3 clusters
already covered by the v3 `PASS`, unchanged in scope, membership and route. Nothing v4 adds touches
them. The pull-forward milestone moves are applied only after the v4 verdict.

---

# Wave plan v4.1 — repair after `FAIL_PLAN` (2026-08-09)

The v4 section above went to a separate-session PLAN-EVAL on **Codex · GPT-5.6 Sol · high**
(opposite family; v4 is Claude-authored) and returned **`FAIL_PLAN`** — three blockers and four
findings, recorded at `plan-eval-v4.md`. Every finding was checkable and every one of them held.
v4.1 is the repair. Where v4.1 contradicts v4, v4.1 governs; v4 is not rewritten, because the record
of what was wrong is the point.

## What the evaluation falsified

| Finding                                                   | What was actually true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCKER 1 — the re-baseline is false                      | `main` had advanced again to `a6b2e4c31` (#1215); **four** merges sit behind canary.16, not one; and the claim that none touches `packages/**` was **wrong** — `6c6044da9` includes `packages/bench/bench.config.ts` and three `packages/fresh-ui/tests/**` files. `cut-trace.md` had also been left at canary.14 while W1, canary.15, canary.16 and five merges landed, against `milestone-run.md`'s requirement that the trace be kept live. Corrected in `cut-trace.md` § W1 and the canary.15/canary.16 boundary and in `worklog.md`. |
| BLOCKER 2 — W3-B cannot close four issues in one PR       | #1376's own Boundaries section says #1375 owns a change in the same composition root and the two **must remain separable**: "do not fold either into the other's PR." v4 folded them. #1375 is also not "`writeHostConfig` + a probe + tests" — it has eleven acceptance rows including a generated embedded fallback corpus, version provenance, a size budget, and precedence behaviour. #1197 is observational and cannot close by any PR.                                                                                             |
| BLOCKER 3 — the closure manifest is incomplete            | #1202, #1197, #1333 and #1208 all have rows their own briefs say a PR cannot close, and none appeared in stage F. #1126 has open children #1139/#1140 in 0.0.6, so it cannot be hand-closed in 0.0.5 at all.                                                                                                                                                                                                                                                                                                                              |
| HIGH 4 — sweep dispositions                               | 0.0.6 has **31** open _issues_ (the 32nd milestone row was PR #1215, since merged); #1361 is in 0.0.6, not 0.0.7. Three rejections were reasoned from false premises — see the re-adjudication below.                                                                                                                                                                                                                                                                                                                                     |
| HIGH 5 — no slice tables or briefs for changed groups     | The slice dirs still held v3 briefs naming **Qwen** evaluation, and no brief existed for any pulled-forward issue.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| HIGH 6 — the new sequencing gates can silently do nothing | The expensive-gate protocol had no holder, no acquisition predicate, and no state distinguishing a granted run from an ungranted one; the milestone-move step had no receipt and no dispatch predicate.                                                                                                                                                                                                                                                                                                                                   |
| MEDIUM 7 — dependencies and canary rationale              | W5-A needs a _decision_ from W4-A, not a merge; W5-C is not independent — its own brief inherits W4's visual language, which also raises a GLM question; and v4 claimed a canary at every wave boundary while cutting after only two of four.                                                                                                                                                                                                                                                                                             |

Two v4 claims the evaluation **confirmed** and which therefore stand: the canary.16 green pair
(publish `31201279314`, pinned E2E `31201560939`, `release/canary-pair` success, non-draft
prerelease), and the v4 lane table against `agentic:routing-state` with no persisted transition.

## Re-baseline

| Fact                  | Value                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------- |
| Baseline              | `origin/main@a6b2e4c31d80405d5225887cde7ab61baa2802f8` (#1215)                          |
| Behind canary.16      | four merges: `6c6044da9` #1391, `bb10be0e2` #1337, `c383b2e84` #1347, `a6b2e4c31` #1215 |
| Touches `packages/**` | `6c6044da9` only (bench config + three `fresh-ui` test files)                           |
| Open 0.0.5 issues     | 21                                                                                      |
| Open 0.0.5 PRs        | #1392 (orchestration), #1393 / #1394 / #1395 (W2)                                       |
| Open 0.0.6 issues     | 31 · open 0.0.7 issues: 12                                                              |

Every open W2 PR is based on `c383b2e84` and must be verified against `a6b2e4c31` before merge; that
is a per-PR pre-merge gate item, not a re-dispatch.

## Sweep re-adjudication

Three v4 rejections were reasoned from premises the evaluator falsified. Re-decided on the evidence:

- **#1343 — pulled into 0.0.5, stage F.** v4 rejected it because "such a canary does not exist yet".
  It does: #1342 merged as `1455231b0`, which is an ancestor of canary.16's source `fac9e3390`, and
  the canary.16 receipt records a published-CLI production E2E. #1343's single acceptance row — from
  a clean directory **outside** the framework checkout, install the exact canary with no
  local-source fallback and run the full installed-consumer scaffold smoke — is executable now and
  is not what the in-repo CI E2E proves. For a stable release this is the highest-value single
  observation available, and it is orchestrator-executable. It closes by hand in F, against C17 or
  later.
- **#1379 — pulled into 0.0.5 as its own W4 group.** v4 rejected it as unbounded because "the error
  count is unknown until the check runs". The issue records that the package-local check **passes
  today** and offers two bounded lock policies (join-root-lock or frozen-private-lock), with ten
  red-first acceptance rows. It is load-bearing: `packages/fresh-ui` is a **published** package in
  no CI job, and W4-A is the release's largest change to that surface. Shipping a stable release
  with a published package unchecked by any workflow is not defensible.
- **#1373 — stays in 0.0.5; #1374 is _not_ pulled.** The evaluator was right that fixed-string
  needles cannot prove a compile claim. But the compile assertion lives in #1373's _Docs/consumer
  proof_ prose, not in its acceptance: all **twelve** `- [ ]` boxes are naming, dialect, alias,
  template-symbol, CLI-test and negative-gate rows, every one of which a needle gate can prove. The
  adjudication is recorded as a comment on #1373 itself — the compile-proof sentence is #1374-owned
  and is not acceptance for this milestone — so the issue and the plan agree. If that comment is
  refused, #1373 moves to 0.0.6 with #1374 rather than shipping an unprovable box.

## Scope after v4.1 — 26 issues

21 retained **−** #1126 (moves to 0.0.6: its children #1139/#1140 are open there, and `netscript-pr`
closes an epic by hand only once every child is done) **+** #1373, #1356, #1375, #1376, #1359 (v4)
**+** #1343, #1379 (v4.1).

**Scope-drift checkpoint**, recorded as a decision rather than discovered later: v4 moved 21 → 26
and v4.1 moves it to 26 by a different composition, with one issue leaving. Every addition after v4
was forced by a checkable dependency the evaluation surfaced, not by preference. This is the last
scope change; further findings become linked 0.0.6 issues.

## Frozen groups — v4.1

W2 is unchanged and already dispatched. W3-B is split three ways; W4 gains #1379; W5 loses its
serialisation behind W4-A.

| Group                      | Issues                                          | Closing keyword                  | Depends on                                                                                                                          |
| -------------------------- | ----------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| W2-A _(dispatched, #1394)_ | #1325                                           | `Closes #1325`                   | —                                                                                                                                   |
| W2-B _(dispatched, #1395)_ | #1329                                           | `Closes #1329`                   | —                                                                                                                                   |
| W2-C _(dispatched, #1393)_ | #1327 + #1202                                   | `Closes #1327`, **`Refs #1202`** | —                                                                                                                                   |
| **C17**                    | canary at the W2 boundary                       | —                                | W2 landed                                                                                                                           |
| W3-A                       | #1326                                           | `Closes #1326`                   | W2-B envelope                                                                                                                       |
| W3-B1                      | #1102                                           | `Closes #1102`                   | declared independent of #1375's corpus parity; if implementation finds otherwise it is a rescope, not a silent dependency           |
| W3-B2                      | #1375                                           | `Closes #1375`                   | — (kept separable per #1376's Boundaries)                                                                                           |
| W3-B3                      | #1376                                           | `Closes #1376`                   | — (kept separable per #1376's Boundaries)                                                                                           |
| W3-C                       | #1119                                           | `Closes #1119`                   | —                                                                                                                                   |
| **C18**                    | canary at the W3 boundary                       | —                                | W3 landed                                                                                                                           |
| W4-A                       | #1333 + #1359                                   | `Closes #1359`, **`Refs #1333`** | C18; GLM 5.2 design pass mandatory                                                                                                  |
| W4-B                       | #1356                                           | `Closes #1356`                   | C18                                                                                                                                 |
| W4-C                       | #1108                                           | `Closes #1108`                   | C18                                                                                                                                 |
| W4-D                       | #1379                                           | `Closes #1379`                   | dispatched **before** W4-A touches `packages/fresh-ui`, so the published package is in CI before the release's largest change to it |
| **C19**                    | canary at the W4 boundary                       | —                                | W4 landed                                                                                                                           |
| W5-A                       | #1373                                           | `Closes #1373`                   | **the locked module name only** — not W4-A's merge                                                                                  |
| W5-B                       | #1137 + #1138                                   | `Closes #1137`, `Closes #1138`   | —                                                                                                                                   |
| W5-C                       | #1332 + #1334                                   | `Closes #1332`, `Closes #1334`   | W4-A's **accepted design checkpoint**; see the GLM disposition below                                                                |
| W5-D                       | #1208                                           | **`Refs #1208`**                 | W4-A, W5-A                                                                                                                          |
| **C20**                    | final canary; the stable cut consumes this pair | —                                | W5 landed; **no merge between C20 and the cut**                                                                                     |
| **F**                      | closure manifest below                          | —                                | C17–C20                                                                                                                             |

Waves keep at most three active supervisors; W4 has four groups, so W4-D dispatches first and W4-A
follows it into the freed lane.

### The locked decision W5-A depends on

**`apps/<app>/lib/<service>.ts` is the data-layer module name.** #1373 already ratifies it and
#1373's Boundaries require only that the two issues _coordinate the name before either lands_ — not
that one merges first. Locking it here converts a merge dependency into a decision dependency, so
W5-A is not serialised behind the release's largest frontend PR. W4-A is bound to this name; if W4-A
finds it wrong, that is a rescope raised to the orchestrator, not a unilateral change.

### GLM disposition for W5-C

`lane-policy.md` makes the GLM 5.2 design pass mandatory for significant frontend UX, and #1334
changes the homepage's visual hierarchy, diagrams, tabs, responsive states and signature
interaction. W5-C is therefore **constrained to reuse W4-A's already-accepted design** — tokens,
type scale, layout — and introduces no new major UI/UX. If W5-C's implementation needs to depart
from that language, it takes its own GLM 5.2 adversarial pass before merge. The constraint goes in
the brief so the lane cannot resolve it by habit.

## Closure manifest — every retained issue has exactly one path

No code PR carries a closing keyword for any row below. Each names the event, the evidence, the
authority, and what happens if the event does not occur.

| Issue     | Event that closes it                                                                                                                                    | Evidence                                                                                                     | If it does not occur                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| #1004     | a real same-semver canary recovery, or a reasoned finding that the lane still lacks one                                                                 | recovery run ids + registry verification                                                                     | move to 0.0.6 intact                                                                           |
| #1090     | an unprompted agent behavioural trial after the W3 agent surface is published                                                                           | trial transcript with tool-call counts                                                                       | move to 0.0.6                                                                                  |
| #1166     | a canary payload that includes work landing behind a merge commit                                                                                       | `release:canary-label` payload vs first-parent history                                                       | move to 0.0.6                                                                                  |
| #1169     | one-pass publish demonstrated across C17–C20 without rerun                                                                                              | four canary receipts                                                                                         | move to 0.0.6                                                                                  |
| #1197     | a re-measured real agent run after #1375/#1376/#1102 are **published** in a canary                                                                      | before/after MCP call counts from a real run                                                                 | move to 0.0.6                                                                                  |
| #1202     | owner-machine identification of the colliding service on the fixed low port **with it present**, plus three consecutive clean `scaffold.runtime` passes | port/service capture + three raw exit codes                                                                  | move to 0.0.6; W2-C's code fix ships regardless                                                |
| #1208     | Phase 1 ships in W5-D; **Phase 2 is a separate follow-up by the issue's own definition**                                                                | W5-D carries `Refs #1208`                                                                                    | Phase 2 is filed as a 0.0.6 issue and #1208 closes only if Phase 2 is explicitly dispositioned |
| #1333     | a measured Quickstart agent smoke after W4-A merges and publishes                                                                                       | smoke receipt                                                                                                | move to 0.0.6; W4-A's code ships regardless                                                    |
| #1338     | T1 observational closure                                                                                                                                | already-landed policy evidence                                                                               | move to 0.0.6                                                                                  |
| #1343     | orchestrator runs the installed-consumer smoke from a clean directory outside the checkout against a published canary                                   | receipt: exact version, provenance, command, working root, per-step verdicts, raw exit code, cleanup outcome | move to 0.0.6                                                                                  |
| **#1126** | **moves to 0.0.6 now** — children #1139/#1140 are open there                                                                                            | —                                                                                                            | —                                                                                              |

## Milestone-move receipt

The five v4 pulls plus #1343 and #1379 move to milestone 0.0.5, and #1126 moves to 0.0.6, **only
after v4.1 passes re-evaluation**. The move is not complete until `worklog.md` records the exact
before/after milestone for each of the eight issues, queried live. **W3 does not dispatch until that
receipt exists**; its absence is the failure state, and it is visible because the receipt is a
required artifact rather than an assumed side effect.

## Expensive-gate serialisation

Superseded: v4 referred to a "token" with no holder. The mechanism is now the ledger at
`expensive-gate-log.md` — one holder, orchestrator-only grants, a required grant row that precedes
the run, and the explicit rule that **a `scaffold.runtime` result with no preceding grant row is not
admissible evidence, pass or fail**. Per owner decision 2026-08-09 this stays a recorded protocol; a
reusable gate tool is deferred to a post-stable issue and is not on the 0.0.5 critical path.

## Canary boundaries — corrected to four

v4 claimed a canary at every wave boundary while declaring only two. Corrected: **C17 (W2), C18
(W3), C19 (W4), C20 (W5)** — one per dispatch wave, which is what `canary-cadence.md` means by a
boundary and what its asserted every-boundary preference favours. The stable cut consumes C20's pair
for the same content, so no merge may land between C20 and the cut. Publish-attempt cost is not the
constraint (roughly 35 attempts per all-package cut against thousands remaining); the real cost is
production-E2E wall clock, which runs in CI and not in a dispatch lane. Membership at every point is
computed by `release:canary-label` from first-parent history, never from this table. The two
owner-undecided cadence questions remain this run's recorded decisions, not promoted rules.

## Briefs and slice tables

Every v3 brief for a group that v4/v4.1 changed is **stale and must not be dispatched** — they name
Qwen evaluation, retired cluster membership, and superseded canary boundaries. Before each wave
dispatches, its groups get a v4.1 brief carrying: the native Fable IMPL-EVAL lane, the exact
membership and closing keywords above, an ordered commit-slice table with files and the proving gate
per slice, the archetype/overlay and JSR surface for the touched packages, and the group's known
environmental hazards. W2's three briefs already meet this bar and are the template. No group
dispatches on a v3 brief.

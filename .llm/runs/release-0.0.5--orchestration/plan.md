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

This section supersedes the earlier train-target, W1-before-C14, always-PLAN-EVAL, Qwen-default,
and OpenHands statements above. Canary.14 is released and verified. From the first post-C14
implementation onward:

- Each meaningful, tightly connected issue cluster owns one draft PR directly against `main`, with
  an independent CI/review lifecycle. The orchestrator branch is coordination history only, never
  a code aggregation target.
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

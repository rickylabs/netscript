# PLAN-EVAL — release-0.0.5--orchestration

- Plan evaluator session: minimax/minimax-m3, high effort, claude-openrouter / claude-print
  (formal_plan_evaluation route, `claude-evaluator-minimax-m3` preset), separate session from the
  Codex supervisor; current date 2026-08-06
- Run: `release-0.0.5--orchestration`
- Surface / archetype: Mixed package/plugin wave — A6 CLI/tooling (CLI/scaffold/release/agentic), A5
  plugin + service overlay (linking, triggers), A3 runtime folded into A5/core (streams), A1 small
  contract (focused spots); SCOPE-frontend applied to #1333/#1334, SCOPE-service to plugin
  linking/triggers/streams, SCOPE-docs to narrative/reference
- Scope overlays: docs, frontend, service
- Draft PR: #1337 (`status:plan-eval`, milestone 23, no closing keyword)
- Baseline re-confirmed: `origin/main@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`, continuation branch
  equals main, clean working tree

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` exists; explicitly re-baselined against `origin/main@2508eb8c` (lines 4-10); legacy Claude run at `8399126ef` recorded as orientation only; GraphQL `totalCount` on milestone 23 confirms 38 open issues, matching the plan's tally                                                                                                                                                                                                                                                                                                                                                           |
| Decisions locked                        | PASS   | `plan.md` §"Locked decisions" enumerates 10 decisions with rationale (milestone rollover, scope reduction to 30, canary.14 train base, supervisor/wave cap of 3, default Codex Sol low, PLAN/IMPL evaluator lane split, orchestrator merge authority, three-cut cadence, observation/umbrella hand-closes, F2-gate exclusion)                                                                                                                                                                                                                                                                               |
| Open-decision sweep                     | PASS   | `plan.md` §"Open-decision sweep" classifies each open decision "must resolve" vs "safe to defer" (publish-attempt reset API in W1-A, #1316 OTEL proof before merge, #1333 IA in W4-A design checkpoint with mandatory GLM review, etc.); no open decision I find that would force rework if deferred was missed                                                                                                                                                                                                                                                                                             |
| Commit slices (< 30, gate + files each) | PASS   | 18 PR clusters: T1×2 (inherited), T2×2 (inherited rebase/merge), W1×3, W2×3, W3×3, W4×3, W5×2 — all under the 30-cap; every slice row names Issues, Proves, Expected paths, Decisive gates, Route                                                                                                                                                                                                                                                                                                                                                                                                           |
| Risk register                           | PASS   | `plan.md` §"Risk register" covers stale-base checks, generated-child catalog regression, #1316 unit-vs-real-integration gap, partial-publish budget exposure, plugin/runtime debt deepening, expensive-gate contention, UI-scaffold showcase drift, observational auto-close trap, evaluator-route silent fallback, delegated-lane invisibility — each with mitigation                                                                                                                                                                                                                                      |
| Gate set selected                       | PASS   | `plan.md` archetype/overlay matrix (5 cluster families) names archetype + overlay + doctrine verdict + debt + decisive gate set per cluster; A6 promotion complete + open accepted CLI debt (maintainer-mode mixing, no-permissions-doc), A5 plugin + service overlay for linking/triggers, A3 folded for streams, A1 for typed contract surfaces; `scaffold.runtime`, generated-consumer compile, doc lint + publish dry-run, F-CLI-1..31 manual evidence, GLM 5.2 design review for #1333, F-13 runtime invariants, F-14 console-log lint on streams/watcher producers all attached to the right clusters |
| Deferred scope explicit                 | PASS   | `plan.md` §"Deferred scope" names the 8 moves to milestone 25 (#1085, #1093, #1112, #1139, #1201, #1210, #1260, #1293) plus stable publication until canary.16 green, plus all future-milestone work, plus broad doctrine remediation not tied to changed files; the 14 non-frontend rows that landed in milestone 25 by the run's rollover are visible in `research.md` §"Milestone rollover post-mutation verification"                                                                                                                                                                                   |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `plan.md` §"JSR rubric applied to every package/plugin cluster" enumerates scoped names, explicit exports, isolatedDeclarations annotations, no new slow-type waivers, internal self-imports stay relative, generated assets checked-in constants, no top-level filesystem resolution over `jsr:`/`https:`, `publish:dry-run` static-only, canary requires real OIDC publish + pinned `e2e-cli-prod`; `plugin-streams-core` AP-13 console-warn debt is correctly called out as **replace, not deepen**, by W3-A                                                                                             |

## Open-decision sweep (evaluator-run)

I re-walked the plan's "Open-decision sweep" table and the per-slice rows. I found no decision the
plan left open that would force rework if deferred:

- **Exact publish-attempt reset/report API (W1-A)** — must resolve before canary.14, marked
  `must resolve`. Correct: `deno publish` is atomic per-package; the reset boundary and the
  partial-publish classification API are the load-bearing contract for every subsequent cut and must
  not slip into W2.
- **#1316 isolated AppHost/OTEL proof (T1-B)** — must resolve before merge. Correct: close-gate
  already correctly blocks on issue #1189 acceptance box 5 and the PR DoD boxes; if the fixture
  third-party service call and correlated OTEL evidence are not produced, the merge is unproven, not
  clean (per the milestone-run pre-merge gate, check 1–2).
- **#1333 final scaffold information architecture (W4-A)** — must resolve in design checkpoint
  before implementation; GLM review mandatory. Correct: a scaffold IA chosen late would invalidate
  every reference path W4-B consumes and would force a W5 docs rewrite. The plan attaches GLM 5.2
  xhigh design review (`major_ui_ux_design`) and the explicit
  `browser loading/error/empty/success` + responsive light/dark gate, which is the right closure
  bar.
- **#1139 F2 opt-in** — safe to defer, moves to 0.0.6. Correct: the F2 helper-reinvention gate has
  not flipped, so the feature is out of scope for this release.
- **Evidence closures #1004 / #1090 / #1126 / #1166 / #1169** — safe until final cut. Correct: each
  requires real canary/observation evidence (a completed cut for #1004 and #1166, a wave-five ship
  observation for #1090, all retained children/one-pass evidence for #1126 and #1169). Routing any
  of these to a closing keyword before that evidence lands would auto-close by code, which the plan
  explicitly forbids.
- **Future MCP export/corpus breadth (#1201/#1260)** — safe to defer to 0.0.6. Correct: retained
  fixes (#1117/#1102/#1108) cover the agent-legibility MVP without depending on corpus expansion.

The plan also flags (in "Locked decisions" #10 and the worklog's canary-cadence section) that no
code PR may carry a closing keyword for #1004/#1090/#1126/#1166/#1169, and that the train umbrella
PR carries no closing keyword either. This is the correct application of `netscript-pr` § "Closing
keyword" to the umbrella + observation class.

## Spot-check verifications (per prompt)

- **38 open 0.0.5 issues appear in exactly one disposition class.** PASS. GraphQL `totalCount` on
  milestone 23 = 38. The plan's disposition table lists 21 new implementation PR issues + 4
  existing-train-PR issues + 3 evidence/observational hand-close + 2 umbrella hand-close + 8 moves
  to 0.0.6 = 38. No issue is double-counted; no issue is omitted. (Cross-checked every issue number
  against the GitHub open list returned by GraphQL.)
- **The eight proposed 0.0.6 moves are justified and do not conceal a 0.0.5 blocker.** PASS.
  #1085/#1093 are p2 hardening/extension; #1112+#1293 move together because the honest MySQL example
  needs a net-new exported adapter/error-hook contract (larger than a docs-only fix); #1139 is
  explicitly F2-gated; #1201/#1260 add new corpus/export surfaces after the retained adoption fixes;
  #1210 is the broad competitive-program while the focused p0 #1208 stays. None of the moves removes
  a release-blocking acceptance.
- **Every retained implementation row is owned by exactly one of the 18 PR clusters.** PASS. The 18
  clusters (T1-A, T1-B, T2-A, T2-B, W1-A, W1-B, W1-C, W2-A, W2-B, W2-C, W3-A, W3-B, W3-C, W4-A,
  W4-B, W4-C, W5-A, W5-B) own 4 inherited train-PR issues + 21 new-impl issues = 25 issues, every
  one appearing once. No overlap.
- **The T1/T2 inherited-PR repair sequence and every later dependency are honest.** PASS. T1/T2 must
  repair against `canary/0.0.5-canary.14` before W1 starts (the branch exists at `2508eb8c9` per
  GitHub API, retargeted from the colliding canary.13). W1-A must land before the first new publish
  (canary.14). W3-A depends on W2-B (streams contract first, reconnect runtime second — verified
  against `packages/plugin-streams-core` AP-13 debt and the `#connect`/`#appendEvent` path in
  `create-durable-stream.ts`). W3-B depends on W1-C (intent-aware discovery needs the OpenCode MCP
  attach). W4-B depends on W4-A (tutorial consumes the reference surface). W5-B depends on #1332 +
  W4-A/W4-B narrative.
- **No implementation wave exceeds three supervisors.** PASS. T1=2, T2=2, W1=3, W2=3, W3=3, W4=2–3
  (W4-C leaves only 2 active after W4-A merges), W5=2, F=orchestrator-only. The cap is respected
  even where dependencies compress the active count.
- **#1004/#1090/#1126/#1166/#1169 cannot be auto-closed by code.** PASS. The plan assigns them to
  hand-close at the final cut stage (F), never carries a closing keyword on a code PR, and routes
  #1090 by the #1090 observational pattern. The umbrella hand-close rule (#1126, #1169) is recorded
  against "all retained children/one-pass evidence complete".
- **Streams schema/contract work precedes reconnect behavior.** PASS. W2-B (one versioned SSE event
  envelope governs server, Fresh consumer, docs, offsets, trace context — issue #1329) runs before
  W3-A (bounded reconnect/readiness/buffer/shutdown based on W2's envelope — issue #1326). The
  dependency table states "W3-A depends W2-B" explicitly. The AP-13 console-warn debt
  (`packages/plugin-streams-core/src/application/create-durable-stream.ts`) is correctly called out
  as a **replace, not deepen** obligation on the reconnect slice.
- **Plugin thinness/parity, A6 generated-consumer gates, scope overlays, debt, and JSR risks
  attached to right clusters.** PASS. A6 + service/runtime overlays to plugin linking/triggers; A3
  runtime folded into A5/core ownership for streams; A6 CLI/tooling + docs/frontend/service overlays
  for agentic/release/scaffold/CLI/DB; A4 service contract + service/docs overlays for OpenAPI/MCP;
  A6 scaffold + frontend/docs overlays for the frontend/docs narrative. Debt correctly cited: CLI
  maintainer/public mixing + permissions docs (cluster 1), `plugins/triggers` verification/connector
  convergence (cluster 2), `packages/service` assets/presets (cluster 4), `plugin-streams-core`
  AP-13 + connector convergence (cluster 3), `fresh-ui` private-type-ref (cluster 5). JSR rubric
  applied cluster-wide.
- **Canary.14/.15/.16 cadence is affordable but still requires #1312's authenticated
  fail-before-mint preflight.** PASS. Last authoritative post-canary.13 evidence = 1,076/4,000
  attempts used; three planned cuts cost at most 105 base attempts; remaining headroom = 2,819
  attempts. The plan pins W1-A (#1312 + #1148) to land **before** canary.14 and states explicitly
  that the preflight must be authenticated and fail-closed: "if the preflight cannot prove
  sufficient headroom, the cut is blocked before minting". The Q1 unanswered open decision ("Exact
  publish-attempt reset/report API") is correctly classified as must-resolve in W1-A.
- **Every slice names expected paths, decisive gates, and an allowed route.** PASS. All 18 slice
  rows carry the four columns (Issues / Proves / Expected paths / Decisive gates / Route). Sol low
  is the default; Sol medium is justified only for #1329 (versioned contract + telemetry + runtime
  proof) and #1333 (large scaffold/UI/contract design); GLM 5.2 design review is mandatory for
  #1333.
- **PLAN-EVAL remains Minimax and IMPL-EVAL remains Qwen, in separate sessions.** PASS. Locked
  decision #7: "Formal PLAN-EVAL is `minimax/minimax-m3` high; formal IMPL-EVAL is
  `qwen/qwen3.8-max` high. They run in separate sessions and never evaluate their own work." This
  evaluator is the Minimax PLAN-EVAL session; Qwen IMPL-EVAL is reserved for after each slice's
  implementation gates. The `routing-policy.ts` binding enforces the closed-model prohibition in
  code; the live canary evidence (tools 6, reasoning 26, streaming 31 for Minimax; tools 6,
  reasoning 93, streaming 98 for Qwen) is recorded in `supervisor.md`.
- **Unresolved decisions that would force rework are marked must-resolve at the right checkpoint.**
  PASS. The must-resolve rows are tied to the slice that owns the artifact (publish-attempt
  reset/report API → W1-A before canary.14; #1316 OTEL proof → T1-B before merge; #1333 scaffold IA
  → W4-A design checkpoint with GLM review). The safe-to-defer rows are routed forward honestly
  (#1139 → 0.0.6; #1004/#1090/#1126/#1166/#1169 → final cut stage; #1201/#1260 → 0.0.6).

## Notes

- The continuation run cleanly re-baselined against `origin/main@2508eb8c` and treated the legacy
  Claude run as orientation only — both halves of `milestone-run.md` § "Provenance" satisfied.
- The milestone rollover was executed highest-to-lowest and re-verified; the locked rename map
  matches the post-mutation table exactly. New milestone 25 (0.0.6) carries the 14 non-frontend rows
  the plan declares as moves' companions plus the eight 0.0.5 moves, matching the planning tally.
- The train umbrella PR body must carry no closing keyword (per locked decision #4 + `netscript-pr`
  § "Closing keyword"). The draft PR #1337 body already satisfies this; the pre-merge gate's check
  #7 (PR-body checklist matches what shipped) will re-verify at every per-PR merge.
- The orchestrator is the only entity that merges train PRs, promotes a train to `main`, dispatches
  release workflows, and accepts canary evidence (locked decision #8); delegated lanes never merge
  or publish. This is consistent with `netscript-release` doctrine.
- The temporary Grok 4.5 ordinary-review authorization during Claude-plan allowance exhaustion is
  correctly scoped to ordinary review only — it cannot replace the Qwen IMPL-EVAL pass on a
  per-slice basis, and the authorization is recorded as drift in `drift.md` per the lane-policy §
  "Selection and handoff rules".
- The pre-merge gate (milestone-run § "The pre-merge gate") is the per-PR bar; the plan binds every
  slice's decisive gates to it through the close-gate + review-thread-gate + scoped
  static/fitness/consumer gates + `scaffold.runtime` requirement. The cut-time checklist
  (cut-trace.md live, canary notes read, observational criteria routed, movers carry reasons,
  scope-drift checkpoint) is captured in the wave schedule at the C14/C15/C16 and F boundaries.
- One drift item to record, **not** a finding against the plan: the `agentic:runtime` inspection at
  2026-08-06 reported zero daemon-managed sessions; remote-control/mobile attachment and a real CLI
  tmux pane are not yet proven. `supervisor.md` records this honestly as `failed/not-attached` and
  routes repair through `agentic:runtime`, which is the correct posture (the pre-merge gate's
  "delegated lane is not observable" risk row).
- `plans` count under 30; the cluster table is sized for per-supervisor atomicity; the wave cap
  holds; the contract-first ordering is enforced; the route bindings are data, not prose.

## Verdict

`PASS`

The wave plan v3 satisfies every Plan-Gate checklist item, the spot-check verifications all hold
against the current tree and live GitHub evidence, the open-decision sweep has no false-negatives,
the 38-issue disposition is one-class-per-issue with no concealment, the inherited-PR repair
sequence and later dependencies are honest, and every slice names the four closure columns.
Implementation may begin.

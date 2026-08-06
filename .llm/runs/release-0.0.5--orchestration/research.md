# Research — release-0.0.5 continuation

## Re-baseline

- Fetched `origin/main` on 2026-08-06; authoritative head is
  `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`.
- The continuation checkout is clean and exactly matches that head.
- The legacy Claude checkout is `8399126ef`, ahead 155 / behind 72 relative to current main.
- The handover and legacy artifacts are orientation only. Live GitHub and current first-parent
  history are the verdict sources.

## Prerequisite #1331

PR #1336 merged as current `origin/main`. Issue #1331 is closed with all nine acceptance boxes
checked and mirrored evidence. Separate evaluator sessions are recorded: Minimax M3 PLAN-EVAL
`815534c7-6c02-4aa5-ab86-a905a0bade6f` and Qwen 3.8 IMPL-EVAL
`039835cf-151b-4152-98b8-1037f8c6330c`. The merged run records 417/417 agentic tests and 73/73 CLI
E2E. The remaining defect is lifecycle bookkeeping: PR/issue labels still say `status:ready-merge`
instead of terminal `status:shipped`.

## Live 0.0.5 inventory

GitHub milestone 23 has 42 open items: 38 issues plus PRs #1315–#1318. Every issue body,
acceptance/gate checkbox, label set, and milestone assignment was read live on 2026-08-06. The train
PRs all target the stale/colliding `canary/0.0.5-canary.13` base. #1316 remains honestly blocked on
issue #1189 acceptance box 5 and two PR DoD boxes: isolated live service→plugin call plus correlated
OTEL evidence.

Priority-zero open issues are #1208, #1312, #1324, #1326, #1329, and #1333. #1331 is no longer open.
Epic/observational rows require special closure semantics: #1126 and #1169 are umbrellas; #1090 is
observational; #1139 remains explicitly gated on F2.

## Milestone rollover pre-mutation inventory

Read live through `repos/rickylabs/netscript/milestones?state=all` immediately before planning. The
mutation must be re-queried once more immediately before execution.

| Number | Before title | State | Due  | Open | Closed | Description                                                                               |
| ------ | ------------ | ----- | ---- | ---: | -----: | ----------------------------------------------------------------------------------------- |
| 21     | `0.0.12`     | open  | none |   44 |      0 | Cascaded from beta.18 when beta.12 became the stabilisation release.                      |
| 20     | `0.0.11`     | open  | none |   11 |      0 | Dev dashboard (thin, contribution-based) + auth/deploy tail                               |
| 19     | `0.0.10`     | open  | none |   10 |      0 | Desktop graph (#830) + Aspire packaging/Windows tier + WorkOS RBAC/FGA                    |
| 18     | `0.0.9`      | open  | none |    2 |      0 | Deploy clouds W5 (CF/Vercel/AWS + thin adapters) + auth machine/agent/Better Auth track   |
| 17     | `0.0.8`      | open  | none |   15 |      0 | Deploy containers W4 + auth WorkOS broker wave (SSO/SCIM/Audit) + frontend-contrib polish |
| 16     | `0.0.7`      | open  | none |   50 |      4 | Enterprise auth wave-1 (Entra OIDC, multi-backend routing)                                |
| 24     | `0.0.6`      | open  | none |   34 |      6 | Frontend Contribution Layer — plugins that ship UI. RFC #890, epic #922.                  |

Locked rename order: 21 `0.0.12→0.0.13`, 20 `0.0.11→0.0.12`, 19 `0.0.10→0.0.11`, 18 `0.0.9→0.0.10`,
17 `0.0.8→0.0.9`, 16 `0.0.7→0.0.8`, 24 `0.0.6→0.0.7`; then create new `0.0.6`. Renames preserve
assignments and all other metadata.

## Milestone rollover post-mutation verification

Executed 2026-08-06T14:41:13Z–14:41:54Z, highest-to-lowest. Every renamed milestone retained its
number, state, due date (`none`), description, creation time, and issue assignments; only title and
`updated_at` changed. New milestone 25 was created only after milestone 24 freed `0.0.6`.

| Number | Before   | After    | Open before→after | Closed before→after | Created              | Updated after        |
| ------ | -------- | -------- | ----------------: | ------------------: | -------------------- | -------------------- |
| 21     | `0.0.12` | `0.0.13` |             44→44 |                 0→0 | 2026-07-31T14:34:59Z | 2026-08-06T14:41:13Z |
| 20     | `0.0.11` | `0.0.12` |             11→11 |                 0→0 | 2026-07-19T14:30:55Z | 2026-08-06T14:41:13Z |
| 19     | `0.0.10` | `0.0.11` |             10→10 |                 0→0 | 2026-07-19T14:29:05Z | 2026-08-06T14:41:14Z |
| 18     | `0.0.9`  | `0.0.10` |               2→2 |                 0→0 | 2026-07-19T09:23:23Z | 2026-08-06T14:41:15Z |
| 17     | `0.0.8`  | `0.0.9`  |             15→15 |                 0→0 | 2026-07-19T09:23:22Z | 2026-08-06T14:41:15Z |
| 16     | `0.0.7`  | `0.0.8`  |             50→50 |                 4→4 | 2026-07-17T20:34:10Z | 2026-08-06T14:41:16Z |
| 24     | `0.0.6`  | `0.0.7`  |             34→20 |                 6→6 | 2026-08-03T13:21:12Z | 2026-08-06T14:41:54Z |
| 25     | absent   | `0.0.6`  |              0→14 |                 0→0 | 2026-08-06T14:41:17Z | 2026-08-06T14:41:54Z |

Milestone 24 retains exactly #922–#941, all twenty open rows carrying `epic:frontend-contrib`. Its
six closed historical PR assignments (#1217, #1222, #1241, #1272, #1286, #1291) remain untouched.
New milestone 25 contains exactly the fourteen live non-frontend rows #1320, #1306, #1296, #1280,
#1279, #1278, #1263, #1262, #1246, #1243, #1215, #1175, #1163, and #1140. Each received a written
rollover reason.

## Current canary train and checks

The published canary.13 train name collided with the inherited development train. A new remote
`canary/0.0.5-canary.14` branch was created from current main `2508eb8c9`; PRs #1315–#1318 now
target it. The old canary.13 branch was preserved.

Current check evidence after retargeting:

- #1317 (`abdae400`) and #1318 (`d2a900`) have green current rollups, but still require a
  current-base update and the milestone pre-merge gate before train merge.
- #1315 (`c8e996`) fails quality and check-test because generated/temporary child projects resolve
  `catalog:zod` without owning the root catalog (`Package 'zod' not found in catalog`). This is a
  generated-consumer defect, not a reason to restore multiple Zod sources.
- #1316 (`a33c…`) fails plugin-remove cleanup because removal leaves an empty `Apps: {}` object. Its
  close gate also correctly blocks on #1189 acceptance box 5 and the PR's real service→fixture
  plugin plus correlated OTEL proof.

Retargeting did not create new check runs; each supervisor must update its branch onto the current
train and obtain a new current-SHA verdict.

## Doctrine / JSR classification

The wave plan applies A6 to release, agentic, scaffold, and DB CLI surfaces; A5 plus service/runtime
overlays to plugin linking and triggers; and A3 runtime rules folded into the streams core/plugin
surface. Public schema/export changes are contract-first and take the full export-map doc lint, JSR
audit, publish dry-run, and downstream consumer proof. `publish --dry-run` is never release
evidence.

Relevant open accepted debt is recorded, not widened: CLI maintainer/public mixing and permissions
docs, `plugins/triggers` verification/connector convergence, `packages/service` folder/assets debt,
and `plugin-streams-core` AP-13 plus connector convergence. The streams reconnect slice must replace
the misleading warning path with structured telemetry rather than adding another warning carve-out.

## Provider and publish budget baseline

`agentic:routing-state` on 2026-08-06 reports canonical formal routes and no persisted fallback.
Credential-owning live canaries passed through the checked-in suite:

- Minimax M3 PLAN route, high: tools 6, reasoning 26, streaming 31, exit 0.
- Qwen 3.8 Max IMPL route, high: tools 6, reasoning 93, streaming 98, exit 0.

The first Minimax probe without the canonical credential-file bridge failed closed as
`auth_required`; it was not counted as transport success. Loading the configured mode-0600 user env
file into the canary child produced the passing paid-transport evidence above.

The last authenticated release evidence after canary.13 reports 1,076/4,000 JSR attempts used and 35
publishable packages. GitHub history contains no later canary publish at plan time. Three planned
all-package cuts therefore cost 105 base attempts, but arithmetic is not the gate: #1312 must land
an authenticated fail-before-mint preflight before canary.14.

## Final 0.0.5 re-triage proposal

Thirty issues remain planned for 0.0.5. Eight move to milestone 25 after PLAN-EVAL: #1085, #1093,
#1112, #1139, #1201, #1210, #1260, and #1293. #1112 and #1293 move together because the honest MySQL
example needs a net-new exported adapter/error-hook contract; #1139 remains F2-gated; #1210 is the
broad competitive/deep-dive program while the focused p0 tutorial #1208 remains in 0.0.5. The
complete one-class-per-issue disposition and issue-specific rationale are in `plan.md`.

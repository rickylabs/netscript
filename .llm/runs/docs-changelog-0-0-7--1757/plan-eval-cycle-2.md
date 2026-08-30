# PLAN-EVAL cycle 2 (dispatched) — docs-changelog-0-0-7--1757

## Verdict

`PASS_PLAN`

Implementation may begin, subject to the one mechanical pre-implementation reconciliation the
plan's own Drift Watch already mandates (baseline moved during this evaluation — see "Moving
baseline" below; the required content is fully specified there and does not change the eleven-bullet
map).

## Session and identity

- Plan evaluator session: Claude Code — `https://claude.ai/code/session_016g86jW5sMJE9z9EHHGPByH`, 2026-08-30.
- Requested route: Anthropic · Claude Fable 5 · effort medium (`formal_plan_evaluation`,
  `supervisor.md` routes / `lane-policy.md`).
- Observed identity: model **confirmed** `claude-fable-5` (session model id). Effort is not
  introspectable from inside a session; recorded **as requested** (medium), not as a verified route
  match.
- Generator ≠ evaluator holds: plan author is OpenAI GPT-5.6 Sol medium, Codex thread
  `01a0522a-8eb8-7912-8dbb-526db23d711b`; this is a fresh session, distinct from the cycle-1
  evaluator (`session_01Qccb4kNXWBMY2Z2KiCadfj`) and from the prior cycle-2 session
  (`session_016e5ph9mxGW4izgBPPzjXgU`, see "Cycle numbering" below).
- Mutations by this session: this file only. No tracked file edit, commit, push, PR/issue/label
  mutation, merge, or implementation. No local ref was updated; the moved remote head was verified
  via `git ls-remote` and the GitHub commits API, not a fetch.

## Evaluated baseline

- Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1757`, branch `docs/changelog-0-0-7`
  @ `13878a80a50c55b9662099fed64555f2310ae4a3` (= the plan's pinned baseline; local HEAD unchanged).
- `git status`: only the untracked run dir. `packages/cli/CHANGELOG.md` still ends at `## 0.0.6`;
  `packages/cli/deno.json` still `"version": "0.0.6"`. No product file modified; implementation has
  not started.
- `git rev-list --count v0.0.6..13878a80` = 33, matching the plan's constant.
- **Remote drift observed during this evaluation:** `git ls-remote origin main` =
  `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` (one commit ahead of the pin). See "Moving baseline".

## Cycle numbering (record honestly, not renumbered)

The run dir already contains `plan-eval.md`, titled "PLAN-EVAL cycle 2", written by a *different*
evaluator session (`session_016e5ph9mxGW4izgBPPzjXgU`) with verdict `FAIL_PLAN` (two
wording-completeness findings), and `worklog.md`/`drift.md` record the two-`FAIL_PLAN` loop limit
as reached with escalation to the owner. The dispatch brief for this session describes
`plan-eval.md` as a cycle-1 leftover; the artifact itself contradicts that. By artifact history this
evaluation is materially the **post-escalation third evaluation**, authorized by the coordinator's
dispatch; it is filed as `plan-eval-cycle-2.md` because the brief names that deliverable. Both prior
reports were treated as claims to re-test, not results to inherit — including their PASS rows.

## Plan-Gate checklist

| Plan-Gate item | Result | Evidence (re-derived this session) |
| --- | --- | --- |
| Research present and current | PASS | `research.md` re-baselined at `13878a80`; re-derived: rev-list count 33, changelog stops at 0.0.6, version 0.0.6. Findings 5–8 re-verified from tool sources (below). Finding 9 (five barrel commits ship via `agent init`) re-verified by extracting and diffing the embedded tool sources themselves. "Current" is now qualified by the remote moving one commit during this evaluation; handled under Drift Watch, not as a research defect. |
| Decisions locked | PASS | D1–D5 stated with rationale. D1's 17/16 split re-verified row-by-row (all 33 SHAs present, 17 Include, 16 Exclude, reasons checked as true — below). D2's eleven-bullet map exists with draft wording; every one of the 17 included commits appears in exactly the rows claimed. D3 satisfied by B11 (all five declared breaks stated). D4 verified from generator sources. |
| Open-decision sweep | PASS | "Final bullet wording — resolved now" is genuinely resolved (the map is the contract). "Additional 0.0.7 work" and "enforcement gate" correctly safe-to-defer (issue #1757 explicitly defers both). Evaluator-run sweep found no undeclared rework-forcing decision. The moving baseline is not an open decision — the plan's Drift Watch already locks the procedure for it. |
| Commit slices (< 30, gate + files) | PASS | One ordered slice in `worklog.md ## Design › Commit Slices` with proving gates and files. |
| Risk register | PASS | Five risks with mitigations; the "misleading subject" mitigation was demonstrably applied (barrel commits diff-inspected; reasons now true). The "milestone advances" risk fired during this very evaluation and its mitigation (fixed baseline + provisional PR statement) is the right one — see "Moving baseline". |
| Gate set selected | PASS | Validation rows 1–7. All five task names exist in root `deno.json` (`docs:links`:84, `check:assets-barrel`:116, `check:agent-docs-prose`:117, `check:publish-assets`:119, `docs:readme:check`:162). Verified from generators that the changelog is not an input (below), so rows 2–6 are regression/no-churn gates and row 1 (manual traceability) is the only content gate — consistent with research finding 7. `SCOPE-docs.md` overlay gates covered (source alignment = row 1; link integrity = row 2; drift log = `drift.md`; scope separation and terminology satisfied by the bullets' consumer vocabulary). |
| Deferred scope explicit | PASS | `## Non-Scope` + `## Deferred Scope`; release boundary re-verified at `.llm/tools/release/github-release.ts:13-23` ("MANUAL BY DESIGN … REFUSES to create a release without one"). No version bump (`packages/cli/deno.json` = 0.0.6), no notes file planned or staged. |
| jsr-audit (package/plugin waves) | N/A | Docs-only slice; no `packages/`/`plugins/` source, manifest, export, or dependency change. Reason accepted. |

## Are the prior findings discharged?

**Yes — all of them, verified against source, not against the repair summary.**

- **Cycle-1 F1 (shipped `agent init` tool bundle) — discharged.** The five barrel commits are now
  Included with reasons that are true of the shipped tools. Method: extracted the embedded tool
  sources from `agent-tools.generated.ts` at `v0.0.6` and at `13878a80` (and per-commit where
  attribution mattered) and diffed the *decoded* contents:
  - `f7ad44dc`: embedded `run-deno-check.ts` gains `BatchFailure` collection and a
    `console.error("<n> deno check batch(es) failed without parseable type diagnostics …")` report
    in **every** source mode. Nuance verified: the non-zero *exit* remains gated on
    `sourceMode === 'selection'` — so B1's word "surfaces" (not "fails") is exactly right, and
    cycle-1's stronger claim ("exit 1 in every source mode") was an overstatement the plan correctly
    does not repeat.
  - `01e09604`: embedded check wrapper gains `--output` (0→2 occurrences) with atomic write
    (`writeTextFile(temp, …, { createNew: true })` then `Deno.rename`) — "writes atomic reports" is
    true; scanner gains generated-dir exclusions (`node_modules`, `_site` 0→1 each). Generated
    `quality-runner.ts` gains `--skip-apphost` (B2).
  - `473e8d75`: embedded scanner gains `public-any` (0→5) / `public-export-unresolved` (0→3) rules
    and GitHub allowance-owner verification (`GITHUB_TOKEN` 0→2, symptom line "fail-closed scan that
    verifies allowance owners in rickylabs/netscript"); `consumer-tools.json` permissions
    `["read"]` → `["read","env","net"]`.
  - `cf648f1f`: embedded lint wrapper gains `.deno-fmt-lint-ignore` subtree marker (0→1) and
    nearest-`deno.json(c)` batching (`nearest` 0→3).
  - `3b32d162`: embedded lint wrapper gains fail-closed coverage (`partial-exclusion` 0→2,
    `processed-count-unavailable` 0→5, `coverage` 0→18). `run-deno-fmt.ts` is **not** embedded in
    the barrel at either endpoint — B1's fail-closed clause is correctly scoped.
- **Cycle-1 F2 (bullet map must exist) — discharged.** `plan.md ## Locked Changelog Map` has eleven
  rows with draft wording; all 17 includes are mapped; `01e09604` legitimately appears in B1
  (bundle) and B2 (`--skip-apphost`). PLAN-EVAL now judges a mapping instead of authoring one.
- **Cycle-1 fix-3a (`3561bb64`) — discharged.** B7 states the root **stops root-exporting** the
  legacy `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult` types. Verified in the
  `src/mod.ts` diff: the export list drops exactly those three, retaining
  `MySqlCapabilities`/`MySqlConnectionConfig`/`PrismaMySqlOptions`. "Narrows result column types"
  verified (`columnTypes: number[]` → `Array<…literal union…>`). `toMysql2PoolOptions` is not
  described as public. `verify_identity`: `@deprecated` added while the runtime branch is retained
  (`adapter.ts:745` at `3561bb64`) — "without changing its legacy runtime behavior" is true.
- **Cycle-1 fix-3b (`01e09604`) — discharged.** B2 describes `--skip-apphost` as an argument the
  generated `check|lint|fmt-check` flows *accept* — verified: `quality-runner.ts` reads
  `Deno.args.includes('--skip-apphost')` and filters `isAppHostSource` for all modes; the generated
  `deno.json` tasks (`deno-json.ts:100-106`) invoke `quality-runner.ts <mode>` unchanged — no new
  task, and B2 claims none.
- **Cycle-1 fix-3c (`c73d361e`) — discharged, and exceeded.** B11 carries all three cycle-1 facts
  and both additional facts the prior cycle-2 report demanded. All five verified in the commit's two
  `BREAKING CHANGE:` footers and the diffs: `SafeFailure<TError = unknown> = [TError, null,
  boolean, false]` → `SafeFailure<TError = Error>` with literal `DefinedSafeFailure = […, true,
  false]` / `NonDefinedSafeFailure` arms and `data: undefined` (facts 1, 2, 4); `safe(promise:
  PromiseLike<TOutput>)` → `safe(promise: Promise<TOutput> & …)` (fact 3); `type OrpcErrorMap =
  Parameters<typeof oc.errors>[0]` replaced by the closed `CommonErrorMap` whose keys are exactly
  the six literals B11 names — `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
  `RATE_LIMITED`, `SERVICE_UNAVAILABLE` (fact 5).
- **Prior cycle-2 F1/F2 (`plan-eval.md`) — discharged.** B11 as above; B1 now carries "(the
  installed scanner now needs environment and network permissions)", matching the verified
  `consumer-tools.json` change.

## Per-bullet verification (all eleven, against `13878a80` diffs)

| Bullet | Verdict | Evidence |
| --- | --- | --- |
| B1 | TRUE | Six commits verified on the barrel/`agent init` axis (embedded-source diffs above). `13878a80`: `init-agent.ts` installs canonical skills to `.agents/skills/<path>` and writes guidance into `AGENTS.md` via `upsertMarkedSection` from the embedded `guidance.md.template`. Every clause traces; the permission parenthesis is present and true. |
| B2 | TRUE | `quality-runner.ts` diff + unchanged task wiring (above). |
| B3 | TRUE | `auth-plugin-command.ts` diff: `default: 'http://localhost:4437/auth/sessions'` removed from `--stream-url`; help/error text instructs `aspire describe streams --format Json` + append `/auth/sessions`. |
| B4 | TRUE | `v1.ts.template` imports `notFound` and projects missing rows as 404s; `generate-database-seed.ts` uses the generated Prisma client (`client.${delegateName}.…`); `generate-engine-mod.ts` adds `buildConnectionHelpers(provider)` with the literal comment "Render only the selected provider's URL-normalization helpers." |
| B5 | TRUE | `registry.ts.template` diff adds `total: 66` and `registryCollections` (eight collections); `registryCollections` present at `13878a80` (`git grep`). Independent Tier-A recomputation quoted in the commit body corroborates 66/66 and eight ordered-equal collections. |
| B6 | TRUE | `generate-register-background.ts` (under `templates/aspire/helpers/register/`) emits per-reference `getEndpoint('http')` resolution and `throw new Error("Background processor configuration error: … could not resolve … HTTP endpoint.")` before registering the processor. |
| B7 | TRUE | `3fc0f2f9`: `PrismaMySqlAdapter` (connected surface), `getCapabilities`, `isConnectionError`, `MYSQL_CONNECTION_ERROR_CODES`, `onConnectionError` hook, new `errors.ts` + `connection_errors_test.ts`. `3561bb64`: root-export removals, `columnTypes` narrowing, `@deprecated verify_identity` with runtime retained, `examples/basic-usage.ts` rewritten to Prisma 7 + `mysql2/promise` (mod.ts docblock). No hidden removal remains — the removal is stated as a removal. |
| B8 | TRUE | `pool.ts`: `#readyServerIds`, synchronous `{ statuses, readyClients }` snapshot ("without network I/O"), `settleWithSignal(options.signal, …)`; transports/`register-tools.ts`/`mcp.ts` wire cancellation through reads, discovery, shutdown. |
| B9 | TRUE | `ports/tool-registry.ts`/`chat-client.ts`: `context?: RequestContext` with the contract "An adapter must not serialize the context into messages, system prompts…"; `signal?: AbortSignal` reaches tool dispatch. |
| B10 | TRUE | `3e8e146a`: `cache-query.ts` catches persist-path failures (fetched data still returned); `cache-telemetry.ts` `CACHE_NAMESPACE_BUDGET = 256` + `overflow` admission with `cache.namespace.offending_id` evidence; `recordIncompleteTopology` retains `topology_complete=false` evidence. `0ef48c2e`: commit trailers "honor stale-only fresh preference", "dedupe stale refresh persistence" over `cache-query.ts` (+203/−110 with tests). |
| B11 | TRUE | All five facts + six literals verified (above). |

No overstatement found: every clause describes shipped, tested behavior at `13878a80`, none
describes intent or partially-landed work. No hidden removal remains: the two breaking surfaces
(B7 root exports, B11 SDK/contracts) are stated as removals/breaks.

## Coverage (all 33 commits)

- Triage table contains exactly the 33 SHAs of `v0.0.6..13878a80`; 17 Include / 16 Exclude as
  summarized.
- All 16 excludes scanned for non-test `packages/`/`plugins/` files: 14 touch none; `cd720529`
  touches only `packages/cli/e2e/**` (test infrastructure — exclude reason true); `2dd1a75e`
  touches four `packages/contracts` files whose diffs are JSDoc `* import` specifier lines only
  (verified line by line — exclude reason true). No consumer-visible change is excluded; no
  harness/CI churn is described as user-facing.
- All 17 include reasons verified true (bullet table above; the five barrel reasons via embedded
  diffs).

## Boundary verifications (from the tools, not from the plan)

- **Changelog is not a generator input — confirmed.** `grep -rn CHANGELOG` over
  `.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-publish-assets.ts`, root
  `deno.json`, and `.github/workflows/` → no matches. `build-agent-docs-bundle.ts` rebuilds
  site-owned corpus entries only from rendered `_site` `llms.txt`/`llms-full.txt`/`index.md` files.
  `generate-publish-assets.ts` `PUBLISH_ASSET_OUTPUTS` (lines 34–54) is a closed list of generated
  assets that does not include the changelog. D4 sound; the gate list is right for this diff, and
  `packages/cli/CHANGELOG.md` being outside `docs/site/` costs nothing here.
- **Release-introduction boundary — confirmed** (`github-release.ts:13-23`). The plan writes no
  intro prose, stages no notes file, bumps no version.

## Moving baseline (brief item 6)

Observed during this evaluation and cross-checked against the coordinator's mid-task fact supply:
`origin/main` advanced `13878a80` → `625447f1` ("test(aspire): 13.5.3 runtime verification receipts
(S2) (#1735)"). Independently verified via the GitHub commits API (no local ref mutated): the
commit's file list is entirely `.llm/harness/debt/arch-debt.md` plus `.llm/runs/**` artifacts —
**zero** `packages/`, `plugins/`, or `docs/site` content. The live range is now 34 commits.

**Judgment: pinning plus the explicit provisional statement is the right call; the moving baseline
does not invalidate the map.** Every bullet is a fact about commits that are ancestors of any
future `main`, so movement can only *add* triage rows, never falsify existing ones — which is
exactly what "provisional + top-up before the release cut" is designed for. A moving baseline would
only invalidate the plan if a new commit changed consumer-visible behavior the bullets describe;
`625447f1` does not.

The plan's own Drift Watch makes this movement "significant drift requiring plan reconciliation
before proceeding", so the generator must, before the implementation commit (content fully
specified so no further evaluation cycle is needed for it):

1. Add a `drift.md` entry recording the movement.
2. Add one triage row: `625447f1` — Exclude — "Aspire 13.5 verification receipts: arch-debt ledger
   and `.llm/runs/**` artifacts only; no consumer-visible surface." Update the worklog summary
   (17 included / 17 excluded of 34) **or** keep the 33-commit pin unchanged and state the pin SHA
   explicitly in the PR body alongside the provisional statement. Either is acceptable; extending
   the pin to `625447f1` is marginally better because it keeps "commits since v0.0.6" honest at PR
   time. If main moves again before the commit, repeat the same test per new commit.

No bullet or decision changes in either case.

## Blocking findings

None.

## Advisories (non-blocking)

1. **Cycle numbering collision.** `plan-eval.md` and this file both claim "cycle 2". When updating
   `worklog.md ## Gate Results`, add a distinct row for this evaluation citing
   `plan-eval-cycle-2.md` (verdict PASS_PLAN) rather than editing the prior rows; keep
   `plan-eval.md` as the historical second-cycle FAIL record.
2. **Do not strengthen B1's "surfaces silent check failures" during implementation.** The non-zero
   exit remains selection-mode-gated in the shipped check wrapper; "surfaces" is the exactly-true
   verb. (Cycle-1's Notes table overstated this; the plan does not.)
3. `context-pack.md` "In Progress: owner escalation" and "Next Steps 1" are resolved by this
   dispatch; update on the next touch.
4. Standing single-copy advisory: the commit-slice table lives only in `worklog.md ## Design`; keep
   it that way.
5. B7 remains one long sentence over two commits; splitting is the generator's call — traceability
   holds as written.

## Loop status

Two formal `FAIL_PLAN` cycles were recorded before this dispatch; this coordinator-authorized
evaluation returns `PASS_PLAN`. The Plan-Gate hard stop is satisfied; implementation may begin
after the Drift Watch reconciliation above.

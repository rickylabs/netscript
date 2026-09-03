**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**

# PLAN-EVAL — release-0.0.7--orchestration (composed milestone wave plan)

## Evaluator identity and evaluated head

| Field | Value |
| --- | --- |
| Phase | PLAN-EVAL (composed, whole-milestone), hard pre-implementation gate |
| Requested route | `formal_plan_evaluation` → native opposite-family. Plan author is `codex-root-0.0.7` (Codex family), so `lane-policy.md:45` binds **Claude · Anthropic · Fable 5 · medium** |
| Observed route | **Claude · Anthropic · Opus 5** · native first-party Claude Code session; effort not independently observable from inside the session |
| Route deviation | **Recorded, not hidden.** Family is correct (opposite-family Claude evaluating Codex-authored work — `lane-policy.md` invariant 1 satisfied, generator ≠ evaluator). Model is **not** the bound primary: `lane-policy.md:45` declares only Minimax M3 · high and AGY Gemini 3.6 Flash · high as fallbacks for this lane; Opus 5 is not among them. The coordinator must record this substitution in `supervisor.md`/`drift.md` per `lane-policy.md` § Selection and handoff rules, or re-run on Fable 5 · medium. |
| Evaluator session | `session_01Jn3vRjSJ14PAHcpkJhRbXQ`, host WSL2 Linux 6.18.33.2, checkout `/home/codex/repos/netscript-547-lffix` |
| **Evaluated head** | **`a105d2ce28ef50b716ffc24e272594a556e0bd27`** ("chore: discharge stale 0.0.7 work") |
| Head verification | `git ls-tree` at that SHA lists all 18 run artifacts; `git diff a105d2ce2..6a2ef6861` = `plan-eval-brief.md` only (+117 lines), so the working-tree run artifacts read are byte-identical to the requested head |
| Baseline verification | `git rev-parse origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed`; `git merge-base origin/main a105d2ce2` = the same SHA. The plan is baselined on that exact `main`, and all four control artifacts carry it as `baselineMainSha`. |
| Profile | `milestone-cluster` (`workflow/milestone-run.md`), coordinator run, four topic lanes |
| Surface / archetype | Whole-milestone: `packages/**`, `plugins/**`, `.github/workflows/**`, `.llm/tools/**`, docs. Package/plugin-dominant. |
| Scope overlays | None recorded in the run. `SCOPE-frontend` / `SCOPE-service` / `SCOPE-docs` are all in play across the 44 leaves and none is selected (see finding **F3**). |
| Boundaries observed | Read-only throughout. No source, issue, PR, label, branch, milestone, commit, remote or run artifact was mutated. No implementation, evaluator or publish lane dispatched. No Aspire/Docker resource started (`aspire --version` only). |

## What I independently verified as sound

Recorded first so the findings below are read as targeted, not as a rejection of the whole run.

- **Structural integrity of the control plane is exact.** The active-issue set is byte-identical across `milestone-inventory.json` (61 `active` of 64), `milestone-dependency-dag.json` `nodes` (61) and `waves` (61), `milestone-cluster-state.json` `lanes` (61) and `committedIssues` (61), and `milestone-leaf-plan.json` `leafGroups` (61 across 44 leaves). Zero duplicates, zero omissions, zero extras in any of the five sets. `#1306`, `#1453` and `#1606` appear in **no** dispatchable structure. Lane assignment agrees across inventory / DAG / cluster-state for all 61. All 24 edges point strictly earlier-wave → later-wave; the DAG is acyclic; every leaf's `wave` equals its issues' DAG wave.
- **`plan.md` matches its own control artifacts exactly.** All 44 leaf-map rows and all ten wave rows reconcile against `milestone-leaf-plan.json` on key, lane, wave and issue set with zero mismatches.
- **The validator is green and does real work.** `deno task harness:milestone:validate` → `{"ok": true}`. It enforces `limits` exactly `{2,1,1,1}`, exactly four topic lanes, lane ownership == active inventory, `leaf.baseBranch === 'main'`, `mutationAuthority:false` on watchers, an `admissionPredicate` **and** `targetMilestone`/`movedAt` on every included external candidate, and non-empty `exactMainEvidence.expectedGateIds` at release-captain claim (`validate-milestone-cluster.ts:204-210,550-563`).
- **The Step 0 GitHub moves were actually performed, not merely recorded.** Live: `#1453` now carries milestone `Backlog / Triage`; `#1249` (was Backlog) and `#1637` (was unmilestoned) now carry `0.0.7`; `#1564` is open in `0.0.7`; `#1306`/`#1606` are `CLOSED/COMPLETED` at 2026-08-13T19:18Z. Live milestone 27's 61 open issues equal the frozen 61 active exactly.
- **The `#1403` exclusion is correct.** `#1403` is `CLOSED/COMPLETED` in milestone `0.0.6`; `.llm/tools/quality/changed-source-files.ts:14` uses three-dot `${base}...${head}` and `changed-source-files_test.ts` exists. `code-quality.yml:49` routes through it. Excluding it from `#1564` is right.
- **Three locked mechanisms satisfy the brief's constraints.** `#1461` enters through the existing cache-aware `query()` path and adds no competing public API. `#1620`'s 64-namespace runtime cardinality cap with a fixed `overflow` collapse and one bounded warning is runtime-enforceable, unlike the branded string / source-only lint it replaces (`packages/sdk/src/cache/cache-telemetry.ts` is the real surface). `#1621` stays fail-closed, detects the zero-checkbox case before index matching, and neither no-ops nor widens issue-template policy.
- **Load-bearing findings spot-checked against the tree and hold.** `packages/sdk/src/cache/cache-query.ts:234-248` does resolve `data`, then rethrow on a failing `store.set`, discarding the successful result — `#1637`'s premise is real. Aspire CLI **13.4.6** is installed, and `aspire ps/describe --format Json --non-interactive` are documented in both `.agents/skills/aspire/SKILL.md` and `packages/cli/src/kernel/assets/skills.generated.ts`. `https://jsr.io/@netscript/sdk/meta.json` reports `latest: 0.0.6`, and the published `0.0.6` README contains **no** `lib/api-clients.ts` reference and names `createQueryFactories` as "the golden path".
- **Canary checkpoints are meaningful, not cadence-arbitrary.** Two checkpoints (`checkpoint-foundations`, `checkpoint-feature-complete`), each with a recorded rationale tied to a coherent green `main` state, and `plan.md:20` binds publication to *actual first-parent membership* rather than the dispatch plan — which is what `canary-cadence.md` requires.
- **The RFC 0001 top-of-body amendments are, as prose, excellent.** Each of `#1348/#1349/#1351/#1352/#1353` carries a dated `> [!IMPORTANT]` block that names the exact superseded claim and its replacement. They resolve all four contradictions the synthesis identified. Their defect is scope, not quality — see **F2**.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | **FAIL** | `research.md` exists and the re-baselining requirement is met (baseline `01e0960` == `origin/main`; no carried-in plan; load-bearing findings spot-checked above). But the artifact is **not current**: `research.md:22-23` still asserts "62 active issues across `docs` (7), `internals` (17), `fixes` (20), and `features` (18)" and "The freeze remains provisional". The frozen truth is 61 active / docs 1 / internals 17 / fixes 27 / features 16 (`milestone-status.md:14-17`, `milestone-cluster-state.json` `lanes`). `context-pack.md:6` routes leaf supervisors to `research.md`, so they read superseded lane counts. → **F10** |
| Decisions locked | **FAIL** | Six remedies are locked with rationale at `plan.md:24-43` and three of them are strong (above). But (a) `#1451` — `step0-synthesis.md:178`: "**#1451 does not name its seam** and no candidate exists on baseline — design precedes the slice" — has no locked decision, and it sits in wave 3 with a `cross-epic-order` edge to `#1455` in wave 5; (b) the RFC decision at `plan.md:42-43` locks the *prose* but leaves the machine-checked *acceptance* surface contradicted (**F2**); (c) 24 of 61 active issues carry `splitRisk: true` in `step0-synthesis.json` and only six were dispositioned. |
| Open-decision sweep | **FAIL** | No such section exists anywhere in the run. `plan.md` has no list of still-open decisions, and nothing is marked "safe to defer" or "must resolve now" — the exact vocabulary `gates/plan-gate.md:23-25` requires. `step0-synthesis.json` carries **58** `openUncertainties`; `plan.md` addresses six. My own sweep (below) found rework-forcing items the plan did not flag, which `evaluator/plan-protocol.md:32-34` makes an automatic unchecked box. |
| Commit slices (< 30, gate + files each) | **FAIL** | Enumeration and ordering are excellent: 44 leaves, ten waves, exactly-once coverage, acyclic validated DAG, `plan.md` tables reconciling perfectly with `milestone-leaf-plan.json`. The 44 > 30 count is correctly judged per-leaf rather than literally, and each individual leaf is bounded. **But no leaf names the gate that proves it or the files it touches.** `milestone-leaf-plan.json` leaf schema is exactly `{issues, key, lane, rationale, splitCandidates, wave}` — `rationale` is prose, not a gate or a file surface. `gates/plan-gate.md:26-27` requires both. Also one leaf spans two lanes (**F7**). |
| Risk register | **FAIL** | Absent. There is no risk table, no mitigations, and no cross-lane collision analysis anywhere in the run dir. `gates/plan-gate.md:28` requires risks with mitigations. This matters concretely here: `step0-synthesis.md:117` records that `#1355`/`#1360` "both edit `ServiceShowcaseLab.memory.tsx.template` and would collide as separate PRs" — that single collision was found and grouped, but with 7 leaves dispatching concurrently in wave 1 and 6 in each of waves 2–4, all direct-to-`main`, no artifact records which other leaves share a surface. |
| Gate set selected | **FAIL** | No gate set is chosen from `gates/archetype-gate-matrix.md` for any surface, and no scope overlay is selected. `plan.md` names gates only as "one global expensive-gate slot" (`plan.md:17`). The `milestone-run.md` pre-merge gate is inherited but never selected or bound per leaf. Concretely: `milestone-cluster-state.json` `exactMainEvidence.expectedGateIds` is `[]`, so no gate IDs are named for the exact-`main` sufficiency computation the stable cut depends on. → **F9** |
| Deferred scope explicit | **PASS** | `plan.md:114-121` states four deferrals with reasons: `#1306` close-fixed, `#1606` closed on live JSR evidence, `#1453` moved with public reason, `#1384`/`#1385` retained in `0.0.8`. `plan.md:41` explicitly declines to promise `#1551`'s optional 50-topic backlog, as the issue permits. `milestone-intake.json` records six `defer` decisions, all `ownerRatified: true` with reasons and linked evidence, including a distinct `#1385`-specific reason that `plan.md` itself omits (**F6** notes). |
| jsr-audit surface scan (pkg/plugin) | **FAIL** | Not `N/A` — this milestone is package/plugin-dominant (`@netscript/sdk`, `service`, `plugin`, `fresh`, `cli`, `plugin-workers-core`, `plugin-auth-core`, `ai`, `database` all have leaves). The `jsr-audit` rubric was **not** applied to the planned public surface, and **no** slow-type or public-surface risk is named in `plan.md` or any control artifact. `gates/plan-gate.md:32-34` requires the scan before slicing, and this is the milestone where it matters most: `#1349` alone turns on whether `createHttpClientLink`/`ClientLinkPort`/`ClientLinkCallOptions` become public, `#1462` is browser-safe entrypoints, `#1543` is cross-package dependency declarations, and `#1296`/`#1604`/`#1618`/`#1622` are export/reference/package-gate honesty. Non-package leaves are not marked `N/A` either — the box is simply absent. |

**6 FAIL / 2 PASS.** Any unchecked box is `FAIL_PLAN` (`gates/plan-gate.md:19`).

## Open-decision sweep (evaluator-run)

Decisions the plan leaves open that would force rework if deferred. Each is an automatic unchecked box under `evaluator/plan-protocol.md:32-34`.

1. **What `#1564` actually implements.** The single merge barrier for all 61 issues has an unverified residual scope (**F1**). Must resolve now — nothing else may dispatch behind it.
2. **How the SDK-chain leaves close their issues** given contradicted acceptance rows (**F2**). Must resolve now — it decides whether `#1349`/`#1351`/`#1353` are closable at all.
3. **`#1451`'s seam.** `step0-synthesis.md:178` states no candidate exists on baseline. Must resolve now — a wave-3 leaf whose design is undecided blocks `#1455` in wave 5.
4. **Whether `#1249`'s Zod-4 constraint half is a real defect.** Admitted on "both halves require red-first reproduction" with no recorded fallback if it does not reproduce (**F5**). Must resolve now, or the fallback must be recorded — this is the `#1024`/`#1061` mid-flight-split class.
5. **How `#1348` terminates.** Its own acceptance forbids closure by any implementation PR's closing keyword, and two of its boxes need owner answers (**F6**). Must resolve now — the milestone's definition of done requires every issue closed or moved.
6. **The immutable commits for `#1590` and `#1551`.** `plan.md:34-41` says "an immutable commit" and "a recorded immutable commit" of private `rickylabs/eis-chat`, but no SHA is recorded anywhere and no read access is evidenced. `step0-synthesis.md:179-180`: "If unreachable, `#1590`'s semantics are prose-only and `#1551` has no subject." Must resolve now — both leaves' proofs depend on it.
7. **The gate IDs the stable cut requires.** `expectedGateIds: []` (**F9**). Safe to defer only until release-captain activation, where the validator hard-fails — but deferring means no leaf knows which receipts it must produce, so in practice it must resolve before dispatch.
8. **Per-leaf gate and file surface.** Not a decision the plan flagged; it is the missing input every leaf supervisor needs. Must resolve now.

Decisions I judge genuinely **safe to defer**: the two owner-undecided canary cadence questions (`agent-milestone-orchestrator` § When a canary goes out) — the run has two declared checkpoints and can follow the recorded decision when it is made; and `#1551`'s 50-topic backlog, explicitly follow-up.

## Findings, severity-ranked

### F1 — BLOCKING. The sole wave-0 merge barrier is scoped from a consumer audit that baseline `main` contradicts

`plan.md:16` makes this the hardest invariant in the run: *"#1564 is the sole wave-0 merge barrier. No other implementation leaf may dispatch until its CI range fix is merged to `main` and its stale-base fixture is green."* All 43 other leaves and all 61 issues sit behind it. `step0-synthesis.md:174-176` already warned: *"#1564's blast radius is stated, not proven — four of five consumers are recorded as unaudited in the issue itself."* The coordinator settled the `#1403` boundary ([comment 5285276645](https://github.com/rickylabs/netscript/issues/1564#issuecomment-5285276645)) but never performed the audit. I performed it against `a105d2ce2`:

- `#1564`'s reproduction is a **two-dot** range: `git diff --name-only --diff-filter=ACMR cd24e1679 2a4102600 -- packages plugins` (issue body, "Reproduced on #1539").
- Every consumer the boundary comment assigns to `#1564` already uses **three-dot** on baseline: `ci.yml:145`, `e2e-cli.yml:138`, `surface-diff.yml:56` all run `git diff --name-status -M "$BASE_SHA...$HEAD_SHA"`. All three checkout with `fetch-depth: 0` (`ci.yml:122`, `e2e-cli.yml:110`, `surface-diff.yml:33`), so the merge-base is computable.
- `git diff A...B` is `diff(merge_base(A,B), B)`. A stale-or-advanced `base.sha` still resolves to the PR's fork point, which is why three-dot **is** the fix `#1403` applied.

Consequence: `#1564`'s "CI range fix" on its three assigned range consumers is plausibly an audit-and-justify outcome, not a code change — and its acceptance criterion 2, which demands the fixture be **"Proven red-first"**, then has no red case to prove on those workflows. That is precisely the `milestone-run.md` § Gate integrity "proof of firing" defect: a guard whose predicate can never be true, which 0.0.4 shipped twice.

Separately, the genuinely stale-sensitive residual is a **different** step: `git show "$BASE_SHA:deno.json"` at `ci.yml:163` and `e2e-cli.yml:163` reads a file *at the recorded base commit*, which a stale base does corrupt. And **two consumers of the same input are absent from `#1564`'s table and from the boundary comment entirely**: `pages.yml:79,100` and `fresh-ui-quality.yml:62,83`, both carrying the identical `BASE_SHA` + `git show "$BASE_SHA:deno.json"` pattern. `#1564`'s acceptance criterion 1 says **"Every workflow computing a changed-file range from `pull_request.base.sha`"** — that box cannot be truthfully ticked against the scope the coordinator recorded.

**Required fix.** Re-audit all seven `base.sha` consumers at `01e0960` and rewrite `#1564`'s consumer table and the boundary comment to state, per workflow and per line, which construct is affected (two-dot range, three-dot range, or `git show BASE_SHA:path`) and what the leaf will change. Add `pages.yml` and `fresh-ui-quality.yml` or state on the issue why they are excluded. Then re-state the red-first fixture against a construct that can actually go red. If the outcome is that no range fix is needed, say so and re-decide whether `#1564` is still a whole-milestone merge barrier or a wave-1 leaf — a barrier that gates 61 issues on an audit is a different plan.

### F2 — BLOCKING. The RFC amendments leave contradicted acceptance checkboxes live, so SDK-chain leaves cannot close their issues

`plan.md:42-43` locks: *"the top-of-body 0.0.7 amendments and merged RFC 0001 are normative; the superseded proposal text is never an implementation input."* The amendments say the older text is *"non-normative where [it] conflicts"*. That is sufficient for **prose**. It is not sufficient for the **acceptance checklists**, which were not edited and which are the machine-checked close criteria. Verified live:

| Issue | Live acceptance row | The amendment says |
| --- | --- | --- |
| `#1349` | `- [ ] createHttpClientLink, ClientLinkPort and ClientLinkCallOptions are exported from their…` | must **not** publicly export any of the three |
| `#1349` | `- [ ] port and timeout are removed from the client and defineServices option records.` | must **keep** them accepted/deprecated rather than remove |
| `#1353` | `- [ ] traceContextContribution() ships as an SdkClientContribution declaring its header keys…` | *"Do **not** ship `traceContextContribution()`"* |
| `#1353` | `- [ ] createHttpClientLink contains no trace-header authorship; the contribution is the only…` | the transport *"remains the sole final author of trace headers"* |
| `#1353` | `- [ ] NEGATIVE: with the contribution removed from the chain, a request carries no traceparent…` | reversed by the above |
| `#1351` | `- [ ] deno task deps:latest shows the oRPC family at 1.14.15 and deno why @orpc/shared shows a…` | any dependency move is a *separate* decision targeting stable **v1.15.0** |

`milestone-run.md` pre-merge gate check 2 requires **"zero unticked `- [ ]` on every issue the PR closes"**, and the honesty rule states a criterion that cannot be truthfully ticked **moves with its issue** and *"is never ticked to clear a gate."* Those two rules are now in direct collision for `#1349`, `#1351` and `#1353`: the leaf either ticks a box the amendment forbids implementing, or its close-gate stays red. That is the `#1024`/`#1061` mid-flight-split class arriving at merge time in waves 4–5, after the SDK chain has already consumed the critical path.

**Required fix.** Before dispatch, rewrite the **Acceptance** sections of `#1349`, `#1351`, `#1352` and `#1353` to the amended scope — strike or restate each contradicted row in place, rather than leaving it under a superseding note. Any row that survives only as history must be moved out of the checklist.

### F3 — BLOCKING. Five Plan-Gate boxes have no artifact at all

Open-decision sweep, per-leaf gate + file surface, risk register, gate set selection, and the jsr-audit surface scan are each simply absent from the run dir, not merely thin. `gates/plan-gate.md:45` is explicit that absence of a script is not permission to omit a check, and `evaluator/plan-protocol.md:44-47` forbids downgrading missing evidence to advice. See the checklist rows for the per-box citation and consequence.

**Required fix.** Add to `plan.md` (or a committed companion the leaf briefs reference): a risk register with mitigations, including a shared-surface collision table for concurrently dispatched leaves; the gate set selected from `gates/archetype-gate-matrix.md` per surface plus the scope overlays in play; a jsr-audit surface scan over the planned public surface naming slow-type and export risks per package leaf, with an explicit `N/A` + reason on non-package leaves; an open-decision sweep with each item marked "safe to defer" or "must resolve now"; and, per leaf, the proving gate and the file surface it touches — this is the field `milestone-leaf-plan.json`'s schema is missing and the field every leaf supervisor needs.

### F4 — MAJOR. `#1606` was closed with an acceptance criterion that is false on live GitHub right now

Its fourth criterion is `- [ ] #1377's [post-merge] row is ticked, referencing this issue.` I checked `#1377`: it is `CLOSED/COMPLETED` in milestone `0.0.6`, and its line 115 is still `- [ ] [post-merge] The published JSR landing page for @netscript/sdk shows the canonical dialect.` — unticked. The close comment on `#1606` does not mention that row.

The other three criteria I verified as genuinely true (JSR `latest: 0.0.6`; the published `0.0.6` README contains no `lib/api-clients.ts` and leads its value bullets with `createQueryFactories` as "the golden path"; version and observation date recorded on the issue). So this is not hidden work — the observational discharge is real. It is an honesty-rule slip on one row, and it is cheap to fix.

**Required fix.** Tick `#1377`'s `[post-merge]` row with a reference to `#1606`'s verification comment, or record on `#1606` why that row is being left for `#1377`'s own bookkeeping. Do not leave an issue closed `completed` with a criterion that reads false to anyone who checks.

### F5 — MAJOR. `#1249`'s admission does not meet its recorded predicate

`milestone-intake.json` records `admissionPredicate: "high-value-coherent"` for `#1249`. `milestone-run.md` step 0.2 defines that predicate as *"complete P1/feature scope that serves the release without displacing a critical prerequisite."* Live, `#1249` is `priority:p2`, `type:fix` — neither P1 nor feature scope. Nor is it "complete": `step0-synthesis.md:140` calls it *"**Weakest, and one supporting claim needs correcting**"*, shows the `min`/`max`/`multipleOf` claim rests on Zod 3 names read by Zod 4's `def.check`, calls it *"unconfirmed without executing a probe"*, and recommends *"Admit on the `controlProps` half only."* The intake admitted both halves with "both halves require red-first reproduction" and **no recorded fallback** if the second half does not reproduce. The leaf `fresh-typed-route-and-form-repair` then couples `#1249`'s close-gate to `#1609`/`#1610`.

This is the opportunistic-scope-growth failure mode the predicate exists to prevent, and it is sharpened by the contrast with `#1637` — `priority:p1`, a consumer-visible false outage on published `@netscript/sdk@0.0.6-canary.3`, riding an existing leaf at near-zero cost — which meets the predicate cleanly and which I raise no objection to.

**Required fix.** Either re-scope `#1249`'s admission to the `controlProps` half (as the synthesis recommended) and amend the issue accordingly, or record on the intake the explicit fallback: if the Zod-4 constraint half does not reproduce red-first, that half moves to `0.0.8` with a written reason rather than being ticked or silently dropped.

### F6 — MAJOR. `#1348` has no closure path, and its leaf's work is largely already done

`rfc-a-stage0-ratification-board` is a wave-1 leaf on the critical path — eight `rfc-prerequisite` edges fan out of `#1348` into waves 2–6. But its own acceptance says `- [ ] This issue is not closed by any implementation PR's closing keyword`, and `milestone-leaf-plan.json` agrees: *"Tracking issue - no implementation PR may carry a closing keyword on it."* Meanwhile the worklog records that Stage 0's substance — RFC ratification and the realignment of `#1349`–`#1353` — was already performed during Step 0 at 21:15Z. Two of its remaining boxes (`Q1 (cookie topology) and Q2 (PluginContributions group shape) are answered on this issue`) are owner decisions no agent can execute, and `step0-synthesis.md:166-169` records that RFC 0001 still lists **11 unresolved questions** at `:1555-1599` — *"the biggest unknown gating waves 3–6."*

So the plan has a leaf that produces no mergeable PR, cannot be closed by one, has partly already executed, and depends on owner answers that are not scheduled — while the milestone's definition of done requires every issue closed with verified acceptance or moved with a written reason.

**Required fix.** State `#1348`'s termination path in `plan.md`: who answers Q1/Q2 and when, which boxes Step 0 already discharged, and whether `#1348` closes at the feature-complete checkpoint or moves to `0.0.8` as an epic. If the RFC's 11 open questions gate waves 3–6, say which ones and schedule them.

### F7 — MODERATE. One leaf spans two topic lanes

`app-service-client-wiring` is `lane: features` and owns `#1355` (features) and `#1360` (**fixes**). `milestone-run.md` § Cluster control plane requires topic issue sets to be exclusive and a topic orchestrator to own *only* its allocated issues. The validator does not catch this: it checks lane ownership against inventory and leaf `lane` validity independently, never their agreement. The grouping itself is well-justified (`step0-synthesis.md:117` — both edit `ServiceShowcaseLab.memory.tsx.template` and would collide as separate PRs), so the fix is bookkeeping, not re-clustering.

**Required fix.** Move `#1360` to the `features` lane in inventory, DAG and cluster state, re-render and re-validate. Consider adding a leaf-lane/issue-lane agreement check to the validator so this class cannot recur silently.

### F8 — MODERATE. The quota and paid-transport preflight is thin and pre-dates the re-freeze

`milestone-run.md` stage B makes these procedural gates whose proof is *"the recorded check output (what was queried, when, result)"*, because both cost real time in 0.0.4 — a hard quota cap mid-delivery, and $7.43 billed to the wrong transport. `worklog.md:9` records at `18:43:18.739Z`: *"Claude first-party Max; Codex ChatGPT authenticated; `agentic:runtime doctor`: `no_change`, all components ready; routing state `[]`."* That evidences **authentication and runtime health**, not quota headroom and not transport billing. It was also taken against the provisional 62-issue plan, ~2h45m before the 64/61/44 re-freeze at `21:28:00Z`, for a milestone roughly 4× the 0.0.4 exemplar (`step0-synthesis.md:98`).

**Required fix.** Re-run the preflight against the frozen plan and record the actual numbers: remaining quota per provider lane with reset windows, and an explicit confirmation of which transport each lane bills to. A record that cannot distinguish "have headroom" from "am authenticated" does not discharge a gate whose negative case is exhaustion mid-delivery.

### F9 — MODERATE. The stable-cut conditions are under-specified and the sufficiency computation is unpopulated

`plan.md:20` says only *"Stable waits for all committed issues/leaves to be terminal and exact-`main` evidence to be sufficient."* It does not name **GitHub Actions OIDC publication** or **artifact-pinned production E2E**, both of which `milestone-run.md` § Definition of done and `netscript-release` require. `milestone-cluster-state.json` has `exactMainEvidence.expectedGateIds: []` and `receipts: []`, and `releaseCaptain.evidence: []`. The validator does hard-fail on empty `expectedGateIds` — but only once the captain leaves `inactive` (`validate-milestone-cluster.ts:530-532,550-551`), so today nothing names the gates, and no leaf knows which receipts it is expected to produce.

**Required fix.** Populate `expectedGateIds` with the gate identities the exact-`main` cut will require, and state the OIDC-publication and artifact-pinned production-E2E conditions in `plan.md:20` rather than relying on inheritance.

### F10 — LOW. `research.md` is stale and `drift.md` contradicts the frozen state

`research.md:22-23` asserts a provisional 62-issue / 4-lane split that the freeze superseded, and says the freeze *"remains provisional"*. `drift.md` reads in full: *"No accepted drift. Step 0 is in progress and no scope has frozen."* — while scope is frozen, `#1453` was moved, two issues were closed-fixed, lane allocation was rebalanced (docs 2→1, features 17→16, fixes 25→27), and two external candidates were admitted. `netscript-harness` § Run Artifacts makes `drift.md` the append-only record of exactly these events, and `lane-policy.md` § Selection and handoff rules requires the selected lane and any override to be recorded in `supervisor.md` **and** `drift.md`.

Relatedly, `supervisor.md` carries profile, run id, coordinator, branch, baseline and start time — but no model, session, host, checkout/worktree path, **lane table**, or **PLAN-EVAL decision**, all of which `lane-policy.md` § Supervisor identity and the `milestone-run.md` checklist require ("PLAN-EVAL decision for the wave plan recorded in `supervisor.md`").

**Required fix.** Update `research.md` to the frozen numbers; open `drift.md` with the Step 0 disposition events, the lane rebalance, and this evaluation's route substitution; complete `supervisor.md` with the lane table, identity fields, and the PLAN-EVAL decision.

### F11 — LOW. Residual `#1306` scope is unrouted, and three bookkeeping slips

- **`#1306`.** Its close is defensible: the four rows read as alternative remedies across three surfaces (`step0-synthesis.md:124`), and I verified rows 1 and 4 are genuinely satisfied by Aspire 13.4.6 plus both skill files. But rows 2 (`aspire start` non-TTY attached-or-documented contract) and 3 (dashboard login token to stdout when no TTY) were **not** satisfied — the close comment argues they are moot rather than met. Per `milestone-run.md` § Cut-time checklist and the `#1090` pattern, the residual DX gap should be routed to a follow-up issue at the moment it is noticed, not left implicit in a close comment.
- **Four milestone issues are absent from the inventory** — `#1108`, `#1201`, `#1260`, `#1550`, all closed 2026-08-11/12, i.e. before the run. Step 0.4 says inventory *every* resulting target-milestone issue. The omission is harmless but undocumented; state that the inventory covers issues open at `baselineMainSha`.
- **No watchers.** `milestone-cluster-state.json` `watchers: []`, while stage A's contract names read-only watchers as part of cluster bootstrap.
- **Stale counts in committed artifacts.** `milestone-leaf-plan.json`'s `#1564` rationale still says *"With 45 leaves merging direct-to-main"*; the frozen count is 44.

## Verdict

`FAIL_PLAN`

Six of eight Plan-Gate boxes are unchecked, and the evaluator-run sweep found eight open decisions the plan did not flag, at least six of which force rework if deferred. Two findings are independently blocking on their merits: the milestone's single merge barrier is scoped from a consumer audit that baseline `main` contradicts (**F1**), and the RFC realignment left the machine-checked acceptance surface in a state where three SDK-chain leaves cannot close their issues without violating either the close-gate or the honesty rule (**F2**).

This is not a weak plan. Its control plane is the most internally consistent I have audited in this repository — five independent structures agreeing exactly on 61 issues, a validated acyclic DAG, GitHub moves actually performed rather than merely recorded, and three genuinely well-chosen locked mechanisms. The gap is that the run produced a **dispatch schedule** and stopped short of the **plan** the Plan-Gate asks for: the risk, gate, surface and open-decision work that turns a schedule into something 44 leaf supervisors can execute without rediscovering the same decisions. That is the cheap fix happening before the expensive one, which is what this gate exists for.

### Required fixes, in dispatch-blocking order

1. **F1** — re-audit all seven `pull_request.base.sha` consumers at `01e0960`; restate `#1564`'s scope, consumer table and boundary comment per workflow and per construct; add or explicitly exclude `pages.yml` and `fresh-ui-quality.yml`; re-state the red-first fixture against a construct that can go red; re-decide whether `#1564` remains a whole-milestone barrier.
2. **F2** — rewrite the Acceptance sections of `#1349`, `#1351`, `#1352`, `#1353` to the amended scope, striking contradicted rows in place rather than superseding them by note.
3. **F3** — add the risk register (with a shared-surface collision table), the selected gate set and overlays, the jsr-audit surface scan with per-leaf `N/A` reasons, the open-decision sweep with defer/resolve-now markers, and per-leaf proving gate + file surface.
4. **F6** — state `#1348`'s termination path and schedule the RFC's open questions that gate waves 3–6.
5. **F5** — re-scope `#1249`'s admission or record its fallback.
6. **F9** — populate `expectedGateIds`; name OIDC publication and artifact-pinned production E2E in the stable-cut conditions.
7. **F8** — re-run the quota/transport preflight against the frozen plan and record actual numbers.
8. **F4**, **F7**, **F10**, **F11** — bookkeeping: `#1377`'s post-merge row; `#1360`'s lane; `research.md`, `drift.md`, `supervisor.md` currency; `#1306` residual routing; inventory scope note; watchers; the "45 leaves" string.

Re-render and re-run `harness:milestone:validate` after 1, 5, 7 and the `#1360` lane move; the current `ok: true` does not survive an inventory or lane edit unexamined, and schema validity was never the question here.

### Loop status

This is `FAIL_PLAN` cycle **1 of 2**. A second `FAIL_PLAN` escalates to the owner with the unresolved items (`evaluator/plan-protocol.md:52-55`).

## Notes

- No implementation, evaluator or publish lane was dispatched, and no repository state was mutated. The coordinator owns publishing this as the PR phase comment.
- The route substitution in the identity table (Opus 5 where `lane-policy.md:45` binds Fable 5 · medium) is a recorded deviation, not an approved fallback. If the coordinator wants a route-clean verdict on the re-submitted plan, run cycle 2 on Fable 5 · medium; the opposite-family invariant is satisfied either way.
- `#1384`/`#1385` remaining in `0.0.8`: I judge this defensible and not a hidden stable-cut blocker. `#1384`'s reasoning is sound and the credential-only carve-out is correctly refused. `#1385` is a p0 that `step0-synthesis.md:139` says *"Needs nothing from #1383"*, and `plan.md:9-10` justifies only `#1384` — but `milestone-intake.json` carries a distinct, owner-ratified `#1385` reason (auth transport topology outside this milestone's typed-extension scope). Fold that reason into `plan.md` so the deferral does not read as covered by `#1384`'s argument.

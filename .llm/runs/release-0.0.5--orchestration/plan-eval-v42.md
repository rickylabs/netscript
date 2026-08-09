FAIL_PLAN

## Cycle-2 finding dispositions

| Cycle-2 finding | Disposition | Evidence gathered |
| --- | --- | --- |
| 1 — Scope arithmetic and enumeration | **FIXED** | `gh api 'repos/rickylabs/netscript/issues?milestone=23&state=open&per_page=100'` returned 21 open issues. The v4.1 group table (`plan.md:422-444`) has 20 unique implementation issues; corrected F (`phase-registry.md:42`) adds six closure-only issues, with #1208 and #1333 appearing in both because their PRs reference them and F owns their later disposition. The union is 26 unique issues. Equivalently, the live scope is 21 − #1126 − #1169 + seven pulls = 26. Live #1139 and #1140 are OPEN in 0.0.6, so #1126 must leave; live #1175 is OPEN in 0.0.6, so #1169 must leave. No other retained issue lacks either a PR path or an F disposition. The nine milestone changes have not happened because the receipt is `NOT_RUN`; that is expected before PLAN-EVAL passes. |
| 2 — #1169 move | **FIXED** | `gh issue view 1169 --json body,milestone,state` returned OPEN in 0.0.5 and a DoD whose first row requires a clean green **release cut** to reach publish in one pass. `gh issue view 1175 --json milestone,state` returned OPEN in 0.0.6. Moving #1169 to 0.0.6 is the truthful path; canary receipts are not a substitute for the named stable-cut event. This also follows the epic rule at `.agents/skills/netscript-pr/SKILL.md:227-237`. |
| 3 — #1004 corrected rule | **FIXED** | Live #1004 still has the acceptance row “retry publishes only the missing members and logs `Skipping, already published`” unchecked. V4.2 states that only a demonstrated recovery closes it and otherwise it moves (`plan.md:594-597`). That rule matches the issue. The obsolete v4.1 row remains a manifest-integrity defect addressed below. |
| 4 — Authority column | **NOT FIXED** | `plan.md:468-469` says every closure row names an authority, but the table at `plan.md:471-483` has only Issue, Event, Evidence, and If-not-occur columns. V4.2 adds only the assertion “Every closure row now names an authority” (`plan.md:609`) and names no adjudicator. `rg -n 'Authority|authority' plan.md phase-registry.md` found no replacement authority column or per-row authority. |
| 5 — #1379 frozen-private-lock policy | **FIXED** | Live #1379 explicitly permits option (b): retain the private lock, run the package check frozen, fail a rewrite, name regeneration, remove/narrow root exclusions, and test the frozen-lock failure. `deno check --help` reports `--frozen` (“Error out if lockfile is out of date”) and `--lock <FILE>`. None of the issue's ten acceptance rows forces option (a). V4.2 selects (b), states why, and binds the negative and clean-worktree results (`plan.md:599-607`). |
| 6 — `phase-registry.md` and move predicate | **PARTIAL** | The registry now has split W3, C17–C20, W4-D, corrected F, the W3 sub-order, and an explicit receipt reading `NOT_RUN` (`phase-registry.md:33-43`). A skipped move is visible: live queries show all seven pulls still in 0.0.6/0.0.7 and #1126/#1169 still in 0.0.5, while `worklog.md` contains no receipt. However, the receipt scope enumerates nine issues and then requires “all eight” and `MISMATCH` for a set other than “those eight” (`phase-registry.md:33`). The Plan status also still says the scope escalation awaits an owner decision (`phase-registry.md:27`), while `escalations/plan-gate-scope.md` records the owner resolution and says the escalation is closed. |
| 7 — `cut-trace.md` and `research.md` | **FIXED** | After `git fetch origin main --prune`, `git rev-parse origin/main` returned `a6b2e4c31d80405d5225887cde7ab61baa2802f8`, exactly the evaluated-through SHA at `cut-trace.md:102` and the authoritative baseline at `research.md:150-153`. `git log --first-parent --reverse d6db645a..origin/main --format='%H %cI %s'` returned the eight rows at `cut-trace.md:63-70`; their UTC seconds match. The recurring rule at `cut-trace.md:103-106` requires a live re-query and trace append before every dispatch, canary, and cut. |
| 8 — W3 dispatch sub-order | **FIXED** | V4.2 starts W3-A/B2/B3, then assigns the first freed lane to B1 and the next to C (`plan.md:621-624`; `phase-registry.md:36`). A waits on W2-B before W3 begins; B2/B3 remain separate; B1's delayed start is conflict avoidance, not a false merge dependency; C is independent. This respects the three-supervisor cap. |
| 9 — New breakage | **NOT FIXED** | The milestone-move receipt became internally impossible when #1169 was added as the second outbound move without changing eight to nine. The #1202 correction itself matches the live four-box issue body and owner correction comment; live draft PR #1393 carries `Closes #1202` and has not closed it early. Four canaries remain one per declared wave boundary, membership is first-parent-derived, and C20 is bound to the stable cut's same-content green pair. W4's four groups fit three lanes because W4-D releases the lane W4-A then takes. |

## Surviving and new findings

### BLOCKER — The governing closure manifest has no authorities and still presents superseded rows

The closure manifest is an in-scope execution artifact, not explanatory prose. The table at
`plan.md:471-483` has no Authority column. It also still presents the superseded #1004
non-occurrence alternative, #1169's canary-based closure, #1202's withdrawn observational closure,
and #1126 as a table row. V4.2 corrects those cases in prose (`plan.md:588-609`), but does not
replace the table. `phase-registry.md:42` directs stage F back to “closure manifest in plan § v4.1,”
so the artifact used to run F points at the stale rows.

Evidence commands:

- `nl -ba plan.md | sed -n '466,483p;582,613p'` showed the four-column table and the later assertion
  without any adjudicator data.
- `rg -n 'Authority|authority|#1126|#1169' plan.md phase-registry.md worklog.md` found no replacement
  manifest or authority mapping.
- Live `gh issue view` results confirm that #1004 needs demonstrated recovery, #1169 needs a stable
  release cut and has open child #1175 in 0.0.6, #1202 has four implementation-provable rows, and
  #1126 has open children #1139/#1140 in 0.0.6.

Required change: add one superseding F manifest containing exactly #1004, #1090, #1166, #1197,
#1208 Phase 2, #1333, #1338, and #1343. For every row, name the actual adjudicator by GitHub login
or repository role, the event, admissible evidence, and the non-occurrence disposition. Remove
#1126, #1169, and #1202 from F, cross-reference their move/PR paths, and point
`phase-registry.md` F at the superseding manifest.

### BLOCKER — The milestone-move receipt names nine issues but can only accept eight

`phase-registry.md:33` enumerates seven inbound moves (#1373, #1356, #1375, #1376, #1359, #1343,
#1379) and two outbound moves (#1126, #1169): nine issues. The same predicate requires before/after
evidence for “all eight” and declares `MISMATCH` if the set differs from “those eight.” V4.2 repeats
the obsolete count at `plan.md:611-613`; the v4.1 receipt at `plan.md:485-491` predates #1169's move.
Literal execution has no passing state: querying the enumerated nine violates the expected count,
while querying eight omits a required move.

The did-not-run state is currently visible and truthful. Live `gh issue view` queries returned the
seven pulls in 0.0.6/0.0.7, the two outbound issues in 0.0.5, and no receipt in `worklog.md`. The
defect is the transition from `NOT_RUN` to `passed`, not observability of today's state.

Required change: supersede the receipt with the exact nine-issue set, require nine live before/after
records, and make both the count and set comparison use those nine IDs. Apply the same definition in
v4.2 and `phase-registry.md` before W3 can dispatch.

### MEDIUM — The phase registry still reports a closed escalation as awaiting decision

`phase-registry.md:27` reports `FAIL_PLAN ×2 → escalated` and says the scope disagreement “is an
owner decision.” `escalations/plan-gate-scope.md` records Option A as owner-ratified and ends with
“Escalation closed”; drift C-D42 records the same resolution. This does not change cluster or wave
semantics, but it makes the live registry's plan state false.

Required change: replace the row with the owner-ratified split and the current cycle-3 verdict state.

## Plan-Gate checklist result — owner-scoped milestone subject

| Plan-Gate item | Result | Evidence |
| --- | --- | --- |
| Research present and current | **PASS** | Live `origin/main` equals the trace and research marker; first-parent membership and exact timestamps match; recurring re-baseline is fail-visible. |
| Decisions locked | **PASS** | #1379 option (b), the module name, W5-C's GLM constraint, four canary points, and #1202's correction are decided. |
| Open-decision sweep | **PASS** | No remaining in-scope choice changes clusters, wave order, dependencies, canary points, scope, or closure policy. |
| Commit slices (<30, gate + files each) | **N/A** | Owner-ratified split in `escalations/plan-gate-scope.md`: each group brief owns this check and receives a separate-session PLAN-EVAL before implementation. It is outside this milestone-plan verdict. |
| Risk register | **PASS** | In-scope risks have explicit controls: evaluated-through drift check, serialized expensive-gate ledger, dependency/rescope rules, bounded lane orders, content-derived canary membership, and non-occurrence moves. |
| Gate set selected | **FAIL** | The milestone-move gate cannot reach `passed` because its enumerated set has nine issues while its acceptance predicate requires eight. |
| Deferred scope explicit | **FAIL** | The live F pointer still targets a superseded manifest with no adjudicators and obsolete #1004/#1169/#1202 rows. |
| jsr-audit surface scan | **N/A** | Under the owner-ratified split, package-level surface and proving-gate selection belongs to each group's separately evaluated brief. |

Plan-Gate result: **FAIL_PLAN**.

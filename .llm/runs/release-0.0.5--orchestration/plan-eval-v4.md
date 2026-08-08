FAIL_PLAN

## Findings

### BLOCKER 1 — The re-baseline is false

The plan freezes `origin/main@6c6044da9`, says there is exactly one merge after canary.16, and says
the only open 0.0.5 PR is #1337 (`plan.md:226-236`). None of those three statements is current, and
the first two were already contradicted by the supporting worklog before this evaluation began.

Evidence gathered:

- `git fetch origin main --prune && git rev-parse origin/main` returned
  `a6b2e4c31d80405d5225887cde7ab61baa2802f8`.
- `git log --first-parent --format='%H %s' fac9e339042c5394bf882311657d8981d353a1c3..origin/main`
  returned four post-canary-source merges, in newest-first order: #1215 (`a6b2e4c31`), #1347
  (`c383b2e84`), #1337 (`bb10be0e2`), and #1391 (`6c6044da9`). The plan records only #1391
  (`plan.md:230,233`).
- The supporting record already says main advanced from `6c6044da9` to `c383b2e84` and lists three
  post-canary merges (`worklog.md:604-614`), while the v4 table was not updated. The worklog also
  says none of those three touches `packages/**` or `plugins/**` (`worklog.md:612-613`), but
  `git show --name-only 6c6044da9` includes `packages/bench/bench.config.ts` and three
  `packages/fresh-ui/tests/**` files.
- `gh issue list --repo rickylabs/netscript --milestone 0.0.5 --state open --limit 100 --json number,title`
  returned 21 issues, so that one row remains true.
- `gh search prs --repo rickylabs/netscript --state open --milestone 0.0.5 --limit 100 --json number,title,isDraft,url`
  returned four open draft PRs: #1392, #1393, #1394, and #1395. `gh pr view` confirms #1393-#1395
  are the three dispatched W2 PRs and #1392 is the current orchestration PR. #1337 is merged.
- `research.md:3-10` still calls `2508eb8c9` the authoritative head. `cut-trace.md:15-50` stops at
  canary.14 and therefore omits W1, canary.15/canary.16, #1346, and every post-canary.16 merge,
  despite `milestone-run.md:36-41,54-56,156-157` requiring the trace to be maintained from live
  first-parent history during the run.

Required change: stop W3+ dispatch; append every actual merge and canary event to `cut-trace.md`;
freeze a new live SHA; re-run the issue/PR/milestone inventory; verify each open W2 PR against that
base; and recompute C17 membership from first-parent history. Update `research.md`, `plan.md`,
`worklog.md`, and `phase-registry.md` to one consistent baseline before re-evaluation.

### BLOCKER 2 — W3-B cannot close its four issues through one PR

W3-B combines four different completion authorities (`plan.md:277-285`): an intent-retrieval product
(#1102), docs-corpus configuration and fallback packaging (#1375), CLI executor identity and receipt
semantics (#1376), and a real post-change agent observation (#1197).

Evidence gathered with
`gh issue view <n> --repo rickylabs/netscript --json number,title,state,milestone,body`:

- #1376's Boundaries section says #1375 owns another change in the same composition root and
  explicitly requires the two changes to remain separable: “do not fold either into the other's PR.”
  The proposed cluster does exactly that.
- #1375 is not bounded to `writeHostConfig + a probe + tests` as claimed at `plan.md:250`. Its
  target and eleven acceptance rows also require a generated embedded fallback corpus, version
  provenance, a size budget, corpus-kind/root/count observability, precedence behavior, and negative
  cases.
- #1102 owns section-level intent retrieval, concept mismatch, link traversal, code-fence
  extraction, offline corpus parity, activation, and a deterministic evaluation corpus. That is not
  the same acceptance surface as either host-composition defect.
- #1197 says it closes only after re-measuring a real agent run. `milestone-run.md:104-108` states
  that observational criteria cannot close by a PR. The existing preflight had the right topology:
  `Closes #1102`, `Refs #1197`, followed by a real post-canary measurement and hand closure
  (`slices/w3-b-1102-1197/preflight.md:31-37`). V4 adds #1375/#1376 without replacing that brief.

Required change: split W3-B into separate PR groups for #1375 and #1376, retain a separately
closable #1102 implementation group, and route #1197 to an explicit post-publish observation row
after the resulting surface is in a canary. Declare whether #1102 depends on #1375's corpus parity;
do not infer that dependency during implementation.

### BLOCKER 3 — The closure manifest omits unclosable and observational rows

The final row lists only #1004, #1090, #1126, #1166, #1169, and #1338 (`plan.md:294`;
`phase-registry.md:20`). It has no completion path for rows that the slice briefs themselves say
their PRs cannot close.

Evidence gathered:

- #1202: its dispatched brief requires `Refs #1202`, never `Closes #1202`, because owner-machine
  evidence and three consecutive full runtime passes remain
  (`slices/w2-c-1202-1327/implement.md:35-41`). #1202 is absent from F.
- #1197: the existing W3-B preflight leaves it for post-canary measurement
  (`slices/w3-b-1102-1197/preflight.md:31-37`). It is absent from F.
- #1333: the existing preflight requires `Refs #1333`; a measured Quickstart agent smoke occurs
  after merge/publish before hand closure (`slices/w4-a-1333/preflight.md:42-44`). It is absent from
  F.
- #1208: the issue defines Phase 2 as a separate follow-up. Its preflight requires `Refs #1208`
  unless Phase 2 is completed or separately dispositioned (`slices/w4-b-1208/preflight.md:27-29`).
  V4 supplies neither disposition.
- #1126: its live issue body has open children #1139 and #1140. Live queries returned both as OPEN
  in milestone 0.0.6. `netscript-pr` says an epic closes by hand only once every child is done
  (`.agents/skills/netscript-pr/SKILL.md:231-237`). The final preflight instead proposes closing
  #1126 while those children remain deferred (`slices/f-evidence-closures/preflight.md:19-29`).

Required change: add an exact closure/move manifest for every retained issue. Add #1202, #1197,
#1333, and #1208 to the appropriate observation/final-disposition stage; each row must name the
event, evidence, authority, and move-on-non-occurrence result. Move #1126 to 0.0.6 now; it cannot be
hand-closed in 0.0.5 while children remain open. Preserve `Refs` and omit closing keywords until the
remaining acceptance is actually satisfied.

### HIGH 4 — The pull-forward sweep is enumerated but its load-bearing dispositions are not valid

The current issue IDs in 0.0.6 and 0.0.7 are all mentioned somewhere in the v4 sweep, but the count
and three decisions used to justify scope are wrong.

Evidence gathered:

- `gh issue list ... --milestone 0.0.6 ... | jq length` returned 31 open issues, not 32; 0.0.7
  returned 12. The former 32nd open milestone row was PR #1215, not an issue; `gh pr view 1215` now
  reports MERGED at `a6b2e4c31`. #1361 is currently in 0.0.6, although `plan.md:261` classifies it
  with 0.0.7. The issue-only sweep must distinguish issues from PR rows.
- #1373 has twelve acceptance boxes spanning ten published pages, the quickstart tree, dialect
  policy, aliases, a service-name-derived CLI template, a CLI test, and two negative gates. Its own
  target says the contract is “enforced by #1374's gate,” and its consumer proof says the pages
  compile under #1374. V4 rejects #1374 and substitutes fixed-string needles (`plan.md:263`). Those
  needles cannot prove the compile claim that #1373 makes.
- #1379's live issue says the package-local Fresh-UI check passes today and gives two bounded lock
  policies: join the root lock or keep a frozen private lock. V4 rejects it because the error count
  is unknown until the check runs (`plan.md:262`), contradicting the recorded reproduction. This is
  load-bearing because W4-A consumes the Fresh-UI/design surface while no CI job checks that
  package.
- #1343 requires a post-fix canary containing #1342. V4 rejects it because such a canary “does not
  exist yet” (`plan.md:265`). The canary.16 receipt records source
  `fac9e339042c5394bf882311657d8981d353a1c3`, after #1342, and the published-CLI/full
  `scaffold.runtime` production E2E (`canary-16-recovery-receipt.md:20-42`). The live issue must be
  adjudicated against that evidence, not deferred for a nonexistent event.

Required change: rerun an issue-only 0.0.6/0.0.7 sweep at the new baseline. Before pulling #1373,
either pull #1374 as a prerequisite or amend #1373 with an equivalent compile gate and explicit
acceptance authority; then produce slices that cover all twelve boxes. Re-adjudicate #1343 from the
canary.16 production artifact. Either pull #1379 before Fresh-UI-dependent work or lock W4-A out of
Fresh-UI source and require a frozen package-local check for any touch. Record the exact alternative
chosen; “existing needles” and “unknown error count” are not evidence.

### HIGH 5 — V4 has no commit-slice, risk, gate, or JSR plan for the groups it changed

The v4 table changes W3-B, W4-A, W4-B, W5-A, and the old W5 naming, but the slice directory still
contains the v3 briefs: `w3-b-1102-1197`, `w4-a-1333`, `w4-b-1208`, `w5-a-1137-1138`, and
`w5-b-1332-1334`.
`find .llm/runs/release-0.0.5--orchestration/slices -maxdepth 2 -type f \( -name implement.md -o -name preflight.md \)`
found no brief for #1373, #1356, #1375, #1376, or #1359.

Consequences:

- No changed v4 group has ordered slices naming files, per-slice proof, and gates, as required by
  `plan-gate.md:26-27` and `plan-protocol.md:40`.
- The old future briefs still prescribe Qwen evaluation, while v4 requires native Fable for
  Codex-authored work; for example `slices/w3-b-1102-1197/preflight.md:31-32`.
- The shared brief names `quality:gate`, `arch:check`, conditional doc-lint/publish dry-run, and the
  exact one-pass `scaffold.runtime` (`slices/_shared-brief-contract.md:21-47`), but a generic table
  does not select applicability, files, negative cases, runtime/consumer evidence, or JSR risks for
  the newly pulled CLI/MCP/Fresh/docs surfaces.
- `research.md:95-106` is the old v3 doctrine/JSR classification. There is no v4 JSR audit for the
  newly planned public `packages/cli`, `packages/mcp`, SDK-doc, or Fresh-UI consumer changes.

Required change: replace every changed future brief with the v4 membership and native lane; add an
ordered commit-slice table (<30 slices) with files, proving gate, and rollback boundary; add a v4
risk register and open-decision sweep; select A6, package/runtime, frontend, service, and
docs-overlay gates per actual touched surface; and record the JSR
surface/slow-type/export/publishability scan.

### HIGH 6 — The two new sequencing gates can silently do nothing

Evidence gathered:

- The expensive-gate protocol is only “write `EXPENSIVE-GATE-REQUEST`, push, tell the orchestrator,
  wait for the grant” (`slices/_shared-brief-contract.md:38-47`). It defines no grant artifact,
  lease owner, acquisition predicate, release state, stale-owner recovery, command guard, or
  negative firing proof. Two supervisors can both believe they received the token and start the
  expensive command; the record does not distinguish an ungranted run from a granted one.
- The pull-forward sequencing says milestone moves happen only after PASS (`plan.md:336-338`), but
  `phase-registry.md:15-18` gates later dispatch only on code dependencies/C17. There is no
  exact-set milestone receipt and no W3 dispatch predicate that fails when any of #1373, #1356,
  #1375, #1376, or #1359 remains in its old milestone. A skipped move is silent.
- `milestone-run.md:82-108` requires a demonstrated negative case, an explicit did-not-run state,
  and serialization for expensive gates.

Required change: define a checked state machine for the expensive gate (request, exclusive grant,
owner/lease, command start, terminal result, release) and make the runner refuse without the current
grant; demonstrate the refusal. Add a post-PASS milestone-move step that records before/after state
for the exact five issues and make W3/W4 dispatch fail with an explicit `NOT_RUN`/`MISMATCH` result
until that receipt passes.

### MEDIUM 7 — Two dependencies and the canary-boundary statement are unresolved

Evidence gathered:

- W3-A's dependency on W2-B's versioned envelope is supported by its stated contract. W5-D's
  dependency on the W4-A reference and W5-A naming is also supported.
- W5-A does not require all of W4-A to merge. #1373 already ratifies `apps/<app>/lib/<service>.ts`
  and says the two issues must coordinate the name before either lands. `plan.md:289` turns a
  decision dependency into serialization behind the release's largest frontend PR. Lock the shared
  name at Plan-Gate and depend on that decision, or state the concrete W4-A output that #1373 cannot
  proceed without.
- W5-C is marked independent (`plan.md:291`), but its existing brief says it must inherit W4's
  visual language and apply W4 tokens/type/layout
  (`slices/w5-b-1332-1334/preflight.md:12-13,30-34`). It therefore depends at least on W4-A's
  accepted design checkpoint. Because #1334 changes the homepage's visual hierarchy, diagrams, tabs,
  responsive states, and signature interaction, the plan must either bind the required GLM 5.2
  adversarial design pass to that group or constrain the change to reuse an already accepted W4
  design without introducing major UI/UX. `lane-policy.md:40-42,222-224` makes GLM mandatory for
  significant frontend UX. The GLM binding for #1333 itself is correct.
- The C18 same-content coupling matches `netscript-release`'s rule, and canary membership is
  correctly content-derived. Canary count is run-variable (`milestone-run.md:161-166`), so two
  points are not invalid by quota. The unresolved part is `plan.md:306-309`: it claims canaries at
  every wave boundary while the schedule defines a boundary as every dispatched wave landing
  (`canary-cadence.md:37-43`) and the plan names W2, W3, W4, and W5 but cuts only after W3 and W5.
  This drops the W2 and W4 observability points favored at `canary-cadence.md:154-163` without a
  recorded rationale.

Required change: change W5-A to a locked-decision dependency or name the real merge dependency; add
the W4 design dependency and GLM disposition to W5-C; and either treat W2+W3 and W4+W5 as two
explicit dispatch waves (renaming the subgroups) or record why the run rejects the asserted
every-wave observability preference and accepts the loss at W2/W4.

## Controls verified

- `gh run view` returned `success` for canary publish 31201279314 at source
  `fac9e339042c5394bf882311657d8981d353a1c3` and pinned production E2E 31201560939 at tag commit
  `94feaea3b6ece86bf44d9de7229c20ee7ad40e35`. The source status `release/canary-pair` is `success`,
  and `gh release view v0.0.5-canary.16` reports a published, non-draft prerelease. The canary.16
  pair row is true.
- `deno task agentic:routing-state` matches the v4 lane table for formal PLAN-EVAL, formal
  IMPL-EVAL, and the Sol-low/Sol-medium review pairings, with no persisted transition. Lane binding
  is not a finding.
- The stable-cut dependency on C18's green pair for the same content matches
  `.agents/skills/netscript-release/SKILL.md:33-38,164-180,226-232`. No source merge may intervene;
  only the release workflow's coordinated version-only commit can inherit the pair.

## Plan-Gate checklist result

| Plan-Gate item                                | Result | Evidence                                                                                                                                            |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current                  | FAIL   | `research.md:3-10` and `cut-trace.md:15-50` are stale; live main is `a6b2e4c31`.                                                                    |
| Decisions locked                              | FAIL   | Closure authority, #1373/#1374, Fresh-UI gating, W5 dependencies, and W2/W4 canary treatment are unresolved or contradicted.                        |
| Open-decision sweep                           | FAIL   | The plan does not list the decisions above as must-resolve-now decisions.                                                                           |
| Commit slices (<30, gate + files each)        | FAIL   | No v4 briefs/slices exist for the five pulled issues or changed clusters.                                                                           |
| Risk register                                 | FAIL   | The carried v3 risks do not cover the v4 cluster size, compile-gate dependency, Fresh-UI lock policy, observations, or milestone-move/token firing. |
| Gate set selected                             | FAIL   | Shared generic gates exist, but no per-v4-group applicability, negative proof, scope-overlay, or closure gate is selected.                          |
| Deferred scope explicit                       | FAIL   | #1126 is scheduled for closure with open children; #1202/#1197/#1333/#1208 lack final disposition rows; #1343 is deferred on a false precondition.  |
| jsr-audit surface scan (package/plugin waves) | FAIL   | No v4 scan covers the newly planned public CLI/MCP/Fresh/docs surfaces and their slow-type/export/publish risks.                                    |

Plan-Gate result: **FAIL_PLAN** — eight checklist boxes are unchecked.

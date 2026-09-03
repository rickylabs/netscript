use harness

# Composed 0.0.7 milestone PLAN-EVAL brief

Evaluate the committed 0.0.7 milestone wave plan at exact coordinator head
`a105d2ce28ef50b716ffc24e272594a556e0bd27`. This is the one composed PLAN-EVAL for the whole
milestone. It is a hard pre-implementation gate. Be adversarial, evidence-led, and decisive; do not
approve an unsound plan merely to begin implementation.

## SKILL

- `netscript-harness`: read `.agents/skills/netscript-harness/SKILL.md`, then enforce
  `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`, and
  `.llm/harness/evaluator/verdict-definitions.md`.
- `agent-milestone-orchestrator`: read
  `.agents/skills/agent-milestone-orchestrator/SKILL.md` and
  `.llm/harness/workflow/milestone-run.md`.
- `netscript-doctrine`: use it for package/plugin public-surface and ownership judgements.
- `netscript-tools`: use structured/read-only repo and GitHub inspection where useful.
- `netscript-pr`: enforce lifecycle, issue-closure, and phase-comment vocabulary.
- `aspire`: only to audit the #1306 close-fixed disposition if its evidence is challenged; do not
  start resources.

Read every selected skill file completely before acting. Stay read-only except for writing the one
verdict artifact requested below. Do not edit source, other run artifacts, issue/PR state, labels,
branches, commits, or remote state. Do not start implementation or publish anything.

## Canonical inputs

Read these in order:

1. `.llm/runs/release-0.0.7--orchestration/research.md`
2. `.llm/runs/release-0.0.7--orchestration/step0-synthesis.md`
3. `.llm/runs/release-0.0.7--orchestration/plan.md`
4. `.llm/runs/release-0.0.7--orchestration/worklog.md`
5. `.llm/runs/release-0.0.7--orchestration/milestone-intake.json`
6. `.llm/runs/release-0.0.7--orchestration/milestone-inventory.json`
7. `.llm/runs/release-0.0.7--orchestration/milestone-dependency-dag.json`
8. `.llm/runs/release-0.0.7--orchestration/milestone-cluster-state.json`
9. `.llm/runs/release-0.0.7--orchestration/milestone-leaf-plan.json`
10. `.llm/runs/release-0.0.7--orchestration/milestone-status.md`
11. `.llm/runs/release-0.0.7--orchestration/supervisor.md`
12. `.llm/runs/release-0.0.7--orchestration/drift.md`

The frozen baseline is `origin/main` commit `01e0960494c95ce56eb35892c211a095eb13e6ed`.
Independently confirm the evaluator is reading the requested coordinator head and that the plan was
re-baselined against that exact `main`. The current asserted shape is 64 inspected targets: 61
active, one moved, two close-fixed; 44 leaves; four lanes; ten waves; 24 dependency edges; #1564
alone in wave 0. Run the milestone validator and its tests if useful, but do not confuse schema
validity with plan quality.

## Required adversarial audit

Walk all eight Plan-Gate boxes explicitly and cite exact artifact locations. The standard
single-change wording around fewer than 30 commit slices does not literally fit a 61-issue
milestone: judge whether each individual leaf is bounded and whether the milestone's 44 leaf groups
are coherent, ordered, and supplied with enough contract/gate/file-surface information for their
supervisors. Treat an ambiguous leaf that would force implementation rework as a blocking open
decision.

Also establish, with evidence:

- Every active issue appears exactly once in inventory, DAG, lane ownership, and leaf coverage;
  moved/closed-fixed issues appear nowhere in dispatchable work.
- #1564 is truly the sole first-merge barrier, and excluding already-fixed `code-quality.yml`
  ownership under #1403 is correct. No other leaf may dispatch before that barrier merges and the
  plan is re-baselined.
- #1306 is truthfully close-fixed by Aspire 13.4.6 plus the generated NetScript skill, and #1606 is
  truthfully discharged by live JSR metadata/landing-page evidence—not merely hidden work.
- #1249 and #1637 meet the recorded `high-value-coherent` admission predicate.
- Leaving #1384/#1385 in 0.0.8 is consistent with release safety and does not hide a stable-cut
  blocker; a credential-only partial workaround remains forbidden.
- The top-of-body amendments on #1348/#1349/#1351/#1352/#1353 make merged RFC 0001 unambiguous and
  eliminate contradicted proposal text as an implementation input.
- The locked mechanisms for #1461 (existing cache-aware `query()`), #1620 (64-namespace runtime
  cap and overflow), and #1621 (specific fail-closed zero-checkbox guidance) satisfy acceptance
  without adding a competing public API, unenforceable typing, or a policy bypass.
- #1590's A→B→A/remount contract can be proven by a NetScript-owned black-box fixture while private
  `rickylabs/eis-chat` remains read-only reference material at an immutable commit.
- #1551's one-PR, three-ordered-commit methodology/fixture/content plan is feasible, records raw
  measurement inputs, labels unmeasured claims, and does not silently promise the optional 50-topic
  backlog.
- Exactly four topic orchestrators, WIP at no more than two implementation leaves plus one evaluator
  per lane, a single global expensive-gate slot, direct-to-main leaf PRs, coordinator-only merge
  authority, one opposite-family IMPL-EVAL per leaf, and a singleton inactive release captain are
  enforceable from the control artifacts.
- Canary checkpoints represent meaningful actual first-parent membership, not arbitrary cadence;
  stable waits for terminal leaves, exact-main evidence, GitHub Actions OIDC publication, and
  artifact-pinned production E2E.
- Provider quota and paid-transport verification are either already evidenced before dispatch or
  are an explicit unresolved dispatch hard stop. Do not approve a plan that could dispatch without
  those recorded checks.
- Package/plugin leaves have a defensible jsr-audit strategy and name public-surface/slow-type risk;
  non-package leaves correctly mark that gate N/A rather than omitting it.
- The risk register, selected gates, deferred scope, and open-decision sweep cover all material
  cross-lane collision and cut risks. Spot-check load-bearing claims against the tree and live
  GitHub state where needed.

## Output contract

Write only
`.llm/runs/release-0.0.7--orchestration/plan-eval.md`, following
`.llm/harness/templates/plan-eval.md`. Include:

1. requested and observed provider/model/effort/session identity and the exact evaluated head;
2. all eight checklist rows with `PASS`/`FAIL` and concrete citations;
3. the evaluator-run open-decision sweep;
4. severity-ranked findings with precise required fixes;
5. exactly one harness verdict: `PASS` or `FAIL_PLAN`.

For the eventual PR comment vocabulary, begin the artifact with exactly one of:

- `**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**` when and only when the harness verdict is `PASS`;
- `**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**` when the harness verdict is `FAIL_PLAN`.

Do not post the comment yourself. The coordinator will review and publish it. Do not invent evidence
or downgrade missing evidence to advice; any unchecked Plan-Gate box is `FAIL_PLAN`.

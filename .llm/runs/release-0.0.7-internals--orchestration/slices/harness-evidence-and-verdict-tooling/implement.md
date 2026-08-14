use harness

# Wave 0 leaf — harness-evidence-and-verdict-tooling (#1561 + #1563 + #1621)

You are the leaf supervisor/implementation agent for the 0.0.7 internals topic. You own exactly one
draft PR directly against `main`. Your topic orchestrator is `topic-internals-0.0.7`; the milestone
coordinator alone may merge or release. Do not publish, merge, change milestone scope, or mutate the
central cluster state.

## SKILL

Read these skills completely before task work:

- `.agents/skills/netscript-harness/SKILL.md` — run artifacts, conditional Plan-Gate, slice review,
  evaluator separation, and commit trail.
- `.agents/skills/netscript-tools/SKILL.md` — structured reporters, durable receipts, Git truth,
  workflow/tooling validation, and lock hygiene.
- `.agents/skills/netscript-pr/SKILL.md` — draft PR structure, closing keywords, labels,
  acceptance-evidence format, and phase comments.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — Deno inspection and task guidance; do not
  hand-roll dependency/version checks.
- `.agents/skills/openhands-handoff/SKILL.md` — the verdict and workflow changes affect the
  OpenHands handoff surface; preserve local-vs-cloud evaluation rules.
- `.agents/skills/skill-creator/SKILL.md` — use its bounded existing-skill editing guidance if the
  coordinator authorizes the required `netscript-pr` documentation edit. Do not run a broad skill
  redesign/benchmark unrelated to #1621.
- `.agents/skills/rtk/SKILL.md` — token-efficient read-heavy shell inspection.

Read the harness Plan-Gate, evaluator, agent-handoff, and lane-policy references selected by those
skills before deciding whether leaf PLAN-EVAL is N/A.

## Immutable identity and authority

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/netscript-007-harness-evidence` |
| Branch | `fix/harness-evidence-and-verdict-tooling` |
| Base | `01e0960494c95ce56eb35892c211a095eb13e6ed` = reconciled live `origin/main` |
| Upstream | none by design |
| Run dir | `.llm/runs/release-0.0.7-internals--orchestration/slices/harness-evidence-and-verdict-tooling/` |
| Issues | #1561, #1563, and #1621, exactly |
| Route | OpenAI Codex `gpt-5.6-sol`, medium (`normal_implementation`) |
| PR base | `main` directly; draft throughout implementation |

Push only with the explicit refspec:

```text
git push origin HEAD:refs/heads/fix/harness-evidence-and-verdict-tooling
```

Never set an upstream and never use a bare `git push`.

## Binding coordination inputs

Read the approved coordinator artifacts in
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`, especially
`plan.md`, `milestone-leaf-plan.json`, `leaf-contracts.json`, `milestone-dependency-dag.json`, and
`drift.md`. The milestone plan passed PLAN-EVAL at head `331f7c664`.

The binding leaf contract selects archetype `6-cli-tooling`, no overlays, and these declared file
surfaces only:

- `.github/workflows/openhands-agent.yml`
- `.llm/tools/agentic/lib/agentic-lib.ts`
- `.llm/tools/validation/acceptance-evidence.ts`

Its proving gates are check, test, and quality-job. It marks JSR audit N/A because no publishable
package/plugin surface is involved. Do not run or claim package/plugin `quality:gate` as this
leaf's verdict; do not run JSR audit or publish dry-run.

Known pre-dispatch contract mismatch: the approved plan explicitly says #1621 must update
`netscript-pr`, and all three live issues require test coverage, but those skill/test paths are not
declared above. This is already recorded in the topic `drift.md`. You may inspect them read-only and
may research/plan/bootstrap the draft PR, but before editing any undeclared skill or test peer,
record the exact path and rationale in this leaf's `drift.md` and request coordinator contract
clarification through the topic orchestrator. Do not silently widen the contract.

## First actions — live contract and draft surface

1. Fetch/read the live bodies and comments for #1561, #1563, and #1621. Inspect the exact current
   parser, mirror call sites, verdict extraction, workflow summary behavior, and existing tests at
   this main head.
2. Fill `research.md`, `plan.md`, and `worklog.md` `## Design`, including RED-first fixtures and the
   exact files required.
3. The approved outcome is tightly locked and appears mechanical: preserve fail-closed behavior;
   parse/diagnose empty evidence structurally; detect zero checkbox targets before index matching;
   emit removal-or-convert guidance; update `netscript-pr`; and accept heading/emphasis-wrapped
   verdict tokens while distinguishing absent from unparseable. If live research confirms there
   are no material design choices, record a concrete `PLAN-EVAL: N/A` in `worklog.md` before
   implementation. If any remedy/sequence/public behavior remains open, stop and request the
   serialized bounded PLAN-EVAL instead.
4. The first commit bootstraps the run artifacts. Push it by explicit refspec and open a draft PR
   against `main` in that same session. Its body must carry `Closes #1561`, `Closes #1563`, and
   `Closes #1621`, a checkable Definition of Done, the run-dir path, slices, validation, and
   drift/debt. Add one fenced acceptance-evidence mapping per closing issue when evidence exists.
5. Apply milestone `0.0.7` and the approved taxonomy with exactly one status: `type:fix`,
   `area:tooling`, and the correct current `status:` phase. Leave the PR draft.

## Locked implementation outcome

Keep the acceptance mirror fail-closed. Do not make a zero-checkbox target or an empty evidence
block silently successful merely because the author meant well.

The final head must truthfully prove:

- `entries: []` or another supported empty-list form never throws an unhandled parser exception;
  the result is either a structured validation failure with repair guidance or the explicitly
  documented accepted form, consistent with fail-closed mirror behavior;
- evidence-block errors are attributed to the block, not misreported as an unexplained close-gate
  crash;
- when a target issue has zero close-gated markdown checkboxes, detection happens before per-index
  matching and the message names the actual repair: remove the evidence block or convert the issue
  acceptance list to checkboxes;
- `netscript-pr` plainly states that only markdown checkboxes are close-gated and plain-bullet
  acceptance takes no evidence block, once the contract path is authorized;
- dry-run behavior for a no-checkbox issue emits the clear zero-checkbox verdict rather than a list
  of unmatched indices;
- verdict extraction accepts bare tokens and leading markdown heading/emphasis wrappers;
- a genuine no-token result is explicit and distinguishable from an emitted-but-unparseable
  verdict;
- tests cover the original #1561 crash, #1621 zero-checkbox ordering/message, #1563 heading form,
  emphasis where supported, genuine absence, and malformed/unparseable cases.

Do not absorb issue-template policy, make every Acceptance section use checkboxes, weaken the
close-gate, broaden OpenHands routing, change model/provider policy, or repair unrelated workflow
behavior. Do not manually dispatch a cloud OpenHands run for local evaluation.

## Implementation and evidence

- Commit reviewable Design slices. Each slice updates `worklog.md` and `context-pack.md`, runs its
  named structured gate, pushes by explicit refspec, and posts a per-slice PR comment with literal
  commit SHA and evidence.
- Preserve structured JSON test/check/lint/format outputs under `receipts/`; use the repo's
  structured reporters rather than raw root Deno commands. Use durable gate receipts where an
  exact allowlisted gate exists.
- Run focused parser/agentic/workflow tests plus the contract's check, test, and quality-job proof.
  Validate workflow syntax/behavior with existing repo tests. A command that did not fire is not a
  pass.
- Do not mutate `deno.lock`, delete caches, or use reload flags. Inspect and exclude any incidental
  automation churn.
- This leaf has no global expensive gate. Do not start `scaffold.runtime`, Fresh browser, Aspire,
  Docker, publish dry-run, or other unrelated expensive work.

Automated evidence is not sign-off. After each implementation slice, request substantive Tier-A
review from the topic orchestrator before the supervisor sign-off commit. When the final head is
green, keep the PR draft and request a separate opposite-family IMPL-EVAL. Do not flip ready,
apply `status:ready-merge`, merge, publish, or claim coordinator approval.

## Escalation

If live behavior contradicts the locked remedy, the contract needs an undeclared file, a gate
cannot fire, or baseline debt blocks an honest acceptance claim, write the evidence to `drift.md`,
post it to the draft PR, and notify the topic orchestrator. Continue only independent work.

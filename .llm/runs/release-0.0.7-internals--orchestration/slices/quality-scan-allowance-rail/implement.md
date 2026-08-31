use harness

# Wave 0 leaf — quality-scan-allowance-rail (#1378 + #1545)

You are the leaf supervisor/implementation agent for the 0.0.7 internals topic. You own exactly one
draft PR directly against `main`. Your topic orchestrator is `topic-internals-0.0.7`; the milestone
coordinator is the sole merge and release authority. You must not merge, publish, change milestone
scope, or mutate the coordinator's central cluster state.

## SKILL

Read these skills completely before task work:

- `.agents/skills/netscript-harness/SKILL.md` — run artifacts, Plan-Gate, slice review, separate
  evaluator, and commit trail.
- `.agents/skills/netscript-doctrine/SKILL.md` — this leaf is archetype 6 CLI/tooling and touches
  package/plugin sources and architecture-facing docs.
- `.agents/skills/jsr-audit/SKILL.md` — the approved leaf contract marks JSR audit applicable.
- `.agents/skills/netscript-tools/SKILL.md` — structured reporters, durable receipts, git truth,
  generated-asset freshness, and lock hygiene.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — `deno doc`, publish dry-run, and dependency
  evidence. Never hand-roll registry queries.
- `.agents/skills/netscript-pr/SKILL.md` — draft PR, closing keywords, labels, acceptance evidence,
  and phase comments.
- `.agents/skills/rtk/SKILL.md` — token-efficient read-heavy shell inspection.

Then read the relevant doctrine/archetype/gate files selected by those skills, including archetype
6, the frontend/service/docs overlays, the archetype gate matrix, and the Plan-Gate protocol.

## Immutable identity and authority

| Field    | Value                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| Worktree | `/home/codex/repos/netscript-007-quality-rail`                                         |
| Branch   | `chore/quality-scan-allowance-rail`                                                    |
| Base     | `01e0960494c95ce56eb35892c211a095eb13e6ed` = reconciled live `origin/main`             |
| Upstream | none by design                                                                         |
| Run dir  | `.llm/runs/release-0.0.7-internals--orchestration/slices/quality-scan-allowance-rail/` |
| Issues   | #1378 and #1545, inseparable and both fully resolved by this one leaf                  |
| Route    | OpenAI Codex `gpt-5.6-sol`, high (`complex_implementation`)                            |
| PR base  | `main` directly; draft throughout this implementation turn                             |

Push only with the explicit refspec:

```text
git push origin HEAD:refs/heads/chore/quality-scan-allowance-rail
```

Never set an upstream and never use a bare `git push`.

## Binding coordination inputs

Read the approved coordinator artifacts in
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`, especially
`plan.md`, `milestone-leaf-plan.json`, `leaf-contracts.json`, `milestone-dependency-dag.json`, and
`drift.md`. The composed milestone plan passed PLAN-EVAL at head `331f7c664`.

Your binding leaf contract is:

- archetype: `6-cli-tooling`;
- overlays: frontend, service, docs;
- approved surfaces: `.llm/tools/quality/scan-code-quality.ts`, `deno.json`, `docs/site/**`,
  `docs/site/reference/triggers/index.md`,
  `packages/cli/src/public/features/root/public-command-dependencies.ts`,
  `packages/cli/src/public/public-api.ts`, `packages/fresh/src`, and
  `plugins/workers/streams/producer.ts`;
- proving gates: check, test, publish-dry-run, quality-job, arch-check, fresh-browser,
  docs-source-format, and docs-accuracy;
- JSR audit: applicable for every touched publishable member.

Do not touch an undeclared product/package/plugin surface. If a necessary test or generated peer is
not covered by the contract, record it in `drift.md`, explain the exact need, and request a contract
clarification from the topic orchestrator before editing it. Do not silently widen the leaf.

## First actions — live contract, research, and draft surface

1. Fetch/read the live bodies and comments for #1378 and #1545. Re-measure every baseline count on
   this exact main head; the issue prose contains older counts and explicitly names earlier work
   that may already have landed.
2. Inspect current scanner tasks/tests and the real published surfaces before proposing changes. Use
   `deno doc` before broad package-source reads where applicable.
3. Fill `research.md`, `plan.md`, and `worklog.md` `## Design`; keep all decisions explicit.
4. This is decision-heavy tooling work. Run a bounded separate-session PLAN-EVAL and stop before
   implementation until `plan-eval.md` says `PASS`. Do not mark it N/A.
5. The first commit bootstraps the run artifacts. Push it by explicit refspec and open a draft PR
   against `main` in that same session. The PR body must carry `Closes #1378` and `Closes #1545`, a
   checkable Definition of Done, the run-dir path, slice checklist, drift/debt section, and one
   fenced `acceptance-evidence` block per closing issue once evidence exists.
6. Apply the approved taxonomy/milestone with exactly one status label: `type:chore`,
   `area:tooling`, `area:packages`, `area:docs`, milestone `0.0.7`, and the correct current
   `status:` phase. Leave the PR draft.

Post the RESEARCH and PLAN phase comments in the structured harness format. When the plan is ready,
write an explicit evaluator request into `context-pack.md` and return control to the topic
orchestrator; do not self-evaluate or implement ahead of PLAN-EVAL.

## Locked outcome and boundaries

#1545 registration must land in the same PR before #1378 enforcement. The final leaf must make the
registered allowance population and the scanner rule coherent in one mergeable head; no transient
day-one-red branch state is acceptable.

The final behavior must truthfully satisfy the live issue Acceptance sections, including:

- exported/publicly reachable `any` detection with RED-first proof;
- fail-closed allowance registration linked to an open, milestoned issue and a non-increasing
  budget;
- docs fenced-TypeScript scanning, including the docs test-fixture rule;
- preservation of the six intentional soundness-test assertions;
- removal of the documented triggers-reference `any` examples using real types;
- RED-first tests covering exported vs local `any`, linked vs unlinked allowances, docs fences,
  soundness-test exemption, and budget overflow;
- a green repo-wide quality scan and doctrine gate at the final head.

Do not absorb #1278 Inventory B, #1276 tranches T1-T5, #1245, #1249, #1379, or #1380. Do not weaken
types to remove an allowance, increase the measured budget above the live registered population, or
add a broad lint/quality suppression. Never add `as unknown as`, `as any`, `@ts-ignore`, or an
unregistered `quality-allow:` merely to green a gate.

## Implementation and evidence contract after PLAN-EVAL PASS

- Commit in reviewable Design slices. Each slice updates `worklog.md` and `context-pack.md`, runs
  its named structured gate, pushes by explicit refspec, and posts a per-slice PR comment with the
  literal commit SHA and evidence.
- Preserve structured JSON outputs under this run dir's `receipts/`. Type-check, test, lint, and
  format evidence must come from the repo's structured reporters, not raw root commands.
- Use durable gate receipts where the repo runner supports the exact allowlisted gate. A receipt
  proves only that command/head; keep semantic sufficiency separate.
- Run the applicable JSR audit for every touched publishable member: inspect full exports with
  `deno doc`, run full-export `doc:lint`, scoped publish dry-run, review exact dependency pins and
  publish file lists, and record slow-type/runtime-asset risks. Never publish.
- Run `deno task quality:gate` and `deno task quality:scan:repo` at the final head. Also run all
  proving gates named above. Request the coordinator's single global expensive-gate lease before any
  gate classified global/expensive; do not overlap another lane's run.
- Check whether changed tooling is embedded in generated CLI assets; if so, regenerate through the
  checked-in task and prove a second run is clean. Do not hand-edit generated output.
- Do not delete or reload lock/cache state. Any `deno.lock` churn must be inspected against the base
  and excluded unless a reviewed dependency change truly requires it.

Automated gates are not sign-off. After every landed implementation slice, request substantive
Tier-A review from the topic orchestrator before the supervisor sign-off commit. When all slices and
gates are complete, keep the PR draft and request a separate opposite-family IMPL-EVAL. Do not flip
ready, apply `status:ready-merge`, merge, publish, or claim coordinator approval.

## Escalation

If a live issue contradicts this brief, a proving gate cannot fire, a contract surface must widen,
or baseline debt makes an acceptance claim untruthful, record the exact evidence in `drift.md`, post
it to the draft PR, and notify the topic orchestrator. Continue only with independent work; never
paper over the blocker.

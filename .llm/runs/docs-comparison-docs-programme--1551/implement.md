use harness

# Leaf generator — comparison docs programme (#1551)

You are the attached generator for the single 0.0.7 docs leaf. Work only in `/home/codex/repos/netscript-007-docs-comparison` on `docs/comparison-docs-programme`, based on live `origin/main` `01e0960494c95ce56eb35892c211a095eb13e6ed`. You do not merge, publish, release, mutate central milestone state, touch another worktree, or self-certify. The topic orchestrator performs Tier-A review; fresh opposite-family sessions perform PLAN-EVAL and IMPL-EVAL.

## SKILL

Read these completely before task work and follow their required references:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/rtk/SKILL.md`

Also read the harness run-loop, lane policy, docs audit, handoff protocol, docs scope overlay, plan gate/protocol, this leaf run, and the approved coordinator artifacts under `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.

## Push and authority

- This branch has no upstream. Never set one and never use bare `git push`.
- Push only with `git push origin HEAD:refs/heads/docs/comparison-docs-programme`.
- Open a draft PR against `main`; never flip it ready and never merge it.
- No local publication, release, or expensive release/scaffold E2E.

## First turn — research and plan only

1. Reconcile live `origin/main`; inspect live issue #1551 and relevant comments through GitHub access.
2. Inspect current docs IA/navigation, tasks, comparison/migration surfaces, and prior work. Re-baseline every carried-in claim.
3. Inspect the private EIS-Chat Session route and support files only at immutable commit `5191de83f3da97559f21d8891c6c8afdf1cf473a` through existing authorized GitHub access. Never copy consumer business code; hold shared leaf presentation constant.
4. Pin Next.js version/features to primary official documentation. Framework behavior is temporally unstable; verify it.
5. Fully populate `research.md`, `plan.md`, and `worklog.md` Design with exact files, slices, risks, decisions, and structured gates.
6. Map every residual #1551 deliverable into coherent follow-up issues. Propose `type:docs`, `area:docs`, exactly one `status:triage`, priority, and `Backlog / Triage` unless approved evidence selects another milestone. Do not expand 0.0.7.
7. Resolve truthful #1551 closure semantics before implementation. If residual acceptance is explicitly moved and the live issue can be truthfully reconciled, plan the acceptance-evidence mapping and closing keyword. Otherwise use `Part of #1551` and report the terminality blocker. Never game the close-gate.
8. Commit the run bootstrap/research/plan, push explicitly, and open the draft PR in the same session. Use the canonical body, explicit Definition of Done, run-dir path, slices, honest validation, `ci:skip-e2e`, `ci:skip-scaffold`, milestone 0.0.7, and exactly one lifecycle status. Post RESEARCH and PLAN comments.
9. Stop after the plan slice. Do not implement before a separate PLAN-EVAL `PASS` supplied by the topic orchestrator.

## Bounded deliverable

Ship only: (1) comparison methodology plus minimum navigation; (2) one evidence-backed `NetScript vs Next.js` deferred Session case study; (3) one `Migrate from Next.js` placeholder/roadmap entry; (4) linked follow-up issues owning every residual deliverable. Do not complete all 17 deliverables or the 50-topic programme. Do not touch `packages/**` or `plugins/**`; any need is significant drift and a hard stop.

## Evidence and gates

- Publish raw measurement inputs and exact scripts/procedures for measured numbers.
- Mark every unmeasured statement `inspected` or `inferred`; provisional issue prose is not measurement.
- Keep the equivalence contract complete and shared presentation constant.
- Every matrix row records mechanism, evidence, loser overhead, confidence, and version sensitivity.
- Include freshness/version metadata and primary official citations.
- Plan the docs audit gate log: links, clean site build, changed-line internal-wording scan, specifier scan, command/API sampling, nav/front matter, prose, and cross-page contradictions.
- Use structured NetScript checks/reports. Preserve `deno.lock`; no cache reload.

## Commit trail and handoff

Use reviewable slices under 30; each slice has a named gate and same-slice `worklog.md`/`context-pack.md` updates. Push and comment on the draft PR after each slice. The PR commit list plus slice comments are the trail; do not create `commits.md`. After implementation gates, stop for Tier-A review and separate IMPL-EVAL.

End the first turn with a compact status. The final non-empty line must be exactly `PLAN_READY` or `BLOCKED: <reason>`.

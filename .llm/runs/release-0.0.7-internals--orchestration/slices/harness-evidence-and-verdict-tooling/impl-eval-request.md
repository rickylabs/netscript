# IMPL-EVAL request — harness-evidence-and-verdict-tooling

use harness

## SKILL

Read these completely before evaluation:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/openhands-handoff/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`

Then read the harness evaluator protocol, verdict definitions, agent-handoff rules, lane policy,
the `6-cli-tooling` profile, and every artifact in this leaf run directory.

## Role and route

Act only as the fresh, separate, native opposite-family formal IMPL-EVAL session for Codex-authored
PR #1644. The bound route is Claude/Fable 5, medium (`formal_impl_evaluation`). Do not reuse the
implementation session, dispatch cloud OpenHands, use an OpenRouter escalation without a recorded
native-route block, or repair implementation in the evaluator session.

This handoff is parked until the native allowance reset at **Saturday 2026-08-15 00:00
Europe/Zurich**. Do not launch this evaluation or any substitute route before that time.

## Immutable target

- Repository: `rickylabs/netscript`
- PR: #1644, draft throughout evaluation
- Branch: `fix/harness-evidence-and-verdict-tooling`
- Base: `01e0960494c95ce56eb35892c211a095eb13e6ed`
- Issues: #1561, #1563, and #1621 exactly
- Target evidence head: the literal SHA in the PR comment headed
  `[PHASE: IMPL] [STATE: IMPL-EVAL_HANDOFF]`

Resolve the remote branch and PR head independently. Refuse to evaluate if either differs from that
literal SHA. The final check/test/quality receipts intentionally attest its acceptance-complete
implementation parent; verify and record both SHAs in `evaluate.md` rather than demanding a receipt
self-reference to the evidence-only child.

## Authorized scope

Evaluate exactly these implementation/test surfaces:

- `.github/workflows/openhands-agent.yml`
- `.agents/skills/netscript-pr/SKILL.md`
- `.llm/tools/agentic/lib/agentic-lib.ts`
- `.llm/tools/agentic/lib/agentic-lib_test.ts`
- `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`
- `.llm/tools/validation/acceptance-evidence.ts`
- `.llm/tools/validation/acceptance-evidence_test.ts`
- `.llm/tools/validation/mirror-acceptance-evidence.ts`
- `.llm/tools/validation/mirror-acceptance-evidence_test.ts`

No tenth source, test, workflow, skill, issue-template, routing, provider, model, package/plugin,
publication, or release surface is authorized.

## Evaluation obligations

1. Verify `PLAN-EVAL: N/A` was recorded before implementation and that the Design checkpoint and
   RED-first slice trail exist.
2. Review the literal commit list, all S1/S2 Tier-A comments and sign-off commits, the complete diff
   from the bound base, and every structured receipt.
3. Independently verify the locked behavior for empty evidence, block attribution, zero-checkbox
   ordering/guidance, dry-run failure, wrapped exact verdict tokens, fenced/template exclusions,
   and `parsed | absent | unparseable` provenance through both workflow matchers.
4. Verify the only binding gates are `check`, `test`, and `quality-job`; JSR audit,
   package/plugin `quality:gate`, publish dry-run, and global runtime/E2E gates are N/A.
5. Treat commands that did not fire as not passed. Preserve lock hygiene and reject incidental
   `deno.lock` or source churn.
6. Verify the `netscript-pr` machine convention plainly states that only markdown checkboxes are
   close-gated and mirrorable and that a plain-bullet `Acceptance` section takes no
   `acceptance-evidence` block. Apply the merge close-gate independently; do not widen scope.
7. Write this run's `evaluate.md` from `.llm/harness/templates/evaluate.md`, with one exact verdict
   from `PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT`, evidence for every PASS row, findings and
   required action, and the literal evaluated SHA.

Do not merge, publish, flip the PR ready, apply `status:ready-merge`, change milestone scope, or
mutate central cluster state.

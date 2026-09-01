use harness

# Formal PLAN-EVAL — NetScript Database Architecture / Prisma 8 RFC

You are the fresh, separate formal PLAN-EVAL evaluator for run
`docs-database-architecture-rfc--prisma-8-rfc`. You did not author the research or plan. Be
adversarial, evidence-led, and independent. This is PLAN-EVAL only: judge the locked plan, never
author the RFC, evaluate implementation that does not exist, or soften the harness checklist.

## Route and identity

- Required route: native Claude Code, `claude-fable-5`, effort `medium`.
- Record the observed model, effort, session ID, date, worktree, branch, and evaluated commit.
- Evaluated worktree: `/home/codex/repos/netscript-db-rfc`.
- Evaluated branch/head: `docs/database-architecture-rfc` at `3cbcfcec8`
  (`docs(rfc): lock database architecture plan`).
- This session is separate from the Codex supervisor, Opus research lane, Qwen review, and all
  delegated research/synthesis agents.

## Mandatory harness inputs, in this order

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/harness/templates/plan-eval.md`
5. Run files: `research.md`, `plan.md`, `supervisor.md`, `drift.md`, and the complete `## Design`
   section of `worklog.md` under `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/`.
6. Detailed synthesis and planned publish audit: `research/architecture-plan-synthesis.md` and
   `research/planned-jsr-audit.md`.
7. Every other report linked by run-root `research.md`; use them to challenge load-bearing claims
   and conflict resolutions rather than merely trusting the synthesis.
8. `.llm/harness/archetypes/SCOPE-docs.md`, `.llm/harness/gates/archetype-gate-matrix.md`, the
   applicable A1/A2/A3/A4/A5/A6 archetype profiles, and the doctrine files cited in the plan.
9. `.llm/harness/debt/arch-debt.md` entries relevant to database, Prisma, plugin schema, generation,
   and Aspire coupling.
10. Repo `AGENTS.md`, `rfcs/README.md`, and `rfcs/0000-template.md` where they constrain the plan.

## Mandatory procedure

- Confirm run-root `research.md` is current and explicitly rebaselined to current main baseline
  `cd720529333328bcba5e1a308ce7632f4350efdf`.
- Spot-check at least three load-bearing findings against the actual tree, including one current
  NetScript fact, one pinned Prisma RC/current-source fact, and one doctrine/JSR/package-boundary
  fact. Record exact paths/lines or commits.
- Walk every Plan-Gate checkbox individually and cite the exact plan/research/worklog location that
  satisfies it, or mark it failed.
- Run your own open-decision sweep. Any decision still open that could force rework is an automatic
  failed checkbox, even if the plan labels it deferred.
- Verify all D-01 through D-47 exist and classifications are coherent; specifically attack D-35,
  D-37, D-41, and D-42 to decide whether their deferral is safe.
- Verify there are fewer than 30 ordered commit slices and each names proof, gate, and files.
- Verify the exact future package graph assigns one archetype per unit, includes A3 runtime gates,
  and does not allow a provider/query/slow-type dependency leak.
- Apply the planned JSR requirement honestly: planned packages do not exist, so dry-run/doc/packed
  results must be N/A now; decide whether the prospective audit names sufficient implementation
  mitigations.
- Challenge the clean-break/data-safety boundary, native Prisma TypeScript builder strategy,
  app-local E2E inference, bounded fail-closed runtime validation, plugin ownership/removal,
  multi-target/provider claims, operation/receipt recovery, implementation waves, and absolute-final
  Fable ordering.
- Confirm the canonical RFC file `rfcs/0000-database-architecture.md` is absent. Its absence is
  correct before PASS.

## Verdict and output contract

Write exactly one evaluator artifact using the harness template to the absolute path:

`/home/codex/repos/netscript-db-rfc/.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan-eval.md`

Emit exactly one verdict:

- `PASS` only if every Plan-Gate box is satisfied and no rework-forcing decision remains.
- `FAIL_PLAN` otherwise, with numbered, severity-tagged, actionable required fixes and exact
  file/line evidence. Do not edit the plan yourself.

Do not edit any other file. Do not create the RFC. Do not commit or push. End the artifact with
exactly `PLAN-EVAL: PASS` or `PLAN-EVAL: FAIL_PLAN`, and end your turn immediately after writing it.

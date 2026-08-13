use harness

# Formal PLAN-EVAL Cycle 2 — NetScript Database Architecture / Prisma 8 RFC

You are the fresh, separate formal PLAN-EVAL evaluator for run
`docs-database-architecture-rfc--prisma-8-rfc`. You did not author the research, plan, or cycle 1
correction. Be adversarial, evidence-led, and independent. This is PLAN-EVAL only: judge the locked
plan, never author the RFC, evaluate implementation that does not exist, or soften the harness
checklist.

## Route and identity

- Required route: native Claude Code, `claude-fable-5`, effort `medium`.
- Record the observed model, effort, fresh session ID, date, worktree, branch, and evaluated commit.
- Evaluated worktree: `/home/codex/repos/netscript-db-rfc`.
- Evaluated branch/head: `docs/database-architecture-rfc` at `383170bbc`
  (`docs(rfc): record plan evaluation correction`).
- This session must be new and separate from cycle 1 (`dd3cfbee-1a53-4dfd-84a3-e78e38ef5b22`), the
  Codex supervisor, Opus research lane, Qwen review, and every delegated research/synthesis agent.

## Cycle 1 context — verify, do not assume

Cycle 1 evaluated commit `3cbcfcec8` and returned `FAIL_PLAN`. Seven Plan-Gate boxes passed; the
only required fix was a copied claim that generated workspaces contained exactly 30 `db:*` task
keys. The evaluator executed `generateDatabaseDenoJson` for PostgreSQL, SQLite, MySQL, and MSSQL and
found 42 keys in every generated engine workspace. Commit `383170bbc` corrected the mutable
rebaseline, synthesis, and plan records; dispositioned Qwen F3 as an incorrect correction; and
preserved the cycle 1 artifact and independent model outputs as audit evidence.

Read the current `plan-eval.md` before replacing it. Independently verify that the required fix is
complete and does not introduce ambiguity such as treating 42 as a cross-workspace total. Then run
the **entire** Plan-Gate again. A corrected cycle-1 finding is not by itself grounds for PASS.

## Mandatory harness inputs, in this order

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/harness/templates/plan-eval.md`
5. Run files: `research.md`, `plan.md`, `supervisor.md`, `drift.md`, and the complete `## Design`
   section of `worklog.md` under `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/`.
6. Detailed synthesis and planned publish audit: `research/architecture-plan-synthesis.md` and
   `research/planned-jsr-audit.md`.
7. Every other report linked by run-root `research.md`; challenge load-bearing claims and conflict
   resolutions rather than trusting the synthesis.
8. `.llm/harness/archetypes/SCOPE-docs.md`, `.llm/harness/gates/archetype-gate-matrix.md`, the
   applicable A1/A2/A3/A4/A5/A6 archetype profiles, and the doctrine files cited in the plan.
9. `.llm/harness/debt/arch-debt.md` entries relevant to database, Prisma, plugin schema, generation,
   and Aspire coupling.
10. Repo `AGENTS.md`, `rfcs/README.md`, and `rfcs/0000-template.md` where they constrain the plan.

## Mandatory procedure

- Confirm run-root `research.md` is explicitly rebaselined to
  `cd720529333328bcba5e1a308ce7632f4350efdf`. Fetch/inspect current `origin/main`: if it has
  advanced, state the exact delta and independently decide whether it invalidates any research,
  plan, archetype, gate, or RFC-authoring premise. Do not call drift irrelevant without evidence.
- Re-execute or otherwise independently prove the 42-per-workspace correction across all four
  providers, and verify every mutable false-count occurrence was corrected while immutable evidence
  was explicitly superseded.
- Spot-check at least three other load-bearing findings against the actual tree, including one
  current NetScript fact, one pinned Prisma RC/current-source fact, and one doctrine/JSR/package-
  boundary fact. Record exact paths/lines or commits.
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

Replace exactly one evaluator artifact using the harness template at:

`/home/codex/repos/netscript-db-rfc/.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan-eval.md`

The cycle 1 version is preserved in commit `383170bbc`; summarize its disposition in the cycle 2
artifact. Emit exactly one verdict:

- `PASS` only if every Plan-Gate box is satisfied and no rework-forcing decision remains.
- `FAIL_PLAN` otherwise, with numbered, severity-tagged, actionable required fixes and exact
  file/line evidence. This is the second allowed failure cycle, so be especially explicit.

Do not edit any other file. Do not create the RFC. Do not commit or push. End the artifact with
exactly `PLAN-EVAL: PASS` or `PLAN-EVAL: FAIL_PLAN`, and end your turn immediately after writing it.

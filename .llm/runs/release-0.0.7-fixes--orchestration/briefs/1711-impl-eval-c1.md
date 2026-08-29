# IMPL-EVAL cycle 1 — #1112 / draft PR #1711 at `cd69eb7cb`

You are a **formal implementation evaluator** under the NetScript harness. Read
`.agents/skills/netscript-harness/SKILL.md` and the doctrine files it points to before judging.

- Run: `fix-prisma-mysql-honest-example--0.0.7` · issue #1112 · draft PR #1711
- Evaluated head: `cd69eb7cbb35fffdd16dba3f68dc26311a45699b` (immutable — do not rebase, amend, or pull)
- Base: `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Surface: `@netscript/prisma-adapter-mysql` · Archetype 2 (Integration) · docs overlay
- Your worktree: `/home/codex/repos/netscript-007-eval-1711-impl` (detached, evaluator-only)

You are **distinct** from the author (Codex `gpt-5.6-sol`, thread `01a047f1-…`), from the topic
supervisor, and from both PLAN-EVAL evaluators. Do not resume or message any of them.

## What this leaf claims to do

The package's public example and docs described a driver that did not exist: they claimed a
`deno_mysql` backend, imported a generic `@prisma/client`, and the example's Prisma path was
commented out. The leaf makes the published story true and the example executable, inside a frozen
envelope of **exactly seven product paths**:

1. `docs/site/reference/prisma-adapter-mysql/index.md`
2. `packages/prisma-adapter-mysql/README.md`
3. `packages/prisma-adapter-mysql/src/adapter.ts`
4. `packages/prisma-adapter-mysql/src/mod.ts`
5. `packages/prisma-adapter-mysql/src/types.ts`
6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`

An eighth product path is a hard rescope and is a finding if present.

## Context you must have

PLAN-EVAL ran twice and both cycles ended `FAIL_PLAN`; the owner accepted cycle 2's blocking finding
and authorized a bounded correction. **Do not re-litigate the plan** — evaluate the implementation
against the plan as it now stands at this head.

Two settled decisions, not open questions:

- The example loads its generated client with a **literal dynamic import**
  `await import('./.generated/client.ts')`. This is an explicitly owner-accepted **temporary Prisma 7
  correctness boundary** pending the Prisma-next / Prisma 8 database-layer rewrite. Deno 2.9.5 defers
  an unresolvable *dynamic literal* import to runtime while a *static* import fails `TS2307`.
- `PrismaMySqlResultSet.columnTypes` is spelled as an **inline numeric union** rather than
  `SqlResultSet['columnTypes']`, because that spelling trips `deno doc --lint` `private-type-ref`.
  Recorded in `drift.md` (2026-08-29).

## Your job

Judge whether the implementation is honest, complete against its plan, and adequately gated. Verdict
is `PASS_IMPL` or `FAIL_IMPL` with findings tied to **executed evidence**, not reading alone.

Independently re-derive at least:

- **Gate 1** — with `examples/.generated` absent:
  `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx`. Expect 12 selected, 0 failed
  batches, 0 diagnostics. Repeat after gate-5 cleanup. Note: gate 1 is **undefined** while
  `.generated` exists (it then selects generated files and fails on the import-map gap); that is
  documented, not a defect.
- **Gate 5** — follow the plan's scratch protocol verbatim (scratch schema, scratch
  `deno.json`, `prisma@7.8.0 generate`), then structured-check the **actual example** under the
  scratch config, then the guarded import-only smoke. Then delete `.generated` and every
  `.llm/tmp/prisma-example*` input.
- **Whether gate 5 is load-bearing.** A gate that passes but would also pass while broken proves
  nothing. Probe it.
- Tests, lint, fmt, `doc:lint`, publish dry-run, JSR audit, and the falsehood census across the seven
  paths.
- **Gate 15** — exactly seven product paths against base and `deno.lock` unchanged.

## Method requirements

- Run probes in a **pristine tracked-files-only archive** (`git archive <head> | tar -x` into your
  job tmp), not in a repo checkout.
- **Do not run lock-sensitive gates sequentially in one archive.** Probes rewrite that archive's
  `deno.lock`, and a later `quality:gate` will then fail `deps:check:zod` for reasons you caused. Use
  a fresh archive for lock-sensitive gates, and confirm any red against a **base-archive control**
  before reporting it. The supervisor already hit this and discarded the false red.
- Read every grep hit rather than counting matches; negations and markdown emphasis defeat naive
  patterns.
- Verify claims against the actual generated Prisma 7.8 types, not against prose.

## Boundaries

- **No live MySQL, Aspire, Docker, browser, `e2e:cli`, release gate, or expensive-gate lease.** The
  import-only smoke is the sole execution and must stay guarded by `import.meta.main`.
- Do not modify any product, test, docs, or tooling path. Do not touch labels, readiness, checkboxes,
  leases, or PR state. Do not merge.
- Leave no residue in any repository checkout.

## Deliverable

Write `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/impl-eval-cycle-1.md` in your worktree with:
head-identity table, reproduction environment, a re-derived gate table with exact commands and
results, a plan-conformance checklist, findings (each `BLOCKING` or `ADVISORY`, each with executed
evidence), and the verdict. Commit it and **push to a real branch**
(`git push origin HEAD:refs/heads/eval/impl-eval-1711-cycle-1`) so the artifact cannot be orphaned —
a detached-worktree commit alone is not durable. Report the artifact commit SHA and the branch.

Then post a summary as a PR comment on #1711 and stop. Do not implement fixes, do not resume the
author, and do not request another evaluator.

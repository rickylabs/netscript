# Brief — #1112 implementation grant, seven paths, plan head `6ae7113eb`

You are the canonical author for run `fix-prisma-mysql-honest-example--0.0.7` (issue #1112, draft PR
#1711), Codex thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, worktree
`/home/codex/repos/netscript-007-leaf-prisma-mysql`, branch `fix/prisma-mysql-honest-example`.

The coordinator has granted **implementation**. Your amended plan passed a fresh focused Tier-A at
its exact head `6ae7113eb4636972ef1df80fc08e6e3a0390d3fb`. Implement that plan — do not re-plan, do
not re-open settled decisions, and do not request a third PLAN-EVAL.

## Accepted boundary — do not relitigate

The literal `await import('./.generated/client.ts')` is an **explicitly owner-accepted temporary
Prisma 7 correctness boundary**, pending the Prisma-next / Prisma 8 database-layer rewrite. It is
settled. Implement it as D3 specifies and keep the Prisma-7-scoped framing in the shipped prose where
the plan places it. Do not grow it into new abstraction, new architecture, or additional paths.

## Scope — exactly seven product paths

1. `docs/site/reference/prisma-adapter-mysql/index.md`
2. `packages/prisma-adapter-mysql/README.md`
3. `packages/prisma-adapter-mysql/src/adapter.ts`
4. `packages/prisma-adapter-mysql/src/mod.ts`
5. `packages/prisma-adapter-mysql/src/types.ts`
6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`

Plus run artifacts under `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`. **An eighth product
path is a hard rescope** — stop and return to the supervisor rather than adding one. That includes a
changelog, a site `examples_test.ts`, a new package test file, or any config/schema/lockfile change.

Follow the plan's two commit slices in order.

## Gates — run all fifteen as written in the plan's Gate Plan

Gates 1–15 are all static/unit evidence. **No runtime, Aspire, Docker, browser, `e2e:cli`, release
gate, or expensive-gate lease is authorized or wanted** — the coordinator explicitly excluded them,
and the plan already states none is planned. Gate 5's import-only smoke is the sole execution and
must stay guarded.

Two gate details the supervisor executed at the plan head, so you know the expected shape:

- **Gate 1** is only defined with `.generated` absent: `12 selected, 0 failed batches, 0
  occurrences`, exit 0 — before generation and again after cleanup. During the generated window the
  same command selects 21 files and fails with ~50 `TS2307`/`TS9010`/`TS9027` diagnostics from
  generated code. That is expected and is not a defect; do not run or report gate 1 in that window.
- **Gate 5's actual-example check** must go from red to green across your D17 change: before D17 it
  fails `TS2322 Type 'PrismaMySqlAdapterFactory' is not assignable to type 'SqlDriverAdapterFactory'`
  at the `new PrismaClient({ adapter })` line; after D17 it reports `1 selected, 0 diagnostics`.
  Capture both halves — the red-before is what proves the gate is load-bearing rather than vacuous.

Collect **fresh receipts at your exact final head**. A receipt from an earlier head does not count.
Where a gate is allowlisted, prefer `.llm/tools/gates/run-gate.ts` so the verdict survives log loss.

## Author's discretion — the D17 scratch wrapper

Supervisor Tier-A found the scratch D17 compatibility wrapper **provably redundant**: the gate-5
actual-example check catches the identical defect with the identical code and message, and exercises
the same four operations (factory construction, `new PrismaClient({ adapter })`, `$queryRawUnsafe`,
`$disconnect()` in `finally`). Both the cycle-2 finding and the plan permit keeping or dropping it.
Your call — keep it if you judge it useful, drop it to remove a scratch file and a drift surface.
Either way, say which you chose and why in the worklog.

## Hard boundaries

- No `deno.lock` modification. If a probe dirties it, restore it before committing; gate 15 checks.
- No exclusion, ambient declaration, `// @ts-ignore`, or ungenerated `@prisma/client` stub.
- No scratch or generated output may survive: `.generated` and every `.llm/tmp/prisma-example*` input
  must be removed before your final commit.
- `main()` invocation stays exclusively inside the `import.meta.main` guard. The supervisor confirmed
  the query path is live when unguarded — the guard is the only thing keeping the smoke off MySQL.
- Do not merge, flip draft readiness, change labels, close the issue, or touch PR state.
- No self-certification. Record what you ran and what it returned; do not declare the slice reviewed.

## Finish

Commit per the plan's slices, **explicitly push** with a full refspec, and report the exact final head
SHA plus a per-gate receipt table (gate, command, result). Then stop. The supervisor runs fresh
exact-head Tier-A, then dispatches IMPL-EVAL to a separate opposite-family session under the standing
policy: after two consecutive terminal IMPL-EVAL failures the evaluator is released, you stay
available and unfrozen, and the exact decision goes to the owner — there is never a third cycle.

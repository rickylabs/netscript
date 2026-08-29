# IMPL-EVAL cycle 2 — #1112 / draft PR #1711 at `067193acf`

You are a **formal implementation evaluator** under the NetScript harness. Read
`.agents/skills/netscript-harness/SKILL.md` and the doctrine it points to before judging.

- Run: `fix-prisma-mysql-honest-example--0.0.7` · issue #1112 · draft PR #1711
- Evaluated head: `067193acff68254b4bd4c6e5d7824f80a9db2b26` (immutable — do not rebase, amend, pull)
- Base: `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Surface: `@netscript/prisma-adapter-mysql` · Archetype 2 (Integration) · docs overlay
- Your worktree: `/home/codex/repos/netscript-007-eval-1711-impl2` (detached, evaluator-only)

You are **distinct** from the author (Codex `gpt-5.6-sol`, thread `01a047f1-…`), from the topic
supervisor, from both PLAN-EVAL evaluators, and from the IMPL-EVAL cycle-1 evaluator. Do not resume
or message any of them.

## Why cycle 2 exists

IMPL-EVAL cycle 1 returned `PASS_IMPL` at `cd69eb7cb`. The head then moved twice, so that verdict no
longer covers it:

1. `bbaf70d64` — advisory A2 fix: two JSDoc comment lines in `examples/basic-usage.ts`.
2. `067193acf` — a **generated-derivative cascade** that had been missed entirely.

This is not a re-run for its own sake. **Cycle 1 passed a head whose gate set was incomplete**, and
so did the plan and the supervisor's Tier-A. Treat the gate set itself as in scope.

## The cascade you are checking

Editing `docs/site/reference/prisma-adapter-mysql/index.md` and the package's public export surface
makes four checked-in artifacts stale. Each was confirmed clean at base and stale at head:

| Artifact | Gate |
| --- | --- |
| `.llm/assets/agent-docs/{prose.json.gz,provenance.json}` | `deno task check:agent-docs-prose` |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts` | `deno task check:assets-barrel` |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | `deno task check:mcp-export-corpus` |
| `packages/mcp/src/publish-assets.generated.ts` | `deno task check:publish-assets` |

Verify each independently, and verify each derivative **regenerates to the committed bytes** rather
than merely passing a self-consistent check. Also judge whether the cascade is now *complete* — if a
fifth derivative exists that nobody has regenerated, that is a blocking finding.

## Breaking public-surface change — judge it

`src/mod.ts` drops three type exports, moving the published corpus 7611 → 7608 symbols:
`DenoMySqlClient`, `DenoMySqlConnection` (both removed entirely — they described a Deno-native driver
the adapter never used) and `ExecuteResult` (replaced by a module-local `Mysql2ExecuteResult`).

The supervisor found no consumer under `packages/` or `plugins/`. Confirm that independently, and
judge whether a deliberate pre-1.0 breaking removal with no changelog — a changelog would be an
eighth product path — is adequately disclosed in the PR body and `drift.md`.

## Settled decisions — do not re-litigate

- The example's **literal dynamic import** `await import('./.generated/client.ts')` is an
  owner-accepted temporary Prisma 7 correctness boundary pending the Prisma-next / Prisma 8 rewrite.
- `PrismaMySqlResultSet.columnTypes` is an **inline numeric union** rather than
  `SqlResultSet['columnTypes']` because that spelling trips `deno doc --lint` `private-type-ref`.
- PLAN-EVAL is closed at two cycles. Do not propose a third.

## Envelope

Exactly seven **authored** product paths: site page, package README, `src/adapter.ts`, `src/mod.ts`,
`src/types.ts`, `examples/basic-usage.ts`, `tests/connection_errors_test.ts`. An eighth authored path
is a blocking finding. The three regenerated `.generated.ts` files under `packages/` are derivatives,
not authored paths — that ruling is the supervisor's; say so if you disagree.

## Your job

Verdict `PASS_IMPL` or `FAIL_IMPL`, findings tied to **executed evidence**. Independently re-derive at
least: gate 1 (12 selected / 0 diagnostics with `.generated` absent, repeated after cleanup; it is
**undefined** while `.generated` exists), the gate-5 scratch protocol against the actual example,
**whether gate 5 is load-bearing** (a gate that would pass while broken proves nothing), the four
derivative gates above, tests, lint, fmt, `doc:lint`, publish dry-run, JSR audit, the falsehood
census, and gate 15 (seven authored paths, `deno.lock` unchanged).

## Method requirements

- Probe in a **pristine tracked-files-only archive** (`git archive <head> | tar -x` into your job
  tmp), never in a repo checkout.
- **Do not run lock-sensitive gates sequentially in one archive.** Earlier probes rewrite that
  archive's `deno.lock`; a later `quality:gate` then fails `deps:check:zod` for reasons you caused.
  Use a fresh archive, and confirm any red against a **base-archive control** before reporting it.
  Both the supervisor and this cascade were caught out by exactly this.
- Read every grep hit rather than counting matches.

## Boundaries

- **No live MySQL, Aspire, Docker, browser, `e2e:cli`, release gate, or expensive-gate lease.** The
  guarded import-only smoke is the sole intended execution. If a probe of yours executes anything
  else, disclose it.
- Modify no product, test, docs, or tooling path. Touch no label, readiness, checkbox, lease, or PR
  state. Do not merge.
- Leave no residue in any checkout.

## Deliverable

Write `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/impl-eval-cycle-2.md` with: head-identity
table, reproduction environment, re-derived gate table with exact commands and results, plan
conformance, findings (`BLOCKING`/`ADVISORY`, each with executed evidence), and the verdict. Commit
and **push to a real branch** (`git push origin HEAD:refs/heads/eval/impl-eval-1711-cycle-2`) so the
artifact cannot be orphaned. Report the artifact SHA and branch, post a summary as a PR comment on
#1711, and stop. Do not implement fixes, resume the author, or request another evaluator.

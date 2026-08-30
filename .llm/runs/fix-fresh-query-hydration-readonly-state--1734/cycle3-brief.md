use harness

# #1734 cycle 3 — bounded `reviveSerializedError` repair (PR #1736)

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load
`.agents/skills/netscript-doctrine` (`packages/fresh` is framework code — archetype, public surface
and fitness gates govern this), `.agents/skills/deno-fresh` (Fresh runtime, TanStack Query hydration,
islands), `.agents/skills/netscript-tools` (structured wrappers, gate receipts, lock hygiene), and
`.agents/skills/netscript-pr`.

Follow `AGENTS.md`: doctrine first for `packages/`, contract before implementation before tests, wrap
rather than reinvent, research before writing, record drift explicitly.

## You are a FRESH thread, not the original author

The preserved author thread `01a04fa4-8970-79d1-a899-6290bf3585cb` **no longer has a rollout** in the
codex store and cannot be resumed — verified: `thread/resume failed: no rollout found`. You inherit
the leaf from its committed artifacts, which are complete and authoritative.

**Read first, in this order**, all under
`.llm/runs/fix-fresh-query-hydration-readonly-state--1734/`:
`context-pack.md`, `plan.md`, `impl-eval.md` (cycle 1), `impl-eval-cycle-2.md` (the verdict you are
repairing), `drift.md`, `worklog.md`. Do not redo work they record as done, and do not "improve"
anything outside the scope below.

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1736`
- Branch `fix/fresh-query-hydration-readonly-state` @ `eb765629206092f97b3dd8f76a64fa0c3769bcb8`
  (local == remote == PR #1736, clean). Do not rebase or rewrite history.
- Closes exactly **#1734**

## Scope — strictly bounded to the accepted `hydration.ts` correction

IMPL-EVAL cycle 2 confirmed cycle-1's F1 is genuinely repaired on the real transport, that RED was
real, that both range ends compile, that the public contract and the `^5.101.0` range are untouched,
and that the revive resists prototype/shape attacks with no partial hydration and no input mutation.
**Two defects remain, both inside `reviveSerializedError`** — the function the R2 repair introduced:

- **F1 (major)** — the revive rejects **non-`Error`, non-record** rejection values. A `mutationFn`
  that rejects with a string, number, boolean, or array yields a `failureReason` that JSON preserves
  faithfully and that `hydrate()` consumes. It **hydrated on `main`**; at this head the entire state
  is rejected, dropping every success query with it. Reproduced by the evaluator through the real
  `renderToString(<QueryHydrationScript/>)` transport against both base and head.
- **F2 (minor)** — a **plain-object** rejection value is silently collapsed to the synthetic fallback
  `Error`, losing every original field — on the **in-memory** path as well as the wire, where the
  "serialized" premise does not even hold. Unstated and untested.

The evaluator was explicit that **no change to `query-types.ts`, `query/mod.ts`, or the dependency
range is required**. Keep the repair inside `hydration.ts` plus its test. Anything beyond that is a
rescope: **stop and report** rather than widening.

## How to do it

**RED first, visible in history as its own commit**: a round-trip test that rejects with a string, a
number, a boolean, an array, and a plain object, driven through the real
`renderToString(<QueryHydrationScript/>)` transport — not a hand-built payload. Both directions
matter and this leaf's whole history is about the untested direction:

- values that **hydrated on `main` must still hydrate** (F1);
- values that carry real fields must **keep those fields** rather than collapse to a synthetic
  `Error` (F2).

Then the fix, then GREEN. No `any`, no `as unknown as`, no suppressions — the constraint that shaped
the original R2 repair still holds.

**The lesson this leaf has taught three times: loosening or tightening a validator has two failure
directions, and checking only the one you were worried about is not checking it.** Cycle-1 F1 was a
check green only pre-serialization; cycle-2 F1 was a repair checked only for over-permissiveness.
Test both directions explicitly and say in your PR comment which direction each assertion covers.

## Gates

Fresh **exact-head targeted** run plus the scoped check/lint/fmt set, with raw exit codes. Root
`deno task test` **is** usable on this host now (PID 1 `tini`, 0 zombies) and was **fully green** at
current `main` in my own run — 4291 passed / 0 failed. The old ~7.7k-zombie waiver is **retired**;
do not cite it.

**Do not run** Aspire, Docker, `e2e:cli`, or `scaffold.runtime`. The blocked bare `scaffold.runtime`
rerun is serialized by the coordinator and happens **after** this repair lands and after exact runtime
zero is proven — it is not yours to fire.

## Boundaries

PR #1736 stays **draft**. Do not merge, mark ready, relabel the issue, close anything, or touch
`#1747`/`#1758` in any way — they are held until #1734 lands. Do not edit `impl-eval.md` or
`impl-eval-cycle-2.md`; both stay bit-identical. Do not launch or simulate IMPL-EVAL — a fresh
separate session is dispatched by me after my Tier-A.

Push with the explicit refspec only:
`git push origin HEAD:refs/heads/fix/fresh-query-hydration-readonly-state`. Copy SHAs from
`git log`, never retype — this leaf failed a gate on a fabricated SHA suffix in cycle 1.

Report the RED commit SHA, the fix commit SHA, and your gate table with raw exit codes.

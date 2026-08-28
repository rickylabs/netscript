use harness

# PLAN-EVAL **cycle 2** — #1112 / PR #1711 at `da769cd7c8e0438f2317ed761ec10bce15692d03`

You are a **formal PLAN-EVAL evaluator**. You did not write this plan and you must not repair it.
Produce a verdict, not a fix. Fresh session, **distinct from the author, the topic supervisor, and the
cycle-1 evaluator**. Opposite family to the author: the generator is Codex `gpt-5.6-sol` · high
(thread `01a047f1-…`); you are native Claude Fable 5 · medium.

## Why this leaf is PLAN-EVAL-selected

Under the owner's narrowed policy, formal PLAN-EVAL runs only for genuinely critical or decision-heavy
topics; routine leaves take `PLAN-EVAL: N/A` plus Tier-A. **#1112 is risk-selected as critical** because
it changes a **published Prisma integration boundary** and **generated-client compatibility**.

## Identity

- Worktree: `/home/codex/repos/netscript-007-eval-1711-c2` — **detached, yours alone**, already at the
  exact head. Do **not** enter the author's worktree `/home/codex/repos/netscript-007-leaf-prisma-mysql`
  or the cycle-1 evaluator worktree `…/netscript-007-eval-1711`.
- Immutable plan head: `da769cd7c8e0438f2317ed761ec10bce15692d03`
- Base: `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Issue **#1112**, draft PR **#1711**

**Verify head identity yourself first**: local `HEAD` == `git ls-remote origin
fix/prisma-mysql-honest-example` == PR `headRefOid`, worktree clean. If they differ, stop and report.

## SCOPE — strictly bounded. Do not reopen accepted scope.

Evaluate **only** the repaired F1 architecture and the five Tier-A claims below.

**Already accepted in cycle 1 and NOT under review:** the seven-path envelope itself, the source-only
`toMysql2PoolOptions` seam, the non-breaking TLS `verify_identity` deprecation, `supervisor.md` as
control-plane, the census/F2 wording, the F3 comment trail, and the F4 tool path. Cycle 1's F2–F4 were
advisory and are addressed. **Do not re-litigate them.** If you believe one is genuinely broken *by the
F1 repair*, say so — but do not reopen them on their own merits.

## Cycle 1 context

Cycle 1 returned `FAIL_PLAN` on **F1 alone**: the example imported a literal `./.generated/client.ts`,
which is unresolvable in a clean checkout once scratch output is deleted. The topic then rejected a
proposed `deno.json` exclusion as a **false green** — it passes by not type-checking the example — and
required an architecture that keeps the example genuinely checked.

## The repaired architecture — the thing to evaluate

The example carries a **non-literal** dynamic import resolved at runtime:

```ts
const generatedClientUrl = new URL('./.generated/client.ts', import.meta.url).href;
const { PrismaClient } = await import(generatedClientUrl);
```

Evidence is deliberately **split**: the ordinary root check validates the **stable example shell**;
a specialized scratch gate validates **generated-client compatibility**.

## The five claims — re-derive each independently, do not accept the record's word

1. **Clean archive, ordinary root, all 12 files, green before generation and after cleanup.** Build a
   pristine checkout of tracked files only (`git archive <head> | tar -x`) so untracked residue is
   impossible. Confirm `examples/basic-usage.ts` is genuinely **selected** — a deliberate red is the
   honest way to prove selection — and that the result is green with **no** generated output present.
2. **Real Prisma 7.8.0 generated-client static compatibility wrapper passes.** Note it does **not**
   pass at today's unmodified source: it fails `TS2322 'PrismaMySqlAdapterFactory' is not assignable to
   'SqlDriverAdapterFactory'` and passes only with the planned **D17** narrowing
   `columnTypes: SqlResultSet['columnTypes']`. Verify both halves.
3. **Import-only smoke prints the locked marker without MySQL.** Expected `dynamic-import-smoke:ok`,
   exit 0. Check *why* it is safe, not just that it prints — the example guards execution behind
   `import.meta.main`.
4. **Claims separate untyped root-shell evidence from specialized semantic evidence.** The plan must
   not imply the root check types `PrismaClient` or `prisma`. Judge whether a reader would be misled.
5. **Exclusion, ambient declarations, `@ts-ignore`, the ungenerated `@prisma/client` stub, and an
   eighth product path all remain forbidden** — and are not reintroduced by any wording.

## Judge the architecture, not just the numbers

The numbers reproduce. The question worth your effort: **is a non-literal dynamic import an honest
solution or an evasion?** It removes static type evidence from the checked-in example in exchange for a
green clean-checkout gate. State plainly whether the compensating scratch gate genuinely restores what
was given up, whether the plan is honest about what each gate proves, and whether a consumer copying
this example is well served. If you think this trades real evidence for a green gate, say so — that is
the finding this cycle exists to catch.

## Verdict

Write `plan-eval-cycle-2.md` into `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/` **in your own
worktree**, with a clear **PASS** / **FAIL_PLAN** / **PASS-WITH-ADVISORIES**, each finding tied to
executed evidence (command + result) and a severity. Post it as a PR comment on **#1711** bound to
`da769cd7c8e0438f2317ed761ec10bce15692d03`, and commit your artifact **without** touching any product,
test, or docs path.

Findings must be checkable. **No praise adjectives.** Do not implement, merge, flip readiness, change
labels, tick checkboxes, take a runtime lease, or repair the plan. Report your exact head and verdict,
then stop.

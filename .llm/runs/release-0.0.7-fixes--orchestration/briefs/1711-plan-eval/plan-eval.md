use harness

# PLAN-EVAL cycle 1 — #1112 / PR #1711 at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`

You are a **formal PLAN-EVAL evaluator**. You did not write this plan and you must not repair it.
Produce a verdict, not a fix. Fresh session, opposite family to the author: the generator is Codex
`gpt-5.6-sol` · high (thread `01a047f1-…`); you are native Claude Fable 5 · medium.

## SKILL

`netscript-harness` (evaluator protocol, `gates/plan-gate.md`), `netscript-doctrine` (**Archetype 2 —
integration**; public surface, layering, anti-patterns), `netscript-tools` (structured wrappers are the
only verdict source), `netscript-deno-toolchain` (`deno doc` before broad reads), `jsr-audit`,
`netscript-pr`, `rtk`.

## Identity

- Worktree: `/home/codex/repos/netscript-007-eval-1711` — **detached, yours alone**, already at the
  exact head. Do **not** enter the author's worktree `/home/codex/repos/netscript-007-leaf-prisma-mysql`.
- Immutable plan head: `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`
- Base: `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Issue **#1112**, draft PR **#1711**, run dir `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`

**Verify head identity yourself first**: local `HEAD` == `git ls-remote origin
fix/prisma-mysql-honest-example` == PR `headRefOid`, worktree clean. If they differ, stop and report —
do not evaluate a moving head.

## What this is

A **plan**, not an implementation. Nothing in the seven-path product envelope has been touched: the
diff from base is harness artifacts only. Evaluate whether the plan is sound, honest, and bounded —
not whether code works, because there is none.

## The seven-path product envelope

1. `docs/site/reference/prisma-adapter-mysql/index.md`
2. `packages/prisma-adapter-mysql/README.md`
3. `packages/prisma-adapter-mysql/src/adapter.ts`
4. `packages/prisma-adapter-mysql/src/mod.ts`
5. `packages/prisma-adapter-mysql/src/types.ts`
6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`

An eighth is a rescope.

## Claims to test independently — do not accept any on the record's word

1. **Source-only seam.** The plan authorizes exporting `toMysql2PoolOptions` from `src/adapter.ts` for
   direct source tests only. Verify the plan does **not** re-export it — or `PrismaMySqlAdapter`, or any
   translator — from `src/mod.ts` or the package-root export map, and adds **no runtime injection
   port**. Check the current export surface yourself (`deno doc`, the export map in
   `packages/prisma-adapter-mysql/deno.json`) so you know what "package root" actually means here.

2. **Legacy TLS disposition — the load-bearing one.** The coordinator ruled the **non-breaking** path:
   `tls.mode: 'verify_identity'` is **deprecated and documented/tested truthfully**, with **no behaviour
   flip and no new mode**. Confirm the plan does **not** set `ssl.verifyIdentity`, does not otherwise
   change runtime TLS semantics, and does not introduce a replacement mode.

   Then check the documented legacy behaviour against **source** (`src/adapter.ts` around `:738`), not
   against the plan's own description: without non-empty `caCerts`, `ssl` is left unset (plaintext, no
   TLS requested); with them, only joined `ssl.ca` is forwarded and mysql2 hostname identity
   verification is **not** enabled. If the plan's stated legacy behaviour is wrong in either direction,
   that is a finding — over-stating the defect is as bad as under-stating it.

   Judge whether characterization tests that **pin current behaviour** are the right instrument, and
   whether deferring any change to a separately scoped breaking change is adequately stated.

3. **`supervisor.md` is control-plane only.** It was added by a bounded allowlist amendment after the
   original brief omitted it. Verify it is not an eighth product path, does not widen the envelope, and
   that its content is truthful — including its Tier-A history, which records that an earlier plan
   revision proposed the TLS behaviour flip and carried a false "coordinator-authorized" claim.

4. **Exact identity.** local == remote == PR, clean worktree, no `deno.lock` in branch history.

5. **NOT_RUN / runtime boundaries.** The plan should require no runtime, Aspire, Docker, browser,
   `scaffold.runtime`, or `e2e:cli`. Confirm it says so and that its gate set is achievable statically.
   Anything it defers should be named, not silently omitted.

6. **Plan-gate.** Apply `gates/plan-gate.md`. Judge the falsehood census (it claims eight Deno-native
   locations), the option-surface audit against acceptance row 4, whether the example is planned to be
   compile-checked **as the actual file** rather than as a transcribed snippet, and whether all seven
   paths are planned to tell one coherent story.

## Known context — so you attribute correctly

- The example `examples/basic-usage.ts` currently claims a Deno driver at `:4`, comments out the entire
  `PrismaClient` path at `:53-62`, and falls back to `queryRaw` at `:68`.
- `onConnectionError` **is** published (`src/types.ts:44`), while the site page `:23` currently claims it
  is unsupported — a false claim this plan is meant to correct.
- A transient `deno.lock` probe was reverted byte-identical and never committed; it is recorded in
  `drift.md`.

## Verdict

Write `plan-eval.md` into `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/` **in your own worktree**,
with a clear **PASS** / **FAIL** / **PASS-WITH-ADVISORIES**, each finding tied to executed evidence
(command + result) and a severity. Post it as a PR comment on **#1711** bound to
`069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`, and commit your artifact **without** touching any product,
test, or docs path.

Findings must be checkable. **No praise adjectives** — a verdict is a list of things that are or are not
true, with the command that shows it. If the plan over-claims or under-claims anything, say so.

Do not implement, merge, flip readiness, change labels, tick checkboxes, take a runtime lease, or
repair the plan. Report your exact head and verdict, then stop.

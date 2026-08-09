# Plan: #1379

## Harness selection

- Archetype: 4 (the affected published package); the implementation surface is CI/tooling only.
- Doctrine verdict: **Keep** for `@netscript/fresh-ui`.
- Overlay: none.
- In-scope axioms/gates: A14, F-6, F-10, F-19; AP-20 remains unchanged.
- `PLAN-EVAL: N/A` — the live issue supplies the two lock choices, acceptance contract, negative
  controls, and boundaries; Deno 2.9.5 empirically selects frozen-private-lock without a remaining
  architectural fork.

## Locked decisions

1. Keep and refresh `packages/fresh-ui/deno.lock`; every later package check uses native
   `--frozen`.
2. Preserve the two explicit published SDK pins; this slice does not change consumer dependency
   semantics.
3. Use the repo's scoped check/lint wrappers as both local and CI verdict sources.
4. Add one path-filtered Fresh UI quality workflow that runs the frozen check, lint, frozen-lock
   regression, and a final empty-worktree assertion.
5. Remove `fresh-ui` from both root wrapper exclusions; retain the unrelated CLI lint exclusion.
6. The gate fails closed: stale lock, type error, lint violation, or any worktree mutation is a
   non-zero job.

## Commit slices

| Slice | Scope | Files | Proving gate |
| --- | --- | --- | --- |
| S0 | Research, lock decision, plan/design, draft PR | run artifacts | clean branch + live issue evidence |
| S1 | Frozen package gate and CI coverage | `deno.json`, package `deno.json`/lock, workflow, focused regression test, run artifacts | pre-fix/mutation REDs; new job command; root and scoped gates |

## Validation order

1. Refresh the private lock once and prove the frozen package check then exits 0 without mutation.
2. Add a real stale-lock regression: native frozen check exits non-zero, names the lock drift, and
   leaves fixture lock bytes unchanged.
3. Deliberately break `registry.ts` in scratch; new gate exits non-zero with the type diagnostic;
   restore explicitly.
4. Deliberately introduce a lint violation; new gate exits non-zero naming the lint rule; restore
   explicitly.
5. Run the exact new CI commands from a committed clean head and require empty
   `git status --porcelain`.
6. Run scoped check/lint/fmt, root `check`/`lint`/`fmt:check`, `quality:scan`, and `arch:check` with
   raw exits.

## Risks

- A refreshed private lock can absorb unrelated workspace graph drift. Mitigation: report the lock
  diff and keep it as the one-time baseline required for native frozen operation.
- Root wrapper inclusion can reveal an existing error. Mitigation: treat it as a finding; do not
  reintroduce exclusions or allowances.
- A workflow-only clean check can pass locally on a dirty developer tree only after commit.
  Mitigation: run the exact CI sequence from the committed head before handoff.

## Debt and deferred scope

No new doctrine debt is planned. Joining the root lock and changing published SDK resolution are
deferred because frozen-private-lock closes this issue without changing consumer semantics.

# Context pack — #1246

## Read first

1. `supervisor.md`
2. `research.md`
3. `plan.md`
4. issue https://github.com/rickylabs/netscript/issues/1246
5. upstream https://github.com/denoland/deno/issues/35804

## Locked contract

- Upstream classification; mitigation ships in 0.0.5.
- Generated verifier must fail closed and precede Vite.
- Exact generated `engines.deno` pin: 2.9.0.
- Use `Refs #1246`; native Windows start/CI remain unclaimed 0.0.6 work.
- No local PLAN-EVAL per D6.
- Do not stage the unrelated dirty `deno.lock`.

## Implementation state

- Draft PR: https://github.com/rickylabs/netscript/pull/1264
- Implementation commit: `671f0ad41`
- Generated verifier is wired into root and Fresh dev tasks.
- Strict executable detector fixtures pass for incomplete and complete trees.
- Full CLI unit suite: 595 passed / 484 steps / 0 failed.
- First `scaffold.runtime` run found the `.scripts-warned-*` cache-marker false positive at the
  actual Fresh boundary; the narrowed marker exclusion is regression-tested.
- Corrected `scaffold.runtime`: 71 passed / 0 failed, including Fresh dev, Aspire, app serving, and
  cleanup. Leak check found no resources owned by this worktree.
- Native Windows proof remains unavailable and is intentionally unclaimed.
## Focused code

- `packages/cli/src/kernel/application/scaffold/plan-init.ts`
- `packages/cli/src/kernel/templates/workspace/deno-json.ts`
- `packages/cli/src/kernel/templates/workspace/generate-readme.ts`
- `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts`
- `packages/cli/src/kernel/adapters/scaffold/fresh-adapter.ts`
- colocated tests

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
## Focused code

- `packages/cli/src/kernel/application/scaffold/plan-init.ts`
- `packages/cli/src/kernel/templates/workspace/deno-json.ts`
- `packages/cli/src/kernel/templates/workspace/generate-readme.ts`
- `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts`
- `packages/cli/src/kernel/adapters/scaffold/fresh-adapter.ts`
- colocated tests

# Context Pack — CLI `dx`-runnable slice

Run-id: `cli-dx-runnable` · Branch: `feat/cli-dx-runnable` · PR: #120

## Status

- PLAN-EVAL passed 14/14 in `.llm/tmp/run/cli-dx-runnable/plan-eval.md`.
- S1 is complete and pushed as `b75c67f9`.
- S2 is complete as `f47b6a30`.
- Empirical resolution selected Option A: make the `.` default export runnable with an `import.meta.main` guard.
- Local Deno 2.8.3 supports `deno x`, not `deno dx`; S2 must use the verified `deno x jsr:@netscript/cli ...` form.
- Residual exact grep for `jsr:@netscript/cli/bin/netscript.ts` is zero after the S2 sweep.
- IMPL-EVAL remains to be dispatched with OpenHands qwen3.7-max.

## Scope

- In scope: `packages/cli/mod.ts`, focused import-purity test, package export/publish gates, user-facing docs sweep for the old `jsr:@netscript/cli/bin/netscript.ts` command.
- Out of scope: CLI behavior changes, new subcommands, publish workflow/order, maintainer local-source commands, and the post-publish `@netscript/cli` end-to-end smoke.
